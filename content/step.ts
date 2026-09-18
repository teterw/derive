import { katexToMath } from "@/lib/math/katex";
import type { L, RuleId, Step } from "./types";

/**
 * Builds a step, deriving its machine-checkable form from the KaTeX.
 *
 * One string to get right, not two. If the line is an equation `A = B`, the
 * derived form is the zero form `(A) - (B)`: consecutive equations in a
 * derivation must have the same zero form up to equivalence, which is exactly
 * what the property tests check.
 *
 * Lines that are genuinely not machine-readable - a `\pm`, a sentence in Thai,
 * a list of roots - carry no `math` and are skipped by the chain check rather
 * than faked.
 */
export function makeStep(
  expr: string,
  ruleId: RuleId,
  explain: L,
  options: { math?: string | null; chain?: string; highlight?: string[] } = {},
): Step {
  const math =
    options.math === null
      ? undefined
      : (options.math ?? deriveMath(expr) ?? undefined);

  return {
    expr,
    ...(math ? { math } : {}),
    ...(options.chain ? { chain: options.chain } : {}),
    ruleId,
    explain,
    ...(options.highlight ? { highlight: options.highlight } : {}),
  };
}

/** Splits on a top-level `=`, ignoring any inside braces. */
function splitEquation(katex: string): [string, string] | null {
  let depth = 0;
  for (let i = 0; i < katex.length; i++) {
    const char = katex[i];
    if (char === "{") depth++;
    else if (char === "}") depth--;
    else if (char === "=" && depth === 0) {
      // Skip \neq, \geq, \leq, \iff and friends, which are not equations.
      if (katex[i - 1] === "<" || katex[i - 1] === ">") return null;
      return [katex.slice(0, i), katex.slice(i + 1)];
    }
  }
  return null;
}

export function deriveMath(katex: string): string | null {
  const parts = splitEquation(katex);
  try {
    if (parts) {
      const [left, right] = parts;
      if (splitEquation(right)) return null; // a chain like a = b = c
      return `(${katexToMath(left)}) - (${katexToMath(right)})`;
    }
    return katexToMath(katex);
  } catch {
    return null;
  }
}
