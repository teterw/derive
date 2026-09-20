import { describe, expect, it } from "vitest";
import { allRules } from "./index";
import { RULE_FAMILIES, familyOf, groupByFamily } from "./families";

/**
 * The formula sheet reads its groups off the rule ids. That works because the
 * ids were named that way from the start, which is a convention rather than a
 * guarantee - so this is the guarantee.
 *
 * A rule that lands in no family would simply vanish from `/rules`: the page
 * renders the groups, and a rule in none of them is in none of the lists. It
 * would still exist, still be linked from every step chip that uses it, and
 * never appear on the page meant to show all of them.
 */
describe("rule families", () => {
  it("has a home for every rule", () => {
    const homeless = allRules
      .filter((rule) => familyOf(rule.id) === null)
      .map((rule) => rule.id);

    expect(
      homeless,
      `\n  ${homeless.length} rule(s) belong to no family. Add the prefix to RULE_FAMILIES:\n    ${homeless.join("\n    ")}\n`,
    ).toEqual([]);
  });

  it("shows every rule exactly once", () => {
    const grouped = groupByFamily(allRules).flatMap((group) => group.rules);

    expect(grouped).toHaveLength(allRules.length);
    expect(new Set(grouped.map((rule) => rule.id)).size).toBe(allRules.length);
  });

  it("has no family that nothing belongs to", () => {
    const empty = RULE_FAMILIES.filter(
      (family) => !allRules.some((rule) => familyOf(rule.id) === family.prefix),
    ).map((family) => family.prefix);

    expect(empty, "a family with no rules is a heading with nothing under it").toEqual(
      [],
    );
  });

  it("names every family in both languages", () => {
    for (const family of RULE_FAMILIES) {
      for (const field of [family.name, family.blurb]) {
        expect(field.th.trim(), family.prefix).not.toBe("");
        expect(field.en.trim(), family.prefix).not.toBe("");
      }
    }
  });
});
