import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { generateQuestion } from "./index";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * The ม.3 trigonometric ratio chapter.
 *
 * ## The gate is off here, and this is what replaces it
 *
 * `lib/math/katex.ts` will not convert `\sin` or `^\circ` - it refuses unknown
 * commands rather than guessing - so every question in this chapter carries
 * `machineStem: null` and §9.5 checks nothing. That would be an unacceptable
 * place to leave a topic whose whole content is fourteen exact values that are
 * easy to mistype and impossible to spot by eye: `\tan 30^\circ` is
 * `\frac{\sqrt{3}}{3}`, and `\frac{\sqrt{3}}{2}` looks just as plausible.
 *
 * So this file evaluates the questions with *real* trigonometry - the standard
 * library's `sin`, in radians, to twelve decimal places - and checks:
 *
 *  1. every exact value the learner is shown is the true one;
 *  2. every answer is the value of the expression in the stem;
 *  3. every triangle is a genuine right-angled one, and the ratio asked for is
 *     the ratio of the sides it names.
 *
 * That is a stronger statement than §9.5 makes anywhere else in the app,
 * because it is checked against the definition of the functions rather than
 * against another line of the same derivation.
 */
const SEEDS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

const TOLERANCE = 1e-12;

function each(
  generatorId: string,
  check: (question: Question, where: string) => void,
) {
  for (const difficulty of DIFFICULTIES as readonly Difficulty[]) {
    for (const seed of SEEDS) {
      check(
        generateQuestion(generatorId, seed, difficulty),
        `${generatorId} d${difficulty} seed ${seed}`,
      );
    }
  }
}

/**
 * KaTeX to a number, through real trigonometry.
 *
 * Deliberately not `katexToMath`: that converter is what refuses this notation
 * in the first place, so using it here would test nothing. This handles the
 * five constructs the chapter actually emits and throws on anything else,
 * which is the behaviour a test wants - a stem shape nobody anticipated should
 * fail loudly rather than quietly evaluate to something.
 */
function valueOf(katex: string): number {
  const source = katex
    .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "(($1)/($2))")
    .replace(/\\(sin|cos|tan)\s*(\d+)\^\\circ/g, "$1(($2) * pi / 180)")
    .replace(/\\cdot|\\times/g, "*")
    .replace(/(\d)(?=[a-z(])/g, "$1*")
    .trim();
  if (/\\/.test(source)) {
    throw new Error(`not evaluated: ${katex} -> ${source}`);
  }
  return Number(evaluate(source));
}

/** Every string a learner reads in this question. */
function textOf(question: Question): string[] {
  return [
    question.stem,
    question.prompt.th,
    question.prompt.en,
    ...question.steps.flatMap((step) => [
      step.expr,
      step.explain.th,
      step.explain.en,
    ]),
    ...question.hints.flatMap((hint) => [hint.th, hint.en]),
  ];
}

const answerOf = (question: Question) =>
  valueOf((question.answer as { value: string }).value.replace(/\*/g, " * "));

