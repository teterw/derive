import { describe, expect, it } from "vitest";
import { checkAnswer } from "@/lib/math/check";
import { areEquivalent } from "@/lib/math/equivalence";
import { evaluate } from "mathjs";
import { generateQuestion } from "./index";
import { getSkill } from "../topics";
import { deriveMath } from "../step";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * The ม.3 factoring chapter.
 *
 * The §9 gate in `registry.test.ts` checks that each derivation holds together
 * and that the marker accepts the stated answer. What it cannot check is that
 * each skill is asking the question it claims to: a "difference of cubes"
 * whose answer happened to come out as two linear brackets would pass the
 * generic gate and teach the wrong pattern.
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

function answerText(question: Question): string {
  if (question.answer.kind !== "exact") throw new Error("expected exact");
  return question.answer.value;
}

describe("poly.cubes", () => {
  it("asks about two terms, both of them cubes", () => {
    each("poly.cubes", DIFFICULTIES, (question, where) => {
      const terms = question.stem.split(/\s[+-]\s/).filter(Boolean);
      expect(terms.length, `${where}: ${question.stem}`).toBe(2);
    });
  });

  it("answers with a linear bracket times a trinomial", () => {
    each("poly.cubes", DIFFICULTIES, (question, where) => {
      // `(px ± q)(p^2x^2 ∓ pqx + q^2)`, with an optional factor in front.
      expect(answerText(question), where).toMatch(
        /^(?:\d+\*)?\([^()]+\)\*\([^()]+\)$/,
      );
      expect(areEquivalent(deriveMath(question.stem)!, answerText(question)), where).toBe(
        true,
      );
    });
  });

  /**
   * The trinomial a pair of cubes leaves behind never factors again - its
   * discriminant is `-3p^2q^2`. A learner told to "factor completely" has to
   * be able to trust that, so the generator must never emit a case where it
   * is false.
   */
  it("leaves a trinomial that really cannot be factored further", () => {
    each("poly.cubes", DIFFICULTIES, (question, where) => {
      const trinomial = /\*\(([^()]+)\)$/.exec(answerText(question))?.[1];
      expect(trinomial, where).toBeDefined();
      const [, a = "1", b = "0", c = "0"] =
        /^(-?\d*)x\^2\s*([+-]\s*\d*)x\s*([+-]\s*\d+)$/.exec(
          trinomial!.replace(/\s+/g, " "),
        ) ?? [];
      const clean = (text: string) =>
        Number(evaluate(text.replace(/\s+/g, "").replace(/^([+-])$/, "$11") || "1"));
      const discriminant =
        clean(b) * clean(b) - 4 * clean(a === "" ? "1" : a) * clean(c);
      expect(discriminant, `${where}: ${trinomial} factors`).toBeLessThan(0);
    });
  });

  it("names the flipped middle sign, and it really is wrong", () => {
    each("poly.cubes", DIFFICULTIES, (question, where) => {
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

describe("poly.higher-grouping", () => {
  it("asks a four-term cubic", () => {
    each("poly.higher-grouping", DIFFICULTIES, (question, where) => {
      const terms = question.stem.split(/\s[+-]\s/).filter(Boolean);
      expect(terms.length, `${where}: ${question.stem}`).toBe(4);
      expect(question.stem, where).toContain("x^3");
    });
  });

  it("pulls an x^2 out of the first pair, not an x", () => {
    each("poly.higher-grouping", DIFFICULTIES, (question, where) => {
      const pulled = question.steps[1]!;
      expect(pulled.expr, `${where}: ${pulled.expr}`).toContain("x^2\\left(");
    });
  });

  it("leaves the same bracket behind in both pairs", () => {
    each("poly.higher-grouping", DIFFICULTIES, (question, where) => {
      const pulled = question.steps[1]!;
      const brackets = [
        ...pulled.expr.matchAll(/\\left\(([^()]*)\\right\)/g),
      ].map((match) => match[1]);
      expect(brackets.length, `${where}: ${pulled.expr}`).toBe(2);
      expect(new Set(brackets).size, `${where}: ${pulled.expr}`).toBe(1);
    });
  });

  /**
   * At 1-3 the quadratic is left alone, so it must genuinely not factor; at 4
   * it always does, and the working has to go on and do it.
   */
  it("stops at the quadratic only when the quadratic really stops", () => {
    each("poly.higher-grouping", [1, 2, 3], (question, where) => {
      const constant = /x\^2\s*([+-])\s*(\d+)\)$/.exec(answerText(question));
      expect(constant, `${where}: ${answerText(question)}`).not.toBeNull();
      if (constant![1] !== "-") return;
      const value = Number(constant![2]);
      const root = Math.round(Math.sqrt(value));
      expect(root * root, `${where}: x^2 - ${value} factors further`).not.toBe(
        value,
      );
    });

    each("poly.higher-grouping", [4], (question, where) => {
      expect(answerText(question).split(")*(").length, where).toBe(3);
    });
  });
});

describe("poly.factor-theorem", () => {
  it("shows the substitution, and the substitution is true", () => {
    each("poly.factor-theorem", DIFFICULTIES, (question, where) => {
      const substitution = question.steps[0]!;
      expect(substitution.ruleId, where).toBe("poly.factor-theorem");
      expect(substitution.expr, where).toContain("= 0");
      // Its own chain: an arithmetic check, not a link in the factorisation.
      expect(substitution.chain, where).toBe("root");
      // And it is arithmetic that actually comes out to zero.
      const value = evaluate(deriveMath(substitution.expr)!) as number;
      expect(Math.abs(value), `${where}: ${substitution.expr}`).toBeLessThan(1e-9);
    });
  });

  it("never shows the same line twice", () => {
    each("poly.factor-theorem", DIFFICULTIES, (question, where) => {
      const shown = question.steps.map((step) => step.expr);
      expect(new Set(shown).size, `${where}: ${shown.join(" | ")}`).toBe(
        shown.length,
      );
    });
  });

  it("ends the working on the answer, and the answer on the question", () => {
    each("poly.factor-theorem", DIFFICULTIES, (question, where) => {
      // The last line of the working is the answer, not a step short of it.
      const last = deriveMath(question.steps.at(-1)!.expr);
      expect(last, `${where}: last step is not machine-readable`).not.toBeNull();
      expect(
        areEquivalent(last!, answerText(question)),
        `${where}: working ends on ${question.steps.at(-1)!.expr}, answer is ${answerText(question)}`,
      ).toBe(true);

      // And the answer multiplies back out to the question.
      expect(
        areEquivalent(deriveMath(question.stem)!, answerText(question)),
        where,
      ).toBe(true);
    });
  });

  it("writes a repeated factor squared rather than twice", () => {
    each("poly.factor-theorem", [3], (question, where) => {
      expect(answerText(question), where).toMatch(/\)\^2/);
    });
  });

  it("marks the flipped-sign factor as wrong", () => {
    each("poly.factor-theorem", DIFFICULTIES, (question, where) => {
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
  it("asks every skill for a factored answer", () => {
    for (const skillId of [
      "poly.cubes",
      "poly.higher-grouping",
      "poly.factor-theorem",
    ]) {
      expect(getSkill(skillId).strictForm, skillId).toBe("factored");
    }
  });

  it("rejects the expanded form, which is the point of the form rule", () => {
    for (const generatorId of [
      "poly.cubes",
      "poly.higher-grouping",
      "poly.factor-theorem",
    ]) {
      each(generatorId, DIFFICULTIES, (question, where) => {
        expect(
          checkAnswer(question.answer, deriveMath(question.stem)!, "factored"),
          where,
        ).toEqual({
          correct: false,
          reason: "form",
          requirement: "factored",
        });
      });
    }
  });
});
