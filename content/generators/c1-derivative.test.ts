import { describe, expect, it } from "vitest";
import { compile } from "mathjs";
import { katexToMath } from "@/lib/math/katex";
import { generateQuestion } from "./index";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * อนุพันธ์และกฎการหาอนุพันธ์ · Calculus I, measured.
 *
 * Every question in this chapter shows a function and asks for its derivative,
 * so the stem and the answer are two different things and §9.5 has nothing to
 * compare - `machineStem: null` throughout.
 *
 * What replaces it is the definition of a derivative: a central difference,
 * taken at several points that are nowhere near each other. That is the same
 * oracle `calc-intro.test.ts` uses, and it is worth restating why it is a real
 * one - it shares no code with the generators, knows nothing about the product
 * rule, and would notice a wrong sign on a single term of a single question.
 *
 * The points are chosen to keep away from the poles: a quotient with `x` below
 * the line, a logarithm that needs a positive argument, and a tangent whose
 * asymptotes are a sixth of the real line apart.
 */
const SEEDS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

/** Sample points: positive, irrational-ish, and clear of every asymptote. */
const POINTS = [0.37, 0.91, 1.27, 2.31, 3.14159 / 2 + 0.4, 4.12];

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

function asFunction(source: string): (x: number) => number {
  const compiled = compile(source);
  return (x: number) => Number(compiled.evaluate({ x }));
}

const fromKatex = (katex: string) => asFunction(katexToMath(katex));

/** The derivative at a point, from the definition. */
function centralDifference(f: (x: number) => number, x: number): number {
  const h = 1e-5;
  return (f(x + h) - f(x - h)) / (2 * h);
}

/**
 * The claimed derivative, measured against the real one.
 *
 * The tolerance is relative: `x^4 e^x` has a derivative in the hundreds by the
 * time x is four, and an absolute tolerance would either pass everything there
 * or fail everything near zero.
 */
function agreesWithTheSlope(question: Question, where: string): void {
  const f = fromKatex(question.stem);
  const claimed = asFunction((question.answer as { value: string }).value);

  let compared = 0;
  for (const x of POINTS) {
    const measured = centralDifference(f, x);
    const stated = claimed(x);
    if (!Number.isFinite(measured) || !Number.isFinite(stated)) continue;

    const scale = Math.max(1, Math.abs(measured));
    expect(
      Math.abs(measured - stated) / scale,
      `${where}: at x = ${x} the slope of ${question.stem} is ${measured}, and the answer says ${stated}`,
    ).toBeLessThan(1e-4);
    compared += 1;
  }

  expect(compared, `${where}: nothing could be compared`).toBeGreaterThanOrEqual(4);
}

describe("c1.first-principles", () => {
  it("answers with the derivative", () => {
    each("c1.first-principles", agreesWithTheSlope);
  });

  it("works from a function, not from an answer already given", () => {
    each("c1.first-principles", (question, where) => {
      expect(question.prompt.en, where).toContain("from the definition");
      // The stem is the function itself: nothing in it is already a derivative.
      expect(question.stem, where).not.toContain("'");
    });
  });
});

describe("c1.product-quotient", () => {
  it("answers with the derivative", () => {
    each("c1.product-quotient", agreesWithTheSlope);
  });

  /**
   * The product rule and multiplying out first have to agree. For the products
   * here they genuinely can be compared, because the expansion is a polynomial
   * this test can differentiate numerically as well.
   */
  it("agrees with expanding the brackets first", () => {
    each(
      "c1.product-quotient",
      (question, where) => {
        const f = fromKatex(question.stem);
        const claimed = asFunction(
          (question.answer as { value: string }).value,
        );
        for (const x of [-1.7, 0.3, 2.9]) {
          expect(
            Math.abs(centralDifference(f, x) - claimed(x)) /
              Math.max(1, Math.abs(claimed(x))),
            `${where}: at x = ${x}`,
          ).toBeLessThan(1e-4);
        }
      },
      [1, 2],
    );
  });
});

describe("c1.trig-derivative", () => {
  it("answers with the derivative", () => {
    each("c1.trig-derivative", agreesWithTheSlope);
  });

  it("keeps the minus that belongs to the cosine", () => {
    each(
      "c1.trig-derivative",
      (question, where) => {
        if (!question.stem.includes("\\cos")) return;
        const claimed = asFunction(
          (question.answer as { value: string }).value,
        );
        const f = fromKatex(question.stem);
        /*
         * A sign error here is invisible in the algebra and obvious in the
         * numbers: at a point where the cosine is falling, the derivative of a
         * positive multiple of it has to be negative.
         */
        const x = 0.8;
        expect(
          Math.sign(claimed(x)),
          `${where}: the answer's sign disagrees with the graph's slope`,
        ).toBe(Math.sign(centralDifference(f, x)));
      },
      [1],
    );
  });
});

describe("c1.exp-log-derivative", () => {
  it("answers with the derivative", () => {
    each("c1.exp-log-derivative", agreesWithTheSlope);
  });

  it("leaves no logarithm in the derivative of a plain logarithm", () => {
    each(
      "c1.exp-log-derivative",
      (question, where) => {
        const answer = (question.answer as { value: string }).value;
        expect(answer, `${where}: ${answer}`).not.toContain("log");
      },
      [2],
    );
  });
});

describe("the whole chapter", () => {
  it("says where the stem is not machine-readable", () => {
    for (const generatorId of [
      "c1.first-principles",
      "c1.product-quotient",
      "c1.trig-derivative",
      "c1.exp-log-derivative",
    ]) {
      each(generatorId, (question, where) => {
        expect(question.machineStem, where).toBeNull();
      });
    }
  });

  it("offers a wrong answer that really is wrong", () => {
    for (const generatorId of [
      "c1.first-principles",
      "c1.product-quotient",
      "c1.trig-derivative",
      "c1.exp-log-derivative",
    ]) {
      each(generatorId, (question, where) => {
        const right = asFunction((question.answer as { value: string }).value);
        for (const mistake of question.misconceptions ?? []) {
          const wrong = asFunction(
            (mistake.answer as { value: string }).value,
          );
          const differs = POINTS.some((x) => {
            const a = right(x);
            const b = wrong(x);
            return (
              Number.isFinite(a) &&
              Number.isFinite(b) &&
              Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(a))
            );
          });
          expect(
            differs,
            `${where}: ${(mistake.answer as { value: string }).value} is the right answer`,
          ).toBe(true);
        }
      });
    }
  });
});
