import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { katexToMath } from "@/lib/math/katex";
import { generateQuestion } from "./index";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * เลขชี้กำลังที่เป็นเศษส่วน, measured rather than trusted.
 *
 * The §9 gate checks a great deal but cannot check *this*: the stem is not an
 * equation, so there is nothing to substitute a stated answer into. Here the
 * stem is simply evaluated - `16^{3/4}` really is 8 - which is the only thing
 * that makes the question correct.
 *
 * It also pins the two bugs the first draft shipped, both of which produced a
 * question with the lesson removed: `27^{3/3}` and `(y^9)^{3/3}`, exponents
 * that cancel to a whole number.
 */
const SEEDS = [1, 2, 3, 5, 8, 11, 13, 14, 21, 34, 55, 89];

function each(check: (question: Question, where: string) => void) {
  for (const difficulty of DIFFICULTIES as readonly Difficulty[]) {
    for (const seed of SEEDS) {
      check(
        generateQuestion("exp.rational-core", seed, difficulty),
        `d${difficulty} seed ${seed}`,
      );
    }
  }
}

const answerOf = (question: Question) =>
  (question.answer as { value: string }).value;

describe("exp.rational-core", () => {
  it("states an answer the stem actually evaluates to", () => {
    each((question, where) => {
      const stem = katexToMath(question.stem);
      const answer = katexToMath(answerOf(question));

      /*
       * Difficulty 4 is symbolic, so it is compared at sample points rather
       * than as a single number. The others are numeric and exact.
       */
      const points = [1.7, 2.3, 3.1];
      for (const x of points) {
        const scope = { x, y: x };
        const stated = Number(evaluate(answer, scope));
        const actual = Number(evaluate(stem, scope));
        expect(
          Math.abs(stated - actual) / Math.max(1, Math.abs(actual)),
          `${where}: ${question.stem} is ${actual}, answer says ${stated}`,
        ).toBeLessThan(1e-9);
      }
    });
  });

  /**
   * An exponent that cancels is a question with nothing in it. `27^{3/3}` was
   * the second question this generator ever produced.
   */
  it("never asks an exponent that cancels away", () => {
    each((question, where) => {
      /*
       * Not every stem has a fraction in it - difficulty 1 writes half its
       * questions as a root, `\sqrt[3]{1000}`, where the exponent is implied.
       * The rule is about the fractions that *are* written, not that one must
       * be.
       */
      const fractions = [...question.stem.matchAll(/(-?\d+)\/(\d+)/g)];

      for (const [, top, bottom] of fractions) {
        const numerator = Math.abs(Number(top));
        const denominator = Number(bottom);
        expect(
          numerator % denominator,
          `${where}: ${numerator}/${denominator} is a whole number`,
        ).not.toBe(0);
        expect(
          gcd(numerator, denominator),
          `${where}: ${numerator}/${denominator} is not in lowest terms`,
        ).toBe(1);
      }
    });
  });

  /** Whole-number answers, so the arithmetic never obscures the method. */
  it("answers with a whole number or a unit fraction, below difficulty 4", () => {
    for (const difficulty of [1, 2, 3] as const) {
      for (const seed of SEEDS) {
        const question = generateQuestion("exp.rational-core", seed, difficulty);
        const value = Number(evaluate(answerOf(question)));
        const whole = difficulty === 3 ? 1 / value : value;
        expect(
          Number.isInteger(whole),
          `d${difficulty} seed ${seed}: ${answerOf(question)}`,
        ).toBe(true);
      }
    }
  });
});

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
