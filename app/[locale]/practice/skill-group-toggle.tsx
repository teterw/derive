"use client";

import { useTranslations } from "next-intl";

/**
 * Select-all / select-none for one topic's skills.
 *
 * Every skill starts ticked, which is the right default for "just give me
 * something" but the wrong one for the commoner case: a learner who wants the
 * single skill they got wrong yesterday and would otherwise be unticking
 * thirteen boxes to get there.
 *
 * It works on the form's own checkboxes by name, so the form stays an ordinary
 * GET form. With JavaScript off these two buttons do nothing and everything
 * else on the page still works.
 */
export function SkillGroupToggle({ skillIds }: { skillIds: string[] }) {
  const t = useTranslations("practice");

  function setAll(
    checked: boolean,
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    const form = event.currentTarget.form;
    if (!form) return;
    const boxes = form.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"][name="skills"]',
    );
    for (const box of boxes) {
      if (skillIds.includes(box.value)) box.checked = checked;
    }

    /*
     * Setting `.checked` in code fires nothing, so the live count in the start
     * bar would sit on a stale number until the next box was clicked by hand.
     * One bubbling event at the form tells it, and costs nothing when there is
     * nothing listening.
     */
    form.dispatchEvent(new Event("change", { bubbles: true }));
  }

  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        onClick={(event) => setAll(true, event)}
        className="cursor-pointer rounded-md border border-border px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-fg"
      >
        {t("selectAll")}
      </button>
      <button
        type="button"
        onClick={(event) => setAll(false, event)}
        className="cursor-pointer rounded-md border border-border px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-fg"
      >
        {t("selectNone")}
      </button>
    </div>
  );
}
