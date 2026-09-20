import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { generateQuestion } from "./index";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * ลำดับและอนุกรม · ม.ปลาย.
 *
 * ## The gate is off here, and this is what replaces it
 *
 * `a_n` is a subscript, and `lib/math/katex.ts` refuses subscripts rather than
 * guessing - so no stem in this chapter converts and §9.5 checks nothing. That
 * would leave a whole topic on trust, and the trust would be misplaced in
 * exactly the way this subject is famous for: every formula here is off by one
 * from the formula a learner first writes down, and an off-by-one in a
 * generator produces a sequence that is still a sequence.
 *
 * So each sequence is rebuilt from the terms in its own stem and walked
 * forward one term at a time, and **every sum is checked by adding the terms
 * up**. A shortcut tested only against itself is not tested.
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
  (question.answer as { value: string }).value;

/** `3, 7, 11, 15, \ldots` -> the numbers. */
function listedTerms(stem: string): number[] {
  const body = stem.replace(/\\ldots/g, "").replace(/,\s*$/, "");
  return body
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map(Number);
}

/** `a_{5} = 17, \quad a_{12} = 45` -> [[5, 17], [12, 45]]. */
function subscripted(stem: string): [number, number][] {
  return [...stem.matchAll(/a_\{?(\d+)\}?\s*=\s*(-?\d+)/g)].map((match) => [
    Number(match[1]),
    Number(match[2]),
  ]);
}

/** `3 + 7 + 11 + \cdots + 43` -> the shown terms and the last one. */
function writtenSeries(stem: string): { shown: number[]; last: number } {
  const [head, tail] = stem.split("\\cdots");
  const shown = head!
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .map(Number);
  return { shown, last: Number(tail!.replace("+", "").trim()) };
}

const named = (stem: string, name: string) => {
  const match = new RegExp(`${name}\\s*=\\s*(-?\\d+)`).exec(stem);
  return match ? Number(match[1]) : null;
};

describe("seq.arithmetic", () => {
  it("shows a sequence that really is arithmetic", () => {
    each(
      "seq.arithmetic",
      (question, where) => {
        const terms = listedTerms(question.stem);
        expect(terms.length, `${where}: ${question.stem}`).toBeGreaterThanOrEqual(3);
        const difference = terms[1]! - terms[0]!;
        expect(difference, `${where}: a sequence that never moves`).not.toBe(0);
        for (let i = 1; i < terms.length; i += 1) {
          expect(
            terms[i]! - terms[i - 1]!,
            `${where}: the gaps in ${question.stem} are not equal`,
          ).toBe(difference);
        }
      },
      [1, 2, 3],
    );
  });

  it("answers with the term the sequence actually reaches", () => {
    each(
      "seq.arithmetic",
      (question, where) => {
        const terms = listedTerms(question.stem);
        const difference = terms[1]! - terms[0]!;
        const answer = answerOf(question);

        const asked = /Find term (\d+)/.exec(question.prompt.en);
        if (asked) {
          const position = Number(asked[1]);
          // Walked, not computed: the formula is what is being checked.
          let value = terms[0]!;
          for (let step = 1; step < position; step += 1) value += difference;
          expect(Number(evaluate(answer)), `${where}: term ${position}`).toBe(
            value,
          );
          return;
        }

        expect(question.prompt.en, where).toContain("general term");
        for (let position = 1; position <= 8; position += 1) {
          let value = terms[0]!;
          for (let step = 1; step < position; step += 1) value += difference;
          expect(
            Number(evaluate(answer, { n: position })),
            `${where}: ${answer} at n = ${position}`,
          ).toBe(value);
        }
      },
      [1, 2, 3],
    );
  });

  it("answers difficulty 4 from the two terms it names", () => {
    each(
      "seq.arithmetic",
      (question, where) => {
        const pairs = subscripted(question.stem);
        expect(pairs.length, `${where}: ${question.stem}`).toBe(2);
        const [[lower, lowerValue], [upper, upperValue]] = pairs as [
          [number, number],
          [number, number],
        ];

        const gaps = upper - lower;
        // `Math.abs`: a negative difference that divides exactly gives -0.
        expect(
          Math.abs((upperValue - lowerValue) % gaps),
          `${where}: d is not whole`,
        ).toBe(0);
        const difference = (upperValue - lowerValue) / gaps;

        const position = Number(/Find term (\d+)/.exec(question.prompt.en)![1]);
        let value = lowerValue;
        for (let step = lower; step < position; step += 1) value += difference;
        expect(Number(evaluate(answerOf(question))), where).toBe(value);
      },
      [4],
    );
  });
});

