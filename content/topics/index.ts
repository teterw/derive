import type { Skill, SkillId, Topic, TopicId } from "../types";
import {
  exponentsRadicalsSkills,
  exponentsRadicalsTopic,
} from "./exponents-radicals";
import {
  quadraticEquationsSkills,
  quadraticEquationsTopic,
} from "./quadratic-equations";

/**
 * v1 ships two topics, done properly (PROMPT.md §0). The rest of the map is in
 * docs/CURRICULUM.md, in prerequisite order.
 */
export const topics: Topic[] = [
  exponentsRadicalsTopic,
  quadraticEquationsTopic,
];

export const skills: Skill[] = [
  ...exponentsRadicalsSkills,
  ...quadraticEquationsSkills,
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
