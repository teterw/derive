import type { Rule, RuleId, TopicId } from "../types";
import { algebraRules } from "./algebra";
import { equationRules } from "./equations";
import { exponentRules } from "./exponents";
import { functionRules } from "./functions";
import { inequalityRules } from "./inequalities";
import { polynomialRules } from "./polynomials";
import { polynomialHigherRules } from "./polynomials-higher";
import { logarithmRules } from "./logarithms";
import { quadraticRules } from "./quadratic";
import { relationRules } from "./relations";
import { radicalRules } from "./radicals";
import { trigonometryRules } from "./trigonometry";
import { trigFunctionRules } from "./trig-functions";
import { sequenceRules } from "./sequences";
import { calculusRules } from "./calculus";
import { calculusLimitRules } from "./calculus-limits";
import { calculusDerivativeRules } from "./calculus-derivatives";
import { calculusChainRules } from "./calculus-chain";
import { calculusApplicationRules } from "./calculus-applications";
import { calculusMvtRules } from "./calculus-mvt";
import { calculusIntegralRules } from "./calculus-integrals";
import { calculusFtcRules } from "./calculus-ftc";

/**
 * The rule registry (PROMPT.md §5) - the backbone of the product.
 *
 * Steps, hints, the formula sheet and the "what rule is this" chips all read
 * from here, so an explanation and the formula the learner revises can never
 * drift apart.
 */
const ALL: Rule[] = [
  ...equationRules,
  ...exponentRules,
  ...inequalityRules,
  ...functionRules,
  ...relationRules,
  ...logarithmRules,
  ...trigonometryRules,
  ...trigFunctionRules,
  ...sequenceRules,
  ...calculusRules,
  ...calculusLimitRules,
  ...calculusDerivativeRules,
  ...calculusChainRules,
  ...calculusApplicationRules,
  ...calculusMvtRules,
  ...calculusIntegralRules,
  ...calculusFtcRules,
  ...radicalRules,
  ...quadraticRules,
  ...polynomialRules,
  ...polynomialHigherRules,
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

/**
 * What a client component is allowed to receive - the same idea as
 * `PublicQuestion`, for the same reason and then one more.
 *
 * `Rule.misapplications` carries an `apply` **function**, and a function cannot
 * cross the server/client boundary: React refuses to serialise it and the whole
 * page becomes an error boundary. Every question page hands the formula sheet
 * the entire registry, so the moment any rule declared a mis-application, four
 * of the app's five modes stopped rendering.
 *
 * The client has no use for them anyway. They are authoring-time data for a
 * diagnosis that will run on the server, next to the answer checker, which is
 * also where `Rule.misapplications` should stay.
 */
export type PublicRule = Omit<Rule, "misapplications">;

export function toPublicRule(rule: Rule): PublicRule {
  const { misapplications: _misapplications, ...rest } = rule;
  void _misapplications;
  return rest;
}

/** The registry as a client component may have it. */
export const publicRules: PublicRule[] = ALL.map(toPublicRule);

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
