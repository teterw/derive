"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * How much is ticked, live, in the start bar.
 *
 * Seventy-eight checkboxes across twenty chapters that are mostly shut is a
 * selection you cannot see. Without this you tick four things, scroll past
 * sixteen shut chapters, and have to take it on trust that the run is what you
 * meant - and the commonest mistake is starting with nothing ticked by
 * accident, which quietly means *everything*.
 *
 * It is also what makes this page read as a control panel rather than as
 * another list of chapters: a setting you change and a readout that answers.
 *
 * Progressive enhancement. `count` is null until the effect has run, so with
 * JavaScript off nothing is rendered and the form behaves exactly as it did -
 * this page is a plain GET form on purpose and this does not change that.
 */
export function SelectionCount() {
  const t = useTranslations("practice");
  const anchor = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const form = anchor.current?.closest("form");
    if (!form) return;

    const update = () =>
      setCount(
        form.querySelectorAll<HTMLInputElement>('input[name="skills"]:checked')
          .length,
      );

    update();
    /*
     * `change` bubbles from the checkboxes. The per-chapter select-all buttons
     * set `.checked` in code, which fires nothing on its own, so they dispatch
     * a bubbling `change` at the form themselves.
     */
    form.addEventListener("change", update);
    return () => form.removeEventListener("change", update);
  }, []);

  return (
    <span ref={anchor} className="text-sm tabular-nums text-muted">
      {count === null
        ? null
        : count === 0
          ? t("selectionNone")
          : t("selectionSome", { count })}
    </span>
  );
}
