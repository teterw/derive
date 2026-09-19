/**
 * Turns the supplied logo PNG into the assets the app actually needs.
 *
 * The original is a 1242px square on an opaque white background. That is the
 * right thing to hand a designer and the wrong thing to put in a dark-mode
 * header, so this makes white transparent, trims the surrounding space, and
 * cuts two crops: the mark on its own for the header and the icons, and the
 * full lockup for the sign-in page.
 *
 * Run once, by hand:  node scripts/build-logo.mjs "<path to the original>"
 * The outputs are committed; this is not part of the build.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2];
if (!source) {
  console.error('usage: node scripts/build-logo.mjs "<path to logo.png>"');
  process.exit(1);
}

/**
 * Prepares the source for cropping, and reports the mark's colour.
 *
 * **If the artwork already has an alpha channel, it is left alone.** The first
 * version of this script assumed a white background and rebuilt the alpha from
 * distance-to-white. The supplied logo already had clean transparency, so that
 * work was not merely wasted - it was destructive, scattering dark speckles
 * through the letterform where it un-premultiplied noise that was never there.
 *
 * Only artwork that genuinely arrives on opaque white gets the white removed,
 * and then the mark is filled with one flat colour so antialiased edges cannot
 * pick up noise.
 */
async function prepare(input) {
  const meta = await sharp(input).metadata();

  if (meta.hasAlpha) {
    const buffer = await sharp(input).png().toBuffer();
    return { buffer, ink: await sampleInk(buffer) };
  }

  console.log("  (source is opaque - removing the white background)");
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Ink colour first, from the pixels that are clearly not background.
  const opaque = [];
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235) continue;
    opaque.push([data[i], data[i + 1], data[i + 2]]);
  }
  const ink = modeColour(opaque);

  for (let i = 0; i < data.length; i += info.channels) {
    const distance = 255 - Math.min(data[i], data[i + 1], data[i + 2]);
    data[i] = ink.r;
    data[i + 1] = ink.g;
    data[i + 2] = ink.b;
    data[i + 3] = Math.min(255, Math.round(distance * 1.15));
  }

  const buffer = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();

  return { buffer, ink };
}

/** The mark's colour: the pixels that are actually drawn, not the background. */
async function sampleInk(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const drawn = [];
  for (let i = 0; i < data.length; i += info.channels) {
    // Fully transparent pixels carry RGB 0,0,0 - counting them reports the
    // logo as black, which is exactly what the first version of this did.
    if (data[i + 3] < 200) continue;
    drawn.push([data[i], data[i + 1], data[i + 2]]);
  }
  return modeColour(drawn);
}

/**
 * The most common colour in a list, not the average of it.
 *
 * Averaging mixes in every antialiased edge pixel and lands somewhere between
 * the mark and its background. Colours are bucketed 8 levels per channel so a
 * shade gathers with its neighbours, then the winning bucket is averaged for a
 * precise value.
 */
function modeColour(pixels) {
  if (pixels.length === 0) throw new Error("no mark found in the artwork");
  const buckets = new Map();
  for (const [r, g, b] of pixels) {
    const key = `${r >> 5}:${g >> 5}:${b >> 5}`;
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }
  const winner = [...buckets.values()].reduce((best, each) =>
    each.n > best.n ? each : best,
  );
  return {
    r: Math.round(winner.r / winner.n),
    g: Math.round(winner.g / winner.n),
    b: Math.round(winner.b / winner.n),
  };
}

const { buffer: transparent, ink } = await prepare(source);
const { width, height } = await sharp(transparent).metadata();

/**
 * The lockup is the mark above the word. Splitting at 62% of the height puts
 * the cut in the gap between them; `trim` then tightens each piece to its own
 * ink, so neither carries the other's whitespace.
 */
const markBox = { left: 0, top: 0, width, height: Math.round(height * 0.62) };

const outDir = join(root, "public", "brand");
await mkdir(outDir, { recursive: true });

async function write(name, pipeline) {
  const buffer = await pipeline.toBuffer();
  await writeFile(join(outDir, name), buffer);
  const meta = await sharp(buffer).metadata();
  console.log(
    `  ${name.padEnd(22)} ${meta.width}x${meta.height}  ${(buffer.length / 1024).toFixed(1)}KB`,
  );
}

console.log("\npublic/brand/");

/*
 * Each step lands in a real buffer before the next one starts. Sharp's
 * pipeline is lazy, and chaining extract -> trim -> clone().resize() makes it
 * compute the crop against the wrong dimensions ("bad extract area").
 */
const markCropped = await sharp(transparent).extract(markBox).png().toBuffer();
const markBuffer = await sharp(markCropped).trim({ threshold: 1 }).png().toBuffer();

// The mark alone, square, for the header and the icons.
await write(
  "mark.png",
  sharp(markBuffer).resize(512, 512, {
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }),
);

// The full lockup, trimmed, for the sign-in page.
await write(
  "logo.png",
  sharp(await sharp(transparent).trim({ threshold: 1 }).png().toBuffer()).resize({
    width: 640,
  }),
);

/**
 * Icons. Next serves `app/icon.png` as the favicon and `app/apple-icon.png`
 * for an iOS home-screen bookmark. The Apple one needs a background - iOS
 * composites it onto black otherwise, and an indigo mark on black is much
 * harder to pick out than one on white.
 */
await writeFile(
  join(root, "app", "icon.png"),
  await sharp(markBuffer)
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer(),
);
console.log("\napp/icon.png            256x256   (favicon)");

await writeFile(
  join(root, "app", "apple-icon.png"),
  await sharp(markBuffer)
    .resize(160, 160, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer(),
);
console.log("app/apple-icon.png      200x200   (iOS home screen)");

/*
 * Sampled from the artwork, not from `stats().dominant` - that ignores alpha
 * and so reports the transparent background as black.
 */
const hex = `#${[ink.r, ink.g, ink.b]
  .map((channel) => channel.toString(16).padStart(2, "0"))
  .join("")}`;
console.log(`\nThe mark's ink: ${hex}`);
console.log("Compare with --accent in app/globals.css.\n");
