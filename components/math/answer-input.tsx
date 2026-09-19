"use client";

import { useEffect, useImperativeHandle, useMemo, useRef, type Ref } from "react";
import { useTranslations } from "next-intl";
import { answerToTex } from "@/lib/math/to-tex";
import { Tex } from "@/components/math/katex";
import { cn } from "@/lib/utils";

/**
 * Typing maths on a phone is the difference between practising and not, so the
 * keypad inserts exactly the text the answer checker accepts - `sqrt(`, `^`,
 * `/` - rather than a private format that needs translating later.
 */
const KEYS: { label: string; insert: string; caretBack?: number; wide?: boolean }[] = [
  { label: "√", insert: "sqrt()", caretBack: 1 },
  { label: "x²", insert: "^2" },
  { label: "xⁿ", insert: "^" },
  { label: "( )", insert: "()", caretBack: 1 },
  { label: "÷", insert: "/" },
  { label: "×", insert: "*" },
  { label: "−", insert: "-" },
  { label: "+", insert: "+" },
  { label: "π", insert: "pi" },
  { label: ",", insert: ", " },
];

export type AnswerInputHandle = {
  focus: () => void;
  clear: () => void;
};

export function AnswerInput({
  value,
  onChange,
  onSubmit,
  disabled,
  state,
  handleRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  state: "idle" | "correct" | "wrong";
  handleRef?: Ref<AnswerInputHandle>;
}) {
  const t = useTranslations("practice");
  const inputRef = useRef<HTMLInputElement>(null);
  /**
   * Where the caret should land once the new value has been committed. The
   * value is controlled by the parent, so the caret cannot be moved in the
   * same tick as the insert - it has to wait for the render that carries the
   * new text.
   */
  const pendingCaret = useRef<number | null>(null);

  useEffect(() => {
    const caret = pendingCaret.current;
    if (caret === null) return;
    pendingCaret.current = null;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(caret, caret);
  }, [value]);

  useImperativeHandle(handleRef, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => onChange(""),
  }));

  function insert(text: string, caretBack = 0) {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + text + value.slice(end));
    pendingCaret.current = start + text.length - caretBack;
  }

  /**
   * What the typed text actually means, rendered as maths.
   *
   * Typing `3sqrt(2)` and being shown `3sqrt(2)` back tells a learner nothing
   * they did not already know - they are left checking their own typing
   * against a format they half-remember. Showing `3√2` lets them confirm the
   * *maths* before they commit to it, which is the thing they are actually
   * unsure about.
   */
  const preview = useMemo(() => answerToTex(value), [value]);
  const typing = value.trim() !== "";

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="text"
          placeholder={t("answerPlaceholder")}
          aria-label={t("yourAnswer")}
          className={cn(
            "h-14 w-full rounded-lg border bg-surface px-4 font-mono text-xl text-fg",
            "placeholder:font-sans placeholder:text-base placeholder:text-muted",
            state === "correct" && "border-correct",
            state === "wrong" && "border-wrong",
            state === "idle" && "border-border",
          )}
        />
      </div>

      {/*
        Reserved height, so the keypad does not jump down the page the moment
        the first character is typed.
      */}
      <div
        className="flex min-h-9 items-center gap-2 px-1"
        aria-live="polite"
        data-testid="answer-preview"
      >
        {typing ? (
          preview ? (
            <>
              <span className="shrink-0 text-xs text-muted">{t("readsAs")}</span>
              <span
                className={cn(
                  "min-w-0 overflow-x-auto text-lg",
                  state === "correct" && "text-correct",
                  state === "wrong" && "text-wrong",
                )}
              >
                <Tex tex={preview} />
              </span>
            </>
          ) : (
            <span className="text-xs text-muted">{t("cannotReadYet")}</span>
          )
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {KEYS.map((key) => (
          <button
            key={key.label}
            type="button"
            disabled={disabled}
            onClick={() => insert(key.insert, key.caretBack)}
            className={cn(
              "h-10 min-w-10 cursor-pointer rounded-md border border-border bg-surface px-3",
              "font-mono text-sm text-fg hover:bg-surface-2 disabled:opacity-40",
            )}
          >
            {key.label}
          </button>
        ))}
      </div>
    </div>
  );
}
