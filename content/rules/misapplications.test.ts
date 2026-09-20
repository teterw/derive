import { describe, expect, it } from "vitest";
import { checkAnswer } from "@/lib/math/check";
import { areEquivalent } from "@/lib/math/equivalence";
import { allRules } from "./index";
import { generateQuestion, generators } from "../generators";

/**
 * The gate for `Rule.misapplications` (docs/NEXT.md §P1, part 2).
 *
 * A mis-application is a claim about what a learner did wrong, and it will one
 * day be shown to them as one. Two ways that goes badly, both of which this
 * file makes impossible:
 *
 *   - **the transform stops transforming.** A rule is edited, the shape it
 *     matches changes, `apply` starts returning `null`, and the diagnosis
 *     silently stops working. Nothing else would notice: no diagnosis looks
 *     exactly like no mistake.
 *   - **the "mistake" is secretly correct.** `x^2 - 4` factors as
 *     `(x-2)(x+2)`, and a sign-flip mistake on it gives the same answer back.
 *     Telling a learner who got it right that they made a mistake is the worst
 *     thing this feature can do, so the wrong answer is *checked* wrong rather
 *     than assumed wrong - the same rule `content/misconception.ts` follows.
 *
 * Driven from the registry, like the §9 gate, so a rule authored with
 * mis-applications is covered by existing rather than by remembering.
 */
const declared = allRules.flatMap((rule) =>
  (rule.misapplications ?? []).map(
    (misapplication) => [rule.id, misapplication] as const,
  ),
);

describe("rule mis-applications", () => {
  it("are namespaced under their own rule, and unique", () => {
    const ids = declared.map(([, misapplication]) => misapplication.id);
    expect(new Set(ids).size, "duplicate mis-application id").toBe(ids.length);
    for (const [ruleId, misapplication] of declared) {
      expect(
        misapplication.id.startsWith(`${ruleId}/`),
        `${misapplication.id} does not live under ${ruleId}`,
      ).toBe(true);
    }
  });

  it.each(declared.map(([ruleId, m]) => [m.id, ruleId, m] as const))(
    "%s produces the wrong answer it says it does",
    (_id, _ruleId, misapplication) => {
      const { from, right, wrong } = misapplication.example;

      const produced = misapplication.apply(from);
      expect(produced, `apply(${from}) did not fire`).not.toBeNull();
      expect(
        areEquivalent(produced!, wrong),
        `apply(${from}) gave ${produced}, not ${wrong}`,
      ).toBe(true);

      // The example itself has to be honest about what the rule really gives.
      expect(
        checkAnswer({ kind: "exact", value: right }, from).correct,
        `the example's own "from" is not ${right}`,
      ).toBe(true);

      expect(
        checkAnswer({ kind: "exact", value: right }, wrong).correct,
        `${wrong} is actually the right answer - this would accuse a learner who got it right`,
      ).toBe(false);
    },
  );

  it.each(declared.map(([ruleId, m]) => [m.id, ruleId, m] as const))(
    "%s is bilingual",
    (_id, _ruleId, misapplication) => {
      expect(misapplication.explain.th.trim()).not.toBe("");
      expect(misapplication.explain.en.trim()).not.toBe("");
    },
  );

  /**
   * These are going to be run speculatively against every step of every
   * derivation, most of which are nothing to do with the rule that declares
   * them. "Does not apply" has to be an answer, not an exception.
   */
  it("never throw, whatever they are handed", () => {
    const junk = [
      "",
      "   ",
      "x",
      "0",
      "not maths at all",
      "((((",
      "\\frac{1}{2}",
      "x = 2 หรือ x = 3",
      "sqrt(-1)",
    ];

    const steps = generators.flatMap((generator) =>
      generator.difficulties.flatMap((difficulty) =>
        generateQuestion(generator.id, 3, difficulty)
          .steps.map((step) => step.math)
          .filter((math): math is string => Boolean(math)),
      ),
    );

    for (const [, misapplication] of declared) {
      for (const input of [...junk, ...steps]) {
        expect(
          () => misapplication.apply(input),
          `${misapplication.id} threw on ${input}`,
        ).not.toThrow();
      }
    }
  });
});
