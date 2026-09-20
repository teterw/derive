import { describe, expect, it } from "vitest";
import { compile, evaluate } from "mathjs";
import { katexToMath } from "@/lib/math/katex";
import { generateQuestion } from "./index";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * ลิมิตและความต่อเนื่อง · Calculus I, checked by measurement.
 *
 * The same principle as `calc-intro.test.ts`: the definitions are the oracle,
 * not a second implementation of the rules.
 *
 *   - a **one-sided limit** is approached from one side, so each branch is
 *     evaluated only on the side of the join it actually governs;
 *   - a **limit at infinity** is what happens far out, so the function is
 *     evaluated at a thousand, a million and a billion, and the answer has to
 *     be what it is settling on;
 *   - **continuity** is the two sides meeting, so the chosen constant is put
 *     back in and both sides are measured at the join;
 *   - the **trigonometric limit** is checked with the standard library's own
 *     sine, in radians, at angles closing on zero.
 *
 * A piecewise stem is not one expression, so `lib/math/katex.ts` refuses it -
 * correctly - and each branch is pulled out of the `cases` block by pattern.
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

function asFunction(katex: string): (x: number) => number {
  const compiled = compile(katexToMath(katex));
  return (x: number) => Number(compiled.evaluate({ x }));
}

/** The two branches of a `\begin{cases}` stem, and where they meet. */
function branches(stem: string): {
  left: (x: number) => number;
  right: (x: number) => number;
  join: number;
} {
  const match =
    /\\begin\{cases\} ([\s\S]+?) & x < (-?\d+) \\\\ ([\s\S]+?) & x \\ge \2 \\end\{cases\}/.exec(
      stem,
    );
  expect(match, `cannot read the cases in ${stem}`).not.toBeNull();
  return {
    left: asFunction(match![1]!),
    right: asFunction(match![3]!),
    join: Number(match![2]),
  };
}

describe("c1.one-sided", () => {
  it("reads each branch on its own side of the join", () => {
    each("c1.one-sided", (question, where) => {
      const { left, right, join } = branches(question.stem);
      const answer = answerOf(question);

      /*
       * Approached, not substituted: a one-sided limit is what the branch does
       * as it arrives at the join, so it is measured just short of it.
       */
      const fromLeft = left(join - 1e-7);
      const fromRight = right(join + 1e-7);

      if (/jump/.test(question.prompt.en)) {
        expect(
          Math.abs(fromRight - fromLeft - answer),
          `${where}: the jump measures ${fromRight - fromLeft}`,
        ).toBeLessThan(1e-4);
        return;
      }

      const wantsLeft = /left-hand limit/.test(question.prompt.en);
      const measured = wantsLeft ? fromLeft : fromRight;
      expect(
        Math.abs(measured - answer),
        `${where}: the ${wantsLeft ? "left" : "right"} side approaches ${measured}`,
      ).toBeLessThan(1e-4);
    });
  });

  it("names a jump only where the sides really disagree", () => {
    each(
      "c1.one-sided",
      (question, where) => {
        const { left, right, join } = branches(question.stem);
        const jump = right(join) - left(join - 1e-9);
        const claimed = answerOf(question);
        expect(
          (Math.abs(jump) < 1e-6) === (Math.abs(claimed) < 1e-6),
          `${where}: the answer says ${claimed} and the graph jumps by ${jump}`,
        ).toBe(true);
      },
      [3],
    );
  });
});

describe("c1.infinity", () => {
  it("answers with what the function settles on far out", () => {
    each(
      "c1.infinity",
      (question, where) => {
        const match = /\\lim_\{x \\to \\infty\}([\s\S]+)$/.exec(question.stem);
        expect(match, `${where}: ${question.stem}`).not.toBeNull();
        const f = asFunction(match![1]!);
        const answer = answerOf(question);

        const far = [1e3, 1e6, 1e9].map((x) => Math.abs(f(x) - answer));
        expect(
          far[2]!,
          `${where}: at a billion it is ${f(1e9)}, not ${answer}`,
        ).toBeLessThan(1e-6);
        // And it is genuinely settling rather than passing through.
        expect(
          far[1]! <= far[0]! + 1e-12 && far[2]! <= far[1]! + 1e-12,
          `${where}: not converging (${far.join(", ")})`,
        ).toBe(true);
      },
      [1, 2, 3],
    );
  });

  it("tells an asymptote from a hole", () => {
    each(
      "c1.infinity",
      (question, where) => {
        const match = /y = \\frac\{([\s\S]+)\}\{([\s\S]+)\}$/.exec(question.stem);
        expect(match, `${where}: ${question.stem}`).not.toBeNull();
        const top = asFunction(match![1]!);
        const bottom = asFunction(match![2]!);
        const isHole = /hole/.test(question.prompt.en);

        // Where the denominator vanishes, found rather than assumed.
        let pole: number | null = null;
        for (let x = -12; x <= 12; x += 1) {
          if (Math.abs(bottom(x)) < 1e-9) pole = x;
        }
        expect(pole, `${where}: the denominator is never zero`).not.toBeNull();

        if (isHole) {
          expect(
            Math.abs(top(pole!)),
            `${where}: the numerator is not zero there, so this is an asymptote`,
          ).toBeLessThan(1e-9);
          // The answer is the height of the hole: the limit from either side.
          const limit = top(pole! + 1e-6) / bottom(pole! + 1e-6);
          expect(
            Math.abs(limit - answerOf(question)),
            `${where}: the hole sits at ${limit}`,
          ).toBeLessThan(1e-4);
          return;
        }

        expect(
          Math.abs(top(pole!)),
          `${where}: the numerator is zero there too, so this is a hole`,
        ).toBeGreaterThan(1e-9);
        expect(answerOf(question), `${where}: the asymptote is at ${pole}`).toBe(
          pole,
        );
        // And the function really does run away there.
        expect(
          Math.abs(top(pole! + 1e-6) / bottom(pole! + 1e-6)),
          `${where}: the function stays finite at its own asymptote`,
        ).toBeGreaterThan(1e4);
      },
      [4],
    );
  });
});

