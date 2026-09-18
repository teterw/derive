import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getSessionUser, type SessionUser } from "./session";

/**
 * The real authorisation check. proxy.ts only looks at whether a cookie is
 * present; every protected page and every mutation calls one of these.
 */
export async function requireUser(locale: Locale): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect({ href: "/login", locale });
  return user!;
}

export async function requireAdmin(locale: Locale): Promise<SessionUser> {
  const user = await requireUser(locale);
  if (user.role !== "admin") redirect({ href: "/", locale });
  return user;
}

export { getSessionUser };
export type { SessionUser };