describe("seq.geometric", () => {
  it("shows a sequence that really is geometric", () => {
    each(
      "seq.geometric",
      (question, where) => {
        const terms = listedTerms(question.stem);
        const ratio = terms[1]! / terms[0]!;
        expect(Math.abs(ratio), `${where}: a ratio of one is not a sequence`).not.toBe(1);
        for (let i = 1; i < terms.length; i += 1) {
          expect(
            terms[i]! / terms[i - 1]!,
            `${where}: ${question.stem} is not geometric`,
          ).toBe(ratio);
        }
      },
      [1, 2, 3],
    );
  });

  it("answers with the term the sequence actually reaches", () => {
    each(
      "seq.geometric",
      (question, where) => {
        const terms = listedTerms(question.stem);
        const ratio = terms[1]! / terms[0]!;
        const answer = answerOf(question);

        const asked = /Find term (\d+)/.exec(question.prompt.en);
        if (asked) {
          const position = Number(asked[1]);
          let value = terms[0]!;
          for (let step = 1; step < position; step += 1) value *= ratio;
          expect(Number(evaluate(answer)), `${where}: term ${position}`).toBe(value);
          // And it is still a number a person would write down.
          expect(Math.abs(value), `${where}: ${value} is enormous`).toBeLessThan(1e7);
          return;
        }

        for (let position = 1; position <= 6; position += 1) {
          let value = terms[0]!;
          for (let step = 1; step < position; step += 1) value *= ratio;
          expect(
            Number(evaluate(answer, { n: position })),
            `${where}: ${answer} at n = ${position}`,
          ).toBe(value);
        }
      },
      [1, 2, 3],
    );
  });

  it("answers difficulty 4 from the two terms it names", () => {
    each(
      "seq.geometric",
      (question, where) => {
        const [[from, lower], [to, upper]] = subscripted(question.stem) as [
          [number, number],
          [number, number],
        ];
        expect(to - from, `${where}: the two terms should be two apart`).toBe(2);

        const squared = upper / lower;
        expect(squared, `${where}: r squared is not a square`).toBeGreaterThan(0);
        const size = Math.sqrt(squared);
        expect(Number.isInteger(size), `${where}: r is not whole`).toBe(true);

        // The prompt, not the square root, decides the sign.
        const negative = /negative common ratio/.test(question.prompt.en);
        const ratio = negative ? -size : size;

        const position = Number(/Find term (\d+)/.exec(question.prompt.en)![1]);
        let value = lower;
        for (let step = from; step < position; step += 1) value *= ratio;
        expect(Number(evaluate(answerOf(question))), where).toBe(value);
      },
      [4],
    );
  });
});

/**
 * The sums, added up.
 *
 * Both series generators compute their answer from a closed form. Checking
 * that closed form against itself proves nothing, so every one of these builds
 * the terms and adds them.
 */
