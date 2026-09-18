import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { KatexConversionError, katexToMath } from "./katex";

function value(katex: string, scope: Record<string, number> = {}): number {
  return evaluate(katexToMath(katex), { ...scope }) as number;
}

describe("katexToMath", () => {
  it("converts fractions", () => {
    expect(value("\\frac{1}{2}")).toBeCloseTo(0.5);
    expect(value("\\frac{x+1}{x-1}", { x: 3 })).toBeCloseTo(2);
    expect(value("\\frac{\\frac{1}{2}}{\\frac{1}{4}}")).toBeCloseTo(2);
  });

  it("converts roots", () => {
    expect(value("\\sqrt{9}")).toBeCloseTo(3);
    expect(value("2\\sqrt{2}")).toBeCloseTo(Math.SQRT2 * 2);
    expect(value("\\sqrt[3]{27}")).toBeCloseTo(3);
  });

  it("converts powers, including multi-character exponents", () => {
    expect(value("2^{10}")).toBe(1024);
    expect(value("x^2", { x: 5 })).toBe(25);
    expect(value("2^{-3}")).toBeCloseTo(0.125);
    expect(value("x^{m+n}", { x: 2, m: 3, n: 4 })).toBe(128);
  });

  it("converts multiplication signs and spacing macros", () => {
    expect(value("3 \\cdot 4")).toBe(12);
    expect(value("3 \\times 4")).toBe(12);
    expect(value("12 \\div 4")).toBe(3);
    expect(value("3\\,\\cdot\\,4")).toBe(12);
  });

  it("keeps implicit multiplication working", () => {
    expect(value("3x", { x: 4 })).toBe(12);
    expect(value("2x^2", { x: 3 })).toBe(18);
    expect(value("(x+1)(x-1)", { x: 4 })).toBe(15);
  });

  it("drops \\left and \\right", () => {
    expect(value("\\left(\\frac{1}{2}\\right)^{2}")).toBeCloseTo(0.25);
  });

  it("strips \\text and \\mathrm wrappers", () => {
    expect(katexToMath("\\mathrm{e}")).toBe("e");
  });

  it("refuses \\pm rather than guessing a branch", () => {
    expect(() => katexToMath("1 \\pm \\sqrt{5}")).toThrow(
      KatexConversionError,
    );
  });

  it("refuses commands it does not know", () => {
    expect(() => katexToMath("\\int_0^1 x\\,dx")).toThrow(KatexConversionError);
    expect(() => katexToMath("\\alpha + 1")).toThrow(KatexConversionError);
  });

  it("refuses unbalanced braces", () => {
    expect(() => katexToMath("\\frac{1}{2")).toThrow(KatexConversionError);
  });
});
