"use server";

import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { redirect } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { inviteCodes, inviteRedemptions, users } from "@/lib/db/schema";
import {
  INVITE_FAILURE_LIMIT,
  LOGIN_FAILURE_LIMIT,
  PASSWORD_MIN,
} from "./constants";
import { normalizeInviteCode } from "./invite";
import { hashPassword, verifyPassword } from "./password";
import {
  clearFailures,
  clientIp,
  isRateLimited,
  purgeOldFailures,
  recordFailure,
} from "./rate-limit";
import { createSession, destroySession, purgeExpiredSessions } from "./session";
import { isValidUsername, normalizeUsername } from "./username";

/**
 * Actions return an error *key* into `messages.auth.errors`, never a sentence,
 * so both locales stay in the message catalogue.
 */
export type AuthState = { error: string } | null;

function readLocale(formData: FormData): Locale {
  const value = String(formData.get("locale") ?? "");
  return (routing.locales as readonly string[]).includes(value)
    ? (value as Locale)
    : routing.defaultLocale;
}

/** Only ever redirect to a path inside this app. */
function safeNext(raw: FormDataEntryValue | null, locale: Locale): string {
  const value = typeof raw === "string" ? raw : "";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  // The proxy hands us a locale-prefixed path; navigation adds the prefix.
  const stripped = value.replace(new RegExp(`^/${locale}(?=/|$)`), "");
  return stripped || "/";
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = readLocale(formData);
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  const next = safeNext(formData.get("next"), locale);

  if (!username || !password) return { error: "invalidCredentials" };

  const ip = await clientIp();
  const userKey = `login:user:${username}`;
  const ipKey = `login:ip:${ip}`;
  if (await isRateLimited([userKey, ipKey], LOGIN_FAILURE_LIMIT)) {
    return { error: "rateLimited" };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  let ok = false;
  if (user) {
    ok = await verifyPassword(user.passwordHash, password);
  } else {
    // Burn the same work on an unknown username, so response time does not
    // tell an attacker which usernames exist.
    await hashPassword(password);
  }

  if (!user || !ok) {
    await Promise.all([recordFailure(userKey), recordFailure(ipKey)]);
    return { error: "invalidCredentials" };
  }

  await clearFailures(userKey);
  await db
    .update(users)
    .set({ lastSeenAt: new Date() })
    .where(eq(users.id, user.id));
  await createSession(user.id, remember);
  await Promise.all([purgeExpiredSessions(), purgeOldFailures()]);

  redirect({ href: next, locale });
  return null; // unreachable: redirect() throws
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = readLocale(formData);
  const code = normalizeInviteCode(String(formData.get("inviteCode") ?? ""));
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!code) return { error: "inviteRequired" };
  if (!isValidUsername(username)) return { error: "usernameInvalid" };
  if (password.length < PASSWORD_MIN) return { error: "passwordTooShort" };
  if (password !== confirm) return { error: "passwordMismatch" };
  if (!displayName) return { error: "displayNameRequired" };

  const ip = await clientIp();
  const ipKey = `invite:ip:${ip}`;
  if (await isRateLimited([ipKey], INVITE_FAILURE_LIMIT)) {
    return { error: "rateLimited" };
  }

  const [taken] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  if (taken) return { error: "usernameTaken" };

  const passwordHash = await hashPassword(password);

  let result: { error: string } | { userId: string };
  try {
    result = await db.transaction(async (tx) => {
      /**
       * Claiming a use is one conditional UPDATE, so two people redeeming the
       * last use of a code at the same moment cannot both win. The user row
       * and the redemption row go in inside the same transaction, so a code
       * can never be spent without an account to show for it.
       */
      const claimed = await tx
        .update(inviteCodes)
        .set({ uses: sql`${inviteCodes.uses} + 1` })
        .where(
          and(
            eq(inviteCodes.code, code),
            eq(inviteCodes.disabled, false),
            sql`${inviteCodes.uses} < ${inviteCodes.maxUses}`,
            or(
              isNull(inviteCodes.expiresAt),
              gt(inviteCodes.expiresAt, new Date()),
            ),
          ),
        )
        .returning({ id: inviteCodes.id });

      if (claimed.length === 0) {
        const [existing] = await tx
          .select()
          .from(inviteCodes)
          .where(eq(inviteCodes.code, code))
          .limit(1);
        if (!existing) return { error: "inviteInvalid" };
        if (existing.disabled) return { error: "inviteDisabled" };
        if (existing.expiresAt && existing.expiresAt <= new Date()) {
          return { error: "inviteExpired" };
        }
        return { error: "inviteExhausted" };
      }

      const [created] = await tx
        .insert(users)
        .values({ username, passwordHash, displayName, locale })
        .returning({ id: users.id });

      await tx.insert(inviteRedemptions).values({
        inviteCodeId: claimed[0]!.id,
        userId: created!.id,
      });

      return { userId: created!.id };
    });
  } catch (error) {
    // Someone took the username between the check above and the insert.
    if (isUniqueViolation(error)) return { error: "usernameTaken" };
    throw error;
  }

  if ("error" in result) {
    await recordFailure(ipKey);
    return { error: result.error };
  }

  await createSession(result.userId, false);
  redirect({ href: "/", locale });
  return null; // unreachable: redirect() throws
}

export async function logoutAction(formData: FormData): Promise<void> {
  const locale = readLocale(formData);
  await destroySession();
  redirect({ href: "/login", locale });
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "23505"
  );
}
