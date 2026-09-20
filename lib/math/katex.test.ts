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

  /**
   * `xy` is a product, not a symbol called "xy". mathjs would happily read it
   * as the latter, so `x^2 + 5xy + 6y^2` and its own factorisation would be
   * expressions in different variables and would never be found equivalent -
   * a correct two-variable answer, marked wrong.
   */
  it("reads two variables side by side as a product", () => {
    const scope = { x: 2, y: 5 };
    expect(value("xy", scope)).toBeCloseTo(10);
    expect(value("5xy", scope)).toBeCloseTo(50);
    expect(value("x^2 + 5xy + 6y^2", scope)).toBeCloseTo(4 + 50 + 150);
    expect(
      value("\\left(x + 2y\\right)\\left(x + 3y\\right)", scope),
    ).toBeCloseTo(12 * 17);
    // Either way round, and a lone variable is untouched.
    expect(value("yx", scope)).toBeCloseTo(10);
    expect(katexToMath("x")).toBe("x");
  });

  /**
   * The same trap with the constant `e`, which the calculus chapters put
   * beside a variable constantly: `xe^x` read as a symbol called `xe` made a
   * correct derivative come back unreadable.
   */
  it("reads a variable beside e as a product", () => {
    expect(value("xe^x", { x: 2 })).toBeCloseTo(2 * Math.E ** 2);
    expect(value("-2xe^x", { x: 1 })).toBeCloseTo(-2 * Math.E);
    // And `e` on its own is still the number.
    expect(value("e")).toBeCloseTo(Math.E);
  });

  it("leaves a function name beside a variable alone", () => {
    // Not five factors: `sqrt` is a name, even with a coefficient in front.
    expect(katexToMath("2\\sqrt{3}")).toContain("sqrt(3)");
    expect(value("2\\sqrt{3}")).toBeCloseTo(2 * Math.sqrt(3));
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
      /*
       * The value rather than the exact string: what this is about is that an
       * unbraced `\sqrt5` is read as `\sqrt{5}` at all. Whether the product in
       * front of it is written `5sqrt(5)` or `5*sqrt(5)` is mathjs's business
       * and has already changed once, for an unrelated reason.
       */
      expect(katexToMath("5\\sqrt5")).toContain("sqrt(5)");
      expect(value("5\\sqrt5")).toBeCloseTo(5 * Math.sqrt(5), 12);
      expect(value("\\sqrt9")).toBeCloseTo(3);
      expect(value("\\frac12")).toBeCloseTo(0.5);
      expect(value("\\frac34")).toBeCloseTo(0.75);
    });

    it("reads a single letter", () => {
      expect(katexToMath("\\sqrt x")).toContain("sqrt(x)");
      expect(katexToMath("\\frac xy")).toContain("x");
    });

    /**
     * `\alpha` is not a command this parser supports, and that is fine - what
     * is being pinned is that the whole command is taken as *one* token. The
     * failure must therefore be "unsupported command", not "expected a group":
     * the first says the argument was read and rejected, the second says it was
     * never read at all.
     */
    it("reads a command as one token", () => {
      expect(() => katexToMath("\\sqrt\\alpha")).toThrow(/unsupported command/);
      expect(() => katexToMath("\\sqrt\\alpha")).not.toThrow(/expected a group/);
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

/**
 * Trigonometric and logarithmic function commands.
 *
 * This subset was refused outright until the ม.5 chapter needed it, and
 * calculus needs it more: the derivative of a sine is a cosine, so a converter
 * that cannot read one cannot check any of it.
 */
describe("function commands", () => {
  it("reads a braced, bracketed or bare argument", () => {
    expect(value("\\sin{x}", { x: 1 })).toBeCloseTo(Math.sin(1));
    expect(value("\\sin(x)", { x: 1 })).toBeCloseTo(Math.sin(1));
    expect(value("\\sin x", { x: 1 })).toBeCloseTo(Math.sin(1));
    expect(value("\\sin\\left(x\\right)", { x: 1 })).toBeCloseTo(Math.sin(1));
  });

  it("binds to the term beside it, not to the whole expression", () => {
    // sin(2x) + 1, not sin(2x + 1).
    expect(value("\\sin 2x + 1", { x: 0.5 })).toBeCloseTo(Math.sin(1) + 1);
    expect(value("\\cos x + 1", { x: 0 })).toBeCloseTo(2);
  });

  /**
   * The brackets are the only difference between these two, and the maths
   * field writes the first one whenever an answer is built from `\sin`.
   */
  it("reads a power after a bracketed argument as the square of the value", () => {
    expect(value("\\sin(x)^2", { x: 2 })).toBeCloseTo(Math.sin(2) ** 2);
    expect(value("\\sin x^2", { x: 2 })).toBeCloseTo(Math.sin(4));
    expect(value("\\sin\\left(x\\right)^2", { x: 2 })).toBeCloseTo(
      Math.sin(2) ** 2,
    );
  });

  it("puts a power on the value, not on the angle", () => {
    // `\sin^2 x` is (sin x)^2; `\sin x^2` is sin(x^2). They are different.
    expect(value("\\sin^2 x", { x: 1 })).toBeCloseTo(Math.sin(1) ** 2);
    expect(value("\\sin x^2", { x: 2 })).toBeCloseTo(Math.sin(4));
    expect(value("\\cos^{2}x + \\sin^{2}x", { x: 0.7 })).toBeCloseTo(1);
  });

  it("knows pi, and the values at the special angles", () => {
    expect(value("\\sin\\frac{\\pi}{6}")).toBeCloseTo(0.5);
    expect(value("\\cos\\frac{\\pi}{3}")).toBeCloseTo(0.5);
    expect(value("\\tan\\frac{\\pi}{4}")).toBeCloseTo(1);
    expect(value("\\sin\\frac{5\\pi}{6}")).toBeCloseTo(0.5);
  });

  it("multiplies two of them together", () => {
    expect(value("\\sin x \\cos x", { x: 0.6 })).toBeCloseTo(
      Math.sin(0.6) * Math.cos(0.6),
    );
    expect(value("2\\sin x", { x: 0.3 })).toBeCloseTo(2 * Math.sin(0.3));
  });

  /**
   * The compound angle formula is written with no space at all between the
   * two factors. Reading `\sin A\cos B` as the sine of a product would have
   * made every line of that derivation quietly wrong.
   */
  it("multiplies them with no space between", () => {
    expect(value("\\sin x\\cos x", { x: 0.6 })).toBeCloseTo(
      Math.sin(0.6) * Math.cos(0.6),
    );
    expect(value("\\sin\\frac{\\pi}{4}\\cos\\frac{\\pi}{6}")).toBeCloseTo(
      Math.sin(Math.PI / 4) * Math.cos(Math.PI / 6),
    );
    expect(
      value("\\sin\\frac{\\pi}{4}\\cos\\frac{\\pi}{6} + \\cos\\frac{\\pi}{4}\\sin\\frac{\\pi}{6}"),
    ).toBeCloseTo(Math.sin(Math.PI / 4 + Math.PI / 6));
  });

  it("multiplies a bracket against what follows it", () => {
    expect(value("(x + 1)y", { x: 2, y: 5 })).toBeCloseTo(15);
  });

  /**
   * `x\ln x` is x times a logarithm. Run together it becomes a symbol called
   * `xlog`, which is not a thing.
   */
  it("multiplies what comes before a function against it", () => {
    expect(value("x\\ln x", { x: 2 })).toBeCloseTo(2 * Math.log(2));
    expect(value("x^2\\sin x", { x: 1.3 })).toBeCloseTo(1.69 * Math.sin(1.3));
    expect(value("2\\cos x", { x: 0.5 })).toBeCloseTo(2 * Math.cos(0.5));
  });

  it("reads the reciprocal and inverse functions", () => {
    expect(value("\\sec x", { x: 0.4 })).toBeCloseTo(1 / Math.cos(0.4));
    expect(value("\\arctan 1")).toBeCloseTo(Math.PI / 4);
  });

  it("reads a bare log as base ten and ln as natural", () => {
    expect(value("\\log 1000")).toBeCloseTo(3);
    expect(value("\\ln e", { e: Math.E })).toBeCloseTo(1);
  });

  /**
   * mathjs works in radians. `\sin 30^\circ` is a half and `sin(30)` is
   * -0.988, so reading a degree stem would not be a small inaccuracy - it
   * would be a different question. It still refuses, on purpose.
   */
  it("still refuses degrees", () => {
    expect(() => katexToMath("\\sin 30^\\circ")).toThrow(KatexConversionError);
  });

  it("still refuses a log written with a base", () => {
    expect(() => katexToMath("\\log_{2} 8")).toThrow(KatexConversionError);
  });

  it("refuses a function with nothing to apply to", () => {
    expect(() => katexToMath("\\sin")).toThrow(KatexConversionError);
    expect(() => katexToMath("\\sin + 1")).toThrow(KatexConversionError);
  });
});

/**
 * What Calculus II needs and the parser could not read.
 *
 * `\ln|x - p|` is the antiderivative of `1/(x - p)` as every textbook states
 * it, so partial fractions cannot be written honestly without bars; and
 * `x\sqrt{a^2 - x^2}` is half of the trigonometric-substitution answer.
 */
describe("absolute values and radicals as factors", () => {
  const value = (tex: string, x: number) =>
    Number(evaluate(katexToMath(tex), { x }));

  it("reads bars as an absolute value", () => {
    expect(katexToMath("|x-3|")).toBe("abs(x-3)");
    expect(value("|x-3|", 1)).toBe(2);
    // `\left|` and `\right|` are stripped before this sees them.
    expect(katexToMath("\\left|x-3\\right|")).toBe("abs(x-3)");
  });

  it("multiplies into a bar rather than running into it", () => {
    expect(value("2|x-3|", 1)).toBe(4);
  });

  /**
   * The bug this was written for: `\ln|x-3|` came out as `log(a)*bs*(x-3)`.
   * `takeAtom` runs on already-converted text, so it met `abs(x-3)`, stopped
   * at the first letter, and left the rest as a stray factor.
   */
  it("takes a whole function call as a function's argument", () => {
    expect(katexToMath("\\ln|x-3|")).toBe("log(abs(x-3))");
    expect(katexToMath("\\ln\\sqrt{x}")).toBe("log(sqrt(x))");
    expect(value("3\\ln|x-2| - \\ln|x+1|", 5)).toBeCloseTo(
      3 * Math.log(3) - Math.log(6),
      12,
    );
  });

  /**
   * The same trap as `x\ln x` in round eight: this branch writes a *name*
   * before its bracket, so without an explicit star it lands as the symbol
   * `xsqrt` and a correct answer comes back unreadable.
   */
  it("multiplies a variable into a radical", () => {
    expect(katexToMath("x\\sqrt{25-x^2}")).toBe("x*sqrt(25-x^2)");
    expect(value("x\\sqrt{25-x^2}", 4)).toBe(12);
  });

  /** The two rules it must not have broken while learning the new one. */
  it("still reads a following call as a new factor, and a bracket as an argument", () => {
    expect(katexToMath("\\sin x\\cos x")).toBe("sin(x)*cos(x)");
    expect(value("\\sin(x)^2", 1)).toBeCloseTo(Math.sin(1) ** 2, 12);
  });

  it("refuses a bar that never closes", () => {
    expect(() => katexToMath("|x-3")).toThrow(KatexConversionError);
  });
});
