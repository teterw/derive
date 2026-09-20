/**
 * Exact values on the unit circle, in radians.
 *
 * Shared by the four ม.5 trigonometry generators. It is written as arithmetic
 * rather than as a lookup table on purpose: a table of sixty-odd entries is
 * sixty-odd chances to type `\frac{\sqrt{3}}{3}` where `\frac{\sqrt{3}}{2}`
 * belongs, and nothing in the app would notice. Here there are five base
 * values and two sign rules, and `trig-functions.test.ts` checks every angle
 * this can produce against the standard library.
 *
 * Angles are counted in twelfths of pi, so every angle the school curriculum
 * uses - the sixths, the quarters, the thirds and the halves - is a whole
 * number and quadrant arithmetic needs no fractions.
 */

export type Exact = { katex: string; math: string };

export type RatioName = "sin" | "cos" | "tan";

/** An angle as a multiple of pi/12, which is how this module counts. */
export type Angle = { twelfths: number };

export const ZERO: Exact = { katex: "0", math: "0" };
export const ONE: Exact = { katex: "1", math: "1" };

/** sine and cosine at 0, pi/6, pi/4, pi/3 and pi/2, by reference angle. */
const BASE: Record<number, { sin: Exact; cos: Exact }> = {
  0: { sin: ZERO, cos: ONE },
  2: { sin: { katex: "\\frac{1}{2}", math: "1/2" }, cos: root(3, 2) },
  3: { sin: root(2, 2), cos: root(2, 2) },
  4: { sin: root(3, 2), cos: { katex: "\\frac{1}{2}", math: "1/2" } },
  6: { sin: ONE, cos: ZERO },
};

function root(radicand: number, denominator: number): Exact {
  return {
    katex: `\\frac{\\sqrt{${radicand}}}{${denominator}}`,
    math: `sqrt(${radicand})/${denominator}`,
  };
}

export function negate(value: Exact): Exact {
  if (value.math === "0") return ZERO;
  return value.katex.startsWith("-")
    ? { katex: value.katex.slice(1), math: `(${value.math})` }
    : { katex: `-${value.katex}`, math: `-(${value.math})` };
}

/** Where on the circle the angle lands: 1 to 4, or 0 on an axis. */
export function quadrantOf(angle: Angle): 0 | 1 | 2 | 3 | 4 {
  const u = ((angle.twelfths % 24) + 24) % 24;
  if (u % 6 === 0) return 0;
  if (u < 6) return 1;
  if (u < 12) return 2;
  if (u < 18) return 3;
  return 4;
}

/** The acute angle between the radius and the x-axis, in twelfths of pi. */
export function referenceTwelfths(angle: Angle): number {
  const u = ((angle.twelfths % 24) + 24) % 24;
  if (u <= 6) return u;
  if (u <= 12) return 12 - u;
  if (u <= 18) return u - 12;
  return 24 - u;
}

/**
 * The exact value, or null where there is none - `\tan\frac{\pi}{2}` is not a
 * number, and a question with no answer is not a question.
 */
export function valueAt(angle: Angle, ratio: RatioName): Exact | null {
  const u = ((angle.twelfths % 24) + 24) % 24;
  const base = BASE[referenceTwelfths({ twelfths: u })];
  if (!base) return null;

  // y is positive above the axis, x is positive to the right of it.
  const sine = u > 0 && u < 12 ? base.sin : u === 0 || u === 12 ? ZERO : negate(base.sin);
  const cosine = u < 6 || u > 18 ? base.cos : u === 6 || u === 18 ? ZERO : negate(base.cos);

  if (ratio === "sin") return sine;
  if (ratio === "cos") return cosine;
  if (cosine.math === "0") return null;
  return quotient(sine, cosine);
}

/** tan, worked out from the sine and cosine rather than tabulated again. */
function quotient(sine: Exact, cosine: Exact): Exact {
  const negative = sine.katex.startsWith("-") !== cosine.katex.startsWith("-");
  const size = `${sine.katex.replace("-", "")}|${cosine.katex.replace("-", "")}`;
  const magnitude = TANGENTS[size];
  if (!magnitude) {
    throw new Error(`no exact tangent for ${sine.katex} over ${cosine.katex}`);
  }
  return negative ? negate(magnitude) : magnitude;
}

/** The three tangent magnitudes, keyed by the pair they come from. */
const TANGENTS: Record<string, Exact> = {
  "0|1": ZERO,
  [`\\frac{1}{2}|\\frac{\\sqrt{3}}{2}`]: root(3, 3),
  [`\\frac{\\sqrt{2}}{2}|\\frac{\\sqrt{2}}{2}`]: ONE,
  [`\\frac{\\sqrt{3}}{2}|\\frac{1}{2}`]: { katex: "\\sqrt{3}", math: "sqrt(3)" },
  "1|0": ZERO,
};

