"use server";

import { and, eq, sql } from "drizzle-orm";
import { generateQuestion, toPublicQuestion } from "@/content/generators";
import { getSkill } from "@/content/topics";
import type { PublicQuestion, Step } from "@/content/types";
import { checkAnswer } from "@/lib/math/check";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { attempts, runs } from "@/lib/db/schema";
import { recordAttempt } from "@/lib/stats/record";
import { parseQuestionId } from "@/lib/practice/session";
import { redirect } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import {
  asExamRunConfig,
  buildExamRefs,
  examConfigFromSearchParams,
  isExplainMode,
  type ExamConfig,
  type ExplainMode,
} from "./session";

function readLocale(formData: FormData): Locale {
  const value = String(formData.get("locale") ?? "");
  return (routing.locales as readonly string[]).includes(value)
    ? (value as Locale)
    : routing.defaultLocale;
}

/** The setup form and a shared URL describe an exam the same way. */
function examConfigFromForm(formData: FormData): ExamConfig {
  const params: Record<string, string | string[]> = {
    skills: formData.getAll("skills").map(String),
    difficulty: formData.getAll("difficulty").map(String),
    count: String(formData.get("count") ?? ""),
    minutes: String(formData.get("minutes") ?? ""),
    explain: String(formData.get("explain") ?? ""),
  };
  return examConfigFromSearchParams(params);
}

/**
 * An exam is a `runs` row plus the attempts that point at it. Answers are
 * recorded as they are given, so a run that times out or is abandoned still
 * counts what was actually done.
 */

async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

export async function startExamAction(config: ExamConfig): Promise<{
  runId: string;
  questions: PublicQuestion[];
}> {
  const userId = await requireUserId();
  const refs = buildExamRefs(config);

  const [run] = await db
    .insert(runs)
    .values({
      userId,
      mode: "exam",
      config: { ...config, refs },
      total: refs.length,
    })
    .returning({ id: runs.id });

  return {
    runId: run!.id,
    questions: refs.map((ref) =>
      toPublicQuestion(
        generateQuestion(ref.generatorId, ref.seed, ref.difficulty),
      ),
    ),
  };
}

export type ExamAnswerResult = {
  correct: boolean;
  /** Only when the run's `explainMode` allows it. Never inferred client-side. */
  steps: Step[] | null;
  correctAnswer: string | null;
};

export async function answerExamQuestionAction(input: {
  runId: string;
  questionId: string;
  answer: string;
  timeMs: number;
}): Promise<ExamAnswerResult> {
  const userId = await requireUserId();
  const run = await loadRun(input.runId, userId);
  const config = asExamRunConfig(run.config);
  if (!config) throw new Error("Malformed exam run");

  const ref = parseQuestionId(input.questionId);
  if (!ref) throw new Error("Unknown question");
  if (
    !config.refs.some(
      (candidate) =>
        candidate.generatorId === ref.generatorId &&
        candidate.seed === ref.seed &&
        candidate.difficulty === ref.difficulty,
    )
  ) {
    throw new Error("That question is not part of this exam");
  }

  const question = generateQuestion(ref.generatorId, ref.seed, ref.difficulty);
  const skill = getSkill(question.skillId);
  const result = checkAnswer(question.answer, input.answer, skill.strictForm);

  await recordAttempt({
    // A daily challenge runs through the same machinery; the run says which.
    userId,
    mode: run.mode,
    runId: input.runId,
    question,
    userAnswer: input.answer,
    isCorrect: result.correct,
    timeMs: input.timeMs,
    hintsUsed: 0,
    stepsRevealed: config.explainMode === "always",
  });

  const show =
    config.explainMode === "always" ||
    (config.explainMode === "onWrong" && !result.correct);

  return {
    correct: result.correct,
    steps: show ? question.steps : null,
    correctAnswer: show ? describeAnswer(question) : null,
  };
}

export async function finishExamAction(runId: string): Promise<void> {
  const userId = await requireUserId();
  const run = await loadRun(runId, userId);
  if (run.finishedAt) return;

  const [totals] = await db
    .select({
      answered: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${attempts.isCorrect})::int`,
      timeMs: sql<number>`coalesce(sum(${attempts.timeMs}), 0)::int`,
    })
    .from(attempts)
    .where(and(eq(attempts.runId, runId), eq(attempts.userId, userId)));

  const finishedAt = new Date();
  await db
    .update(runs)
    .set({
      finishedAt,
      correct: totals?.correct ?? 0,
      durationMs: finishedAt.getTime() - run.startedAt.getTime(),
    })
    .where(eq(runs.id, runId));
}

/** The one place that decides whether a run belongs to the caller. */
async function loadRun(runId: string, userId: string) {
  const [run] = await db
    .select()
    .from(runs)
    .where(and(eq(runs.id, runId), eq(runs.userId, userId)))
    .limit(1);
  if (!run) throw new Error("Unknown run");
  return run;
}

function describeAnswer(question: {
  answer:
    | { kind: "exact"; value: string }
    | { kind: "numeric"; value: number; tol: number }
    | { kind: "set"; values: string[] }
    | { kind: "choice"; correct: string };
  choices?: { id: string; label: string }[];
}): string {
  const { answer } = question;
  switch (answer.kind) {
    case "exact":
      return answer.value;
    case "numeric":
      return String(answer.value);
    case "set":
      return answer.values.join(", ");
    case "choice":
      return (
        question.choices?.find((choice) => choice.id === answer.correct)
          ?.label ?? answer.correct
      );
  }
}

/**
 * The setup form posts here. Creating the run server-side and redirecting to
 * `/exam/{runId}` means refreshing the page cannot start a second exam.
 */
export async function startExamFormAction(formData: FormData): Promise<void> {
  const locale = readLocale(formData);
  const config = examConfigFromForm(formData);
  const { runId } = await startExamAction(config);
  redirect({ href: `/exam/${runId}`, locale });
}

/**
 * `explainMode` is toggleable mid-test (PROMPT.md §2, Phase 2). It lives on
 * the run rather than in client state, because the server is what decides
 * whether the steps are allowed to cross the wire.
 */
export async function setExplainModeAction(
  runId: string,
  mode: string,
): Promise<ExplainMode> {
  const userId = await requireUserId();
  const run = await loadRun(runId, userId);
  const config = asExamRunConfig(run.config);
  if (!config) throw new Error("Malformed exam run");
  if (!isExplainMode(mode)) throw new Error("Unknown explain mode");

  await db
    .update(runs)
    .set({ config: { ...config, explainMode: mode } })
    .where(eq(runs.id, runId));

  return mode;
}
