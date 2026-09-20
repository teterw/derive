import { describe, expect, it } from "vitest";
import { compile, evaluate } from "mathjs";
import { katexToMath } from "@/lib/math/katex";
import { generateQuestion } from "./index";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * การประยุกต์ของอนุพันธ์ · Calculus I, measured.
 *
 * A claimed maximum is checked by looking either side of it. A claimed
 * inflection is checked by measuring the curvature on both sides and insisting
 * it changes sign. A claimed optimum area is checked by *building the shape*
 * from the numbers in the prompt and trying every nearby size.
 *
 * That last one matters more than it sounds. An optimisation generator can get
 * the calculus perfectly right and model the situation wrongly - the wall
 * counted twice, the lid counted when there is none - and no amount of
 * checking the derivative would notice. So this file rebuilds the model from
 * the prompt and compares against sizes either side, which is what "largest"
 * means.
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

/** The function in a `f(x) = ...` stem. */
function curveOf(question: Question): (x: number) => number {
  const compiled = compile(
    katexToMath(question.stem.replace(/^f\(x\) = /, "")),
  );
  return (x: number) => Number(compiled.evaluate({ x }));
}

const slope = (f: (x: number) => number, x: number) =>
  (f(x + 1e-5) - f(x - 1e-5)) / 2e-5;

const curvature = (f: (x: number) => number, x: number) =>
  (f(x + 1e-3) - 2 * f(x) + f(x - 1e-3)) / 1e-6;

describe("c1.monotonic", () => {
  it("names a turning point where the graph really turns", () => {
    each(
      "c1.monotonic",
      (question, where) => {
        const f = curveOf(question);
        const at = answerOf(question);
        expect(Math.abs(slope(f, at)), `${where}: the slope at ${at}`).toBeLessThan(
          1e-3,
        );

        const rises = /rises until/.test(question.prompt.en);
        // Rising before it, falling after - or the other way round.
        expect(
          Math.sign(slope(f, at - 0.5)),
          `${where}: the graph is not ${rises ? "rising" : "falling"} before ${at}`,
        ).toBe(rises ? 1 : -1);
        expect(
          Math.sign(slope(f, at + 0.5)),
          `${where}: the graph is not ${rises ? "falling" : "rising"} after ${at}`,
        ).toBe(rises ? -1 : 1);
      },
      [1, 2],
    );
  });

  it("names an inflection where the curvature really changes sign", () => {
    each(
      "c1.monotonic",
      (question, where) => {
        const f = curveOf(question);
        const asksY = /Find the y/.test(question.prompt.en);

        /*
         * Where the second derivative vanishes, found by sweeping rather than
         * taken from the answer - so a claimed inflection has to be one this
         * test found for itself.
         */
        let found: number | null = null;
        for (let x = -12; x < 12; x += 0.01) {
          const here = curvature(f, x);
          /*
           * Landing exactly on it counts. The inflections here are halves, the
           * sweep steps in hundredths, and a product of zero is not negative -
           * so testing only for a sign *change* stepped straight over them.
           */
          if (Math.abs(here) < 1e-6) {
            found = x;
            break;
          }
          if (here * curvature(f, x + 0.01) < 0) {
            // Bisected, not guessed: the y at the inflection is asked for too,
            // and half a hundredth of x is a visible distance up a cubic.
            let low = x;
            let high = x + 0.01;
            for (let i = 0; i < 40; i += 1) {
              const middle = (low + high) / 2;
              if (curvature(f, low) * curvature(f, middle) <= 0) high = middle;
              else low = middle;
            }
            found = (low + high) / 2;
            break;
          }
        }
        expect(found, `${where}: the curvature never changes sign`).not.toBeNull();

        const expected = asksY ? f(found!) : found!;
        expect(
          Math.abs(expected - answerOf(question)),
          `${where}: the inflection is at ${found}`,
        ).toBeLessThan(0.02);
      },
      [3, 4],
    );
  });
});

describe("c1.extrema", () => {
  it("classifies the turning point the way the curvature does", () => {
    each(
      "c1.extrema",
      (question, where) => {
        const f = curveOf(question);
        const wantsMaximum = /local maximum/.test(question.prompt.en);
        const asksWhere = /Find the x/.test(question.prompt.en);
        const answer = answerOf(question);

        const at = asksWhere
          ? answer
          : (() => {
              // The position that takes the stated value and is flat.
              for (let x = -12; x <= 12; x += 0.001) {
                if (Math.abs(f(x) - answer) < 1e-3 && Math.abs(slope(f, x)) < 1e-2) {
                  return x;
                }
              }
              return NaN;
            })();

        expect(Number.isFinite(at), `${where}: no flat point takes ${answer}`).toBe(
          true,
        );
        expect(Math.abs(slope(f, at)), `${where}: not a turning point`).toBeLessThan(
          1e-2,
        );
        expect(
          Math.sign(curvature(f, at)),
          `${where}: a ${wantsMaximum ? "maximum" : "minimum"} bends the wrong way`,
        ).toBe(wantsMaximum ? -1 : 1);
      },
      [1, 2],
    );
  });

  it("finds the best value on the interval, ends included", () => {
    each(
      "c1.extrema",
      (question, where) => {
        const f = curveOf(question);
        const [from, to] = /\[(-?\d+), (-?\d+)\]/
          .exec(question.prompt.en)!
          .slice(1)
          .map(Number) as [number, number];
        const wantsMaximum = /absolute maximum/.test(question.prompt.en);

        // Swept, so an endpoint wins on its own merits or not at all.
        let best = f(from);
        for (let x = from; x <= to; x += 0.001) {
          const value = f(x);
          if (wantsMaximum ? value > best : value < best) best = value;
        }

        expect(
          Math.abs(best - answerOf(question)),
          `${where}: sweeping [${from}, ${to}] gives ${best}`,
        ).toBeLessThan(1e-2);
      },
      [3, 4],
    );
  });
});

