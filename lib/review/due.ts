import { and, asc, eq, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { skillMastery, skillReviews } from "@/lib/db/schema";
import { getSkill, hasSkill } from "@/content/topics";
import { difficultiesForSkill, pickGenerator } from "@/content/generators";
import type { Difficulty, SkillId } from "@/content/types";
import type { QuestionRef } from "@/lib/practice/session";
import { bangkokDay } from "@/lib/stats/day";
import {
  afterReview,
  isLeech,
  LADDER,
  spreadDueDays,
  startingInterval,
  type Schedule,
} from "./schedule";

/**
 * The due queue: which skills need revisiting today, and a fresh question from
 * each.
 *
 * This is the half of spaced repetition that touches the database. The
 * arithmetic lives in `schedule.ts` where it can be tested without one.
 */

const MAX_SEED = 2 ** 31 - 1;

/** A day string `n` days after `from`, in the app's timezone. */
function addDays(from: string, days: number): string {
  const date = new Date(`${from}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export type DueSkill = {
  skillId: SkillId;
  intervalDays: number;
  lapses: number;
  leech: boolean;
};

/** Skills due on or before today. Leeches are excluded - they belong in Learn. */
export async function getDueSkills(
  userId: string,
  day = bangkokDay(),
): Promise<DueSkill[]> {
  const rows = await db
    .select({
      skillId: skillReviews.skillId,
      intervalDays: skillReviews.intervalDays,
      lapses: skillReviews.lapses,
      consecutiveCorrect: skillReviews.consecutiveCorrect,
    })
    .from(skillReviews)
    .where(and(eq(skillReviews.userId, userId), lte(skillReviews.dueOn, day)))
    .orderBy(asc(skillReviews.dueOn));

  return rows
    .filter((row) => hasSkill(row.skillId))
    .map((row) => ({
      skillId: row.skillId,
      intervalDays: row.intervalDays,
      lapses: row.lapses,
      leech: isLeech(row),
    }))
    .filter((row) => !row.leech);
}

/** Just the number, for the dashboard. */
export async function getDueCount(
  userId: string,
  day = bangkokDay(),
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(skillReviews)
    .where(
      and(
        eq(skillReviews.userId, userId),
        lte(skillReviews.dueOn, day),
        sql`${skillReviews.lapses} < 4`,
      ),
    );
  return Number(row?.count ?? 0);
}

/** Skills the learner keeps losing. Surfaced in Learn with the lesson. */
export async function getLeeches(userId: string): Promise<SkillId[]> {
  const rows = await db
    .select({ skillId: skillReviews.skillId })
    .from(skillReviews)
    .where(
      and(eq(skillReviews.userId, userId), sql`${skillReviews.lapses} >= 4`),
    );
  return rows.map((row) => row.skillId).filter(hasSkill);
}

/**
 * A fresh question for each due skill.
 *
 * The seed is random rather than stored, which is the whole point: the learner
 * meets the skill again, not the question. Difficulty tracks how well the
 * skill is holding up - a skill that has lapsed comes back easier than one
 * riding a long interval.
 */
export function questionsForDue(due: DueSkill[]): QuestionRef[] {
  const refs: QuestionRef[] = [];

  for (const skill of due) {
    const available = difficultiesForSkill(skill.skillId);
    if (available.length === 0) continue;

    const wanted = difficultyFor(skill);
    const difficulty =
      available.find((value) => value === wanted) ??
      available[Math.min(available.length - 1, 1)]!;

    /*
     * A fresh seed each time is the point of scheduling the skill rather than
     * the question: the learner meets the skill again, not an answer they may
     * simply remember. The seed also picks the generator, so a skill with
     * several shapes does not always come back as the same one.
     */
    const seed = 1 + Math.floor(Math.random() * MAX_SEED);
    const generator = pickGenerator(skill.skillId, difficulty, seed);

    refs.push({ generatorId: generator.id, seed, difficulty });
  }

  return refs;
}

/**
 * How hard to come back at. A skill that has been forgotten is asked more
 * gently than one being held at ninety days - the point of the review is to
 * rebuild it, not to confirm it is gone.
 */
function difficultyFor(skill: DueSkill): Difficulty {
  if (skill.lapses > 0 || skill.intervalDays <= LADDER[0]!) return 1;
  if (skill.intervalDays <= LADDER[2]!) return 2;
  if (skill.intervalDays <= LADDER[3]!) return 3;
  return 4;
}

/**
 * Records a review and books the next one.
 *
 * Upserts, so a skill reviewed through ordinary practice rather than through
 * the queue still advances - answering it correctly counts however you got
 * there.
 */
export async function recordReview(
  userId: string,
  skillId: SkillId,
  correct: boolean,
  day = bangkokDay(),
): Promise<void> {
  if (!hasSkill(skillId)) return;

  const [existing] = await db
    .select({
      intervalDays: skillReviews.intervalDays,
      consecutiveCorrect: skillReviews.consecutiveCorrect,
      lapses: skillReviews.lapses,
    })
    .from(skillReviews)
    .where(
      and(eq(skillReviews.userId, userId), eq(skillReviews.skillId, skillId)),
    )
    .limit(1);

  const current: Schedule = existing ?? {
    intervalDays: LADDER[0]!,
    consecutiveCorrect: 0,
    lapses: 0,
  };
  const next = afterReview(current, correct);

  await db
    .insert(skillReviews)
    .values({
      userId,
      skillId,
      intervalDays: next.intervalDays,
      dueOn: addDays(day, next.intervalDays),
      consecutiveCorrect: next.consecutiveCorrect,
      lapses: next.lapses,
      lastReviewedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [skillReviews.userId, skillReviews.skillId],
      set: {
        intervalDays: next.intervalDays,
        dueOn: addDays(day, next.intervalDays),
        consecutiveCorrect: next.consecutiveCorrect,
        lapses: next.lapses,
        lastReviewedAt: new Date(),
      },
    });
}

/**
 * Seeds schedules from the history a learner already has.
 *
 * Nothing was lost by adding this late - `skill_mastery` has been keeping a
 * rolling accuracy since the beginning, so a skill someone is already good at
 * starts a week out rather than tomorrow. Due dates are spread so nobody signs
 * in to a wall of forty.
 *
 * Idempotent: skills that already have a schedule are left alone, so running
 * it twice does not reset anyone's progress.
 */
export async function backfillSchedules(
  userId: string,
  day = bangkokDay(),
): Promise<{ created: number; skipped: number }> {
  const [mastery, existing] = await Promise.all([
    db
      .select({
        skillId: skillMastery.skillId,
        attempts: skillMastery.attempts,
        emaAccuracy: skillMastery.emaAccuracy,
      })
      .from(skillMastery)
      .where(eq(skillMastery.userId, userId))
      .orderBy(asc(skillMastery.emaAccuracy)),
    db
      .select({ skillId: skillReviews.skillId })
      .from(skillReviews)
      .where(eq(skillReviews.userId, userId)),
  ]);

  const already = new Set(existing.map((row) => row.skillId));
  const todo = mastery.filter(
    (row) => hasSkill(row.skillId) && !already.has(row.skillId),
  );
  if (todo.length === 0) {
    return { created: 0, skipped: already.size };
  }

  const offsets = spreadDueDays(todo.length);

  await db.insert(skillReviews).values(
    todo.map((row, index) => {
      const interval = startingInterval(row.emaAccuracy, row.attempts);
      return {
        userId,
        skillId: row.skillId,
        intervalDays: interval,
        /*
         * The spread offset is added on top of the interval so a strong skill
         * still lands later than a weak one - the spread breaks up the wall,
         * it does not flatten the ordering.
         */
        dueOn: addDays(day, interval + offsets[index]!),
        consecutiveCorrect: 0,
        lapses: 0,
      };
    }),
  );

  return { created: todo.length, skipped: already.size };
}

/** Kept next to the queue it feeds: the skill a due item is drilling. */
export { getSkill };
