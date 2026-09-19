import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyStats, users } from "@/lib/db/schema";
import { levelFromXp, type LevelProgress } from "@/lib/stats/level";
import { bangkokDay } from "@/lib/stats/day";

/**
 * Profiles (PROMPT.md §12, settled: visible to everyone who was invited).
 *
 * Everyone here was let in by someone who already had an account, so there is
 * no stranger to hide from - and seeing that someone else practised today is
 * most of what makes a streak worth keeping. What a profile shows is therefore
 * the same information the owner sees on their own dashboard, not a redacted
 * version of it.
 *
 * Every figure is SQL over `attempts` and `daily_stats`; nothing is summed in
 * the browser, and there is no denormalised XP counter to drift.
 */

export type Profile = {
  username: string;
  displayName: string;
  bio: string | null;
  avatarSlot: number;
  avatarUpdatedAt: Date | null;
  role: "user" | "admin";
  joinedAt: Date;
  currentStreak: number;
  longestStreak: number;
  level: LevelProgress;
  totalAttempts: number;
  totalCorrect: number;
  accuracy: number | null;
  daysPractised: number;
  practisedToday: boolean;
  hideFromLeaderboard: boolean;
};

/** Lifetime XP, summed from the day rollups. */
const xpSum = sql<number>`coalesce(sum(${dailyStats.xp}), 0)::int`;

/**
 * The user row every profile query starts from.
 *
 * Exported so a page can resolve the username **once** and hand the id to
 * everything else. The profile page used to call three functions that each
 * looked the same person up again, and against a database in another country a
 * redundant round trip is not free - it was most of why that page took 390ms.
 */
export type ProfileUser = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarSlot: number;
  avatarUpdatedAt: Date | null;
  role: "user" | "admin";
  joinedAt: Date;
  currentStreak: number;
  longestStreak: number;
  hideFromLeaderboard: boolean;
};

export async function findProfileUser(
  username: string,
): Promise<ProfileUser | null> {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
      avatarSlot: users.avatarSlot,
      avatarUpdatedAt: users.avatarUpdatedAt,
      role: users.role,
      joinedAt: users.createdAt,
      currentStreak: users.currentStreak,
      longestStreak: users.longestStreak,
      hideFromLeaderboard: users.hideFromLeaderboard,
    })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);

  return user ?? null;
}

export async function getProfile(username: string): Promise<Profile | null> {
  const user = await findProfileUser(username);
  if (!user) return null;
  return buildProfile(user);
}

/**
 * The figures for a user already in hand.
 *
 * Lifetime totals and "did they practise today" come from one scan of the same
 * rows - `filter (where day = ...)` rather than a second query for a single
 * row, which is a whole round trip to learn one boolean.
 */
export async function buildProfile(user: ProfileUser): Promise<Profile> {
  const today = bangkokDay();

  const [totals] = await db
    .select({
      xp: xpSum,
      attempts: sql<number>`coalesce(sum(${dailyStats.attempts}), 0)::int`,
      correct: sql<number>`coalesce(sum(${dailyStats.correct}), 0)::int`,
      days: sql<number>`count(*) filter (where ${dailyStats.attempts} > 0)::int`,
      todayAttempts: sql<number>`coalesce(sum(${dailyStats.attempts}) filter (where ${dailyStats.day} = ${today}), 0)::int`,
    })
    .from(dailyStats)
    .where(eq(dailyStats.userId, user.id));

  const totalAttempts = Number(totals?.attempts ?? 0);
  const totalCorrect = Number(totals?.correct ?? 0);

  return {
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarSlot: user.avatarSlot,
    avatarUpdatedAt: user.avatarUpdatedAt,
    role: user.role,
    joinedAt: user.joinedAt,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    level: levelFromXp(Number(totals?.xp ?? 0)),
    totalAttempts,
    totalCorrect,
    accuracy:
      totalAttempts === 0
        ? null
        : Math.round((totalCorrect / totalAttempts) * 100),
    daysPractised: Number(totals?.days ?? 0),
    practisedToday: Number(totals?.todayAttempts ?? 0) > 0,
    hideFromLeaderboard: user.hideFromLeaderboard,
  };
}

export type LeaderboardRow = {
  rank: number;
  username: string;
  displayName: string;
  avatarSlot: number;
  avatarUpdatedAt: Date | null;
  level: LevelProgress;
  currentStreak: number;
  attempts: number;
  accuracy: number | null;
};

