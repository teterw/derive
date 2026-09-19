import { describe, expect, it } from "vitest";
import { createRng } from "../rng";
import { expLawsCore } from "./exp-integer-laws";

describe(expLawsCore.id, () => {
  it("names the rule that actually applies", () => {
    const stems = new Map<string, string[]>();
    for (let seed = 1; seed <= 60; seed++) {
      const question = expLawsCore.generate(createRng(seed), 1);
      stems.set(question.stem, question.rulesUsed);
    }
    for (const [stem, rules] of stems) {
      if (stem.includes("\\frac")) expect(rules).toContain("exp.quotient");
      else if (stem.includes("\\cdot")) expect(rules).toContain("exp.product");
    }
  });
});
