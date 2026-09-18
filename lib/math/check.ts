import type { MathNode } from "mathjs";
import type { Answer, FormRequirement } from "@/content/types";
import { insertImplicitMultiplication, katexToMath } from "./katex";
import { areEquivalent, evaluateConstant, parseMath } from "./equivalence";

/**
 * Answer checking (PROMPT.md §6.4). Runs on the server only - the client never
 * receives `answer` before it submits.
 */

export type CheckResult =
  | { correct: true }
  | { correct: false; reason: "unparseable" }
  | { correct: false; reason: "wrong" }
  /** Right value, wrong shape: the skill declares `strictForm`. */
  | { correct: false; reason: "form"; requirement: FormRequirement };

const SYMBOL_REPLACEMENTS: [RegExp, string][] = [
  [/√/g, "sqrt"],
  [/[×·∙]/g, "*"],
  [/÷/g, "/"],
  [/[–—−]/g, "-"],
  [/\s+/g, " "],
];

/**
 * Turns what a person typed into mathjs source.
 *
 * Accepts both plain text (`sqrt(2)`, `x^2`, `1/2`) and the LaTeX the on-screen
 * keypad produces (`\sqrt{2}`, `\frac{1}{2}`).
 */
export function normalizeInput(raw: string): string {
  let text = raw.trim();
  for (const [pattern, replacement] of SYMBOL_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  if (text.includes("\\")) text = katexToMath(text);
  // "sqrt2" and "sqrt 2" both mean sqrt(2).
  text = text.replace(/sqrt\s*(-?\d+(?:\.\d+)?)/g, "sqrt($1)");
  return insertImplicitMultiplication(text).trim();
}

/** Splits a typed set: "2, -5" / "{2, -5}" / "x = 2, x = -5". */
export function splitSet(raw: string): string[] {
  const inner = raw.trim().replace(/^\{/, "").replace(/\}$/, "");
  // No \b around หรือ: Thai characters are not word characters in JS regex.
  return inner
    .split(/[,;]|\bor\b|หรือ/)
    .map((part) => part.replace(/^\s*[a-zA-Z]\s*=\s*/, "").trim())
    .filter((part) => part.length > 0);
}

function safeNormalize(raw: string): string | null {
  try {
    const source = normalizeInput(raw);
    if (!source) return null;
    parseMath(source);
    return source;
  } catch {
    return null;
  }
}

export function checkAnswer(
  answer: Answer,
  raw: string,
  strictForm: FormRequirement | null = null,
): CheckResult {
  if (raw.trim().length === 0) return { correct: false, reason: "unparseable" };

  switch (answer.kind) {
    case "choice":
      return raw.trim() === answer.correct
        ? { correct: true }
        : { correct: false, reason: "wrong" };

    case "numeric": {
      const source = safeNormalize(raw);
      if (!source) return { correct: false, reason: "unparseable" };
      const value = evaluateConstant(source);
      if (value === null) return { correct: false, reason: "wrong" };
      return Math.abs(value - answer.value) <= answer.tol
        ? formGate(source, strictForm)
        : { correct: false, reason: "wrong" };
    }

    case "exact": {
      const source = safeNormalize(raw);
      if (!source) return { correct: false, reason: "unparseable" };
      let equivalent: boolean;
      try {
        equivalent = areEquivalent(source, answer.value);
      } catch {
        return { correct: false, reason: "unparseable" };
      }
      if (!equivalent) return { correct: false, reason: "wrong" };
      return formGate(source, strictForm);
    }

    case "set": {
      const parts = splitSet(raw).map(safeNormalize);
      if (parts.some((part) => part === null)) {
        return { correct: false, reason: "unparseable" };
      }
      const given = parts as string[];
      if (given.length !== answer.values.length) {
        return { correct: false, reason: "wrong" };
      }

      // Order-free: match each expected value to a distinct given one.
      const used = new Set<number>();
      for (const expected of answer.values) {
        const index = given.findIndex((candidate, i) => {
          if (used.has(i)) return false;
          try {
            return areEquivalent(candidate, expected);
          } catch {
            return false;
          }
        });
        if (index === -1) return { correct: false, reason: "wrong" };
        used.add(index);
      }

      for (const part of given) {
        const gated = formGate(part, strictForm);
        if (!gated.correct) return gated;
      }
      return { correct: true };
    }
  }
}

function formGate(
  source: string,
  requirement: FormRequirement | null,
): CheckResult {
  if (!requirement) return { correct: true };
  return satisfiesForm(source, requirement)
    ? { correct: true }
    : { correct: false, reason: "form", requirement };
}

/**
 * Form predicates for the skills where the shape of the answer *is* the
 * lesson: "simplify to lowest radical form" has to reject an equivalent
 * `\sqrt{8}` when the expected answer is `2\sqrt{2}`.
 */
export function satisfiesForm(
  source: string,
  requirement: FormRequirement,
): boolean {
  const node = parseMath(normalizeInput(source));
  switch (requirement) {
    case "simplified-radical":
      return radicandsAreSquareFree(node) && !hasRadicalInDenominator(node);
    case "rationalized-denominator":
      return !hasRadicalInDenominator(node);
    case "scientific-notation":
      return isScientificNotation(node);
    case "factored":
      return isFactored(node);
    case "positive-exponents":
      return !hasNegativeExponent(node);
  }
}

function isSquareFree(value: number): boolean {
  if (!Number.isInteger(value) || value < 1) return false;
  for (let factor = 2; factor * factor <= value; factor++) {
    if (value % (factor * factor) === 0) return false;
  }
  return true;
}

function constantValue(node: MathNode): number | null {
  try {
    const value = node.compile().evaluate({}) as unknown;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function forEachSqrt(node: MathNode, visit: (argument: MathNode) => void) {
  node.traverse((current) => {
    if (current.type !== "FunctionNode") return;
    const fn = current as unknown as { fn: { name?: string }; args: MathNode[] };
    if (fn.fn?.name === "sqrt" && fn.args[0]) visit(fn.args[0]);
  });
}

function radicandsAreSquareFree(node: MathNode): boolean {
  let ok = true;
  forEachSqrt(node, (argument) => {
    const value = constantValue(argument);
    // A symbolic radicand (sqrt(x)) is left alone; only numbers can be
    // "not simplified".
    if (value !== null && !isSquareFree(value)) ok = false;
  });
  return ok;
}

function containsSqrt(node: MathNode): boolean {
  let found = false;
  forEachSqrt(node, () => {
    found = true;
  });
  return found;
}

function hasRadicalInDenominator(node: MathNode): boolean {
  let found = false;
  node.traverse((current) => {
    if (current.type !== "OperatorNode") return;
    const operator = current as unknown as { op: string; args: MathNode[] };
    if (operator.op === "/" && operator.args[1]) {
      if (containsSqrt(operator.args[1])) found = true;
    }
    // x^(-1/2) hides a radical in a denominator too.
    if (operator.op === "^" && operator.args[1]) {
      const exponent = constantValue(operator.args[1]);
      if (exponent !== null && exponent < 0 && !Number.isInteger(exponent)) {
        found = true;
      }
    }
  });
  return found;
}

function stripParens(node: MathNode): MathNode {
  let current = node;
  while (current.type === "ParenthesisNode") {
    current = (current as unknown as { content: MathNode }).content;
  }
  return current;
}

function isScientificNotation(node: MathNode): boolean {
  const root = stripParens(node);
  if (root.type !== "OperatorNode") return false;
  const operator = root as unknown as { op: string; args: MathNode[] };
  if (operator.op !== "*" || operator.args.length !== 2) return false;

  const mantissa = constantValue(operator.args[0]!);
  if (mantissa === null) return false;
  if (Math.abs(mantissa) < 1 || Math.abs(mantissa) >= 10) return false;

  const power = stripParens(operator.args[1]!);
  if (power.type !== "OperatorNode") return false;
  const powerOperator = power as unknown as { op: string; args: MathNode[] };
  if (powerOperator.op !== "^") return false;
  const base = constantValue(powerOperator.args[0]!);
  const exponent = constantValue(powerOperator.args[1]!);
  return base === 10 && exponent !== null && Number.isInteger(exponent);
}

function isFactored(node: MathNode): boolean {
  const root = stripParens(node);
  if (root.type === "OperatorNode") {
    const operator = root as unknown as { op: string; args: MathNode[] };
    if (operator.op === "+" || operator.op === "-") {
      // A leading unary minus is fine: -(x-1)(x+2) is still factored.
      return operator.args.length === 1 && isFactored(operator.args[0]!);
    }
    if (operator.op === "*" || operator.op === "^") {
      return operator.args.some((argument) => isSum(stripParens(argument)));
    }
  }
  return false;
}

function isSum(node: MathNode): boolean {
  if (node.type !== "OperatorNode") return false;
  const operator = node as unknown as { op: string; args: MathNode[] };
  return (
    (operator.op === "+" || operator.op === "-") && operator.args.length === 2
  );
}

function hasNegativeExponent(node: MathNode): boolean {
  let found = false;
  node.traverse((current) => {
    if (current.type !== "OperatorNode") return;
    const operator = current as unknown as { op: string; args: MathNode[] };
    if (operator.op !== "^" || !operator.args[1]) return;
    const exponent = constantValue(operator.args[1]);
    if (exponent !== null && exponent < 0) found = true;
  });
  return found;
}
