import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { checkAnswer } from "@/lib/math/check";
import { katexToMath } from "@/lib/math/katex";
import { areEquivalent } from "@/lib/math/equivalence";
import { generateQuestion } from "./index";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * The ม.4 relations chapter.
 *
 * ## Nothing here has a machine-readable stem, and that matters
 *
 * `f(x) = 2x + 1` is a *definition*, not an equation the answer solves, and
 * `f(x) = x^2, g(x) = x - 1` is two definitions in one line. So every question
 * in this chapter carries `machineStem: null`, which switches off §9.5 - the
 * check that the stated answer really answers the question.
 *
 * This file is that check, done the way the chapter needs it: parse the
 * definition out of the stem, apply it the way the prompt says, and compare
 * with the answer the generator declared. A composite in the wrong order or an
 * inverse with a sign the wrong way round fails here and nowhere else.
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

/** The right-hand side of `f(x) = ...`, as mathjs source. */
function definitionOf(stem: string, name: "f" | "g"): string {
  const piece = stem
    .split(/,\s*\\quad\s*|,\s+/)
    .find((part) => part.trim().startsWith(`${name}(x)`))!;
  return katexToMath(piece.slice(piece.indexOf("=") + 1).trim());
}

const answerOf = (question: Question) =>
  (question.answer as { value: string }).value;

describe("func.evaluate", () => {
  it("gives the value of the definition at the point the prompt names", () => {
    each("func.evaluate", [1, 2, 3], (question, where) => {
      const f = definitionOf(question.stem, "f");
      const at = Number(/f\\left\((-?\d+)\\right\)/.exec(question.prompt.en)![1]);
      expect(
        Number(evaluate(f, { x: at })),
        `${where}: f(${at}) of ${f}`,
      ).toBe(Number(answerOf(question)));
    });
  });

  it("gives the substituted expression when the input is an expression", () => {
    each("func.evaluate", [4], (question, where) => {
      const f = definitionOf(question.stem, "f");
      const inner = katexToMath(
        /f\\left\((.+?)\\right\)/.exec(question.prompt.en)![1]!,
      );
      // Sampling both: `f(inner)` against the stated answer, as functions of x.
      for (const x of [0.37, 1.73, -2.24, 5.24]) {
        const wanted = Number(evaluate(f, { x: Number(evaluate(inner, { x })) }));
        const got = Number(evaluate(answerOf(question), { x }));
        expect(Math.abs(wanted - got), `${where}: at x = ${x}`).toBeLessThan(
          1e-9,
        );
      }
    });
  });
});

describe("func.composite", () => {
  it("does g first and f second, not the other way round", () => {
    each("func.composite", DIFFICULTIES, (question, where) => {
      const f = definitionOf(question.stem, "f");
      const g = definitionOf(question.stem, "g");
      const atMatch = /f\(g\((-?\d+)\)\)/.exec(question.prompt.en);

      if (atMatch) {
        const at = Number(atMatch[1]);
        const wanted = Number(
          evaluate(f, { x: Number(evaluate(g, { x: at })) }),
        );
        expect(Number(answerOf(question)), `${where}: f(g(${at}))`).toBe(
          wanted,
        );
        return;
      }

      for (const x of [0.37, 1.73, -2.24, 5.24]) {
        const wanted = Number(evaluate(f, { x: Number(evaluate(g, { x })) }));
        const got = Number(evaluate(answerOf(question), { x }));
        expect(Math.abs(wanted - got), `${where}: at x = ${x}`).toBeLessThan(
          1e-9,
        );
      }
    });
  });

  it("names the swapped order as the wrong answer", () => {
    each("func.composite", DIFFICULTIES, (question, where) => {
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

describe("func.inverse", () => {
  /**
   * The definition of an inverse, checked as a definition: feeding a value
   * through the function and then through the answer has to give the value
   * back. Nothing about the shape of the expression is assumed.
   */
  it("undoes the function it was made from", () => {
    each("func.inverse", DIFFICULTIES, (question, where) => {
      const f = definitionOf(question.stem, "f");
      const inverse = answerOf(question);

      for (const x of [0.37, 1.73, -2.24, 5.24, 8.54]) {
        const there = Number(evaluate(f, { x }));
        const back = Number(evaluate(inverse, { x: there }));
        expect(
          Math.abs(back - x),
          `${where}: ${f} then ${inverse} sent ${x} to ${back}`,
        ).toBeLessThan(1e-9);
      }
    });
  });

  it("is not one over the function", () => {
    each("func.inverse", DIFFICULTIES, (question, where) => {
      const f = definitionOf(question.stem, "f");
      expect(
        areEquivalent(answerOf(question), `1/(${f})`),
        `${where}: the inverse came out as a reciprocal`,
      ).toBe(false);
    });
  });
});

describe("the chapter as a whole", () => {
  it("admits that its stems are definitions, not equations", () => {
    for (const generatorId of ["func.evaluate", "func.composite", "func.inverse"]) {
      each(generatorId, DIFFICULTIES, (question, where) => {
        expect(question.machineStem, where).toBeNull();
        expect(question.stem, where).toMatch(/^f\(x\) =/);
      });
    }
  });
});
