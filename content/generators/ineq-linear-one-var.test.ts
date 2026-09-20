import { describe, expect, it } from "vitest";
import { checkAnswer } from "@/lib/math/check";
import { katexToMath } from "@/lib/math/katex";
import { evaluate } from "mathjs";
import { generateQuestion } from "./index";
import { skillsOfTopic } from "../topics";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * The ม.3 inequality chapter.
 *
 * ## The gate cannot check this chapter, and says so
 *
 * Every step here carries `math: null`, because an inequality evaluates to a
 * boolean and `areEquivalent` compares numbers. That switches off the §9 chain
 * check for the entire topic, which would be an unacceptable place to leave it
 * - a generator whose working silently drifted would ship.
 *
 * So this file asks the question the chain check was standing in for, in the
 * form an inequality actually has it: **does every line of the working have
 * the same solution set as the question?** A linear inequality's solution set
 * is a half-line, so testing the truth value at a spread of points either side
 * of the boundary settles it exactly, including the strict/non-strict
 * distinction that sampling alone would miss.
 */
const SEEDS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

function each(
  generatorId: string,
  difficulties: readonly Difficulty[],
  check: (question: Question, where: string) => void,
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

/** KaTeX to something mathjs can evaluate as a comparison. */
function comparable(katex: string): string | null {
  const source = katex
    .replace(/\\leq/g, "<=")
    .replace(/\\geq/g, ">=")
    .replace(/\\square/g, "x");
  if (!/[<>]/.test(source)) return null;
  try {
    // Convert each side separately: `katexToMath` has no opinion on `<`.
    const [left, right] = source.split(/<=|>=|<|>/);
    const operator = /<=|>=|<|>/.exec(source)![0];
    return `(${katexToMath(left!)}) ${operator} (${katexToMath(right!)})`;
  } catch {
    return null;
  }
}

/** True/false at `value`, or null when the line is not an inequality. */
function truthAt(comparison: string, value: number): boolean | null {
  try {
    const result = evaluate(comparison, { x: value });
    return typeof result === "boolean" ? result : null;
  } catch {
    return null;
  }
}

/**
 * Points to test at. Half-integers land exactly on boundaries that come out
 * of dividing by two, and the integers themselves are what tells `<` from
 * `\leq` - the distinction no amount of random sampling would find.
 */
const PROBES: number[] = [];
for (let value = -40; value <= 40; value += 0.5) PROBES.push(value);

describe("ineq.linear.solve", () => {
  it("keeps every line of the working equivalent to the question", () => {
    each("ineq.linear.solve", DIFFICULTIES, (question, where) => {
      const asked = comparable(question.stem);
      expect(asked, `${where}: ${question.stem} is not readable`).not.toBeNull();

      for (const step of question.steps) {
        const line = comparable(step.expr);
        if (line === null) continue;
        for (const probe of PROBES) {
          const wanted = truthAt(asked!, probe);
          const got = truthAt(line, probe);
          if (wanted === null || got === null) continue;
          expect(
            got,
            `${where}: at x = ${probe} the question is ${wanted} but the line ${step.expr} is ${got}`,
          ).toBe(wanted);
        }
      }
    });
  });

  it("offers all four relations, with the right one among them", () => {
    each("ineq.linear.solve", DIFFICULTIES, (question, where) => {
      expect(question.choices?.length, where).toBe(4);
      const ids = question.choices!.map((choice) => choice.id);
      expect(new Set(ids).size, where).toBe(4);
      expect(question.answer.kind, where).toBe("choice");
      expect(ids, where).toContain(
        (question.answer as { correct: string }).correct,
      );
      // Every choice is the same boundary: the question is which way it goes.
      const boundaries = question.choices!.map((choice) =>
        choice.label.replace(/^x\s*\S+\s*/, ""),
      );
      expect(new Set(boundaries).size, `${where}: ${boundaries.join(" ")}`).toBe(
        1,
      );
    });
  });

  it("flips the sign exactly when it divides by a negative", () => {
    each("ineq.linear.solve", [3, 4], (question, where) => {
      const flipped = question.steps.some(
        (step) => step.ruleId === "ineq.flip-on-negative",
      );
      expect(flipped, `${where}: nothing in the working flips the sign`).toBe(
        true,
      );
    });
    each("ineq.linear.solve", [1, 2], (question, where) => {
      const flipped = question.steps.some(
        (step) => step.ruleId === "ineq.flip-on-negative",
      );
      expect(flipped, `${where}: flipped when it should not have`).toBe(false);
    });
  });
});

describe.each(["ineq.linear.integers", "ineq.linear.word"])(
  "%s",
  (generatorId) => {
    it("answers with a whole number", () => {
      each(generatorId, DIFFICULTIES, (question, where) => {
        const value = Number((question.answer as { value: string }).value);
        expect(Number.isInteger(value), `${where}: ${value}`).toBe(true);
      });
    });

    /**
     * The answer is an extreme value of a solution set, so `machineStem` is
     * null and §9.5 does not check it. What has to be true is that the answer
     * satisfies the question and the next number along does not - which is
     * what "largest" and "smallest" mean.
     */
    it("gives a value that works, with the next one along that does not", () => {
      each(generatorId, DIFFICULTIES, (question, where) => {
        const asked = comparable(question.stem);
        if (asked === null) return; // word problems whose stem is a skeleton
        const answer = Number((question.answer as { value: string }).value);

        expect(
          truthAt(asked, answer),
          `${where}: ${answer} does not satisfy ${question.stem}`,
        ).toBe(true);

        const wantsLargest = /มากที่สุด|largest|greatest/.test(
          `${question.prompt.th} ${question.prompt.en}`,
        );
        const beyond = wantsLargest ? answer + 1 : answer - 1;
        expect(
          truthAt(asked, beyond),
          `${where}: ${beyond} also satisfies it, so ${answer} is not the extreme`,
        ).toBe(false);
      });
    });

    it("ends the working on the answer", () => {
      each(generatorId, DIFFICULTIES, (question, where) => {
        const answer = (question.answer as { value: string }).value;
        expect(question.steps.at(-1)!.expr, where).toBe(`x = ${answer}`);
      });
    });

    it("names a wrong answer that really is wrong", () => {
      each(generatorId, DIFFICULTIES, (question, where) => {
        expect(question.misconceptions?.length ?? 0, where).toBeGreaterThan(0);
        for (const misconception of question.misconceptions ?? []) {
          if (misconception.answer.kind !== "exact") continue;
          expect(
            checkAnswer(question.answer, misconception.answer.value).correct,
            `${where}: ${misconception.answer.value} is actually right`,
          ).toBe(false);
        }
      });
    });
  },
);

describe("the chapter as a whole", () => {
  it("says out loud that its stems are not machine-verifiable", () => {
    for (const generatorId of [
      "ineq.linear.solve",
      "ineq.linear.integers",
      "ineq.linear.word",
    ]) {
      each(generatorId, DIFFICULTIES, (question, where) => {
        // `null`, not `undefined`: an explicit decision, per CONTENT-PIPELINE §4.
        expect(question.machineStem, where).toBeNull();
      });
    }
  });

  it("asks for a value, so no skill is strict about form", () => {
    for (const skill of skillsOfTopic("ineq.linear-one-var")) {
      expect(skill.strictForm, skill.id).toBeNull();
    }
  });
});
