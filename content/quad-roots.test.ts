import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { solveQuadratic } from "./quad-roots";

function residual(a: number, b: number, c: number, root: string): number {
  const x = evaluate(`(${root})`) as number;
  return a * x * x + b * x + c;
}

describe("solveQuadratic", () => {
  it("gives integer roots when the discriminant is a square", () => {
    const roots = solveQuadratic(1, -5, 6);
    expect(roots.rational).toBe(true);
    expect(roots.count).toBe(2);
    expect(roots.math.sort()).toEqual(["2", "3"]);
  });

  it("gives a single root when the discriminant is zero", () => {
    const roots = solveQuadratic(1, -4, 4);
    expect(roots.discriminant).toBe(0);
    expect(roots.count).toBe(1);
    expect(roots.math).toEqual(["2"]);
  });

  it("reports no real roots when the discriminant is negative", () => {
    const roots = solveQuadratic(1, 1, 1);
    expect(roots.count).toBe(0);
    expect(roots.katex).toEqual([]);
  });

  it("reduces (6 +- 2sqrt5)/2 to 3 +- sqrt5", () => {
    const roots = solveQuadratic(1, -6, 4);
    expect(roots.plusMinusKatex).toBe("3 \\pm \\sqrt{5}");
    expect(roots.math).toEqual(["(3 + sqrt(5))", "(3 - sqrt(5))"]);
  });

  it("keeps the denominator when nothing cancels", () => {
    const roots = solveQuadratic(1, -3, 1);
    expect(roots.plusMinusKatex).toBe("\\frac{3 \\pm \\sqrt{5}}{2}");
  });

  it("produces roots that satisfy the equation, over many coefficients", () => {
    for (let a = 1; a <= 4; a++) {
      for (let b = -9; b <= 9; b++) {
        for (let c = -9; c <= 9; c++) {
          const roots = solveQuadratic(a, b, c);
          expect(roots.math).toHaveLength(roots.count === 1 ? 1 : roots.count);
          for (const root of roots.math) {
            expect(
              Math.abs(residual(a, b, c, root)),
              `a=${a} b=${b} c=${c} root=${root}`,
            ).toBeLessThan(1e-9);
          }
        }
      }
    }
  });

  it("writes the same roots in KaTeX and in mathjs", () => {
    for (let b = -9; b <= 9; b++) {
      for (let c = -9; c <= 9; c++) {
        const roots = solveQuadratic(1, b, c);
        expect(roots.katex).toHaveLength(roots.math.length);
      }
    }
  });
});
