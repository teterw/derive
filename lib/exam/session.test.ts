import { describe, expect, it } from "vitest";
import {
  buildExamRefs,
  examConfigFromSearchParams,
  asExamRunConfig,
  type ExamConfig,
} from "./session";
import { generateQuestion, hasGenerator } from "@/content/generators";
import { skills } from "@/content/topics";
import type { Difficulty } from "@/content/types";

const base: ExamConfig = {
  skillIds: skills.slice(0, 6).map((skill) => skill.id),
  difficulties: [1, 2],
  count: 20,
  timeLimitSec: 1200,
  explainMode: "onWrong",
};

describe("buildExamRefs", () => {
  it("deals exactly the number of questions asked for", () => {
    for (const count of [10, 20, 30, 40]) {
      expect(buildExamRefs({ ...base, count })).toHaveLength(count);
    }
  });

  it("only names generators that exist and support the difficulty", () => {
    for (const ref of buildExamRefs({ ...base, count: 40 })) {
      expect(hasGenerator(ref.generatorId)).toBe(true);
      const question = generateQuestion(
        ref.generatorId,
        ref.seed,
        ref.difficulty,
      );
      expect(question.difficulty).toBe(ref.difficulty);
    }
  });

  it("stays inside the difficulties it was given", () => {
    const refs = buildExamRefs({ ...base, difficulties: [3], count: 10 });
    for (const ref of refs) expect(ref.difficulty).toBe(3);
  });

  /**
   * Skills are dealt round-robin rather than drawn independently: a 20
   * question exam over 6 skills should cover all 6, not ask about radicals
   * nine times by chance.
   */
  it("covers every skill it was given when there is room", () => {
    const refs = buildExamRefs({ ...base, count: 20 });
    const covered = new Set(
      refs.map(
        (ref) =>
          generateQuestion(ref.generatorId, ref.seed, ref.difficulty).skillId,
      ),
    );
    expect(covered.size).toBe(base.skillIds.length);
  });

  it("does not repeat a question inside one exam", () => {
    const refs = buildExamRefs({ ...base, count: 40 });
    const ids = refs.map(
      (ref) => `${ref.generatorId}:${ref.seed}:${ref.difficulty}`,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("refuses a configuration nothing can satisfy", () => {
    expect(() =>
      buildExamRefs({ ...base, skillIds: ["not.a.skill"], difficulties: [1] }),
    ).toThrow(/No content/);
  });
});

describe("examConfigFromSearchParams", () => {
  it("reads a shared URL", () => {
    const config = examConfigFromSearchParams({
      skills: "quad.formula,quad.discriminant",
      difficulty: "2,3",
      count: "30",
      minutes: "45",
      explain: "always",
    });
    expect(config.skillIds).toEqual(["quad.formula", "quad.discriminant"]);
    expect(config.difficulties).toEqual([2, 3] as Difficulty[]);
    expect(config.count).toBe(30);
    expect(config.timeLimitSec).toBe(45 * 60);
    expect(config.explainMode).toBe("always");
  });

  it("falls back rather than trusting junk", () => {
    const config = examConfigFromSearchParams({
      skills: "nope",
      difficulty: "9",
      count: "999",
      minutes: "999",
      explain: "sometimes",
    });
    expect(config.skillIds.length).toBe(skills.length);
    expect(config.difficulties).toEqual([1, 2]);
    expect(config.count).toBe(20);
    expect(config.explainMode).toBe("onWrong");
  });

  it("expands a topic into its skills", () => {
    const config = examConfigFromSearchParams({ topic: "quadratic-equations" });
    expect(config.skillIds).toContain("quad.formula");
    expect(config.skillIds).not.toContain("exp.integer-laws");
  });
});

describe("asExamRunConfig", () => {
  it("accepts what we wrote", () => {
    const config = { ...base, refs: buildExamRefs(base) };
    expect(asExamRunConfig(config)?.refs).toHaveLength(base.count);
  });

  it("rejects a row that is not one of ours", () => {
    expect(asExamRunConfig(null)).toBeNull();
    expect(asExamRunConfig({})).toBeNull();
    expect(asExamRunConfig({ refs: [] })).toBeNull();
    expect(asExamRunConfig({ refs: [{}], explainMode: "loud" })).toBeNull();
  });
});
