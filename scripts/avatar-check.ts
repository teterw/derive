/**
 * `pnpm avatar-check` - the upload round trip against the real database.
 *
 * The re-encoding is unit tested. What is not, and cannot be without a
 * database, is that a `bytea` column survives the Neon driver intact, that the
 * route serves exactly the bytes that went in, and that removal actually
 * removes.
 */
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { prepareAvatar } from "../lib/profile/avatar-upload";

const BASE = process.env.AVATAR_CHECK_BASE ?? "http://localhost:3000";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${detail ? ` - ${detail}` : ""}`);
  if (!ok) failures += 1;
}

async function main() {
  console.log("\navatar round trip\n");

  const [user] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .limit(1);
  if (!user) throw new Error("no accounts - run pnpm db:seed:admin");

  // Remember what was there so the check leaves nothing behind.
  const [before] = await db
    .select({
      image: users.avatarImage,
      type: users.avatarType,
      updatedAt: users.avatarUpdatedAt,
    })
    .from(users)
    .where(eq(users.id, user.id));

  const source = await sharp({
    create: {
      width: 900,
      height: 500,
      channels: 3,
      background: { r: 90, g: 82, b: 231 },
    },
  })
    .jpeg()
    .toBuffer();

  const prepared = await prepareAvatar(source);
  check("a photo-shaped file is accepted", prepared.ok);
  if (!prepared.ok) return finish();

  const updatedAt = new Date();
  await db
    .update(users)
    .set({
      avatarImage: prepared.bytes,
      avatarType: prepared.type,
      avatarUpdatedAt: updatedAt,
    })
    .where(eq(users.id, user.id));

  const [stored] = await db
    .select({ image: users.avatarImage, type: users.avatarType })
    .from(users)
    .where(eq(users.id, user.id));

  check("the bytes survive a round trip through bytea", Boolean(stored?.image));
  check(
    "byte for byte",
    Buffer.from(stored!.image!).equals(prepared.bytes),
    `${stored!.image!.length} vs ${prepared.bytes.length} bytes`,
  );

  const response = await fetch(
    `${BASE}/api/avatar/${user.username}?v=${updatedAt.getTime()}`,
  );
  check("the route serves it", response.ok, `HTTP ${response.status}`);
  check(
    "as the type we encoded, not one anybody claimed",
    response.headers.get("content-type") === "image/webp",
    String(response.headers.get("content-type")),
  );
  check(
    "with nosniff, so a browser cannot second-guess that",
    response.headers.get("x-content-type-options") === "nosniff",
  );
  check(
    "and cacheable, because the URL changes when the picture does",
    (response.headers.get("cache-control") ?? "").includes("immutable"),
  );

  const served = Buffer.from(await response.arrayBuffer());
  check("the served bytes are the stored bytes", served.equals(prepared.bytes));

  const meta = await sharp(served).metadata();
  check("and they are still a square WebP", meta.format === "webp" && meta.width === meta.height);

  // Removal.
  await db
    .update(users)
    .set({ avatarImage: null, avatarType: null, avatarUpdatedAt: null })
    .where(eq(users.id, user.id));

  const gone = await fetch(`${BASE}/api/avatar/${user.username}`);
  check("removing it makes the route 404", gone.status === 404);

  const missing = await fetch(`${BASE}/api/avatar/nobody-at-all`);
  check("an unknown username 404s rather than erroring", missing.status === 404);

  // Put back whatever was there.
  await db
    .update(users)
    .set({
      avatarImage: before?.image ?? null,
      avatarType: before?.type ?? null,
      avatarUpdatedAt: before?.updatedAt ?? null,
    })
    .where(eq(users.id, user.id));

  finish();
}

function finish() {
  console.log(
    failures === 0
      ? "\nThe avatar round trip works.\n"
      : `\n${failures} problem(s).\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
