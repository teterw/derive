"use client";

import { useState } from "react";
import { evaluate } from "mathjs";
import { cn } from "@/lib/utils";

/**
 * A scientific calculator for the topics where arithmetic is not the point.
 *
 * It uses the same mathjs the answer checker uses, so what it accepts and what
 * the answer box accepts are the same language - no separate syntax to learn.
 *
 * Its state is **owned by the caller**. A calculator whose working disappears
 * when the panel closes is not a calculator you can use alongside a question:
 * you close it to see the stem, and the four lines you had just worked out are
 * gone. The dock holds the state for as long as the page is open, so closing a
 * panel hides it rather than resetting it. `useCalculatorState` is the whole
 * of what a caller has to do.
 */
export type CalculatorState = {
  expression: string;
  history: { input: string; output: string }[];
};

export const EMPTY_CALCULATOR: CalculatorState = { expression: "", history: [] };

/** How many previous sums stay on screen. */
const HISTORY = 8;

export function useCalculatorState() {
  return useState<CalculatorState>(EMPTY_CALCULATOR);
}

const KEYS: {
  label: string;
  insert?: string;
  action?: "clear" | "back" | "equals";
  span?: boolean;
}[] = [
  { label: "C", action: "clear" },
  { label: "(", insert: "(" },
  { label: ")", insert: ")" },
  { label: "⌫", action: "back" },

  { label: "7", insert: "7" },
  { label: "8", insert: "8" },
  { label: "9", insert: "9" },
  { label: "÷", insert: "/" },

  { label: "4", insert: "4" },
  { label: "5", insert: "5" },
  { label: "6", insert: "6" },
  { label: "×", insert: "*" },

  { label: "1", insert: "1" },
  { label: "2", insert: "2" },
  { label: "3", insert: "3" },
  { label: "−", insert: "-" },

  { label: "0", insert: "0" },
  { label: ".", insert: "." },
  { label: "=", action: "equals" },
  { label: "+", insert: "+" },

  { label: "√", insert: "sqrt(" },
  { label: "x²", insert: "^2" },
  { label: "xⁿ", insert: "^" },
  { label: "π", insert: "pi" },
];

export function Calculator({
  labels,
  state,
  onChange,
}: {
  labels: { result: string; error: string };
  state: CalculatorState;
  onChange: (next: CalculatorState) => void;
}) {
  const { expression, history } = state;

  function setExpression(value: string) {
    onChange({ ...state, expression: value });
  }

  function press(key: (typeof KEYS)[number]) {
    if (key.action === "clear") {
      setExpression("");
      return;
    }
    if (key.action === "back") {
      setExpression(expression.slice(0, -1));
      return;
    }
    if (key.action === "equals") {
      compute();
      return;
    }
    setExpression(expression + (key.insert ?? ""));
  }

  function compute() {
    if (expression.trim() === "") return;
    try {
      const value = evaluate(expression) as unknown;
      const output =
        typeof value === "number"
          ? String(Math.round(value * 1e10) / 1e10)
          : String(value);
      onChange({
        expression: output,
        history: [{ input: expression, output }, ...history].slice(0, HISTORY),
      });
    } catch {
      onChange({
        expression,
        history: [{ input: expression, output: labels.error }, ...history].slice(
          0,
          HISTORY,
        ),
      });
    }
  }

  return (
    <div className="space-y-4">
      <input
        value={expression}
        onChange={(event) => setExpression(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            compute();
          }
          // The dock's shortcuts must not fire while typing a sum.
          event.stopPropagation();
        }}
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        aria-label={labels.result}
        className="h-12 w-full rounded-md border border-border bg-surface-2 px-3 text-right font-mono text-lg"
      />

      <div className="grid grid-cols-4 gap-1.5">
        {KEYS.map((key) => (
          <button
            key={key.label}
            type="button"
            onClick={() => press(key)}
            className={cn(
              "h-11 cursor-pointer rounded-md border border-border font-mono text-sm hover:bg-surface-2",
              key.action === "equals" &&
                "bg-accent text-accent-fg hover:opacity-90",
              key.action === "clear" && "text-wrong",
            )}
          >
            {key.label}
          </button>
        ))}
      </div>

      {history.length > 0 ? (
        <ol className="space-y-1 border-t border-border pt-3 text-xs text-muted">
          {history.map((row, index) => (
            <li key={index} className="flex justify-between gap-3 font-mono">
              <span className="truncate">{row.input}</span>
              <span className="shrink-0 text-fg">{row.output}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
