import { createRng } from "../rng";
import { getSkill, skills } from "../topics";
import type {
  Difficulty,
  Generator,
  GeneratorId,
  PublicQuestion,
  Question,
  SkillId,
} from "../types";
import { expLawsCore } from "./exp-integer-laws";
import { expZeroNegative } from "./exp-negative-zero";
import { expScientificNotation } from "./exp-scientific";
import { radOperationsCore } from "./rad-operations";
import { radRationalizeCore } from "./rad-rationalize";
import { radSimplifySqrt } from "./rad-simplify";
import { quadCompletingSquare } from "./quad-complete-square";
import { quadDiscriminantCount } from "./quad-discriminant";
import {
  quadDiffSquares,
  quadFactorCommon,
  quadFactorTrinomial,
} from "./quad-factor";
import { quadFormulaCore } from "./quad-formula";
import {
  quadSolveCommonFactor,
  quadSolveFactorLeading,
  quadSolveFactorSimple,
} from "./quad-solve";
import { quadWordConsecutive, quadWordRectangle } from "./quad-word";

/**
 * Every generator in the app.
 *
 * Never delete one that has attempts against it - deprecate it instead
 * (PROMPT.md §11). Ids live in the database for ever.
 */
export const generators: Generator[] = [
  expLawsCore,
  expZeroNegative,
  expScientificNotation,
  radSimplifySqrt,
  radOperationsCore,
  radRationalizeCore,
  quadFactorCommon,
  quadFactorTrinomial,
  quadDiffSquares,
  quadSolveFactorSimple,
  quadSolveFactorLeading,
  quadSolveCommonFactor,
  quadCompletingSquare,
  quadFormulaCore,
  quadDiscriminantCount,
  quadWordRectangle,
  quadWordConsecutive,
];

const byId = new Map(generators.map((generator) => [generator.id, generator]));

export function getGenerator(id: GeneratorId): Generator {
  const generator = byId.get(id);
  if (!generator) throw new Error(`Unknown generator id: ${id}`);
  return generator;
}

export function hasGenerator(id: GeneratorId): boolean {
  return byId.has(id);
}

export function generatorsForSkill(skillId: SkillId): Generator[] {
  return generators.filter((generator) => generator.skillId === skillId);
}

export function generatorsForSkillAt(
  skillId: SkillId,
  difficulty: Difficulty,
): Generator[] {
  return generatorsForSkill(skillId).filter((generator) =>
    generator.difficulties.includes(difficulty),
  );
}

/** Difficulties a skill can actually be asked at right now. */
export function difficultiesForSkill(skillId: SkillId): Difficulty[] {
  const available = new Set<Difficulty>();
  for (const generator of generatorsForSkill(skillId)) {
    for (const difficulty of generator.difficulties) available.add(difficulty);
  }
  return [...available].sort((a, b) => a - b);
}

export function skillsWithContent(): SkillId[] {
  return skills
    .filter((skill) => generatorsForSkill(skill.id).length > 0)
    .map((skill) => skill.id);
}

/**
 * The reproducible entry point: a question is fully determined by
 * `(generatorId, seed, difficulty)`, which is what makes replaying a missed
 * question and sharing one by URL possible.
 */
export function generateQuestion(
  generatorId: GeneratorId,
  seed: number,
  difficulty: Difficulty,
): Question {
  const generator = getGenerator(generatorId);
  if (!generator.difficulties.includes(difficulty)) {
    throw new Error(
      `${generatorId} does not support difficulty ${difficulty}`,
    );
  }
  return generator.generate(createRng(seed), difficulty);
}

/** Chooses a generator for a skill at a difficulty, from a seed. */
export function pickGenerator(
  skillId: SkillId,
  difficulty: Difficulty,
  seed: number,
): Generator {
  const candidates = generatorsForSkillAt(skillId, difficulty);
  if (candidates.length === 0) {
    throw new Error(
      `No generator for ${skillId} at difficulty ${difficulty}`,
    );
  }
  return candidates[seed % candidates.length]!;
}

/**
 * What the client is allowed to see before it submits: the answer, the steps
 * and the hints stay on the server (PROMPT.md §6.4).
 */
export function toPublicQuestion(question: Question): PublicQuestion {
  const {
    answer: _answer,
    steps: _steps,
    hints,
    machineStem: _machineStem,
    ...rest
  } = question;
  void _answer;
  void _steps;
  void _machineStem;
  return { ...rest, hintCount: hints.length };
}

export { getSkill };
