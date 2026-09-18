import type { Rule, RuleId, TopicId } from "../types";
import { algebraRules } from "./algebra";
import { exponentRules } from "./exponents";
import { quadraticRules } from "./quadratic";
import { radicalRules } from "./radicals";

/**
 * The rule registry (PROMPT.md §5) - the backbone of the product.
 *
 * Steps, hints, the formula sheet and the "what rule is this" chips all read
 * from here, so an explanation and the formula the learner revises can never
 * drift apart.
 */
const ALL: Rule[] = [
  ...exponentRules,
  ...radicalRules,
  ...quadraticRules,
  ...algebraRules,
];

function buildRegistry(rules: Rule[]): Record<RuleId, Rule> {
  const registry: Record<RuleId, Rule> = {};
  for (const rule of rules) {
    if (registry[rule.id]) {
      throw new Error(`Duplicate rule id: ${rule.id}`);
    }
    registry[rule.id] = rule;
  }
  return registry;
}

export const rules = buildRegistry(ALL);

export const ruleIds: RuleId[] = Object.keys(rules);

export function getRule(id: RuleId): Rule {
  const rule = rules[id];
  if (!rule) throw new Error(`Unknown rule id: ${id}`);
  return rule;
}

export function hasRule(id: RuleId): boolean {
  return Object.hasOwn(rules, id);
}

export function rulesForTopic(topicId: TopicId): Rule[] {
  return ALL.filter((rule) => rule.topicIds.includes(topicId));
}

export function searchRules(query: string): Rule[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return ALL;
  return ALL.filter((rule) =>
    [
      rule.id,
      rule.name.th,
      rule.name.en,
      rule.plain.th,
      rule.plain.en,
      rule.statement,
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}

export { ALL as allRules };
