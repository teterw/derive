"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Calculator as CalculatorIcon,
  Keyboard,
  LineChart,
  Sigma,
  Wrench,
  X,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import type { Rule } from "@/content/types";
import { cn } from "@/lib/utils";
import { SlideOver } from "./slide-over";
import { Calculator } from "./calculator";
import { DesmosPanel } from "./desmos-panel";
import { FormulaSheet } from "./formula-sheet";

type Tool = "graph" | "formulas" | "calculator" | "shortcuts";

/**
 * The tools that sit alongside a question: graph, formula sheet, calculator,
 * and the list of what the keyboard does.
 *
 * Monkeytype-style shortcuts (PROMPT.md §2, Phase 4): G graph, F formulas,
 * C calculator, ? shortcuts, Esc close. Typing in a field never triggers one -
 * the check is here rather than in each panel.
 */
const SHORTCUTS: { keys: string; key: string }[] = [
  { keys: "Enter", key: "submit" },
  { keys: "E", key: "explain" },
  { keys: "H", key: "hint" },
  { keys: "G", key: "graph" },
  { keys: "F", key: "formulas" },
  { keys: "C", key: "calculator" },
  { keys: "?", key: "shortcuts" },
  { keys: "Esc", key: "close" },
];

export function ToolDock({
  rules,
  desmosApiKey,
  /** Exam mode hides the graph when explanations are switched off. */
  allowGraph = true,
}: {
  rules: Rule[];
  desmosApiKey: string;
  allowGraph?: boolean;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("tools");
  const [open, setOpen] = useState<Tool | null>(null);
  /** Phone only: whether the four tool buttons are showing. */
  const [expanded, setExpanded] = useState(false);

  const toggle = useCallback((tool: Tool) => {
    setOpen((current) => (current === tool ? null : tool));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (key === "g" && allowGraph) {
        event.preventDefault();
        toggle("graph");
      } else if (key === "f") {
        event.preventDefault();
        toggle("formulas");
      } else if (key === "c") {
        event.preventDefault();
        toggle("calculator");
      } else if (event.key === "?") {
        event.preventDefault();
        toggle("shortcuts");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [allowGraph, toggle]);

  const buttons: { tool: Tool; icon: React.ReactNode; label: string }[] = [
    ...(allowGraph
      ? [
          {
            tool: "graph" as const,
            icon: <LineChart className="h-4 w-4" />,
            label: t("graph"),
          },
        ]
      : []),
    { tool: "formulas", icon: <Sigma className="h-4 w-4" />, label: t("formulas") },
    {
      tool: "calculator",
      icon: <CalculatorIcon className="h-4 w-4" />,
      label: t("calculator"),
    },
    {
      tool: "shortcuts",
      icon: <Keyboard className="h-4 w-4" />,
      label: t("shortcuts"),
    },
  ];

  return (
    <>
      {/*
        Four floating buttons is fine on a laptop, where they sit in the margin
        beside the question. On a 390px phone there is no margin: whichever way
        the dock is laid out, a column or a row, it lands on top of the answer
        keypad or the submit row. Padding cannot fix that - the dock is fixed
        to the viewport and the content happens to be there too.

        So on a phone it is one button that opens the rest, which is both
        honest about the space available and the pattern anyone who has used a
        phone already knows. From `sm` up the whole set is always visible.
      */}
      <div className="fixed bottom-20 right-3 z-30 flex flex-row-reverse items-center gap-2 sm:bottom-4 sm:right-4 sm:flex-col">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-label={t("tools")}
          title={t("tools")}
          className={cn(
            "flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-muted shadow-lg",
            "hover:text-fg sm:hidden",
            expanded && "border-accent text-accent",
          )}
        >
          {expanded ? (
            <X className="h-5 w-5" />
          ) : (
            <Wrench className="h-5 w-5" />
          )}
        </button>

        {buttons.map((button) => (
          <button
            key={button.tool}
            type="button"
            onClick={() => {
              toggle(button.tool);
              setExpanded(false);
            }}
            title={button.label}
            aria-label={button.label}
            className={cn(
              "h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-sm",
              // Hidden behind the wrench on a phone, always out on a laptop.
              expanded ? "flex" : "hidden sm:flex",
              open === button.tool
                ? "border-accent bg-accent text-accent-fg"
                : "border-border bg-surface text-muted hover:text-fg",
            )}
          >
            {button.icon}
          </button>
        ))}
      </div>

      <SlideOver
        open={open === "graph"}
        onClose={() => setOpen(null)}
        title={t("graph")}
        wide
      >
        <DesmosPanel
          apiKey={desmosApiKey}
          labels={{
            missingKey: t("desmosMissingKey"),
            loading: t("desmosLoading"),
            failed: t("desmosFailed"),
          }}
        />
      </SlideOver>

      <SlideOver
        open={open === "formulas"}
        onClose={() => setOpen(null)}
        title={t("formulas")}
      >
        <FormulaSheet
          rules={rules}
          locale={locale}
          labels={{
            search: t("searchRules"),
            noResults: t("noRules"),
            count: t("ruleCount"),
          }}
        />
      </SlideOver>

      <SlideOver
        open={open === "calculator"}
        onClose={() => setOpen(null)}
        title={t("calculator")}
      >
        <Calculator
          labels={{ result: t("calculatorInput"), error: t("calculatorError") }}
        />
      </SlideOver>

      <SlideOver
        open={open === "shortcuts"}
        onClose={() => setOpen(null)}
        title={t("shortcuts")}
      >
        <dl className="space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between gap-4 border-b border-border/60 pb-2 text-sm"
            >
              <dt className="text-muted">{t(`shortcut.${shortcut.key}`)}</dt>
              <dd>
                <kbd className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-xs">
                  {shortcut.keys}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </SlideOver>
    </>
  );
}
