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
import {
  trigDefinition,
  trigSolve,
  trigSpecial,
} from "./trig-ratios";
import { trigUnitCircle } from "./trig-unit-circle";
import { trigIdentities } from "./trig-identities";
import { trigEquations } from "./trig-equations";
import { trigLaws } from "./trig-laws";
import { seqArithmetic, seqGeometric } from "./seq-sequences";
import { seriesArithmetic, seriesGeometric } from "./seq-series";
import { calcLimit } from "./calc-limit";
import { calcDerivative } from "./calc-derivative";
import { calcTangent } from "./calc-tangent";
import { calcIntegral } from "./calc-integral";
import { c1Infinity, c1OneSided } from "./c1-limits";
import { c1Continuity, c1TrigLimit } from "./c1-continuity";
import {
  c1FirstPrinciples,
  c1ProductQuotient,
} from "./c1-derivative";
import {
  c1ExpLogDerivative,
  c1TrigDerivative,
} from "./c1-transcendental";
import { c1ChainPower, c1ChainTranscendental } from "./c1-chain";
import { c1ChainCombined, c1Implicit } from "./c1-implicit";
import { c1Extrema, c1Monotonic } from "./c1-applications";
import { c1Optimisation, c1RelatedRates } from "./c1-optimisation";
import { c1MeanValue, c1MvtBound, c1Rolle } from "./c1-mvt";
import {
  c1Definite,
  c1IntegralPower,
  c1Substitution,
} from "./c1-integral";
import { c1Riemann } from "./c1-riemann";
import {
  c1AreaBetween,
  c1FtcFirst,
  c1FtcSecond,
  c1NetChange,
} from "./c1-ftc";
import { polyGrouping } from "./poly-grouping";
import { eqLinearFractions, eqLinearSolve } from "./eq-linear";
import { eqLinearWord } from "./eq-linear-word";
import {
  funcQuadIntercepts,
  funcQuadVertex,
  funcQuadVertexForm,
} from "./func-quadratic-graph";
import {
  expLogEquations,
  logDefinition,
  logLaws,
} from "./func-exp-log";
import {
  funcComposite,
  funcEvaluate,
  funcInverse,
} from "./func-relations";
import { ineqLinearIntegers, ineqLinearSolve } from "./ineq-linear";
import { ineqLinearWord } from "./ineq-linear-word";
import { polyCubes } from "./poly-cubes";
import { polyFactorTheorem } from "./poly-factor-theorem";
import { polyHigherGrouping } from "./poly-higher-grouping";
import { polySubstitution } from "./poly-substitution";
import { polyTwoVariables } from "./poly-two-variables";
import { polyPerfectSquare } from "./poly-perfect-square";

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
  polyPerfectSquare,
  polyGrouping,
  polyTwoVariables,
  polySubstitution,
  polyCubes,
  polyHigherGrouping,
  polyFactorTheorem,
  eqLinearSolve,
  eqLinearFractions,
  eqLinearWord,
  ineqLinearSolve,
  ineqLinearIntegers,
  ineqLinearWord,
  funcQuadVertexForm,
  funcQuadVertex,
  funcQuadIntercepts,
  funcEvaluate,
  funcComposite,
  funcInverse,
  logDefinition,
  logLaws,
  expLogEquations,
  trigDefinition,
  trigSpecial,
  trigSolve,
  trigUnitCircle,
  trigIdentities,
  trigEquations,
  trigLaws,
  seqArithmetic,
  seqGeometric,
  seriesArithmetic,
  seriesGeometric,
  calcLimit,
  calcDerivative,
  calcTangent,
  calcIntegral,
  c1OneSided,
  c1Infinity,
  c1Continuity,
  c1TrigLimit,
  c1FirstPrinciples,
  c1ProductQuotient,
  c1TrigDerivative,
  c1ExpLogDerivative,
  c1ChainPower,
  c1ChainTranscendental,
  c1ChainCombined,
  c1Implicit,
  c1Monotonic,
  c1Extrema,
  c1Optimisation,
  c1RelatedRates,
  c1Rolle,
  c1MeanValue,
  c1MvtBound,
  c1IntegralPower,
  c1Substitution,
  c1Definite,
  c1Riemann,
  c1FtcFirst,
  c1FtcSecond,
  c1NetChange,
  c1AreaBetween,
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
    misconceptions: _misconceptions,
    ...rest
  } = question;
  void _answer;
  void _steps;
  void _machineStem;
  void _misconceptions;
  return { ...rest, hintCount: hints.length };
}

export { getSkill };
