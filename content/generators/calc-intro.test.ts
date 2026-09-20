import { describe, expect, it } from "vitest";
import { compile, evaluate } from "mathjs";
import { katexToMath } from "@/lib/math/katex";
import { generateQuestion } from "./index";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * แคลคูลัสเบื้องต้น · ม.6, checked numerically.
 *
 * ## Why this file does not do any algebra
 *
 * Every generator in this chapter produces an answer that is *not* equal to
 * its own stem - a derivative, an antiderivative, a limit - so §9.5 has
 * nothing to compare and every question carries `machineStem: null`.
 *
 * The obvious replacement would be to differentiate symbolically here and
 * compare. That would test one implementation of the power rule against
 * another implementation of the power rule, which is not a test. Instead this
 * file uses the *definitions*:
 *
 *   - a limit is what the function approaches, so the function is evaluated
 *     close to the point;
 *   - a derivative is the limit of a difference quotient, so a central
 *     difference is taken;
 *   - an antiderivative is a function whose derivative is the integrand, so
 *     the answer is differentiated;
 *   - a definite integral is an area, so Simpson's rule takes it - and
 *     Simpson's rule is exact for every polynomial in this chapter.
 *
 * None of those share a line of code with the generators, which is the whole
 * point of having them.
 */
const SEEDS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

function each(
  generatorId: string,
  check: (question: Question, where: string) => void,
  difficulties: readonly Difficulty[] = DIFFICULTIES as readonly Difficulty[],
) {
  for (const difficulty of difficulties) {
    for (const seed of SEEDS) {
      check(
        generateQuestion(generatorId, seed, difficulty),
        `${generatorId} d${difficulty} seed ${seed}`,
      );
    }
  }
}

const answerOf = (question: Question) =>
  Number(evaluate((question.answer as { value: string }).value));

/** A KaTeX expression as a function of x. */
function asFunction(katex: string): (x: number) => number {
  const compiled = compile(katexToMath(katex));
  return (x: number) => Number(compiled.evaluate({ x }));
}

/** The derivative at a point, from the definition rather than from a rule. */
function centralDifference(f: (x: number) => number, x: number): number {
  const h = 1e-4;
  return (f(x + h) - f(x - h)) / (2 * h);
}

/** Simpson's rule, which is exact for anything cubic or below. */
function integrateNumerically(
  f: (x: number) => number,
  from: number,
  to: number,
): number {
  const intervals = 200;
  const width = (to - from) / intervals;
  let total = f(from) + f(to);
  for (let i = 1; i < intervals; i += 1) {
    total += f(from + i * width) * (i % 2 === 0 ? 2 : 4);
  }
  return (total * width) / 3;
}

describe("calc.limit", () => {
  /** `\lim_{x \to 3}<body>` -> the point and the body. */
  function readLimit(stem: string): { point: number; body: string } {
    const match = /^\\lim_\{x \\to (-?\d+)\}([\s\S]+)$/.exec(stem);
    expect(match, `cannot read ${stem}`).not.toBeNull();
    return { point: Number(match![1]), body: match![2]! };
  }

  it("answers with the value the function approaches", () => {
    each("calc.limit", (question, where) => {
      const { point, body } = readLimit(question.stem);
      const f = asFunction(body);
      const answer = answerOf(question);

      /*
       * Both sides, and closing in. A one-sided check would pass a question
       * whose two sides disagree - which is a question with no limit at all -
       * and a fixed tolerance would only be testing how steep the function is.
       * What a limit claims is that the gap *shrinks*, so that is what is
       * checked: each step closer is at least three times better, and the
       * last one is tiny.
       */
      for (const side of [-1, 1]) {
        const gaps = [1e-3, 1e-5, 1e-7].map((distance) =>
          Math.abs(f(point + side * distance) - answer),
        );
        expect(
          gaps[2]!,
          `${where}: ${question.stem} is ${f(point + side * 1e-7)} beside ${point}, not ${answer}`,
        ).toBeLessThan(1e-4);
        expect(
          gaps[1]! <= gaps[0]! / 3 + 1e-12 && gaps[2]! <= gaps[1]! / 3 + 1e-12,
          `${where}: the function is not settling towards ${answer} (${gaps.join(", ")})`,
        ).toBe(true);
      }
    });
  });

  it("is genuinely a zero-over-zero form at difficulties 3 and 4", () => {
    each(
      "calc.limit",
      (question, where) => {
        const { point, body } = readLimit(question.stem);
        const fraction = /^\\frac\{([\s\S]+)\}\{([\s\S]+)\}$/.exec(body.trim());
        expect(fraction, `${where}: ${body} is not a quotient`).not.toBeNull();

        const top = asFunction(fraction![1]!);
        const bottom = asFunction(fraction![2]!);
        expect(Math.abs(top(point)), `${where}: the numerator is not zero`).toBeLessThan(
          1e-9,
        );
        expect(
          Math.abs(bottom(point)),
          `${where}: the denominator is not zero, so nothing has to be cancelled`,
        ).toBeLessThan(1e-9);
      },
      [3, 4],
    );
  });

  it("is not a zero-over-zero form at difficulties 1 and 2", () => {
    each(
      "calc.limit",
      (question, where) => {
        const { point, body } = readLimit(question.stem);
        const fraction = /^\\frac\{([\s\S]+)\}\{([\s\S]+)\}$/.exec(body.trim());
        if (!fraction) return; // difficulty 1 is a polynomial
        expect(
          Math.abs(asFunction(fraction[2]!)(point)),
          `${where}: substitution is supposed to work here`,
        ).toBeGreaterThan(0.5);
      },
      [1, 2],
    );
  });
});

