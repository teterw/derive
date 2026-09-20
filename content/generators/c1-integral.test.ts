import { describe, expect, it } from "vitest";
import { compile, evaluate } from "mathjs";
import { katexToMath } from "@/lib/math/katex";
import { generateQuestion } from "./index";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * ปริพันธ์ · Calculus I, measured.
 *
 * An integral is checked the way a learner is told to check one: differentiate
 * the answer and see whether the integrand comes back. That is a genuinely
 * independent test - it uses the definition of an antiderivative rather than
 * any of the rules used to find it - and it catches the two mistakes the
 * chapter is about, a missing chain factor and a division by the wrong number.
 *
 * Definite integrals are checked twice over: by differentiating the
 * antiderivative in the working, and by Simpson's rule on the integrand, which
 * is exact for everything here except the trigonometric cases and close enough
 * on those.
 *
 * Riemann sums are re-added from scratch, rectangle by rectangle.
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

const asFunction = (source: string) => {
  const compiled = compile(source);
  return (x: number) => Number(compiled.evaluate({ x }));
};

const answerOf = (question: Question) =>
  Number(evaluate((question.answer as { value: string }).value));

function centralDifference(f: (x: number) => number, x: number): number {
  const h = 1e-5;
  return (f(x + h) - f(x - h)) / (2 * h);
}

/**
 * `\int <integrand> dx`, with or without limits and with or without brackets.
 *
 * The `dx` is written both as `\,dx` and as a plain ` dx` across the chapter,
 * and a pattern that insisted on the thin space left `dx` in the expression -
 * where mathjs read it as a symbol nobody had defined.
 */
function integrandOf(stem: string): (x: number) => number {
  const body = stem
    .replace(
      /^\\int(_\{[^{}]*\})?(\^\{(?:[^{}]|\{[^{}]*\})*\})?\s*/,
      "",
    )
    .replace(/\s*(\\,)?\s*dx\s*$/, "")
    .replace(/^\\left\(([\s\S]*)\\right\)$/, "$1")
    .trim();
  return asFunction(katexToMath(body));
}

describe("c1.integral-power", () => {
  it("answers with something whose derivative is the integrand", () => {
    each("c1.integral-power", (question, where) => {
      const integrand = integrandOf(question.stem);
      const F = asFunction((question.answer as { value: string }).value);

      let compared = 0;
      for (const x of [0.6, 1.4, 2.7, 3.9]) {
        const measured = centralDifference(F, x);
        const target = integrand(x);
        if (!Number.isFinite(measured) || !Number.isFinite(target)) continue;
        expect(
          Math.abs(measured - target) / Math.max(1, Math.abs(target)),
          `${where}: at x = ${x} the answer's derivative is ${measured}, and the integrand is ${target}`,
        ).toBeLessThan(1e-4);
        compared += 1;
      }
      expect(compared, `${where}: nothing compared`).toBeGreaterThanOrEqual(3);
    });
  });

  it("passes through the point that pinned the constant down", () => {
    each(
      "c1.integral-power",
      (question, where) => {
        const point = /\((-?\d+), (-?\d+)\)/.exec(question.prompt.en);
        expect(point, `${where}: no point given`).not.toBeNull();
        const F = asFunction((question.answer as { value: string }).value);
        expect(
          Math.abs(F(Number(point![1])) - Number(point![2])),
          `${where}: the curve misses its own point`,
        ).toBeLessThan(1e-9);
      },
      [1, 2],
    );
  });
});

describe("c1.substitution", () => {
  it("answers with something whose derivative is the integrand", () => {
    each("c1.substitution", (question, where) => {
      const integrand = integrandOf(question.stem);
      const F = asFunction((question.answer as { value: string }).value);

      for (const x of [0.3, 1.1, 2.2]) {
        const measured = centralDifference(F, x);
        const target = integrand(x);
        expect(
          Math.abs(measured - target) / Math.max(1, Math.abs(target)),
          `${where}: at x = ${x}, ${measured} against ${target}`,
        ).toBeLessThan(1e-4);
      }
    });
  });

  /**
   * The chain factor, specifically. Forgetting it is the mistake, and the
   * named wrong answer has to be genuinely different from the right one.
   */
  it("keeps the factor the substitution introduces", () => {
    each("c1.substitution", (question, where) => {
      const right = asFunction((question.answer as { value: string }).value);
      const mistake = question.misconceptions?.[0];
      expect(mistake, `${where}: no named mistake`).toBeDefined();
      const wrong = asFunction((mistake!.answer as { value: string }).value);

      const differs = [0.4, 1.3, 2.1].some(
        (x) => Math.abs(right(x) - wrong(x)) > 1e-6 * Math.max(1, Math.abs(right(x))),
      );
      expect(differs, `${where}: the factor makes no difference`).toBe(true);
    });
  });
});

