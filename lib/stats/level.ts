/**
 * Levels, derived from lifetime XP.
 *
 * Nothing is stored. A level is a pure function of the XP a learner has
 * earned, so there is no counter that can drift out of step with the attempts
 * it was supposed to be counting - and changing the curve reshapes everyone's
 * level at once, consistently, rather than leaving old accounts on old maths.
 *
 * ## The curve
 *
 * Reaching level `L + 1` from level `L` costs `50L + 50` XP. So the first
 * level is cheap (100, about eight correct answers), and the cost grows by a
 * flat 50 each time rather than multiplying. That matters for a practice app:
 * a learner two years in should still see the bar move in a session, and an
 * exponential curve stops giving that long before then.
 *
 * Total XP to *reach* level L is therefore a triangular number:
 *
 *     total(L) = 25L² + 25L - 50     (for L >= 1)
 *
 * which inverts in closed form, so finding a level from XP is arithmetic
 * rather than a loop.
 */

/** XP to get from `level` to the next one. */
export function xpForLevel(level: number): number {
  return 50 * level + 50;
}

/** Total XP needed to have *reached* `level`. Level 1 is where everyone starts. */
export function totalXpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Sum of xpForLevel(1..level-1).
  const n = level - 1;
  return 25 * n * n + 75 * n;
}

export type LevelProgress = {
  level: number;
  /** XP earned since reaching this level. */
  into: number;
  /** XP needed to leave it. */
  span: number;
  /** 0-1, for a progress bar. */
  fraction: number;
  totalXp: number;
};

/**
 * The level a given lifetime XP lands on, and how far through it.
 *
 * Solves `25L² + 75L - n = 0` for the largest whole L, then measures the
 * remainder against that level's own span.
 */
export function levelFromXp(totalXp: number): LevelProgress {
  /*
   * `Math.max(0, NaN)` is NaN, not 0 - so clamping alone lets a bad number
   * through and every field downstream becomes NaN. A level rendered as "NaN"
   * on someone's profile is worse than one rendered as 1.
   */
  const xp = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;

  // n = 25L² + 75L  =>  L = (-75 + sqrt(75² + 100n)) / 50
  const solved = (-75 + Math.sqrt(5625 + 100 * xp)) / 50;
  let level = Math.max(1, Math.floor(solved) + 1);

  /*
   * Floating point can put the boundary one either way, and a learner seeing
   * their level flicker between two values would rightly not trust any of it.
   * Two cheap corrections pin it exactly.
   */
  while (totalXpForLevel(level + 1) <= xp) level += 1;
  while (level > 1 && totalXpForLevel(level) > xp) level -= 1;

  const base = totalXpForLevel(level);
  const span = xpForLevel(level);
  const into = xp - base;

  return {
    level,
    into,
    span,
    fraction: span === 0 ? 0 : Math.min(1, into / span),
    totalXp: xp,
  };
}

/** `8.2k` rather than `8213`, which nobody reads as a quantity. */
export function compactXp(value: number): string {
  if (value < 1000) return String(value);
  const thousands = value / 1000;
  return `${thousands >= 100 ? Math.round(thousands) : thousands.toFixed(1)}k`;
}