describe("calc.derivative", () => {
  /** The function a derivative question is about: the stem, always. */
  function functionOf(question: Question): (x: number) => number {
    return asFunction(question.stem);
  }

  it("answers with the derivative, measured rather than derived", () => {
    each("calc.derivative", (question, where) => {
      const f = functionOf(question);
      const at = /find f'\((-?\d+)\)/.exec(question.prompt.en);

      if (at) {
        const x = Number(at[1]);
        expect(
          Math.abs(centralDifference(f, x) - answerOf(question)),
          `${where}: the slope at ${x} is ${centralDifference(f, x)}`,
        ).toBeLessThan(1e-4);
        return;
      }

      const derivative = asFunction(
        (question.answer as { value: string }).value,
      );
      for (const x of [-2.3, -0.7, 0.4, 1.6, 3.1]) {
        expect(
          Math.abs(centralDifference(f, x) - derivative(x)),
          `${where}: at x = ${x} the stem's slope and the answer disagree`,
        ).toBeLessThan(1e-3);
      }
    });
  });
});

describe("calc.tangent", () => {
  const curveOf = (question: Question) =>
    asFunction(question.stem.replace(/^(y|f\(x\)) = /, ""));

  it("gives the slope of the tangent at the point asked about", () => {
    each(
      "calc.tangent",
      (question, where) => {
        const at = Number(/at x = (-?\d+)/.exec(question.prompt.en)![1]);
        const slope = centralDifference(curveOf(question), at);
        expect(
          Math.abs(slope - answerOf(question)),
          `${where}: the slope at ${at} is ${slope}`,
        ).toBeLessThan(1e-4);
      },
      [1],
    );
  });

  it("gives a tangent line that touches the curve and matches its slope", () => {
    each(
      "calc.tangent",
      (question, where) => {
        const at = Number(/at x = (-?\d+)/.exec(question.prompt.en)![1]);
        const curve = curveOf(question);
        const line = asFunction((question.answer as { value: string }).value);

        expect(
          Math.abs(line(at) - curve(at)),
          `${where}: the line misses the curve at x = ${at}`,
        ).toBeLessThan(1e-9);
        expect(
          Math.abs(centralDifference(line, at) - centralDifference(curve, at)),
          `${where}: the line crosses the curve rather than touching it`,
        ).toBeLessThan(1e-4);
      },
      [2],
    );
  });

  it("finds every x where the curve is flat, and only those", () => {
    each(
      "calc.tangent",
      (question, where) => {
        const curve = curveOf(question);
        const answer = question.answer;
        const roots =
          answer.kind === "set"
            ? (answer.values as string[]).map((value) => Number(evaluate(value)))
            : [Number(evaluate((answer as { value: string }).value))];

        for (const root of roots) {
          expect(
            Math.abs(centralDifference(curve, root)),
            `${where}: the curve is not flat at ${root}`,
          ).toBeLessThan(1e-4);
        }

        // And nowhere else in the range a learner would look.
        for (let x = -8; x <= 8; x += 0.05) {
          if (Math.abs(centralDifference(curve, x)) > 1e-3) continue;
          const claimed = roots.some((root) => Math.abs(root - x) < 0.06);
          expect(
            claimed,
            `${where}: the curve is also flat near ${x.toFixed(2)}`,
          ).toBe(true);
        }
      },
      [3],
    );
  });

  it("gives a value that really is a local high or low point", () => {
    each(
      "calc.tangent",
      (question, where) => {
        const curve = curveOf(question);
        const value = answerOf(question);
        const wantsMaximum = /local maximum/.test(question.prompt.en);

        /*
         * Find the turning points, not merely a point at the right height: a
         * cubic takes its local minimum's value at a second place as well, on
         * the way up, and the curve is not flat there at all.
         */
        const turning: { x: number; maximum: boolean }[] = [];
        const step = 0.002;
        for (let x = -12; x < 12; x += step) {
          const here = centralDifference(curve, x);
          const next = centralDifference(curve, x + step);
          if (here === 0 || here * next >= 0) continue;
          let low = x;
          let high = x + step;
          for (let i = 0; i < 50; i += 1) {
            const middle = (low + high) / 2;
            if (centralDifference(curve, low) * centralDifference(curve, middle) <= 0)
              high = middle;
            else low = middle;
          }
          const at = (low + high) / 2;
          turning.push({ x: at, maximum: curve(at) > curve(at + 0.05) && curve(at) > curve(at - 0.05) });
        }

        expect(turning.length, `${where}: the curve never turns`).toBeGreaterThan(0);
        const matching = turning.filter(
          (point) =>
            point.maximum === wantsMaximum &&
            Math.abs(curve(point.x) - value) < 1e-3,
        );
        expect(
          matching.length,
          `${where}: ${value} is not the local ${wantsMaximum ? "maximum" : "minimum"}; the turning points are ${turning
            .map((point) => `${point.maximum ? "max" : "min"} ${curve(point.x).toFixed(2)}`)
            .join(", ")}`,
        ).toBeGreaterThan(0);
      },
      [4],
    );
  });
});

