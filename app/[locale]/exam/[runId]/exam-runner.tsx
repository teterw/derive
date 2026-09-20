"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  SkipForward,
  X,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import type { PublicQuestion, Step } from "@/content/types";
import {
  answerExamQuestionAction,
  finishExamAction,
  setExplainModeAction,
  type ExamAnswerResult,
} from "@/lib/exam/actions";
import type { ExplainMode } from "@/lib/exam/session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/card";
import { AnswerInput } from "@/components/math/answer-input";
import { AnswerText } from "@/components/math/answer-text";
import { QuestionDisplay } from "@/components/math/question-display";
import { StepViewer } from "@/components/math/step-viewer";
import { isBlankAnswer } from "@/lib/math/mathfield-latex";
import { cn } from "@/lib/utils";

type Answered = {
  answer: string;
  correct: boolean;
  steps: Step[] | null;
  correctAnswer: string | null;
};

/**
 * สอบ. A fixed set, a clock, and no going back on an answer once given -
 * but you can move freely between questions and flag ones to come back to.
 */
export function ExamRunner({
  runId,
  questions,
  initialAnswered,
  initialExplainMode,
  timeLimitSec,
  elapsedSec,
  mode = "exam",
  skillNames,
  ruleNames,
  difficultyLabels,
}: {
  runId: string;
  questions: PublicQuestion[];
  initialAnswered: Record<string, { answer: string; correct: boolean }>;
  initialExplainMode: ExplainMode;
  timeLimitSec: number;
  elapsedSec: number;
  /** Only changes wording and how loudly finishing is guarded. */
  mode?: "exam" | "daily";
  skillNames: Record<string, { th: string; en: string }>;
  ruleNames: Record<string, { th: string; en: string }>;
  difficultyLabels: Record<number, { th: string; en: string }>;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("exam");
  const router = useRouter();

  const firstUnanswered = Math.max(
    0,
    questions.findIndex((question) => !initialAnswered[question.id]),
  );
  const [index, setIndex] = useState(
    firstUnanswered === -1 ? 0 : firstUnanswered,
  );
  const [answers, setAnswers] = useState<Record<string, Answered>>(() =>
    Object.fromEntries(
      Object.entries(initialAnswered).map(([id, value]) => [
        id,
        { ...value, steps: null, correctAnswer: null },
      ]),
    ),
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [explainMode, setExplainMode] = useState(initialExplainMode);
  const [remaining, setRemaining] = useState(
    timeLimitSec > 0 ? Math.max(0, timeLimitSec - elapsedSec) : 0,
  );
  const [pending, startTransition] = useTransition();
  const [finishing, setFinishing] = useState(false);
  const [confirmingFinish, setConfirmingFinish] = useState(false);

  const shownAt = useRef(0);
  const question = questions[index]!;
  const answered = answers[question.id];
  const answeredCount = Object.keys(answers).length;
  const draft = drafts[question.id] ?? "";

  const setDraft = useCallback(
    (value: string) => {
      setDrafts((current) => ({ ...current, [question.id]: value }));
    },
    [question.id],
  );

  useEffect(() => {
    shownAt.current = Date.now();
  }, [question.id]);

  const finish = useCallback(() => {
    if (finishing) return;
    setFinishing(true);
    startTransition(async () => {
      await finishExamAction(runId);
      router.refresh();
    });
  }, [finishing, router, runId]);

  /**
   * The clock counts down to a deadline rather than by decrementing, so a
   * backgrounded tab that stops firing timers still shows the right time when
   * it comes back. Time limit 0 means untimed and no interval starts.
   */
  useEffect(() => {
    if (timeLimitSec <= 0) return;
    const deadline = Date.now() + Math.max(0, timeLimitSec - elapsedSec) * 1000;

    const tick = () => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(timer);
        finish();
      }
    };
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [elapsedSec, finish, timeLimitSec]);

  const submit = useCallback(() => {
    if (answered || pending) return;
    // An unfilled box in the maths field is an unfinished answer, not a wrong
    // one. The same guard the practice runner uses, for the same reason.
    if (isBlankAnswer(draft)) return;
    const value = draft.trim();
    const elapsed = Date.now() - (shownAt.current || Date.now());

    startTransition(async () => {
      const result: ExamAnswerResult = await answerExamQuestionAction({
        runId,
        questionId: question.id,
        answer: value,
        timeMs: elapsed,
      });
      setAnswers((current) => ({
        ...current,
        [question.id]: {
          answer: value,
          correct: result.correct,
          steps: result.steps,
          correctAnswer: result.correctAnswer,
        },
      }));
    });
  }, [answered, draft, pending, question.id, runId]);

  const move = useCallback(
    (delta: number) => {
      setIndex((current) =>
        Math.min(questions.length - 1, Math.max(0, current + delta)),
      );
    },
    [questions.length],
  );

  const toggleFlag = useCallback(() => {
    setFlagged((current) => {
      const next = new Set(current);
      if (next.has(question.id)) next.delete(question.id);
      else next.add(question.id);
      return next;
    });
  }, [question.id]);

  /**
   * Leave this one for now.
   *
   * Moving on without answering was always possible - the arrows do not care -
   * but nothing said so, so a question you could not do felt like a wall rather
   * than something to come back to. This says so.
   *
   * It goes to the next question you have *not* answered rather than simply the
   * next one, which matters at the end of a paper: skipping the last question
   * with three unanswered earlier ones should take you to one of those, not sit
   * on the final question with nowhere to go. The search wraps for the same
   * reason.
   *
   * It flags as it goes, so the strip above shows where you left things and the
   * finish panel can offer them back. Skipping is a decision to return, not a
   * decision to give up - and if it turns out to be the latter, the unanswered
   * warning on finishing already covers it.
   */
  const skip = useCallback(() => {
    if (answered) return;

    setFlagged((current) => new Set(current).add(question.id));

    const order = questions.map((_, position) => position);
    const rest = [...order.slice(index + 1), ...order.slice(0, index)];
    const target = rest.find(
      (position) => !answers[questions[position]!.id],
    );
    if (target !== undefined) setIndex(target);
  }, [answered, answers, index, question.id, questions]);

  const changeExplainMode = useCallback(
    (mode: ExplainMode) => {
      setExplainMode(mode);
      startTransition(async () => {
        await setExplainModeAction(runId, mode);
      });
    },
    [runId],
  );

  const progress = useMemo(
    () => Math.round((answeredCount / questions.length) * 100),
    [answeredCount, questions.length],
  );

  /** Positions, not ids: the confirm panel jumps the runner to them. */
  const unanswered = useMemo(
    () =>
      questions
        .map((candidate, position) => (answers[candidate.id] ? -1 : position))
        .filter((position) => position >= 0),
    [answers, questions],
  );

  /**
   * "Submit exam" is the wrong words for the daily challenge, which is not an
   * exam and which the learner has been told is five quick questions.
   */
  const finishLabel = mode === "daily" ? t("finishDaily") : t("submitExam");

  /*
   * Derived, not stored: answering the last outstanding question while the
   * panel is open should close it, and the way to express that is to stop
   * rendering it rather than to chase the change with an effect.
   */
  const showConfirm = confirmingFinish && unanswered.length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-16 sm:pb-0">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-sm tabular-nums text-muted">
            {t("questionOf", { index: index + 1, total: questions.length })}
          </p>
          {timeLimitSec > 0 ? (
            <p
              className={cn(
                "font-mono text-lg tabular-nums",
                remaining < 60 ? "text-wrong" : "text-fg",
              )}
            >
              {formatClock(remaining)}
            </p>
          ) : (
            <p className="text-sm text-muted">{t("untimed")}</p>
          )}
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-accent transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {questions.map((candidate, position) => {
            const state = answers[candidate.id];
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => setIndex(position)}
                aria-label={t("goToQuestion", { index: position + 1 })}
                className={cn(
                  "h-7 w-7 cursor-pointer rounded text-xs tabular-nums",
                  position === index && "ring-2 ring-accent",
                  state
                    ? "bg-surface-2 text-fg"
                    : "border border-border text-muted",
                  flagged.has(candidate.id) && "border-accent text-accent",
                )}
              >
                {position + 1}
              </button>
            );
          })}
        </div>
      </header>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge>
            {skillNames[question.skillId]?.[locale] ?? question.skillId}
          </Badge>
          <Badge tone="accent">
            {difficultyLabels[question.difficulty]?.[locale]}
          </Badge>
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
                variant={
                  (answered?.answer ?? draft) === choice.id
                    ? "primary"
                    : "outline"
                }
                disabled={Boolean(answered) || pending}
                onClick={() => setDraft(choice.id)}
              >
                {choice.label}
              </Button>
            ))}
          </div>
        ) : (
          <AnswerInput
            expects={question.expects}
            value={answered?.answer ?? draft}
            onChange={setDraft}
            onSubmit={submit}
            disabled={Boolean(answered) || pending}
            state={answered ? (answered.correct ? "correct" : "wrong") : "idle"}
          />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => move(-1)}
            disabled={index === 0}
            aria-label={t("previous")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {answered ? (
            <Button
              variant="primary"
              onClick={() => move(1)}
              disabled={index === questions.length - 1}
            >
              {t("next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            /*
              This is the button a learner wants on nearly every click, so it
              is the only primary one on screen while a question is open. The
              finish button downstairs stays quiet until it is actually the
              thing to do.
            */
            <Button
              variant="primary"
              onClick={submit}
              disabled={pending || isBlankAnswer(draft)}
            >
              <Check className="h-4 w-4" />
              {t("checkAnswer")}
            </Button>
          )}

          {/*
            Only while the question is open, and only while there is somewhere
            to skip *to*. On the last unanswered question the button would move
            nothing, and a button that does nothing is worse than no button.
          */}
          {!answered && unanswered.length > 1 ? (
            <Button variant="ghost" onClick={skip}>
              <SkipForward className="h-4 w-4" />
              {t("skip")}
            </Button>
          ) : null}

          <Button
            variant={flagged.has(question.id) ? "secondary" : "ghost"}
            onClick={toggleFlag}
          >
            <Flag className="h-4 w-4" />
            {t("flag")}
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-muted" htmlFor="explain-mode">
              {t("explainMode")}
            </label>
            <select
              id="explain-mode"
              value={explainMode}
              onChange={(event) =>
                changeExplainMode(event.target.value as ExplainMode)
              }
              className="h-9 rounded-md border border-border bg-surface px-2 text-sm"
            >
              <option value="off">{t("explainOff")}</option>
              <option value="onWrong">{t("explainOnWrong")}</option>
              <option value="always">{t("explainAlways")}</option>
            </select>
          </div>
        </div>

        {answered ? (
          <div
            className={cn(
              "space-y-3 rounded-lg border px-4 py-3",
              answered.correct
                ? "border-correct/40 bg-correct/10"
                : "border-wrong/40 bg-wrong/10",
            )}
          >
            <p
              className={cn(
                "flex items-center gap-2 font-medium",
                answered.correct ? "text-correct" : "text-wrong",
              )}
            >
              {answered.correct ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              {answered.correct ? t("correct") : t("incorrect")}
            </p>

            <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
              {t("yourAnswer")}{" "}
              <AnswerText value={answered.answer} className="text-fg" />
            </p>

            {answered.correctAnswer ? (
              <p className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
                {t("theAnswerIs")}{" "}
                <AnswerText
                  value={answered.correctAnswer}
                  className="text-fg"
                />
              </p>
            ) : null}

            {answered.steps ? (
              <StepViewer
                steps={answered.steps}
                ruleNames={ruleNames}
                startRevealed={1}
              />
            ) : null}
          </div>
        ) : null}
      </section>

      {/*
        Finishing is irreversible and, for the daily, once a day - so it is
        deliberately not a one-click action sitting next to "next question".
        The old footer had a primary-styled "submit" button permanently live
        beside the navigation, and clicking it with four questions unanswered
        threw the run away with no warning at all.

        Now: the button is quiet until every question is answered, and any
        click while something is outstanding opens the panel below instead of
        finishing. The unanswered numbers in that panel are buttons, so the
        recovery from "I nearly did that by accident" is one tap.
      */}
      <footer className="space-y-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            {t("answeredCount", {
              answered: answeredCount,
              total: questions.length,
            })}
          </p>
          <Button
            onClick={() => {
              if (unanswered.length > 0) {
                setConfirmingFinish(true);
                return;
              }
              finish();
            }}
            disabled={finishing}
            variant={unanswered.length === 0 ? "primary" : "outline"}
          >
            {finishLabel}
          </Button>
        </div>

        {showConfirm ? (
          <div className="space-y-3 rounded-lg border border-accent/50 bg-accent/5 px-4 py-3">
            <p className="text-sm font-medium">
              {t("unansweredWarning", { count: unanswered.length })}
            </p>

            <div className="flex flex-wrap gap-1">
              {unanswered.map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => {
                    setIndex(position);
                    setConfirmingFinish(false);
                  }}
                  aria-label={t("goToQuestion", { index: position + 1 })}
                  className="h-8 w-8 cursor-pointer rounded border border-accent text-xs tabular-nums text-accent hover:bg-accent hover:text-accent-fg"
                >
                  {position + 1}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  setConfirmingFinish(false);
                  setIndex(unanswered[0]!);
                }}
              >
                {t("keepGoing")}
              </Button>
              <Button
                variant="ghost"
                onClick={finish}
                disabled={finishing}
                className="text-wrong"
              >
                {t("finishAnyway")}
              </Button>
            </div>
          </div>
        ) : null}
      </footer>
    </div>
  );
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
