"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Lightbulb, RotateCw, X } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import type { L, PublicQuestion, Step } from "@/content/types";
import {
  explainAction,
  hintAction,
  nextQuestionAction,
  type SubmitResult,
} from "@/lib/practice/actions";
import { submitAnswerAction } from "@/lib/practice/actions";
import { recordLessonTestAction } from "@/lib/learn/actions";
import type { LessonResult } from "@/lib/learn/progress";
import type { PracticeConfig } from "@/lib/practice/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import {
  AnswerInput,
  type AnswerInputHandle,
} from "@/components/math/answer-input";
import { AnswerText } from "@/components/math/answer-text";
import { useXpReporter } from "@/components/profile/xp-context";
import { MathText } from "@/components/math/math-text";
import { QuestionDisplay } from "@/components/math/question-display";
import { StepViewer } from "@/components/math/step-viewer";
import { cn } from "@/lib/utils";

type Phase = "answering" | "answered";

type Tally = { asked: number; correct: number; streak: number; best: number };

/**
 * Practice mode. Minimal chrome, big centred question, keyboard driven, no
 * page transition between questions (PROMPT.md §10).
 *
 * The client holds no answer key: it posts the question id back and the server
 * regenerates the question to mark it.
 */
export function PracticeRunner({
  config,
  first,
  queue,
  mode = "practice",
  assess,
  ruleNames,
  skillNames,
  difficultyLabels,
}: {
  config: PracticeConfig;
  first: PublicQuestion;
  /**
   * Review mode walks a fixed list of missed questions instead of drawing a
   * fresh one each time, so the learner meets the identical question again.
   */
  queue?: PublicQuestion[];
  mode?: "practice" | "review";
  /**
   * Set when this run is a lesson's test rather than practice. The score is
   * filed when the queue runs out, and the finish screen says whether it
   * passed. Only meaningful with a queue - a test with no end cannot be sat.
   */
  assess?: { skillId: string };
  ruleNames: Record<string, { th: string; en: string }>;
  skillNames: Record<string, { th: string; en: string }>;
  difficultyLabels: Record<number, { th: string; en: string }>;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("practice");

  const [question, setQuestion] = useState(first);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<Phase>("answering");
  const [outcome, setOutcome] = useState<SubmitResult | null>(null);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [hints, setHints] = useState<L[]>([]);
  const [revealedBeforeAnswering, setRevealedBeforeAnswering] = useState(false);
  const [tally, setTally] = useState<Tally>({
    asked: 0,
    correct: 0,
    streak: 0,
    best: 0,
  });
  const [pending, startTransition] = useTransition();
  const [queueIndex, setQueueIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  /*
   * XP goes to the header, where the learner's own face already is. The runner
   * only says what was earned; the level and the award are drawn up there.
   */
  const reportXp = useXpReporter();

  /** The verdict on a lesson test, once the queue has run out and it is filed. */
  const [verdict, setVerdict] = useState<LessonResult | null>(null);

  // Set in an effect, not during render: reading the clock while rendering is
  // impure and React may render more than once.
  const startedAt = useRef(0);
  const inputRef = useRef<AnswerInputHandle>(null);

  const reset = useCallback((next: PublicQuestion) => {
    setQuestion(next);
    setAnswer("");
    setPhase("answering");
    setOutcome(null);
    setSteps(null);
    setHints([]);
    setRevealedBeforeAnswering(false);
    startedAt.current = Date.now();
  }, []);

  const submit = useCallback(() => {
    if (phase !== "answering" || pending) return;
    if (answer.trim() === "") return;
    const elapsed = Date.now() - (startedAt.current || Date.now());

    startTransition(async () => {
      const result = await submitAnswerAction({
        questionId: question.id,
        answer,
        timeMs: elapsed,
        hintsUsed: hints.length,
        stepsRevealed: revealedBeforeAnswering,
        mode,
      });
      setOutcome(result);
      setSteps(result.steps);
      setPhase("answered");
      // A wrong answer still earns something, so this is not inside a branch.
      reportXp(result.award);
      setTally((current) => {
        const streak = result.result.correct ? current.streak + 1 : 0;
        return {
          asked: current.asked + 1,
          correct: current.correct + (result.result.correct ? 1 : 0),
          streak,
          best: Math.max(streak, current.best),
        };
      });
    });
  }, [
    answer,
    hints.length,
    mode,
    pending,
    phase,
    question.id,
    reportXp,
    revealedBeforeAnswering,
  ]);

  const next = useCallback(() => {
    if (pending) return;
    if (queue) {
      const position = queueIndex + 1;
      if (position >= queue.length) {
        setFinished(true);
        /*
         * Filed here, at the one moment the run is known to be over, rather
         * than from an effect watching `finished` - which would fire again on
         * any later re-render and post the same test twice.
         */
        if (assess) {
          startTransition(async () => {
            setVerdict(
              await recordLessonTestAction({
                skillId: assess.skillId,
                correct: tally.correct,
                asked: tally.asked,
                locale,
              }),
            );
          });
        }
        return;
      }
      setQueueIndex(position);
      reset(queue[position]!);
      inputRef.current?.focus();
      return;
    }
    startTransition(async () => {
      reset(await nextQuestionAction(config));
      inputRef.current?.focus();
    });
  }, [
    assess,
    config,
    locale,
    pending,
    queue,
    queueIndex,
    reset,
    tally.asked,
    tally.correct,
  ]);

  const explain = useCallback(() => {
    if (steps) return;
    if (phase === "answering") setRevealedBeforeAnswering(true);
    startTransition(async () => {
      const { steps: revealed } = await explainAction(question.id);
      setSteps(revealed);
    });
  }, [phase, question.id, steps]);

  const takeHint = useCallback(() => {
    if (hints.length >= question.hintCount) return;
    startTransition(async () => {
      const hint = await hintAction(question.id, hints.length);
      if (hint) setHints((current) => [...current, hint]);
    });
  }, [hints.length, question.hintCount, question.id]);

  useEffect(() => {
    startedAt.current = Date.now();
  }, [question.id]);

  /**
   * The current question lives in the URL, so switching language mid-question
   * comes back to the same question rather than a fresh one (PROMPT.md §10).
   * replaceState rather than a router push: this is not a navigation.
   */
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("q") === question.id) return;
    url.searchParams.set("q", question.id);
    window.history.replaceState(null, "", url);
  }, [question.id]);

  // Monkeytype-style: hands stay on the keyboard.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" && phase === "answered") {
        event.preventDefault();
        next();
        return;
      }
      const typing =
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement;
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        explain();
      }
      if (event.key.toLowerCase() === "h") {
        event.preventDefault();
        takeHint();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [explain, next, phase, takeHint]);

  const correct = outcome?.result.correct === true;
  const formFeedback =
    outcome && !outcome.result.correct && outcome.result.reason === "form"
      ? t(`formError.${outcome.result.requirement}`)
      : null;
  const unparseable =
    outcome &&
    !outcome.result.correct &&
    outcome.result.reason === "unparseable";
  const incomplete =
    outcome && !outcome.result.correct && outcome.result.reason === "incomplete"
      ? outcome.result
      : null;

  if (finished) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 text-center">
        {/*
          A test says whether you passed before it says anything else, because
          that is the only thing anyone is looking for on this screen.
        */}
        {assess ? (
          <div className="space-y-2">
            <div
              className={cn(
                "mx-auto flex size-14 items-center justify-center rounded-full",
                verdict?.passed
                  ? "bg-correct/15 text-correct"
                  : "bg-wrong/15 text-wrong",
              )}
            >
              {verdict?.passed ? (
                <Check className="size-7" />
              ) : (
                <X className="size-7" />
              )}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {verdict?.passed ? t("testPassed") : t("testFailed")}
            </h2>
            {verdict ? (
              <p className="text-sm text-muted">
                {t("testScore", {
                  score: verdict.score,
                  total: tally.asked,
                  needed: verdict.needed,
                })}
              </p>
            ) : null}
          </div>
        ) : (
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("queueDone")}
          </h2>
        )}

        <Scoreboard tally={tally} labels={t} />
        {assess ? null : (
          <p className="text-sm text-muted">
            {mode === "review" ? t("queueDoneBody") : t("runDoneBody")}
          </p>
        )}

        {/*
         * A finished run is the one moment a learner is certain to be at a
         * loose end, and in practice mode they reach it every time rather than
         * only after clearing a review queue. Both of the things they are
         * likely to want next are here, so neither is a trip through the nav.
         */}
        {mode === "practice" ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {/*
             * Not a reload. The seed lives in the URL - that is what makes a
             * run survive a refresh - so reloading would deal the identical
             * questions back. Dropping it asks the server for a new plan.
             */}
            <Button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.delete("run");
                url.searchParams.delete("q");
                window.location.href = url.toString();
              }}
            >
              {assess ? t("testAgain") : t("runAgain")}
            </Button>
            <Link
              href={assess ? `/learn/${assess.skillId}` : "/practice"}
              className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
            >
              {assess ? t("backToLesson") : t("changeSelection")}
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 pb-16 sm:pb-0">
      <Scoreboard tally={tally} labels={t} />

      {queue ? (
        <p className="text-center font-mono text-xs tabular-nums text-muted">
          {t("queueProgress", {
            index: queueIndex + 1,
            total: queue.length,
          })}
        </p>
      ) : null}

      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <Badge>
              {skillNames[question.skillId]?.[locale] ?? question.skillId}
            </Badge>
            <Badge tone="accent">
              {difficultyLabels[question.difficulty]?.[locale]}
            </Badge>
          </div>
        </div>

        <QuestionDisplay
          prompt={question.prompt[locale]}
          stem={question.stem}
        />

        {question.choices ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {question.choices.map((choice) => (
              <Button
                key={choice.id}
                variant={answer === choice.id ? "primary" : "outline"}
                disabled={phase === "answered" || pending}
                onClick={() => {
                  setAnswer(choice.id);
                }}
              >
                {choice.label}
              </Button>
            ))}
          </div>
        ) : (
          <AnswerInput
            handleRef={inputRef}
            value={answer}
            onChange={setAnswer}
            onSubmit={submit}
            disabled={phase === "answered" || pending}
            state={
              phase === "answered" ? (correct ? "correct" : "wrong") : "idle"
            }
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          {phase === "answering" ? (
            <Button onClick={submit} disabled={pending || answer.trim() === ""}>
              {t("submit")}
            </Button>
          ) : (
            <Button onClick={next} disabled={pending}>
              <RotateCw className="h-4 w-4" />
              {t("nextQuestion")}
            </Button>
          )}

          <Button variant="ghost" onClick={takeHint} disabled={pending}>
            <Lightbulb className="h-4 w-4" />
            {t("hint")}
            {question.hintCount > 0 ? (
              <span className="text-xs tabular-nums">
                {hints.length}/{question.hintCount}
              </span>
            ) : null}
          </Button>

          <Button variant="ghost" onClick={explain} disabled={pending}>
            {t("explain")}
          </Button>

          {/*
            Four shortcuts as a run-on sentence ("Enter ส่งคำตอบ · E อธิบาย · …")
            was a line of prose nobody reads twice. As keycaps it is a picture
            of the keyboard: the shape says "these are keys" before any of the
            words are read, and the eye can find the one it wants.
          */}
          <span className="ml-auto hidden items-center gap-3 text-xs text-muted sm:flex">
            <Shortcut keyLabel="Enter" action={t("submit")} />
            <Shortcut keyLabel="E" action={t("explain")} />
            <Shortcut keyLabel="H" action={t("hintWord")} />
            <Shortcut keyLabel="?" action={t("shortcutsWord")} />
          </span>
        </div>

        {hints.length > 0 ? (
          <ul className="space-y-2">
            {hints.map((hint, index) => (
              <li
                key={index}
                className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-sm"
              >
                <MathText text={hint[locale]} />
              </li>
            ))}
          </ul>
        ) : null}

        {outcome ? (
          <div
            className={cn(
              "rounded-lg border px-4 py-3",
              correct
                ? "border-correct/40 bg-correct/10"
                : "border-wrong/40 bg-wrong/10",
            )}
          >
            <p
              className={cn(
                "flex items-center gap-2 font-medium",
                correct ? "text-correct" : "text-wrong",
              )}
            >
              {correct ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              {correct ? t("correct") : t("incorrect")}
            </p>

            {!correct ? (
              <div className="mt-2 space-y-1 text-sm">
                {outcome.misconception ? (
                  <p className="rounded-md border border-border bg-surface px-3 py-2 text-fg">
                    <MathText text={outcome.misconception[locale]} />
                  </p>
                ) : null}
                {formFeedback ? (
                  <p className="text-muted">{formFeedback}</p>
                ) : null}
                {incomplete ? (
                  <p className="text-muted">
                    {t("incompleteSet", {
                      found: incomplete.found,
                      expected: incomplete.expected,
                    })}
                  </p>
                ) : null}
                {unparseable ? (
                  <p className="text-muted">{t("couldNotRead")}</p>
                ) : null}
                <p className="flex flex-wrap items-center gap-x-2 text-muted">
                  {t("youAnswered")}{" "}
                  <AnswerText value={answer} className="text-fg" />
                </p>
                <p className="flex flex-wrap items-center gap-x-2 text-muted">
                  {t("theAnswerIs")}{" "}
                  <AnswerText
                    value={outcome.correctAnswer}
                    className="text-fg"
                  />
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {steps ? (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted">
              {t("workingOut")}
            </h2>
            <StepViewer
              steps={steps}
              ruleNames={ruleNames}
              startRevealed={phase === "answered" ? steps.length : 1}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Scoreboard({
  tally,
  labels,
}: {
  tally: Tally;
  labels: (key: string) => string;
}) {
  const accuracy =
    tally.asked === 0 ? 0 : Math.round((tally.correct / tally.asked) * 100);

  return (
    <dl className="flex items-center justify-center gap-8 text-center">
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted">
          {labels("answered")}
        </dt>
        <dd className="font-mono text-2xl tabular-nums">{tally.asked}</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted">
          {labels("accuracy")}
        </dt>
        <dd className="font-mono text-2xl tabular-nums">{accuracy}%</dd>
      </div>
      <div>
        <dt className="text-xs uppercase tracking-wide text-muted">
          {labels("streak")}
        </dt>
        <dd className="font-mono text-2xl tabular-nums">{tally.streak}</dd>
      </div>
    </dl>
  );
}

/** One keyboard shortcut, drawn as a keycap rather than written out. */
function Shortcut({ keyLabel, action }: { keyLabel: string; action: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] leading-none text-fg">
        {keyLabel}
      </kbd>
      {action}
    </span>
  );
}
