"use server";

import { revalidatePath } from "next/cache";
import { generateQuestion, toPublicQuestion } from "@/content/generators";
import { getSkill } from "@/content/topics";
import type { FormRequirement } from "@/content/types";
import type { L, Misconception, PublicQuestion, Step } from "@/content/types";
import { checkAnswer, type CheckResult } from "@/lib/math/check";
import { getSessionUser } from "@/lib/auth/session";
import { recordAttempt } from "@/lib/stats/record";
import type { XpAward } from "@/lib/stats/constants";
import { countPracticeCorrect, currentPracticeRunId } from "./run";
import { recordReview } from "@/lib/review/due";
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
  /**
   * Set when the wrong answer is a *recognised* wrong answer - the one a
   * particular mistake produces. Naming the mistake is the difference between
   * "wrong" and a lesson.
   */
  misconception?: L;
  /** What this attempt earned, itemised, so the meter can show why. */
  award: XpAward;
  /**
   * The shape this skill insists on, or null when any equivalent form counts.
   *
   * Sent so the feedback can say what else would have been accepted. That is
   * the question a learner asks on being shown an answer that looks nothing
   * like theirs - "would mine have done?" - and the honest answer depends
   * entirely on this. For a factorising skill it is emphatically not "any
   * equivalent form": the expanded version is the question, not the answer.
   */
  acceptedForm: FormRequirement | null;
};

export async function submitAnswerAction(input: {
  questionId: string;
  answer: string;
  timeMs: number;
  hintsUsed: number;
  stepsRevealed: boolean;
  /** Re-drilling a missed question records as `review`, not `practice`. */
  mode?: "practice" | "review";
}): Promise<SubmitResult> {
  const userId = await requireUserId();
  const ref = parseQuestionId(input.questionId);
  if (!ref) throw new Error("Unknown question");

  const question = generateQuestion(ref.generatorId, ref.seed, ref.difficulty);
  const skill = getSkill(question.skillId);
  const result = checkAnswer(question.answer, input.answer, skill.strictForm);

  const mode = input.mode === "review" ? "review" : "practice";

  /*
   * Group the attempt into a session. Practice has no end event to hang this
   * on, so sessions are bounded by a gap - see `lib/practice/run.ts`. This
   * returns null rather than throwing if anything goes wrong: losing the
   * grouping on one attempt is a small loss, losing the attempt is not.
   */
  const runId = await currentPracticeRunId(userId, mode);

  const { award } = await recordAttempt({
    userId,
    mode,
    ...(runId ? { runId } : {}),
    question,
    userAnswer: input.answer,
    isCorrect: result.correct,
    timeMs: input.timeMs,
    hintsUsed: clampHints(input.hintsUsed, question.hints.length),
    stepsRevealed: Boolean(input.stepsRevealed),
  });

  if (runId && result.correct) await countPracticeCorrect(runId);

  /*
   * Every answered question is a review of its skill, whether it arrived
   * through the due queue or through ordinary practice. Scheduling only what
   * the queue served would keep asking for skills the learner had just drilled
   * by choice, which is the fastest way to make the count feel wrong.
   */
  await recordReview(userId, question.skillId, result.correct);

  /**
   * The pages this answer just changed the numbers on.
   *
   * Nothing needed this while nothing was cached, and the app was correct by
   * accident: every navigation re-rendered from the database, so every figure
   * was current whether or not anyone had said so. Prefetching ends that.
   * A fully prefetched route is held in the client router cache for five
   * minutes, so without this you could answer twenty questions and open
   * สถิติ on the numbers you had before you started - which in an app whose
   * whole point is watching those numbers move is a worse bug than the
   * slowness the prefetching was for.
   *
   * The dashboard, statistics and the review queue are the three that move on
   * every answer. `/learn` and the setup pages show *lessons passed*, which an
   * answer does not change - passing a lesson does, and `lib/learn/actions.ts`
   * already revalidates there.
   *
   * The `[locale]` form invalidates every locale at once, which matters
   * because a learner can switch language mid-run.
   */
  for (const path of ["/[locale]", "/[locale]/stats", "/[locale]/review"]) {
    revalidatePath(path, "page");
  }

  return {
    result,
    award,
    acceptedForm: skill.strictForm,
    correctAnswer: displayAnswer(question),
    steps: question.steps,
    ...(result.correct
      ? {}
      : { misconception: matchMisconception(question, input.answer) }),
  };
}

/** Which named mistake, if any, produces the answer that was given. */
function matchMisconception(
  question: { misconceptions?: Misconception[] },
  raw: string,
): L | undefined {
  for (const candidate of question.misconceptions ?? []) {
    // No form requirement: the mistake is about the value, not its shape.
    if (checkAnswer(candidate.answer, raw).correct) return candidate.explain;
  }
  return undefined;
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
