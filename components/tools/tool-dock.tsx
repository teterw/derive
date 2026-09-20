"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
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
import type { PublicRule } from "@/content/rules";
import { cn } from "@/lib/utils";
import { SlideOver } from "./slide-over";
import { ToolRail, type RailPanel } from "./tool-rail";
import { Calculator, useCalculatorState } from "./calculator";
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
 *
 * Two layouts, and the difference is not cosmetic:
 *
 * - **`lg` and up** the open tools are a docked column at the right-hand edge
 *   (`ToolRail`) and the page is narrowed to fit beside them. Several can be
 *   open at once, because working a question with the calculator *and* the
 *   formula sheet is the normal way to work a question.
 * - **Below that** there is no width to spare, so it stays one panel at a
 *   time over the page (`SlideOver`).
 *
 * The calculator's expression and history live here rather than inside the
 * panel, so closing it hides the working instead of throwing it away.
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

/** Where a column of panels starts being worth more than the width it costs. */
const DESKTOP = "(min-width: 1024px)";

/*
 * The viewport and "has this hydrated yet" are both read through
 * `useSyncExternalStore` rather than set from an effect.
 *
 * Both need to be `false` for the render the server produced and the one that
 * hydrates it, and true immediately after - which is exactly what the third
 * argument, the server snapshot, is for. Setting them from an effect instead
 * does the same thing by way of an extra render that React has to be told to
 * expect, and the lint rule that forbids it is right.
 */
const subscribeToDesktop = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const isDesktop = () => window.matchMedia(DESKTOP).matches;

const subscribeToNothing = () => () => {};
const onTheClient = () => true;
const onTheServer = () => false;

export function ToolDock({
  rules,
  desmosApiKey,
  /** Exam mode hides the graph when explanations are switched off. */
  allowGraph = true,
}: {
  rules: PublicRule[];
  desmosApiKey: string;
  allowGraph?: boolean;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("tools");
  /** Most recently opened last. Below `lg` it never holds more than one. */
  const [open, setOpen] = useState<Tool[]>([]);
  /** Phone only: whether the four tool buttons are showing. */
  const [expanded, setExpanded] = useState(false);
  const [calculator, setCalculator] = useCalculatorState();

  const desktop = useSyncExternalStore(
    subscribeToDesktop,
    isDesktop,
    onTheServer,
  );
  /** The portal below needs a document, and the server has not got one. */
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    onTheClient,
    onTheServer,
  );

  const toggle = useCallback(
    (tool: Tool) => {
      setOpen((current) => {
        if (current.includes(tool)) {
          return current.filter((item) => item !== tool);
        }
        return desktop ? [...current, tool] : [tool];
      });
    },
    [desktop],
  );

  const close = useCallback((tool: string) => {
    setOpen((current) => current.filter((item) => item !== tool));
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable;

      /*
       * Esc is checked before the typing guard: the rail stays open while you
       * answer, so the formula search box and the answer field are both
       * places you can be when you want the panel gone. It closes the panel
       * you opened last, one press at a time, rather than clearing the lot.
       */
      if (event.key === "Escape") {
        if (open.length > 0) {
          event.preventDefault();
          setOpen((current) => current.slice(0, -1));
        }
        return;
      }

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
  }, [allowGraph, open, toggle]);

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
    {
      tool: "formulas",
      icon: <Sigma className="h-4 w-4" />,
      label: t("formulas"),
    },
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

  /**
   * `focusOnMount` is the difference between a panel that covers the page and
   * one that sits beside it. A slide-over is modal, so taking the caret is
   * right. The rail is not: the question is still there and still being
   * answered, and a formula sheet that grabbed the caret every time it opened
   * would throw away whatever was half-typed in the answer box.
   */
  function content(tool: Tool, docked: boolean): React.ReactNode {
    switch (tool) {
      case "graph":
        return (
          <DesmosPanel
            apiKey={desmosApiKey}
            fill={docked}
            labels={{
              missingKey: t("desmosMissingKey"),
              loading: t("desmosLoading"),
              failed: t("desmosFailed"),
            }}
          />
        );
      case "formulas":
        return (
          <FormulaSheet
            rules={rules}
            locale={locale}
            focusOnMount={!docked}
            labels={{
              search: t("searchRules"),
              noResults: t("noRules"),
              count: t("ruleCount"),
            }}
          />
        );
      case "calculator":
        return (
          <Calculator
            state={calculator}
            onChange={setCalculator}
            labels={{
              result: t("calculatorInput"),
              error: t("calculatorError"),
            }}
          />
        );
      case "shortcuts":
        return (
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
        );
    }
  }

  const railPanels: RailPanel[] = desktop
    ? buttons
        .filter((button) => open.includes(button.tool))
        .map((button) => ({
          tool: button.tool,
          title: button.label,
          wide: button.tool === "graph",
          content: content(button.tool, true),
        }))
    : [];

  /*
   * Below `lg`, one panel: the one opened last. Narrowing the window does not
   * *close* the others, it just stops showing them - so closing the visible
   * sheet reveals the one underneath, which is the same stack Esc walks, and
   * widening the window again brings them all back.
   */
  const sheet = desktop ? null : (open.at(-1) ?? null);

  /*
   * Everything here is `position: fixed` and means it: the rail is the right
   * edge of the *window*, not of whatever box it happens to be rendered
   * inside. It is not, though. The dock is rendered inside `PageTransition`,
   * whose `page-enter` animation animates `transform`, and an element with a
   * transform animation applied is a containing block for fixed descendants -
   * for the whole time the animation is applied, which with `fill: both` is
   * for ever. So the rail came out the height of the page content and the
   * width of the centred column, floating in the middle of the screen with
   * its "right edge" three hundred pixels short of the window.
   *
   * Nothing in this file could have shown that, and no test would have
   * either: in jsdom there is no layout, so `fixed` is exactly as fixed as
   * you assume it is. Portalling to `document.body` puts these elements
   * outside any transformed ancestor, now and after the next animation
   * somebody adds to a wrapper.
   */
  if (!mounted) return null;

  return createPortal(
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

        `--tool-rail` keeps the column of buttons pinned to the rail's outer
        edge rather than disappearing behind it: they are fixed to the
        viewport, so the body padding that moves the page does not move them.
      */}
      <div className="fixed bottom-20 right-3 z-30 flex flex-row-reverse items-center gap-2 sm:bottom-4 sm:right-4 sm:flex-col lg:right-[calc(1rem+var(--tool-rail,0px))]">
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
            aria-pressed={open.includes(button.tool)}
            className={cn(
              "h-10 w-10 cursor-pointer items-center justify-center rounded-full border shadow-sm",
              // Hidden behind the wrench on a phone, always out on a laptop.
              expanded ? "flex" : "hidden sm:flex",
              open.includes(button.tool)
                ? "border-accent bg-accent text-accent-fg"
                : "border-border bg-surface text-muted hover:text-fg",
            )}
          >
            {button.icon}
          </button>
        ))}
      </div>

      <ToolRail
        panels={railPanels}
        onClose={close}
        closeLabel={t("close")}
      />

      {buttons.map((button) => (
        <SlideOver
          key={button.tool}
          open={sheet === button.tool}
          onClose={() => close(button.tool)}
          title={button.label}
          wide={button.tool === "graph"}
        >
          {content(button.tool, false)}
        </SlideOver>
      ))}
    </>,
    document.body,
  );
}
