import { describe, expect, it } from "vitest";
import {
  hasEmptyBox,
  isBlankAnswer,
  normalizeMathfieldLatex,
} from "./mathfield-latex";

/**
 * MathLive draws `\placeholder{}` as a visible empty square. Pressing the `x²`
 * key without a base leaves `\placeholder{}^2` - a box where the base should
 * be - and submitting that used to cost the learner the question: the
 * placeholder is stripped before marking, `^2` is left, that does not parse,
 * and an unparseable answer is a wrong answer. A real attempt in the database
 * was marked that way.
 */
describe("isBlankAnswer", () => {
  it("treats an empty field as blank", () => {
    expect(isBlankAnswer("")).toBe(true);
    expect(isBlankAnswer("   ")).toBe(true);
  });

  it("treats a field with an unfilled box as blank", () => {
    expect(isBlankAnswer("\\placeholder{}")).toBe(true);
    expect(isBlankAnswer("\\placeholder{}^2")).toBe(true);
    expect(isBlankAnswer("\\sqrt{\\placeholder{}}")).toBe(true);
    expect(isBlankAnswer("x+\\placeholder{}")).toBe(true);
  });

  it("does not treat a real answer as blank", () => {
    for (const answer of ["5\\sqrt5", "x^{12}", "0", "-1", "\\frac12", "2, 3"]) {
      expect(isBlankAnswer(answer), answer).toBe(false);
    }
  });

  it("does not mistake a filled box for an empty one", () => {
    // Once the base is typed the placeholder is gone; nothing else looks like it.
    expect(hasEmptyBox("x^2")).toBe(false);
    expect(hasEmptyBox("\\sqrt{5}")).toBe(false);
  });
});

/**
 * The cases in the first block are transcripts: each `from` is what MathLive
 * 0.110.0 actually returned from `mf.value` after the characters were typed
 * into a live field, recorded in the browser rather than guessed at.
 */

describe("normalizeMathfieldLatex", () => {
  it("braces a multi-digit exponent, which is the bug", () => {
    expect(normalizeMathfieldLatex("x^12")).toBe("x^{12}");
    expect(normalizeMathfieldLatex("x^123")).toBe("x^{123}");
    expect(normalizeMathfieldLatex("2x^10+1")).toBe("2x^{10}+1");
  });

  it("stops the exponent at the end of the digits", () => {
    // Not `x^{12+3}` - the run of digits is the exponent, the rest is not.
    expect(normalizeMathfieldLatex("x^12+3")).toBe("x^{12}+3");
    expect(normalizeMathfieldLatex("x^12y^3")).toBe("x^{12}y^{3}");
  });

  it("leaves what MathLive already got right alone", () => {
    expect(normalizeMathfieldLatex("a_{12}")).toBe("a_{12}");
    expect(normalizeMathfieldLatex("x^{12}")).toBe("x^{12}");
    expect(normalizeMathfieldLatex("\\frac{1}{2}")).toBe("\\frac{1}{2}");
    expect(normalizeMathfieldLatex("\\sqrt{5}")).toBe("\\sqrt{5}");
    expect(normalizeMathfieldLatex("(x+3)(x-4)")).toBe("(x+3)(x-4)");
  });

  it("handles the other things an argument can be", () => {
    expect(normalizeMathfieldLatex("x^n")).toBe("x^{n}");
    expect(normalizeMathfieldLatex("x^-2")).toBe("x^{-2}");
    expect(normalizeMathfieldLatex("x^\\alpha")).toBe("x^{\\alpha}");
    expect(normalizeMathfieldLatex("a_1")).toBe("a_{1}");
  });

  it("normalises inside a braced group too", () => {
    expect(normalizeMathfieldLatex("\\frac{x^12}{2}")).toBe(
      "\\frac{x^{12}}{2}",
    );
    expect(normalizeMathfieldLatex("\\sqrt{x^10}")).toBe("\\sqrt{x^{10}}");
  });

  /**
   * The repaired value is written back into the field, so it arrives here again
   * on the next keystroke. If this were not idempotent the exponent would gain
   * a layer of braces per character typed.
   */
  it("is idempotent", () => {
    for (const input of [
      "x^12",
      "x^{12}",
      "x^12+3",
      "\\frac{x^12}{2}",
      "x^-2",
      "a_1",
    ]) {
      const once = normalizeMathfieldLatex(input);
      expect(normalizeMathfieldLatex(once), input).toBe(once);
    }
  });

  it("survives a half-typed expression without throwing", () => {
    // Every prefix of a real edit - `^` with nothing after it is a real state.
    for (const input of [
      "",
      "x",
      "x^",
      "x^{",
      "x^{}",
      "x^1",
      "x^12",
      "\\fra",
      "\\frac{",
    ]) {
      expect(() => normalizeMathfieldLatex(input), input).not.toThrow();
    }
    expect(normalizeMathfieldLatex("x^")).toBe("x^");
    expect(normalizeMathfieldLatex("x^{}")).toBe("x^{}");
  });

  /**
   * The documented cost. `x^1` then leaving the exponent then `2` produces the
   * same `x^12` from MathLive as typing the exponent straight through, so this
   * case is resolved towards the exponent deliberately. Pinned so that the
   * trade-off stays a decision rather than becoming a surprise.
   */
  it("resolves the ambiguity towards the exponent", () => {
    expect(normalizeMathfieldLatex("x^12")).toBe("x^{12}");
  });
});
