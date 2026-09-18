/**
 * Creates the first admin from ADMIN_BOOTSTRAP_USERNAME / _PASSWORD.
 *
 *   pnpm db:seed:admin
 *
 * Idempotent: running it again promotes the existing user to admin and resets
 * their password to the one in the environment, rather than failing.
 */
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { hashPassword } from "../lib/auth/password";
import { normalizeUsername, isValidUsername } from "../lib/auth/username";
import { PASSWORD_MIN } from "../lib/auth/constants";

async function main() {
  const rawUsername = process.env.ADMIN_BOOTSTRAP_USERNAME;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;

  if (!rawUsername || !password) {
    throw new Error(
      "Set ADMIN_BOOTSTRAP_USERNAME and ADMIN_BOOTSTRAP_PASSWORD in .env first.",
    );
  }

  const username = normalizeUsername(rawUsername);
  if (!isValidUsername(username)) {
    throw new Error(
      `ADMIN_BOOTSTRAP_USERNAME "${rawUsername}" is not a valid username.`,
    );
  }
  if (password.length < PASSWORD_MIN) {
    throw new Error(
      `ADMIN_BOOTSTRAP_PASSWORD must be at least ${PASSWORD_MIN} characters.`,
    );
  }

  const passwordHash = await hashPassword(password);
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({ role: "admin", passwordHash })
      .where(eq(users.id, existing.id));
    console.log(`Updated existing user "${username}" to admin.`);
  } else {
    await db.insert(users).values({
      username,
      passwordHash,
      displayName: rawUsername,
      role: "admin",
    });
    console.log(`Created admin "${username}".`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
