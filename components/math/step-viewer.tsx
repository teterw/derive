"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { Step } from "@/content/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tex } from "./katex";
import { MathText } from "./math-text";

/**
 * ทีละขั้น. One step at a time by default, with "show all" for anyone who
 * wants the whole derivation at once (PROMPT.md §10).
 *
 * Each step names the rule that produced it, as a chip that links to that
 * rule's page - the same registry entry the formula sheet shows, so the
 * explanation and the formula can never disagree.
 */
export function StepViewer({
  steps,
  ruleNames,
  startRevealed = 1,
}: {
  steps: Step[];
  /** ruleId -> name in both languages, resolved on the server. */
  ruleNames: Record<string, { th: string; en: string }>;
  startRevealed?: number;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("practice");
  const [revealed, setRevealed] = useState(
    Math.min(startRevealed, steps.length),
  );

  const allShown = revealed >= steps.length;

  return (
    <div className="space-y-3">
      <ol className="space-y-3">
        {steps.slice(0, revealed).map((step, index) => (
          <li
            key={index}
            className="rounded-lg border border-border bg-surface-2/60 p-4"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-muted tabular-nums">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <Tex
                  tex={locale === "en" && step.exprEn ? step.exprEn : step.expr}
                  display
                  className="overflow-x-auto py-1"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <RuleChip
                    ruleId={step.ruleId}
                    name={ruleNames[step.ruleId]?.[locale] ?? step.ruleId}
                  />
                  <p className="text-sm text-muted">
                    <MathText text={step.explain[locale]} />
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {!allShown ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevealed((value) => value + 1)}
          >
            <ChevronDown className="h-4 w-4" />
            {t("nextStep")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRevealed(steps.length)}
          >
            {t("showAllSteps")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function RuleChip({
  ruleId,
  name,
}: {
  ruleId: string;
  name: string;
}) {
  return (
    <Link
      href={`/rules/${ruleId}`}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border border-accent/40 bg-accent/10",
        "px-2 py-0.5 text-xs font-medium text-accent hover:bg-accent/20",
      )}
    >
      {name}
    </Link>
  );
}
