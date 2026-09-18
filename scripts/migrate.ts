/**
 * Applies the SQL files in drizzle/ to DATABASE_URL.
 *
 *   pnpm db:migrate
 *
 * `pnpm db:push` is the quicker loop while the schema is still moving; this is
 * what runs against anything with real data in it.
 */
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { db } from "../lib/db";

migrate(db, { migrationsFolder: "./drizzle" })
  .then(() => {
    console.log("Migrations applied.");
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
