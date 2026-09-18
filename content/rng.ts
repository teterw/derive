import type { RNG } from "./types";

/**
 * mulberry32. Small, fast, and good enough for question parameters.
 *
 * Generators must use this and never `Math.random()`: every question has to be
 * reproducible from `(generatorId, seed, difficulty)` so a missed question can
 * be replayed exactly and tests are deterministic (PROMPT.md §6.2).
 */
export function createRng(seed: number): RNG {
  let state = seed >>> 0;

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  const rng: RNG = {
    seed: seed >>> 0,
    next,
    int(min, max) {
      if (max < min) throw new Error(`int(${min}, ${max}): empty range`);
      return min + Math.floor(next() * (max - min + 1));
    },
    nonZeroInt(min, max) {
      if (min > 0 || max < 0) return rng.int(min, max);
      // Draw from the range with 0 removed, then step over the gap.
      const size = max - min; // one fewer than the full range
      if (size < 1) throw new Error(`nonZeroInt(${min}, ${max}): empty range`);
      const drawn = min + Math.floor(next() * size);
      return drawn >= 0 ? drawn + 1 : drawn;
    },
    pick(items) {
      if (items.length === 0) throw new Error("pick: empty array");
      return items[rng.int(0, items.length - 1)]!;
    },
    sign() {
      return next() < 0.5 ? -1 : 1;
    },
    bool(p = 0.5) {
      return next() < p;
    },
    shuffle(items) {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      }
      return copy;
    },
  };

  return rng;
}

/**
 * Seed for the daily challenge: the same five questions for everyone on a
 * given Asia/Bangkok day (docs/CONTENT-PIPELINE.md §6).
 */
export function seedFromString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
