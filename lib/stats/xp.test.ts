import { describe, expect, it } from "vitest";
import {
  XP_ANSWERED,
  XP_PERFECT,
  XP_STREAK_EVERY,
  XP_STREAK_MAX,
  xpFor,
} from "./constants";

const total = (...args: Parameters<typeof xpFor>) => xpFor(...args).total;
const keys = (...args: Parameters<typeof xpFor>) =>
  xpFor(...args).parts.map((part) => part.key);

describe("xpFor", () => {
  /**
   * The itemised version replaced a single number, and the totals were meant to
   * land where that number did - otherwise every existing account's rate of
   * levelling changes silently. A plain correct answer, hints used so no
   * perfect bonus and no streak, is still what it always was.
   */
  it("pays what the old flat award paid for a plain correct answer", () => {
    for (const [difficulty, expected] of [
      [1, 4],
      [2, 6],
      [3, 9],
      [4, 13],
    ] as const) {
      expect(total(difficulty, true, { hintsUsed: 1 }), `d${difficulty}`).toBe(
        expected,
      );
    }
  });

  it("pays something for a wrong answer, because turning up counts", () => {
    expect(total(1, false)).toBe(XP_ANSWERED);
    expect(total(4, false)).toBe(XP_ANSWERED);
    expect(keys(4, false)).toEqual(["answered"]);
  });

  it("adds the perfect bonus only with no hints and no working revealed", () => {
    expect(keys(2, true, {})).toContain("perfect");
    expect(keys(2, true, { hintsUsed: 1 })).not.toContain("perfect");
    expect(keys(2, true, { stepsRevealed: true })).not.toContain("perfect");
    expect(total(2, true, {})).toBe(
      total(2, true, { hintsUsed: 1 }) + XP_PERFECT,
    );
  });

  it("pays a point per few consecutive answers, and then stops", () => {
    const at = (streak: number) =>
      xpFor(2, true, { streak, hintsUsed: 1 }).parts.find(
        (p) => p.key === "streak",
      )?.amount ?? 0;

    expect(at(0)).toBe(0);
    expect(at(XP_STREAK_EVERY - 1)).toBe(0);
    expect(at(XP_STREAK_EVERY)).toBe(1);
    expect(at(XP_STREAK_EVERY * 2)).toBe(2);
    // However long the streak, the bonus cannot dwarf the question.
    expect(at(1000)).toBe(XP_STREAK_MAX);
  });

  it("gives no bonuses at all for a wrong answer, however long the streak was", () => {
    expect(keys(3, false, { streak: 99 })).toEqual(["answered"]);
  });

  it("always reports a total that is the sum of its parts", () => {
    for (const difficulty of [1, 2, 3, 4]) {
      for (const correct of [true, false]) {
        for (const streak of [0, 3, 9, 50]) {
          for (const hintsUsed of [0, 2]) {
            const award = xpFor(difficulty, correct, { streak, hintsUsed });
            const summed = award.parts.reduce((sum, p) => sum + p.amount, 0);
            expect(
              award.total,
              JSON.stringify({ difficulty, correct, streak }),
            ).toBe(summed);
            expect(award.total).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("survives a difficulty that is not one of ours", () => {
    expect(total(99, true, { hintsUsed: 1 })).toBeGreaterThan(0);
    expect(total(0, true, { hintsUsed: 1 })).toBeGreaterThan(0);
  });
});