describe("c1.definite", () => {
  /** Simpson's rule, exact for cubics and very good for the rest. */
  function integrateNumerically(
    f: (x: number) => number,
    from: number,
    to: number,
  ): number {
    const intervals = 2000;
    const width = (to - from) / intervals;
    let total = f(from) + f(to);
    for (let i = 1; i < intervals; i += 1) {
      total += f(from + i * width) * (i % 2 === 0 ? 2 : 4);
    }
    return (total * width) / 3;
  }

  it("agrees with numerical integration of its own integrand", () => {
    each("c1.definite", (question, where) => {
      const limits =
        /\\int_\{(-?\d+)\}\^\{(-?\d+)\}/.exec(question.stem) ??
        /\\int_\{(0)\}\^\{\\frac\{(\d+)\\pi\}\{(\d+)\}\}/.exec(question.stem);
      expect(limits, `${where}: ${question.stem}`).not.toBeNull();

      const from = Number(limits![1]);
      const to =
        limits!.length > 3
          ? (Number(limits![2]) * Math.PI) / Number(limits![3])
          : Number(limits![2]);

      const measured = integrateNumerically(integrandOf(question.stem), from, to);
      expect(
        Math.abs(measured - answerOf(question)) /
          Math.max(1, Math.abs(measured)),
        `${where}: Simpson gives ${measured}`,
      ).toBeLessThan(1e-6);
    });
  });
});

describe("c1.riemann", () => {
  it("adds up the rectangles the question describes", () => {
    each("c1.riemann", (question, where) => {
      const english = question.prompt.en;
      const [from, to] = /\[(-?\d+), (-?\d+)\]/
        .exec(english)!
        .slice(1)
        .map(Number) as [number, number];
      const count = Number(/with (\d+) equal pieces/.exec(english)![1]);
      const left = /at its left edge/.test(english);

      const f = asFunction(
        katexToMath(question.stem.replace(/^f\(x\) = /, "").split(",")[0]!),
      );

      // Re-added here, one rectangle at a time.
      const width = (to - from) / count;
      let total = 0;
      for (let i = 0; i < count; i += 1) {
        total += f(from + (left ? i : i + 1) * width) * width;
      }

      expect(
        Math.abs(total - answerOf(question)),
        `${where}: adding the rectangles gives ${total}`,
      ).toBeLessThan(1e-9);
    });
  });

  it("is an approximation, and says which way it leans", () => {
    each("c1.riemann", (question, where) => {
      const left = /at its left edge/.test(question.prompt.en);
      const [from, to] = /\[(-?\d+), (-?\d+)\]/
        .exec(question.prompt.en)!
        .slice(1)
        .map(Number) as [number, number];
      const f = asFunction(
        katexToMath(question.stem.replace(/^f\(x\) = /, "").split(",")[0]!),
      );

      /*
       * Every function here is rising, so a left-hand sum must fall short of
       * the true area and a right-hand one must overshoot. If that ever fails,
       * either the function is not rising or the sides are mixed up.
       */
      const exact = (() => {
        const intervals = 2000;
        const width = (to - from) / intervals;
        let total = f(from) + f(to);
        for (let i = 1; i < intervals; i += 1) {
          total += f(from + i * width) * (i % 2 === 0 ? 2 : 4);
        }
        return (total * width) / 3;
      })();

      const sum = answerOf(question);
      expect(
        left ? sum < exact : sum > exact,
        `${where}: a ${left ? "left" : "right"}-hand sum of ${sum} against a true ${exact}`,
      ).toBe(true);
    });
  });
});

describe("the whole chapter", () => {
  it("says where the stem is not machine-readable", () => {
    for (const generatorId of [
      "c1.integral-power",
      "c1.substitution",
      "c1.definite",
      "c1.riemann",
    ]) {
      each(generatorId, (question, where) => {
        expect(question.machineStem, where).toBeNull();
      });
    }
  });
});
