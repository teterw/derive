import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { attempts, skillMastery, users } from "@/lib/db/schema";
import { getSkill, skills } from "@/content/topics";
import type { Difficulty, SkillId, TopicId } from "@/content/types";
import { bangkokDay, daysBetween, previousDay } from "./day";
import { MASTERY_MIN_ATTEMPTS, STREAK_MIN_ATTEMPTS } from "./constants";

/**
 * Every aggregate the statistics pages need, as SQL (PROMPT.md §8). Raw
 * attempt rows are never shipped to the browser to be summed there.
 */

export type HeatmapDay = {
  day: string;
  attempts: number;
  correct: number;
};

/**
 * One row per day for the last `days` days, including the empty ones - the
 * grid has to have a cell for every day, not only the days that were used.
 */
export async function getHeatmap(
  userId: string,
  days = 364,
): Promise<HeatmapDay[]> {
  const today = bangkokDay();
  const result = await db.execute(sql`
    with span as (
      select generate_series(
        ${today}::date - ${days}::int,
        ${today}::date,
        interval '1 day'
      )::date as day
    )
    select
      to_char(span.day, 'YYYY-MM-DD') as day,
      coalesce(ds.attempts, 0)::int as attempts,
      coalesce(ds.correct, 0)::int as correct
    from span
    left join daily_stats ds
      on ds.day = span.day and ds.user_id = ${userId}
    order by span.day
  `);

  return result.rows.map((row) => ({
    day: String(row.day),
    attempts: Number(row.attempts),
    correct: Number(row.correct),
  }));
}

export type StreakInfo = {
  current: number;
  longest: number;
  /** Attempts so far today, and how many a day needs to count. */
  todayAttempts: number;
  threshold: number;
  /** True when today already counts, so the streak is safe. */
  todaySecured: boolean;
};

