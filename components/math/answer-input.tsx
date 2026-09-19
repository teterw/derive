"use client";

import {
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import { useTranslations } from "next-intl";
import { answerToTex } from "@/lib/math/to-tex";
import { Tex } from "@/components/math/katex";
import { MathField, type MathFieldHandle } from "@/components/math/math-field";
import { cn } from "@/lib/utils";

/**
 * The keypad.
 *
 * `insert` is plain text for the fallback box - exactly what the answer
 * checker accepts, never a private format needing translation later. `latex`
 * is what the same key does in the maths field, where `#0` is where the caret
 * lands and `#?` is an empty box to fill in. Pressing `÷` in the field gives
 * you `□/□` with the caret in the numerator, the way a calculator does.
 */
const KEYS: {
  label: string;
  insert: string;
  caretBack?: number;
  latex?: string;
}[] = [
  { label: "√", insert: "sqrt()", caretBack: 1, latex: "\\sqrt{#0}" },
  { label: "x²", insert: "^2", latex: "#@^{2}" },
  { label: "xⁿ", insert: "^", latex: "#@^{#?}" },
  { label: "( )", insert: "()", caretBack: 1, latex: "\\left(#0\\right)" },
  { label: "÷", insert: "/", latex: "\\frac{#@}{#?}" },
  { label: "×", insert: "*", latex: "\\times" },
  { label: "−", insert: "-", latex: "-" },
  { label: "+", insert: "+", latex: "+" },
  { label: "π", insert: "pi", latex: "\\pi" },
  { label: ",", insert: ", ", latex: "," },
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

  const fieldRef = useRef<MathFieldHandle>(null);
  /**
   * `null` while MathLive is still loading, `true` once the maths field is
   * live, `false` if it could not be loaded at all.
   *
   * The plain box renders in every state except `true`, so there is never a
   * moment with no way to type - including on a connection where the field
   * simply never arrives.
   */
  const [fieldReady, setFieldReady] = useState<boolean | null>(null);
  const usingField = fieldReady === true;

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
    focus: () =>
      usingField ? fieldRef.current?.focus() : inputRef.current?.focus(),
    clear: () => onChange(""),
  }));

  function press(key: (typeof KEYS)[number]) {
    if (usingField) {
      fieldRef.current?.execute(["insert", key.latex ?? key.insert]);
      return;
    }
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + key.insert + value.slice(end));
    pendingCaret.current = start + key.insert.length - (key.caretBack ?? 0);
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

  /*
   * `min-h`, not `h`. A fraction or a nested radical is taller than a line of
   * text, and a fixed-height box crops it or crowds it against the top edge.
   * The box grows with what is in it, which is what a maths field has to do.
   */
  const frame = cn(
    "flex min-h-14 w-full items-center rounded-lg border bg-surface px-4 py-2",
    // The box is the focus indicator for whichever input is inside it, so the
    // maths field and the plain box look and behave identically when active.
    "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30",
    state === "correct" && "border-correct",
    state === "wrong" && "border-wrong",
    state === "idle" && "border-border",
  );

  return (
    <div className="space-y-3">
      {/*
        Both inputs are mounted while MathLive loads: the plain box is what you
        type into meanwhile, and it is the only one if the field never arrives.
        Once the field is live the plain box comes out of the tree entirely,
        rather than being hidden, so there is only ever one focusable input.
      */}
      <div className={frame} data-mathfield={usingField ? "on" : "off"}>
        <MathField
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          onReady={setFieldReady}
          disabled={disabled}
          ariaLabel={t("yourAnswer")}
          handleRef={fieldRef}
          className="w-full text-xl"
        />

        {usingField ? null : (
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
              "min-h-10 w-full bg-transparent font-mono text-xl text-fg outline-none",
              "placeholder:font-sans placeholder:text-base placeholder:text-muted",
            )}
          />
        )}
      </div>

      {/*
        The preview answers "how will my typing be read", which the maths field
        answers by construction - it *is* the rendered form. So it only appears
        behind the plain box. Reserved height either way, so the keypad does
        not jump down the page on the first keystroke.
      */}
      <div
        className="flex min-h-9 items-center gap-2 px-1"
        aria-live="polite"
        data-testid="answer-preview"
      >
        {usingField || !typing ? null : preview ? (
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
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {KEYS.map((key) => (
          <button
            key={key.label}
            type="button"
            disabled={disabled}
            onClick={() => press(key)}
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
