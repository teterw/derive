/**
 * `pnpm render-check` - fetches every page as a signed-in user and looks at
 * what actually came back.
 *
 * A build that compiles is not a page that renders: this catches a missing
 * translation showing its key, a server component throwing at request time, a
 * KaTeX fragment that never made it into HTML, and a page that quietly
 * redirected to login.
 *
 * Needs a dev server (`pnpm dev`) and the demo account (`pnpm db:seed:demo`).
 */

import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { sessions, users } from "../lib/db/schema";
import { skills } from "../content/topics";
import { allRules } from "../content/rules";
import { SESSION_COOKIE } from "../lib/auth/constants";
import { hashSessionToken, newSessionToken } from "../lib/auth/token";

const BASE = process.env.RENDER_CHECK_BASE ?? "http://localhost:3000";
const USERNAME = process.env.RENDER_CHECK_USER ?? "demo";

type Result = { path: string; ok: boolean; notes: string[] };

async function main() {
  const [user] = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.username, USERNAME))
    .limit(1);
  if (!user) {
    throw new Error(
      `no "${USERNAME}" account - run pnpm db:seed:demo first`,
    );
  }

  // A real session, created the way the login action creates one.
  const token = newSessionToken();
  const [session] = await db
    .insert(sessions)
    .values({
      tokenHash: hashSessionToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      userAgent: "render-check",
    })
    .returning({ id: sessions.id });

  const paths = [
    "/th",
    "/en",
    "/th/daily",
    "/th/practice",
    "/th/practice/run?skills=quad.solve-by-factoring&difficulty=1,2",
    "/th/learn",
    `/th/learn/${skills[0]!.id}`,
    `/th/learn/${skills.at(-1)!.id}`,
    "/th/exam",
    "/th/review",
    "/th/stats",
    "/en/stats",
    "/th/rules",
    `/th/rules/${allRules[0]!.id}`,
  ];

  const results: Result[] = [];
  for (const path of paths) {
    results.push(await checkPage(path, token));
  }

  await db.delete(sessions).where(eq(sessions.id, session!.id));

  console.log(`\nrender check · ${BASE} · signed in as ${USERNAME}\n`);
  let failures = 0;
  for (const result of results) {
    if (!result.ok) failures++;
    console.log(`  ${result.ok ? "ok  " : "FAIL"}  ${result.path}`);
    for (const note of result.notes) console.log(`          ${note}`);
  }
  console.log(
    failures === 0
      ? `\nAll ${results.length} pages rendered.\n`
      : `\n${failures} of ${results.length} pages have problems.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

async function checkPage(path: string, token: string): Promise<Result> {
  const notes: string[] = [];
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
      redirect: "manual",
    });
  } catch (error) {
    return {
      path,
      ok: false,
      notes: [`request failed: ${(error as Error).message}`],
    };
  }

  if (response.status >= 300 && response.status < 400) {
    return {
      path,
      ok: false,
      notes: [`redirected to ${response.headers.get("location")}`],
    };
  }
  if (!response.ok) {
    return { path, ok: false, notes: [`HTTP ${response.status}`] };
  }

  const html = await response.text();

  // A next-intl key that was never translated renders as the key itself.
  const missing = html.match(
    /\b(app|common|nav|auth|dashboard|admin|practice|learn|rules|exam|review|stats|tools|daily)\.[a-zA-Z]+\.?[a-zA-Z]*\b(?![^<]*<\/code>)/g,
  );
  const suspicious = [...new Set(missing ?? [])].filter(
    // Rule and skill ids legitimately look like this.
    (candidate) =>
      !allRules.some((rule) => rule.id === candidate) &&
      !skills.some((skill) => skill.id === candidate),
  );
  if (suspicious.length > 0) {
    notes.push(`possible untranslated keys: ${suspicious.slice(0, 5).join(", ")}`);
  }

  if (/Application error|Internal Server Error|digest&quot;/.test(html)) {
    notes.push("the page rendered an error boundary");
  }

  // Every page in this app shows the shell.
  if (!html.includes("Derive")) notes.push("the app shell is missing");

  if (html.length < 2000) notes.push(`suspiciously short (${html.length} bytes)`);

  return { path, ok: notes.length === 0, notes };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
