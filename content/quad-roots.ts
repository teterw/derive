import {
  extractSquareFactor,
  fraction,
  gcd,
  isPerfectSquare,
  radical,
  radicalMath,
  reduceFraction,
} from "./format";

/**
 * How the roots of `ax^2 + bx + c = 0` are written down.
 *
 * Shared by the completing-the-square and quadratic-formula generators so the
 * two never disagree about what "simplified" means - and so the reduction of
 * `\frac{6 \pm 2\sqrt{5}}{2}` to `3 \pm \sqrt{5}` happens in exactly one place.
 */
export type Roots = {
  /** b^2 - 4ac */
  discriminant: number;
  /** True when the roots are rational, i.e. the discriminant is a square. */
  rational: boolean;
  /** How many distinct real roots there are: 2, 1 or 0. */
  count: 0 | 1 | 2;
  /** Each root as KaTeX, in the order (+ then -). */
  katex: string[];
  /** Each root as mathjs source. */
  math: string[];
  /** `\pm` form, e.g. `3 \pm \sqrt{5}` - the line before splitting them. */
  plusMinusKatex: string | null;
};

export function solveQuadratic(a: number, b: number, c: number): Roots {
  if (a === 0) throw new Error("solveQuadratic: a must not be zero");
  const discriminant = b * b - 4 * a * c;

  if (discriminant < 0) {
    return {
      discriminant,
      rational: false,
      count: 0,
      katex: [],
      math: [],
      plusMinusKatex: null,
    };
  }

  if (isPerfectSquare(discriminant)) {
    const root = Math.round(Math.sqrt(discriminant));
    const first = reduceFraction(-b + root, 2 * a);
    const second = reduceFraction(-b - root, 2 * a);
    const same = first[0] === second[0] && first[1] === second[1];

    const katex = [fraction(-b + root, 2 * a)];
    const math = [fractionMath(first)];
    if (!same) {
      katex.push(fraction(-b - root, 2 * a));
      math.push(fractionMath(second));
    }

    return {
      discriminant,
      rational: true,
      count: same ? 1 : 2,
      katex,
      math,
      plusMinusKatex: same
        ? null
        : `\\frac{${-b} \\pm ${root}}{${2 * a}}`,
    };
  }

  // Irrational: reduce (-b ± g√m) / 2a by any factor all three share.
  const { outside, inside } = extractSquareFactor(discriminant);
  const denominator = 2 * a;
  const divisor =
    gcd(gcd(Math.abs(b), outside), Math.abs(denominator)) *
    (denominator < 0 ? -1 : 1);

  const constant = -b / divisor;
  const radicalCoefficient = outside / divisor;
  const reducedDenominator = denominator / divisor;

  const body = (sign: "+" | "-") =>
    `${constant} ${sign} ${radical(radicalCoefficient, inside)}`;
  const wrap = (text: string) =>
    reducedDenominator === 1 ? text : `\\frac{${text}}{${reducedDenominator}}`;

  const mathBody = (sign: "+" | "-") => {
    const numerator = `(${constant} ${sign} ${radicalMath(radicalCoefficient, inside)})`;
    return reducedDenominator === 1
      ? numerator
      : `${numerator}/${reducedDenominator}`;
  };

  return {
    discriminant,
    rational: false,
    count: 2,
    katex: [wrap(body("+")), wrap(body("-"))],
    math: [mathBody("+"), mathBody("-")],
    plusMinusKatex: wrap(`${constant} \\pm ${radical(radicalCoefficient, inside)}`),
  };
}

function fractionMath([numerator, denominator]: [number, number]): string {
  return denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;
}

/** `\sqrt{20} = 2\sqrt{5}`, for the step that says so. */
export function simplifySquareRoot(value: number): {
  outside: number;
  inside: number;
  katex: string;
} {
  const { outside, inside } = extractSquareFactor(value);
  return { outside, inside, katex: radical(outside, inside) };
}
