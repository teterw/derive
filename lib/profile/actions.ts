"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { routing, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { AVATAR_SEEDS } from "@/components/profile/avatar";
import { BIO_MAX, DISPLAY_NAME_MAX } from "./limits";

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

  await db
    .update(users)
    .set({
      displayName,
      bio: rawBio === "" ? null : rawBio,
      avatarSlot,
      hideFromLeaderboard: formData.get("hideFromLeaderboard") === "on",
    })
    .where(eq(users.id, user.id));

  revalidatePath(`/${locale}/settings`);
  revalidatePath(`/${locale}/u/${user.username}`);
  revalidatePath(`/${locale}/people`);
  return { saved: true };
}
