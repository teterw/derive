import { cookies, headers } from "next/headers";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, users, type User } from "@/lib/db/schema";
import {
  SESSION_COOKIE,
  SESSION_TTL_REMEMBER_MS,
  SESSION_TTL_SHORT_MS,
} from "./constants";
import { hashSessionToken, newSessionToken } from "./token";

export type SessionUser = Omit<User, "passwordHash">;


/**
 * Creates a session row and sets the cookie. The raw token exists only in the
 * cookie; the database holds only its HMAC.
 */
export async function createSession(
  userId: string,
  remember: boolean,
): Promise<void> {
  const token = newSessionToken();
  const ttl = remember ? SESSION_TTL_REMEMBER_MS : SESSION_TTL_SHORT_MS;
  const expiresAt = new Date(Date.now() + ttl);
  const userAgent = (await headers()).get("user-agent")?.slice(0, 512) ?? null;

  await db.insert(sessions).values({
    tokenHash: hashSessionToken(token),
    userId,
    expiresAt,
    userAgent,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Resolves the caller from the session cookie, or null.
 *
 * Sliding refresh: a session more than halfway through its life gets a fresh
 * expiry, so someone practising daily is never logged out mid-session.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const rows = await db
    .select({ session: sessions, user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const { session, user } = row;
  const lifetime = session.expiresAt.getTime() - session.createdAt.getTime();
  const elapsed = Date.now() - session.createdAt.getTime();
  if (lifetime > 0 && elapsed > lifetime / 2) {
    const expiresAt = new Date(Date.now() + lifetime);
    await db
      .update(sessions)
      .set({ expiresAt })
      .where(eq(sessions.id, session.id));
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  }

  const { passwordHash: _passwordHash, ...safe } = user;
  void _passwordHash;
  return safe;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)));
  }
  store.delete(SESSION_COOKIE);
}

/** Housekeeping; cheap enough to call from the login path. */
export async function purgeExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
