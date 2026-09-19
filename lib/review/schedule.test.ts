import { describe, expect, it } from "vitest";
import {
  afterReview,
  isLeech,
  LADDER,
  LEECH_LAPSES,
  MAX_DUE_PER_DAY,
  rungOf,
  spreadDueDays,
  startingInterval,
  type Schedule,
} from "./schedule";

const fresh: Schedule = { intervalDays: 1, consecutiveCorrect: 0, lapses: 0 };

describe("the ladder", () => {
  it("climbs one rung for a right answer", () => {
    let schedule = fresh;
    const seen = [schedule.intervalDays];
    for (let i = 0; i < LADDER.length; i += 1) {
      schedule = afterReview(schedule, true);
      seen.push(schedule.intervalDays);
    }
    expect(seen.slice(0, LADDER.length)).toEqual([...LADDER]);
  });

  it("stops at the top rather than running away", () => {
    let schedule: Schedule = {
      intervalDays: LADDER.at(-1)!,
      consecutiveCorrect: 9,
      lapses: 0,
    };
    schedule = afterReview(schedule, true);
    expect(schedule.intervalDays).toBe(LADDER.at(-1));
  });

  /**
   * Two rungs, not one. The interval that produced the lapse has already been
   * shown to be too long, so stepping back to it would schedule the same
   * failure again.
   */
  it("drops two rungs for a wrong answer", () => {
    // 16 is rung 3, so two back is rung 1 - three days, not one.
    const at16: Schedule = { intervalDays: 16, consecutiveCorrect: 3, lapses: 0 };
    expect(afterReview(at16, false).intervalDays).toBe(3);

    // 35 is rung 4, so two back is rung 2.
    const at35: Schedule = { intervalDays: 35, consecutiveCorrect: 4, lapses: 0 };
    expect(afterReview(at35, false).intervalDays).toBe(7);
  });

  it("cannot drop below the bottom rung", () => {
    expect(afterReview(fresh, false).intervalDays).toBe(LADDER[0]);
    const at3: Schedule = { intervalDays: 3, consecutiveCorrect: 1, lapses: 0 };
    expect(afterReview(at3, false).intervalDays).toBe(LADDER[0]);
  });

  it("resets the streak on a lapse but never the lapse count", () => {
    const strong: Schedule = { intervalDays: 35, consecutiveCorrect: 6, lapses: 2 };
    const lapsed = afterReview(strong, false);
    expect(lapsed.consecutiveCorrect).toBe(0);
    expect(lapsed.lapses).toBe(3);

    // Recovering does not forgive the lapses - the skill was still lost twice.
    const recovered = afterReview(lapsed, true);
    expect(recovered.lapses).toBe(3);
    expect(recovered.consecutiveCorrect).toBe(1);
  });

  it("copes with an interval that is not on the ladder", () => {
    // A hand-edited row, or a ladder that changed under existing data.
    const odd: Schedule = { intervalDays: 22, consecutiveCorrect: 1, lapses: 0 };
    expect(rungOf(22)).toBe(3); // the 16 rung
    expect(afterReview(odd, true).intervalDays).toBe(35);
    expect(afterReview(odd, false).intervalDays).toBe(LADDER[1]);
  });
});

describe("leeches", () => {
  it("names a skill that keeps being lost", () => {
    expect(isLeech({ intervalDays: 1, consecutiveCorrect: 0, lapses: 3 })).toBe(false);
    expect(
      isLeech({ intervalDays: 1, consecutiveCorrect: 0, lapses: LEECH_LAPSES }),
    ).toBe(true);
  });

  it("stays a leech even while it is going well", () => {
    expect(
      isLeech({ intervalDays: 90, consecutiveCorrect: 5, lapses: LEECH_LAPSES }),
    ).toBe(true);
  });
});

describe("the cold start", () => {
  /**
   * Nothing is lost by having added scheduling late: rolling accuracy has been
   * tracked all along, so a skill already known does not need asking about
   * tomorrow.
   */
  it("starts an accurate skill further out", () => {
    expect(startingInterval(0.95, 30)).toBe(7);
    expect(startingInterval(0.8, 30)).toBe(3);
    expect(startingInterval(0.4, 30)).toBe(1);
  });

  it("starts an untouched skill at the bottom", () => {
    expect(startingInterval(0, 0)).toBe(LADDER[0]);
    expect(startingInterval(0.99, 0)).toBe(LADDER[0]);
  });

  it("spreads a backfill instead of dropping it all on one morning", () => {
    const days = spreadDueDays(45);
    expect(days.filter((d) => d === 0)).toHaveLength(MAX_DUE_PER_DAY);
    expect(days.filter((d) => d === 1)).toHaveLength(MAX_DUE_PER_DAY);
    expect(days.filter((d) => d === 2)).toHaveLength(5);
  });

  it("keeps the order, so the most urgent are dealt first", () => {
    const days = spreadDueDays(10, 4);
    expect(days).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 2, 2]);
  });

  it("handles a learner with nothing to schedule", () => {
    expect(spreadDueDays(0)).toEqual([]);
  });
});