describe("c1.optimisation", () => {
  /**
   * The model, rebuilt from the prompt rather than from the generator.
   *
   * Each returns the quantity the question asks about as a function of the one
   * free variable, and the range that variable may take.
   */
  function modelOf(
    question: Question,
  ): { at: (x: number) => number; from: number; to: number } | null {
    const english = question.prompt.en;

    const wall = /(\d+) metres of fence for the other three/.exec(english);
    if (wall) {
      const fence = Number(wall[1]);
      // x is the side perpendicular to the wall; the parallel side is P - 2x.
      return { at: (x) => x * (fence - 2 * x), from: 0.01, to: fence / 2 - 0.01 };
    }

    const perimeter = /perimeter of (\d+) metres/.exec(english);
    if (perimeter) {
      const total = Number(perimeter[1]);
      return { at: (x) => x * (total / 2 - x), from: 0.01, to: total / 2 - 0.01 };
    }

    const box = /(open-topped|closed) box .* volume (\d+)/.exec(english);
    if (box) {
      const open = box[1] === "open-topped";
      const volume = Number(box[2]);
      return {
        at: (x) => (open ? 1 : 2) * x * x + (4 * volume) / x,
        from: 0.2,
        to: 40,
      };
    }

    const numbers = /Two positive numbers add to (\d+)/.exec(english);
    if (numbers) {
      const total = Number(numbers[1]);
      return { at: (x) => x * x + (total - x) ** 2, from: 0.01, to: total - 0.01 };
    }

    return null;
  }

  it("really is the best the situation allows", () => {
    each("c1.optimisation", (question, where) => {
      const model = modelOf(question);
      expect(model, `${where}: ${question.prompt.en}`).not.toBeNull();

      const wantsLargest = /largest|maximum/.test(question.prompt.en);
      const { at, from, to } = model!;

      let best = at(from);
      let bestAt = from;
      const step = (to - from) / 4000;
      for (let x = from; x <= to; x += step) {
        const value = at(x);
        if (wantsLargest ? value > best : value < best) {
          best = value;
          bestAt = x;
        }
      }

      expect(
        Math.abs(best - answerOf(question)) / Math.max(1, Math.abs(best)),
        `${where}: sweeping the model gives ${best} at x = ${bestAt.toFixed(3)}, and the answer says ${answerOf(question)}`,
      ).toBeLessThan(1e-3);
    });
  });
});

describe("c1.related-rates", () => {
  /**
   * The rate, recomputed from the relation in the prompt.
   *
   * Each case differentiates the relation numerically - `dQ/dt` is
   * `dQ/dr · dr/dt`, and the first factor is measured rather than quoted.
   */
  it("agrees with the chain rule applied to the relation", () => {
    each("c1.related-rates", (question, where) => {
      const english = question.prompt.en;
      const rate = Number(/at (\d+) (?:cm|metres)/.exec(english)![1]);
      const answer = answerOf(question);

      const h = 1e-6;
      const measure = (f: (v: number) => number, v: number) =>
        ((f(v + h) - f(v - h)) / (2 * h)) * rate;

      if (/square's side/.test(english)) {
        const side = Number(/side is (\d+)/.exec(english)![1]);
        expect(
          Math.abs(measure((x) => x * x, side) - answer),
          `${where}: area rate`,
        ).toBeLessThan(1e-3);
        return;
      }

      if (/circle's radius/.test(english)) {
        const r = Number(/radius is (\d+)/.exec(english)![1]);
        expect(
          Math.abs(measure((x) => Math.PI * x * x, r) - answer),
          `${where}: circle area rate`,
        ).toBeLessThan(1e-3);
        return;
      }

      if (/spherical balloon/.test(english)) {
        const r = Number(/radius is (\d+)/.exec(english)![1]);
        expect(
          Math.abs(measure((x) => (4 / 3) * Math.PI * x ** 3, r) - answer),
          `${where}: sphere volume rate`,
        ).toBeLessThan(1e-3);
        return;
      }

      // The ladder: y = sqrt(L^2 - x^2), and dy/dt = dy/dx · dx/dt.
      const ladder = /A (\d+) metre ladder/.exec(english)!;
      const length = Number(ladder[1]);
      const x = Number(/foot is (\d+) metres/.exec(english)![1]);
      expect(
        Math.abs(measure((v) => Math.sqrt(length * length - v * v), x) - answer),
        `${where}: ladder rate`,
      ).toBeLessThan(1e-3);
      expect(answer, `${where}: the top should be descending`).toBeLessThan(0);
    });
  });
});

describe("the whole chapter", () => {
  it("says where the stem is not machine-readable", () => {
    for (const generatorId of [
      "c1.monotonic",
      "c1.extrema",
      "c1.optimisation",
      "c1.related-rates",
    ]) {
      each(generatorId, (question, where) => {
        expect(question.machineStem, where).toBeNull();
      });
    }
  });
});
