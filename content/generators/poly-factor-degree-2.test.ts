import { describe, expect, it } from "vitest";
import { checkAnswer } from "@/lib/math/check";
import { areEquivalent, symbolsOf } from "@/lib/math/equivalence";
import { generateQuestion } from "./index";
import { getSkill } from "../topics";
import { deriveMath } from "../step";
import { DIFFICULTIES, type Difficulty } from "../types";

/**
 * The ม.2 factoring chapter.
 *
 * The §9 property gate in `registry.test.ts` already runs over every generator
 * here - 100 seeds at every difficulty, checking the derivation, the KaTeX, the
 * marking and the named mistakes. What it cannot check is whether each skill is
 * asking the question it says it is asking, and that is what this file is for:
 * a perfect square whose answer is two different brackets would sail through
 * the generic gate and teach the wrong thing.
 */
const SEEDS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

function each(
  generatorId: string,
  difficulties: readonly Difficulty[],
  check: (question: ReturnType<typeof generateQuestion>, where: string) => void,
) {
  for (const difficulty of difficulties) {
    for (const seed of SEEDS) {
      const question = generateQuestion(generatorId, seed, difficulty);
      check(question, `${generatorId} d${difficulty} seed ${seed}`);
    }
  }
}

/** The answer, as the marker would see a learner type it. */
function answerText(question: ReturnType<typeof generateQuestion>): string {
  if (question.answer.kind !== "exact") throw new Error("expected an exact answer");
  return question.answer.value;
}

describe("poly.perfect-square", () => {
  it("always answers with a single bracket squared", () => {
    each("poly.perfect-square", DIFFICULTIES, (question, where) => {
      // `(...)^2`, or `g(...)^2` - never two different brackets.
      expect(answerText(question), where).toMatch(
        /^(?:\d+\*)?\([^()]+\)\^2$/,
      );
    });
  });

  it("puts half the middle coefficient in the bracket", () => {
    each("poly.perfect-square", DIFFICULTIES, (question, where) => {
      const stem = deriveMath(question.stem);
      expect(stem, where).not.toBeNull();
      // Squaring the answer's bracket has to give the question back.
      expect(areEquivalent(stem!, answerText(question)), where).toBe(true);
    });
  });

  /**
   * The mistake the skill exists to catch. It must be offered, and it must be
   * wrong - an accusation aimed at a correct learner is the one thing worse
   * than saying nothing.
   */
  it("names the whole-middle-coefficient mistake, and it really is wrong", () => {
    each("poly.perfect-square", DIFFICULTIES, (question, where) => {
      expect(question.misconceptions?.length ?? 0, where).toBeGreaterThan(0);
      for (const misconception of question.misconceptions ?? []) {
        const wrong = misconception.answer;
        if (wrong.kind !== "exact") continue;
        expect(
          checkAnswer(question.answer, wrong.value).correct,
          `${where}: ${wrong.value} is actually right`,
        ).toBe(false);
      }
    });
  });
});

describe("poly.grouping", () => {
  it("asks a four-term question, with the middle already split", () => {
    each("poly.grouping", DIFFICULTIES, (question, where) => {
      /*
       * Four terms is the whole point: collected into three, this would be an
       * ordinary trinomial and the learner would never reach for grouping.
       * Counting the top-level `+`/`-` between terms is the honest check.
       */
      const terms = question.stem.split(/\s[+-]\s/).filter(Boolean);
      expect(terms.length, `${where}: ${question.stem}`).toBe(4);
    });
  });

  it("answers with two brackets that multiply back to the question", () => {
    each("poly.grouping", DIFFICULTIES, (question, where) => {
      const stem = deriveMath(question.stem);
      expect(areEquivalent(stem!, answerText(question)), where).toBe(true);
      expect(answerText(question), where).toContain(")*(");
    });
  });

  it("leaves the same bracket behind in both pairs", () => {
    each("poly.grouping", DIFFICULTIES, (question, where) => {
      // The step before the answer is `Ax(...) + B(...)`, and the two brackets
      // in it have to be the same one - that is what makes grouping work.
      const pulled = question.steps.at(-2)!;
      const brackets = [
        ...pulled.expr.matchAll(/\\left\(([^()]*)\\right\)/g),
      ].map((match) => match[1]);
      expect(brackets.length, `${where}: ${pulled.expr}`).toBeGreaterThanOrEqual(2);
      expect(new Set(brackets).size, `${where}: ${pulled.expr}`).toBe(1);
    });
  });
});

