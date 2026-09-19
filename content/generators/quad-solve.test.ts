import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { createRng } from "../rng";
import { deriveMath } from "../step";
import {
  quadSolveCommonFactor,
  quadSolveFactorLeading,
  quadSolveFactorSimple,
} from "./quad-solve";

const generators = [
  quadSolveFactorSimple,
  quadSolveFactorLeading,
  quadSolveCommonFactor,
];

describe.each(generators.map((g) => [g.id, g] as const))("%s", (_id, generator) => {
  it("every root really satisfies the equation", () => {
    for (const difficulty of generator.difficulties) {
      for (let seed = 1; seed <= 50; seed++) {
        const question = generator.generate(createRng(seed), difficulty);
        if (question.answer.kind !== "set") throw new Error("expected a set");
        const zeroForm = deriveMath(question.stem)!;
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

describe("quad.solve-common-factor", () => {
  it("always keeps the root that dividing by x would lose", () => {
    for (const difficulty of [2, 4] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        const question = quadSolveCommonFactor.generate(
          createRng(seed),
          difficulty,
        );
        if (question.answer.kind !== "set") throw new Error("expected a set");
        expect(question.answer.values).toContain("0");
        expect(question.answer.values).toHaveLength(2);
      }
    }
  });
});