describe("c1.continuity", () => {
  it("chooses a constant that really makes the sides meet", () => {
    each(
      "c1.continuity",
      (question, where) => {
        const match =
          /\\begin\{cases\} ([\s\S]+?) & x < (-?\d+) \\\\ ([\s\S]+?) & x \\ge \2 \\end\{cases\}/.exec(
            question.stem,
          );
        expect(match, `${where}: ${question.stem}`).not.toBeNull();
        const join = Number(match![2]);
        const k = answerOf(question);

        /*
         * The answer is put into the branch as text before it is converted.
         * `kx` is one symbol to mathjs - k beside x is exactly the ambiguity
         * `lib/math/katex.ts` refuses to guess at - so substituting first is
         * both simpler and closer to what the question claims: that *this*
         * constant makes the function continuous.
         */
        const withK = (branch: string, value: number) =>
          compile(katexToMath(branch.replace(/k/g, `(${value})`)));
        const left = withK(match![1]!, k);
        const right = compile(katexToMath(match![3]!));
        const fromLeft = Number(left.evaluate({ x: join - 1e-9 }));
        const fromRight = Number(right.evaluate({ x: join }));

        expect(
          Math.abs(fromLeft - fromRight),
          `${where}: with k = ${k} the sides are ${fromLeft} and ${fromRight}`,
        ).toBeLessThan(1e-6);

        // And no other constant would have done it.
        const wrong = Number(withK(match![1]!, k + 1).evaluate({ x: join }));
        expect(
          Math.abs(wrong - fromRight),
          `${where}: k is not pinned down - k + 1 works too`,
        ).toBeGreaterThan(1e-9);
      },
      [1, 2, 3],
    );
  });

  it("fills a removable hole with the limit and nothing else", () => {
    each(
      "c1.continuity",
      (question, where) => {
        const match = /f\(x\) = \\frac\{([\s\S]+)\}\{([\s\S]+)\}$/.exec(
          question.stem,
        );
        expect(match, `${where}: ${question.stem}`).not.toBeNull();
        const f = asFunction(`\\frac{${match![1]!}}{${match![2]!}}`);
        const point = Number(/x = (-?\d+)/.exec(question.prompt.en)![1]);

        for (const distance of [1e-4, 1e-6]) {
          for (const side of [-1, 1]) {
            expect(
              Math.abs(f(point + side * distance) - answerOf(question)),
              `${where}: beside ${point} the function is ${f(point + side * distance)}`,
            ).toBeLessThan(1e-3);
          }
        }
      },
      [4],
    );
  });
});

describe("c1.trig-limit", () => {
  it("agrees with the standard library close to zero", () => {
    each("c1.trig-limit", (question, where) => {
      const match = /\\lim_\{x \\to 0\}([\s\S]+)$/.exec(question.stem);
      expect(match, `${where}: ${question.stem}`).not.toBeNull();
      const f = asFunction(match![1]!);
      const answer = answerOf(question);

      for (const x of [1e-3, 1e-4, -1e-3, -1e-4]) {
        expect(
          Math.abs(f(x) - answer),
          `${where}: at x = ${x} it is ${f(x)}, not ${answer}`,
        ).toBeLessThan(1e-3);
      }
    });
  });

  it("is a limit worth taking, not one substitution would give", () => {
    each("c1.trig-limit", (question, where) => {
      const f = asFunction(
        /\\lim_\{x \\to 0\}([\s\S]+)$/.exec(question.stem)![1]!,
      );
      // Zero over zero: undefined at the point itself.
      expect(
        Number.isFinite(f(0)),
        `${where}: substitution works here, so nothing is being tested`,
      ).toBe(false);
    });
  });
});

describe("the whole chapter", () => {
  it("says where the stem is not machine-readable", () => {
    for (const generatorId of [
      "c1.one-sided",
      "c1.infinity",
      "c1.continuity",
      "c1.trig-limit",
    ]) {
      each(generatorId, (question, where) => {
        expect(question.machineStem, where).toBeNull();
      });
    }
  });
});
