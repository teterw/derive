/**
 * Where in a picture the avatar is taken from.
 *
 * Pure arithmetic, no sharp. It lives apart from `avatar-upload.ts` because
 * the editor is a client component, and importing a single constant from the
 * module that imports sharp drags a native image library towards the browser -
 * the build then fails on `child_process` with a trace pointing at the form
 * rather than at the import. That has now happened twice in this codebase;
 * this file is the answer to it.
 */

/**
 * `cx` and `cy` are the centre of the crop as a fraction of the image, and
 * `zoom` is how far in: 1 means the largest square that fits, 2 means half
 * that side. Fractions rather than pixels, so the same crop survives the
 * downscale on the way in and means the same thing whatever the source size.
 */
export type AvatarCrop = { cx: number; cy: number; zoom: number };

/** The most anyone can zoom in. Past this an avatar is a handful of pixels. */
export const MAX_ZOOM = 4;

/** Dead centre, as much of the picture as a square can hold. */
export const DEFAULT_CROP: AvatarCrop = { cx: 0.5, cy: 0.5, zoom: 1 };

/**
 * Reads a crop off the form, refusing anything that is not a sane number.
 *
 * This arrives from a browser, so it is not trusted: NaN, Infinity, a negative
 * zoom or a centre outside the picture would all otherwise reach sharp's
 * `extract`, which fails with an error about the region rather than about the
 * input - and takes the whole upload down with it.
 */
export function parseCrop(raw: unknown): AvatarCrop | null {
  if (typeof raw !== "string" || raw === "") return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AvatarCrop>;
    const { cx, cy, zoom } = parsed;

    /*
     * `typeof`, not `Number()`. Coercing first lets `null` through as 0, which
     * is a perfectly valid crop - so a malformed payload would silently become
     * "hard against the left edge" instead of falling back to letting the
     * server choose. Wrong quietly is worse than wrong loudly.
     */
    if (typeof cx !== "number" || typeof cy !== "number" || typeof zoom !== "number") {
      return null;
    }
    if (![cx, cy, zoom].every(Number.isFinite)) return null;
    return {
      cx: Math.min(1, Math.max(0, cx)),
      cy: Math.min(1, Math.max(0, cy)),
      zoom: Math.min(MAX_ZOOM, Math.max(1, zoom)),
    };
  } catch {
    return null;
  }
}

/**
 * The square of pixels a crop selects, clamped inside the picture.
 *
 * The arithmetic is the part worth testing: an off-by-one at the edge is the
 * difference between a working crop and sharp refusing the whole upload with
 * "extract_area: bad extract area".
 */
export function cropRegion(
  width: number,
  height: number,
  crop: AvatarCrop,
): { left: number; top: number; width: number; height: number } {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, crop.zoom));

  // At zoom 1 the square is as large as the picture allows.
  const side = Math.max(1, Math.round(Math.min(width, height) / zoom));

  // Round *then* clamp: rounding afterwards can push the region back over the
  // edge by a pixel, which sharp rejects outright rather than trimming.
  const left = Math.min(
    Math.max(0, Math.round(crop.cx * width - side / 2)),
    width - side,
  );
  const top = Math.min(
    Math.max(0, Math.round(crop.cy * height - side / 2)),
    height - side,
  );

  return { left, top, width: side, height: side };
}
