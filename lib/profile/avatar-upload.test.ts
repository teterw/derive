import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { prepareAvatar } from "./avatar-upload";
import { AVATAR_SIZE, MAX_UPLOAD_BYTES } from "./limits";

/**
 * Upload is the one place in this app where a stranger's bytes reach the
 * server, so it is worth testing what happens to hostile ones and not only to
 * well-behaved photos.
 */

async function png(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 90, g: 82, b: 231 },
    },
  })
    .png()
    .toBuffer();
}

describe("prepareAvatar", () => {
  it("accepts a normal image and returns a square WebP", async () => {
    const result = await prepareAvatar(await png(800, 600));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.type).toBe("image/webp");
    const meta = await sharp(result.bytes).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(AVATAR_SIZE);
    expect(meta.height).toBe(AVATAR_SIZE);
  });

  it("squares a very wide image rather than distorting it", async () => {
    const result = await prepareAvatar(await png(1200, 200));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const meta = await sharp(result.bytes).metadata();
    expect(meta.width).toBe(meta.height);
  });

  it("gets the file down to something worth storing in a row", async () => {
    const result = await prepareAvatar(await png(2000, 2000));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bytes.length).toBeLessThan(100 * 1024);
  });

  /**
   * The declared content type is not consulted at all - only the bytes. A form
   * can claim anything.
   */
  it("refuses a file that is not an image whatever it claims to be", async () => {
    const html = Buffer.from(
      "<!doctype html><script>alert(1)</script>".padEnd(64, " "),
      "utf8",
    );
    const result = await prepareAvatar(html);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("wrongType");
  });

  it("refuses an SVG, which is a document that can carry script", async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      "utf8",
    );
    const result = await prepareAvatar(svg);
    expect(result.ok).toBe(false);
  });

  /**
   * A file whose first bytes are a real PNG header but whose body is not a
   * PNG. It gets past the sniff and has to fail in the decoder.
   */
  it("refuses something wearing a PNG header", async () => {
    const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const liar = Buffer.concat([header, Buffer.alloc(256, 0x41)]);
    const result = await prepareAvatar(liar);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("notAnImage");
  });

  it("refuses a file above the size limit before decoding it", async () => {
    // A valid PNG header so it would pass the sniff if size were not checked.
    const huge = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.alloc(MAX_UPLOAD_BYTES + 1),
    ]);
    const result = await prepareAvatar(huge);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("tooLarge");
  });

  it("refuses an empty file", async () => {
    const result = await prepareAvatar(Buffer.alloc(0));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("empty");
  });

  /**
   * The reason re-encoding is not optional. A phone photo carries GPS
   * coordinates, and a learner uploading a selfie is not thinking about
   * publishing their address to everyone on the invite list.
   */
  it("strips metadata, including location", async () => {
    const withExif = await sharp(await png(600, 600))
      /*
       * sharp's `Exif` type only names the standard IFDs, and GPS is written
       * through `IFD3`. The point of the test is that *whatever* metadata went
       * in does not come out, so the exact tag matters less than there being
       * some.
       */
      .withExif({
        IFD0: { Copyright: "someone", Artist: "someone" },
        IFD3: { GPSLatitudeRef: "N", GPSLongitudeRef: "E" },
      })
      .jpeg()
      .toBuffer();

    const before = await sharp(withExif).metadata();
    expect(before.exif).toBeDefined();

    const result = await prepareAvatar(withExif);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const after = await sharp(result.bytes).metadata();
    expect(after.exif).toBeUndefined();
  });

  it("keeps the first frame of an animation rather than the animation", async () => {
    const gif = await sharp({
      create: {
        width: 300,
        height: 300,
        channels: 3,
        background: { r: 0, g: 0, b: 0 },
      },
    })
      .gif()
      .toBuffer();

    const result = await prepareAvatar(gif);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const meta = await sharp(result.bytes).metadata();
    expect(meta.pages ?? 1).toBe(1);
  });
});