describe("calc.integral", () => {
  it("gives an F whose derivative is the F' it was given", () => {
    each(
      "calc.integral",
      (question, where) => {
        const given = /F'\(x\) = ([\s\S]+?), \\quad/.exec(question.stem);
        expect(given, `${where}: ${question.stem}`).not.toBeNull();
        const target = asFunction(given![1]!);
        const F = asFunction((question.answer as { value: string }).value);

        for (const x of [-2.1, -0.6, 0.9, 2.4]) {
          expect(
            Math.abs(centralDifference(F, x) - target(x)),
            `${where}: at x = ${x} the answer's derivative is not the given one`,
          ).toBeLessThan(1e-3);
        }

        // And it passes through the point that pinned the constant down.
        const point = /F\((-?\d+)\) = (-?\d+)/.exec(question.stem)!;
        expect(
          Math.abs(F(Number(point[1])) - Number(point[2])),
          `${where}: the curve misses (${point[1]}, ${point[2]})`,
        ).toBeLessThan(1e-9);
      },
      [1, 2],
    );
  });

  it("gives the area Simpson's rule gives", () => {
    each(
      "calc.integral",
      (question, where) => {
        const match =
          /\\int_\{(-?\d+)\}\^\{(-?\d+)\} \\left\(([\s\S]+)\\right\) dx/.exec(
            question.stem,
          );
        expect(match, `${where}: ${question.stem}`).not.toBeNull();
        const from = Number(match![1]);
        const to = Number(match![2]);
        const f = asFunction(match![3]!);

        const measured = integrateNumerically(f, from, to);
        expect(
          Math.abs(measured - answerOf(question)),
          `${where}: Simpson gives ${measured}`,
        ).toBeLessThan(1e-6);
      },
      [3, 4],
    );
  });

  it("keeps an area question above the axis, where area and integral agree", () => {
    each(
      "calc.integral",
      (question, where) => {
        if (!/area/.test(question.prompt.en)) return;
        const match =
          /\\int_\{(-?\d+)\}\^\{(-?\d+)\} \\left\(([\s\S]+)\\right\) dx/.exec(
            question.stem,
          )!;
        const from = Number(match[1]);
        const to = Number(match[2]);
        const f = asFunction(match[3]!);

        for (let x = from; x <= to; x += (to - from) / 100) {
          expect(
            f(x),
            `${where}: the curve dips below the axis at ${x.toFixed(2)}, so this is not an area`,
          ).toBeGreaterThan(-1e-9);
        }
        expect(answerOf(question), `${where}: a negative area`).toBeGreaterThan(0);
      },
      [4],
    );
  });
});

describe("the whole chapter", () => {
  it("says where the stem is not machine-readable", () => {
    for (const generatorId of [
      "calc.limit",
      "calc.derivative",
      "calc.tangent",
      "calc.integral",
    ]) {
      each(generatorId, (question, where) => {
        expect(question.machineStem, where).toBeNull();
      });
    }
  });
});
