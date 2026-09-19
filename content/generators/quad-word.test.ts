import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { createRng } from "../rng";
import { quadWordConsecutive, quadWordRectangle } from "./quad-word";

const generators = [quadWordRectangle, quadWordConsecutive];

describe.each(generators.map((g) => [g.id, g] as const))("%s", (_id, generator) => {
  it("is marked adapted and records where the shape came from", () => {
    expect(generator.provenance).toBe("adapted");
    expect(generator.sourceNote?.length ?? 0).toBeGreaterThan(20);
  });

  it("asks a question in words, and the answer fits the situation", () => {
    for (const difficulty of generator.difficulties) {
      for (let seed = 1; seed <= 40; seed++) {
        const question = generator.generate(createRng(seed), difficulty);
        const where = `${generator.id} seed=${seed} d=${difficulty}`;

        // The prompt carries the problem, so it has to be a sentence.
        expect(question.prompt.th.length, where).toBeGreaterThan(20);
        expect(question.prompt.en.length, where).toBeGreaterThan(20);

        if (question.answer.kind !== "exact") throw new Error("expected exact");
        const value = Number(question.answer.value);
        expect(Number.isInteger(value), `${where}: ${question.answer.value}`).toBe(
          true,
        );
        expect(value, where).toBeGreaterThan(0);

        // The stated answer satisfies the model the problem sets up.
        const residual = evaluate(question.machineStem!, { x: value }) as number;
        expect(Math.abs(Number(residual)), where).toBeLessThan(1e-9);

        // And the derivation ends by throwing away the other root.
        expect(question.rulesUsed, where).toContain("model.reject-root");
      }
    }
  });
});
