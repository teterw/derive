"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { routing, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { inviteCodes } from "@/lib/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { generateInviteCode } from "@/lib/auth/invite";
import { resetDailyRun } from "@/lib/daily/challenge";

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

/**
 * Throws away the caller's own daily run for today so it can be taken again.
 *
 * A development affordance, and deliberately a narrow one. The daily is meant
 * to be once a day - that is the whole point of it - but while the daily is
 * being *built* you need to walk through it more than once an evening, and the
 * alternative is editing rows in Neon by hand.
 *
 * Three limits keep it from becoming a way to farm the statistics:
 *   - admin only, re-read from the session rather than trusted from the form;
 *   - it resets the caller's own run, never another account's;
 *   - it deletes the attempts as well, so the streak and the daily stats are
 *     rolled back with it rather than counting the day twice.
 */
export async function resetMyDailyAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const locale = readLocale(formData);

  await resetDailyRun(admin.id);

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/daily`);
  revalidatePath(`/${locale}/stats`);
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
