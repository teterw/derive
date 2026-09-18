import { expect } from "vitest";
import katex from "katex";
import { evaluate, parse } from "mathjs";
import { areEquivalent, symbolsOf } from "@/lib/math/equivalence";
import { checkAnswer } from "@/lib/math/check";
import { hasRule } from "../rules";
import { getSkill } from "../topics";
import { createRng } from "../rng";
import { deriveMath } from "../step";
import { DIFFICULTIES, type Answer, type Generator, type Question } from "../types";

/**
 * The §9 gate. Every generator runs through this over 100 seeds at every
 * difficulty it claims to support, and a generator that does not pass does not
 * ship - wrong steps teach wrong maths, which is worse than no content at all.
 */

const SEEDS = 100;

export function verifyGenerator(generator: Generator, seeds = SEEDS): void {
  expect(generator.difficulties.length).toBeGreaterThan(0);

  for (const difficulty of generator.difficulties) {
    expect(DIFFICULTIES).toContain(difficulty);

    for (let seed = 1; seed <= seeds; seed++) {
      const question = generator.generate(createRng(seed), difficulty);
      const where = `${generator.id} seed=${seed} d=${difficulty}`;

      checkShape(question, generator, difficulty, where);
      checkBilingual(question, where);
      checkRulesExist(question, where);
      checkKatexRenders(question, where);
      checkStepChain(question, where);
      checkAnswerSatisfiesStem(question, where);
      checkAnswerChecking(question, where);
    }
  }
}

/** Reproducibility is the whole basis of replaying a missed question. */
export function verifyDeterminism(generator: Generator): void {
  for (const difficulty of generator.difficulties) {
    for (const seed of [1, 7, 42, 1234]) {
      const first = generator.generate(createRng(seed), difficulty);
      const second = generator.generate(createRng(seed), difficulty);
      expect(second).toEqual(first);
    }
  }
}

/** Different seeds must actually produce different questions. */
export function verifyVariety(generator: Generator, minimum = 20): void {
  for (const difficulty of generator.difficulties) {
    const stems = new Set(
      Array.from({ length: 100 }, (_, index) =>
        generator.generate(createRng(index + 1), difficulty).stem,
      ),
    );
    expect(
      stems.size,
      `${generator.id} d=${difficulty} produced only ${stems.size} distinct stems`,
    ).toBeGreaterThanOrEqual(minimum);
  }
}

/** The generator id itself contains dots, so split from the right. */
function splitId(id: string): [string, string, string] {
  const parts = id.split(":");
  const difficulty = parts.pop() ?? "";
  const seed = parts.pop() ?? "";
  return [parts.join(":"), seed, difficulty];
}

function checkShape(
  question: Question,
  generator: Generator,
  difficulty: number,
  where: string,
): void {
  expect(question.generatorId, where).toBe(generator.id);
  expect(question.skillId, where).toBe(generator.skillId);
  expect(question.difficulty, where).toBe(difficulty);
  // id is `${generatorId}:${seed}:${difficulty}` - the triple a question is
  // reproducible from.
  const [idGenerator, idSeed, idDifficulty] = splitId(question.id);
  expect(idGenerator, where).toBe(generator.id);
  expect(Number.isInteger(Number(idSeed)), `${where}: bad seed in id`).toBe(true);
  expect(idDifficulty, where).toBe(String(difficulty));
  expect(question.stem.trim(), where).not.toBe("");
  expect(question.steps.length, `${where}: no steps`).toBeGreaterThan(0);
  expect(question.hints.length, `${where}: no hints`).toBeGreaterThan(0);
  expect(question.rulesUsed.length, where).toBeGreaterThan(0);

  // Every rule a step uses must be declared on the question, and vice versa.
  const stepRules = new Set(question.steps.map((step) => step.ruleId));
  for (const ruleId of stepRules) {
    expect(question.rulesUsed, `${where}: ${ruleId} missing from rulesUsed`)
      .toContain(ruleId);
  }
}

function checkBilingual(question: Question, where: string): void {
  const strings = [
    question.prompt,
    ...question.steps.map((step) => step.explain),
    ...question.hints,
  ];
  for (const value of strings) {
    expect(value.th.trim(), `${where}: empty Thai`).not.toBe("");
    expect(value.en.trim(), `${where}: empty English`).not.toBe("");
  }
}

function checkRulesExist(question: Question, where: string): void {
  for (const step of question.steps) {
    expect(hasRule(step.ruleId), `${where}: unknown rule ${step.ruleId}`).toBe(
      true,
    );
  }
  for (const ruleId of question.rulesUsed) {
    expect(hasRule(ruleId), `${where}: unknown rule ${ruleId}`).toBe(true);
  }
}

function checkKatexRenders(question: Question, where: string): void {
  const fragments = [question.stem, ...question.steps.map((step) => step.expr)];
  for (const fragment of fragments) {
    expect(
      () => katex.renderToString(fragment, { throwOnError: true }),
      `${where}: ${fragment} does not render`,
    ).not.toThrow();
  }
}

