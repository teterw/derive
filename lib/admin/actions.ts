"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { routing, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { inviteCodes } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { generateInviteCode } from "@/lib/auth/invite";

export type AdminState = { error?: string; createdCode?: string } | null;

function readLocale(formData: FormData): Locale {
  const value = String(formData.get("locale") ?? "");
  return (routing.locales as readonly string[]).includes(value)
    ? (value as Locale)
    : routing.defaultLocale;
}

/** Never trusts a user id from the client - always re-reads the session. */
async function requireAdminUser() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") throw new Error("forbidden");
  return user;
}

export async function createInviteCodeAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const admin = await requireAdminUser();
  const locale = readLocale(formData);

  const note = String(formData.get("note") ?? "").trim() || null;
  const maxUses = clampInt(formData.get("maxUses"), 1, 100, 1);
  const expiresInDays = clampInt(formData.get("expiresInDays"), 0, 365, 0);
  const expiresAt =
    expiresInDays > 0
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

  // 12 chars out of 31 symbols: a collision is vanishingly unlikely, but a
  // unique-constraint failure would be a confusing error for the admin.
  let code = generateInviteCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const [clash] = await db
      .select({ id: inviteCodes.id })
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code))
      .limit(1);
    if (!clash) break;
    code = generateInviteCode();
  }

  await db.insert(inviteCodes).values({
    code,
    createdBy: admin.id,
    note,
    maxUses,
    expiresAt,
  });

  revalidatePath(`/${locale}/admin`);
  return { createdCode: code };
}

export async function disableInviteCodeAction(
  formData: FormData,
): Promise<void> {
  await requireAdminUser();
  const locale = readLocale(formData);
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db
    .update(inviteCodes)
    .set({ disabled: true })
    .where(eq(inviteCodes.id, id));

  revalidatePath(`/${locale}/admin`);
}

function clampInt(
  raw: FormDataEntryValue | null,
  min: number,
  max: number,
  fallback: number,
): number {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
