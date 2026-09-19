"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/routing";
import type { Rule } from "@/content/types";
import { Tex } from "@/components/math/katex";
import { MathText } from "@/components/math/math-text";
import { Input } from "@/components/ui/field";

/**
 * The formula sheet, inside the practice session.
 *
 * It reads the same rule registry the step engine reads, so what you revise
 * here and what an explanation cites cannot drift apart (PROMPT.md §2,
 * Phase 4).
 */
export function FormulaSheet({
  rules,
  locale,
  labels,
}: {
  rules: Rule[];
  locale: Locale;
  labels: { search: string; noResults: string; count: string };
}) {
  const [query, setQuery] = useState("");

  const matching = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rules;
    return rules.filter((rule) =>
      [rule.id, rule.name.th, rule.name.en, rule.plain.th, rule.plain.en, rule.mnemonic?.th ?? "", rule.mnemonic?.en ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query, rules]);

  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => event.stopPropagation()}
        placeholder={labels.search}
        aria-label={labels.search}
        autoFocus
      />

      {matching.length === 0 ? (
        <p className="text-sm text-muted">{labels.noResults}</p>
      ) : (
        <ul className="space-y-3">
          {matching.map((rule) => (
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
      )}
    </div>
  );
}
