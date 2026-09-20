import { describe, expect, it } from "vitest";
import { generators, generateQuestion, toPublicQuestion } from "./index";
import { getSkill } from "../topics";
import { DIFFICULTIES, type Difficulty } from "../types";

/**
 * The line the answer box shows before anything is typed.
 *
 * It exists because "both roots or one?" and "do I write x = 7 or just 7?" are
 * questions about the *interface*, and being marked wrong for guessing them
 * badly teaches nothing about mathematics. Which makes its one hard rule
 * obvious: it may describe the answer's shape and must never carry its value.
 */
const SEEDS = [1, 2, 3, 5, 8, 13, 21, 34];

function everyQuestion(
  visit: (question: ReturnType<typeof generateQuestion>, where: string) => void,
) {
  for (const generator of generators) {
    for (const difficulty of generator.difficulties as Difficulty[]) {
      for (const seed of SEEDS) {
        visit(
          generateQuestion(generator.id, seed, difficulty),
          `${generator.id} d${difficulty} seed ${seed}`,
        );
      }
    }
  }
}

describe("the answer shape", () => {
  it("says what kind of answer the box wants", () => {
    everyQuestion((question, where) => {
      const { expects } = toPublicQuestion(question);
      const kind = question.answer.kind;

      if (kind === "set") {
        expect(expects.form, where).toBe("set");
        expect(expects.count, where).toBe(question.answer.values.length);
        expect(expects.count, where).toBeGreaterThan(0);
      } else if (kind === "choice") {
        expect(expects.form, where).toBe("choice");
      } else {
        // `exact` splits by whether the value is a plain number or an
        // expression, so both are acceptable here; `numeric` is always a
        // number.
        expect(["number", "expression"], where).toContain(expects.form);
        if (kind === "numeric") expect(expects.form, where).toBe("number");
      }
    });
  });

  it("agrees with the skill about the form it insists on", () => {
    everyQuestion((question, where) => {
      const { expects } = toPublicQuestion(question);
      expect(expects.requires ?? null, where).toBe(
        getSkill(question.skillId).strictForm,
      );
    });
  });

  /**
   * The whole question. A shape that shipped the answer would turn every
   * question into a giveaway, silently and everywhere at once - and it would
   * look fine on screen, because the leak would be in the payload rather than
   * in the sentence.
   */
  it("never carries the answer itself", () => {
    everyQuestion((question, where) => {
      const { expects } = toPublicQuestion(question);
      const serialised = JSON.stringify(expects);

      const values =
        question.answer.kind === "set"
          ? question.answer.values
          : question.answer.kind === "choice"
            ? [question.answer.correct]
            : [String((question.answer as { value: unknown }).value)];

      for (const value of values) {
        const trimmed = value.trim();
        /*
         * A one-character answer like "2" would match the count of a two-root
         * question by coincidence, so short numerics are checked against the
         * *values* of the object rather than its serialisation.
         */
        if (trimmed.length <= 2) {
          expect(Object.values(expects), `${where}: ${trimmed}`).not.toContain(
            trimmed,
          );
          continue;
        }
        expect(serialised, `${where}: ${trimmed}`).not.toContain(trimmed);
      }
    });
  });

  it("is on every question the client is given", () => {
    expect(DIFFICULTIES.length).toBeGreaterThan(0);
    everyQuestion((question, where) => {
      expect(toPublicQuestion(question).expects, where).toBeDefined();
    });
  });
});
