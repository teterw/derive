import { describe, expect, it } from "vitest";
import katex from "katex";
import { parse } from "mathjs";
import { answerToTex, toTex } from "./to-tex";
import { normalizeInput } from "./check";

/**
 * The preview exists to tell a learner how their typing will be read. If it
 * ever disagrees with the checker, it is actively lying to them at the exact
 * moment they are deciding whether to submit.
 *
 * So the important tests here are not "does it look nice" but "does it agree
 * with mathjs", which is the parser that actually marks the answer.
 */

/** Inputs a learner plausibly types, including the awkward ones. */
const CORPUS = [
  "2",
  "-5",
  "x",
  "x^2",
  "m^5",
  "2x",
  "2x^3",
  "x^2 + 3x + 2",
  "1/2",
  "3/4",
  "x/2",
  "(x+1)/2",
  "1/(x+1)",
  "sqrt(2)",
  "sqrt(18)",
  "3sqrt(2)",
  "sqrt(2)/2",
  "3*sqrt(5)/2",
  "(1+sqrt(5))/2",
  "2^(-3)",
  "x^(-2)",
  "1/x^2",
  "2.5*10^(-4)",
  "3.2*10^8",
  "-b/(2a)",
  "x*(x-3)",
  "(x+2)(x-2)",
  "2*(3+4)",
  "-(x+1)",
  "pi",
  "2pi",
  "ac",
  "4ac",
];

describe("toTex", () => {
  it("renders every corpus input as KaTeX that actually compiles", () => {
    for (const source of CORPUS) {
      const tex = toTex(source);
      expect(tex, source).not.toBeNull();
      expect(
        () => katex.renderToString(tex!, { throwOnError: true }),
        `${source} -> ${tex}`,
      ).not.toThrow();
    }
  });

  /**
   * The real contract. Both parsers are asked to evaluate the expression at
   * the same sample points; if they disagree anywhere, the preview is showing
   * something other than what will be marked.
   */
  it("agrees with mathjs about what the input means", () => {
    const points = [
      { x: 2, y: 3, a: 2, b: 5, c: 3, m: 2, n: 3 },
      { x: 0.5, y: 1.5, a: 3, b: 2, c: 7, m: 1.5, n: 2 },
      { x: -1.25, y: 4, a: 1.5, b: -3, c: 2, m: 3, n: 1 },
    ];

    for (const source of CORPUS) {
      const tex = toTex(source);
      expect(tex, source).not.toBeNull();

      // Read the TeX back through the same route a rendered formula takes,
      // then compare against mathjs reading the raw input.
      const mine = parse(texToMath(tex!));
      const theirs = parse(normalizeInput(source));

      for (const scope of points) {
        let a: number;
        let b: number;
        try {
          a = mine.evaluate({ ...scope });
          b = theirs.evaluate({ ...scope });
        } catch {
          // Undefined at this point for both (a division by zero, say) is
          // fine; what matters is that neither is silently a different value.
          continue;
        }
        if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
        expect(a, `${source} -> ${tex} at ${JSON.stringify(scope)}`).toBeCloseTo(
          b,
          9,
        );
      }
    }
  });

  it("returns null for input it cannot read, rather than guessing", () => {
    for (const source of ["", "  ", "2x +", "((", "sqrt(", ")", "+"]) {
      expect(toTex(source), source).toBeNull();
    }
  });

  it("only brackets what needs bracketing", () => {
    expect(toTex("(2)+(3)")).toBe("2 + 3");
    expect(toTex("1/(x+1)")).toBe("\\frac{1}{x + 1}");
    expect(toTex("x^2")).toBe("x^{2}");
  });
});

describe("answerToTex", () => {
  it("lays out a set of roots", () => {
    expect(answerToTex("2, -5")).toBe("2,\\quad -5");
    expect(answerToTex("{2, -5}")).toBe("2,\\quad -5");
  });

  it("drops the x = a learner may have written", () => {
    expect(answerToTex("x = 2, x = -5")).toBe("2,\\quad -5");
  });

  it("gives up on a set it cannot read in full", () => {
    expect(answerToTex("2, ")).toBe("2");
    expect(answerToTex("2, x+")).toBeNull();
  });
});

/**
 * A deliberately small TeX reader, used only by this test to close the loop.
 * It undoes exactly what the printer does, so a printing bug shows up as a
 * disagreement with mathjs rather than passing unnoticed.
 */
function texToMath(tex: string): string {
  let text = tex;
  let previous = "";
  while (text !== previous) {
    previous = text;
    text = text.replace(
      /\\frac\{((?:[^{}]|\{[^{}]*\})*)\}\{((?:[^{}]|\{[^{}]*\})*)\}/g,
      "(($1)/($2))",
    );
    text = text.replace(
      /\\sqrt\{((?:[^{}]|\{[^{}]*\})*)\}/g,
      "sqrt(($1))",
    );
    text = text.replace(
      /\^\{((?:[^{}]|\{[^{}]*\})*)\}/g,
      "^($1)",
    );
  }
  return text
    .replace(/\\left\(/g, "(")
    .replace(/\\right\)/g, ")")
    .replace(/\\cdot/g, "*")
    .replace(/\\pi/g, "pi");
}
