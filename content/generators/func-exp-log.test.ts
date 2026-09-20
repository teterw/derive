import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { checkAnswer } from "@/lib/math/check";
import { generateQuestion } from "./index";
import { skillsOfTopic } from "../topics";
import { deriveMath } from "../step";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * The ม.4 exponential and logarithm chapter.
 *
 * ## The gate is off here, and this is what replaces it
 *
 * `lib/math/katex.ts` refuses subscripts rather than guessing at them, so
 * `\log_{2} 8` cannot be converted to anything a machine can evaluate. Every
 * question therefore carries `machineStem: null` and §9.5 checks nothing at
 * all - which would be an unacceptable place to leave a whole topic.
 *
 * What is checked instead is the definition itself: `b^answer = x`, read out
 * of the stem by pattern rather than by the converter. That is a stronger
 * statement than §9.5 makes about any other chapter, because it is the actual
 * meaning of the notation rather than a numerical coincidence.
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

const answerOf = (question: Question) =>
  Number((question.answer as { value: string }).value);

/** `\log_{2} 8` -> base 2, and the thing inside as a number. */
function readLog(stem: string): { base: number; inside: number } | null {
  const match = /\\log_\{(\d+)\}\s*(.+?)(?:\s*=|$)/.exec(stem);
  if (!match) return null;
  const inside = match[2]!.trim();
  const fraction = /^\\frac\{1\}\{(\d+)\}$/.exec(inside);
  if (fraction) return { base: Number(match[1]), inside: 1 / Number(fraction[1]) };
  if (!/^\d+$/.test(inside)) return null;
  return { base: Number(match[1]), inside: Number(inside) };
}

describe("log.definition", () => {
  /**
   * The definition, checked as a definition. Difficulties 1 and 2 ask for the
   * exponent; 3 and 4 ask for the number and the base, which are the same
   * statement rearranged.
   */
  it("gives an exponent that really does produce the number", () => {
    each("log.definition", [1, 2], (question, where) => {
      const read = readLog(question.stem);
      expect(read, `${where}: could not read ${question.stem}`).not.toBeNull();
      expect(
        Math.abs(read!.base ** answerOf(question) - read!.inside),
        `${where}: ${read!.base}^${answerOf(question)} is not ${read!.inside}`,
      ).toBeLessThan(1e-9);
    });
  });

  it("gives a number the stated logarithm really has", () => {
    each("log.definition", [3], (question, where) => {
      const match = /\\log_\{(\d+)\}\s*x\s*=\s*(-?\d+)/.exec(question.stem)!;
      expect(match, `${where}: ${question.stem}`).not.toBeNull();
      const [, base, exponent] = match;
      expect(Number(base) ** Number(exponent), where).toBe(answerOf(question));
    });
  });

  it("gives a base the stated logarithm really has", () => {
    each("log.definition", [4], (question, where) => {
      const match = /\\log_\{x\}\s*(\d+)\s*=\s*(-?\d+)/.exec(question.stem)!;
      expect(match, `${where}: ${question.stem}`).not.toBeNull();
      const [, value, exponent] = match;
      expect(answerOf(question) ** Number(exponent), where).toBe(
        Number(value),
      );
    });
  });
});

describe("log.laws", () => {
  /**
   * Every term is `\log_b b^n`, so the whole expression is an exact integer
   * and the answer can be worked out independently of the generator - by
   * reading each term's value off the base and adding them with their signs.
   */
  it("adds up to the value it claims", () => {
    each("log.laws", DIFFICULTIES, (question, where) => {
      const base = Number(/\\log_\{(\d+)\}/.exec(question.stem)![1]);
      let total = 0;
      let sign = 1;
      let multiplier = 1;

      for (const token of question.stem.split(/\s+/)) {
        if (token === "+") {
          sign = 1;
          continue;
        }
        if (token === "-") {
          sign = -1;
          continue;
        }
        const log = /^(\d*)\\log_\{(\d+)\}$/.exec(token);
        if (log) {
          multiplier = log[1] ? Number(log[1]) : 1;
          expect(Number(log[2]), `${where}: mixed bases`).toBe(base);
          continue;
        }
        if (/^\d+$/.test(token)) {
          total += sign * multiplier * (Math.log(Number(token)) / Math.log(base));
          sign = 1;
          multiplier = 1;
        }
      }

      expect(
        Math.abs(total - answerOf(question)),
        `${where}: ${question.stem} is ${total}, not ${answerOf(question)}`,
      ).toBeLessThan(1e-9);
    });
  });

  it("always comes out a whole number", () => {
    each("log.laws", DIFFICULTIES, (question, where) => {
      expect(Number.isInteger(answerOf(question)), where).toBe(true);
    });
  });
});

describe("exp.log.equations", () => {
  /**
   * Substituting the answer back into the question, which is the one check
   * that does not care how the question was built. The stem is turned into
   * something evaluable by hand: `b^{...}` survives the converter, and the
   * logarithmic shape at difficulty 4 is read by pattern.
   */
  it("gives an x that satisfies the equation it was asked about", () => {
    each("exp.log.equations", [1, 2, 3], (question, where) => {
      const zeroForm = deriveMath(question.stem);
      expect(zeroForm, `${where}: ${question.stem} is not readable`).not.toBeNull();
      // The zero form of the question, at the stated answer: should be zero.
      const residual = evaluateAt(zeroForm!, answerOf(question));
      expect(
        Math.abs(residual),
        `${where}: x = ${answerOf(question)} leaves ${residual}`,
      ).toBeLessThan(1e-6);
    });

    each("exp.log.equations", [4], (question, where) => {
      const match = /\\log_\{(\d+)\}\s*\\left\((.+?)\\right\)\s*=\s*(-?\d+)/.exec(
        question.stem,
      )!;
      expect(match, `${where}: ${question.stem}`).not.toBeNull();
      const [, base, inside, exponent] = match;
      const value = evaluateAt(deriveMath(inside!)!, answerOf(question));
      expect(value, where).toBe(Number(base) ** Number(exponent));
    });
  });

  it("names a wrong answer that really is wrong", () => {
    each("exp.log.equations", DIFFICULTIES, (question, where) => {
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
});

describe("the chapter as a whole", () => {
  it("says out loud that a subscript is not machine-readable", () => {
    for (const skill of skillsOfTopic("func.exp-log")) {
      each(skill.id, DIFFICULTIES, (question, where) => {
        expect(question.machineStem, where).toBeNull();
        expect(skill.strictForm, skill.id).toBeNull();
      });
    }
  });

  it("ends every derivation on something the learner can read", () => {
    for (const skill of skillsOfTopic("func.exp-log")) {
      each(skill.id, DIFFICULTIES, (question, where) => {
        const shown = question.steps.map((step) => step.expr);
        expect(new Set(shown).size, `${where}: ${shown.join(" | ")}`).toBe(
          shown.length,
        );
        expect(question.steps.length, where).toBeGreaterThan(0);
      });
    }
  });
});

/** mathjs with `x` bound - kept in one place so the intent is obvious. */
function evaluateAt(source: string, x: number): number {
  return Number(evaluate(source, { x }));
}
