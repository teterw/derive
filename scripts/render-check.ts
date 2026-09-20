/**
 * `pnpm render-check` - fetches every page as a signed-in user and looks at
 * what actually came back.
 *
 * A build that compiles is not a page that renders: this catches a missing
 * translation showing its key, a server component throwing at request time, a
 * KaTeX fragment that never made it into HTML, and a page that quietly
 * redirected to login.
 *
 * Needs a server already listening on `RENDER_CHECK_BASE` (it does not start
 * one) and at least one account in the database. It prefers `demo`, which has
 * history to render, but any account will do.
 */

import { JSDOM } from "jsdom";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { sessions, users } from "../lib/db/schema";
import { skills, topics } from "../content/topics";
import { allRules } from "../content/rules";
import { SESSION_COOKIE } from "../lib/auth/constants";
import { hashSessionToken, newSessionToken } from "../lib/auth/token";

const BASE = process.env.RENDER_CHECK_BASE ?? "http://localhost:3000";
const USERNAME = process.env.RENDER_CHECK_USER ?? "demo";

type Result = { path: string; ok: boolean; notes: string[] };

/**
 * Things a specific page must actually contain.
 *
 * The generic checks below catch a page that broke; these catch a page that
 * rendered fine while quietly having lost a feature - a skill formula that
 * stopped being passed down, a mnemonic section that fell out of the JSX. Both
 * have the same symptom, which is nothing at all.
 */
const EXPECTED: { path: string; needle: string; what: string }[] = [
  {
    path: "/th/practice",
    // Only the quadratic-formula skill tile puts this on the setup page.
    needle: "4ac",
    what: "the skill formulas beside the checkboxes",
  },
  {
    path: "/th/rules/quad.perfect-square-trinomial",
    needle: "หน้ากำลังสอง บวกสองหน้าหลัง",
    what: "the Thai mnemonic",
  },
  {
    path: "/th/rules",
    needle: "ผลบวก คูณ ผลต่าง",
    what: "mnemonics on the rule index",
  },
];

