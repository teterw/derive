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
  | { correct: false; reason: "form"; requirement: FormRequirement }
  /**
   * Every root given is right, but not all of them were given. By far the
   * most common near-miss on a quadratic, and worth saying out loud rather
   * than marking as simply wrong.
   */
  | { correct: false; reason: "incomplete"; found: number; expected: number };

const SYMBOL_REPLACEMENTS: [RegExp, string][] = [
  [/√/g, "sqrt"],
  [/[×·∙]/g, "*"],
  [/÷/g, "/"],
  [/[–—−]/g, "-"],
  [/\s+/g, " "],
];

/**
 * LaTeX that the maths field emits but that carries no mathematical content.
 *
 * `\placeholder{}` is the empty box in `□/□` - a half-built expression, which
 * must read as empty rather than as a syntax error, or the answer box would
 * report "unreadable" the instant a fraction key is pressed. The spacing
 * macros are the field's own typesetting and mean nothing to the checker.
 */
const MATHFIELD_NOISE: [RegExp, string][] = [
  [/\\placeholder(?:\[[^\]]*\])?\{([^{}]*)\}/g, "$1"],
  [/\\placeholder(?:\[[^\]]*\])?/g, ""],
  [/\\differentialD/g, "d"],
  [/\\exponentialE/g, "e"],
  [/\\imaginaryI/g, "i"],
  [/\\pi\b/g, "pi"],
  [/\\infty/g, "Infinity"],
  [/\\%/g, "%"],
  [/\\bigl|\\bigr|\\Bigl|\\Bigr/g, ""],
  [/\\mathinner|\\mathord/g, ""],
];

/**
 * Turns what a person typed into mathjs source.
 *
 * Accepts plain text (`sqrt(2)`, `x^2`, `1/2`), the LaTeX the on-screen keypad
 * produces (`\sqrt{2}`, `\frac{1}{2}`), and the LaTeX the maths field emits,
 * which is the same thing plus the placeholders and spacing macros stripped
 * above.
 */
export function normalizeInput(raw: string): string {
  let text = raw.trim();
  for (const [pattern, replacement] of SYMBOL_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }
  /*
   * A backslash is not enough to recognise LaTeX. The maths field writes a
   * simple power as `x^{2}` - braces, no command - and that went straight to
   * mathjs, which cannot read `{2}`, so a correct answer was marked wrong.
   * A braced exponent or subscript is the other tell.
   */
  if (text.includes("\\") || /[\^_]\s*\{/.test(text)) {
    for (const [pattern, replacement] of MATHFIELD_NOISE) {
      text = text.replace(pattern, replacement);
    }
    text = katexToMath(text);
  }
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
      if (given.length > answer.values.length) {
        return { correct: false, reason: "wrong" };
      }

      // Order-free: match each given value to a distinct expected one.
      const claimed = new Set<number>();
      for (const candidate of given) {
        const index = answer.values.findIndex((expected, i) => {
          if (claimed.has(i)) return false;
          try {
            return areEquivalent(candidate, expected);
          } catch {
            return false;
          }
        });
        if (index === -1) return { correct: false, reason: "wrong" };
        claimed.add(index);
      }

      if (given.length < answer.values.length) {
        return {
          correct: false,
          reason: "incomplete",
          found: given.length,
          expected: answer.values.length,
        };
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
    case "vertex-form":
      return isVertexForm(node);
  }
}

/**
 * `a(x - h)^2 + k`, which is the only form the vertex can be read off.
 *
 * The test is not "does it look like that" but the property that makes it
 * useful: **every occurrence of the variable is inside one squared bracket.**
 * `2x^2 - 12x + 13` is the same function and tells you nothing about where the
 * graph turns, which is the entire reason the skill exists - so an equivalent
 * answer in the expanded form has to come back as "right value, wrong form"
 * rather than as correct.
 */
function isVertexForm(node: MathNode): boolean {
  const squared: MathNode[] = [];
  node.traverse((current) => {
    if (current.type !== "OperatorNode") return;
    const operator = current as unknown as { op: string; args: MathNode[] };
    if (operator.op !== "^" || operator.args.length !== 2) return;
    if (constantValue(operator.args[1]!) !== 2) return;
    if (isSum(stripParens(operator.args[0]!))) squared.push(operator.args[0]!);
  });
  if (squared.length !== 1) return false;
  return countSymbols(node) === countSymbols(squared[0]!);
}

function countSymbols(node: MathNode): number {
  let count = 0;
  node.traverse((current) => {
    if (current.type === "SymbolNode") count += 1;
  });
  return count;
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
    const fn = current as unknown as {
      fn: { name?: string };
      args: MathNode[];
    };
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
    if (operator.op === "*") {
      /*
       * Recursive, not just "one argument is a sum": `2(x+3)^2` has two
       * arguments, a number and a power, and neither of them is a sum - so
       * the flat version rejected a perfect square with a common factor
       * pulled out, which is the standard hardest case of the ม.2 factoring
       * chapter. Its answer would have been marked "right value, wrong form".
       */
      return operator.args.some(
        (argument) =>
          isSum(stripParens(argument)) || isFactored(stripParens(argument)),
      );
    }
    if (operator.op === "^") {
      // Only the base: `2^(x+1)` is a power of a sum, not a factorisation.
      return isSum(stripParens(operator.args[0]!));
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
