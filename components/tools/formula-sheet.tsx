"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/routing";
import type { PublicRule } from "@/content/rules";
import { groupByFamily } from "@/content/rules/families";
import { Tex } from "@/components/math/katex";
import { MathText } from "@/components/math/math-text";
import { Chapter } from "@/components/ui/chapter";
import { Input } from "@/components/ui/field";

/**
 * The formula sheet, inside the practice session.
 *
 * It reads the same rule registry the step engine reads, so what you revise
 * here and what an explanation cites cannot drift apart (PROMPT.md §2,
 * Phase 4).
 *
 * Grouped by behaviour, the same fifteen families as `/rules` and for a
 * sharper version of the same reason: this panel is a column beside a question
 * you are part-way through answering, and 117 rules in it is a scroll you will
 * not make while holding a half-finished thought. Fifteen headings, and the
 * one about roots is one click away.
 *
 * Shut until you type. A search opens whatever it matched, because at that
 * point you have already said what you are looking for - and clearing the box
 * shuts them again.
 */
export function FormulaSheet({
  rules,
  locale,
  labels,
  /**
   * A slide-over is modal, so taking the caret when it opens is right. The
   * docked rail is not - the question beside it is still being answered, and
   * grabbing focus would throw away whatever was half-typed in the answer box.
   */
  focusOnMount = true,
}: {
  rules: PublicRule[];
  locale: Locale;
  labels: { search: string; noResults: string; count: string };
  focusOnMount?: boolean;
}) {
  const [query, setQuery] = useState("");

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rules;
    return rules.filter((rule) =>
      [
        rule.id,
        rule.name.th,
        rule.name.en,
        rule.plain.th,
        rule.plain.en,
        rule.mnemonic?.th ?? "",
        rule.mnemonic?.en ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, rules]);

  const searching = query.trim() !== "";
  const groups = useMemo(() => groupByFamily(matching), [matching]);

  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => event.stopPropagation()}
        placeholder={labels.search}
        aria-label={labels.search}
        autoFocus={focusOnMount}
      />

      {matching.length === 0 ? (
        <p className="text-sm text-muted">{labels.noResults}</p>
      ) : (
        <div className="space-y-2">
          {groups.map(({ family, rules: found }) => (
            <Chapter
              key={family.prefix}
              title={family.name[locale]}
              trailing={
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                  {found.length}
                </span>
              }
              dense
              /*
               * `<details>` is uncontrolled, so React writes this attribute
               * only when the value it rendered last actually changes - which
               * is what is wanted. Typing opens the matches; clearing shuts
               * them; toggling one by hand in between survives until the
               * search state next flips.
               */
              open={searching}
            >
              <ul className="space-y-3">
                {found.map((rule) => (
                  <li
                    key={rule.id}
                    className="space-y-1.5 rounded-lg border border-border p-3"
                  >
                    <p className="text-sm font-medium">{rule.name[locale]}</p>
                    <Tex tex={rule.statement} display className="py-1" />
                    {rule.conditions ? (
                      <p className="text-center text-xs text-muted">
                        <MathText text={rule.conditions[locale]} />
                      </p>
                    ) : null}
                    {rule.mnemonic ? (
                      <p className="border-l-2 border-accent pl-2 text-xs text-fg">
                        <MathText text={rule.mnemonic[locale]} />
                      </p>
                    ) : null}
                    <p className="text-xs text-muted">
                      <MathText text={rule.plain[locale]} />
                    </p>
                  </li>
                ))}
              </ul>
            </Chapter>
          ))}
        </div>
      )}
    </div>
  );
}
