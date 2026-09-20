import { describe, expect, it } from "vitest";
import { compile, evaluate } from "mathjs";
import { katexToMath } from "@/lib/math/katex";
import { generateQuestion } from "./index";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * ทฤษฎีบทหลักมูลของแคลคูลัส · Calculus I, measured.
 *
 * The theorem itself is what this file tests, one half at a time:
 *
 *  - **part one** says the derivative of an accumulated area is the integrand
 *    at the moving edge. So the accumulation is built numerically - integrate
 *    from the lower limit up to a point - and then differentiated. If the
 *    theorem holds and the answer is right, the two agree.
 *  - **part two** is checked against Simpson's rule on the integrand, which
 *    knows nothing about antiderivatives.
 *  - **net change** is the same, applied to a rate.
 *  - **the area between two curves** is checked by integrating the gap, and
 *    separately by insisting the curves really do cross where the working says
 *    and that the answer is positive.
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

const asFunction = (source: string, variable = "x") => {
  const compiled = compile(source);
  return (value: number) =>
    Number(compiled.evaluate({ [variable]: value, x: value, t: value }));
};

const answerOf = (question: Question) =>
  Number(evaluate((question.answer as { value: string }).value));

/** Simpson's rule: exact for cubics, which is everything here. */
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

describe("c1.ftc-first", () => {
  /**
   * The accumulation, built and then differentiated.
   *
   * This is the theorem's own statement turned into an experiment: integrate
   * up to a moving edge, watch how fast the total grows, and compare with what
   * the answer claims. Nothing here knows the rule.
   */
  it("agrees with differentiating a numerically accumulated area", () => {
    each("c1.ftc-first", (question, where) => {
      const match =
        /\\frac\{d\}\{dx\}\\int_\{(-?\d+)\}\^\{([^}]+)\} \\left\(([\s\S]+)\\right\) dt/.exec(
          question.stem,
        );
      expect(match, `${where}: ${question.stem}`).not.toBeNull();

      const lower = Number(match![1]);
      const upperExpression = asFunction(katexToMath(match![2]!));
      const integrand = asFunction(katexToMath(match![3]!), "t");
      const claimed = asFunction((question.answer as { value: string }).value);

      const accumulate = (x: number) =>
        integrateNumerically(integrand, lower, upperExpression(x));

      for (const x of [0.7, 1.3, 2.1]) {
        const h = 1e-4;
        const measured = (accumulate(x + h) - accumulate(x - h)) / (2 * h);
        const stated = claimed(x);
        expect(
          Math.abs(measured - stated) / Math.max(1, Math.abs(stated)),
          `${where}: at x = ${x} the accumulation grows at ${measured}, and the answer says ${stated}`,
        ).toBeLessThan(1e-3);
      }
    });
  });
});

describe("c1.ftc-second", () => {
  it("agrees with numerical integration", () => {
    each("c1.ftc-second", (question, where) => {
      const match =
        /\\int_\{(-?\d+)\}\^\{(-?\d+)\} \\left\(([\s\S]+)\\right\) dx/.exec(
          question.stem,
        );
      expect(match, `${where}: ${question.stem}`).not.toBeNull();

      const measured = integrateNumerically(
        asFunction(katexToMath(match![3]!)),
        Number(match![1]),
        Number(match![2]),
      );
      expect(
        Math.abs(measured - answerOf(question)) / Math.max(1, Math.abs(measured)),
        `${where}: Simpson gives ${measured}`,
      ).toBeLessThan(1e-6);
    });
  });
});

describe("c1.net-change", () => {
  it("is the integral of the rate it was given", () => {
    each("c1.net-change", (question, where) => {
      const rate = asFunction(
        katexToMath(question.stem.replace(/^[vr]\(t\) = /, "")),
        "t",
      );
      const to = Number(/t = (\d+)(?:, in| metres)/.exec(question.prompt.en)![1]);

      const measured = integrateNumerically(rate, 0, to);
      expect(
        Math.abs(measured - answerOf(question)) / Math.max(1, Math.abs(measured)),
        `${where}: integrating the rate gives ${measured}`,
      ).toBeLessThan(1e-6);
    });
  });

  /**
   * At difficulty 4 the velocity changes sign, which is the whole point: the
   * displacement and the distance travelled are different numbers, and the
   * question asks for the first.
   */
  it("lets the negative part cancel, as a displacement must", () => {
    each(
      "c1.net-change",
      (question, where) => {
        const rate = asFunction(
          katexToMath(question.stem.replace(/^v\(t\) = /, "")),
          "t",
        );
        const to = Number(/t = (\d+), in metres/.exec(question.prompt.en)![1]);

        const signed = integrateNumerically(rate, 0, to);
        const distance = integrateNumerically((t) => Math.abs(rate(t)), 0, to);

        expect(
          distance,
          `${where}: the velocity never changes sign, so there is nothing to cancel`,
        ).toBeGreaterThan(Math.abs(signed) + 1e-6);
        expect(
          Math.abs(signed - answerOf(question)) / Math.max(1, Math.abs(signed)),
          `${where}: the displacement is ${signed}`,
        ).toBeLessThan(1e-6);
      },
      [4],
    );
  });
});

describe("c1.area-between", () => {
  it("is the integral of the gap, and is positive", { timeout: 30_000 }, () => {
    each("c1.area-between", (question, where) => {
      const [first, second] = question.stem.split(", \\quad ");
      const curve = asFunction(katexToMath(first!.replace(/^y = /, "")));
      const line = asFunction(katexToMath(second!.replace(/^y = /, "")));

      /*
       * Where they cross, found by sweeping rather than taken from the working.
       * The step is a hundredth: every crossing here is a whole number, and the
       * bisection below supplies the precision - a finer sweep only made the
       * suite slower.
       */
      const crossings: number[] = [];
      const step = 0.01;
      for (let x = -12; x < 12; x += step) {
        const here = curve(x) - line(x);
        const next = curve(x + step) - line(x + step);
        if (here === 0 || here * next < 0) {
          let low = x;
          let high = x + step;
          for (let i = 0; i < 50; i += 1) {
            const middle = (low + high) / 2;
            if ((curve(low) - line(low)) * (curve(middle) - line(middle)) <= 0)
              high = middle;
            else low = middle;
          }
          crossings.push((low + high) / 2);
        }
      }
      expect(crossings.length, `${where}: the curves do not cross twice`).toBe(2);

      const [from, to] = crossings as [number, number];
      const area = integrateNumerically((x) => line(x) - curve(x), from, to);

      expect(area, `${where}: the enclosed area came out negative`).toBeGreaterThan(0);
      expect(
        Math.abs(area - answerOf(question)) / Math.max(1, Math.abs(area)),
        `${where}: the gap integrates to ${area}`,
      ).toBeLessThan(1e-5);
    });
  });
});

describe("the whole chapter", () => {
  it("says where the stem is not machine-readable", () => {
    for (const generatorId of [
      "c1.ftc-first",
      "c1.ftc-second",
      "c1.net-change",
      "c1.area-between",
    ]) {
      each(generatorId, (question, where) => {
        expect(question.machineStem, where).toBeNull();
      });
    }
  });
});
