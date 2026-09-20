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
  /**
   * How many questions the run is. `null` is the old endless behaviour, kept
   * as something you choose rather than something you get by default.
   */
  length: number | null;
  /**
   * Fixes the plan, so the same run survives a reload or a language switch
   * instead of reshuffling into a different set of questions. The same reason
   * `?q=` exists for a single question.
   */
  seed: number;
};

/** The longest a run can be asked for. Past this it is endless in all but name. */
export const MAX_RUN_LENGTH = 60;

/** Lengths offered on the setup page, alongside "one of each" and endless. */
export const RUN_LENGTHS = [10, 20, 40] as const;

/** "One question per lesson I ticked", resolved once the selection is known. */
export const ROUND = "round";

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
  if (
    difficulty !== 1 &&
    difficulty !== 2 &&
    difficulty !== 3 &&
    difficulty !== 4
  ) {
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
  length?: number | null;
  seed?: number;
}): PracticeConfig {
  const known = new Set(skills.map((skill) => skill.id));
  const skillIds = (raw.skillIds ?? []).filter((id) => known.has(id));

  const difficulties = (raw.difficulties ?? []).filter(
    (value): value is Difficulty =>
      value === 1 || value === 2 || value === 3 || value === 4,
  );

  /*
   * A length that is not a usable number means endless rather than zero
   * questions - a run of nothing is never what anyone meant, and `Number("")`
   * is 0, so a blank parameter would otherwise produce exactly that.
   */
  const rawLength = raw.length;
  const length =
    typeof rawLength === "number" &&
    Number.isFinite(rawLength) &&
    rawLength >= 1
      ? Math.min(MAX_RUN_LENGTH, Math.floor(rawLength))
      : null;

  const rawSeed = raw.seed;
  const seed =
    typeof rawSeed === "number" && Number.isInteger(rawSeed) && rawSeed > 0
      ? rawSeed % MAX_SEED
      : randomInt(1, MAX_SEED);

  return {
    skillIds: skillIds.length > 0 ? skillIds : skills.map((skill) => skill.id),
    difficulties: difficulties.length > 0 ? difficulties : [1, 2],
    length,
    seed,
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

  const single = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

  const rawLength = single(params.len);
  const rawSeed = single(params.run);

  const base = normalizeConfig({
    skillIds: [...new Set([...skillIds, ...fromTopics])],
    difficulties: list(params.difficulty).map(Number).filter(Number.isFinite),
    // `undefined` rather than `Number(undefined)`, which is NaN and reads as a
    // malformed request rather than as "not asked for".
    length: rawLength === undefined ? null : Number(rawLength),
    seed: rawSeed === undefined ? undefined : Number(rawSeed),
  });

  /*
   * `len=round` is "one question per lesson I ticked", which is the length most
   * people actually want and the only one that cannot be a number in the form -
   * the count is not known until the selection is. Resolved here, where it is.
   */
  if (rawLength === ROUND) {
    const count = reachableSkills(base).length;
    return { ...base, length: Math.max(1, Math.min(MAX_RUN_LENGTH, count)) };
  }

  return base;
}

export function configToSearchParams(config: PracticeConfig): string {
  const params = new URLSearchParams();
  params.set("skills", config.skillIds.join(","));
  params.set("difficulty", config.difficulties.join(","));
  if (config.length !== null) params.set("len", String(config.length));
  params.set("run", String(config.seed));
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

/**
 * A small deterministic generator, so a plan can be rebuilt from its seed.
 *
 * `randomInt` is right for drawing one question and wrong here: a run has to
 * come back identical after a reload or a language switch, and the seed in the
 * URL is what makes that true.
 */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** The skills in a configuration that content can actually be made for. */
export function reachableSkills(config: PracticeConfig): SkillId[] {
  return config.skillIds.filter((skillId) => {
    const available = difficultiesForSkill(skillId);
    return config.difficulties.some((difficulty) =>
      available.includes(difficulty),
    );
  });
}

/**
 * The questions a run will ask, in order.
 *
 * Drawing each question independently at random - which is what an endless run
 * does - means a ten-question run over six skills will usually miss two of them
 * and ask another one three times. That is the wrong shape for practice you
 * chose the contents of: picking six topics and then not being asked about two
 * of them is a bug from the learner's side, however well the dice behaved.
 *
 * So the plan deals in rounds. Each round is every reachable skill once, in a
 * fresh order, and the run is as many rounds as it takes. Every skill is
 * therefore asked before any skill is asked twice, and the counts never differ
 * by more than one. Difficulty and generator are still drawn at random within
 * the skill, because that variety is wanted.
 */
export function planQuestions(
  config: PracticeConfig,
  length: number,
): QuestionRef[] {
  const reachable = reachableSkills(config);
  if (reachable.length === 0) {
    throw new Error("No content matches this practice configuration");
  }

  const random = mulberry32(config.seed);
  const plan: QuestionRef[] = [];

  while (plan.length < length) {
    for (const skillId of shuffled(reachable, random)) {
      if (plan.length >= length) break;

      const available = difficultiesForSkill(skillId);
      const eligible = config.difficulties.filter((d) => available.includes(d));
      const difficulty = eligible[Math.floor(random() * eligible.length)]!;

      const candidates = generatorsForSkillAt(skillId, difficulty);
      const generator = candidates[Math.floor(random() * candidates.length)]!;

      plan.push({
        generatorId: generator.id,
        // Seeds stay clear of 0, which several generators treat as unset.
        seed: 1 + Math.floor(random() * (MAX_SEED - 1)),
        difficulty,
      });
    }
  }

  return plan;
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
