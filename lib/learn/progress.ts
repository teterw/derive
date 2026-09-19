import { and, eq, inArray, isNotNull } from "drizzle-orm";
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

  const [existing] = await db
    .select({
      passedAt: lessonProgress.passedAt,
      bestScore: lessonProgress.bestScore,
      attempts: lessonProgress.attempts,
    })
    .from(lessonProgress)
    .where(
      and(
        eq(lessonProgress.userId, userId),
        eq(lessonProgress.skillId, skillId),
      ),
    )
    .limit(1);

  const alreadyPassed = Boolean(existing?.passedAt);

  await db
    .insert(lessonProgress)
    .values({
      userId,
      skillId,
      passedAt: passesNow ? new Date() : null,
      bestScore: ratio,
      attempts: 1,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.skillId],
      set: {
        // Keep the original pass date; only set it if this is the first pass.
        passedAt:
          alreadyPassed || !passesNow
            ? (existing?.passedAt ?? null)
            : new Date(),
        bestScore: Math.max(existing?.bestScore ?? 0, ratio),
        attempts: (existing?.attempts ?? 0) + 1,
        updatedAt: new Date(),
      },
    });

  return {
    passed: alreadyPassed || passesNow,
    newlyPassed: !alreadyPassed && passesNow,
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
