import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { createRng, seedFromString } from "@/content/rng";
import {
  difficultiesForSkill,
  generatorsForSkillAt,
} from "@/content/generators";
import { skills } from "@/content/topics";
import type { Difficulty } from "@/content/types";
import { db } from "@/lib/db";
import { attempts, dailyStats, runs } from "@/lib/db/schema";
import type { QuestionRef } from "@/lib/practice/session";
import { bangkokDay, previousDay } from "@/lib/stats/day";

/**
 * โจทย์ประจำวัน · the daily challenge (docs/CONTENT-PIPELINE.md §6).
 *
 * Five questions seeded from the date, so everyone gets the same set on the
 * same day and times are comparable - built entirely from generators that
 * already exist. It resets at midnight Asia/Bangkok, like every other day in
 * this app.
 */
export const DAILY_QUESTIONS = 5;

/**
 * How hard the day is, chosen before you start.
 *
 * Every band climbs, because a warm-up that opens on the hardest question is
 * one most people close. They differ in where the climb starts and ends. XP
 * needs no special handling: `xpFor` already pays by difficulty, so a harder
 * band is worth more for exactly the reason it should be.
 */
export const DAILY_BANDS = {
  easy: [1, 1, 2, 2, 2],
  normal: [1, 2, 2, 3, 4],
  hard: [2, 3, 3, 4, 4],
} as const satisfies Record<string, Difficulty[]>;

export type DailyBand = keyof typeof DAILY_BANDS;

export const DEFAULT_BAND: DailyBand = "normal";

export function isDailyBand(value: unknown): value is DailyBand {
  return typeof value === "string" && value in DAILY_BANDS;
}

const MAX_SEED = 2 ** 31 - 1;

/**
 * The day's five questions.
 *
 * It used to be deterministic from the date alone, so everyone in the country
 * opened the same five. That is gone, and deliberately: a daily challenge that
 * asks about lessons you have not been taught is not a challenge, it is a wall.
 * `skillIds` narrows it to what the learner has actually passed.
 *
 * Still deterministic, which is the part that mattered - the seed is the day,
 * the band and the skill set, so reloading, switching language or coming back
 * after lunch gives the same five. Two learners who have passed the same
 * lessons and picked the same band do still get the same day.
 */
export function dailyRefs(
  day: string = bangkokDay(),
  options: { skillIds?: readonly string[]; band?: DailyBand } = {},
): QuestionRef[] {
  const band = options.band ?? DEFAULT_BAND;
  const shape = DAILY_BANDS[band];

  const everything = skills
    .map((skill) => skill.id)
    .filter((skillId) => difficultiesForSkill(skillId).length > 0)
    .sort();

  /*
   * Falling back to everything is not a lapse in the rule, it is the only
   * sensible day one: an account that has passed nothing would otherwise have
   * no daily at all, on the morning it is most likely to be opened. The page
   * says as much rather than leaving it to be inferred.
   */
  const chosen = (options.skillIds ?? []).filter((id) => everything.includes(id));
  const available = chosen.length > 0 ? [...chosen].sort() : everything;

  const rng = createRng(
    seedFromString(`derive-daily:${day}:${band}:${available.join(",")}`),
  );

  const refs: QuestionRef[] = [];
  for (let index = 0; index < DAILY_QUESTIONS; index++) {
    const skillId = rng.pick(available);
    const supported = difficultiesForSkill(skillId);
    const wanted = shape[index]!;
    const difficulty = supported.includes(wanted)
      ? wanted
      : rng.pick(supported);
    const generator = rng.pick(generatorsForSkillAt(skillId, difficulty));

    refs.push({
      generatorId: generator.id,
      seed: rng.int(1, MAX_SEED),
      difficulty,
    });
  }
  return refs;
}

export type DailyRunConfig = {
  day: string;
  refs: QuestionRef[];
  explainMode: "onWrong";
  timeLimitSec: 0;
  skillIds: string[];
  difficulties: Difficulty[];
  count: number;
  /** Which band was chosen. Stored so a reload cannot change the day's shape. */
  band: DailyBand;
  /** Whether this day was drawn from passed lessons or from everything. */
  fromPassed: boolean;
};

export function dailyConfig(
  day: string = bangkokDay(),
  options: { skillIds?: readonly string[]; band?: DailyBand } = {},
): DailyRunConfig {
  const band = options.band ?? DEFAULT_BAND;
  const passed = options.skillIds ?? [];
  const refs = dailyRefs(day, { skillIds: passed, band });

  return {
    day,
    refs,
    explainMode: "onWrong",
    timeLimitSec: 0,
    skillIds: [...passed],
    difficulties: [...new Set(refs.map((ref) => ref.difficulty))],
    count: refs.length,
    band,
    fromPassed: passed.length > 0,
  };
}

/**
 * Finds today's run for this user, or starts it. Keyed on the day inside the
 * config, so opening the page twice cannot produce two runs.
 */
/**
 * Today's run if it has been started, without starting it.
 *
 * The page needs to know the difference: an unstarted day is where the band is
 * chosen, and creating the run just to look at it would take that choice away
 * by making it for them.
 */
