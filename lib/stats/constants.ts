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

/**
 * XP per attempt, itemised.
 *
 * It used to be one number. Showing a total on its own tells a learner that
 * something happened but not what they did well, which is the part worth
 * knowing - "+2 for no hints" is feedback and "+8" is a noise. So an award is
 * a list of named parts and the runner shows them.
 *
 * The totals land where the single number used to: a plain correct answer is
 * still 4/6/9/13 by difficulty, and a wrong one is still worth something,
 * because turning up and being wrong is how the app is meant to be used.
 */
export type XpPartKey = "answered" | "correct" | "perfect" | "streak";

export type XpPart = { key: XpPartKey; amount: number };

export type XpAward = { parts: XpPart[]; total: number };

/** For answering at all, right or wrong. */
export const XP_ANSWERED = 1;
/** For a correct answer, by difficulty. */
const XP_CORRECT = [0, 3, 5, 8, 12] as const;
/** For getting it right with no hints and no working revealed. */
export const XP_PERFECT = 2;
/** One point per this many consecutive correct answers... */
export const XP_STREAK_EVERY = 3;
/** ...up to this, so a long streak cannot outweigh the question itself. */
export const XP_STREAK_MAX = 5;

export function xpFor(
  difficulty: number,
  correct: boolean,
  extras: {
    /** Consecutive correct answers *including* this one. */
    streak?: number;
    hintsUsed?: number;
    stepsRevealed?: boolean;
  } = {},
): XpAward {
  const parts: XpPart[] = [{ key: "answered", amount: XP_ANSWERED }];

  if (correct) {
    parts.push({
      key: "correct",
      amount: XP_CORRECT[difficulty] ?? XP_CORRECT[1],
    });

    if (!extras.hintsUsed && !extras.stepsRevealed) {
      parts.push({ key: "perfect", amount: XP_PERFECT });
    }

    const streak = Math.max(0, Math.floor(extras.streak ?? 0));
    const bonus = Math.min(XP_STREAK_MAX, Math.floor(streak / XP_STREAK_EVERY));
    if (bonus > 0) parts.push({ key: "streak", amount: bonus });
  }

  return { parts, total: parts.reduce((sum, part) => sum + part.amount, 0) };
}

/** A question answered faster than this was almost certainly not answered. */
export const MIN_PLAUSIBLE_MS = 300;
/** Longer than this and the learner walked away; do not let it skew medians. */
export const MAX_PLAUSIBLE_MS = 15 * 60 * 1000;
