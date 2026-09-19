import { describe, expect, it } from "vitest";
import katex from "katex";
import { skills, topics, skillsOfTopic } from "./index";

describe("skills", () => {
  it("each carry a formula that renders", () => {
    for (const skill of skills) {
      expect(skill.formula, skill.id).toBeTruthy();
      expect(
        () => katex.renderToString(skill.formula, { throwOnError: true }),
        `${skill.id}: ${skill.formula}`,
      ).not.toThrow();
    }
  });

  /**
   * The formula is a *picture* of the skill, shown beside a checkbox in a
   * two-column grid. A long one wraps and the grid stops being scannable,
   * which is the whole reason it is there.
   */
  it("keep the formula short enough to sit on one line", () => {
    for (const skill of skills) {
      expect(skill.formula.length, `${skill.id}: ${skill.formula}`).toBeLessThan(
        60,
      );
    }
  });

  it("belong to a topic that lists them", () => {
    for (const skill of skills) {
      const owners = topics.filter((topic) =>
        topic.skillIds.includes(skill.id),
      );
      expect(owners.map((topic) => topic.id), skill.id).toEqual([skill.topicId]);
    }
  });

  it("are all reachable from a topic", () => {
    const listed = new Set(topics.flatMap((topic) => topic.skillIds));
    for (const skill of skills) expect(listed.has(skill.id), skill.id).toBe(true);
    expect(listed.size).toBe(skills.length);
  });

  it("name prerequisites that exist, and never themselves", () => {
    const ids = new Set(skills.map((skill) => skill.id));
    for (const skill of skills) {
      for (const prerequisite of skill.prerequisites) {
        expect(ids.has(prerequisite), `${skill.id} -> ${prerequisite}`).toBe(true);
        expect(prerequisite).not.toBe(skill.id);
      }
    }
  });
});

describe("topics", () => {
  it("resolve their skills in order", () => {
    for (const topic of topics) {
      const resolved = skillsOfTopic(topic.id);
      expect(resolved.map((skill) => skill.id)).toEqual(topic.skillIds);
    }
  });

  it("are bilingual throughout", () => {
    for (const topic of topics) {
      for (const field of [topic.name, topic.grade, topic.summary]) {
        expect(field.th.trim(), topic.id).not.toBe("");
        expect(field.en.trim(), topic.id).not.toBe("");
      }
    }
  });
});
