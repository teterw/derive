/**
 * Reads the theme tokens straight out of `app/globals.css` and checks every
 * pairing the interface actually puts together, in both modes.
 *
 * It parses the stylesheet rather than taking a copy of the hexes, because a
 * copy is a second source of truth that goes stale the first time someone
 * nudges a colour. If a token is renamed this fails loudly instead of quietly
 * checking nothing.
 */
import { readFile } from "node:fs/promises";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function luminance(hex) {
  const n = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Every `--name: #hex;` in the file, last declaration winning. */
function parseTokens(css) {
  const tokens = {};
  for (const match of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

const css = await readFile(join(root, "app", "globals.css"), "utf8");
const tokens = parseTokens(css);

/** Light tokens are the bare names; dark ones are the `--d-` prefixed set. */
const modes = {
  light: (name) => tokens[name],
  dark: (name) => tokens[`d-${name}`],
};

/**
 * `min` is the ratio the pairing has to clear. 4.5 is WCAG AA for body text.
 * The structural pairings (a border against its surface) only have to be
 * visible at all, which is what the low numbers are.
 */
const PAIRINGS = [
  ["body text on the page", "fg", "bg", 4.5],
  ["body text on a card", "fg", "surface", 4.5],
  ["muted text on the page", "muted", "bg", 4.5],
  ["muted text on a card", "muted", "surface", 4.5],
  ["accent text on the page", "accent", "bg", 4.5],
  ["accent text on a card", "accent", "surface", 4.5],
  ["label on an accent button", "accent-fg", "accent", 4.5],
  ["correct on the page", "correct", "bg", 4.5],
  ["wrong on the page", "wrong", "bg", 4.5],
  ["correct on a card", "correct", "surface", 4.5],
  ["wrong on a card", "wrong", "surface", 4.5],
  /*
   * The *filled* versions - a tick in a green circle, a label on a red button.
   * These were missed for a long time because the table only ever checked
   * `correct` and `wrong` as ink on a page, and the app was writing white on
   * top of them. That is fine in light mode, where both are dark, and 2.1:1
   * in dark mode, where both are light. `bg` is the text colour that works in
   * both, being near-black on a dark page and near-white on a light one.
   */
  ["a tick on a correct chip", "bg", "correct", 4.5],
  ["a label on a wrong button", "bg", "wrong", 4.5],
  ["a border against its card", "border", "surface", 1.2],
  ["a raised panel against its card", "surface-2", "surface", 1.05],
  ["the emptiest chart cell", "viz-empty", "surface", 1.02],
];

/**
 * The ramp runs light-to-dark on a light surface and dark-to-light on a dark
 * one, so "the lightest step" names different ends in the two modes. What has
 * to hold in both is that the step *nearest the surface* is still a mark and
 * not a smudge.
 */
const FAINTEST_STEP_MIN = 1.9;

let failures = 0;

for (const [mode, lookup] of Object.entries(modes)) {
  console.log(`\n${mode}`);
  for (const [label, front, back, min] of PAIRINGS) {
    const a = lookup(front);
    const b = lookup(back);
    if (!a || !b) {
      console.log(`  MISSING  ${label} — no token for ${!a ? front : back}`);
      failures += 1;
      continue;
    }
    const ratio = contrast(a, b);
    const ok = ratio >= min;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? "ok  " : "FAIL"}  ${label.padEnd(32)} ${ratio.toFixed(2)}:1` +
        `  (needs ${min})  ${a} on ${b}`,
    );
  }
}

/**
 * A sequential ramp is only readable as an ordering if it moves one way the
 * whole time. This catches a step edited by hand into the wrong slot.
 */
for (const [mode, lookup] of Object.entries(modes)) {
  const steps = [1, 2, 3, 4].map((n) => lookup(`viz-${n}`));
  if (steps.some((step) => !step)) continue;

  const surface = lookup("surface");
  const faintest = steps
    .map((step) => ({ step, ratio: contrast(step, surface) }))
    .reduce((worst, each) => (each.ratio < worst.ratio ? each : worst));
  const faintEnough = faintest.ratio >= FAINTEST_STEP_MIN;
  if (!faintEnough) failures += 1;
  console.log(
    `\n  ${faintEnough ? "ok  " : "FAIL"}  ${mode} faintest chart step` +
      ` ${faintest.step}  ${faintest.ratio.toFixed(2)}:1` +
      `  (needs ${FAINTEST_STEP_MIN})`,
  );

  const luminances = steps.map(luminance);
  const descending = luminances.every(
    (value, index) => index === 0 || value < luminances[index - 1],
  );
  const ascending = luminances.every(
    (value, index) => index === 0 || value > luminances[index - 1],
  );
  const monotone = descending || ascending;
  if (!monotone) failures += 1;
  console.log(
    `\n  ${monotone ? "ok  " : "FAIL"}  ${mode} chart ramp is monotone` +
      `  [${luminances.map((l) => l.toFixed(3)).join(" → ")}]`,
  );
}

/*
 * The pairings above are a statement about the palette. They cannot see what
 * the components actually write on top of it, and the bug that prompted them
 * lived entirely there: `bg-correct text-white` reads fine in light mode, where
 * the green is dark, and 2.1:1 in dark mode, where it is not. Nothing in the
 * CSS was wrong; the class was.
 *
 * So the filled chips get scanned too. `text-white` is a literal that ignores
 * the theme, which is the whole problem with it - on a token that changes
 * lightness between modes there is no fixed colour that works, and `text-bg`
 * is the one that follows.
 */
const FILLED = /\bbg-(?:accent|correct|wrong)\b(?![/-])/;

function* sourceFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(full);
    else if (/\.tsx?$/.test(entry.name)) yield full;
  }
}

for (const file of [...sourceFiles("app"), ...sourceFiles("components")]) {
  const source = readFileSync(file, "utf8");
  source.split("\n").forEach((line, index) => {
    if (!line.includes("text-white")) return;
    if (!FILLED.test(line)) return;
    failures += 1;
    console.log(
      `\n  FAIL  ${file}:${index + 1} writes text-white on a filled chip` +
        `\n        use text-bg, which follows the theme`,
    );
  });
}

if (failures > 0) {
  console.error(`\n${failures} contrast problem(s).`);
  process.exit(1);
}
console.log("\nEvery pairing clears its floor.");