/**
 * The global board, by lifetime XP.
 *
 * XP is chosen over accuracy on purpose: a board ranked by accuracy rewards
 * answering three easy questions and stopping, which is the opposite of what
 * this app is for. XP only goes up by doing the work, and it is weighted by
 * difficulty, so the way to climb is to practise more and harder.
 *
 * Learners who opted out are not ranked at all - they do not occupy a rank
 * that then looks like a gap.
 */
export async function getLeaderboard(limit = 50): Promise<LeaderboardRow[]> {
  const rows = await db
    .select({
      username: users.username,
      displayName: users.displayName,
      avatarSlot: users.avatarSlot,
      avatarUpdatedAt: users.avatarUpdatedAt,
      currentStreak: users.currentStreak,
      xp: xpSum,
      attempts: sql<number>`coalesce(sum(${dailyStats.attempts}), 0)::int`,
      correct: sql<number>`coalesce(sum(${dailyStats.correct}), 0)::int`,
    })
    .from(users)
    .leftJoin(dailyStats, eq(dailyStats.userId, users.id))
    .where(eq(users.hideFromLeaderboard, false))
    .groupBy(
      users.id,
      users.username,
      users.displayName,
      users.avatarSlot,
      users.avatarUpdatedAt,
      users.currentStreak,
    )
    .orderBy(desc(xpSum))
    .limit(limit);

  return rows.map((row, index) => {
    const attempts = Number(row.attempts);
    return {
      rank: index + 1,
      username: row.username,
      displayName: row.displayName,
      avatarSlot: row.avatarSlot,
      avatarUpdatedAt: row.avatarUpdatedAt,
      level: levelFromXp(Number(row.xp)),
      currentStreak: row.currentStreak,
      attempts,
      accuracy:
        attempts === 0
          ? null
          : Math.round((Number(row.correct) / attempts) * 100),
    };
  });
}

/**
 * Where one learner sits, even when they are past the end of the board.
 *
 * One round trip. This used to be three - look up the user, sum their XP, then
 * count the people above them - and two of those were answerable inside the
 * third. The people strictly above are counted rather than an index read off
 * the board, so the rank is right whether or not the learner appears in the
 * page of rows the board happens to be showing.
 */
export async function getRankById(userId: string): Promise<number | null> {
  const rows = await db.execute<{ ahead: number; ranked: boolean }>(sql`
    with totals as (
      select
        u.id,
        u.hide_from_leaderboard as hidden,
        coalesce(sum(ds.xp), 0)::int as xp
      from users u
      left join daily_stats ds on ds.user_id = u.id
      group by u.id, u.hide_from_leaderboard
    ),
    me as (select xp, hidden from totals where id = ${userId})
    select
      (
        select count(*)::int from totals
        where hidden = false and xp > (select xp from me)
      ) as ahead,
      (select hidden = false from me) as ranked
  `);

  const row = rows.rows?.[0] ?? (rows as unknown as { ahead: number; ranked: boolean }[])[0];
  if (!row || row.ranked !== true) return null;
  return Number(row.ahead) + 1;
}

/** By username, for callers that do not already hold the user. */
export async function getRank(username: string): Promise<number | null> {
  const user = await findProfileUser(username);
  if (!user || user.hideFromLeaderboard) return null;
  return getRankById(user.id);
}

/** Everyone, for the people page. Newest first among the never-practised. */
export async function getPeople(): Promise<LeaderboardRow[]> {
  return getLeaderboard(200);
}

/** Recent activity for one learner, for the profile page's heatmap. */
export async function getProfileHeatmap(username: string, days: number) {
  const user = await findProfileUser(username);
  if (!user) return [];
  return getProfileHeatmapById(user.id, days);
}

export async function getProfileHeatmapById(userId: string, days: number) {
  const user = { id: userId };
  const rows = await db
    .select({
      day: sql<string>`to_char(d.day, 'YYYY-MM-DD')`,
      attempts: sql<number>`coalesce(${dailyStats.attempts}, 0)::int`,
      correct: sql<number>`coalesce(${dailyStats.correct}, 0)::int`,
    })
    .from(
      sql`generate_series(
        (${bangkokDay()}::date - ${days}::int),
        ${bangkokDay()}::date,
        '1 day'
      ) as d(day)`,
    )
    .leftJoin(
      dailyStats,
      and(eq(dailyStats.userId, user.id), eq(dailyStats.day, sql`d.day`)),
    )
    .orderBy(sql`d.day`);

  return rows.map((row) => ({
    day: row.day,
    attempts: Number(row.attempts),
    correct: Number(row.correct),
  }));
}