describe("poly.two-variables", () => {
  it("really is in two variables, on both sides", () => {
    each("poly.two-variables", DIFFICULTIES, (question, where) => {
      const stem = deriveMath(question.stem);
      expect(stem, where).not.toBeNull();
      expect(symbolsOf(stem!), where).toEqual(["x", "y"]);
      expect(symbolsOf(answerText(question)), where).toEqual(["x", "y"]);
    });
  });

  /**
   * `xy` parses as a single symbol of that name in mathjs. If either side of
   * the question ever came out carrying one, the stem and its own answer would
   * be expressions in different variables - and the check above would pass,
   * because `symbolsOf` would report `x`, `y` and `xy` on the stem alone.
   */
  it("never lets a product of variables become one symbol", () => {
    each("poly.two-variables", DIFFICULTIES, (question, where) => {
      const stem = deriveMath(question.stem)!;
      expect(stem, `${where}: ${stem}`).not.toMatch(/(?<![A-Za-z*])xy/);
      expect(symbolsOf(stem), where).not.toContain("xy");
    });
  });

  it("marks the answer with the y dropped as wrong", () => {
    each("poly.two-variables", [2, 3], (question, where) => {
      const bare = answerText(question).replace(/\*y/g, "").replace(/y/g, "1");
      expect(checkAnswer(question.answer, bare).correct, where).toBe(false);
    });
  });
});

describe("poly.substitution", () => {
  it("asks about a chunk, not about x", () => {
    each("poly.substitution", [1, 2, 3], (question, where) => {
      // x^4 somewhere in the question is what makes the substitution worth it.
      expect(question.stem, where).toContain("x^4");
    });
    each("poly.substitution", [4], (question, where) => {
      // At 4 the chunk is a bracket rather than a power.
      expect(question.stem, where).toContain("\\left(x");
    });
  });

  it("factors all the way when the brackets factor again", () => {
    each("poly.substitution", [2], (question, where) => {
      // Four linear brackets, not two quadratic ones.
      expect(answerText(question).split(")*(").length, where).toBe(4);
    });
  });

  it("marks the answer with the chunk not put back as wrong", () => {
    each("poly.substitution", [1, 3], (question, where) => {
      const flattened = answerText(question).replace(/x\^2/g, "x");
      expect(checkAnswer(question.answer, flattened).correct, where).toBe(false);
    });
  });

  it("only asks for brackets that cannot be factored further", () => {
    each("poly.substitution", [1, 3], (question, where) => {
      /*
       * `x^2 - 4` would still be a difference of squares, and the stated
       * answer would not be the fully factored one - so the marker would
       * accept an answer that is *more* correct than the one being taught.
       */
      for (const constant of answerText(question).matchAll(/-\s*(\d+)\)/g)) {
        const value = Number(constant[1]);
        const root = Math.round(Math.sqrt(value));
        expect(root * root, `${where}: x^2 - ${value} factors further`).not.toBe(
          value,
        );
      }
    });
  });
});

describe("the chapter as a whole", () => {
  it("asks every skill for a factored answer", () => {
    for (const skillId of [
      "poly.perfect-square",
      "poly.grouping",
      "poly.two-variables",
      "poly.substitution",
    ]) {
      expect(getSkill(skillId).strictForm, skillId).toBe("factored");
    }
  });

  it("rejects the expanded form, which is the point of the form rule", () => {
    for (const generatorId of [
      "poly.perfect-square",
      "poly.grouping",
      "poly.two-variables",
    ]) {
      each(generatorId, DIFFICULTIES, (question, where) => {
        const verdict = checkAnswer(
          question.answer,
          deriveMath(question.stem)!,
          "factored",
        );
        expect(verdict, where).toEqual({
          correct: false,
          reason: "form",
          requirement: "factored",
        });
      });
    }
  });
});
