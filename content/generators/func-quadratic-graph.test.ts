import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { checkAnswer, satisfiesForm } from "@/lib/math/check";
import { areEquivalent } from "@/lib/math/equivalence";
import { generateQuestion } from "./index";
import { getSkill } from "../topics";
import { deriveMath } from "../step";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * The ม.3 graphing chapter.
 *
 * Every question here is built backwards from the same parabola, so the thing
 * worth checking is not that the arithmetic holds - the §9 gate does that -
 * but that each skill is answering the question it asks. A "least value" that
 * was really the axis, or a vertex read off without flipping the sign inside
 * the bracket, would pass the generic gate and teach the wrong thing.
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

/** `y = <something>` back to just the something, in mathjs source. */
function functionOf(question: Question): string {
  return deriveMath(question.stem.replace(/^y\s*=\s*/, ""))!;
}

describe("func.quad.vertex-form", () => {
  it("answers in a form the vertex can be read off", () => {
    each("func.quad.vertex-form", DIFFICULTIES, (question, where) => {
      const answer = (question.answer as { value: string }).value;
      expect(satisfiesForm(answer, "vertex-form"), `${where}: ${answer}`).toBe(
        true,
      );
    });
  });

  it("rejects the expanded form it was given", () => {
    each("func.quad.vertex-form", DIFFICULTIES, (question, where) => {
      // The question itself is the same function, and is the wrong answer.
      expect(
        checkAnswer(question.answer, deriveMath(question.stem)!, "vertex-form"),
        where,
      ).toEqual({
        correct: false,
        reason: "form",
        requirement: "vertex-form",
      });
    });
  });

  it("multiplies back out to the question", () => {
    each("func.quad.vertex-form", DIFFICULTIES, (question, where) => {
      expect(
        areEquivalent(
          deriveMath(question.stem)!,
          (question.answer as { value: string }).value,
        ),
        where,
      ).toBe(true);
    });
  });
});

describe("func.quad.vertex", () => {
  /**
   * The vertex is where the derivative would be zero, which ม.3 has not met -
   * so it is checked the way ม.3 can check it: the value at the vertex is
   * further out than the value one step either side, in whichever direction
   * the parabola opens.
   */
  it("gives a coordinate of the point where the curve actually turns", () => {
    each("func.quad.vertex", DIFFICULTIES, (question, where) => {
      const f = functionOf(question);
      const answer = Number((question.answer as { value: string }).value);
      const asksAxis = /แกนสมมาตร|axis of symmetry/.test(
        `${question.prompt.th} ${question.prompt.en}`,
      );

      const at = (x: number) => Number(evaluate(f, { x }));
      const vertexX = asksAxis
        ? answer
        : // The other kind of question gives the value; find where it happens.
          [...Array(41).keys()]
            .map((index) => index - 20)
            .find((x) => Math.abs(at(x) - answer) < 1e-9);

      expect(vertexX, `${where}: nothing on the curve reaches ${answer}`)
        .toBeDefined();

      const opensUp = at(vertexX! + 10) > at(vertexX!);
      for (const step of [1, 2, 5]) {
        for (const side of [-1, 1]) {
          const nearby = at(vertexX! + side * step);
          if (opensUp) {
            expect(
              nearby,
              `${where}: the curve dips below its vertex at x = ${vertexX! + side * step}`,
            ).toBeGreaterThan(at(vertexX!));
          } else {
            expect(nearby, where).toBeLessThan(at(vertexX!));
          }
        }
      }
    });
  });

  it("asks for the least value when it opens up and the greatest when it does not", () => {
    each("func.quad.vertex", DIFFICULTIES, (question, where) => {
      const f = functionOf(question);
      const opensUp = Number(evaluate(f, { x: 100 })) > Number(evaluate(f, { x: 0 }));
      const prompt = `${question.prompt.th} ${question.prompt.en}`;
      if (/แกนสมมาตร|axis of symmetry/.test(prompt)) return;
      expect(/least/.test(prompt), `${where}: ${prompt}`).toBe(opensUp);
      expect(/greatest/.test(prompt), `${where}: ${prompt}`).toBe(!opensUp);
    });
  });
});

describe("func.quad.intercepts", () => {
  it("gives the constant term as the y-intercept", () => {
    each("func.quad.intercepts", [1], (question, where) => {
      const f = functionOf(question);
      const answer = Number((question.answer as { value: string }).value);
      expect(Number(evaluate(f, { x: 0 })), where).toBe(answer);
    });
  });

  it("gives roots that really are roots, and all of them", () => {
    each("func.quad.intercepts", [2, 3, 4], (question, where) => {
      expect(question.answer.kind, where).toBe("set");
      const roots = (question.answer as { values: string[] }).values;
      const f = functionOf(question);

      for (const root of roots) {
        expect(
          Math.abs(Number(evaluate(f, { x: Number(root) }))),
          `${where}: ${root} is not a root`,
        ).toBeLessThan(1e-9);
      }
      expect(new Set(roots).size, `${where}: repeated root`).toBe(roots.length);

      // Nothing else in range is a root, so the pair really is all of them.
      const extras = [...Array(41).keys()]
        .map((index) => index - 20)
        .filter((x) => Math.abs(Number(evaluate(f, { x }))) < 1e-9)
        .filter((x) => !roots.includes(String(x)));
      expect(extras, `${where}: ${extras.join(", ")} are roots too`).toEqual([]);
    });
  });
});

describe("the chapter as a whole", () => {
  it("is strict about form only where the form is the lesson", () => {
    expect(getSkill("func.quad.vertex-form").strictForm).toBe("vertex-form");
    expect(getSkill("func.quad.vertex").strictForm).toBeNull();
    expect(getSkill("func.quad.intercepts").strictForm).toBeNull();
  });

  it("says out loud where the stem cannot verify the answer", () => {
    // `y = ...` has two symbols in it, so §9.5 could not check a coordinate
    // against it even if it tried. Saying `null` is the documented way to
    // admit that, rather than leaving a check that quietly does nothing.
    each("func.quad.vertex", DIFFICULTIES, (question, where) => {
      expect(question.machineStem, where).toBeNull();
    });
    each("func.quad.intercepts", [2, 3, 4], (question, where) => {
      // The roots *can* be checked, against the function set equal to zero.
      expect(question.machineStem, where).toBeTruthy();
    });
  });
});
