/**
 * `pnpm smoke` - exercises the whole stack against the real database.
 *
 * Creates a throwaway user, redeems an invite code the way registration does,
 * answers a batch of generated questions through the same `recordAttempt` the
 * app uses, runs every statistics query, and then deletes the user again.
 *
 * This is what makes it possible to say the aggregates *work* rather than
 * *compile*: `generate_series`, `percentile_cont` and the gaps-and-islands
 * window queries only ever run inside Postgres.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import {
  attempts,
  authFailures,
  dailyStats,
  inviteCodes,
  inviteRedemptions,
  runs,
  users,
} from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";
import { generateInviteCode } from "../lib/auth/invite";
import { generateQuestion, generators } from "../content/generators";
import { getSkill, skills } from "../content/topics";
import type { Difficulty } from "../content/types";
import { buildExamRefs } from "../lib/exam/session";
import {
  DAILY_QUESTIONS,
  dailyRefs,
  findOrCreateDailyRun,
  getDailyStreak,
  resetDailyRun,
} from "../lib/daily/challenge";
import { checkAnswer } from "../lib/math/check";
import { recordAttempt } from "../lib/stats/record";
import {
  getAccuracyTrend,
  getDifficultyCounts,
  getHeatmap,
  getPersonalBests,
  getSkillProgress,
  getSpeedByDifficulty,
  getSpeedTrend,
  getStreak,
  getToday,
  getTotals,
  getWeakestSkills,
} from "../lib/stats/queries";
import { getReviewCount, getReviewQueue } from "../lib/review/queue";
import {
  SESSION_GAP_MS,
  currentPracticeRunId,
} from "../lib/practice/run";
import { bangkokDay } from "../lib/stats/day";
import {
  clearFailures,
  isRateLimited,
  purgeOldFailures,
  recordFailure,
} from "../lib/auth/rate-limit";
import {
  LOGIN_FAILURE_LIMIT,
  RATE_LIMIT_WINDOW_MS,
} from "../lib/auth/constants";

const USERNAME = "smoke-test-user";
/** How many questions the fake session answers. */
const QUESTIONS = 24;

