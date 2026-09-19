"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { normalizeMathfieldLatex } from "@/lib/math/mathfield-latex";

/**
 * A real maths input: the field itself shows `√` and a fraction bar, not the
 * letters `s-q-r-t`.
 *
 * This is the thing a scientific calculator does - press the fraction key and
 * you get two empty boxes with the caret in the first, arrow keys walk between
 * them. MathLive provides it as a web component; this wraps it for React and,
 * crucially, keeps it *optional*.
 *
 * ## Why it loads lazily and can fail
 *
 * MathLive is ~220KB gzipped plus fonts. Loading it eagerly would put that in
 * front of the first question on a school connection, for a field the learner
 * may never wait for. So it is imported on mount, and until it arrives - or if
 * it never arrives - the caller renders an ordinary text box instead. An app
 * where you cannot type an answer because a 220KB download stalled is worse
 * than one with a plainer input.
 *
 * `onReady(false)` is therefore a normal outcome, not an error path.
 */

export type MathFieldHandle = {
  focus: () => void;
  /** Runs a MathLive command, e.g. `["insert", "\\sqrt{#0}"]`. */
  execute: (command: unknown) => void;
};

type MathFieldElement = HTMLElement & {
  value: string;
  executeCommand: (command: unknown) => boolean;
  menuItems: unknown[];
  mathVirtualKeyboardPolicy: string;
  smartMode: boolean;
  readonly: boolean;
};

export function MathField({
  value,
  onChange,
  onSubmit,
  onReady,
  disabled,
  ariaLabel,
  className,
  handleRef,
}: {
  /** LaTeX. */
  value: string;
  onChange: (latex: string) => void;
  onSubmit: () => void;
  /** Told whether the component is usable, so the caller can fall back. */
  onReady: (ready: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
  handleRef?: Ref<MathFieldHandle>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<MathFieldElement | null>(null);

  /*
   * The callbacks go through a ref so the effect below can depend on nothing
   * and therefore run exactly once. Re-running it would tear down the field
   * and lose the caret on every keystroke.
   */
  const callbacks = useRef({ onChange, onSubmit, onReady });
  useEffect(() => {
    callbacks.current = { onChange, onSubmit, onReady };
  });

  /*
   * The field is created asynchronously, which means it can arrive *after*
   * the props it needs have already settled - answer a question while MathLive
   * is still downloading and the effects below have long since run. So the
   * current values are read from refs at creation time, not captured from the
   * render that started the load.
   */
  const latest = useRef({ value, disabled });
  useEffect(() => {
    latest.current = { value, disabled };
  });

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    import("mathlive")
      .then((mathlive) => {
        if (cancelled || !hostRef.current) return;

        // Importing it is what registers `<math-field>`; nothing else is
        // needed from the module.
        void mathlive;

        const field = document.createElement("math-field") as MathFieldElement;
        field.value = latest.current.value;
        field.readonly = Boolean(latest.current.disabled);
        field.mathVirtualKeyboardPolicy = "manual";
        // Typing `sqrt` or `/` builds the notation, rather than staying literal.
        field.smartMode = true;
        field.setAttribute("aria-label", ariaLabel);
        field.className = className ?? "";

        /*
         * The value is repaired on the way out - see `normalizeMathfieldLatex`
         * for what MathLive gets wrong. The repaired string goes to the parent,
         * whose state then differs from `field.value`, so the effect below
         * writes it back and the field re-renders with the exponent it should
         * have had. That round trip is the fix for the *display*, not only for
         * the stored answer, which is what a learner actually complained about.
         */
        field.addEventListener("input", () => {
          callbacks.current.onChange(normalizeMathfieldLatex(field.value));
        });

        /*
         * `^` is handled here rather than by MathLive, because MathLive gets it
         * wrong. Its own handling of a typed `^` builds a superscript that the
         * *next* character falls straight out of: type `x`, `^`, `1`, `2` and
         * the field shows a small 1 and a full-size 2, with the value to match.
         * Subscripts are fine, and 0.110.0 is the newest release, so there is
         * nothing to upgrade to.
         *
         * Its `insert` command builds the same superscript correctly - the
         * caret lands inside the group and stays there - so the key is routed
         * to that instead. Recorded from a live field:
         *
         *   typed `^` then 123        -> x^123     the bug
         *   insert `^{#0}` then 123   -> x^{123}   what this does
         *
         * Capture phase, because MathLive listens deeper in its own shadow DOM
         * and would otherwise insert the character before this ran.
         */
        field.addEventListener(
          "keydown",
          (event) => {
            if ((event as KeyboardEvent).key !== "^" || field.readonly) return;
            event.preventDefault();
            event.stopPropagation();
            field.executeCommand(["insert", "^{#0}"]);
          },
          true,
        );

        field.addEventListener("keydown", (event) => {
          if ((event as KeyboardEvent).key !== "Enter") return;

          /*
           * Once the question is answered the field is read-only and Enter no
           * longer belongs to it - it belongs to the runner, which advances to
           * the next question. Swallowing it unconditionally broke exactly
           * that: answering worked, and then Enter did nothing at all, in an
           * app whose whole premise is that your hands stay on the keyboard.
           *
           * Letting the event through is the fix; the runner listens on the
           * window and reads it there.
           */
          if (field.readonly) return;

          event.preventDefault();
          event.stopPropagation();
          callbacks.current.onSubmit();
        });

        hostRef.current.replaceChildren(field);

        /*
         * Anything that touches the mathfield's internals has to wait until it
         * is in the document - MathLive throws "Mathfield not mounted" for a
         * detached element. `menuItems` is one of those, and setting it before
         * attaching took the whole field down the failure path: the field
         * loaded fine and the app silently served the plain box instead.
         *
         * It is also not worth losing the field over, so it is tried
         * separately from the mount itself.
         */
        try {
          // No right-click menu: it offers LaTeX and MathML export a learner
          // does not need, and it can sit open behind the tool dock.
          field.menuItems = [];
        } catch {
          // A visible menu is a blemish, not a reason to have no input.
        }

        fieldRef.current = field;
        callbacks.current.onReady(true);
      })
      .catch(() => {
        if (!cancelled) callbacks.current.onReady(false);
      });

    return () => {
      cancelled = true;
      fieldRef.current = null;
      host.replaceChildren();
    };
    // Mount only: see the note on `callbacks` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* The field owns its own caret, so only write to it when it has genuinely
     fallen out of step with the parent - clearing between questions, mainly. */
  useEffect(() => {
    const field = fieldRef.current;
    if (field && field.value !== value) field.value = value;
  }, [value]);

  useEffect(() => {
    const field = fieldRef.current;
    if (field) field.readonly = Boolean(disabled);
  }, [disabled]);

  useImperativeHandle(handleRef, () => ({
    focus: () => fieldRef.current?.focus(),
    execute: (command) => {
      const field = fieldRef.current;
      if (!field) return;
      field.focus();
      field.executeCommand(command);
    },
  }));

  return <div ref={hostRef} className="min-w-0 flex-1" />;
}
