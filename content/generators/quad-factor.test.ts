import { describe, expect, it } from "vitest";
import { createRng } from "../rng";
import { satisfiesForm } from "@/lib/math/check";
import { areEquivalent } from "@/lib/math/equivalence";
import { deriveMath } from "../step";
import {
  quadDiffSquares,
  quadFactorCommon,
  quadFactorTrinomial,
} from "./quad-factor";

const generators = [quadFactorCommon, quadFactorTrinomial, quadDiffSquares];

describe.each(generators.map((g) => [g.id, g] as const))("%s", (_id, generator) => {
  it("answers in factored form, and the factors multiply back to the stem", () => {
    for (const difficulty of generator.difficulties) {
      for (let seed = 1; seed <= 40; seed++) {
        const question = generator.generate(createRng(seed), difficulty);
        const answer = question.answer;
        if (answer.kind !== "exact") throw new Error("expected an exact answer");
        const where = `${generator.id} seed=${seed} d=${difficulty}`;

        expect(satisfiesForm(answer.value, "factored"), `${where}: ${answer.value}`).toBe(
          true,
        );
        expect(
          areEquivalent(deriveMath(question.stem)!, answer.value),
          `${where}: ${question.stem} != ${answer.value}`,
        ).toBe(true);
      }
    }
  });
});
