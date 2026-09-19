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
    expect(() => katexToMath("1 \\pm \\sqrt{5}")).toThrow(KatexConversionError);
  });

  it("refuses commands it does not know", () => {
    expect(() => katexToMath("\\int_0^1 x\\,dx")).toThrow(KatexConversionError);
    expect(() => katexToMath("\\alpha + 1")).toThrow(KatexConversionError);
  });

  it("refuses unbalanced braces", () => {
    expect(() => katexToMath("\\frac{1}{2")).toThrow(KatexConversionError);
  });

  /**
   * A command takes the next single token when there are no braces - `\sqrt5`
   * is `\sqrt{5}` and `\frac12` is one half. This parser used to insist on the
   * brace, and it was not a theoretical gap: MathLive writes the unbraced form
   * whenever the argument is one character, so every answer with a single-digit
   * radical or fraction built in the maths field came back unparseable and was
   * marked wrong. `9√5 - 4√5` answered `5√5` was scored as a mistake.
   */
  describe("an argument with no braces, which is still TeX", () => {
    it("reads a single digit", () => {
      expect(katexToMath("5\\sqrt5")).toBe("5sqrt(5)");
      expect(value("\\sqrt9")).toBeCloseTo(3);
      expect(value("\\frac12")).toBeCloseTo(0.5);
      expect(value("\\frac34")).toBeCloseTo(0.75);
    });

    it("reads a single letter", () => {
      expect(katexToMath("\\sqrt x")).toContain("sqrt(x)");
      expect(katexToMath("\\frac xy")).toContain("x");
    });

    /**
     * `\pi` is not a command this parser supports, and that is fine - what is
     * being pinned is that the whole command is taken as *one* token. The
     * failure must therefore be "unsupported command", not "expected a group":
     * the first says the argument was read and rejected, the second says it was
     * never read at all.
     */
    it("reads a command as one token", () => {
      expect(() => katexToMath("\\sqrt\\pi")).toThrow(/unsupported command/);
      expect(() => katexToMath("\\sqrt\\pi")).not.toThrow(/expected a group/);
    });

    it("takes only the one token, not the rest of the expression", () => {
      // `\sqrt4+5` is 2 + 5, not the root of 45 and not the root of 9.
      expect(value("\\sqrt4+5")).toBeCloseTo(7);
      expect(value("\\frac12+1")).toBeCloseTo(1.5);
    });

    it("still refuses when there is no argument at all", () => {
      expect(() => katexToMath("\\sqrt")).toThrow(KatexConversionError);
      expect(() => katexToMath("\\sqrt}")).toThrow(KatexConversionError);
    });

    it("agrees with the braced form", () => {
      for (const [bare, braced] of [
        ["5\\sqrt5", "5\\sqrt{5}"],
        ["\\frac12", "\\frac{1}{2}"],
        ["-10\\sqrt3", "-10\\sqrt{3}"],
        ["\\frac{\\sqrt2}2", "\\frac{\\sqrt{2}}{2}"],
      ]) {
        expect(katexToMath(bare!), bare).toBe(katexToMath(braced!));
      }
    });
  });
});
