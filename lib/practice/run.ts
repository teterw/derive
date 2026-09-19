import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { runs } from "@/lib/db/schema";
import type { PracticeConfig } from "./session";

/**
 * Grouping practice attempts into sessions.
 *
 * Exams and dailies have always had a `run_id`, because they have an obvious
 * beginning and end. Practice had none: it is endless by design, so every
 * attempt was recorded loose and the shape of a session was thrown away.
 *
 * That loss is **not backfillable**. Two attempts four minutes apart and two
 * attempts four hours apart look identical afterwards, so every day without
 * this is a day of session structure gone for good. It is worth fixing before
 * more history accumulates rather than after.
 *
 * What it unlocks: questions per session, session length over time, and
 * accuracy as a function of position within a session - the fatigue curve,
 * which is the one that would actually change how the app paces a learner.
 *
 * ## Why there is no "end session" call
 *
 * There is nowhere honest to put one. A learner closes the tab, loses signal,
 * or wanders off; `beforeunload` does not fire reliably and a background timer
 * cannot outlive the page. So a session is defined by a *gap* instead: attempts
 * belong to the same run until a quiet period passes, and the next attempt
 * after that opens a new one. Nothing has to be closed, and a session that
 * ended by someone walking away is recorded exactly as accurately as one that
 * ended by clicking away.
 */

/**
 * How long a session survives without an attempt.
 *
 * Twenty-five minutes is long enough to cover reading an explanation, working
 * something out on paper, or a short interruption, and short enough that
 * coming back after dinner starts a new session rather than recording a
 * six-hour one.
 */
export const SESSION_GAP_MS = 25 * 60 * 1000;

/**
 * The run this attempt belongs to, opening one if the last was long enough ago.
 *
 * Returns null rather than throwing if anything goes wrong: a practice attempt
 * that records without a run id is a small loss, and one that fails to record
 * because the grouping broke is a much bigger one.
 */
export async function currentPracticeRunId(
  userId: string,
  mode: "practice" | "review",
  config?: PracticeConfig,
): Promise<string | null> {
  try {
    const since = new Date(Date.now() - SESSION_GAP_MS);

    const [open] = await db
      .select({ id: runs.id })
      .from(runs)
      .where(
        and(
          eq(runs.userId, userId),
          eq(runs.mode, mode),
          gt(runs.lastAttemptAt, since),
        ),
      )
      .orderBy(desc(runs.lastAttemptAt))
      .limit(1);

    if (open) {
      await db
        .update(runs)
        .set({
          lastAttemptAt: new Date(),
          total: sql`${runs.total} + 1`,
        })
        .where(eq(runs.id, open.id));
      return open.id;
    }

    const [created] = await db
      .insert(runs)
      .values({
        userId,
        mode,
        config: config ?? { skillIds: [], difficulties: [] },
        total: 1,
        lastAttemptAt: new Date(),
      })
      .returning({ id: runs.id });

    return created?.id ?? null;
  } catch {
    return null;
  }
}

/** Marks a session correct-count up. Separate so a failure here cannot lose the attempt. */
export async function countPracticeCorrect(runId: string): Promise<void> {
  try {
    await db
      .update(runs)
      .set({ correct: sql`${runs.correct} + 1` })
      .where(eq(runs.id, runId));
  } catch {
    // The attempt row is the source of truth; this is a convenience column.
  }
}
