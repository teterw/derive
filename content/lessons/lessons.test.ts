import { describe, expect, it } from "vitest";
import { hasRule } from "../rules";
import { getSkill, skills } from "../topics";
import { generateQuestion, getGenerator } from "../generators";
import { getLesson, hasLesson, lessons } from "./index";

describe("lessons", () => {
  it("covers every skill", () => {
    for (const skill of skills) {
      expect(hasLesson(skill.id), `no lesson for ${skill.id}`).toBe(true);
    }
  });

  it("has no lesson for a skill that does not exist", () => {
    for (const lesson of lessons) {
      expect(() => getSkill(lesson.skillId)).not.toThrow();
    }
  });

  it("is bilingual throughout", () => {
    for (const lesson of lessons) {
      const strings = [
        lesson.title,
        lesson.intro,
        lesson.bigIdea,
        ...lesson.pitfalls,
        ...lesson.examples.flatMap((example) =>
          example.note ? [example.note] : [],
        ),
      ];
      for (const value of strings) {
        expect(value.th.trim(), lesson.skillId).not.toBe("");
        expect(value.en.trim(), lesson.skillId).not.toBe("");
      }
      expect(lesson.pitfalls.length, lesson.skillId).toBeGreaterThan(0);
    }
  });

  it("only names rules that exist", () => {
    for (const lesson of lessons) {
      for (const ruleId of lesson.ruleIds) {
        expect(hasRule(ruleId), `${lesson.skillId} -> ${ruleId}`).toBe(true);
      }
    }
  });

  /**
   * The point of pointing at generators rather than hand-writing examples: a
   * lesson page cannot show a derivation that has not been through the §9
   * property gate.
   */
  it("every worked example and practice question really generates", () => {
    for (const lesson of lessons) {
      for (const example of [...lesson.examples, ...lesson.practice]) {
        const generator = getGenerator(example.generatorId);
        expect(
          generator.skillId,
          `${lesson.skillId} uses ${example.generatorId}, which teaches ${generator.skillId}`,
        ).toBe(lesson.skillId);
        expect(
          generator.difficulties,
          `${example.generatorId} at difficulty ${example.difficulty}`,
        ).toContain(example.difficulty);

        const question = generateQuestion(
          example.generatorId,
          example.seed,
          example.difficulty,
        );
        expect(question.steps.length).toBeGreaterThan(0);
        expect(question.stem.trim()).not.toBe("");
      }
    }
  });

  it("shows examples of increasing difficulty", () => {
    for (const lesson of lessons) {
      const difficulties = lesson.examples.map((example) => example.difficulty);
      const sorted = [...difficulties].sort((a, b) => a - b);
      expect(difficulties, lesson.skillId).toEqual(sorted);
    }
  });

  it("getLesson throws loudly for an unknown skill", () => {
    expect(() => getLesson("nope.not-a-skill")).toThrow(/No lesson/);
  });
});
