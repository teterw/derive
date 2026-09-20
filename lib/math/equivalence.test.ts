import { describe, expect, it } from "vitest";
import { areEquivalent, evaluateConstant, symbolsOf } from "./equivalence";

describe("symbolsOf", () => {
  it("finds variables and ignores functions and constants", () => {
    expect(symbolsOf("sqrt(x) + 2y")).toEqual(["x", "y"]);
    expect(symbolsOf("e^x * pi")).toEqual(["x"]);
    expect(symbolsOf("3 + 4")).toEqual([]);
  });
});

describe("areEquivalent", () => {
  it("accepts the same value written differently", () => {
    expect(areEquivalent("1/2", "0.5")).toBe(true);
    expect(areEquivalent("1/2", "2^(-1)")).toBe(true);
    expect(areEquivalent("sqrt(8)", "2*sqrt(2)")).toBe(true);
    expect(areEquivalent("1/sqrt(2)", "sqrt(2)/2")).toBe(true);
  });

  it("accepts algebraic identities", () => {
    expect(areEquivalent("(x+1)*(x-1)", "x^2 - 1")).toBe(true);
    expect(areEquivalent("(x-2)*(x-3)", "x^2 - 5x + 6")).toBe(true);
    expect(areEquivalent("x^2*x^3", "x^5")).toBe(true);
    expect(areEquivalent("(x+y)^2", "x^2 + 2*x*y + y^2")).toBe(true);
  });

  it("rejects near misses", () => {
    expect(areEquivalent("x^2 - 5x + 6", "x^2 - 5x - 6")).toBe(false);
    expect(areEquivalent("2*sqrt(2)", "sqrt(2)")).toBe(false);
    expect(areEquivalent("1/2", "1/3")).toBe(false);
    expect(areEquivalent("(x+y)^2", "x^2 + y^2")).toBe(false);
  });

  it("does not confuse different variables", () => {
    expect(areEquivalent("x*y", "x^2")).toBe(false);
    expect(areEquivalent("x + y", "2x")).toBe(false);
  });

  it("refuses to call unparseable input equivalent", () => {
    expect(() => areEquivalent("x +", "x")).toThrow();
  });
});

describe("evaluateConstant", () => {
  it("evaluates closed-form numbers", () => {
    expect(evaluateConstant("2*sqrt(2)")).toBeCloseTo(2.8284271);
    expect(evaluateConstant("3/4")).toBeCloseTo(0.75);
  });

  it("returns null for expressions with variables", () => {
    expect(evaluateConstant("x + 1")).toBeNull();
  });

  it("returns null for complex results", () => {
    expect(evaluateConstant("sqrt(-4)")).toBeNull();
  });
});

/**
 * Trigonometric expressions, which the ม.5 chapter leans on entirely.
 *
 * Sampling is a better test of an identity than it is of anything else in this
 * file: an identity is *defined* as "true at every angle", so twelve awkward
 * angles agreeing is close to the statement itself. What needs pinning is that
 * `sin` is not mistaken for a variable, that a pole is skipped rather than
 * counted as disagreement, and that a near-miss is still caught.
 */
describe("areEquivalent, on trigonometry", () => {
  it("does not treat a function name or pi as a variable", () => {
    expect(symbolsOf("sin(x) + pi")).toEqual(["x"]);
  });

  it("recognises the identities", () => {
    expect(areEquivalent("sin(x)^2 + cos(x)^2", "1")).toBe(true);
    expect(areEquivalent("1 - cos(x)^2", "sin(x)^2")).toBe(true);
    expect(areEquivalent("sin(x)/cos(x)", "tan(x)")).toBe(true);
    expect(areEquivalent("1 + tan(x)^2", "sec(x)^2")).toBe(true);
    expect(areEquivalent("sin(x + pi/2)", "cos(x)")).toBe(true);
    expect(areEquivalent("2 sin(x) cos(x)", "sin(2x)")).toBe(true);
  });

  it("still says no to something that merely looks similar", () => {
    expect(areEquivalent("sin(x)/cos(x)", "cot(x)")).toBe(false);
    expect(areEquivalent("sin(2x)", "2 sin(x)")).toBe(false);
    expect(areEquivalent("cos(x)^2 - sin(x)^2", "1")).toBe(false);
  });

  it("evaluates an exact angle", () => {
    expect(areEquivalent("sin(pi/6)", "1/2")).toBe(true);
    expect(areEquivalent("cos(5pi/6)", "-sqrt(3)/2")).toBe(true);
    expect(areEquivalent("sin(pi/6)", "-1/2")).toBe(false);
  });
});
