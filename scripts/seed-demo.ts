/**
 * `pnpm db:seed:demo` - a demo account with a few weeks of plausible history.
 *
 * The statistics pages are the point of the app and they are impossible to
 * judge against an empty database, so this fills one in: real generated
 * questions, real marking, spread across real days, with accuracy that
 * improves the way a person's does.
 *
 * `pnpm db:seed:demo -- --clean` removes it again.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../lib/db";
import {
  attempts,
  dailyStats,
  skillMastery,
  users,
} from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";
import { createRng } from "../content/rng";
import { generateQuestion, generators } from "../content/generators";
import { getSkill } from "../content/topics";
import { checkAnswer } from "../lib/math/check";
import { bangkokDay, previousDay } from "../lib/stats/day";
import {
  EMA_ALPHA,
  STREAK_MIN_ATTEMPTS,
  masteryLevel,
  xpFor,
} from "../lib/stats/constants";
import { refuseInProduction } from "./guard-production";

refuseInProduction("pnpm db:seed:demo");

const USERNAME = "demo";
const PASSWORD = process.env.DEMO_PASSWORD ?? "derive-demo-2026";
const DAYS = 42;

async function clean() {
  await db.delete(users).where(eq(users.username, USERNAME));
  console.log(`Removed the "${USERNAME}" account and everything under it.`);
}

async function seed() {
  await db.delete(users).where(eq(users.username, USERNAME));

  const [user] = await db
    .insert(users)
    .values({
      username: USERNAME,
      passwordHash: await hashPassword(PASSWORD),
      displayName: "เดโม",
    })
    .returning({ id: users.id });
  const userId = user!.id;

  const rng = createRng(20260919);

  // Walk backwards from today so the most recent days are the busiest.
  const days: string[] = [];
  let cursor = bangkokDay();
  for (let i = 0; i < DAYS; i++) {
    days.push(cursor);
    cursor = previousDay(cursor);
  }
  days.reverse();

  type Row = typeof attempts.$inferInsert;
  const rows: Row[] = [];
  const daily = new Map<
    string,
    { attempts: number; correct: number; timeMs: number; xp: number }
  >();
  const mastery = new Map<
    string,
    { attempts: number; correct: number; ema: number }
  >();

  let seed = 1;
  days.forEach((day, dayIndex) => {
    // Two rest days a week, and a slow start that builds.
    if (rng.next() < 0.2) return;
    const ramp = dayIndex / DAYS;
    const count = Math.round(6 + ramp * 22 + rng.int(0, 8));

    for (let i = 0; i < count; i++) {
      const generator = rng.pick(generators);
      const difficulty = rng.pick(generator.difficulties);
      const question = generateQuestion(generator.id, seed++, difficulty);
      const skill = getSkill(question.skillId);

      // Accuracy climbs from about 55% to about 88% over the period, and
      // harder questions stay harder.
      const base = 0.55 + ramp * 0.33 - (difficulty - 1) * 0.06;
      const correct = rng.next() < base;

      const canonical = canonicalAnswer(question.answer);
      const userAnswer = correct ? canonical : `${canonical} + 1`;
      // Mark it for real rather than trusting the coin flip.
      const marked = checkAnswer(question.answer, userAnswer, skill.strictForm);

      const timeMs = Math.round(
        (9000 - ramp * 3500 + difficulty * 2500) * (0.6 + rng.next() * 0.9),
      );
      const createdAt = new Date(`${day}T${clock(i, count)}+07:00`);

      rows.push({
        userId,
        mode: rng.next() < 0.12 ? "review" : "practice",
        topicId: question.topicId,
        skillId: question.skillId,
        generatorId: question.generatorId,
        seed: seedOf(question.id),
        difficulty,
        questionSnapshot: {
          stem: question.stem,
          prompt: question.prompt,
          answer: question.answer,
          steps: question.steps,
          provenance: question.provenance,
        },
        userAnswer,
        isCorrect: marked.correct,
        timeMs,
        hintsUsed: rng.next() < 0.15 ? 1 : 0,
        stepsRevealed: rng.next() < 0.2,
        day,
        createdAt,
      });

      const dayTotals = daily.get(day) ?? {
        attempts: 0,
        correct: 0,
        timeMs: 0,
        xp: 0,
      };
      dayTotals.attempts += 1;
      dayTotals.correct += marked.correct ? 1 : 0;
      dayTotals.timeMs += timeMs;
      dayTotals.xp += xpFor(difficulty, marked.correct);
      daily.set(day, dayTotals);

      const skillTotals = mastery.get(question.skillId) ?? {
        attempts: 0,
        correct: 0,
        ema: 0,
      };
      const outcome = marked.correct ? 1 : 0;
      skillTotals.ema =
        skillTotals.attempts === 0
          ? outcome
          : skillTotals.ema * (1 - EMA_ALPHA) + outcome * EMA_ALPHA;
      skillTotals.attempts += 1;
      skillTotals.correct += outcome;
      mastery.set(question.skillId, skillTotals);
    }
  });

  // Insert in batches: a few thousand rows in one statement is asking for it.
  for (let i = 0; i < rows.length; i += 200) {
    await db.insert(attempts).values(rows.slice(i, i + 200));
  }

  await db.insert(dailyStats).values(
    [...daily.entries()].map(([day, totals]) => ({
      userId,
      day,
      attempts: totals.attempts,
      correct: totals.correct,
      timeMs: totals.timeMs,
      xp: totals.xp,
    })),
  );

  await db.insert(skillMastery).values(
    [...mastery.entries()].map(([skillId, totals]) => ({
      userId,
      skillId,
      attempts: totals.attempts,
      correct: totals.correct,
      emaAccuracy: totals.ema,
      level: masteryLevel(totals.attempts, totals.ema),
      updatedAt: new Date(),
    })),
  );

  // The streak is whatever the qualifying days actually say it is.
  const qualifying = new Set(
    [...daily.entries()]
      .filter(([, totals]) => totals.attempts >= STREAK_MIN_ATTEMPTS)
      .map(([day]) => day),
  );
  let current = 0;
  let walk = bangkokDay();
  while (qualifying.has(walk)) {
    current += 1;
    walk = previousDay(walk);
  }
  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of [...qualifying].sort()) {
    run = previous !== null && previousDay(day) === previous ? run + 1 : 1;
    previous = day;
    longest = Math.max(longest, run);
  }

  const lastActive = [...qualifying].sort().at(-1) ?? null;
  await db
    .update(users)
    .set({ currentStreak: current, longestStreak: longest, lastActiveDay: lastActive })
    .where(eq(users.id, userId));

  const [check] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(attempts)
    .where(and(eq(attempts.userId, userId)));

  console.log(
    [
      `Seeded "${USERNAME}" / ${PASSWORD}`,
      `  ${check?.count} attempts across ${daily.size} days`,
      `  streak ${current}, longest ${longest}`,
      `  ${mastery.size} skills practised`,
    ].join("\n"),
  );
}

function clock(index: number, total: number): string {
  // Spread a day's questions over an evening, in order.
  const minutes = Math.round(18 * 60 + (index / Math.max(1, total)) * 110);
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}:00`;
}

function seedOf(questionId: string): number {
  const parts = questionId.split(":");
  return Number(parts[parts.length - 2]) || 0;
}

function canonicalAnswer(answer: {
  kind: string;
  value?: string | number;
  values?: string[];
  correct?: string;
}): string {
  switch (answer.kind) {
    case "exact":
    case "numeric":
      return String(answer.value);
    case "set":
      return (answer.values ?? []).join(", ");
    default:
      return String(answer.correct);
  }
}

const run = process.argv.includes("--clean") ? clean : seed;
run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
