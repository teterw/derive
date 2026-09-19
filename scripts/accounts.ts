/**
 * Who exists in the database this `DATABASE_URL` points at.
 *
 * Worth a look before any deploy: the demo and smoke-test accounts have
 * known passwords, which is exactly right for a laptop and exactly wrong for
 * something on the public internet.
 */
import { db } from "../lib/db";
import { users } from "../lib/db/schema";

/** Accounts whose password is written down in this repository. */
const KNOWN_PASSWORD = new Set(["demo", "smoke-test-user"]);

async function main() {
  const rows = await db
    .select({
      username: users.username,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users);

  console.log(`\n${rows.length} account(s)\n`);
  for (const row of rows) {
    const warn = KNOWN_PASSWORD.has(row.username) ? "  <- known password" : "";
    console.log(
      `  ${row.role.padEnd(5)}  ${row.username.padEnd(18)}` +
        `${row.createdAt.toISOString().slice(0, 10)}${warn}`,
    );
  }

  const exposed = rows.filter((row) => KNOWN_PASSWORD.has(row.username));
  console.log(
    exposed.length > 0
      ? `\n${exposed.length} account(s) with a password published in the repo.` +
          `\nFine on a laptop. Remove them before this database serves anything` +
          `\npublic:  pnpm db:seed:demo -- --clean\n`
      : "\nNo known-password accounts.\n",
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
