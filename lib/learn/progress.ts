import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { lessonProgress } from "@/lib/db/schema";
import { skills } from "@/content/topics";
import type { SkillId } from "@/content/types";

/**
 * Which lessons a learner has passed.
 *
 * A pass is an event, not an average. You sat this lesson's test and you got
 * enough of it right, and that stays true afterwards - `skill_mastery` is the
 * thing that drifts with recent accuracy, and a checklist that unticked itself
 * overnight would be no use as a checklist. The daily challenge draws on this
 * for the same reason: "what have I been taught" should not change while you
 * sleep.
 */

/** Questions in a lesson's test. Long enough to mean something, short enough to sit. */
export const LESSON_TEST_LENGTH = 10;

/**
 * The share of a lesson's test you need to pass it.
 *
 * Eight out of ten. High enough that passing says you can do it, low enough
 * that one slip or one misread does not send you round again - which is the
 * failure mode that makes people stop taking the test at all.
 */
export const LESSON_PASS_RATIO = 0.8;

/** How many correct answers pass a test of this length. */
export function passMark(length: number = LESSON_TEST_LENGTH): number {
  return Math.ceil(length * LESSON_PASS_RATIO);
}

export type LessonResult = {
  passed: boolean;
  /** True only when this attempt is what passed it, for the "you just did it" copy. */
  newlyPassed: boolean;
  score: number;
  needed: number;
};

/**
 * Records a sat test and says what it did.
 *
 * `passedAt` is set once and never cleared: failing a retake of something you
 * have already passed does not take it away from you. `bestScore` still moves,
 * so a retake has something to improve.
 */
export async function recordLessonTest(
  userId: string,
  skillId: SkillId,
  correct: number,
  asked: number,
): Promise<LessonResult> {
  const length = Math.max(1, asked);
  const ratio = correct / length;
  const passesNow = correct >= passMark(length);
  const now = new Date();

  /*
   * One statement, where this used to read the row and then write it.
   *
   * The round trip is the point. This runs while the learner is looking at a
   * screen that cannot say whether they passed yet, and the database is in
   * Singapore - so a second trip is a second helping of latency in the one
   * place it is most visible. Doing the keeping-the-best part in SQL rather
   * than in JavaScript costs nothing and removes it.
   *
   * It also closes a lost update. Read-then-write meant two tests filed at
   * once both read the same `attempts` and both wrote it plus one, so one of
   * them vanished. `attempts + 1` in the statement cannot do that.
   *
   * `passedAt` is only in the SET when this attempt passed; otherwise the
   * column is left out of the update entirely, which is what "set once and
   * never cleared" means. `coalesce` then keeps the original date when there
   * already is one.
   */
  const [row] = await db
    .insert(lessonProgress)
    .values({
      userId,
      skillId,
      passedAt: passesNow ? now : null,
      bestScore: ratio,
      attempts: 1,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.skillId],
      set: {
        bestScore: sql`greatest(${lessonProgress.bestScore}, ${ratio})`,
        attempts: sql`${lessonProgress.attempts} + 1`,
        updatedAt: now,
        ...(passesNow
          ? { passedAt: sql`coalesce(${lessonProgress.passedAt}, ${now})` }
          : {}),
      },
    })
    .returning({ passedAt: lessonProgress.passedAt });

  /*
   * `newlyPassed` without a second read: the returned date is the one supplied
   * above exactly when there was no earlier pass to keep, because `coalesce`
   * would have preferred the older one. Any other value means it was already
   * passed before this attempt.
   */
  const passedAt = row?.passedAt ?? null;
  const newlyPassed = passesNow && passedAt?.getTime() === now.getTime();

  return {
    passed: passedAt !== null,
    newlyPassed,
    score: correct,
    needed: passMark(length),
  };
}

export type LessonState = {
  passed: boolean;
  bestScore: number;
  attempts: number;
};

/** Every lesson's state for one learner, keyed by skill id. */
export async function getLessonStates(
  userId: string,
): Promise<Map<string, LessonState>> {
  const rows = await db
    .select({
      skillId: lessonProgress.skillId,
      passedAt: lessonProgress.passedAt,
      bestScore: lessonProgress.bestScore,
      attempts: lessonProgress.attempts,
    })
    .from(lessonProgress)
    .where(eq(lessonProgress.userId, userId));

  return new Map(
    rows.map((row) => [
      row.skillId,
      {
        passed: Boolean(row.passedAt),
        bestScore: row.bestScore,
        attempts: row.attempts,
      },
    ]),
  );
}

/**
 * The skills a learner has passed, for anything that should only ask about
 * what they have actually been taught.
 *
 * Filtered against the content: a skill that has been retired from the
 * curriculum should not keep appearing in someone's daily challenge because
 * there is a row for it.
 */
export async function getPassedSkillIds(userId: string): Promise<SkillId[]> {
  const known = new Set(skills.map((skill) => skill.id));
  const rows = await db
    .select({ skillId: lessonProgress.skillId })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        isNotNull(lessonProgress.passedAt),
      ),
    );

  return rows.map((row) => row.skillId).filter((id) => known.has(id));
}

/** Whether these particular lessons are passed, in one query. */
export async function arePassed(
  userId: string,
  skillIds: SkillId[],
): Promise<Set<string>> {
  if (skillIds.length === 0) return new Set();
  const rows = await db
    .select({ skillId: lessonProgress.skillId })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        isNotNull(lessonProgress.passedAt),
        inArray(lessonProgress.skillId, skillIds),
      ),
    );
  return new Set(rows.map((row) => row.skillId));
}
