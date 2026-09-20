import { describe, expect, it } from "vitest";
import { compile, evaluate } from "mathjs";
import { katexToMath } from "@/lib/math/katex";
import { generateQuestion } from "./index";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * ทฤษฎีบทค่าเฉลี่ย · Calculus I, measured.
 *
 * These questions are unusual in the app: the theorem says a point *exists*,
 * and the question asks for it. So the check is the theorem's own statement,
 * applied to the function in the stem:
 *
 *  - for Rolle, the two ends are at the same height and the claimed c is flat;
 *  - for the mean value theorem, the claimed c has the chord's slope;
 *  - and in both, c is strictly inside the interval, because a theorem that
 *    promised an endpoint would be promising nothing.
 *
 * The bounding questions have no function at all - they are about what can be
 * deduced without one - so those are checked arithmetically against the
 * numbers in the prompt.
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

function curveOf(question: Question): (x: number) => number {
  const compiled = compile(
    katexToMath(question.stem.replace(/^(f\(x\)|s\(t\)) = /, "").split(",")[0]!),
  );
  return (x: number) => Number(compiled.evaluate({ x, t: x }));
}

const slope = (f: (x: number) => number, x: number) =>
  (f(x + 1e-6) - f(x - 1e-6)) / 2e-6;

describe("c1.rolle", () => {
  it("is given a function whose two ends really are level", () => {
    each("c1.rolle", (question, where) => {
      const [a, b] = /\((-?\d+), (-?\d+)\)/
        .exec(question.prompt.en)!
        .slice(1)
        .map(Number) as [number, number];
      const f = curveOf(question);
      expect(
        Math.abs(f(a) - f(b)),
        `${where}: f(${a}) is ${f(a)} and f(${b}) is ${f(b)} - Rolle does not apply`,
      ).toBeLessThan(1e-9);
    });
  });

  it("answers with a point that is flat and strictly inside", () => {
    each("c1.rolle", (question, where) => {
      const [a, b] = /\((-?\d+), (-?\d+)\)/
        .exec(question.prompt.en)!
        .slice(1)
        .map(Number) as [number, number];
      const f = curveOf(question);
      const asksValue = /Find f\(c\)/.test(question.prompt.en);
      const answer = answerOf(question);

      // Where it is flat, found by sweeping rather than taken from the answer.
      let flat: number | null = null;
      for (let x = a; x <= b; x += 0.0005) {
        if (Math.abs(slope(f, x)) < 1e-3) {
          flat = x;
          break;
        }
      }
      expect(flat, `${where}: nowhere flat in (${a}, ${b})`).not.toBeNull();
      expect(flat!, `${where}: the flat point is at an end`).toBeGreaterThan(a);
      expect(flat!, `${where}: the flat point is at an end`).toBeLessThan(b);

      const expected = asksValue ? f(flat!) : flat!;
      expect(Math.abs(expected - answer), `${where}: found ${expected}`).toBeLessThan(
        1e-2,
      );
    });
  });
});

describe("c1.mean-value", () => {
  it("answers with a point where the tangent matches the chord", () => {
    each(
      "c1.mean-value",
      (question, where) => {
        const [a, b] = /\((-?\d+), (-?\d+)\)/
          .exec(question.prompt.en)!
          .slice(1)
          .map(Number) as [number, number];
        const f = curveOf(question);
        const c = answerOf(question);

        const chord = (f(b) - f(a)) / (b - a);
        expect(
          Math.abs(slope(f, c) - chord),
          `${where}: the chord's slope is ${chord} and the tangent at ${c} is ${slope(f, c)}`,
        ).toBeLessThan(1e-3);

        expect(c, `${where}: c is not inside the interval`).toBeGreaterThan(a);
        expect(c, `${where}: c is not inside the interval`).toBeLessThan(b);
      },
      [1, 2, 3],
    );
  });

  /**
   * The parabola case always lands on the midpoint, and the cubic case never
   * does. Both are worth pinning: the first because the lesson says so, and
   * the second because a learner who has only met parabolas will assume it.
   */
  it("lands on the midpoint for a parabola and not for a cubic", () => {
    each(
      "c1.mean-value",
      (question, where) => {
        const [a, b] = /\((-?\d+), (-?\d+)\)/
          .exec(question.prompt.en)!
          .slice(1)
          .map(Number) as [number, number];
        const middle = (a + b) / 2;
        const isCubic = question.stem.includes("x^3");
        const c = answerOf(question);

        if (isCubic) {
          expect(
            Math.abs(c - middle),
            `${where}: the cubic's point is at the midpoint after all`,
          ).toBeGreaterThan(0.1);
        } else {
          expect(Math.abs(c - middle), `${where}: not the midpoint`).toBeLessThan(
            1e-9,
          );
        }
      },
      [1, 2, 3],
    );
  });

  it("finds the instant the journey's average speed happens", () => {
    each(
      "c1.mean-value",
      (question, where) => {
        const total = Number(/first (\d+) seconds/.exec(question.prompt.en)![1]);
        const k = Number(/is (\d+)t\^2 metres/.exec(question.prompt.en)![1]);
        const at = answerOf(question);

        const average = (k * total * total) / total;
        const instant = 2 * k * at;
        expect(
          Math.abs(instant - average),
          `${where}: at t = ${at} the speed is ${instant}, and the average is ${average}`,
        ).toBeLessThan(1e-9);
        expect(at, `${where}: outside the journey`).toBeGreaterThan(0);
        expect(at, `${where}: outside the journey`).toBeLessThan(total);
      },
      [4],
    );
  });
});

describe("c1.mvt-bound", () => {
  it("bounds the change by the rate times the width", () => {
    each("c1.mvt-bound", (question, where) => {
      const english = question.prompt.en;
      const bound = Number(/never exceeding (\d+)/.exec(english)![1]);
      const [from, to] = [
        ...english.matchAll(/f\((-?\d+)\)/g),
      ].map((match) => Number(match[1]));
      const width = Math.abs(to! - from!);
      const reach = bound * width;
      const answer = answerOf(question);

      if (/largest possible value of \|/.test(english)) {
        expect(answer, `${where}: the change should be ${reach}`).toBe(reach);
        return;
      }

      const start = Number(/= (-?\d+) and/.exec(english)![1]);
      const largest = /largest possible value of f/.test(english);
      expect(
        answer,
        `${where}: from ${start}, moving at most ${reach}`,
      ).toBe(largest ? start + reach : start - reach);
    });
  });
});

describe("the whole chapter", () => {
  it("says where the stem is not machine-readable", () => {
    for (const generatorId of ["c1.rolle", "c1.mean-value", "c1.mvt-bound"]) {
      each(generatorId, (question, where) => {
        expect(question.machineStem, where).toBeNull();
      });
    }
  });
});
