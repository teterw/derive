import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

/**
 * Serves an uploaded avatar.
 *
 * Outside `/[locale]` on purpose: a picture has no language, and the proxy
 * already excludes `/api` from locale handling.
 *
 * ## Why this is not behind auth
 *
 * It is behind *obscurity of nothing* - anyone signed in can see every profile
 * anyway, which is the settled answer to §12. Requiring a session here would
 * mean the image could not be cached by the browser across sessions, for a
 * secret that is a cropped 256px square someone chose to show other members.
 * The username is not enumerable to strangers because registration is
 * invite-only.
 *
 * What it does guarantee: the bytes are our own re-encode, the media type is
 * the one we produced rather than one an uploader claimed, and `nosniff` stops
 * a browser second-guessing either.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;

  const [row] = await db
    .select({
      image: users.avatarImage,
      type: users.avatarType,
      updatedAt: users.avatarUpdatedAt,
    })
    .from(users)
    .where(eq(users.username, username.toLowerCase()))
    .limit(1);

  if (!row?.image || !row.type) {
    // No upload: the caller falls back to the generated avatar. 404 rather
    // than a placeholder, so a broken <img> is visible rather than silent.
    return new Response(null, { status: 404 });
  }

  return new Response(new Uint8Array(row.image), {
    headers: {
      "content-type": row.type,
      /*
       * Immutable, because the URL carries `?v=<updatedAt>`: changing your
       * picture changes the URL, so the old one can be cached forever without
       * anyone ever seeing a stale face.
       */
      "cache-control": "public, max-age=31536000, immutable",
      "content-security-policy": "default-src 'none'; sandbox",
      "x-content-type-options": "nosniff",
      etag: `"${row.updatedAt?.getTime() ?? 0}"`,
    },
  });
}
