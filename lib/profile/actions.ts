"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { routing, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { AVATAR_SEEDS } from "@/components/profile/avatar";
import { BIO_MAX, DISPLAY_NAME_MAX } from "./limits";
import { prepareAvatar } from "./avatar-upload";
import { parseCrop } from "./crop";

export type ProfileState = { error?: string; saved?: boolean } | null;

function readLocale(formData: FormData): Locale {
  const value = String(formData.get("locale") ?? "");
  return (routing.locales as readonly string[]).includes(value)
    ? (value as Locale)
    : routing.defaultLocale;
}

/**
 * Saves the signed-in learner's own profile.
 *
 * The user id is read from the session every time and never taken from the
 * form - the form says what to change, not whose record to change it on.
 */
export async function saveProfileAction(
  _previous: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getSessionUser();
  if (!user) return { error: "notSignedIn" };

  const locale = readLocale(formData);

  const rawBio = String(formData.get("bio") ?? "").trim();
  if (rawBio.length > BIO_MAX) return { error: "bioTooLong" };

  const rawSlot = Number.parseInt(String(formData.get("avatarSlot") ?? ""), 10);
  const avatarSlot = Number.isFinite(rawSlot)
    ? ((rawSlot % AVATAR_SEEDS) + AVATAR_SEEDS) % AVATAR_SEEDS
    : 0;

  const displayName = String(formData.get("displayName") ?? "").trim();
  if (displayName.length === 0) return { error: "displayNameRequired" };
  if (displayName.length > DISPLAY_NAME_MAX) return { error: "displayNameTooLong" };

  /*
   * The picture. Three cases: a new file, an explicit removal, or neither -
   * and "neither" must leave the existing one alone, or saving a bio would
   * silently wipe someone's face.
   */
  const picture = formData.get("avatar");
  const removing = formData.get("removeAvatar") === "on";

  let avatarFields: {
    avatarImage?: Buffer | null;
    avatarType?: string | null;
    avatarUpdatedAt?: Date | null;
  } = {};

  if (removing) {
    avatarFields = {
      avatarImage: null,
      avatarType: null,
      avatarUpdatedAt: null,
    };
  } else if (picture instanceof File && picture.size > 0) {
    /*
     * The crop comes from the editor and is checked before it reaches sharp:
     * a NaN or a negative zoom would otherwise fail inside `extract` with an
     * error about the region rather than about the input, taking the whole
     * upload with it. Absent or unparseable means "decide for us".
     */
    const prepared = await prepareAvatar(
      Buffer.from(await picture.arrayBuffer()),
      parseCrop(formData.get("avatarCrop")),
    );
    if (!prepared.ok) return { error: `avatar.${prepared.error}` };
    avatarFields = {
      avatarImage: prepared.bytes,
      avatarType: prepared.type,
      avatarUpdatedAt: new Date(),
    };
  }

  await db
    .update(users)
    .set({
      displayName,
      bio: rawBio === "" ? null : rawBio,
      avatarSlot,
      hideFromLeaderboard: formData.get("hideFromLeaderboard") === "on",
      ...avatarFields,
    })
    .where(eq(users.id, user.id));

  revalidatePath(`/${locale}/settings`);
  revalidatePath(`/${locale}/u/${user.username}`);
  revalidatePath(`/${locale}/people`);
  return { saved: true };
}
