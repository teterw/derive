import { cn } from "@/lib/utils";

/**
 * A generated avatar, drawn from a seed the learner controls.
 *
 * Not an upload. An upload needs blob storage, a moderation story, and a
 * content-type allowlist, and none of that earns its keep on an invite-only
 * study site - whereas "my square doesn't look like anyone else's" is most of
 * what an avatar is actually for.
 *
 * The seed is the only thing stored. The same seed always draws the same
 * picture, on the server and in the browser, so there is nothing to cache and
 * nothing to invalidate.
 */

/**
 * Hues are picked from a fixed wheel rather than anywhere in 360 degrees.
 * Free choice produces muddy olives and sickly yellow-greens next to an indigo
 * interface; these twelve all sit at a chroma that holds up on both surfaces.
 */
const HUES = [
  248, 268, 292, 316, 340, 4, 22, 40, 152, 172, 192, 214,
] as const;

/** A small, stable string hash. Not security; just spread. */
function hash(seed: string): number {
  let value = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    value ^= seed.charCodeAt(index);
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

/**
 * The picture: a 5x5 grid, mirrored down the middle so it reads as a face or a
 * glyph rather than as noise. Two tones of one hue, on a tinted ground.
 */
export function Avatar({
  seed,
  size = 96,
  className,
}: {
  seed: string;
  size?: number;
  className?: string;
}) {
  const h = hash(seed || "derive");
  const hue = HUES[h % HUES.length]!;
  const second = HUES[(h >> 8) % HUES.length]!;

  const cells: { x: number; y: number; tone: 0 | 1 }[] = [];
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 3; x += 1) {
      // One bit per half-cell, drawn from the hash.
      const bit = (h >> ((y * 3 + x) % 24)) & 1;
      const tone = ((h >> ((y * 3 + x + 7) % 24)) & 1) as 0 | 1;
      if (!bit) continue;
      cells.push({ x, y, tone });
      if (x < 2) cells.push({ x: 4 - x, y, tone });
    }
  }

  const ink = `oklch(0.62 0.17 ${hue})`;
  const accent = `oklch(0.74 0.14 ${second})`;
  const ground = `oklch(0.94 0.03 ${hue})`;
  const groundDark = `oklch(0.28 0.05 ${hue})`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 5 5"
      role="img"
      aria-hidden
      className={cn("shrink-0 rounded-full", className)}
    >
      {/*
        The ground is drawn twice, the dark one revealed by the theme. An SVG
        cannot read a CSS variable through `fill` on every browser, but it can
        hide and show a rect, which works everywhere.
      */}
      <rect width="5" height="5" fill={ground} className="dark:hidden" />
      <rect
        width="5"
        height="5"
        fill={groundDark}
        className="hidden dark:block"
      />
      {cells.map((cell) => (
        <rect
          key={`${cell.x}-${cell.y}`}
          x={cell.x}
          y={cell.y}
          width="1"
          height="1"
          fill={cell.tone === 0 ? ink : accent}
        />
      ))}
    </svg>
  );
}

/** How many distinct pictures a learner can cycle through. */
export const AVATAR_SEEDS = 24;

/** The seed for a given slot, so "next avatar" is a number not a string. */
export function avatarSeed(username: string, slot: number): string {
  return `${username}#${((slot % AVATAR_SEEDS) + AVATAR_SEEDS) % AVATAR_SEEDS}`;
}
