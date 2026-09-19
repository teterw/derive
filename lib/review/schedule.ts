/**
 * Spaced repetition, scheduled per **skill** rather than per question.
 *
 * ## Why the skill and not the question
 *
 * Anki schedules the card, because the card is the thing you must recall. Here
 * the questions are generated, so re-showing `(generatorId, seed, difficulty)`
 * on the day it falls due teaches recall of *that answer* - the learner
 * remembers "this one is 3 and -5" without being able to do the next one. The
 * unit actually being learned is the skill, so the skill is what carries the
 * schedule, and a due skill serves a freshly generated question.
 *
 * ## The ladder
 *
 * A fixed set of rungs rather than SM-2 or FSRS. It is legible, it is easy to
 * test, and at this scale the difference in outcome is small. A right answer on
 * a due review climbs one rung; a wrong one drops two, floored at the bottom,
 * because forgetting is not a small setback and the interval that produced the
 * lapse has already been shown to be too long.
 *
 * `ease` exists in the table but nothing reads it yet - it is there so a
 * smarter scheduler can replace this one without a migration.
 */

/** Days between reviews, in order. */
export const LADDER = [1, 3, 7, 16, 35, 90] as const;

/** A skill this often forgotten is not a scheduling problem; it needs teaching. */
export const LEECH_LAPSES = 4;

export type Schedule = {
  intervalDays: number;
  consecutiveCorrect: number;
  lapses: number;
};

/** The rung an interval sits on, or the nearest one below it. */
export function rungOf(intervalDays: number): number {
  let rung = 0;
  for (let i = 0; i < LADDER.length; i += 1) {
    if (LADDER[i]! <= intervalDays) rung = i;
  }
  return rung;
}

/**
 * The schedule after a review.
 *
 * Note that a wrong answer drops the rung but does **not** reset
 * `consecutiveCorrect` to anything other than zero, and increments `lapses`
 * permanently. Lapses never decay: a skill that has been forgotten four times
 * is a skill the learner does not have, however well the fifth attempt goes,
 * and that is worth surfacing rather than smoothing away.
 */
export function afterReview(current: Schedule, correct: boolean): Schedule {
  const rung = rungOf(current.intervalDays);

  if (correct) {
    const next = Math.min(rung + 1, LADDER.length - 1);
    return {
      intervalDays: LADDER[next]!,
      consecutiveCorrect: current.consecutiveCorrect + 1,
      lapses: current.lapses,
    };
  }

  const next = Math.max(0, rung - 2);
  return {
    intervalDays: LADDER[next]!,
    consecutiveCorrect: 0,
    lapses: current.lapses + 1,
  };
}

/** A skill the learner keeps losing. Belongs in Learn, not in the queue. */
export function isLeech(schedule: Schedule): boolean {
  return schedule.lapses >= LEECH_LAPSES;
}

/**
 * Where a skill starts, from what is already known about it.
 *
 * No history is lost by having added this late: `skill_mastery` has been
 * tracking a rolling accuracy all along, and a skill someone is already
 * accurate at does not need asking about tomorrow. Starting everyone at one
 * day would bury them on the first morning and teach them to ignore the count.
 */
export function startingInterval(emaAccuracy: number, attempts: number): number {
  if (attempts === 0) return LADDER[0]!;
  if (emaAccuracy >= 0.9) return 7;
  if (emaAccuracy >= 0.7) return 3;
  return 1;
}

/**
 * Spreads a backfill so nobody signs in to a wall.
 *
 * Every skill coming due on the same morning is the fastest way to make a
 * learner close the app, so due dates are dealt round-robin across days with a
 * ceiling per day. Order is preserved, so the skills that need attention
 * soonest are still dealt first.
 */
export const MAX_DUE_PER_DAY = 20;

export function spreadDueDays(
  count: number,
  perDay = MAX_DUE_PER_DAY,
): number[] {
  return Array.from({ length: count }, (_, index) => Math.floor(index / perDay));
}
