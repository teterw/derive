import { and, desc, eq, sql } from "drizzle-orm";
import { createRng, seedFromString } from "@/content/rng";
import {
  difficultiesForSkill,
  generatorsForSkillAt,
} from "@/content/generators";
import { skills } from "@/content/topics";
import type { Difficulty } from "@/content/types";
import { db } from "@/lib/db";
import { runs } from "@/lib/db/schema";
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

/** A warm-up that climbs: easy, medium, medium, hard, challenge. */
const DAILY_SHAPE: Difficulty[] = [1, 2, 2, 3, 4];

const MAX_SEED = 2 ** 31 - 1;

/**
 * Deterministic from the day alone. No database, no user - two people opening
 * the app in different provinces get the identical five questions.
 */
export function dailyRefs(day: string = bangkokDay()): QuestionRef[] {
  const rng = createRng(seedFromString(`derive-daily:${day}`));

  const available = skills
    .map((skill) => skill.id)
    .filter((skillId) => difficultiesForSkill(skillId).length > 0)
    .sort();

  const refs: QuestionRef[] = [];
  for (let index = 0; index < DAILY_QUESTIONS; index++) {
    const skillId = rng.pick(available);
    const supported = difficultiesForSkill(skillId);
    const wanted = DAILY_SHAPE[index]!;
    const difficulty = supported.includes(wanted) ? wanted : rng.pick(supported);
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
};

export function dailyConfig(day: string = bangkokDay()): DailyRunConfig {
  const refs = dailyRefs(day);
  return {
    day,
    refs,
    explainMode: "onWrong",
    timeLimitSec: 0,
    skillIds: [],
    difficulties: [...new Set(refs.map((ref) => ref.difficulty))],
    count: refs.length,
  };
}

/**
 * Finds today's run for this user, or starts it. Keyed on the day inside the
 * config, so opening the page twice cannot produce two runs.
 */
export async function findOrCreateDailyRun(
  userId: string,
  day: string = bangkokDay(),
): Promise<{ id: string; finished: boolean }> {
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

  if (existing) {
    return { id: existing.id, finished: existing.finishedAt !== null };
  }

  const config = dailyConfig(day);
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
