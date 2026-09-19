/**
 * Refuses to run a development-only script against a production database.
 *
 * The demo account's password is written down in this repository. That is the
 * right trade on a laptop and a credential leak the moment the database is
 * reachable from the internet, and "remember not to run it" is not a control -
 * it is a hope. This is the control.
 *
 * Two independent signals, because either alone has a hole: `NODE_ENV` is
 * trivially unset in a shell, and a local database could in principle be
 * seeded from a production dump. Tripping on either is the safe direction.
 */

/** Hosts that are unambiguously a developer's own machine. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

export type GuardResult =
  | { safe: true }
  | { safe: false; reason: string };

/** Exported separately from the exit so it can be tested without killing the runner. */
export function checkNotProduction(
  env: string | undefined,
  databaseUrl: string | undefined,
): GuardResult {
  if (env === "production") {
    return { safe: false, reason: "NODE_ENV is production" };
  }

  if (!databaseUrl) {
    // No database configured at all - nothing to damage, and the script will
    // fail for its own reasons soon enough.
    return { safe: true };
  }

  let host: string;
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    return { safe: false, reason: "DATABASE_URL could not be parsed" };
  }

  if (LOCAL_HOSTS.has(host)) return { safe: true };

  /*
   * A Neon branch with "dev" or "test" in its hostname is a normal way to keep
   * a scratch database, and refusing those would make the guard so annoying
   * that someone disables it - which is how guards die.
   */
  if (/\b(dev|test|staging|local|preview)\b/.test(host)) return { safe: true };

  return {
    safe: false,
    reason: `DATABASE_URL points at ${host}, which does not look like a development database`,
  };
}

/** Call at the top of any script that must never touch production. */
export function refuseInProduction(scriptName: string): void {
  const result = checkNotProduction(
    process.env.NODE_ENV,
    process.env.DATABASE_URL,
  );
  if (result.safe) return;

  console.error(
    `\n${scriptName} refused to run: ${result.reason}.\n\n` +
      "This script writes an account whose password is published in this\n" +
      "repository. If you genuinely mean to run it against this database,\n" +
      "set DERIVE_I_MEAN_IT=yes for this one command.\n",
  );

  if (process.env.DERIVE_I_MEAN_IT === "yes") {
    console.error("DERIVE_I_MEAN_IT is set - continuing anyway.\n");
    return;
  }

  process.exit(1);
}
