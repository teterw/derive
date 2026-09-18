import { and, count, eq, gt, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { authFailures } from "@/lib/db/schema";
import { RATE_LIMIT_WINDOW_MS } from "./constants";

/**
 * Best-effort client IP. Vercel sets x-forwarded-for; behind anything else we
 * fall back to a single shared bucket, which throttles harder rather than
 * softer - the safe direction.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function recordFailure(key: string): Promise<void> {
  await db.insert(authFailures).values({ key });
}

export async function failureCount(key: string): Promise<number> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const rows = await db
    .select({ n: count() })
    .from(authFailures)
    .where(and(eq(authFailures.key, key), gt(authFailures.createdAt, since)));
  return rows[0]?.n ?? 0;
}

/** True when any of the given buckets is at or over its limit. */
export async function isRateLimited(
  keys: string[],
  limit: number,
): Promise<boolean> {
  const counts = await Promise.all(keys.map(failureCount));
  return counts.some((n) => n >= limit);
}

export async function clearFailures(key: string): Promise<void> {
  await db.delete(authFailures).where(eq(authFailures.key, key));
}

/** Drops rows that can no longer affect any decision. */
export async function purgeOldFailures(): Promise<void> {
  const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  await db.delete(authFailures).where(lt(authFailures.createdAt, cutoff));
}
