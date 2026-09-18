import createIntlMiddleware from "next-intl/middleware";
import { hasLocale } from "next-intl";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Next.js 16 renamed `middleware` to `proxy`. Same job, `nodejs` runtime.
 *
 * This is an *optimistic* gate: it only checks whether a session cookie is
 * present, never whether it is valid, because the docs are explicit that proxy
 * is not a session-management layer. Real authorisation happens in
 * `requireUser()` / `requireAdmin()` on every protected page and action.
 */
const intl = createIntlMiddleware(routing);

/** Reachable without a session. Everything else redirects to login. */
const PUBLIC_SEGMENTS = new Set(["login", "register"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const prefixed = hasLocale(routing.locales, segments[0]);
  const locale = prefixed ? segments[0]! : routing.defaultLocale;
  const rest = prefixed ? segments.slice(1) : segments;

  const isPublic = PUBLIC_SEGMENTS.has(rest[0] ?? "");
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!isPublic && !hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.search = "";
    if (rest.length > 0) url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isPublic && hasSessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return intl(request);
}

export const config = {
  /**
   * Everything except API routes, Next internals, and real static files.
   *
   * The file exclusion is anchored to the end of the path on purpose: rule and
   * skill ids contain dots (`/rules/exp.product`, `/learn/quad.formula`), and
   * the usual "any path containing a dot" matcher skips exactly those pages.
   */
  matcher: [
    "/((?!api|_next|_vercel|.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|avif|css|js|mjs|map|txt|xml|json|webmanifest|woff|woff2|ttf|otf|eot|mp4|webm)$).*)",
  ],
};
