import { describe, expect, it } from "vitest";
import { getGenerator } from "@/content/generators";
import {
  MAX_RUN_LENGTH,
  normalizeConfig,
  planQuestions,
  reachableSkills,
  type PracticeConfig,
} from "./session";

/**
 * A planned run has one job beyond being the right length: it must ask about
 * everything the learner ticked. Drawing each question independently does not
 * do that - over six skills a ten-question run usually misses two of them - and
 * from the learner's side being asked nothing about a topic they chose is a
 * bug, however well the dice behaved.
 */

function config(overrides: Partial<PracticeConfig> = {}): PracticeConfig {
  return normalizeConfig({
    skillIds: [
      "exp.integer-laws",
      "exp.negative-zero",
      "rad.simplify",
      "quad.diff-squares",
      "quad.formula",
    ],
    difficulties: [1, 2],
    seed: 12345,
    ...overrides,
  });
}

const skillOf = (id: string) => getGenerator(id).skillId;

describe("planQuestions", () => {
  it("asks for exactly the number of questions requested", () => {
    for (const length of [1, 3, 5, 12, 37]) {
      expect(planQuestions(config(), length), String(length)).toHaveLength(length);
    }
  });

  /** The whole point: one round is one question per chosen skill. */
  it("covers every chosen skill when the run is one round long", () => {
    const chosen = reachableSkills(config());
    const plan = planQuestions(config(), chosen.length);

    expect([...new Set(plan.map((ref) => skillOf(ref.generatorId)))].sort()).toEqual(
      [...chosen].sort(),
    );
  });

  it("asks every skill once before asking any skill twice", () => {
    const chosen = reachableSkills(config());
    const plan = planQuestions(config(), chosen.length * 2);

    const firstRound = plan.slice(0, chosen.length).map((r) => skillOf(r.generatorId));
    const secondRound = plan.slice(chosen.length).map((r) => skillOf(r.generatorId));

    expect(new Set(firstRound).size).toBe(chosen.length);
    expect(new Set(secondRound).size).toBe(chosen.length);
  });

  /**
   * A run that is shorter than the selection cannot cover it, but it must still
   * spend its questions on distinct skills rather than doubling up early.
   */
  it("uses distinct skills when the run is shorter than the selection", () => {
    const plan = planQuestions(config(), 3);
    const used = plan.map((ref) => skillOf(ref.generatorId));
    expect(new Set(used).size).toBe(3);
  });

  it("never lets one skill run away with the run", () => {
    const chosen = reachableSkills(config());
    const plan = planQuestions(config(), 23);

    const counts = new Map<string, number>();
    for (const ref of plan) {
      const skill = skillOf(ref.generatorId);
      counts.set(skill, (counts.get(skill) ?? 0) + 1);
    }
    const values = [...counts.values()];
    expect(counts.size).toBe(chosen.length);
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  });

  /** A reload or a language switch must not deal a different run. */
  it("is the same plan for the same seed", () => {
    expect(planQuestions(config({ seed: 999 }), 10)).toEqual(
      planQuestions(config({ seed: 999 }), 10),
    );
  });

  it("is a different plan for a different seed", () => {
    expect(planQuestions(config({ seed: 1 }), 10)).not.toEqual(
      planQuestions(config({ seed: 2 }), 10),
    );
  });

  it("only produces questions that can actually be generated", () => {
    for (const ref of planQuestions(config(), 30)) {
      const generator = getGenerator(ref.generatorId);
      expect(generator.difficulties).toContain(ref.difficulty);
      expect(ref.seed).toBeGreaterThan(0);
    }
  });

  it("refuses a configuration nothing can be made for", () => {
    const empty = { ...config(), skillIds: [], difficulties: [] } as PracticeConfig;
    expect(() => planQuestions({ ...empty, skillIds: [] }, 5)).toThrow();
  });
});

describe("normalizeConfig", () => {
  /**
   * `Number("")` is 0 and `Number(undefined)` is NaN, so a blank or missing
   * parameter would otherwise mean a run of no questions at all.
   */
  it("treats a missing or unusable length as endless, never as zero", () => {
    for (const length of [undefined, null, 0, -4, Number.NaN, 0.4]) {
      expect(normalizeConfig({ length }).length, String(length)).toBeNull();
    }
  });

  it("caps a length that would be endless in all but name", () => {
    expect(normalizeConfig({ length: 5000 }).length).toBe(MAX_RUN_LENGTH);
  });

  it("keeps a seed it is given and invents one otherwise", () => {
    expect(normalizeConfig({ seed: 4242 }).seed).toBe(4242);
    expect(normalizeConfig({}).seed).toBeGreaterThan(0);
  });
});
