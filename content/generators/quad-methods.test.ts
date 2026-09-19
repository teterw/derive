import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { createRng } from "../rng";
import { deriveMath } from "../step";
import { quadCompletingSquare } from "./quad-complete-square";
import { quadDiscriminantCount } from "./quad-discriminant";
import { quadFormulaCore } from "./quad-formula";

/*
 * The §9 gate, determinism and variety are no longer here. They are driven by
 * the registry in `registry.test.ts`, so a generator cannot be registered
 * without being checked by them. What stays in this file is the part that
 * knows what *these particular* skills' answers should look like.
 */

describe.each([
  ["quad.completing-square", quadCompletingSquare],
  ["quad.formula-core", quadFormulaCore],
] as const)("%s roots", (_id, generator) => {
  it("gives roots that satisfy the equation", () => {
    for (const difficulty of generator.difficulties) {
      for (let seed = 1; seed <= 50; seed++) {
        const question = generator.generate(createRng(seed), difficulty);
        if (question.answer.kind !== "set") throw new Error("expected a set");
        const zeroForm = deriveMath(question.stem)!;
        expect(question.answer.values.length).toBeGreaterThan(0);
        for (const root of question.answer.values) {
          const value = evaluate(`(${root})`) as number;
          const residual = evaluate(zeroForm, { x: value }) as number;
          expect(
            Math.abs(Number(residual)),
            `${generator.id} seed=${seed} d=${difficulty}: ${root} fails ${question.stem}`,
          ).toBeLessThan(1e-9);
        }
      }
    }
  });
});

describe("quad.discriminant-count", () => {
  it("picks the option the discriminant actually implies", () => {
    let seenTwo = 0;
    let seenOne = 0;
    let seenNone = 0;

    for (const difficulty of quadDiscriminantCount.difficulties) {
      for (let seed = 1; seed <= 60; seed++) {
        const question = quadDiscriminantCount.generate(
          createRng(seed),
          difficulty,
        );
        if (question.answer.kind !== "choice") throw new Error("expected choice");

        // Recover a, b, c from the discriminant line in the steps and check
        // the verdict independently of how the generator reached it.
        const match = /D = \\left\((-?\d+)\\right\)\^2 - 4\\left\((-?\d+)\\right\)\\left\((-?\d+)\\right\) = (-?\d+)/.exec(
          question.steps[1]!.expr,
        );
        expect(match, question.steps[1]!.expr).not.toBeNull();
        const [, b, a, c, stated] = match!;
        const discriminant = Number(b) ** 2 - 4 * Number(a) * Number(c);
        expect(discriminant).toBe(Number(stated));

        const expected =
          discriminant > 0 ? "two" : discriminant === 0 ? "one" : "none";
        expect(question.answer.correct).toBe(expected);

        if (expected === "two") seenTwo++;
        if (expected === "one") seenOne++;
        if (expected === "none") seenNone++;
      }
    }

    // All three outcomes have to come up, or the question is not a question.
    expect(seenTwo).toBeGreaterThan(0);
    expect(seenOne).toBeGreaterThan(0);
    expect(seenNone).toBeGreaterThan(0);
  });
});