function check(label: string, ok: boolean, detail = ""): boolean {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

async function main() {
  let failures = 0;
  const fail = (label: string, ok: boolean, detail = "") => {
    if (!check(label, ok, detail)) failures++;
  };

  console.log(`\nsmoke test · ${bangkokDay()} (Asia/Bangkok)\n`);

  // --- clean up anything a previous run left behind -----------------------
  await db.delete(users).where(eq(users.username, USERNAME));

  // --- an admin issues an invite code, the way /admin does ----------------
  const [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"))
    .limit(1);
  if (!admin) throw new Error("no admin seeded - run pnpm db:seed:admin first");

  const code = generateInviteCode();
  const [invite] = await db
    .insert(inviteCodes)
    .values({ code, createdBy: admin.id, note: "smoke test", maxUses: 1 })
    .returning({ id: inviteCodes.id });

  console.log("invite");
  fail("code is 12 characters with no look-alikes", /^[2-9A-HJ-NP-Z]{12}$/.test(code));

  // --- registration: claim a use, insert the user, record the redemption --
  const passwordHash = await hashPassword("smoke-test-password");
  const registration = await db.transaction(async (tx) => {
    const claimed = await tx
      .update(inviteCodes)
      .set({ uses: sql`${inviteCodes.uses} + 1` })
      .where(
        and(
          eq(inviteCodes.code, code),
          eq(inviteCodes.disabled, false),
          sql`${inviteCodes.uses} < ${inviteCodes.maxUses}`,
        ),
      )
      .returning({ id: inviteCodes.id });
    if (claimed.length === 0) throw new Error("invite could not be claimed");

    const [created] = await tx
      .insert(users)
      .values({
        username: USERNAME,
        passwordHash,
        displayName: "Smoke Test",
      })
      .returning({ id: users.id });

    await tx
      .insert(inviteRedemptions)
      .values({ inviteCodeId: claimed[0]!.id, userId: created!.id });
    return created!.id;
  });

  fail("registration created the user and spent the code", Boolean(registration));

  // A second redemption of a single-use code must fail.
  const second = await db
    .update(inviteCodes)
    .set({ uses: sql`${inviteCodes.uses} + 1` })
    .where(
      and(
        eq(inviteCodes.code, code),
        sql`${inviteCodes.uses} < ${inviteCodes.maxUses}`,
      ),
    )
    .returning({ id: inviteCodes.id });
  fail("a single-use code cannot be redeemed twice", second.length === 0);

  const userId = registration;

  // --- answer a batch of questions through the real path ------------------
  console.log("\npractice");
  /**
   * The first 20 questions all come from one topic on purpose: the personal
   * best for a 20-question sprint is a window over consecutive attempts in the
   * same topic, and a run spread evenly over two topics never fills it.
   */
  const oneTopic = generators.filter(
    (candidate) => getSkill(candidate.skillId).topicId === "quadratic-equations",
  );
  const order = [
    ...Array.from({ length: 20 }, (_, i) => oneTopic[i % oneTopic.length]!),
    ...generators,
  ];

  let correctCount = 0;
  for (let index = 0; index < QUESTIONS; index++) {
    const generator = order[index % order.length]!;
    const difficulty = generator.difficulties[index % generator.difficulties.length]!;
    const question = generateQuestion(generator.id, 1000 + index, difficulty);

    // Answer correctly two times out of three, so accuracy is not 100%.
    const canonical = canonicalAnswer(question.answer);
    const answer = index % 3 === 2 ? `${canonical} + 1` : canonical;
    const result = checkAnswer(
      question.answer,
      answer,
      getSkill(question.skillId).strictForm,
    );
    if (result.correct) correctCount++;

    await recordAttempt({
      userId,
      mode: "practice",
      question,
      userAnswer: answer,
      isCorrect: result.correct,
      timeMs: 4000 + index * 250,
      hintsUsed: 0,
      stepsRevealed: false,
    });
  }

  const [stored] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(attempts)
    .where(eq(attempts.userId, userId));
  fail(
    `all ${QUESTIONS} attempts were written`,
    Number(stored?.count) === QUESTIONS,
    `got ${stored?.count}`,
  );

  const today = await getToday(userId);
  fail("today's summary matches", today.attempts === QUESTIONS);
  fail(
    "and counts the right number correct",
    today.correct === correctCount,
    `${today.correct} vs ${correctCount}`,
  );

  // --- the statistics queries actually run in Postgres --------------------
  console.log("\nstatistics");
  const heatmap = await getHeatmap(userId, 60);
  fail("heatmap returns a cell for every day", heatmap.length === 61);
  fail(
    "and today's cell carries the attempts",
    heatmap.at(-1)?.attempts === QUESTIONS,
  );

  const streak = await getStreak(userId);
  fail("streak counts today", streak.current === 1, `current=${streak.current}`);
  fail("today is secured past the threshold", streak.todaySecured);

  const difficulty = await getDifficultyCounts(userId);
  fail(
    "difficulty counts add up",
    difficulty.reduce((sum, row) => sum + row.attempts, 0) === QUESTIONS,
  );

  const accuracy = await getAccuracyTrend(userId, 30);
  fail("accuracy trend covers the window", accuracy.length === 31);
  fail(
    "and ends on a real percentage",
    typeof accuracy.at(-1)?.accuracy === "number",
    String(accuracy.at(-1)?.accuracy),
  );

  const speed = await getSpeedByDifficulty(userId);
  fail(
    "median speed comes back per difficulty",
    speed.some((row) => row.medianSec !== null),
  );

  const trend = await getSpeedTrend(userId);
  fail("weekly speed trend runs", Array.isArray(trend));

  const progress = await getSkillProgress(userId);
  fail(
    "mastery has a row for every skill",
    progress.length > 0 && progress.every((row) => row.attempts >= 0),
  );

  const weakest = await getWeakestSkills(userId);
  fail("weakest skills query runs", Array.isArray(weakest));

  const totals = await getTotals(userId);
  fail("totals count the attempts", totals.attempts === QUESTIONS);
  fail("and derive the rules encountered", totals.rules > 0, `${totals.rules} rules`);

  const bests = await getPersonalBests(userId);
  fail(
    "longest correct run is plausible",
    bests.longestCorrectStreak >= 1 && bests.longestCorrectStreak <= QUESTIONS,
    String(bests.longestCorrectStreak),
  );
  fail(
    "a 20-question sprint was found",
    bests.fastestSprints.length > 0,
    `${bests.fastestSprints.length} topic(s)`,
  );

  // --- the review queue ---------------------------------------------------
  console.log("\nreview");
  const queueCount = await getReviewCount(userId);
  const wrongCount = QUESTIONS - correctCount;
  fail(
    "every missed question is queued",
    queueCount === wrongCount,
    `${queueCount} vs ${wrongCount}`,
  );

  const queue = await getReviewQueue(userId, 10);
  fail("the queue replays real questions", queue.length > 0);

  if (queue[0]) {
    // Getting it right takes it out of the queue: no separate "learned" flag.
    const item = queue[0];
    const replay = generateQuestion(item.generatorId, item.seed, item.difficulty);
    await recordAttempt({
      userId,
      mode: "review",
      question: replay,
      userAnswer: canonicalAnswer(replay.answer),
      isCorrect: true,
      timeMs: 3000,
      hintsUsed: 0,
      stepsRevealed: false,
    });
    const after = await getReviewCount(userId);
    fail(
      "answering it correctly removes it",
      after === queueCount - 1,
      `${after} vs ${queueCount - 1}`,
    );
  }

  // --- an exam run, through the same actions the UI calls -----------------
  console.log("\nexam");
  const examConfig = {
    skillIds: skills.slice(0, 4).map((skill) => skill.id),
    difficulties: [1, 2] as Difficulty[],
    count: 10,
    timeLimitSec: 0,
    explainMode: "onWrong" as const,
  };
  const examRefs = buildExamRefs(examConfig);
  fail("an exam deals the requested number of questions", examRefs.length === 10);
  fail(
    "and spreads them over more than one skill",
    new Set(
      examRefs.map((ref) => generateQuestion(ref.generatorId, ref.seed, ref.difficulty).skillId),
    ).size > 1,
  );

  const [examRun] = await db
    .insert(runs)
    .values({
      userId,
      mode: "exam",
      config: { ...examConfig, refs: examRefs },
      total: examRefs.length,
    })
    .returning({ id: runs.id });

  for (const ref of examRefs) {
    const question = generateQuestion(ref.generatorId, ref.seed, ref.difficulty);
    await recordAttempt({
      userId,
      mode: "exam",
      runId: examRun!.id,
      question,
      userAnswer: canonicalAnswer(question.answer),
      isCorrect: true,
      timeMs: 9000,
      hintsUsed: 0,
      stepsRevealed: false,
    });
  }

  const [examAttempts] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(attempts)
    .where(eq(attempts.runId, examRun!.id));
  fail("exam attempts are tied to the run", Number(examAttempts?.count) === 10);

  // --- the daily challenge ------------------------------------------------
  console.log("\ndaily");
  const first = await findOrCreateDailyRun(userId);
  const again = await findOrCreateDailyRun(userId);
  fail("opening the daily twice reuses one run", first.id === again.id);

  const todayRefs = dailyRefs();
  fail("the daily is five questions", todayRefs.length === DAILY_QUESTIONS);
  fail(
    "and is the same set for a second reader",
    JSON.stringify(dailyRefs()) === JSON.stringify(todayRefs),
  );

  for (const ref of todayRefs) {
    const question = generateQuestion(ref.generatorId, ref.seed, ref.difficulty);
    await recordAttempt({
      userId,
      mode: "daily",
      runId: first.id,
      question,
      userAnswer: canonicalAnswer(question.answer),
      isCorrect: true,
      timeMs: 7000,
      hintsUsed: 0,
      stepsRevealed: false,
    });
  }
  await db
    .update(runs)
    .set({ finishedAt: new Date(), correct: DAILY_QUESTIONS })
    .where(eq(runs.id, first.id));

  const dailyStreak = await getDailyStreak(userId);
  fail("finishing it starts a daily streak", dailyStreak.current === 1);
  fail("and it is marked done for today", dailyStreak.doneToday);

  // --- the admin daily reset ----------------------------------------------
  console.log("\ndaily reset");

  const resetDay = bangkokDay();
  const [beforeReset] = await db
    .select({
      attempts: dailyStats.attempts,
      correct: dailyStats.correct,
    })
    .from(dailyStats)
    .where(and(eq(dailyStats.userId, userId), eq(dailyStats.day, resetDay)));

  /*
   * The practice attempts recorded earlier in this run are on the same day.
   * They are what proves the reset rebuilds the day's rollup rather than
   * simply wiping it.
   */
  const practiceToday = Number(beforeReset?.attempts ?? 0) - DAILY_QUESTIONS;
  fail(
    "the day's rollup counted both the practice and the daily",
    practiceToday > 0,
  );

  const reset = await resetDailyRun(userId, resetDay);
  fail("resetting removes the run", reset.removedRuns === 1);
  fail(
    "and every attempt that belonged to it",
    reset.removedAttempts === DAILY_QUESTIONS,
  );

  const afterStreak = await getDailyStreak(userId);
  fail("the daily streak is rolled back with it", afterStreak.current === 0);
  fail("and today is open again", !afterStreak.doneToday);

  const [afterReset] = await db
    .select({ attempts: dailyStats.attempts })
    .from(dailyStats)
    .where(and(eq(dailyStats.userId, userId), eq(dailyStats.day, resetDay)));
  fail(
    "today's practice survived the reset",
    Number(afterReset?.attempts ?? 0) === practiceToday,
  );

  const reopened = await findOrCreateDailyRun(userId, resetDay);
  fail("and the daily can be taken again", reopened.id !== first.id);
  fail("as a fresh, unfinished run", !reopened.finished);

  const secondReset = await resetDailyRun(userId, resetDay);
  fail(
    "resetting twice is harmless",
    secondReset.removedRuns === 1 && secondReset.removedAttempts === 0,
  );

  // --- practice sessions ---------------------------------------------------
  /*
   * Practice attempts group into sessions by a gap rather than by an end
   * event, because there is no reliable end event - a learner closes the tab.
   * The thing to verify is that consecutive attempts share a run and that a
   * stale run is not adopted.
   */
  console.log("\npractice sessions");

  const firstRun = await currentPracticeRunId(userId, "practice");
  const sameRun = await currentPracticeRunId(userId, "practice");
  fail("a practice attempt opens a run", firstRun !== null);
  fail("and the next attempt joins it", firstRun === sameRun);

  const [counted] = await db
    .select({ total: runs.total })
    .from(runs)
    .where(eq(runs.id, firstRun!));
  fail("the run counts its attempts", Number(counted?.total) === 2);

  // Age the run past the gap; the next attempt must start a fresh session.
  await db
    .update(runs)
    .set({ lastAttemptAt: new Date(Date.now() - SESSION_GAP_MS - 60_000) })
    .where(eq(runs.id, firstRun!));

  const afterGap = await currentPracticeRunId(userId, "practice");
  fail("a gap starts a new session", afterGap !== firstRun && afterGap !== null);

  // Review is its own mode and must not be swept into a practice session.
  const reviewRun = await currentPracticeRunId(userId, "review");
  fail("review does not join a practice run", reviewRun !== afterGap);

  await db.delete(runs).where(
    and(eq(runs.userId, userId), eq(runs.mode, "practice")),
  );
  await db.delete(runs).where(
    and(eq(runs.userId, userId), eq(runs.mode, "review")),
  );

  // --- rate limiting -------------------------------------------------------
  /*
   * The limiter is what stands between a 12-character invite code and a
   * brute-force, and it lives in the database rather than in memory because
   * every serverless invocation is a fresh process. That means it cannot be
   * unit tested - and until now it was not tested at all. A security control
   * nobody exercises is one that stops working silently during a refactor.
   */
  console.log("\nrate limiting");

  const userBucket = `login:user:${USERNAME}`;
  const ipBucket = `login:ip:203.0.113.42`;
  await clearFailures(userBucket);
  await clearFailures(ipBucket);

  for (let i = 0; i < LOGIN_FAILURE_LIMIT - 1; i++) {
    await recordFailure(userBucket);
  }
  fail(
    `${LOGIN_FAILURE_LIMIT - 1} failures is still allowed through`,
    !(await isRateLimited([userBucket], LOGIN_FAILURE_LIMIT)),
  );

  await recordFailure(userBucket);
  fail(
    `the ${LOGIN_FAILURE_LIMIT}th trips the limiter`,
    await isRateLimited([userBucket], LOGIN_FAILURE_LIMIT),
  );

  fail(
    "and a different bucket is unaffected",
    !(await isRateLimited([ipBucket], LOGIN_FAILURE_LIMIT)),
  );

  fail(
    "any one bucket over the limit is enough",
    await isRateLimited([ipBucket, userBucket], LOGIN_FAILURE_LIMIT),
  );

  await clearFailures(userBucket);
  fail(
    "a successful login clears the bucket",
    !(await isRateLimited([userBucket], LOGIN_FAILURE_LIMIT)),
  );

  /*
   * The window is the half that cannot be checked by counting: failures older
   * than it must stop counting, or a learner who mistyped a password a
   * fortnight ago stays locked out forever.
   */
  const stale = new Date(Date.now() - RATE_LIMIT_WINDOW_MS - 60_000);
  await db.insert(authFailures).values(
    Array.from({ length: LOGIN_FAILURE_LIMIT + 2 }, () => ({
      key: userBucket,
      createdAt: stale,
    })),
  );
  fail(
    "failures older than the window no longer count",
    !(await isRateLimited([userBucket], LOGIN_FAILURE_LIMIT)),
  );

  await purgeOldFailures();
  const [leftover] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(authFailures)
    .where(eq(authFailures.key, userBucket));
  fail("and purging removes them", Number(leftover?.n) === 0);

  await clearFailures(userBucket);
  await clearFailures(ipBucket);

  // --- clean up -----------------------------------------------------------
  await db.delete(users).where(eq(users.id, userId));
  await db.delete(inviteCodes).where(eq(inviteCodes.id, invite!.id));

  const [left] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(attempts)
    .where(eq(attempts.userId, userId));
  fail("deleting the user cascaded to the attempts", Number(left?.count) === 0);

  console.log(
    failures === 0
      ? "\nAll smoke checks passed.\n"
      : `\n${failures} check(s) FAILED.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

function canonicalAnswer(answer: {
  kind: string;
  value?: string | number;
  values?: string[];
  correct?: string;
}): string {
  switch (answer.kind) {
    case "exact":
      return String(answer.value);
    case "numeric":
      return String(answer.value);
    case "set":
      return (answer.values ?? []).join(", ");
    default:
      return String(answer.correct);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
