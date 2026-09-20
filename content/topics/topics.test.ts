import { describe, expect, it } from "vitest";
import katex from "katex";
import {
  STAGES,
  getTopic,
  skills,
  skillsOfTopic,
  stageAnchors,
  stageOf,
  topics,
} from "./index";

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

/**
 * The stage a chapter is filed under, which the jump links on `/learn`,
 * `/practice` and `/stats` are built from.
 *
 * `stageOf` reads `grade.en`, and a grade it does not recognise would fall
 * through to "university" and put a ม.2 chapter under Calculus - quietly, and
 * only visible to someone who scrolled to check. So the test cross-checks it
 * against a fact it does not consult: the chapter's own id. Every `c1.`
 * chapter is university and no other chapter is, which means a new chapter
 * with an unfamiliar grade string fails here rather than mis-filing itself.
 */
describe("the stage a chapter belongs to", () => {
  it("agrees with what its id says", () => {
    for (const topic of topics) {
      const university =
        topic.id.startsWith("c1.") || topic.id.startsWith("c2.");
      expect(
        stageOf(topic) === "university",
        `${topic.id} is graded "${topic.grade.en}"`,
      ).toBe(university);
    }
  });

  it("puts every chapter somewhere, and the school ones in school", () => {
    const schoolStages = topics
      .filter((topic) => !topic.id.startsWith("c1."))
      .map(stageOf);

    expect(schoolStages.every((stage) => stage !== "university")).toBe(true);
    expect(new Set(schoolStages)).toEqual(new Set(["lower", "upper"]));
  });

  /** One anchor per stage, each pointing at the first chapter of it. */
  it("gives each stage a chapter to jump to", () => {
    const anchors = stageAnchors();

    expect(anchors.map((anchor) => anchor.stage)).toEqual([...STAGES]);
    for (const anchor of anchors) {
      expect(stageOf(getTopic(anchor.topicId))).toBe(anchor.stage);
    }
  });
});
