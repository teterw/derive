import { and, count, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  attempts,
  dailyStats,
  lessonProgress,
  runs,
  users,
} from "@/lib/db/schema";
import { bangkokDay } from "@/lib/stats/day";

/**
 * The numbers an admin actually wants on opening the page.
 *
 * "Is anyone using it" and "is it working today", which on a site with tens of
 * accounts is most of what administration consists of. Everything here is a
 * count in SQL; nothing loads rows to length them.
 */
export type SiteStats = {
  users: number;
  admins: number;
  /** Accounts that answered something today, Asia/Bangkok. */
  activeToday: number;
  /** Accounts that answered something in the last seven days. */
  activeThisWeek: number;
  attemptsToday: number;
  attemptsTotal: number;
  /** Daily challenges finished today, across everyone. */
  dailyFinishedToday: number;
  /** Lesson passes, across everyone. */
  lessonsPassed: number;
};

export async function getSiteStats(): Promise<SiteStats> {
  const today = bangkokDay();

  /*
   * One wave. These do not depend on each other, and the database is in another
   * country - eight queues would be eight round trips for numbers that are
   * shown side by side.
   */
  const [
    userRows,
    adminRows,
    activeTodayRows,
    activeWeekRows,
    attemptsTodayRows,
    attemptsTotalRows,
    dailyRows,
    passedRows,
  ] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(users).where(eq(users.role, "admin")),

    db
      .select({ n: sql<number>`count(distinct ${dailyStats.userId})::int` })
      .from(dailyStats)
      .where(eq(dailyStats.day, today)),

    db
      .select({ n: sql<number>`count(distinct ${dailyStats.userId})::int` })
      .from(dailyStats)
      // Days are stored as text in Asia/Bangkok, and they sort correctly as
      // text, so a window is a string comparison rather than a date cast.
      .where(gte(dailyStats.day, daysAgo(today, 6))),

    db
      .select({ n: sql<number>`coalesce(sum(${dailyStats.attempts}), 0)::int` })
      .from(dailyStats)
      .where(eq(dailyStats.day, today)),

    db.select({ n: count() }).from(attempts),

    db
      .select({ n: count() })
      .from(runs)
      .where(
        and(
          eq(runs.mode, "daily"),
          isNotNull(runs.finishedAt),
          sql`${runs.config} ->> 'day' = ${today}`,
        ),
      ),

    db
      .select({ n: count() })
      .from(lessonProgress)
      .where(isNotNull(lessonProgress.passedAt)),
  ]);

  return {
    users: userRows[0]?.n ?? 0,
    admins: adminRows[0]?.n ?? 0,
    activeToday: Number(activeTodayRows[0]?.n ?? 0),
    activeThisWeek: Number(activeWeekRows[0]?.n ?? 0),
    attemptsToday: Number(attemptsTodayRows[0]?.n ?? 0),
    attemptsTotal: attemptsTotalRows[0]?.n ?? 0,
    dailyFinishedToday: dailyRows[0]?.n ?? 0,
    lessonsPassed: passedRows[0]?.n ?? 0,
  };
}

/** `YYYY-MM-DD` arithmetic, staying in the calendar the days were written in. */
function daysAgo(day: string, back: number): string {
  const [y, m, d] = day.split("-").map(Number);
  // UTC on purpose: this is date arithmetic on a label, not a moment in time,
  // and going through local time is how a day goes missing near midnight.
  const date = new Date(Date.UTC(y!, m! - 1, d!));
  date.setUTCDate(date.getUTCDate() - back);
  return date.toISOString().slice(0, 10);
}

export type AdminUserRow = {
  id: string;
  username: string;
  displayName: string;
  role: "user" | "admin";
  createdAt: Date;
  lastSeenAt: Date;
  currentStreak: number;
  xp: number;
  lessonsPassed: number;
};

/**
 * The user list, with the two numbers that say whether an account is real:
 * what it has earned and how much of the curriculum it has passed.
 *
 * Both are aggregates over that user's own rows, done as correlated subqueries
 * rather than as joins - a join against `daily_stats` would multiply the user
 * row by its days before anything got summed.
 */
export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      role: users.role,
      createdAt: users.createdAt,
      lastSeenAt: users.lastSeenAt,
      currentStreak: users.currentStreak,
      xp: sql<number>`(
        select coalesce(sum(${dailyStats.xp}), 0)::int
        from ${dailyStats}
        where ${dailyStats.userId} = ${users.id}
      )`,
      lessonsPassed: sql<number>`(
        select count(*)::int
        from ${lessonProgress}
        where ${lessonProgress.userId} = ${users.id}
          and ${lessonProgress.passedAt} is not null
      )`,
    })
    .from(users)
    .orderBy(sql`${users.createdAt} desc`);

  return rows.map((row) => ({
    ...row,
    xp: Number(row.xp),
    lessonsPassed: Number(row.lessonsPassed),
  }));
}