describe("the series really add up", () => {
  /** The terms a series question is about, however its stem states them. */
  function termsOf(question: Question, kind: "arithmetic" | "geometric"): number[] {
    const step = kind === "arithmetic" ? named(question.stem, "d") : named(question.stem, "r");

    if (step !== null) {
      const first = named(question.stem, "a_1")!;
      const count = named(question.stem, "n");
      if (count === null) return [];
      return Array.from({ length: count }, (_, index) =>
        kind === "arithmetic" ? first + index * step : first * step ** index,
      );
    }

    const { shown, last } = writtenSeries(question.stem);
    const terms = [shown[0]!];
    const move =
      kind === "arithmetic"
        ? (value: number) => value + (shown[1]! - shown[0]!)
        : (value: number) => value * (shown[1]! / shown[0]!);

    let current = shown[0]!;
    while (current !== last && terms.length < 200) {
      current = move(current);
      terms.push(current);
    }
    expect(terms.at(-1), `the series never reaches ${last}`).toBe(last);
    return terms;
  }

  it("adds an arithmetic series term by term", () => {
    each(
      "series.arithmetic",
      (question, where) => {
        const terms = termsOf(question, "arithmetic");
        const total = terms.reduce((sum, term) => sum + term, 0);
        expect(Number(evaluate(answerOf(question))), `${where}: ${terms.length} terms`).toBe(
          total,
        );
      },
      [1, 2, 3],
    );
  });

  it("adds a geometric series term by term", () => {
    each(
      "series.geometric",
      (question, where) => {
        const terms = termsOf(question, "geometric");
        const total = terms.reduce((sum, term) => sum + term, 0);
        expect(Number(evaluate(answerOf(question))), `${where}: ${terms.length} terms`).toBe(
          total,
        );
      },
      [1, 2, 3, 4],
    );
  });

  /**
   * Difficulty 4 of the arithmetic series works backwards: the sum is given
   * and the number of terms is the answer. So the check is that this many
   * terms reach the sum, and that no other number of them does.
   */
  it("finds the only number of terms that reaches the given sum", () => {
    each(
      "series.arithmetic",
      (question, where) => {
        const first = named(question.stem, "a_1")!;
        const difference = named(question.stem, "d")!;
        const target = named(question.stem, "S_n")!;
        const count = Number(evaluate(answerOf(question)));

        expect(Number.isInteger(count), `${where}: ${count} terms`).toBe(true);
        expect(count, where).toBeGreaterThan(0);

        const sumTo = (howMany: number) =>
          Array.from(
            { length: howMany },
            (_, index) => first + index * difference,
          ).reduce((sum, term) => sum + term, 0);

        expect(sumTo(count), `${where}: ${count} terms do not make ${target}`).toBe(
          target,
        );
        expect(sumTo(count - 1), `${where}: ${count - 1} terms also work`).not.toBe(
          target,
        );
        expect(sumTo(count + 1), `${where}: ${count + 1} terms also work`).not.toBe(
          target,
        );
      },
      [4],
    );
  });
});

describe("the whole chapter", () => {
  it("says where the stem is not machine-readable", () => {
    for (const generatorId of [
      "seq.arithmetic",
      "seq.geometric",
      "series.arithmetic",
      "series.geometric",
    ]) {
      each(generatorId, (question, where) => {
        expect(question.machineStem, where).toBeNull();
      });
    }
  });

  it("names a wrong answer that is really wrong", () => {
    for (const generatorId of [
      "seq.arithmetic",
      "seq.geometric",
      "series.arithmetic",
      "series.geometric",
    ]) {
      each(generatorId, (question, where) => {
        const right = answerOf(question);
        for (const mistake of question.misconceptions ?? []) {
          const wrong = (mistake.answer as { value: string }).value;
          /*
           * Several values of n, not one. `6 \cdot 2(n-1)` and
           * `6 \cdot 2^{n-1}` are different formulas that happen to agree at
           * n = 3, and a single sample point would call that a duplicate.
           */
          const differs = [1, 2, 3, 4, 5, 6].some(
            (n) => Number(evaluate(wrong, { n })) !== Number(evaluate(right, { n })),
          );
          expect(differs, `${where}: ${wrong} is the right answer`).toBe(true);
        }
      });
    }
  });
});
