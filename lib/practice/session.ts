import { randomInt } from "node:crypto";
import {
  difficultiesForSkill,
  generatorsForSkillAt,
  getGenerator,
} from "@/content/generators";
import { getSkill, skills, topics } from "@/content/topics";
import type { Difficulty, GeneratorId, SkillId } from "@/content/types";

/** What a practice run is drilling. */
export type PracticeConfig = {
  skillIds: SkillId[];
  difficulties: Difficulty[];
};

export type QuestionRef = {
  generatorId: GeneratorId;
  seed: number;
  difficulty: Difficulty;
};

/** Seeds are 31-bit so they survive a round trip through `integer` in Postgres. */
const MAX_SEED = 2 ** 31 - 1;

export function parseQuestionId(id: string): QuestionRef | null {
  const parts = id.split(":");
  if (parts.length < 3) return null;
  const difficulty = Number(parts.pop());
  const seed = Number(parts.pop());
  const generatorId = parts.join(":");

  if (!Number.isInteger(seed) || seed < 0 || seed > MAX_SEED) return null;
  if (difficulty !== 1 && difficulty !== 2 && difficulty !== 3 && difficulty !== 4) {
    return null;
  }
  try {
    const generator = getGenerator(generatorId);
    if (!generator.difficulties.includes(difficulty)) return null;
  } catch {
    return null;
  }
  return { generatorId, seed, difficulty };
}

/**
 * Keeps only skills and difficulties that content actually exists for, so a
 * stale bookmark cannot ask for a question nothing can make.
 */
export function normalizeConfig(raw: {
  skillIds?: string[];
  difficulties?: number[];
}): PracticeConfig {
  const known = new Set(skills.map((skill) => skill.id));
  const skillIds = (raw.skillIds ?? []).filter((id) => known.has(id));

  const difficulties = (raw.difficulties ?? []).filter(
    (value): value is Difficulty =>
      value === 1 || value === 2 || value === 3 || value === 4,
  );

  return {
    skillIds: skillIds.length > 0 ? skillIds : skills.map((skill) => skill.id),
    difficulties: difficulties.length > 0 ? difficulties : [1, 2],
  };
}

export function configFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): PracticeConfig {
  const list = (value: string | string[] | undefined): string[] => {
    if (Array.isArray(value)) return value.flatMap((item) => item.split(","));
    if (typeof value === "string") return value.split(",");
    return [];
  };

  const skillIds = list(params.skills).filter(Boolean);
  const topicIds = list(params.topic).filter(Boolean);
  const fromTopics = topics
    .filter((topic) => topicIds.includes(topic.id))
    .flatMap((topic) => topic.skillIds);

  return normalizeConfig({
    skillIds: [...new Set([...skillIds, ...fromTopics])],
    difficulties: list(params.difficulty).map(Number).filter(Number.isFinite),
  });
}

export function configToSearchParams(config: PracticeConfig): string {
  const params = new URLSearchParams();
  params.set("skills", config.skillIds.join(","));
  params.set("difficulty", config.difficulties.join(","));
  return params.toString();
}

/**
 * Chooses the next question. The seed is fresh each time, so the same
 * configuration does not replay the same questions in the same order.
 */
export function nextQuestionRef(config: PracticeConfig): QuestionRef {
  const pairs: { skillId: SkillId; difficulty: Difficulty }[] = [];
  for (const skillId of config.skillIds) {
    const available = difficultiesForSkill(skillId);
    for (const difficulty of config.difficulties) {
      if (available.includes(difficulty)) pairs.push({ skillId, difficulty });
    }
  }
  if (pairs.length === 0) {
    throw new Error("No content matches this practice configuration");
  }

  const choice = pairs[randomInt(pairs.length)]!;
  const candidates = generatorsForSkillAt(choice.skillId, choice.difficulty);
  const generator = candidates[randomInt(candidates.length)]!;

  return {
    generatorId: generator.id,
    seed: randomInt(1, MAX_SEED),
    difficulty: choice.difficulty,
  };
}

/** Skills a practice configuration would actually reach. */
export function describeConfig(config: PracticeConfig): {
  skillNames: { th: string; en: string }[];
  topicIds: string[];
} {
  const skillNames = config.skillIds.map((id) => getSkill(id).name);
  const topicIds = [
    ...new Set(config.skillIds.map((id) => getSkill(id).topicId)),
  ];
  return { skillNames, topicIds };
}
