import { describe, expect, it } from "vitest";
import { compile, evaluate } from "mathjs";
import { katexToMath } from "@/lib/math/katex";
import { generateQuestion } from "./index";
import { anglesWhere, valueAt, type RatioName } from "./exact-angles";
import { DIFFICULTIES, type Difficulty, type Question } from "../types";

/**
 * ฟังก์ชันตรีโกณมิติ · ม.5, beyond what the gate can reach.
 *
 * Unlike the ม.3 chapter, most of this one *is* machine-readable - the angles
 * are in radians, so `lib/math/katex.ts` converts the stems and §9.5 checks
 * the answers. Three things it still cannot check, and all three are where the
 * marks are:
 *
 *  1. **The exact values themselves.** §9.5 compares the answer to the stem,
 *     and both come from the same table. If `\cos\frac{2\pi}{3}` were recorded
 *     as a half rather than minus a half, question and answer would agree with
 *     each other and disagree with mathematics. Here they are checked against
 *     the standard library instead.
 *  2. **Whether a solution set is complete.** Substituting a root proves it is
 *     a root; it says nothing about the root that was left out, which is the
 *     single commonest mistake in the topic. So the interval is swept.
 *  3. **The triangles**, whose stems state what is known rather than an
 *     expression, and so carry `machineStem: null`.
 */
const SEEDS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

const TWO_PI = Math.PI * 2;