/**
 * The angle itself, written the way it is read.
 *
 * `\frac{\pi}{6}` rather than `\frac{1\pi}{6}`, `\pi` rather than
 * `\frac{2\pi}{2}`, and a negative angle in brackets so `\cos -\frac{\pi}{3}`
 * cannot be read as a subtraction.
 */
export function angleKatex(angle: Angle, { bracket = false } = {}): string {
  const sign = angle.twelfths < 0 ? "-" : "";
  const size = Math.abs(angle.twelfths);
  const divisor = gcd(size, 12);
  const numerator = size / divisor;
  const denominator = 12 / divisor;

  let body: string;
  if (size === 0) body = "0";
  else if (denominator === 1) body = numerator === 1 ? "\\pi" : `${numerator}\\pi`;
  else {
    const top = numerator === 1 ? "\\pi" : `${numerator}\\pi`;
    body = `\\frac{${top}}{${denominator}}`;
  }

  const written = `${sign}${body}`;
  return bracket && sign ? `\\left(${written}\\right)` : written;
}

/** The same angle as mathjs source. */
export function angleMath(angle: Angle): string {
  if (angle.twelfths === 0) return "0";
  const sign = angle.twelfths < 0 ? "-" : "";
  const size = Math.abs(angle.twelfths);
  const divisor = gcd(size, 12);
  return `${sign}${size / divisor}pi/${12 / divisor}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Every angle in one turn where the ratio takes this exact value.
 *
 * Found by asking all twenty-four of them rather than by inverting anything.
 * There are twenty-four, the values are exact strings from this same module,
 * and an equation whose solution set is built by *checking* every candidate
 * cannot quietly lose the second root - which is the mistake the whole
 * `trig.equations` skill is about.
 */
export function anglesWhere(ratio: RatioName, target: Exact): Angle[] {
  const found: Angle[] = [];
  for (let twelfths = 0; twelfths < 24; twelfths += 1) {
    const value = valueAt({ twelfths }, ratio);
    if (value && value.math === target.math) found.push({ twelfths });
  }
  return found;
}

/**
 * A product written the way a person writes one.
 *
 * Several of the exact values are 1 or 0, so a coefficient in front of one
 * produces `2 * (1)` - which renders as `2 \cdot 1` and is refused by
 * `answer-accepted.test.ts`, rightly: the model answer is what a learner
 * copies.
 */
export function product(parts: string[]): string {
  const split = parts.map(splitSign);
  if (split.some(([, size]) => size === "0")) return "0";
  const negative = split.filter(([isNegative]) => isNegative).length % 2 === 1;
  const kept = split.map(([, size]) => size).filter((size) => size !== "1");

  const body =
    kept.length === 0
      ? "1"
      : kept.length === 1
        ? kept[0]!
        : kept.map((part) => `(${part})`).join(" * ");
  return negative ? `-(${body})` : body;
}

/**
 * The same, for a sum.
 *
 * A negative term is written as a subtraction. `(-\frac{\sqrt2}{2}) + (-1)`
 * is an answer no one would write down, and it renders as `+ -`, which
 * `answer-accepted.test.ts` refuses on sight.
 */
export function sum(parts: string[]): string {
  const kept = parts.filter((part) => splitSign(part)[1] !== "0");
  if (kept.length === 0) return "0";

  let out = kept[0]!;
  for (const part of kept.slice(1)) {
    const [negative, size] = splitSign(part);
    out += negative ? ` - (${size})` : ` + (${size})`;
  }
  return out;
}

/** `-(1/2)` and `-1` both split into a minus and a size. */
function splitSign(part: string): [boolean, string] {
  const trimmed = part.trim();
  if (!trimmed.startsWith("-")) return [false, trimmed];
  const rest = trimmed.slice(1).trim();
  // Only unwrap a bracket that encloses the whole of the rest.
  if (rest.startsWith("(") && closesAtEnd(rest)) {
    return [true, rest.slice(1, -1)];
  }
  return [true, rest];
}

function closesAtEnd(text: string): boolean {
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")") {
      depth -= 1;
      if (depth === 0) return i === text.length - 1;
    }
  }
  return false;
}

/** Thai and English names for the quadrants, which the prompts need. */
export const QUADRANT_NAME: Record<1 | 2 | 3 | 4, { th: string; en: string }> = {
  1: { th: "จตุภาคที่หนึ่ง", en: "the first quadrant" },
  2: { th: "จตุภาคที่สอง", en: "the second quadrant" },
  3: { th: "จตุภาคที่สาม", en: "the third quadrant" },
  4: { th: "จตุภาคที่สี่", en: "the fourth quadrant" },
};

/** `\sin` in a sentence, in whichever language. */
export const RATIO_WORD: Record<RatioName, { th: string; en: string }> = {
  sin: { th: "ไซน์", en: "sine" },
  cos: { th: "โคไซน์", en: "cosine" },
  tan: { th: "แทนเจนต์", en: "tangent" },
};
