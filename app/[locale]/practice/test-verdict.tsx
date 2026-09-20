import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonResult } from "@/lib/learn/progress";

/**
 * Whether you passed the lesson test - or that it is not known yet.
 *
 * Three states, and the third is the reason this is its own component. The
 * verdict is filed by a server action, so between finishing the last question
 * and the answer coming back there is a moment with no result. That moment used
 * to be rendered by `verdict?.passed` being `undefined` and falling through to
 * the failing branch: a red cross and "not this time", replaced a beat later by
 * the real outcome.
 *
 * Reported as "it shows fail for a second and then turns into pass", and it was
 * doing it on every test - a fail that is already showing a fail just hides it.
 * Waiting is not failing, so it looks like neither: a muted ring and the same
 * spinner the submit button uses.
 *
 * The round trip behind it is short and getting shorter (`recordLessonTest` is
 * one statement now, and the functions have been moved to the database's
 * region), but "short" is not "instant" and a wrong answer shown confidently is
 * worse than a slow one.
 */
export function TestVerdict({
  verdict,
  asked,
  labels,
}: {
  /** `null` while the result is still being filed. */
  verdict: LessonResult | null;
  asked: number;
  labels: {
    marking: string;
    passed: string;
    failed: string;
    score: (values: { score: number; total: number; needed: number }) => string;
  };
}) {
  const state = verdict === null ? "marking" : verdict.passed ? "pass" : "fail";

  return (
    <div className="space-y-2" data-verdict={state}>
      <div
        className={cn(
          "mx-auto flex size-14 items-center justify-center rounded-full",
          state === "marking" && "bg-surface-2 text-muted",
          state === "pass" && "bg-correct/15 text-correct",
          state === "fail" && "bg-wrong/15 text-wrong",
        )}
      >
        {state === "marking" ? (
          <span
            className="size-7 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
            aria-hidden
          />
        ) : state === "pass" ? (
          <Check className="size-7" />
        ) : (
          <X className="size-7" />
        )}
      </div>

      {/*
        `aria-live`: this heading replaces itself a beat after the screen
        appears. Without it a screen reader announces the waiting state and
        never mentions the result.
      */}
      <h2 className="text-2xl font-semibold tracking-tight" aria-live="polite">
        {state === "marking"
          ? labels.marking
          : state === "pass"
            ? labels.passed
            : labels.failed}
      </h2>

      {verdict ? (
        <p className="text-sm text-muted">
          {labels.score({
            score: verdict.score,
            total: asked,
            needed: verdict.needed,
          })}
        </p>
      ) : null}
    </div>
  );
}