function each(
  generatorId: string,
  check: (question: Question, where: string) => void,
  difficulties: readonly Difficulty[] = DIFFICULTIES as readonly Difficulty[],
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

/** KaTeX to a number, through the app's own converter. */
const numberOf = (katex: string) => Number(evaluate(katexToMath(katex)));

const answerValue = (question: Question) =>
  Number(evaluate((question.answer as { value: string }).value));

describe("the exact values", () => {
  /**
   * Every angle the module can produce, against the standard library. This is
   * the foundation the whole chapter stands on: sixty-odd values, each of
   * which would be invisible if wrong.
   */
  it("agree with the standard library at all twenty-four angles", () => {
    const ratios: RatioName[] = ["sin", "cos", "tan"];
    let checked = 0;

    for (let twelfths = 0; twelfths < 24; twelfths += 1) {
      const radians = (twelfths * Math.PI) / 12;
      for (const ratio of ratios) {
        const exact = valueAt({ twelfths }, ratio);
        const truth =
          ratio === "sin"
            ? Math.sin(radians)
            : ratio === "cos"
              ? Math.cos(radians)
              : Math.tan(radians);

        /*
         * A twelfth of pi is fifteen degrees, which has an exact value but not
         * one this module carries - it is not a standard angle. Those, and the
         * tangent's two poles, are the only things it refuses.
         */
        const standard = twelfths % 2 === 0 || twelfths % 3 === 0;
        if (exact === null) {
          expect(
            !standard || Math.abs(truth) > 1e12,
            `${ratio} at ${twelfths}/12 pi has no exact value, but it should`,
          ).toBe(true);
          continue;
        }
        expect(standard, `${twelfths}/12 pi is not a standard angle`).toBe(true);

        expect(
          Math.abs(Number(evaluate(exact.math)) - truth),
          `${ratio} at ${twelfths}/12 pi is written ${exact.katex}`,
        ).toBeLessThan(1e-12);
        expect(
          Math.abs(numberOf(exact.katex) - truth),
          `${ratio} at ${twelfths}/12 pi renders as ${exact.katex}`,
        ).toBeLessThan(1e-12);
        checked += 1;
      }
    }

    expect(checked).toBe(46);
  });

  /** The same in reverse: every angle with that value, and no others. */
  it("find every angle that takes a given value", () => {
    for (const ratio of ["sin", "cos", "tan"] as RatioName[]) {
      for (let twelfths = 0; twelfths < 24; twelfths += 1) {
        const value = valueAt({ twelfths }, ratio);
        if (!value) continue;
        const found = anglesWhere(ratio, value).map((a) => a.twelfths);
        expect(found, `${ratio} = ${value.katex}`).toContain(twelfths);

        for (const other of found) {
          const truth = Number(evaluate(value.math));
          const actual = Number(
            evaluate(`${ratio}(${(other * Math.PI) / 12})`),
          );
          expect(Math.abs(actual - truth), `${ratio} at ${other}/12 pi`).toBeLessThan(
            1e-9,
          );
        }
      }
    }
  });
});

describe("trig.equations", () => {
  /**
   * The solution set, swept rather than substituted.
   *
   * §9.5 puts each stated root into the equation and checks it comes out
   * zero - which proves every answer given is right, and is silent about the
   * answer that was not given. So this walks the whole interval in steps of a
   * thousandth, bisects wherever the equation changes sign, and insists every
   * root it finds was in the set.
   *
   * A tangent changes sign at its poles without having a root there, so a
   * crossing counts only if the function is actually small at it.
   */
  it("gives every solution in the interval, and no others", { timeout: 60_000 }, () => {
    each("trig.equations", (question, where) => {
      const [left, right] = question.stem.split("=");
      expect(right, `${where}: not an equation`).toBeDefined();
      const zeroForm = `(${katexToMath(left!)}) - (${katexToMath(right!)})`;

      // Compiled once: six thousand samples per question, forty-eight of them.
      const compiled = compile(zeroForm);
      const at = (theta: number) => {
        const value = Number(compiled.evaluate({ theta }));
        return Number.isFinite(value) ? value : NaN;
      };

      const stated = (question.answer as { values: string[] }).values.map(
        (value) => Number(evaluate(value)),
      );

      const step = 1e-3;
      const steps = Math.floor(TWO_PI / step);
      const found: number[] = [];

      for (let index = 0; index < steps; index += 1) {
        const theta = index * step;
        const here = at(theta);
        const next = at(Math.min(theta + step, TWO_PI - 1e-12));
        if (Math.abs(here) < 1e-12) {
          found.push(theta);
          continue;
        }
        if (!Number.isFinite(here) || !Number.isFinite(next)) continue;
        if (here * next > 0) continue;

        // A crossing: bisect, then keep it only if it is a root not a pole.
        let low = theta;
        let high = theta + step;
        for (let i = 0; i < 60; i += 1) {
          const middle = (low + high) / 2;
          if (at(low) * at(middle) <= 0) high = middle;
          else low = middle;
        }
        const root = (low + high) / 2;
        if (Math.abs(at(root)) < 1e-6) found.push(root);
      }

      for (const root of found) {
        /*
         * `\cos\theta = 1` touches zero at 2pi without crossing, and 2pi is
         * the open end of the interval - the solution there is 0, which is in
         * the set already. Every root the curriculum produces is a multiple of
         * pi/12, so nothing legitimate hides in this last thousandth.
         */
        if (root > TWO_PI - 1e-3) continue;
        const matched = stated.some(
          (value) => Math.abs(value - root) < 1e-3,
        );
        expect(
          matched,
          `${where}: ${question.stem} is also solved by theta = ${root.toFixed(4)}, which the answer leaves out`,
        ).toBe(true);
      }

      // And nothing stated is outside the interval.
      for (const value of stated) {
        expect(value, `${where}: ${value} is outside [0, 2pi)`).toBeGreaterThanOrEqual(0);
        expect(value, `${where}: ${value} is outside [0, 2pi)`).toBeLessThan(TWO_PI);
      }
    });
  });

  it("finds the roots the sweep finds, not a subset of them", () => {
    // The mirror of the test above: every stated root really is one.
    each("trig.equations", (question, where) => {
      const [left, right] = question.stem.split("=");
      const zeroForm = `(${katexToMath(left!)}) - (${katexToMath(right!)})`;
      for (const value of (question.answer as { values: string[] }).values) {
        const theta = Number(evaluate(value));
        expect(
          Math.abs(Number(evaluate(zeroForm, { theta }))),
          `${where}: ${value} does not solve ${question.stem}`,
        ).toBeLessThan(1e-9);
      }
    });
  });
});

describe("trig.unit-circle at difficulty 3", () => {
  /**
   * The stem gives one ratio and the prompt gives a quadrant; neither says
   * what the answer is, so §9.5 skips it. What has to hold is the identity
   * and the sign.
   */
  it("answers with a ratio the identity and the quadrant allow", () => {
    each(
      "trig.unit-circle",
      (question, where) => {
        const given = /\\(sin|cos)\\theta = (.+)$/.exec(question.stem);
        expect(given, `${where}: ${question.stem}`).not.toBeNull();
        const givenRatio = given![1] as "sin" | "cos";
        const givenValue = numberOf(given![2]!);

        const wanted = /find (sine|cosine|tangent) theta/.exec(
          question.prompt.en,
        );
        expect(wanted, `${where}: ${question.prompt.en}`).not.toBeNull();
        const name = wanted![1]!;
        const answer = answerValue(question);

        // The angle the pair describes, rebuilt from the given ratio.
        const theta =
          givenRatio === "sin" ? Math.asin(givenValue) : Math.acos(givenValue);
        const size =
          name === "sine"
            ? Math.abs(Math.sin(theta))
            : name === "cosine"
              ? Math.abs(Math.cos(theta))
              : Math.abs(Math.tan(theta));

        expect(
          Math.abs(Math.abs(answer) - size),
          `${where}: ${name} of that angle has size ${size}, not ${Math.abs(answer)}`,
        ).toBeLessThan(1e-9);

        // And the identity holds between the given ratio and the answer.
        if (name !== "tangent") {
          expect(
            Math.abs(givenValue ** 2 + answer ** 2 - 1),
            `${where}: the two ratios do not satisfy the identity`,
          ).toBeLessThan(1e-9);
        }
      },
      [3],
    );
  });

  it("gets the sign from the quadrant the prompt names", () => {
    each(
      "trig.unit-circle",
      (question, where) => {
        const quadrant = /the (first|second|third|fourth) quadrant/.exec(
          question.prompt.en,
        );
        expect(quadrant, where).not.toBeNull();
        const index = ["first", "second", "third", "fourth"].indexOf(
          quadrant![1]!,
        ) + 1;

        const wanted = /find (sine|cosine|tangent) theta/.exec(
          question.prompt.en,
        )![1]!;
        const positive =
          wanted === "sine"
            ? index === 1 || index === 2
            : wanted === "cosine"
              ? index === 1 || index === 4
              : index === 1 || index === 3;

        const answer = answerValue(question);
        expect(
          answer > 0,
          `${where}: ${wanted} in quadrant ${index} should be ${positive ? "positive" : "negative"}, and the answer is ${answer}`,
        ).toBe(positive);
      },
      [3],
    );
  });
});

describe("trig.laws", () => {
  /** `a = 3, \ b = 5, \ C = \frac{\pi}{3}` and friends. */
  function given(stem: string, name: string): string | null {
    const match = new RegExp(`(?:^|[,\\s])${name} = ([^,]+)`).exec(stem);
    return match ? match[1]!.trim() : null;
  }

  it("builds a triangle the law of cosines agrees with", () => {
    each(
      "trig.laws",
      (question, where) => {
        const a = Number(given(question.stem, "a"));
        const b = Number(given(question.stem, "b"));
        const angle = numberOf(given(question.stem, "C")!);
        const expected = Math.sqrt(
          a * a + b * b - 2 * a * b * Math.cos(angle),
        );
        expect(
          Math.abs(answerValue(question) - expected),
          `${where}: ${question.stem}`,
        ).toBeLessThan(1e-9);
      },
      [1],
    );
  });

  it("builds a triangle the law of sines agrees with", () => {
    each(
      "trig.laws",
      (question, where) => {
        const a = Number(given(question.stem, "a"));
        const angleA = numberOf(given(question.stem, "A")!);
        const angleB = numberOf(given(question.stem, "B")!);
        const expected = (a * Math.sin(angleB)) / Math.sin(angleA);
        expect(
          Math.abs(answerValue(question) - expected),
          `${where}: ${question.stem}`,
        ).toBeLessThan(1e-9);
        // The two angles have to leave room for a third.
        expect(angleA + angleB, `${where}: no room for angle C`).toBeLessThan(
          Math.PI,
        );
      },
      [2],
    );
  });

  it("asks for an angle its own three sides produce", () => {
    each(
      "trig.laws",
      (question, where) => {
        const a = Number(given(question.stem, "a"));
        const b = Number(given(question.stem, "b"));
        const c = numberOf(given(question.stem, "c")!);
        const cosine = (a * a + b * b - c * c) / (2 * a * b);
        const expected = Math.acos(cosine);

        expect(
          Math.abs(answerValue(question) - expected),
          `${where}: ${question.stem} gives ${expected}`,
        ).toBeLessThan(1e-9);

        // A triangle, not three numbers: any two sides beat the third.
        expect(a + b, `${where}: not a triangle`).toBeGreaterThan(c);
        expect(a + c, `${where}: not a triangle`).toBeGreaterThan(b);
        expect(b + c, `${where}: not a triangle`).toBeGreaterThan(a);
      },
      [3],
    );
  });

  it("answers the word problem with a distance the triangle allows", () => {
    each(
      "trig.laws",
      (question, where) => {
        const walked = [...question.prompt.en.matchAll(/(\d+) km/g)].map(
          (match) => Number(match[1]),
        );
        expect(walked.length, where).toBe(2);
        const angle = numberOf(
          /angle of (.+) radians/.exec(question.prompt.en)![1]!,
        );
        const [first, second] = walked as [number, number];
        const expected = Math.sqrt(
          first ** 2 + second ** 2 - 2 * first * second * Math.cos(angle),
        );
        expect(
          Math.abs(answerValue(question) - expected),
          `${where}: ${question.prompt.en}`,
        ).toBeLessThan(1e-9);
        expect(answerValue(question), where).toBeLessThan(first + second);
      },
      [4],
    );
  });
});

describe("the whole chapter", () => {
  it("keeps every angle in radians, never degrees", () => {
    for (const generatorId of [
      "trig.unit-circle",
      "trig.identities",
      "trig.equations",
      "trig.laws",
    ]) {
      each(generatorId, (question, where) => {
        expect(question.stem, `${where}: degrees in a ม.5 stem`).not.toContain(
          "^\\circ",
        );
        expect(question.prompt.th, where).not.toContain("^\\circ");
      });
    }
  });
});
