import type { Skill, SkillId, Topic, TopicId } from "../types";
import {
  exponentsRadicalsSkills,
  exponentsRadicalsTopic,
} from "./exponents-radicals";
import {
  polyFactorDegree2Skills,
  polyFactorDegree2Topic,
} from "./poly-factor-degree-2";
import {
  eqLinearOneVarSkills,
  eqLinearOneVarTopic,
} from "./eq-linear-one-var";
import {
  funcQuadraticGraphSkills,
  funcQuadraticGraphTopic,
} from "./func-quadratic-graph";
import { funcExpLogSkills, funcExpLogTopic } from "./func-exp-log";
import { trigRatiosSkills, trigRatiosTopic } from "./trig-ratios";
import {
  trigFunctionsSkills,
  trigFunctionsTopic,
} from "./trig-functions";
import { seqBasicSkills, seqBasicTopic } from "./seq-basic";
import { calcIntroSkills, calcIntroTopic } from "./calc-intro";
import { c1LimitsSkills, c1LimitsTopic } from "./c1-limits";
import {
  c1DerivativeSkills,
  c1DerivativeTopic,
} from "./c1-derivative";
import { c1ChainSkills, c1ChainTopic } from "./c1-chain";
import {
  c1ApplicationsSkills,
  c1ApplicationsTopic,
} from "./c1-applications";
import { c1MvtSkills, c1MvtTopic } from "./c1-mvt";
import {
  c1IntegralIntroSkills,
  c1IntegralIntroTopic,
} from "./c1-integral-intro";
import { c1FtcSkills, c1FtcTopic } from "./c1-ftc";
import { funcRelationsSkills, funcRelationsTopic } from "./func-relations";
import {
  ineqLinearOneVarSkills,
  ineqLinearOneVarTopic,
} from "./ineq-linear-one-var";
import {
  polyFactorHigherSkills,
  polyFactorHigherTopic,
} from "./poly-factor-higher";
import {
  quadraticEquationsSkills,
  quadraticEquationsTopic,
} from "./quadratic-equations";

/**
 * v1 shipped two topics, done properly (PROMPT.md §0). Everything after them
 * follows the build order in docs/CURRICULUM.md, which is prerequisite order
 * rather than school order.
 *
 * Listed in the order a learner meets them: ม.2 exponents, then the ม.2
 * factoring chapter, then the ม.3 quadratic one.
 */
export const topics: Topic[] = [
  eqLinearOneVarTopic,
  exponentsRadicalsTopic,
  polyFactorDegree2Topic,
  quadraticEquationsTopic,
  polyFactorHigherTopic,
  ineqLinearOneVarTopic,
  funcQuadraticGraphTopic,
  funcRelationsTopic,
  funcExpLogTopic,
  trigRatiosTopic,
  trigFunctionsTopic,
  seqBasicTopic,
  calcIntroTopic,
  c1LimitsTopic,
  c1DerivativeTopic,
  c1ChainTopic,
  c1ApplicationsTopic,
  c1MvtTopic,
  c1IntegralIntroTopic,
  c1FtcTopic,
];

export const skills: Skill[] = [
  ...eqLinearOneVarSkills,
  ...exponentsRadicalsSkills,
  ...polyFactorDegree2Skills,
  ...quadraticEquationsSkills,
  ...polyFactorHigherSkills,
  ...ineqLinearOneVarSkills,
  ...funcQuadraticGraphSkills,
  ...funcRelationsSkills,
  ...funcExpLogSkills,
  ...trigRatiosSkills,
  ...trigFunctionsSkills,
  ...seqBasicSkills,
  ...calcIntroSkills,
  ...c1LimitsSkills,
  ...c1DerivativeSkills,
  ...c1ChainSkills,
  ...c1ApplicationsSkills,
  ...c1MvtSkills,
  ...c1IntegralIntroSkills,
  ...c1FtcSkills,
];

const topicsById = new Map(topics.map((topic) => [topic.id, topic]));
const skillsById = new Map(skills.map((skill) => [skill.id, skill]));

export function getTopic(id: TopicId): Topic {
  const topic = topicsById.get(id);
  if (!topic) throw new Error(`Unknown topic id: ${id}`);
  return topic;
}

export function getSkill(id: SkillId): Skill {
  const skill = skillsById.get(id);
  if (!skill) throw new Error(`Unknown skill id: ${id}`);
  return skill;
}

export function hasSkill(id: SkillId): boolean {
  return skillsById.has(id);
}

export function skillsOfTopic(topicId: TopicId): Skill[] {
  return getTopic(topicId).skillIds.map(getSkill);
}
