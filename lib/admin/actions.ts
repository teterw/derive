"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { routing, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { inviteCodes, lessonProgress, users } from "@/lib/db/schema";
import { skills } from "@/content/topics";
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

/** Everything an admin tool touching the caller's own rows wants revalidated. */
function revalidateSelf(locale: Locale): void {
  for (const path of ["admin", "daily", "stats", "learn"]) {
    revalidatePath(`/${locale}/${path}`);
  }
}

/**
 * Unticks every lesson for the caller.
 *
 * The checklist and the daily's "only what you have been taught" rule are both
 * built on `lesson_progress`, and both are hard to work on from the far side of
 * having passed everything. The rows go entirely rather than having `passedAt`
 * cleared, so `attempts` on them starts from zero too and a later pass reads as
 * a first pass.
 *
 * The attempts made while sitting those tests are left alone. They are real
 * answers to real questions and belong in the statistics; this unticks a
 * checklist, it does not rewrite history.
 */
export async function resetMyLessonsAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const locale = readLocale(formData);

  await db.delete(lessonProgress).where(eq(lessonProgress.userId, admin.id));

  revalidateSelf(locale);
}

/**
 * Marks every lesson passed for the caller.
 *
 * The other half of the same problem: the daily draws from passed lessons, so
 * checking what it does with a full curriculum otherwise means sitting fourteen
 * ten-question tests. `bestScore` is left at whatever was really earned - this
 * opens the gate, it does not invent a score.
 */
export async function passAllLessonsAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const locale = readLocale(formData);
  const now = new Date();

  await db
    .insert(lessonProgress)
    .values(
      skills.map((skill) => ({
        userId: admin.id,
        skillId: skill.id,
        passedAt: now,
        bestScore: 1,
        attempts: 0,
        updatedAt: now,
      })),
    )
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.skillId],
      // Only the gate moves. A real best score is not overwritten by this.
      set: { passedAt: now, updatedAt: now },
    });

  revalidateSelf(locale);
}

/**
 * Puts the caller's consecutive-correct counter back to zero.
 *
 * The streak part of an XP award is the one piece that depends on history
 * rather than on the answer in front of you, which makes it the one piece you
 * cannot check by answering a question.
 */
export async function resetMyStreakAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const locale = readLocale(formData);

  await db.update(users).set({ answerStreak: 0 }).where(eq(users.id, admin.id));

  revalidateSelf(locale);
}

/**
 * Promotes or demotes another account.
 *
 * On an invite-only site this is the one piece of user management that is
 * genuinely needed: somebody has to be able to hand over, or to take it back
 * from an account that should not have it.
 *
 * You cannot change your own role. Not because demoting yourself is
 * catastrophic - another admin could put it back - but because on a site with
 * one admin it is unrecoverable through the interface, and the only way out is
 * the database.
 */
export async function setUserRoleAction(formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const locale = readLocale(formData);

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (role !== "admin" && role !== "user") return;
  if (userId === "" || userId === admin.id) return;

  await db.update(users).set({ role }).where(eq(users.id, userId));

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
