import sharp from "sharp";
import { ACCEPTED_TYPES, AVATAR_SIZE, MAX_UPLOAD_BYTES } from "./limits";
import { cropRegion, type AvatarCrop } from "./crop";

/**
 * Turning an uploaded file into an avatar we are willing to serve.
 *
 * The rule here is that **nothing the uploader sent is kept**. Not the bytes,
 * not the declared media type, not the filename. The image is decoded and
 * re-encoded by us, and what lands in the database is our output.
 *
 * That single decision handles most of what makes image upload risky:
 *
 * - **EXIF is dropped.** Phone photos carry GPS coordinates. A learner
 *   uploading a selfie should not be publishing where they live to everyone
 *   else on the invite list, and they will not think to check.
 * - **Polyglot files stop working.** A file that is a valid GIF *and* a valid
 *   HTML document is a real technique for getting script executed from an
 *   image URL. Re-encoding produces a plain image and nothing else.
 * - **The media type becomes ours.** The browser is told what we encoded, not
 *   what the form claimed, so there is nothing to sniff.
 * - **Decompression bombs are bounded.** A 4KB PNG can declare 40000x40000
 *   pixels; `limitInputPixels` refuses before allocating.
 */


/**
 * A ceiling on decoded pixels, not on file size. Sharp refuses anything above
 * this before allocating, which is what stops a small file that claims to be
 * enormous from taking the process down.
 */
const MAX_INPUT_PIXELS = 50_000_000;

export type AvatarResult =
  | { ok: true; bytes: Buffer; type: string }
  | { ok: false; error: "tooLarge" | "wrongType" | "notAnImage" | "empty" };


/**
 * Checks the *bytes*, not the declared type.
 *
 * A form can claim any content type it likes. These are the magic numbers the
 * accepted formats actually start with, so a file claiming to be a PNG while
 * being something else is rejected here rather than reaching the decoder.
 */
function sniff(bytes: Buffer): string | null {
  if (bytes.length < 12) return null;

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.subarray(0, 3).toString("latin1") === "GIF") return "image/gif";
  if (
    bytes.subarray(0, 4).toString("latin1") === "RIFF" &&
    bytes.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * The whole pipeline: check, decode, square, re-encode.
 *
 * Returns a discriminated result rather than throwing, because every one of
 * these failures is a thing a person did rather than a fault, and each needs
 * its own message in two languages.
 */
export async function prepareAvatar(
  input: Buffer,
  crop?: AvatarCrop | null,
): Promise<AvatarResult> {
  if (input.length === 0) return { ok: false, error: "empty" };
  if (input.length > MAX_UPLOAD_BYTES) return { ok: false, error: "tooLarge" };

  const sniffed = sniff(input);
  if (!sniffed || !ACCEPTED_TYPES.includes(sniffed as (typeof ACCEPTED_TYPES)[number])) {
    return { ok: false, error: "wrongType" };
  }

  try {
    /*
     * `rotate()` first, always. It applies the EXIF orientation and drops the
     * EXIF with it - and it has to happen before anything reads the width and
     * height, because a portrait photo off a phone is very often stored
     * landscape with a "turn me" flag. Cropping the stored orientation would
     * take the square from the wrong part of the picture entirely.
     */
    const upright = sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS,
      // An animated GIF becomes its first frame; an avatar does not animate.
      animated: false,
    }).rotate();

    const prepared = await upright.toBuffer();
    const meta = await sharp(prepared).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (width === 0 || height === 0) return { ok: false, error: "notAnImage" };

    const pipeline = sharp(prepared);

    if (crop) {
      pipeline.extract(cropRegion(width, height, crop));
    }

    const bytes = await pipeline
      .resize(AVATAR_SIZE, AVATAR_SIZE, {
        fit: "cover",
        // Without a chosen crop, guess at the interesting part.
        position: crop ? "centre" : "attention",
      })
      .webp({ quality: 82 })
      .toBuffer();

    return { ok: true, bytes, type: "image/webp" };
  } catch {
    // Sniffed right but would not decode: truncated, or malformed on purpose.
    return { ok: false, error: "notAnImage" };
  }
}

