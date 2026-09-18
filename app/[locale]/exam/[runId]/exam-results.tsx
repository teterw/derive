"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { Question } from "@/content/types";
import { Badge, Card } from "@/components/ui/card";
import { Tex } from "@/components/math/katex";
import { MathText } from "@/components/math/math-text";
import { StepViewer } from "@/components/math/step-viewer";
import { cn } from "@/lib/utils";

type AttemptRow = {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeMs: number;
  skillId: string;
};

/**
 * The results screen: the score, the time, a per-skill breakdown, and every
 * question expandable into its steps (PROMPT.md §2, Phase 2).
 */
export function ExamResults({
  locale,
  run,
  questions,
  attempts,
  ruleNames,
  skillNames,
  difficultyLabels,
  labels,
}: {
  locale: Locale;
  run: {
    total: number;
    correct: number;
    durationMs: number | null;
    /** Already formatted in the learner's timezone by the server. */
    startedAtLabel: string;
  };
  questions: Question[];
  attempts: AttemptRow[];
  ruleNames: Record<string, { th: string; en: string }>;
  skillNames: Record<string, { th: string; en: string }>;
  difficultyLabels: Record<number, { th: string; en: string }>;
  labels: Record<string, string>;
}) {
  const [open, setOpen] = useState<string | null>(null);

  const byQuestion = new Map(
    attempts.map((attempt) => [attempt.questionId, attempt]),
  );
  const answered = attempts.length;
  const accuracy =
    answered === 0 ? 0 : Math.round((run.correct / answered) * 100);

  const perSkill = new Map<string, { asked: number; correct: number }>();
  for (const question of questions) {
    const attempt = byQuestion.get(question.id);
    const current = perSkill.get(question.skillId) ?? { asked: 0, correct: 0 };
    current.asked += 1;
    if (attempt?.isCorrect) current.correct += 1;
    perSkill.set(question.skillId, current);
  }

  const wrongSkills = [...perSkill.entries()]
    .filter(([, value]) => value.correct < value.asked)
    .map(([skillId]) => skillId);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="text-sm text-muted">{run.startedAtLabel}</p>
      </header>

      <dl className="grid grid-cols-3 gap-4 text-center">
        <Card>
          <dt className="text-xs uppercase tracking-wide text-muted">
            {labels.score}
          </dt>
          <dd className="font-mono text-3xl tabular-nums">
            {run.correct}
            <span className="text-muted">/{run.total}</span>
          </dd>
        </Card>
        <Card>
          <dt className="text-xs uppercase tracking-wide text-muted">
            {labels.accuracy}
          </dt>
          <dd className="font-mono text-3xl tabular-nums">{accuracy}%</dd>
        </Card>
        <Card>
          <dt className="text-xs uppercase tracking-wide text-muted">
            {labels.time}
          </dt>
          <dd className="font-mono text-3xl tabular-nums">
            {formatDuration(run.durationMs ?? 0)}
          </dd>
        </Card>
      </dl>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{labels.perSkill}</h2>
        <Card className="space-y-3">
          {[...perSkill.entries()].map(([skillId, value]) => {
            const share = Math.round((value.correct / value.asked) * 100);
            return (
              <div key={skillId} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{skillNames[skillId]?.[locale] ?? skillId}</span>
                  <span className="font-mono tabular-nums text-muted">
                    {value.correct}/{value.asked}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={cn(
                      "h-full",
                      share === 100 ? "bg-correct" : "bg-accent",
                    )}
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            );
          })}
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{labels.everyQuestion}</h2>
        <ol className="space-y-2">
          {questions.map((question, index) => {
            const attempt = byQuestion.get(question.id);
            const expanded = open === question.id;
            return (
              <li
                key={question.id}
                className="overflow-hidden rounded-lg border border-border"
              >
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : question.id)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
                >
                  <span className="font-mono text-xs tabular-nums text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {attempt ? (
                    attempt.isCorrect ? (
                      <Check className="h-4 w-4 shrink-0 text-correct" />
                    ) : (
                      <X className="h-4 w-4 shrink-0 text-wrong" />
                    )
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                  )}
                  <span className="min-w-0 flex-1 overflow-x-auto">
                    <Tex tex={question.stem} />
                  </span>
                  <Badge tone="neutral">
                    {difficultyLabels[question.difficulty]?.[locale]}
                  </Badge>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted transition-transform",
                      expanded && "rotate-180",
                    )}
                  />
                </button>

                {expanded ? (
                  <div className="space-y-4 border-t border-border bg-surface-2/40 px-4 py-4">
                    <p className="text-sm text-muted">
                      <MathText text={question.prompt[locale]} />
                    </p>

                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <p className="text-muted">
                        {labels.yourAnswer}{" "}
                        <span
                          className={cn(
                            "font-mono",
                            attempt?.isCorrect ? "text-correct" : "text-wrong",
                          )}
                        >
                          {attempt?.userAnswer || labels.notAnswered}
                        </span>
                      </p>
                      <p className="text-muted">
                        {labels.theAnswerIs}{" "}
                        <span className="font-mono text-fg">
                          {describeAnswer(question)}
                        </span>
                      </p>
                    </div>

                    <StepViewer
                      steps={question.steps}
                      ruleNames={ruleNames}
                      startRevealed={question.steps.length}
                    />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </section>

      <div className="flex flex-wrap gap-3">
        {wrongSkills.length > 0 ? (
          <Link
            href={`/practice/run?skills=${wrongSkills.join(",")}&difficulty=1,2,3,4`}
            className="inline-flex h-11 items-center rounded-md bg-accent px-5 font-medium text-accent-fg hover:opacity-90"
          >
            {labels.reviewWrong}
          </Link>
        ) : null}
        <Link
          href="/exam"
          className="inline-flex h-11 items-center rounded-md border border-border px-5 font-medium hover:bg-surface-2"
        >
          {labels.backToSetup}
        </Link>
      </div>
    </div>
  );
}

function describeAnswer(question: Question): string {
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

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
