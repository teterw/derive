import { describe, expect, it } from "vitest";
import { createRng } from "../rng";
import { getSkill } from "../topics";
import { satisfiesForm } from "@/lib/math/check";
import { expZeroNegative } from "./exp-negative-zero";
import { expScientificNotation } from "./exp-scientific";
import { radOperationsCore } from "./rad-operations";
import { radRationalizeCore } from "./rad-rationalize";
import { radSimplifySqrt } from "./rad-simplify";
import { verifyDeterminism, verifyGenerator, verifyVariety } from "./property";

const generators = [
  expZeroNegative,
  expScientificNotation,
  radSimplifySqrt,
  radOperationsCore,
  radRationalizeCore,
];

describe.each(generators.map((g) => [g.id, g] as const))("%s", (_id, generator) => {
  it("passes the §9 property gate", () => {
    verifyGenerator(generator);
  });

  it("is reproducible from its seed", () => {
    verifyDeterminism(generator);
  });

  it("does not keep asking the same question", () => {
    verifyVariety(generator, 15);
  });

  it("gives an answer that is already in the form the skill demands", () => {
    const requirement = getSkill(generator.skillId).strictForm;
    if (!requirement) return;
    for (const difficulty of generator.difficulties) {
      for (let seed = 1; seed <= 40; seed++) {
        const question = generator.generate(createRng(seed), difficulty);
        if (question.answer.kind !== "exact") continue;
        expect(
          satisfiesForm(question.answer.value, requirement),
          `${generator.id} seed=${seed} d=${difficulty}: ${question.answer.value} is not ${requirement}`,
        ).toBe(true);
      }
    }
  });
});
