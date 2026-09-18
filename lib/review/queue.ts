import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { hasGenerator } from "@/content/generators";
import type { Difficulty, SkillId, TopicId } from "@/content/types";
import type { QuestionRef } from "@/lib/practice/session";

/**
 * ทบทวน · the review queue.
 *
 * A question is in the queue when the **most recent** attempt at that exact
 * question was wrong. Getting it right later takes it out, which is the whole
 * mechanism - there is no separate "mark as learned" for the learner to forget
 * to press.
 *
 * Questions are identified by `(generatorId, seed, difficulty)`, so re-drilling
 * replays the identical question rather than a similar one.
 */
export type ReviewItem = QuestionRef & {
  skillId: SkillId;
  topicId: TopicId;
  missedAt: Date;
};

export async function getReviewQueue(
  userId: string,
  limit = 50,
): Promise<ReviewItem[]> {
  const result = await db.execute(sql`
    select generator_id, seed, difficulty, skill_id, topic_id, created_at
    from (
      select distinct on (generator_id, seed, difficulty)
        generator_id, seed, difficulty, skill_id, topic_id, is_correct, created_at
      from attempts
      where user_id = ${userId}
      order by generator_id, seed, difficulty, created_at desc
    ) latest
    where not is_correct
    order by created_at desc
    limit ${limit}
  `);

  return result.rows
    .map((row) => ({
      generatorId: String(row.generator_id),
      seed: Number(row.seed),
      difficulty: Number(row.difficulty) as Difficulty,
      skillId: String(row.skill_id),
      topicId: String(row.topic_id),
      missedAt: new Date(String(row.created_at)),
    }))
    // A generator that has since been removed cannot be replayed.
    .filter((item) => hasGenerator(item.generatorId));
}

export async function getReviewCount(userId: string): Promise<number> {
  const result = await db.execute(sql`
    select count(*)::int as count
    from (
      select distinct on (generator_id, seed, difficulty) is_correct
      from attempts
      where user_id = ${userId}
      order by generator_id, seed, difficulty, created_at desc
    ) latest
    where not is_correct
  `);
  return Number(result.rows[0]?.count ?? 0);
}

/** Counts per skill, for the review page's breakdown. */
export async function getReviewCountsBySkill(
  userId: string,
): Promise<{ skillId: SkillId; count: number }[]> {
  const result = await db.execute(sql`
    select skill_id, count(*)::int as count
    from (
      select distinct on (generator_id, seed, difficulty)
        skill_id, is_correct
      from attempts
      where user_id = ${userId}
      order by generator_id, seed, difficulty, created_at desc
    ) latest
    where not is_correct
    group by skill_id
    order by count desc
  `);

  return result.rows.map((row) => ({
    skillId: String(row.skill_id),
    count: Number(row.count),
  }));
}
