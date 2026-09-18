import { randomInt } from "node:crypto";
import {
  difficultiesForSkill,
  generatorsForSkillAt,
} from "@/content/generators";
import { skills, topics } from "@/content/topics";
import type { Difficulty, SkillId } from "@/content/types";
import type { QuestionRef } from "@/lib/practice/session";

/**
 * Exam mode (PROMPT.md §2, Phase 2).
 *
 * Unlike practice, the whole question set is fixed before the first question
 * is shown: a run is a thing you finish, and the results screen has to be able
 * to say "12 of 20" about a set that did not change under you.
 */

export const EXPLAIN_MODES = ["off", "onWrong", "always"] as const;
export type ExplainMode = (typeof EXPLAIN_MODES)[number];

export const QUESTION_COUNTS = [10, 20, 30, 40] as const;
export const TIME_LIMITS_MINUTES = [0, 10, 20, 30, 45, 60] as const;

export type ExamConfig = {
  skillIds: SkillId[];
  difficulties: Difficulty[];
  count: number;
  /** Seconds. 0 means untimed. */
  timeLimitSec: number;
  explainMode: ExplainMode;
};

/** Stored in `runs.config`, so a results page can be rebuilt from the row. */
export type ExamRunConfig = ExamConfig & { refs: QuestionRef[] };

const MAX_SEED = 2 ** 31 - 1;

export function isExplainMode(value: unknown): value is ExplainMode {
  return EXPLAIN_MODES.includes(value as ExplainMode);
}

function list(value: string | string[] | undefined): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => item.split(","));
  if (typeof value === "string") return value.split(",");
  return [];
}

export function examConfigFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): ExamConfig {
  const known = new Set(skills.map((skill) => skill.id));

  const fromTopics = topics
    .filter((topic) => list(params.topic).includes(topic.id))
    .flatMap((topic) => topic.skillIds);
  const requested = [...new Set([...list(params.skills), ...fromTopics])].filter(
    (id) => known.has(id),
  );

  const difficulties = list(params.difficulty)
    .map(Number)
    .filter((value): value is Difficulty =>
      value === 1 || value === 2 || value === 3 || value === 4,
    );

  const count = Number(first(params.count));
  const minutes = Number(first(params.minutes));
  const explain = first(params.explain);

  return {
    skillIds: requested.length > 0 ? requested : skills.map((skill) => skill.id),
    difficulties: difficulties.length > 0 ? difficulties : [1, 2],
    count: (QUESTION_COUNTS as readonly number[]).includes(count) ? count : 20,
    timeLimitSec: (TIME_LIMITS_MINUTES as readonly number[]).includes(minutes)
      ? minutes * 60
      : 20 * 60,
    explainMode: isExplainMode(explain) ? explain : "onWrong",
  };
}

function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/**
 * Builds the question set.
 *
 * Skills are dealt round-robin rather than drawn independently, so a 20
 * question exam over 6 skills actually covers all 6 instead of asking about
 * radicals nine times by chance. Difficulty is spread the same way.
 */
export function buildExamRefs(config: ExamConfig): QuestionRef[] {
  const pairs: { skillId: SkillId; difficulty: Difficulty }[] = [];
  for (const skillId of config.skillIds) {
    const available = difficultiesForSkill(skillId);
    for (const difficulty of config.difficulties) {
      if (available.includes(difficulty)) pairs.push({ skillId, difficulty });
    }
  }
  if (pairs.length === 0) {
    throw new Error("No content matches this exam configuration");
  }

  const shuffled = shuffle(pairs);
  const refs: QuestionRef[] = [];

  for (let index = 0; index < config.count; index++) {
    const pair = shuffled[index % shuffled.length]!;
    const candidates = generatorsForSkillAt(pair.skillId, pair.difficulty);
    const generator = candidates[randomInt(candidates.length)]!;
    refs.push({
      generatorId: generator.id,
      seed: randomInt(1, MAX_SEED),
      difficulty: pair.difficulty,
    });
  }

  // Deal round-robin, then shuffle the order they are asked in.
  return shuffle(refs);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function examConfigToSearchParams(config: ExamConfig): string {
  const params = new URLSearchParams();
  params.set("skills", config.skillIds.join(","));
  params.set("difficulty", config.difficulties.join(","));
  params.set("count", String(config.count));
  params.set("minutes", String(Math.round(config.timeLimitSec / 60)));
  params.set("explain", config.explainMode);
  return params.toString();
}

/** Narrows an unknown `runs.config` back to the shape we wrote. */
export function asExamRunConfig(value: unknown): ExamRunConfig | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Partial<ExamRunConfig>;
  if (!Array.isArray(candidate.refs) || candidate.refs.length === 0) return null;
  if (!isExplainMode(candidate.explainMode)) return null;
  return {
    skillIds: Array.isArray(candidate.skillIds) ? candidate.skillIds : [],
    difficulties: Array.isArray(candidate.difficulties)
      ? candidate.difficulties
      : [],
    count: typeof candidate.count === "number" ? candidate.count : candidate.refs.length,
    timeLimitSec:
      typeof candidate.timeLimitSec === "number" ? candidate.timeLimitSec : 0,
    explainMode: candidate.explainMode,
    refs: candidate.refs,
  };
}
