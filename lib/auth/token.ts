import { createHmac, randomBytes } from "node:crypto";

/**
 * Session tokens are stored as an HMAC, not a bare hash.
 *
 * The token is already 32 random bytes, so a plain SHA-256 would be safe
 * against guessing - but keying it with `AUTH_SECRET` means a database dump on
 * its own is not enough to recognise a stolen cookie, because the key lives in
 * the environment rather than in the rows.
 *
 * Kept apart from `session.ts` so scripts can hash a token without pulling in
 * `next/headers`, which only exists inside a request.
 */
export function authSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 characters. Generate one with:\n" +
        `  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }
  return secret;
}

export function hashSessionToken(token: string): string {
  return createHmac("sha256", authSecret()).update(token).digest("hex");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
