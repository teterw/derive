import { describe, expect, it } from "vitest";
import katex from "katex";
import { allRules, getRule, hasRule, rules, searchRules } from "./index";

/**
 * The registry is load-bearing: a rule with a broken statement shows up on the
 * formula sheet, in every step chip that references it, and in the lesson.
 */
describe("rule registry", () => {
  it("has no duplicate ids", () => {
    const ids = allRules.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("covers every rule PROMPT.md §7 asks for", () => {
    const required = [
      "exp.product",
      "exp.quotient",
      "exp.power-of-power",
      "exp.power-of-product",
      "exp.zero",
      "exp.negative",
      "rad.product",
      "rad.quotient",
      "rad.perfect-square-extract",
      "rad.like-terms",
      "rad.conjugate",
      "quad.zero-product",
      "quad.common-factor",
      "quad.trinomial-pattern",
      "quad.diff-squares",
      "quad.perfect-square-trinomial",
      "quad.complete-square",
      "quad.formula",
      "quad.discriminant",
      "eq.balance",
      "eq.move-term",
    ];
    for (const id of required) {
      expect(hasRule(id), `missing rule ${id}`).toBe(true);
    }
  });

  it.each(allRules.map((rule) => [rule.id, rule] as const))(
    "%s is complete and bilingual",
    (_id, rule) => {
      expect(rule.topicIds.length).toBeGreaterThan(0);
      expect(rule.name.th.trim()).not.toBe("");
      expect(rule.name.en.trim()).not.toBe("");
      expect(rule.plain.th.trim()).not.toBe("");
      expect(rule.plain.en.trim()).not.toBe("");
      expect(rule.statement.trim()).not.toBe("");
      expect(rule.examples.length).toBeGreaterThan(0);
      if (rule.conditions) {
        expect(rule.conditions.th.trim()).not.toBe("");
        expect(rule.conditions.en.trim()).not.toBe("");
      }
    },
  );

  it.each(allRules.map((rule) => [rule.id, rule] as const))(
    "%s renders as KaTeX",
    (_id, rule) => {
      const fragments = [
        rule.statement,
        ...rule.examples.flatMap((example) => [example.from, example.to]),
      ];
      for (const fragment of fragments) {
        expect(() =>
          katex.renderToString(fragment, { throwOnError: true }),
        ).not.toThrow();
      }
    },
  );

  it("only points seeAlso at rules that exist", () => {
    for (const rule of allRules) {
      for (const id of rule.seeAlso ?? []) {
        expect(hasRule(id), `${rule.id} -> ${id}`).toBe(true);
      }
    }
  });

  it("getRule throws loudly on an unknown id", () => {
    expect(() => getRule("nope.not-a-rule")).toThrow(/Unknown rule/);
  });

  it("searches by Thai name, English name and id", () => {
    expect(searchRules("ดิสคริมิแนนต์").map((r) => r.id)).toContain(
      "quad.discriminant",
    );
    expect(searchRules("conjugate").map((r) => r.id)).toContain("rad.conjugate");
    expect(searchRules("exp.zero").map((r) => r.id)).toEqual(["exp.zero"]);
  });

  it("exposes the registry as a plain keyed object", () => {
    expect(rules["exp.product"]?.name.th).toBe("สมบัติการคูณของเลขยกกำลัง");
  });
});
