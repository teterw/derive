import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { checkAnswer } from "@/lib/math/check";
import { generateQuestion } from "./index";
import { getSkill, skillsOfTopic } from "../topics";
import { deriveMath } from "../step";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * The ม.1 linear-equation chapter.
 *
 * ## The invariant the generic gate cannot check
 *
 * A step's machine form is its equation's zero form, and the §9 chain check
 * asks whether adjacent steps have the *same* one. That is the right question
 * for moving a term across and the wrong one for dividing by a coefficient:
 * `3x = 15` and `x = 5` are the same equation and different functions, so the
 * division has to start a new chain and stops being checked.
 *
 * What actually has to hold is that **every line of the working has the same
 * solution as the question**. For a linear equation that is cheap to check -
 * the zero form is a straight line, so its root is `-f(0) / (f(1) - f(0))` -
 * and it is a stronger statement than the chain check, because it survives
 * multiplying, dividing and swapping the sides.
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

/** The root of a linear zero form, or null when it is not linear in x. */
function rootOf(zeroForm: string): number | null {
  try {
    const at0 = Number(evaluate(zeroForm, { x: 0 }));
    const at1 = Number(evaluate(zeroForm, { x: 1 }));
    const at2 = Number(evaluate(zeroForm, { x: 2 }));
    const slope = at1 - at0;
    if (!Number.isFinite(slope) || Math.abs(slope) < 1e-12) return null;
    // Linear, not merely two points on something else.
    if (Math.abs(at2 - at0 - 2 * slope) > 1e-9) return null;
    return -at0 / slope;
  } catch {
    return null;
  }
}

const GENERATORS = ["eq.linear.solve", "eq.linear.fractions", "eq.linear.word"];

describe.each(GENERATORS)("%s", (generatorId) => {
  it("answers with a whole number", () => {
    each(generatorId, DIFFICULTIES, (question, where) => {
      expect(question.answer.kind, where).toBe("exact");
      const value = Number((question.answer as { value: string }).value);
      expect(Number.isInteger(value), `${where}: ${value}`).toBe(true);
    });
  });

  it("keeps every line of the working solvable to the same answer", () => {
    each(generatorId, DIFFICULTIES, (question, where) => {
      const answer = Number((question.answer as { value: string }).value);
      let checked = 0;

      for (const step of question.steps) {
        if (!step.math) continue;
        const root = rootOf(step.math);
        if (root === null) continue;
        checked += 1;
        expect(
          Math.abs(root - answer),
          `${where}: the line ${step.expr} solves to ${root}, not ${answer}`,
        ).toBeLessThan(1e-9);
      }

      expect(checked, `${where}: no line of the working was checkable`)
        .toBeGreaterThan(0);
    });
  });

  it("ends the working on the answer", () => {
    each(generatorId, DIFFICULTIES, (question, where) => {
      const last = question.steps.at(-1)!;
      const answer = (question.answer as { value: string }).value;
      expect(last.expr, `${where}: ${last.expr}`).toBe(`x = ${answer}`);
    });
  });

  it("never shows the same line twice", () => {
    each(generatorId, DIFFICULTIES, (question, where) => {
      const shown = question.steps.map((step) => step.expr);
      expect(new Set(shown).size, `${where}: ${shown.join(" | ")}`).toBe(
        shown.length,
      );
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
});

describe("eq.linear.word", () => {
  /**
   * A word problem's stem is a skeleton - `\square + 7 = 19` - which is not
   * machine-readable on purpose. Without `machineStem` the §9 check that the
   * answer satisfies the question silently does nothing, which is the failure
   * mode this whole project keeps meeting: a check that does not run looks
   * exactly like one that passes.
   */
  it("carries a model the answer can be checked against", () => {
    each("eq.linear.word", DIFFICULTIES, (question, where) => {
      expect(deriveMath(question.stem), `${where}: ${question.stem}`).toBeNull();
      expect(question.machineStem, where).toBeTruthy();

      const answer = Number((question.answer as { value: string }).value);
      const residual = Number(
        evaluate(question.machineStem!, { x: answer }),
      );
      expect(
        Math.abs(residual),
        `${where}: ${question.machineStem} is not zero at x = ${answer}`,
      ).toBeLessThan(1e-9);
    });
  });

  it("asks its question as a sentence, not as a formula", () => {
    each("eq.linear.word", DIFFICULTIES, (question, where) => {
      // The display switches to the word-problem layout past 70 characters.
      expect(question.prompt.th.length, `${where}: ${question.prompt.th}`)
        .toBeGreaterThan(70);
      expect(question.provenance, where).toBe("adapted");
    });
  });
});

describe("the chapter as a whole", () => {
  it("accepts any equivalent way of writing the number", () => {
    // Nothing here is about the *form* of the answer, so none of it is strict.
    for (const skill of skillsOfTopic("eq.linear-one-var")) {
      expect(skill.strictForm, skill.id).toBeNull();
    }
    const question = generateQuestion("eq.linear.solve", 3, 2);
    const answer = (question.answer as { value: string }).value;
    const strictForm = getSkill(question.skillId).strictForm;
    // `6/2` is 3, and a learner who writes it that way has solved it.
    expect(
      checkAnswer(question.answer, `(${answer}*2)/2`, strictForm).correct,
    ).toBe(true);
  });
});