export async function findDailyRun(
  userId: string,
  day: string = bangkokDay(),
): Promise<{ id: string; finished: boolean } | null> {
  const [existing] = await db
    .select({ id: runs.id, finishedAt: runs.finishedAt })
    .from(runs)
    .where(
      and(
        eq(runs.userId, userId),
        eq(runs.mode, "daily"),
        sql`${runs.config} ->> 'day' = ${day}`,
      ),
    )
    .limit(1);

  return existing
    ? { id: existing.id, finished: existing.finishedAt !== null }
    : null;
}

export async function findOrCreateDailyRun(
  userId: string,
  day: string = bangkokDay(),
  options: {
    skillIds?: readonly string[];
    band?: DailyBand;
    /**
     * A lookup the caller has already done, to be used instead of repeating it.
     *
     * The daily page needs to know whether today was started before it decides
     * what to render, so by the time it gets here it has the answer already -
     * and looking it up a second time is a whole round trip to Singapore in
     * the one page that was reported as slow to load. `undefined` means "not
     * asked yet"; `null` means "asked, and there is none".
     */
    known?: { id: string; finished: boolean } | null;
  } = {},
): Promise<{ id: string; finished: boolean }> {
  const existing =
    options.known !== undefined
      ? options.known
      : await findDailyRun(userId, day);

  /*
   * An existing run wins over whatever was asked for. The band is chosen once
   * a day: letting a second visit re-pick it would mean opening the page,
   * seeing a hard question and switching to easy, which is not a choice, it is
   * a reroll.
   */
  if (existing) return existing;

  const config = dailyConfig(day, options);
  const [created] = await db
    .insert(runs)
    .values({
      userId,
      mode: "daily",
      config,
      total: config.refs.length,
    })
    .returning({ id: runs.id });

  return { id: created!.id, finished: false };
}

/**
 * Throws away one learner's daily run for a day so it can be taken again.
 *
 * The authorisation lives in the caller (`resetMyDailyAction`, admin only);
 * this is only the work, so that the smoke test can exercise the part that
 * can actually go wrong.
 *
 * Deleting the run is the easy half. The hard half is that `daily_stats` for
 * the day is a rollup of *all* of that day's attempts, daily and practice
 * alike - so it is recomputed from what survives rather than cleared, or a
 * learner who practised this morning would lose that too.
 */
export async function resetDailyRun(
  userId: string,
  day: string = bangkokDay(),
): Promise<{ removedRuns: number; removedAttempts: number }> {
  const dailyRuns = await db
    .select({ id: runs.id })
    .from(runs)
    .where(
      and(
        eq(runs.userId, userId),
        eq(runs.mode, "daily"),
        sql`${runs.config} ->> 'day' = ${day}`,
      ),
    );

  if (dailyRuns.length === 0) return { removedRuns: 0, removedAttempts: 0 };
  const ids = dailyRuns.map((run) => run.id);

  return db.transaction(async (tx) => {
    const removed = await tx
      .delete(attempts)
      .where(and(eq(attempts.userId, userId), inArray(attempts.runId, ids)))
      .returning({ id: attempts.id });

    await tx.delete(runs).where(inArray(runs.id, ids));

    const [remaining] = await tx
      .select({
        attempts: sql<number>`count(*)::int`,
        correct: sql<number>`coalesce(sum(case when ${attempts.isCorrect} then 1 else 0 end), 0)::int`,
        timeMs: sql<number>`coalesce(sum(${attempts.timeMs}), 0)::int`,
      })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), eq(attempts.day, day)));

    if (!remaining || remaining.attempts === 0) {
      await tx
        .delete(dailyStats)
        .where(and(eq(dailyStats.userId, userId), eq(dailyStats.day, day)));
    } else {
      await tx
        .update(dailyStats)
        .set({
          attempts: remaining.attempts,
          correct: remaining.correct,
          timeMs: remaining.timeMs,
        })
        .where(and(eq(dailyStats.userId, userId), eq(dailyStats.day, day)));
    }

    return { removedRuns: ids.length, removedAttempts: removed.length };
  });
}

export type DailyStreak = {
  current: number;
  longest: number;
  doneToday: boolean;
};

/**
 * A separate streak from the practice one: this counts days the challenge was
 * *finished*, which is a different promise from "did ten questions".
 */
export async function getDailyStreak(userId: string): Promise<DailyStreak> {
  const result = await db
    .select({ day: sql<string>`${runs.config} ->> 'day'` })
    .from(runs)
    .where(
      and(
        eq(runs.userId, userId),
        eq(runs.mode, "daily"),
        sql`${runs.finishedAt} is not null`,
      ),
    )
    .orderBy(desc(sql`${runs.config} ->> 'day'`));

  const days = new Set(result.map((row) => row.day));
  const today = bangkokDay();

  let current = 0;
  let cursor = days.has(today) ? today : previousDay(today);
  while (days.has(cursor)) {
    current += 1;
    cursor = previousDay(cursor);
  }

  // Longest run anywhere in the history.
  const sorted = [...days].sort();
  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of sorted) {
    run = previous !== null && previousDay(day) === previous ? run + 1 : 1;
    previous = day;
    longest = Math.max(longest, run);
  }

  return { current, longest, doneToday: days.has(today) };
}
