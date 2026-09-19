import { describe, expect, it } from "vitest";
import { dailyRefs, DAILY_QUESTIONS } from "./challenge";
import { generateQuestion, hasGenerator } from "@/content/generators";

/**
 * The daily challenge's whole promise is that everyone gets the same five
 * questions on the same day. That is a property of a pure function, so it is
 * testable without a database.
 */
describe("dailyRefs", () => {
  it("gives the same set to everyone on a given day", () => {
    expect(dailyRefs("2026-09-19")).toEqual(dailyRefs("2026-09-19"));
  });

  it("gives a different set the next day", () => {
    const today = dailyRefs("2026-09-19");
    const tomorrow = dailyRefs("2026-09-20");
    expect(tomorrow).not.toEqual(today);
  });

  it("is five questions that climb in difficulty", () => {
    const refs = dailyRefs("2026-09-19");
    expect(refs).toHaveLength(DAILY_QUESTIONS);
    const difficulties = refs.map((ref) => ref.difficulty);
    expect(difficulties).toEqual([...difficulties].sort((a, b) => a - b));
    expect(difficulties[0]).toBeLessThan(difficulties.at(-1)!);
  });

  it("only ever names generators that exist, on every day for a year", () => {
    for (let offset = 0; offset < 365; offset++) {
      const date = new Date(Date.UTC(2026, 8, 19));
      date.setUTCDate(date.getUTCDate() + offset);
      const day = date.toISOString().slice(0, 10);

      for (const ref of dailyRefs(day)) {
        expect(
          hasGenerator(ref.generatorId),
          `${day}: ${ref.generatorId}`,
        ).toBe(true);
        // And the question it names actually builds.
        const question = generateQuestion(
          ref.generatorId,
          ref.seed,
          ref.difficulty,
        );
        expect(question.steps.length).toBeGreaterThan(0);
      }
    }
  });

  it("does not ask the same question twice in one day", () => {
    for (const day of ["2026-09-19", "2026-12-01", "2027-03-14"]) {
      const ids = dailyRefs(day).map(
        (ref) => `${ref.generatorId}:${ref.seed}:${ref.difficulty}`,
      );
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