describe("the special values shown are the true ones", () => {
  /**
   * `\sin 30^\circ = \frac{1}{2}` wherever it is claimed - in a step, in a
   * hint, in either language. One mistyped entry in the table would otherwise
   * be taught as fact, marked as correct, and be invisible to every other
   * test in the repo.
   */
  /*
   * The value is matched by shape rather than "everything after the equals",
   * which swept up the Thai sentence that follows the value in a hint. It also
   * means `\sin 30^\circ = \frac{x}{12}` - a question, not a claim - does not
   * match at all, since every form here is made of digits.
   */
  const VALUE = String.raw`(?:\\frac\{(?:\\sqrt\{\d+\}|\d+)\}\{\d+\}|\\sqrt\{\d+\}|\d+)`;
  const CLAIM = new RegExp(
    String.raw`\\(sin|cos|tan)\s*(\d+)\^\\circ\s*=\s*(${VALUE})`,
  );

  it("matches the standard library, to twelve places", () => {
    const seen = new Set<string>();

    for (const generatorId of ["trig.definition", "trig.special", "trig.solve"]) {
      each(generatorId, (question, where) => {
        for (const text of textOf(question)) {
          const claim = CLAIM.exec(text);
          if (!claim) continue;
          const [, ratio, degrees, shown] = claim;
          const radians = (Number(degrees) * Math.PI) / 180;
          const truth =
            ratio === "sin"
              ? Math.sin(radians)
              : ratio === "cos"
                ? Math.cos(radians)
                : Math.tan(radians);

          expect(
            Math.abs(valueOf(shown!) - truth),
            `${where}: ${ratio} ${degrees} shown as ${shown}`,
          ).toBeLessThan(TOLERANCE);
          seen.add(`${ratio} ${degrees}`);
        }
      });
    }

    // If the scan matched nothing the assertions above are vacuous.
    expect(seen.size).toBeGreaterThanOrEqual(9);
  });

  it("never claims a value for tan 90, which has none", () => {
    for (const generatorId of ["trig.special", "trig.solve"]) {
      each(generatorId, (question, where) => {
        for (const text of textOf(question)) {
          expect(text, `${where}`).not.toMatch(/\\tan\s*90\^\\circ\s*=/);
        }
      });
    }
  });
});

describe("trig.definition", () => {
  /**
   * `a = 3, \ b = 4, \ c = 5`.
   *
   * The side-letter convention, where `a` is the side opposite angle A and `c`
   * is the hypotenuse. The stem used to name the sides in Thai words, which
   * put Thai on the English page - `content/language-neutral.test.ts` is why
   * it does not any more, and this reads the letters instead.
   *
   * The lookbehind matters: the stem ends with the ratio being asked for, so
   * an unguarded `a` would also match the `A` of `\sin A` on a case-insensitive
   * engine and the `a` inside `\tan`.
   */
  function sidesOf(stem: string) {
    const side = (label: string) => {
      const match = new RegExp(`(?<![A-Za-z\\\\])${label}\\s*=\\s*(\\d+)`).exec(
        stem,
      );
      return match ? Number(match[1]) : null;
    };
    return {
      opposite: side("a"),
      adjacent: side("b"),
      hypotenuse: side("c"),
    };
  }

  it("names a genuine right-angled triangle", () => {
    each("trig.definition", (question, where) => {
      const { opposite, adjacent, hypotenuse } = sidesOf(question.stem);
      expect(opposite, where).not.toBeNull();
      expect(hypotenuse, where).not.toBeNull();

      /*
       * At 3 and 4 the adjacent side is withheld on purpose. It still has to
       * be a whole number, or Pythagoras does not give the tidy answer the
       * working claims.
       */
      const third =
        adjacent ?? Math.sqrt(hypotenuse! ** 2 - opposite! ** 2);
      expect(Number.isInteger(third), `${where}: adjacent ${third}`).toBe(true);
      expect(opposite! ** 2 + third ** 2, where).toBe(hypotenuse! ** 2);
      expect(hypotenuse, `${where}: hypotenuse is not the longest side`)
        .toBeGreaterThan(Math.max(opposite!, third));
    });
  });

  it("answers with the ratio it asks for", () => {
    each("trig.definition", (question, where) => {
      const asked = /\\(sin|cos|tan)\s*([AB])/.exec(question.prompt.th);
      expect(asked, `${where}: no ratio in the prompt`).not.toBeNull();
      const [, ratio, vertex] = asked!;

      const { opposite, adjacent, hypotenuse } = sidesOf(question.stem);
      const third = adjacent ?? Math.sqrt(hypotenuse! ** 2 - opposite! ** 2);
      const expected =
        ratio === "sin"
          ? opposite! / hypotenuse!
          : ratio === "cos"
            ? third / hypotenuse!
            : opposite! / third;

      expect(Math.abs(answerOf(question) - expected), where).toBeLessThan(
        TOLERANCE,
      );

      // The working must be about the same corner the prompt asked about.
      const working = question.steps.at(-1)!.expr;
      expect(working, where).toContain(`\\${ratio} ${vertex}`);
    });
  });

  it("gives a sine or cosine no greater than one", () => {
    each("trig.definition", (question, where) => {
      if (!/\\(sin|cos)/.test(question.prompt.th)) return;
      expect(answerOf(question), where).toBeGreaterThan(0);
      expect(answerOf(question), where).toBeLessThan(1);
    });
  });
});

