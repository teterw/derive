/**
 * `pnpm profile-check` - runs every profile query against the real database.
 *
 * The aggregates use `filter (where ...)`, a grouped left join and a subquery
 * that only Postgres ever executes; none of it is exercised by the unit tests,
 * which is exactly the gap `pnpm smoke` exists to cover for the stats queries.
 */
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import {
  getLeaderboard,
  getPeople,
  getProfile,
  getProfileHeatmap,
  getRank,
} from "../lib/profile/queries";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function main() {
  console.log("\nprofile queries\n");

  const [someone] = await db
    .select({ username: users.username })
    .from(users)
    .limit(1);
  if (!someone) throw new Error("no accounts - run pnpm db:seed:admin");

  const profile = await getProfile(someone.username);
  check("a profile loads", profile !== null);
  check(
    "and reports a level of at least 1",
    (profile?.level.level ?? 0) >= 1,
    `level ${profile?.level.level}`,
  );
  check(
    "with progress inside that level",
    (profile?.level.into ?? -1) >= 0 &&
      (profile?.level.into ?? 0) < (profile?.level.span ?? 0),
    `${profile?.level.into}/${profile?.level.span}`,
  );
  check(
    "accuracy is a percentage or nothing",
    profile?.accuracy === null ||
      ((profile?.accuracy ?? -1) >= 0 && (profile?.accuracy ?? 101) <= 100),
    String(profile?.accuracy),
  );

  check("an unknown username is null, not an error", (await getProfile("nobody-here")) === null);

  const board = await getLeaderboard(10);
  check("the leaderboard runs", Array.isArray(board), `${board.length} row(s)`);
  check(
    "ranks start at 1 and do not repeat",
    board.every((row, index) => row.rank === index + 1),
  );
  check(
    "and it is ordered by XP, descending",
    board.every(
      (row, index) =>
        index === 0 || board[index - 1]!.level.totalXp >= row.level.totalXp,
    ),
  );

  const rank = await getRank(someone.username);
  check("a rank comes back", rank !== null, `#${rank}`);

  /**
   * The rank is counted with a subquery rather than read off the board, so the
   * two have to be checked against each other - they are different SQL.
   */
  const onBoard = board.find((row) => row.username === someone.username);
  check(
    "and it agrees with the board",
    onBoard === undefined || onBoard.rank === rank,
    onBoard ? `board #${onBoard.rank} vs rank #${rank}` : "not in this page",
  );

  const people = await getPeople();
  check("the people list runs", people.length >= board.length);

  const heatmap = await getProfileHeatmap(someone.username, 30);
  check("the heatmap returns a cell per day", heatmap.length === 31, `${heatmap.length}`);
  check(
    "every cell has a day and a count",
    heatmap.every(
      (cell) => /^\d{4}-\d{2}-\d{2}$/.test(cell.day) && cell.attempts >= 0,
    ),
  );

  // A learner who opted out is not ranked, and is not on the board.
  await db
    .update(users)
    .set({ hideFromLeaderboard: true })
    .where(eq(users.username, someone.username));
  try {
    check("opting out removes the rank", (await getRank(someone.username)) === null);
    const hiddenBoard = await getLeaderboard(200);
    check(
      "and takes them off the board",
      !hiddenBoard.some((row) => row.username === someone.username),
    );
  } finally {
    await db
      .update(users)
      .set({ hideFromLeaderboard: false })
      .where(eq(users.username, someone.username));
  }
  check("and putting them back restores it", (await getRank(someone.username)) !== null);

  console.log(
    failures === 0
      ? "\nAll profile queries ran.\n"
      : `\n${failures} problem(s).\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