/**
 * Adjacent steps in the same chain must be mathematically equal. This is what
 * makes a derivation checkable rather than merely plausible.
 */
function checkStepChain(question: Question, where: string): void {
  const chains = new Map<string, { expr: string; math: string }[]>();
  for (const step of question.steps) {
    if (!step.math) continue;
    const key = step.chain ?? "main";
    const list = chains.get(key) ?? [];
    list.push({ expr: step.expr, math: step.math });
    chains.set(key, list);
  }

  for (const [chain, list] of chains) {
    for (let i = 1; i < list.length; i++) {
      const previous = list[i - 1]!;
      const current = list[i]!;
      expect(
        areEquivalent(previous.math, current.math),
        `${where}: chain "${chain}" breaks between ${previous.expr} and ${current.expr}`,
      ).toBe(true);
    }
  }
}

function zeroFormOfStem(question: Question): string | null {
  if (question.machineStem !== undefined) return question.machineStem;
  return deriveMath(question.stem);
}

/**
 * §9.5: the stated answer must actually satisfy the original problem.
 *
 * For an equation, substitute every root into the zero form. For an
 * expression, the stem and the answer must be the same thing written
 * differently.
 */
function checkAnswerSatisfiesStem(question: Question, where: string): void {
  const stem = zeroFormOfStem(question);
  if (stem === null) return; // word problem: verified by its own assertions

  const variables = symbolsOf(stem);

  if (variables.length === 0) {
    // A numeric simplification: the stem is the answer, written the long way.
    expectEquivalentToAnswer(stem, question.answer, where);
    return;
  }

  if (question.answer.kind === "set" || isRootAnswer(question)) {
    const roots =
      question.answer.kind === "set"
        ? question.answer.values
        : [(question.answer as { value: string }).value];
    expect(variables.length, `${where}: expected one unknown`).toBe(1);
    const variable = variables[0]!;

    for (const root of roots) {
      const value = evaluate(`(${root})`) as number;
      const residual = evaluate(stem, { [variable]: value }) as number;
      expect(
        Math.abs(Number(residual)),
        `${where}: root ${root} does not satisfy ${question.stem}`,
      ).toBeLessThan(1e-9);
    }
    return;
  }

  expectEquivalentToAnswer(stem, question.answer, where);
}

/** An `exact` answer to an equation is a single root, not an expression. */
function isRootAnswer(question: Question): boolean {
  if (question.answer.kind !== "exact") return false;
  const stem = zeroFormOfStem(question);
  if (!stem) return false;
  return symbolsOf(stem).length === 1 && symbolsOf(question.answer.value).length === 0;
}

function expectEquivalentToAnswer(
  stemMath: string,
  answer: Answer,
  where: string,
): void {
  if (answer.kind === "exact") {
    expect(
      areEquivalent(stemMath, answer.value),
      `${where}: ${stemMath} is not equivalent to the answer ${answer.value}`,
    ).toBe(true);
    return;
  }
  if (answer.kind === "numeric") {
    const value = evaluate(stemMath) as number;
    expect(Math.abs(Number(value) - answer.value), where).toBeLessThanOrEqual(
      answer.tol,
    );
  }
}

/** §9.6: the canonical answer is accepted and a perturbed one is not. */
function checkAnswerChecking(question: Question, where: string): void {
  const strictForm = getSkill(question.skillId).strictForm;
  const canonical = canonicalAnswerText(question.answer);
  if (canonical === null) return;

  expect(
    checkAnswer(question.answer, canonical, strictForm),
    `${where}: rejected its own answer ${canonical}`,
  ).toEqual({ correct: true });

  for (const wrong of perturbations(question.answer)) {
    expect(
      checkAnswer(question.answer, wrong, strictForm).correct,
      `${where}: accepted the wrong answer ${wrong}`,
    ).toBe(false);
  }
}

export function canonicalAnswerText(answer: Answer): string | null {
  switch (answer.kind) {
    case "exact":
      return answer.value;
    case "numeric":
      return String(answer.value);
    case "set":
      return answer.values.join(", ");
    case "choice":
      return answer.correct;
  }
}

function perturbations(answer: Answer): string[] {
  switch (answer.kind) {
    case "exact":
      // x + 1 and x - 1 are never x, whatever x is.
      return [`(${answer.value}) + 1`, `(${answer.value}) - 1`];
    case "numeric":
      return [String(answer.value + 1 + answer.tol)];
    case "set":
      return [
        answer.values
          .map((value, index) => (index === 0 ? `(${value}) + 1` : value))
          .join(", "),
        // One root too many is wrong no matter what the roots are.
        [...answer.values, "12345"].join(", "),
      ];
    case "choice":
      return [];
  }
}

/** Handy in individual generator tests: does this KaTeX parse at all? */
export function parses(katexSource: string): boolean {
  const math = deriveMath(katexSource);
  if (!math) return false;
  try {
    parse(math);
    return true;
  } catch {
    return false;
  }
}
