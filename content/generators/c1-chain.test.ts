import { describe, expect, it } from "vitest";
import { compile } from "mathjs";
import { katexToMath } from "@/lib/math/katex";
import { generateQuestion } from "./index";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * กฎลูกโซ่ และอนุพันธ์โดยปริยาย · Calculus I, measured.
 *
 * The chain rule questions are checked the way every derivative in the app is
 * checked: a central difference, which knows nothing about the rule and would
 * notice a missing factor immediately - and a missing factor is the whole
 * mistake this chapter is about.
 *
 * The implicit ones need something else, because their answers contain both x
 * and y and there is no function to differentiate. What holds there is the
 * relation itself: for `F(x, y) = 0`, the implicit derivative is `-F_x / F_y`,
 * and both partial derivatives are measured from the stem. That never looks at
 * the working, which is what makes it a test of it.
 */
const SEEDS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

/** Away from zero, away from the poles, and nowhere near each other. */
const POINTS = [0.41, 1.13, 2.27, 3.71];

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

const fromKatex = (katex: string) => asFunction(katexToMath(katex));

function centralDifference(f: (x: number) => number, x: number): number {
  const h = 1e-5;
  return (f(x + h) - f(x - h)) / (2 * h);
}

/** Every derivative question in the chapter, against the slope it claims. */
function agreesWithTheSlope(question: Question, where: string): void {
  const f = fromKatex(question.stem);
  const claimed = asFunction((question.answer as { value: string }).value);

  let compared = 0;
  for (const x of POINTS) {
    const measured = centralDifference(f, x);
    const stated = claimed(x);
    if (!Number.isFinite(measured) || !Number.isFinite(stated)) continue;
    if (Math.abs(measured) > 1e8) continue; // beyond what a difference resolves

    expect(
      Math.abs(measured - stated) / Math.max(1, Math.abs(measured)),
      `${where}: at x = ${x} the slope is ${measured} and the answer says ${stated}`,
    ).toBeLessThan(1e-4);
    compared += 1;
  }

  expect(compared, `${where}: nothing could be compared`).toBeGreaterThanOrEqual(2);
}

describe("the chain rule", () => {
  it("answers with the derivative, at every difficulty", () => {
    each("c1.chain-power", agreesWithTheSlope);
    each("c1.chain-transcendental", agreesWithTheSlope);
    each("c1.chain-combined", agreesWithTheSlope);
  });

  /**
   * The inside factor, specifically. Leaving it out is the mistake the whole
   * chapter is about, and it is invisible in the shape of the answer - so this
   * checks that the answer is *not* what forgetting it would have produced.
   */
  it("includes the derivative of the inside", () => {
    each("c1.chain-transcendental", (question, where) => {
      const stated = (question.answer as { value: string }).value;
      const mistake = question.misconceptions?.[0];
      expect(mistake, `${where}: no named mistake`).toBeDefined();

      const right = asFunction(stated);
      const wrong = asFunction((mistake!.answer as { value: string }).value);
      const differs = POINTS.some(
        (x) =>
          Number.isFinite(right(x)) &&
          Number.isFinite(wrong(x)) &&
          Math.abs(right(x) - wrong(x)) > 1e-9,
      );
      expect(
        differs,
        `${where}: the answer is the same with and without the chain factor`,
      ).toBe(true);
    });
  });
});

describe("c1.implicit", () => {
  /**
   * `-F_x / F_y`, both measured.
   *
   * The points are chosen on the curve itself wherever that is easy, and
   * otherwise anywhere at all: the identity `y' = -F_x/F_y` holds at every
   * point of the plane where `F_y` is not zero, not only on the curve, so
   * there is nothing to solve for.
   */
  it("agrees with the relation it was derived from", () => {
    each("c1.implicit", (question, where) => {
      const [left, right] = question.stem.split("=");
      expect(right, `${where}: ${question.stem}`).toBeDefined();
      const relation = compile(
        `(${katexToMath(left!)}) - (${katexToMath(right!)})`,
      );
      const claimed = compile((question.answer as { value: string }).value);

      const h = 1e-6;
      let compared = 0;

      for (const [x, y] of [
        [1.3, 2.1],
        [2.7, 1.4],
        [-1.9, 3.2],
        [3.3, -2.6],
      ]) {
        const at = (px: number, py: number) =>
          Number(relation.evaluate({ x: px, y: py }));
        const fx = (at(x! + h, y!) - at(x! - h, y!)) / (2 * h);
        const fy = (at(x!, y! + h) - at(x!, y! - h)) / (2 * h);
        if (!Number.isFinite(fx) || !Number.isFinite(fy)) continue;
        if (Math.abs(fy) < 1e-6) continue;

        const expected = -fx / fy;
        const stated = Number(claimed.evaluate({ x, y }));
        if (!Number.isFinite(stated)) continue;

        expect(
          Math.abs(expected - stated) / Math.max(1, Math.abs(expected)),
          `${where}: at (${x}, ${y}) the relation gives ${expected} and the answer says ${stated}`,
        ).toBeLessThan(1e-5);
        compared += 1;
      }

      expect(compared, `${where}: nothing could be compared`).toBeGreaterThanOrEqual(2);
    });
  });

  it("answers in terms of both letters, as an implicit derivative must", () => {
    each("c1.implicit", (question, where) => {
      const stated = (question.answer as { value: string }).value;
      expect(stated, `${where}: ${stated}`).toContain("y");
    });
  });
});

describe("the whole chapter", () => {
  it("says where the stem is not machine-readable", () => {
    for (const generatorId of [
      "c1.chain-power",
      "c1.chain-transcendental",
      "c1.chain-combined",
      "c1.implicit",
    ]) {
      each(generatorId, (question, where) => {
        expect(question.machineStem, where).toBeNull();
      });
    }
  });
});
