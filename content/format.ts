/**
 * KaTeX builders and the small number theory the generators need.
 *
 * Generators emit KaTeX and nothing else; the mathjs form of a step is derived
 * from it (see `content/step.ts`), so there is one string to get right rather
 * than two that can disagree.
 */

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

/** Reduces p/q to lowest terms, keeping the sign on the numerator. */
export function reduceFraction(p: number, q: number): [number, number] {
  if (q === 0) throw new Error("reduceFraction: zero denominator");
  const sign = q < 0 ? -1 : 1;
  const divisor = gcd(p, q) || 1;
  return [(sign * p) / divisor, (sign * q) / divisor];
}

/** Splits n into k^2 * m with m square-free: sqrt(n) = k*sqrt(m). */
export function extractSquareFactor(n: number): { outside: number; inside: number } {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`extractSquareFactor: ${n} is not a non-negative integer`);
  }
  let outside = 1;
  let inside = n;
  for (let factor = 2; factor * factor <= inside; factor++) {
    const square = factor * factor;
    while (inside % square === 0) {
      inside /= square;
      outside *= factor;
    }
  }
  return { outside, inside };
}

export function isPerfectSquare(n: number): boolean {
  if (n < 0) return false;
  const root = Math.round(Math.sqrt(n));
  return root * root === n;
}

export function isSquareFree(n: number): boolean {
  return extractSquareFactor(n).outside === 1;
}

/** "+ 5" / "- 5", for gluing a term onto an expression. */
export function withSign(value: number | string, body?: string): string {
  if (typeof value === "string") {
    return value.startsWith("-") ? `- ${value.slice(1)}` : `+ ${value}`;
  }
  const text = body ?? String(Math.abs(value));
  return value < 0 ? `- ${text}` : `+ ${text}`;
}

/** Coefficient in front of a variable part: 1 -> "x", -1 -> "-x", 0 -> "". */
export function coefficient(value: number, variable: string): string {
  if (value === 0) return "";
  if (value === 1) return variable;
  if (value === -1) return `-${variable}`;
  return `${value}${variable}`;
}

/** Joins terms into `3x^2 - 5x + 2`, dropping zero terms. */
export function sumTerms(terms: (string | null)[]): string {
  const parts = terms.filter((term): term is string => Boolean(term));
  if (parts.length === 0) return "0";
  return parts.reduce((acc, term) => {
    if (term.startsWith("-")) return `${acc} - ${term.slice(1)}`;
    return `${acc} + ${term}`;
  });
}

/** `ax^2 + bx + c` in the usual written order, with zero terms dropped. */
export function quadraticExpr(
  a: number,
  b: number,
  c: number,
  variable = "x",
): string {
  return sumTerms([
    a === 0 ? null : coefficient(a, `${variable}^2`),
    b === 0 ? null : coefficient(b, variable),
    c === 0 ? null : String(c),
  ]);
}

/** `x - 2`, `2x + 3`, `x` - a linear factor written the way a book writes it. */
export function linearExpr(a: number, b: number, variable = "x"): string {
  return sumTerms([
    a === 0 ? null : coefficient(a, variable),
    b === 0 ? null : String(b),
  ]);
}

export function paren(body: string): string {
  return `\\left(${body}\\right)`;
}

/** A displayed fraction, reduced, collapsing to an integer when it can. */
export function fraction(p: number, q: number): string {
  const [num, den] = reduceFraction(p, q);
  if (den === 1) return String(num);
  if (num < 0) return `-\\frac{${-num}}{${den}}`;
  return `\\frac{${num}}{${den}}`;
}

/** `3\sqrt{5}`, `\sqrt{5}`, `-2\sqrt{3}`, and plain integers when inside is 1. */
export function radical(coefficientValue: number, radicand: number): string {
  if (radicand === 1) return String(coefficientValue);
  if (coefficientValue === 0) return "0";
  if (coefficientValue === 1) return `\\sqrt{${radicand}}`;
  if (coefficientValue === -1) return `-\\sqrt{${radicand}}`;
  return `${coefficientValue}\\sqrt{${radicand}}`;
}

/** The same thing as `radical`, in mathjs source: `3*sqrt(5)`, `sqrt(5)`. */
export function radicalMath(coefficientValue: number, radicand: number): string {
  if (radicand === 1) return String(coefficientValue);
  if (coefficientValue === 1) return `sqrt(${radicand})`;
  if (coefficientValue === -1) return `-sqrt(${radicand})`;
  return `${coefficientValue}*sqrt(${radicand})`;
}

/** `\sqrt{72}` written in lowest radical form: `6\sqrt{2}`. */
export function simplifiedRadical(radicand: number, outerCoefficient = 1): string {
  const { outside, inside } = extractSquareFactor(radicand);
  return radical(outerCoefficient * outside, inside);
}

/** Powers, with the brace only where KaTeX needs it. */
export function power(base: string, exponent: number | string): string {
  const text = String(exponent);
  return text.length === 1 && !text.startsWith("-")
    ? `${base}^${text}`
    : `${base}^{${text}}`;
}

/** `3x^2`, `x^2`, `-x^2` - a coefficient in front of a power. */
export function coefficientPower(
  coefficientValue: number,
  variable: string,
  exponent: number | string,
): string {
  const body = exponent === 1 ? variable : power(variable, exponent);
  if (coefficientValue === 1) return body;
  if (coefficientValue === -1) return `-${body}`;
  return `${coefficientValue}${body}`;
}

/**
 * Joins alternatives with the word "or". Returns both languages, because a
 * line of roots is one of the few displayed lines that contains a word rather
 * than only notation.
 */
export function orJoin(parts: string[]): { th: string; en: string } {
  return {
    th: parts.join(" \\text{ หรือ } "),
    en: parts.join(" \\text{ or } "),
  };
}
