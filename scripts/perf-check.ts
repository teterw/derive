/**
 * `pnpm perf` - how long each page actually takes to serve.
 *
 * Every page here is server-rendered against a database in another country,
 * so the number that decides whether the app feels fast is time-to-first-byte,
 * not bundle size. Bundle size decides how long it takes to become
 * interactive *after* that, which matters second.
 *
 * Each page is fetched several times and the median reported: a single timing
 * measures whatever else the machine was doing.
 */
import { get as httpGet } from "node:http";
import { get as httpsGet } from "node:https";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { sessions, users } from "../lib/db/schema";
import { SESSION_COOKIE } from "../lib/auth/constants";
import { hashSessionToken, newSessionToken } from "../lib/auth/token";

const BASE = process.env.PERF_BASE ?? "http://localhost:3000";
const RUNS = Number(process.env.PERF_RUNS ?? 5);

/** Above this, a page feels like it is loading rather than appearing. */
const SLOW_MS = 500;

/**
 * Bytes actually sent, not bytes after decompression.
 *
 * `fetch` transparently gunzips, so measuring the body it returns overstates
 * the transfer four to six times - this app's HTML is repetitive KaTeX markup
 * and compresses very well. Reporting the decompressed figure would have sent
 * someone optimising a page that is already small on the wire.
 */
function wireBytes(
  url: string,
  cookie: string,
): Promise<{ bytes: number; ttfb: number; status: number; served: string }> {
  return new Promise((resolve, reject) => {
    // `PERF_BASE` can be the deployment, so this has to speak both.
    const get = url.startsWith("https:") ? httpsGet : httpGet;
    const started = performance.now();
    const request = get(
      url,
      {
        headers: { cookie, "accept-encoding": "gzip, deflate, br" },
      },
      (response) => {
        /*
         * Time to first byte, measured separately from the total.
         *
         * Against a deployment these two answer different questions. The total
         * includes the transfer, which is this machine's connection; the first
         * byte is the server thinking, which is the thing any change here can
         * do something about. When the deployment was in the wrong region they
         * differed by a second.
         */
        let ttfb = 0;
        let bytes = 0;
        response.once("data", () => {
          ttfb = performance.now() - started;
        });
        response.on("data", (chunk: Buffer) => {
          bytes += chunk.length;
        });
        response.on("end", () =>
          resolve({
            bytes,
            ttfb,
            status: response.statusCode ?? 0,
            /*
             * `x-vercel-id` names the regions that handled the request, edge
             * first. Worth printing, because "the functions are not where the
             * database is" is invisible from the timings alone and is the
             * single biggest thing that can be wrong here - see CLAUDE.md.
             */
            served: String(response.headers["x-vercel-id"] ?? ""),
          }),
        );
      },
    );
    request.on("error", reject);
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

async function main() {
  const [user] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .limit(1);
  if (!user) throw new Error("no accounts - run pnpm db:seed:admin");

  const token = newSessionToken();
  const [session] = await db
    .insert(sessions)
    .values({
      tokenHash: hashSessionToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      userAgent: "perf-check",
    })
    .returning({ id: sessions.id });

  const paths = [
    "/th",
    "/th/daily",
    "/th/practice",
    "/th/practice/run?skills=quad.formula&difficulty=2",
    "/th/learn",
    "/th/exam",
    "/th/review",
    "/th/stats",
    "/th/rules",
    "/th/people",
    `/th/u/${user.username}`,
    "/th/settings",
  ];

  console.log(`\nperf · ${BASE} · median of ${RUNS} · signed in as ${user.username}\n`);

  const results: { path: string; ms: number; bytes: number; ttfb: number }[] = [];
  let served = "";

  for (const path of paths) {
    const timings: number[] = [];
    let bytes = 0;

    // One warm-up that is not measured: the first hit of a route in Next
    // compiles nothing in production but does fill caches and open the
    // database pool, and timing that measures the pool, not the page.
    await fetch(`${BASE}${path}`, {
      headers: { cookie: `${SESSION_COOKIE}=${token}` },
    }).then((r) => r.text());

    for (let i = 0; i < RUNS; i += 1) {
      const started = performance.now();
      const response = await fetch(`${BASE}${path}`, {
        headers: { cookie: `${SESSION_COOKIE}=${token}` },
      });
      await response.text();
      timings.push(performance.now() - started);
    }

    const probe = await wireBytes(`${BASE}${path}`, `${SESSION_COOKIE}=${token}`);
    bytes = probe.bytes;
    /*
     * A redirect is not a page. Without this the run silently measures the
     * proxy bouncing an unauthenticated request to the login screen and
     * reports it as a fast page - which is exactly what it looks like.
     */
    if (probe.status >= 300 && probe.status < 400) {
      throw new Error(
        `${path} returned ${probe.status} - the session was not accepted, so nothing here is a real page timing.`,
      );
    }
    results.push({ path, ms: median(timings), bytes, ttfb: probe.ttfb });
    if (!served && probe.served) served = probe.served;
  }

  if (served) console.log(`  served by: ${served}
`);

  await db.delete(sessions).where(eq(sessions.id, session!.id));

  const worst = Math.max(...results.map((r) => r.ms));
  for (const result of results) {
    const bar = "#".repeat(Math.max(1, Math.round((result.ms / worst) * 32)));
    const flag = result.ms > SLOW_MS ? " SLOW" : "";
    console.log(
      `  ${String(Math.round(result.ttfb)).padStart(5)}ms ttfb  ` +
        `${String(Math.round(result.ms)).padStart(5)}ms total  ` +
        `${String(Math.round(result.bytes / 1024)).padStart(4)}KB  ` +
        `${bar.padEnd(33)} ${result.path}${flag}`,
    );
  }

  const slow = results.filter((r) => r.ms > SLOW_MS);
  console.log(
    slow.length === 0
      ? `\nEvery page under ${SLOW_MS}ms.\n`
      : `\n${slow.length} page(s) over ${SLOW_MS}ms.\n`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
