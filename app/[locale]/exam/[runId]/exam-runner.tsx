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
import { Check, ChevronLeft, ChevronRight, Flag, X } from "lucide-react";
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
import { QuestionDisplay } from "@/components/math/question-display";
import { StepViewer } from "@/components/math/step-viewer";
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
    const deadline =
      Date.now() + Math.max(0, timeLimitSec - elapsedSec) * 1000;

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
    const value = draft.trim();
    if (value === "") return;
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

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
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
          <Badge>{skillNames[question.skillId]?.[locale] ?? question.skillId}</Badge>
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
            value={answered?.answer ?? draft}
            onChange={setDraft}
            onSubmit={submit}
            disabled={Boolean(answered) || pending}
            state={
              answered ? (answered.correct ? "correct" : "wrong") : "idle"
            }
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
              onClick={() => move(1)}
              disabled={index === questions.length - 1}
            >
              {t("next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={pending || draft.trim() === ""}>
              {t("answer")}
            </Button>
          )}

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

            {answered.correctAnswer ? (
              <p className="text-sm text-muted">
                {t("theAnswerIs")}{" "}
                <span className="font-mono text-fg">
                  {answered.correctAnswer}
                </span>
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

      <footer className="flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted">
          {t("answeredCount", {
            answered: answeredCount,
            total: questions.length,
          })}
        </p>
        <Button onClick={finish} disabled={finishing} variant="primary">
          {t("submitExam")}
        </Button>
      </footer>
    </div>
  );
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