async function main() {
  /*
   * Prefer the demo account, but do not require it.
   *
   * Removing the demo account is the right thing to do before this database
   * serves anything public - and it used to break this script, so following
   * the security advice cost you your ability to check the pages render. Any
   * account will do: the check is that pages render for a signed-in user, not
   * that they render for one particular user.
   */
  const [user] =
    (await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.username, USERNAME))
      .limit(1)) ??
    [];

  const [fallback] = user
    ? []
    : await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .limit(1);

  const signedInAs = user ?? fallback;
  if (!signedInAs) {
    throw new Error(
      "no accounts at all - run pnpm db:seed:admin, or pnpm db:seed:demo",
    );
  }

  // A real session, created the way the login action creates one.
  const token = newSessionToken();
  const [session] = await db
    .insert(sessions)
    .values({
      tokenHash: hashSessionToken(token),
      userId: signedInAs.id,
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
    /*
     * One runner per topic. The runner is where the tool dock lives, and the
     * dock is handed the whole rule registry - so it is the page that breaks
     * when something that cannot cross to a client component gets into a rule.
     */
    ...topics.map(
      (topic) =>
        `/th/practice/run?skills=${topic.skillIds[0]}&difficulty=1,2`,
    ),
    "/th/learn",
    `/th/learn/${skills[0]!.id}`,
    `/th/learn/${skills.at(-1)!.id}`,
    "/th/exam",
    "/th/review",
    "/th/stats",
    "/en/stats",
    "/th/rules",
    `/th/rules/${allRules[0]!.id}`,
    // A rule that carries a Thai mnemonic, so `EXPECTED` below can check it.
    "/th/rules/quad.perfect-square-trinomial",
    "/th/people",
    "/th/settings",
    `/th/u/${signedInAs.username}`,
  ];

  const results: Result[] = [];
  for (const path of paths) {
    results.push(await checkPage(path, token));
  }

  await db.delete(sessions).where(eq(sessions.id, session!.id));

  console.log(
    `\nrender check · ${BASE} · signed in as ${signedInAs.username}\n`,
  );
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

/**
 * The accessibility failures that can honestly be judged from served HTML.
 *
 * Three of them: a control with no accessible name, an image with no alt at
 * all, and a page with no heading or with several. Each was real when this was
 * written - the practice runner had no h1, and the daily page had two because
 * the results block brought its own.
 *
 * ## What is deliberately not here, and why
 *
 * Whether a field has a label cannot be answered from this response, and the
 * attempt is recorded because the failure was instructive. React streams: a
 * checkbox on the exam page arrives as a bare `<input>` inside
 * `<div hidden id="S:2">`, and a script later moves it inside the `<label>`
 * that rendered in the shell. Reading the bytes finds an input with no label
 * and is wrong - the live DOM has all fourteen correctly labelled.
 *
 * Two workarounds were tried and both were worse. Skipping `[hidden]` content
 * reported every page as having no h1, because the staging areas are where most
 * of a streamed page lives. Treating a control as labelled if any copy of it is
 * labelled did not help either, because the orphan is the only copy there is.
 *
 * Answering it properly needs a browser that runs the placement scripts, which
 * is a heavier dependency than this check is worth today. The labelling audit
 * that found the formula page's unnamed search box and topic filter was done by
 * hand against the live DOM, which is the only place the question has an answer.
 */
function accessibilityNotes(html: string): string[] {
  const { window } = new JSDOM(html);
  const doc = window.document;
  const notes: string[] = [];

  const named = (el: Element): boolean =>
    (
      el.getAttribute("aria-label") ??
      el.getAttribute("title") ??
      el.textContent ??
      ""
    ).trim() !== "" || el.querySelector("img[alt]:not([alt=''])") !== null;

  const nameless = [...doc.querySelectorAll("button, a[href]")].filter(
    (el) => !named(el),
  );
  if (nameless.length > 0) {
    notes.push(`${nameless.length} control(s) with no accessible name`);
  }

  // `alt=""` is a decision - the image is decorative. No alt at all is not.
  const noAlt = [...doc.querySelectorAll("img")].filter(
    (el) => el.getAttribute("alt") === null,
  );
  if (noAlt.length > 0) notes.push(`${noAlt.length} image(s) with no alt`);

  const h1s = doc.querySelectorAll("h1").length;
  if (h1s === 0) notes.push("no h1");
  if (h1s > 1) notes.push(`${h1s} h1 elements - a page has one beginning`);

  window.close();
  return notes;
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

  /*
   * The app's own error boundary, not Next's.
   *
   * This used to look only for "Application error" and friends, which are the
   * strings Next puts on *its* error page. `app/[locale]/error.tsx` is ours and
   * its text is a translated message, so a page that had thrown and rendered
   * nothing but the error boundary came back 200, carried the shell, shipped
   * KaTeX's stylesheet, and was reported `ok`. Four of the five modes were
   * broken and this script said every page rendered.
   */
  if (html.includes("data-error-boundary")) {
    notes.push("the page rendered the error boundary");
  }

  /*
   * And the case where the boundary is not in the HTML at all.
   *
   * When what throws is the *serialisation* of props for a client component -
   * "Functions cannot be passed directly to Client Components" - the server
   * still streams a 200 with the shell in it, and the error page only appears
   * once the client picks the stream apart. Nothing a reader of the bytes
   * recognises as an error is on the page: no "Application error", no boundary
   * markup, and the Thai title is in the message bundle of every page anyway.
   *
   * What *is* there is the flight stream's own record of the throw, one
   * `E{"digest":"..."}` row per boundary that caught it. A page that rendered
   * has none. This is the check that would have caught four of the app's five
   * modes going down, and did not.
   */
  const thrown = /E\{\\*"digest\\*":\\*"(\w+)/.exec(html);
  if (thrown) {
    notes.push(`a server component threw (digest ${thrown[1]})`);
  }

  if (/Application error|Internal Server Error/.test(html)) {
    notes.push("the page rendered Next's own error page");
  }

  notes.push(...accessibilityNotes(html));

  // Every page in this app shows the shell.
  if (!html.includes("Derive")) notes.push("the app shell is missing");

  if (html.length < 2000) notes.push(`suspiciously short (${html.length} bytes)`);

  /**
   * KaTeX markup without KaTeX's stylesheet renders as collapsed fractions and
   * missing radical signs - the HTML looks right and the page does not. Any
   * page showing maths must ship the stylesheet with it.
   */
  if (html.includes('class="katex')) {
    const stylesheets = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)]
      .map((match) => match[1]!)
      .concat(
        [...html.matchAll(/<link[^>]+href="([^"]+)"[^>]+rel="stylesheet"/g)].map(
          (match) => match[1]!,
        ),
      );

    let styled = false;
    for (const href of new Set(stylesheets)) {
      const css = await fetch(new URL(href, BASE)).then(
        (response) => (response.ok ? response.text() : ""),
        () => "",
      );
      if (css.includes(".katex")) {
        styled = true;
        break;
      }
    }
    if (!styled) notes.push("maths is on the page but KaTeX's stylesheet is not");
  }

  for (const expectation of EXPECTED) {
    if (expectation.path !== path) continue;
    if (!html.includes(expectation.needle)) {
      notes.push(`${expectation.what} is missing`);
    }
  }

  return { path, ok: notes.length === 0, notes };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
