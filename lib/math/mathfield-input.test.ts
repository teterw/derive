import { describe, expect, it } from "vitest";
import { checkAnswer, normalizeInput } from "./check";

/**
 * Answers built in the maths field arrive as LaTeX rather than typed text.
 *
 * That LaTeX is the learner's actual answer, so everything downstream has to
 * accept it - and it carries artefacts the keypad never produced, chiefly the
 * `\placeholder{}` that stands for an empty box in `□/□`. A half-built
 * fraction must read as incomplete, not as a parse error, or the box would
 * shout "unreadable" the instant the fraction key is pressed.
 */
describe("input from the maths field", () => {
  const cases: [string, string][] = [
    ["\\frac{1}{2}", "0.5"],
    ["\\frac{3}{4}", "0.75"],
    ["\\sqrt{18}", "sqrt(18)"],
    ["3\\sqrt{2}", "3*sqrt(2)"],
    ["x^{2}", "x^2"],
    ["2x^{3}", "2*x^3"],
    ["\\frac{-b}{2a}", "-b/(2*a)"],
    ["\\left(x+1\\right)\\left(x-1\\right)", "(x+1)*(x-1)"],
    ["2\\cdot10^{8}", "2*10^8"],
    ["\\frac{1+\\sqrt{5}}{2}", "(1+sqrt(5))/2"],
  ];

  it("means the same thing as the equivalent typed answer", () => {
    for (const [latex, plain] of cases) {
      const result = checkAnswer({ kind: "exact", value: plain }, latex);
      expect(result.correct, `${latex} should match ${plain}`).toBe(true);
    }
  });

  it("marks a wrong answer wrong, whichever way it was built", () => {
    const result = checkAnswer(
      { kind: "exact", value: "3*sqrt(2)" },
      "\\sqrt{18}+1",
    );
    expect(result.correct).toBe(false);
  });

  it("reads an empty box as empty rather than as a syntax error", () => {
    // What the field holds the moment the fraction key is pressed.
    expect(() =>
      normalizeInput("\\frac{\\placeholder{}}{\\placeholder{}}"),
    ).not.toThrow();
    expect(() => normalizeInput("\\frac{2}{\\placeholder{}}")).not.toThrow();
    expect(() => normalizeInput("\\sqrt{\\placeholder{}}")).not.toThrow();
  });

  it("strips the field's own typesetting macros", () => {
    expect(normalizeInput("\\pi")).toBe("pi");
    expect(normalizeInput("2\\pi")).toBe("2pi");
  });

  /**
   * The field writes a simple power with braces and no command at all, which
   * once slipped past the "is this LaTeX" test and reached mathjs raw - so a
   * correct `x^{2}` was marked wrong.
   */
  it("recognises braced exponents as LaTeX even with no backslash in sight", () => {
    expect(normalizeInput("x^{2}")).toBe("x^(2)");
    expect(checkAnswer({ kind: "exact", value: "x^2" }, "x^{2}").correct).toBe(
      true,
    );
    expect(
      checkAnswer({ kind: "exact", value: "2*x^3" }, "2x^{3}").correct,
    ).toBe(true);
  });

  it("still handles a set of roots built in the field", () => {
    const result = checkAnswer({ kind: "set", values: ["2", "-5"] }, "2,-5");
    expect(result.correct).toBe(true);
  });

  /**
   * A half-built expression must be reported as unreadable rather than
   * throwing out of the server action.
   */
  it("reports a half-built expression as unreadable, not as a crash", () => {
    for (const partial of ["\\frac{}{}", "\\sqrt{", "\\frac{1}"]) {
      const result = checkAnswer({ kind: "exact", value: "1" }, partial);
      expect(result.correct, partial).toBe(false);
    }
  });
});
