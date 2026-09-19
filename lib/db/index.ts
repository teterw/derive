import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

export type Db = NeonDatabase<typeof schema>;

declare global {
  var __derivePool: Pool | undefined;
}

/**
 * The WebSocket-based Neon driver, not the HTTP one: registration has to
 * redeem the invite code and insert the user in a single transaction, and the
 * HTTP driver has no interactive transactions.
 */
function create(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and fill it in.",
    );
  }
  if (typeof globalThis.WebSocket === "undefined") {
    throw new Error(
      "No global WebSocket. Derive needs Node 22+ for the Neon serverless driver.",
    );
  }
  neonConfig.webSocketConstructor = globalThis.WebSocket;

  /*
   * `max` is the widest fan-out any one page does, not a guess.
   *
   * The statistics page asks for ten aggregates in a `Promise.all`. With a
   * ceiling of five, half of them queued behind the other half - the page did
   * two round trips' worth of waiting while appearing to do one. Ten lets that
   * page resolve in a single wave.
   *
   * It is deliberately not higher. Every connection is a real Postgres backend
   * on Neon, and a serverless deployment multiplies this number by the count of
   * warm instances, so an over-generous ceiling exhausts the database rather
   * than speeding anything up.
   *
   * Reused across hot reloads in dev so we do not leak a pool per edit.
   */
  const pool =
    globalThis.__derivePool ?? new Pool({ connectionString: url, max: 10 });
  if (process.env.NODE_ENV !== "production") globalThis.__derivePool = pool;

  return drizzle(pool, { schema });
}

let cached: Db | undefined;

/**
 * Connecting is deferred to the first query. `next build` imports every route
 * module, including ones that only touch the database at request time, and
 * those builds must not need a live DATABASE_URL.
 */
export const db = new Proxy({} as Db, {
  get(_target, property) {
    cached ??= create();
    const value = Reflect.get(cached, property) as unknown;
    return typeof value === "function" ? value.bind(cached) : value;
  },
});

export { schema };
