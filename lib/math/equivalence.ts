import { parse, type MathNode } from "mathjs";

/**
 * Structural comparison is no good here: mathjs collapses `sqrt(8)` to a
 * float, and two correct answers can be written very differently. So
 * equivalence is decided numerically - substitute the same values into both
 * expressions many times and see whether they agree.
 *
 * The sample values are fixed, not random, so a test that passes today passes
 * tomorrow.
 */

const KNOWN_CONSTANTS = new Set(["e", "pi", "i", "tau", "phi", "Infinity"]);

/** Awkward values: no small integers, so nothing agrees by coincidence. */
const POSITIVE_SAMPLES = [
  0.3714, 0.9137, 1.2718, 1.7321, 2.3186, 2.8317, 3.4142, 4.1231, 5.2361,
  6.1803, 7.3891, 8.5397,
];
const MIXED_SAMPLES = [
  ...POSITIVE_SAMPLES,
  -0.4472,
  -1.1547,
  -2.2361,
  -3.3166,
  -4.7958,
  -5.6569,
];

export class MathParseError extends Error {}

export function parseMath(source: string): MathNode {
  try {
    return parse(source);
  } catch (error) {
    throw new MathParseError(
      `cannot parse ${JSON.stringify(source)}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

/** Free variables, ignoring function names and built-in constants. */
export function symbolsOf(source: string): string[] {
  const names = new Set<string>();
  parseMath(source).traverse((node, path, parent) => {
    if (node.type !== "SymbolNode") return;
    if (parent?.type === "FunctionNode" && path === "fn") return;
    const name = (node as unknown as { name: string }).name;
    if (!KNOWN_CONSTANTS.has(name)) names.add(name);
  });
  return [...names].sort();
}

type Numeric = number | { re: number; im: number };

function asComplex(value: unknown): { re: number; im: number } | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? { re: value, im: 0 } : null;
  }
  if (typeof value === "object" && value !== null) {
    const candidate = value as {
      re?: unknown;
      im?: unknown;
      toNumber?: unknown;
    };
    if (typeof candidate.re === "number" && typeof candidate.im === "number") {
      return Number.isFinite(candidate.re) && Number.isFinite(candidate.im)
        ? { re: candidate.re, im: candidate.im }
        : null;
    }
    if (typeof candidate.toNumber === "function") {
      const n = (candidate.toNumber as () => number)();
      return Number.isFinite(n) ? { re: n, im: 0 } : null;
    }
  }
  return null;
}

function near(a: Numeric, b: Numeric, tolerance: number): boolean {
  const ca = asComplex(a);
  const cb = asComplex(b);
  if (!ca || !cb) return false;
  const scale = Math.max(1, Math.abs(ca.re), Math.abs(cb.re));
  return (
    Math.abs(ca.re - cb.re) <= tolerance * scale &&
    Math.abs(ca.im - cb.im) <= tolerance * scale
  );
}

export type EquivalenceOptions = {
  /** How many usable sample points must agree. */
  samples?: number;
  tolerance?: number;
};

/**
 * True when two expressions agree everywhere we can evaluate them both.
 *
 * Points where either side is undefined (division by zero, a log of a negative)
 * are skipped rather than counted as a disagreement. If too few points survive,
 * the answer is `false` - "could not tell" must never read as "equivalent".
 */
export function areEquivalent(
  left: string,
  right: string,
  { samples = 12, tolerance = 1e-9 }: EquivalenceOptions = {},
): boolean {
  const leftNode = parseMath(left);
  const rightNode = parseMath(right);

  const variables = [
    ...new Set([...symbolsOf(left), ...symbolsOf(right)]),
  ].sort();

  const hasRoot = /sqrt|nthRoot|log|\^/.test(`${left} ${right}`);
  const pool = hasRoot ? POSITIVE_SAMPLES : MIXED_SAMPLES;

  const compiledLeft = leftNode.compile();
  const compiledRight = rightNode.compile();

  if (variables.length === 0) {
    try {
      return near(
        compiledLeft.evaluate({}) as Numeric,
        compiledRight.evaluate({}) as Numeric,
        tolerance,
      );
    } catch {
      return false;
    }
  }

  let agreed = 0;
  for (let index = 0; index < pool.length * 3 && agreed < samples; index++) {
    const scope: Record<string, number> = {};
    variables.forEach((name, position) => {
      // A different offset per variable keeps x and y from moving in lockstep,
      // which would hide a difference between x*y and x^2.
      scope[name] = pool[(index + position * 5 + position) % pool.length]!;
    });

    let leftValue: unknown;
    let rightValue: unknown;
    try {
      leftValue = compiledLeft.evaluate({ ...scope });
      rightValue = compiledRight.evaluate({ ...scope });
    } catch {
      continue;
    }
    if (!asComplex(leftValue) || !asComplex(rightValue)) continue;

    if (!near(leftValue as Numeric, rightValue as Numeric, tolerance)) {
      return false;
    }
    agreed++;
  }

  return agreed >= Math.min(samples, 6);
}

/** Numeric value of a constant expression, or null if it is not constant. */
export function evaluateConstant(source: string): number | null {
  if (symbolsOf(source).length > 0) return null;
  try {
    const value = parseMath(source).compile().evaluate({});
    const complex = asComplex(value);
    if (!complex || Math.abs(complex.im) > 1e-12) return null;
    return complex.re;
  } catch {
    return null;
  }
}
