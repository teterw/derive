import { describe, expect, it } from "vitest";
import { getSkill, skills } from "../topics";
import { hasRule } from "../rules";
import {
  difficultiesForSkill,
  generateQuestion,
  generators,
  generatorsForSkill,
  pickGenerator,
  toPublicQuestion,
} from "./index";

describe("generator registry", () => {
  it("has no duplicate ids", () => {
    const ids = generators.map((generator) => generator.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("only points at skills that exist", () => {
    for (const generator of generators) {
      expect(() => getSkill(generator.skillId)).not.toThrow();
    }
  });

  it("covers every skill in both pilot topics", () => {
    for (const skill of skills) {
      expect(
        generatorsForSkill(skill.id).length,
        `no generator for skill ${skill.id}`,
      ).toBeGreaterThan(0);
    }
  });

  it("covers all four difficulties for every skill", () => {
    for (const skill of skills) {
      expect(
        difficultiesForSkill(skill.id),
        `skill ${skill.id} is missing a difficulty`,
      ).toEqual([1, 2, 3, 4]);
    }
  });

  it("declares only rules the skill lists, or shared algebra ones", () => {
    const shared = new Set([
      "eq.balance",
      "eq.move-term",
      "arith.combine-like-terms",
      "arith.simplify-fraction",
      "arith.distribute",
      "model.equation",
      "model.reject-root",
      "quad.diff-squares",
      "quad.common-factor",
      "rad.product",
      "rad.perfect-square-extract",
      "quad.discriminant",
      "quad.square-root-property",
      "quad.formula",
    ]);
    for (const generator of generators) {
      const skill = getSkill(generator.skillId);
      for (const difficulty of generator.difficulties) {
        const question = generateQuestion(generator.id, 12345, difficulty);
        for (const ruleId of question.rulesUsed) {
          expect(hasRule(ruleId)).toBe(true);
          expect(
            skill.ruleIds.includes(ruleId) || shared.has(ruleId),
            `${generator.id} uses ${ruleId}, which skill ${skill.id} does not list`,
          ).toBe(true);
        }
      }
    }
  });

  it("refuses a difficulty a generator does not support", () => {
    expect(() => generateQuestion("quad.solve-factor-leading", 1, 1)).toThrow(
      /does not support/,
    );
  });

  it("picks a usable generator for every skill and difficulty", () => {
    for (const skill of skills) {
      for (const difficulty of [1, 2, 3, 4] as const) {
        const generator = pickGenerator(skill.id, difficulty, 7);
        expect(generator.difficulties).toContain(difficulty);
        expect(generator.skillId).toBe(skill.id);
      }
    }
  });

  it("never leaks the answer, the steps or the hints to the client", () => {
    const question = generateQuestion("quad.solve-factor-simple", 42, 2);
    const publicQuestion = toPublicQuestion(question) as Record<string, unknown>;
    expect(publicQuestion.answer).toBeUndefined();
    expect(publicQuestion.steps).toBeUndefined();
    expect(publicQuestion.hints).toBeUndefined();
    expect(publicQuestion.machineStem).toBeUndefined();
    expect(publicQuestion.hintCount).toBe(question.hints.length);
    expect(publicQuestion.stem).toBe(question.stem);
    // Nothing that stringifies to the answer may survive the trip.
    expect(JSON.stringify(publicQuestion)).not.toContain("kind");
  });

  it("is reproducible through the registry entry point", () => {
    const first = generateQuestion("quad.formula-core", 999, 3);
    const second = generateQuestion("quad.formula-core", 999, 3);
    expect(second).toEqual(first);
  });
});