describe("trig.special", () => {
  it("answers with the value of the expression in the stem", () => {
    each("trig.special", (question, where) => {
      expect(
        Math.abs(valueOf(question.stem) - answerOf(question)),
        `${where}: stem ${question.stem}`,
      ).toBeLessThan(TOLERANCE);
    });
  });

  it("gives an exact answer rather than a decimal", () => {
    each("trig.special", (question, where) => {
      const written = (question.answer as { value: string }).value;
      expect(written, where).not.toMatch(/\d\.\d/);
    });
  });
});

describe("trig.solve", () => {
  /**
   * The stem is an equation - `\tan 30^\circ = \frac{x}{5}` - so the check is
   * that the answer satisfies it. The elevation word problem is the one place
   * the answer is deliberately *not* the unknown in the equation: it is that
   * height plus the eye height, which is the whole point of the question and
   * the thing learners leave out.
   */
  it("answers with the value the stem solves to", () => {
    each("trig.solve", (question, where) => {
      const [left, right] = question.stem.split("=");
      expect(right, `${where}: stem is not an equation`).toBeDefined();

      const denominator = /\\frac\{[xh]\}\{(\d+)\}/.exec(right!);
      expect(denominator, `${where}: ${right}`).not.toBeNull();

      const unknown = valueOf(left!) * Number(denominator![1]);
      const eyeHeight = /eye level is (\d+) metres/.exec(question.prompt.en);
      const expected = unknown + (eyeHeight ? Number(eyeHeight[1]) : 0);

      expect(
        Math.abs(answerOf(question) - expected),
        `${where}: ${question.stem} -> ${expected}`,
      ).toBeLessThan(TOLERANCE);
    });
  });

  it("asks for a length, so the answer is positive", () => {
    each("trig.solve", (question, where) => {
      expect(answerOf(question), where).toBeGreaterThan(0);
    });
  });

  it("adds the eye height rather than reporting the height above it", () => {
    each("trig.solve", (question, where) => {
      const eyeHeight = /eye level is (\d+) metres/.exec(question.prompt.en);
      if (!eyeHeight) return;
      const [left, right] = question.stem.split("=");
      const unknown =
        valueOf(left!) * Number(/\\frac\{[xh]\}\{(\d+)\}/.exec(right!)![1]);
      expect(answerOf(question) - unknown, where).toBeCloseTo(
        Number(eyeHeight[1]),
        9,
      );
    });
  });
});

describe("the whole chapter", () => {
  it("says so where the stem is not machine-readable", () => {
    for (const generatorId of ["trig.definition", "trig.special", "trig.solve"]) {
      each(generatorId, (question, where) => {
        expect(question.machineStem, where).toBeNull();
      });
    }
  });

  it("offers a wrong answer that is really wrong", () => {
    for (const generatorId of ["trig.definition", "trig.special", "trig.solve"]) {
      each(generatorId, (question, where) => {
        for (const mistake of question.misconceptions ?? []) {
          expect(
            Math.abs(
              valueOf((mistake.answer as { value: string }).value.replace(/\*/g, " * ")) -
                answerOf(question),
            ),
            `${where}: ${(mistake.answer as { value: string }).value}`,
          ).toBeGreaterThan(1e-9);
        }
      });
    }
  });
});
