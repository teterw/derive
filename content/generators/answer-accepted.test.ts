import { describe, expect, it } from "vitest";
import { generators, generateQuestion } from "./index";
import { getSkill } from "../topics";
import { checkAnswer } from "@/lib/math/check";
import { answerToTex } from "@/lib/math/to-tex";

/**
 * The answer a generator declares must be an answer the marker accepts.
 *
 * That sounds circular and is not, because the two travel by different roads:
 * the generator writes a string, the marker parses it, applies the skill's form
 * rule and compares. Three separate bugs in one day lived in the gap between
 * them, and every one reached a learner before it reached a test:
 *
 *   - `\sqrt5` - MathLive's own output - threw in the LaTeX parser, so a
 *     correct 5√5 was marked wrong;
 *   - `x^12` typed into the field became x-to-the-1 times 2;
 *   - `(1)*x*((4)*x^1 + (-9))` was shown to the learner as the correct answer.
 *
 * None of them could have survived this file. Each generator is asked, for
 * every difficulty it supports, whether its own answer passes its own skill's
 * marking - in the plain form, and in the form the maths field would produce.
 *
 * Driven from the registry rather than a hand-written list, so a new generator
 * is covered by existing, not by remembering.
 */

/** Seeds per difficulty. Enough to hit the branches generators take on `rng`. */
const SEEDS = [1, 2, 3, 5, 8, 13, 21, 34];

/** The answer as the app would write it, matching `displayAnswer` in actions. */
function displayForm(answer: ReturnType<typeof generateQuestion>["answer"]): string {
  switch (answer.kind) {
    case "exact":
      return answer.value;
    case "numeric":
      return String(answer.value);
    case "set":
      return answer.values.join(", ");
    case "choice":
      return answer.correct;
  }
}

/**
 * What MathLive would hand back for the same expression.
 *
 * It drops the braces around a single-token argument - `\sqrt{5}` becomes
 * `\sqrt5` - which is real TeX and was the exact shape that broke marking. The
 * answer is rendered to TeX and then stripped the same way, so this asks the
 * question the keypad asks.
 */
function asMathfieldWould(tex: string): string {
  return tex
    .replace(/\\(sqrt|frac)\{([^{}])\}/g, "\\$1$2")
    .replace(/\^\{([^{}])\}/g, "^$1")
    .replace(/_\{([^{}])\}/g, "_$1");
}

describe.each(generators.map((generator) => [generator.id, generator] as const))(
  "%s",
  (_id, generator) => {
    const skill = getSkill(generator.skillId);

    it("accepts its own answer", () => {
      for (const difficulty of generator.difficulties) {
        for (const seed of SEEDS) {
          const question = generateQuestion(generator.id, seed, difficulty);
          // A multiple-choice answer is an id, not an expression to parse.
          if (question.answer.kind === "choice") continue;

          const answer = displayForm(question.answer);
          const verdict = checkAnswer(question.answer, answer, skill.strictForm);

          expect(
            verdict.correct,
            `${generator.id} d${difficulty} seed ${seed}\n` +
              `  stem:   ${question.stem}\n` +
              `  answer: ${answer}\n` +
              `  verdict: ${JSON.stringify(verdict)}`,
          ).toBe(true);
        }
      }
    });

    /**
     * The answer has to survive the round trip a learner's does: rendered to
     * maths, written back the way the maths field writes it, and marked again.
     */
    it("accepts its own answer as the maths field would write it", () => {
      for (const difficulty of generator.difficulties) {
        for (const seed of SEEDS) {
          const question = generateQuestion(generator.id, seed, difficulty);
          if (question.answer.kind === "choice") continue;
          if (question.answer.kind === "set") continue; // a list, not one expression

          const tex = answerToTex(displayForm(question.answer));
          expect(tex, `${generator.id} d${difficulty} seed ${seed} does not render`).not.toBeNull();

          const typed = asMathfieldWould(tex!);
          const verdict = checkAnswer(question.answer, typed, skill.strictForm);

          expect(
            verdict.correct,
            `${generator.id} d${difficulty} seed ${seed}\n` +
              `  stem:  ${question.stem}\n` +
              `  typed: ${typed}\n` +
              `  verdict: ${JSON.stringify(verdict)}`,
          ).toBe(true);
        }
      }
    });

    /**
     * And it has to be readable. `1 · x · (4 · x¹ + -9)` was a real "correct
     * answer" shown to a learner whose own working, one line below, said
     * `x(4x - 9)`.
     */
    it("shows an answer a person would write", () => {
      const NOISE: [RegExp, string][] = [
        [/(?<![0-9.])1\s*\\cdot/, "a redundant 1 ·"],
        [/\\cdot\s*1(?![0-9.])/, "a redundant · 1"],
        [/\^\{1\}(?![0-9])/, "an exponent of 1"],
        [/\+\s*-/, "+ - rather than a subtraction"],
      ];

      for (const difficulty of generator.difficulties) {
        for (const seed of SEEDS) {
          const question = generateQuestion(generator.id, seed, difficulty);
          if (question.answer.kind === "choice") continue;

          const tex = answerToTex(displayForm(question.answer));
          if (tex === null) continue; // covered by the test above

          for (const [pattern, why] of NOISE) {
            expect(
              pattern.test(tex),
              `${generator.id} d${difficulty} seed ${seed}: ${why}\n` +
                `  answer:  ${displayForm(question.answer)}\n` +
                `  renders: ${tex}`,
            ).toBe(false);
          }
        }
      }
    });
  },
);
