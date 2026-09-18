/** A day counts towards a streak once this many questions are answered. */
export const STREAK_MIN_ATTEMPTS = 10;

/** Smoothing for per-skill accuracy. Lower forgets more slowly. */
export const EMA_ALPHA = 0.2;

/** Below this many attempts a skill shows no level at all, only "not started". */
export const MASTERY_MIN_ATTEMPTS = 5;

/** ยังไม่เริ่ม / กำลังเรียน / ชำนาญ / แม่นยำ */
export const MASTERY_LEVELS = [0, 1, 2, 3] as const;
export type MasteryLevel = (typeof MASTERY_LEVELS)[number];

export const MASTERY_THRESHOLDS = { learning: 0.7, proficient: 0.9 } as const;

export function masteryLevel(attempts: number, ema: number): MasteryLevel {
  if (attempts < MASTERY_MIN_ATTEMPTS) return 0;
  if (ema < MASTERY_THRESHOLDS.learning) return 1;
  if (ema < MASTERY_THRESHOLDS.proficient) return 2;
  return 3;
}

/** XP per attempt, weighted by difficulty. Deliberately simple for now. */
export function xpFor(difficulty: number, correct: boolean): number {
  const base = [0, 4, 6, 9, 13][difficulty] ?? 4;
  return correct ? base : Math.round(base / 3);
}

/** A question answered faster than this was almost certainly not answered. */
export const MIN_PLAUSIBLE_MS = 300;
/** Longer than this and the learner walked away; do not let it skew medians. */
export const MAX_PLAUSIBLE_MS = 15 * 60 * 1000;
