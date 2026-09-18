"use server";

import { generateQuestion, toPublicQuestion } from "@/content/generators";
import { getSkill } from "@/content/topics";
import type { L, PublicQuestion, Step } from "@/content/types";
import { checkAnswer, type CheckResult } from "@/lib/math/check";
import { getSessionUser } from "@/lib/auth/session";
import { recordAttempt } from "@/lib/stats/record";
import {
  nextQuestionRef,
  normalizeConfig,
  parseQuestionId,
  type PracticeConfig,
} from "./session";

/**
 * Everything the practice loop needs, as server actions.
 *
 * The client is never sent `answer`, `steps` or an unrequested hint. It sends
 * back only the question id, and the server regenerates the question from
 * `(generatorId, seed, difficulty)` - so there is nothing on the client worth
 * tampering with (PROMPT.md §6.4).
 */

async function requireUserId(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new Error("Not signed in");
  return user.id;
}

export async function nextQuestionAction(
  config: PracticeConfig,
): Promise<PublicQuestion> {
  await requireUserId();
  const safe = normalizeConfig(config);
  const ref = nextQuestionRef(safe);
  return toPublicQuestion(
    generateQuestion(ref.generatorId, ref.seed, ref.difficulty),
  );
}

export type SubmitResult = {
  result: CheckResult;
  /** The answer as the app would write it, for the "you said / it is" line. */
  correctAnswer: string;
  steps: Step[];
};

export async function submitAnswerAction(input: {
  questionId: string;
  answer: string;
  timeMs: number;
  hintsUsed: number;
  stepsRevealed: boolean;
}): Promise<SubmitResult> {
  const userId = await requireUserId();
  const ref = parseQuestionId(input.questionId);
  if (!ref) throw new Error("Unknown question");

  const question = generateQuestion(ref.generatorId, ref.seed, ref.difficulty);
  const skill = getSkill(question.skillId);
  const result = checkAnswer(question.answer, input.answer, skill.strictForm);

  await recordAttempt({
    userId,
    mode: "practice",
    question,
    userAnswer: input.answer,
    isCorrect: result.correct,
    timeMs: input.timeMs,
    hintsUsed: clampHints(input.hintsUsed, question.hints.length),
    stepsRevealed: Boolean(input.stepsRevealed),
  });

  return {
    result,
    correctAnswer: displayAnswer(question),
    steps: question.steps,
  };
}

/** One hint at a time, in order. Nothing past the one that was asked for. */
export async function hintAction(
  questionId: string,
  index: number,
): Promise<L | null> {
  await requireUserId();
  const ref = parseQuestionId(questionId);
  if (!ref) throw new Error("Unknown question");
  const question = generateQuestion(ref.generatorId, ref.seed, ref.difficulty);
  return question.hints[index] ?? null;
}

/**
 * The learner asked to be shown the working before answering. That is allowed
 * - it is how Learn mode works - and the attempt records that it happened.
 */
export async function explainAction(questionId: string): Promise<{
  steps: Step[];
  correctAnswer: string;
}> {
  await requireUserId();
  const ref = parseQuestionId(questionId);
  if (!ref) throw new Error("Unknown question");
  const question = generateQuestion(ref.generatorId, ref.seed, ref.difficulty);
  return { steps: question.steps, correctAnswer: displayAnswer(question) };
}

function clampHints(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(Math.round(value), max);
}

function displayAnswer(question: {
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
