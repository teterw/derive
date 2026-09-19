import { describe, expect, it } from "vitest";
import { compactXp, levelFromXp, totalXpForLevel, xpForLevel } from "./level";

describe("the level curve", () => {
  it("starts everyone at level 1 with nothing earned", () => {
    const start = levelFromXp(0);
    expect(start.level).toBe(1);
    expect(start.into).toBe(0);
    expect(start.fraction).toBe(0);
  });

  /**
   * The whole system is a pure function of XP, so the one thing that must hold
   * is that the closed-form inverse agrees with the definition it inverts.
   * Checked across the entire range a learner could ever reach.
   */
  it("inverts the total exactly, at every level", () => {
    for (let level = 1; level <= 500; level += 1) {
      const atFloor = totalXpForLevel(level);
      const atCeiling = totalXpForLevel(level + 1) - 1;

      expect(levelFromXp(atFloor).level, `floor of ${level}`).toBe(level);
      expect(levelFromXp(atCeiling).level, `ceiling of ${level}`).toBe(level);
      expect(levelFromXp(atFloor).into).toBe(0);
    }
  });

  it("never reports a level that has not been paid for", () => {
    for (let xp = 0; xp < 20000; xp += 37) {
      const { level, totalXp } = levelFromXp(xp);
      expect(totalXpForLevel(level), `xp=${xp}`).toBeLessThanOrEqual(totalXp);
      expect(totalXpForLevel(level + 1), `xp=${xp}`).toBeGreaterThan(totalXp);
    }
  });

  it("measures progress inside the level it reports", () => {
    for (let xp = 0; xp < 20000; xp += 53) {
      const { into, span, fraction } = levelFromXp(xp);
      expect(into).toBeGreaterThanOrEqual(0);
      expect(into).toBeLessThan(span);
      expect(fraction).toBeGreaterThanOrEqual(0);
      expect(fraction).toBeLessThan(1);
    }
  });

  /**
   * A flat increase, not a multiplying one. An exponential curve stops moving
   * the bar within a session long before a committed learner gets bored, which
   * is exactly backwards for a practice app.
   */
  it("grows the cost of a level by a flat amount", () => {
    for (let level = 1; level < 100; level += 1) {
      expect(xpForLevel(level + 1) - xpForLevel(level)).toBe(50);
    }
  });

  it("keeps a long-running account still able to see the bar move", () => {
    // Two years of moderate daily practice, very roughly.
    const twoYears = levelFromXp(150_000);
    expect(twoYears.level).toBeGreaterThan(60);
    // A good session is still a visible fraction of a level.
    expect(400 / twoYears.span).toBeGreaterThan(0.05);
  });

  it("handles rubbish input without reporting a rubbish level", () => {
    for (const bad of [-1, -9999, Number.NaN, 0.4]) {
      const result = levelFromXp(bad);
      expect(result.level, String(bad)).toBeGreaterThanOrEqual(1);
      expect(Number.isFinite(result.level), String(bad)).toBe(true);
    }
  });
});

describe("compactXp", () => {
  it("reads as a quantity rather than a number", () => {
    expect(compactXp(0)).toBe("0");
    expect(compactXp(999)).toBe("999");
    expect(compactXp(8213)).toBe("8.2k");
    expect(compactXp(9200)).toBe("9.2k");
    expect(compactXp(150_000)).toBe("150k");
  });
});