export async function getStreak(userId: string): Promise<StreakInfo> {
  const today = bangkokDay();

  const [user] = await db
    .select({
      current: users.currentStreak,
      longest: users.longestStreak,
      lastActiveDay: users.lastActiveDay,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const result = await db.execute(sql`
    select coalesce(attempts, 0)::int as attempts
    from daily_stats
    where user_id = ${userId} and day = ${today}::date
  `);
  const todayAttempts = Number(result.rows[0]?.attempts ?? 0);

  /**
   * The stored streak only ever moves forward, so a missed day has to be
   * noticed at read time: a streak is alive only if the last day that counted
   * was today or yesterday.
   */
  const alive =
    user?.lastActiveDay != null &&
    (user.lastActiveDay === today ||
      user.lastActiveDay === previousDay(today));

  return {
    current: alive ? (user?.current ?? 0) : 0,
    longest: user?.longest ?? 0,
    todayAttempts,
    threshold: STREAK_MIN_ATTEMPTS,
    todaySecured: todayAttempts >= STREAK_MIN_ATTEMPTS,
  };
}

export type DifficultyCount = {
  difficulty: Difficulty;
  correct: number;
  attempts: number;
};

export async function getDifficultyCounts(
  userId: string,
): Promise<DifficultyCount[]> {
  const rows = await db
    .select({
      difficulty: attempts.difficulty,
      correct: sql<number>`count(*) filter (where ${attempts.isCorrect})::int`,
      attempts: sql<number>`count(*)::int`,
    })
    .from(attempts)
    .where(eq(attempts.userId, userId))
    .groupBy(attempts.difficulty)
    .orderBy(attempts.difficulty);

  const byDifficulty = new Map(rows.map((row) => [row.difficulty, row]));
  return ([1, 2, 3, 4] as Difficulty[]).map((difficulty) => ({
    difficulty,
    correct: byDifficulty.get(difficulty)?.correct ?? 0,
    attempts: byDifficulty.get(difficulty)?.attempts ?? 0,
  }));
}

export type AccuracyPoint = {
  day: string;
  /** Rolling 7-day accuracy as a percentage, or null on days with no data. */
  accuracy: number | null;
  attempts: number;
};

/**
 * Rolling 7-day accuracy. The window is seven *days*, not seven rows, so a gap
 * in practice pulls the line down rather than being skipped over.
 */
export async function getAccuracyTrend(
  userId: string,
  days = 90,
): Promise<AccuracyPoint[]> {
  const today = bangkokDay();
  const result = await db.execute(sql`
    with span as (
      select generate_series(
        ${today}::date - ${days}::int,
        ${today}::date,
        interval '1 day'
      )::date as day
    ),
    joined as (
      select
        span.day,
        coalesce(ds.attempts, 0)::int as attempts,
        coalesce(ds.correct, 0)::int as correct
      from span
      left join daily_stats ds
        on ds.day = span.day and ds.user_id = ${userId}
    )
    select
      to_char(day, 'YYYY-MM-DD') as day,
      sum(attempts) over w as window_attempts,
      sum(correct) over w as window_correct,
      attempts as day_attempts
    from joined
    window w as (order by day rows between 6 preceding and current row)
    order by day
  `);

  return result.rows.map((row) => {
    const windowAttempts = Number(row.window_attempts);
    return {
      day: String(row.day),
      attempts: Number(row.day_attempts),
      accuracy:
        windowAttempts === 0
          ? null
          : Math.round((Number(row.window_correct) / windowAttempts) * 100),
    };
  });
}

export type SpeedByDifficulty = {
  difficulty: Difficulty;
  medianSec: number | null;
  attempts: number;
};

export async function getSpeedByDifficulty(
  userId: string,
): Promise<SpeedByDifficulty[]> {
  const result = await db.execute(sql`
    select
      difficulty,
      percentile_cont(0.5) within group (order by time_ms) as median_ms,
      count(*)::int as attempts
    from attempts
    where user_id = ${userId}
    group by difficulty
    order by difficulty
  `);

  const byDifficulty = new Map(
    result.rows.map((row) => [
      Number(row.difficulty),
      {
        medianSec: row.median_ms == null ? null : Number(row.median_ms) / 1000,
        attempts: Number(row.attempts),
      },
    ]),
  );

  return ([1, 2, 3, 4] as Difficulty[]).map((difficulty) => ({
    difficulty,
    medianSec: byDifficulty.get(difficulty)?.medianSec ?? null,
    attempts: byDifficulty.get(difficulty)?.attempts ?? 0,
  }));
}

export type SpeedPoint = { week: string; medianSec: number };

/** Weekly median seconds per question - daily medians are too noisy to read. */
export async function getSpeedTrend(
  userId: string,
  weeks = 12,
): Promise<SpeedPoint[]> {
  const result = await db.execute(sql`
    select
      to_char(date_trunc('week', day), 'YYYY-MM-DD') as week,
      percentile_cont(0.5) within group (order by time_ms) as median_ms
    from attempts
    where user_id = ${userId}
      and day >= ${bangkokDay()}::date - ${weeks * 7}::int
    group by 1
    order by 1
  `);

  return result.rows
    .filter((row) => row.median_ms != null)
    .map((row) => ({
      week: String(row.week),
      medianSec: Math.round(Number(row.median_ms) / 100) / 10,
    }));
}

export type SkillProgress = {
  skillId: SkillId;
  topicId: TopicId;
  attempts: number;
  correct: number;
  ema: number;
  level: number;
};

export async function getSkillProgress(
  userId: string,
): Promise<SkillProgress[]> {
  const rows = await db
    .select()
    .from(skillMastery)
    .where(eq(skillMastery.userId, userId));

  const byId = new Map(rows.map((row) => [row.skillId, row]));

  // Every skill appears, so "not started" is visible rather than missing.
  return skills.map((skill) => {
    const row = byId.get(skill.id);
    return {
      skillId: skill.id,
      topicId: skill.topicId,
      attempts: row?.attempts ?? 0,
      correct: row?.correct ?? 0,
      ema: row?.emaAccuracy ?? 0,
      level: row?.level ?? 0,
    };
  });
}

/** The worst few skills with enough attempts to mean anything. */
export async function getWeakestSkills(
  userId: string,
  limit = 5,
): Promise<SkillProgress[]> {
  const progress = await getSkillProgress(userId);
  return progress
    .filter((row) => row.attempts >= MASTERY_MIN_ATTEMPTS)
    .sort((a, b) => a.ema - b.ema)
    .slice(0, limit);
}

export type Totals = {
  attempts: number;
  correct: number;
  timeMs: number;
  topics: number;
  skills: number;
  rules: number;
  activeDays: number;
};

export async function getTotals(userId: string): Promise<Totals> {
  const [row] = await db
    .select({
      attempts: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${attempts.isCorrect})::int`,
      timeMs: sql<number>`coalesce(sum(${attempts.timeMs}), 0)::bigint`,
      topics: sql<number>`count(distinct ${attempts.topicId})::int`,
      days: sql<number>`count(distinct ${attempts.day})::int`,
    })
    .from(attempts)
    .where(eq(attempts.userId, userId));

  const skillRows = await db
    .selectDistinct({ skillId: attempts.skillId })
    .from(attempts)
    .where(eq(attempts.userId, userId));

  /**
   * "Rules encountered" is derived rather than stored: a rule is encountered
   * by practising a skill that uses it, and skills already list their rules.
   */
  const ruleIds = new Set<string>();
  for (const { skillId } of skillRows) {
    try {
      for (const ruleId of getSkill(skillId).ruleIds) ruleIds.add(ruleId);
    } catch {
      // A skill that no longer exists in the content: skip it.
    }
  }

  return {
    attempts: Number(row?.attempts ?? 0),
    correct: Number(row?.correct ?? 0),
    timeMs: Number(row?.timeMs ?? 0),
    topics: Number(row?.topics ?? 0),
    skills: skillRows.length,
    rules: ruleIds.size,
    activeDays: Number(row?.days ?? 0),
  };
}

export type PersonalBests = {
  longestCorrectStreak: number;
  fastestSprints: { topicId: TopicId; ms: number }[];
};

export async function getPersonalBests(
  userId: string,
): Promise<PersonalBests> {
  // Gaps and islands: consecutive correct answers share (rn - rnByOutcome).
  const streak = await db.execute(sql`
    with ordered as (
      select
        is_correct,
        row_number() over (order by created_at) as rn,
        row_number() over (partition by is_correct order by created_at) as rn_outcome
      from attempts
      where user_id = ${userId}
    )
    select count(*)::int as len
    from ordered
    where is_correct
    group by rn - rn_outcome
    order by len desc
    limit 1
  `);

  // The quickest any 20 consecutive questions in a topic have been answered.
  const sprints = await db.execute(sql`
    with windowed as (
      select
        topic_id,
        sum(time_ms) over w as window_ms,
        count(*) over w as n
      from attempts
      where user_id = ${userId}
      window w as (
        partition by topic_id
        order by created_at
        rows between 19 preceding and current row
      )
    )
    select topic_id, min(window_ms)::int as best_ms
    from windowed
    where n = 20
    group by topic_id
    order by best_ms
  `);

  return {
    longestCorrectStreak: Number(streak.rows[0]?.len ?? 0),
    fastestSprints: sprints.rows.map((row) => ({
      topicId: String(row.topic_id),
      ms: Number(row.best_ms),
    })),
  };
}

export type TodaySummary = {
  attempts: number;
  correct: number;
  timeMs: number;
};

export async function getToday(userId: string): Promise<TodaySummary> {
  const today = bangkokDay();
  const [row] = await db
    .select({
      attempts: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${attempts.isCorrect})::int`,
      timeMs: sql<number>`coalesce(sum(${attempts.timeMs}), 0)::int`,
    })
    .from(attempts)
    .where(and(eq(attempts.userId, userId), eq(attempts.day, today)));

  return {
    attempts: Number(row?.attempts ?? 0),
    correct: Number(row?.correct ?? 0),
    timeMs: Number(row?.timeMs ?? 0),
  };
}

/** How long ago the learner last practised, in whole days. */
export function daysSince(day: string | null): number | null {
  if (!day) return null;
  return daysBetween(day, bangkokDay());
}
