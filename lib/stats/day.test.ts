import { describe, expect, it } from "vitest";
import {
  bangkokDay,
  daysBetween,
  nextDay,
  previousDay,
  recentDays,
} from "./day";

describe("bangkokDay", () => {
  it("uses the Bangkok calendar, not UTC", () => {
    // 23:30 UTC is already the next morning in Bangkok (UTC+7).
    expect(bangkokDay(new Date("2026-09-18T23:30:00Z"))).toBe("2026-09-19");
    expect(bangkokDay(new Date("2026-09-18T16:59:00Z"))).toBe("2026-09-18");
    expect(bangkokDay(new Date("2026-09-18T17:00:00Z"))).toBe("2026-09-19");
  });

  it("is the reason late-night practice does not break a streak", () => {
    // A learner doing questions at 01:00 Bangkok time on the 19th.
    const lateNight = new Date("2026-09-18T18:00:00Z");
    expect(bangkokDay(lateNight)).toBe("2026-09-19");
  });
});

describe("day arithmetic", () => {
  it("steps backwards and forwards, including over month ends", () => {
    expect(previousDay("2026-03-01")).toBe("2026-02-28");
    expect(nextDay("2026-02-28")).toBe("2026-03-01");
    expect(previousDay("2027-01-01")).toBe("2026-12-31");
  });

  it("handles a leap day", () => {
    expect(nextDay("2028-02-28")).toBe("2028-02-29");
    expect(previousDay("2028-03-01")).toBe("2028-02-29");
  });

  it("counts days between", () => {
    expect(daysBetween("2026-09-18", "2026-09-19")).toBe(1);
    expect(daysBetween("2026-09-19", "2026-09-18")).toBe(-1);
    expect(daysBetween("2026-01-01", "2027-01-01")).toBe(365);
  });

  it("builds the heatmap spine oldest first", () => {
    const days = recentDays(4, "2026-09-18");
    expect(days).toEqual([
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
    ]);
  });
});
