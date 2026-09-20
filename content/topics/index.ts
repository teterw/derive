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

/**
 * The three stages the chapter list is navigated by.
 *
 * Twenty chapters in curriculum order is the right order and the wrong length:
 * a university learner opening `/learn` for Calculus I met eight screens of
 * ม.1-ม.6 first. Collapsing the chapters cut that to two and a half; these cut
 * it to none, because each one is an anchor to where its stage begins.
 *
 * Derived from `grade.en` rather than stored on the topic, so there is one
 * fact about each chapter's level and not two that can disagree. English
 * because those strings are a fixed vocabulary - "Grade 9, basic", "Calculus
 * I" - while the Thai carries ม./พื้นฐาน/เพิ่มเติม distinctions that are
 * about the *track*, which is a different question. `topics.test.ts` checks
 * every chapter lands somewhere, so a new one with an unfamiliar grade fails
 * the suite rather than quietly filing itself under university.
 */
export const STAGES = ["lower", "upper", "university"] as const;
export type Stage = (typeof STAGES)[number];

export function stageOf(topic: Topic): Stage {
  const grade = topic.grade.en;
  if (/^Grade [789],/.test(grade)) return "lower";
  if (/^Grade 1[012],/.test(grade) || grade.startsWith("Upper secondary")) {
    return "upper";
  }
  return "university";
}

/** The first chapter of each stage - what the jump links point at. */
export function stageAnchors(): { stage: Stage; topicId: TopicId }[] {
  return STAGES.flatMap((stage) => {
    const first = topics.find((topic) => stageOf(topic) === stage);
    return first ? [{ stage, topicId: first.id }] : [];
  });
}
