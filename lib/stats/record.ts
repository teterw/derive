import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  attempts,
  dailyStats,
  skillMastery,
  users,
  type NewAttempt,
} from "@/lib/db/schema";
import type { Difficulty, Question } from "@/content/types";
import { bangkokDay, daysBetween } from "./day";
import {
  EMA_ALPHA,
  MAX_PLAUSIBLE_MS,
  MIN_PLAUSIBLE_MS,
  STREAK_MIN_ATTEMPTS,
  masteryLevel,
  xpFor,
  type XpAward,
} from "./constants";

export type AttemptRecord = {
  userId: string;
  mode: NewAttempt["mode"];
  runId?: string | null;
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  timeMs: number;
  hintsUsed: number;
  stepsRevealed: boolean;
};

/**
 * Writes one attempt and everything that hangs off it.
 *
 * The day is computed here, once, in Asia/Bangkok, and stored on the row;
 * `daily_stats` and `skill_mastery` are rolled forward in the same call so the
 * statistics pages are pure reads (PROMPT.md §8).
 */
export async function recordAttempt(
  record: AttemptRecord,
): Promise<{ award: XpAward }> {
  const day = bangkokDay();
  const timeMs = clampTime(record.timeMs);
  const difficulty = record.question.difficulty;

  /*
   * The streak is advanced here, before the award is worked out, so the answer
   * that reaches a multiple of three is the one that is paid for it. It is read
   * from the row rather than taken from the runner's tally: XP is decided on
   * the server, and a number that arrived from a browser would let anyone claim
   * any bonus they liked.
   */
  const answerStreak = await advanceAnswerStreak(
    record.userId,
    record.isCorrect,
  );

  const award = xpFor(difficulty, record.isCorrect, {
    streak: answerStreak,
    hintsUsed: record.hintsUsed,
    stepsRevealed: record.stepsRevealed,
  });
  const xp = award.total;

  await db.insert(attempts).values({
    userId: record.userId,
    mode: record.mode,
    runId: record.runId ?? null,
    topicId: record.question.topicId,
    skillId: record.question.skillId,
    generatorId: record.question.generatorId,
    seed: seedOf(record.question.id),
    difficulty,
    questionSnapshot: snapshot(record.question),
    userAnswer: record.userAnswer.slice(0, 500),
    isCorrect: record.isCorrect,
    timeMs,
    hintsUsed: record.hintsUsed,
    stepsRevealed: record.stepsRevealed,
    day,
  });

  const [daily] = await db
    .insert(dailyStats)
    .values({
      userId: record.userId,
      day,
      attempts: 1,
      correct: record.isCorrect ? 1 : 0,
      timeMs,
      xp,
    })
    .onConflictDoUpdate({
      target: [dailyStats.userId, dailyStats.day],
      set: {
        attempts: sql`${dailyStats.attempts} + 1`,
        correct: sql`${dailyStats.correct} + ${record.isCorrect ? 1 : 0}`,
        timeMs: sql`${dailyStats.timeMs} + ${timeMs}`,
        xp: sql`${dailyStats.xp} + ${xp}`,
      },
    })
    .returning({ attempts: dailyStats.attempts });

  await updateMastery(record.userId, record.question.skillId, record.isCorrect);

  if ((daily?.attempts ?? 0) === STREAK_MIN_ATTEMPTS) {
    // The day has just crossed the threshold, so the streak moves exactly once.
    await extendStreak(record.userId, day);
  }

  /*
   * Handed back rather than recomputed by the caller. The numbers the learner
   * is shown have to be the ones that were written, and two calls to `xpFor`
   * is the sort of thing that agrees until someone changes the curve.
   */
  return { award };
}

/**
 * Moves the consecutive-correct counter and returns where it now stands.
 *
 * One statement: reading then writing would let two answers submitted close
 * together both read the same value and both write the same streak. `returning`
 * means the value paid out is the value stored, which matters because this is
 * the only part of an award that depends on anything but the current answer.
 */
async function advanceAnswerStreak(
  userId: string,
  correct: boolean,
): Promise<number> {
  const [row] = await db
    .update(users)
    .set({
      answerStreak: correct ? sql`${users.answerStreak} + 1` : 0,
      lastSeenAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({ streak: users.answerStreak });

  return row?.streak ?? 0;
}

function clampTime(value: number): number {
  if (!Number.isFinite(value) || value < MIN_PLAUSIBLE_MS) {
    return MIN_PLAUSIBLE_MS;
  }
  return Math.min(Math.round(value), MAX_PLAUSIBLE_MS);
}

function seedOf(questionId: string): number {
  const parts = questionId.split(":");
  const seed = Number(parts[parts.length - 2]);
  return Number.isFinite(seed) ? seed : 0;
}

/**
 * Enough to replay the question exactly and to show it in a review list
 * without regenerating it. `(generatorId, seed, difficulty)` would do, but the
 * snapshot survives a generator being deprecated.
 */
function snapshot(question: Question) {
  return {
    stem: question.stem,
    prompt: question.prompt,
    answer: question.answer,
    steps: question.steps,
    provenance: question.provenance,
    ...(question.choices ? { choices: question.choices } : {}),
  };
}

async function updateMastery(
  userId: string,
  skillId: string,
  isCorrect: boolean,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(skillMastery)
    .where(
      and(eq(skillMastery.userId, userId), eq(skillMastery.skillId, skillId)),
    )
    .limit(1);

  const outcome = isCorrect ? 1 : 0;

  if (!existing) {
    await db.insert(skillMastery).values({
      userId,
      skillId,
      attempts: 1,
      correct: outcome,
      emaAccuracy: outcome,
      level: masteryLevel(1, outcome),
      updatedAt: new Date(),
    });
    return;
  }

  const attemptCount = existing.attempts + 1;
  const ema = existing.emaAccuracy * (1 - EMA_ALPHA) + outcome * EMA_ALPHA;

  await db
    .update(skillMastery)
    .set({
      attempts: attemptCount,
      correct: existing.correct + outcome,
      emaAccuracy: ema,
      level: masteryLevel(attemptCount, ema),
      updatedAt: new Date(),
    })
    .where(
      and(eq(skillMastery.userId, userId), eq(skillMastery.skillId, skillId)),
    );
}

async function extendStreak(userId: string, day: string): Promise<void> {
  const [user] = await db
    .select({
      currentStreak: users.currentStreak,
      longestStreak: users.longestStreak,
      lastActiveDay: users.lastActiveDay,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) return;

  const gap = user.lastActiveDay ? daysBetween(user.lastActiveDay, day) : null;
  const current =
    gap === 1 ? user.currentStreak + 1 : gap === 0 ? user.currentStreak : 1;

  await db
    .update(users)
    .set({
      currentStreak: current,
      longestStreak: Math.max(current, user.longestStreak),
      lastActiveDay: day,
      lastSeenAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/** Difficulty coming off a form or a URL, or null if it is not one of ours. */
export function parseDifficulty(value: unknown): Difficulty | null {
  const n = Number(value);
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : null;
}
