import { describe, expect, it } from "vitest";
import { checkAnswer, normalizeInput, satisfiesForm, splitSet } from "./check";

const exact = (value: string) => ({ kind: "exact" as const, value });

describe("normalizeInput", () => {
  it("accepts plain text", () => {
    expect(normalizeInput(" x^2 ")).toBe("x^2");
    expect(normalizeInput("sqrt(2)")).toBe("sqrt(2)");
  });

  it("accepts what the keypad emits", () => {
    expect(normalizeInput("\\frac{1}{2}")).toBe("((1)/(2))");
    expect(normalizeInput("2\\sqrt{3}")).toBe("2sqrt(3)");
  });

  it("accepts typographic symbols", () => {
    expect(normalizeInput("√9")).toBe("sqrt(9)");
    expect(normalizeInput("3 × 4")).toBe("3 * 4");
    expect(normalizeInput("−5")).toBe("-5");
  });
});

describe("splitSet", () => {
  it("accepts the ways a student writes a solution set", () => {
    expect(splitSet("{2, -5}")).toEqual(["2", "-5"]);
    expect(splitSet("2, -5")).toEqual(["2", "-5"]);
    expect(splitSet("x = 2, x = -5")).toEqual(["2", "-5"]);
    expect(splitSet("2 หรือ -5")).toEqual(["2", "-5"]);
  });
});

describe("checkAnswer - equivalence table (PROMPT.md §9)", () => {
  it("treats 1/2, 0.5 and 0.50 as the same number", () => {
    for (const input of ["1/2", "0.5", "0.50", "2^(-1)"]) {
      expect(checkAnswer(exact("1/2"), input).correct).toBe(true);
    }
  });

  it("accepts an equivalent radical when form does not matter", () => {
    expect(checkAnswer(exact("2*sqrt(2)"), "sqrt(8)").correct).toBe(true);
  });

  it("rejects sqrt(8) for 2 sqrt(2) when the skill is about form", () => {
    const result = checkAnswer(
      exact("2*sqrt(2)"),
      "sqrt(8)",
      "simplified-radical",
    );
    expect(result).toEqual({
      correct: false,
      reason: "form",
      requirement: "simplified-radical",
    });
  });

  it("accepts the simplified radical itself", () => {
    expect(
      checkAnswer(exact("2*sqrt(2)"), "2sqrt(2)", "simplified-radical").correct,
    ).toBe(true);
  });

  it("rejects a wrong answer outright", () => {
    expect(checkAnswer(exact("2*sqrt(2)"), "3*sqrt(2)")).toEqual({
      correct: false,
      reason: "wrong",
    });
  });

  it("reports unparseable input as such, not as wrong", () => {
    expect(checkAnswer(exact("1/2"), "((")).toEqual({
      correct: false,
      reason: "unparseable",
    });
    expect(checkAnswer(exact("1/2"), "   ")).toEqual({
      correct: false,
      reason: "unparseable",
    });
  });
});

describe("checkAnswer - sets", () => {
  const roots = { kind: "set" as const, values: ["2", "-5"] };

  it("ignores order", () => {
    expect(checkAnswer(roots, "-5, 2").correct).toBe(true);
    expect(checkAnswer(roots, "{2, -5}").correct).toBe(true);
  });

  it("requires every root", () => {
    expect(checkAnswer(roots, "2").correct).toBe(false);
    expect(checkAnswer(roots, "2, -5, 7").correct).toBe(false);
  });

  it("says when a right root is simply missing a partner", () => {
    expect(checkAnswer(roots, "2")).toEqual({
      correct: false,
      reason: "incomplete",
      found: 1,
      expected: 2,
    });
  });

  it("but calls a wrong root wrong, not incomplete", () => {
    expect(checkAnswer(roots, "7")).toEqual({ correct: false, reason: "wrong" });
  });

  it("rejects a repeated root standing in for two", () => {
    expect(checkAnswer(roots, "2, 2").correct).toBe(false);
  });

  it("accepts equivalent forms of each root", () => {
    const halves = { kind: "set" as const, values: ["1/2", "-3/4"] };
    expect(checkAnswer(halves, "0.5, -0.75").correct).toBe(true);
  });
});

describe("checkAnswer - numeric", () => {
  it("honours the tolerance", () => {
    const answer = { kind: "numeric" as const, value: 3.14159, tol: 0.001 };
    expect(checkAnswer(answer, "3.1416").correct).toBe(true);
    expect(checkAnswer(answer, "3.2").correct).toBe(false);
  });
});

describe("satisfiesForm", () => {
  it("simplified-radical", () => {
    expect(satisfiesForm("2*sqrt(2)", "simplified-radical")).toBe(true);
    expect(satisfiesForm("sqrt(8)", "simplified-radical")).toBe(false);
    expect(satisfiesForm("sqrt(6)", "simplified-radical")).toBe(true);
    expect(satisfiesForm("1/sqrt(2)", "simplified-radical")).toBe(false);
  });

  it("rationalized-denominator", () => {
    expect(satisfiesForm("sqrt(2)/2", "rationalized-denominator")).toBe(true);
    expect(satisfiesForm("1/sqrt(2)", "rationalized-denominator")).toBe(false);
    expect(satisfiesForm("3/(1+sqrt(5))", "rationalized-denominator")).toBe(
      false,
    );
  });

  it("scientific-notation", () => {
    expect(satisfiesForm("3.2*10^5", "scientific-notation")).toBe(true);
    expect(satisfiesForm("32*10^4", "scientific-notation")).toBe(false);
    expect(satisfiesForm("0.32*10^6", "scientific-notation")).toBe(false);
    expect(satisfiesForm("320000", "scientific-notation")).toBe(false);
    expect(satisfiesForm("-4.5*10^(-3)", "scientific-notation")).toBe(true);
  });

  it("factored", () => {
    expect(satisfiesForm("(x-2)(x-3)", "factored")).toBe(true);
    expect(satisfiesForm("x^2-5x+6", "factored")).toBe(false);
    expect(satisfiesForm("3x(x-2)", "factored")).toBe(true);
    expect(satisfiesForm("(x-2)^2", "factored")).toBe(true);
    expect(satisfiesForm("-(x-1)(x+2)", "factored")).toBe(true);
  });

  it("positive-exponents", () => {
    expect(satisfiesForm("1/x^2", "positive-exponents")).toBe(true);
    expect(satisfiesForm("x^(-2)", "positive-exponents")).toBe(false);
  });
});
