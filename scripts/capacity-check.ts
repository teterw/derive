/**
 * `pnpm capacity` - what this database can actually take.
 *
 * Reports the limits Postgres is configured with, how big the tables are now,
 * and how long the queries on the hot pages take, so that a capacity estimate
 * is arithmetic over measurements rather than a guess.
 *
 * Read-only. It writes nothing and creates no sessions.
 */
import { sql } from "drizzle-orm";
import { db } from "../lib/db";

type Row = Record<string, unknown>;

async function show(title: string, query: ReturnType<typeof sql>) {
  const result = (await db.execute(query)) as unknown as { rows: Row[] };
  console.log(`\n== ${title}`);
  for (const row of result.rows) {
    console.log(
      Object.entries(row)
        .map(([k, v]) => `${k}=${v}`)
        .join("  "),
    );
  }
  return result.rows;
}

/** Median of several runs, because one timing measures the weather. */
async function timeQuery(label: string, query: ReturnType<typeof sql>) {
  const runs: number[] = [];
  for (let i = 0; i < 7; i += 1) {
    const started = performance.now();
    await db.execute(query);
    runs.push(performance.now() - started);
  }
  runs.sort((a, b) => a - b);
  console.log(`  ${label.padEnd(34)} ${runs[3]!.toFixed(1)}ms`);
  return runs[3]!;
}

async function main() {
  await show(
    "server limits",
    sql`select name, setting from pg_settings
        where name in ('max_connections','shared_buffers','work_mem','max_worker_processes')
        order by name`,
  );

  await show(
    "connections in use right now",
    sql`select state, count(*) as n from pg_stat_activity group by state order by n desc`,
  );

  await show(
    "table sizes",
    sql`select relname as table,
               n_live_tup as rows,
               pg_size_pretty(pg_total_relation_size(relid)) as total
        from pg_stat_user_tables
        order by pg_total_relation_size(relid) desc
        limit 12`,
  );

  await show(
    "database size",
    sql`select pg_size_pretty(pg_database_size(current_database())) as size`,
  );

  /*
   * The width of a row as Postgres actually stores it, which is what a storage
   * projection needs. Dividing the table size by the row count does not give
   * this on a small table - a nearly empty table is mostly fixed overhead, and
   * `attempts` currently reports about 4.5KB a row on that arithmetic when the
   * real figure is a fraction of it.
   */
  await show(
    "average row width, as stored",
    sql`select 'attempts' as tbl, avg(pg_column_size(t.*))::int as bytes from attempts t
        union all
        select 'runs', avg(pg_column_size(t.*))::int from runs t
        union all
        select 'skill_reviews', avg(pg_column_size(t.*))::int from skill_reviews t
        union all
        select 'daily_stats', avg(pg_column_size(t.*))::int from daily_stats t
        union all
        select 'skill_mastery', avg(pg_column_size(t.*))::int from skill_mastery t`,
  );

  console.log("\n== round trip and hot queries (median of 7)");
  const ping = await timeQuery("ping (round trip floor)", sql`select 1`);
  await timeQuery("session lookup by token hash", sql`
    select u.id from sessions s join users u on u.id = s.user_id
    where s.token_hash = repeat('0', 64) limit 1`);
  await timeQuery("attempts for one user, today", sql`
    select count(*) from attempts
    where user_id = (select id from users limit 1) and day = current_date`);
  await timeQuery("lesson progress for one user", sql`
    select count(*) from lesson_progress where user_id = (select id from users limit 1)`);
  await timeQuery("site stats (admin overview)", sql`
    select (select count(*) from users) as users,
           (select count(*) from attempts) as attempts`);

  console.log(`\n  network floor is ${ping.toFixed(1)}ms from this machine;`);
  console.log(`  subtract it to see what the database itself spends.`);

  await show(
    "indexes that are never used",
    sql`select relname as table, indexrelname as index, idx_scan as scans
        from pg_stat_user_indexes where idx_scan = 0 order by relname limit 15`,
  );

  await show(
    "sequential scans on big tables",
    sql`select relname as table, seq_scan, idx_scan, n_live_tup as rows
        from pg_stat_user_tables
        where n_live_tup > 500 order by seq_scan desc limit 10`,
  );

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
