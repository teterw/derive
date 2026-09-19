import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Every text file in the repo, checked for the one kind of damage that leaves
 * no other trace.
 *
 * Thai written as UTF-8 and read back as Latin-1 turns into a run of accented
 * Latin letters and punctuation. It is still valid UTF-8, so the file parses,
 * the build succeeds and the tests pass; the only thing that can tell is a
 * person reading the screen in a language they speak. Three message keys
 * shipped that way, through a PowerShell pipe.
 *
 * The check lives here rather than beside the message files because Thai is
 * not only in `messages/` - it is in every lesson, every question stem and
 * every rule in `content/`, and those are the files a content session touches
 * most.
 *
 * Everything below is deliberately pure ASCII, with the characters it looks
 * for built from code points rather than written out. Two reasons: a file that
 * contains an example of the damage reports itself as damaged, and a `\u`
 * escape is not reliably still an escape by the time it reaches disk - one of
 * these tools rewrites them as the literal character, which is how an
 * invisible BOM ended up in the middle of a line of this file's first draft.
 */

const ROOT = join(import.meta.dirname, "..");

/** Not source, or not ours to police. */
const SKIP_DIRS = new Set([
  ".git",
  ".next",
  "node_modules",
  ".vercel",
  "coverage",
  "drizzle/meta",
]);

const REPLACEMENT = 0xfffd; // what a decoder writes once it has given up
const BOM = 0xfeff; // the fingerprint of a shell that re-encodes

/**
 * Lead bytes that cannot begin a real word once misread: A-circumflex,
 * A-tilde, and the accented a's. U+00D7 and U+00F7 are deliberately absent -
 * `lib/math/check.ts` contains a multiplication sign followed by a middle dot,
 * which is exactly what was meant there and which a wider rule flags forever.
 */
const LEADS = new Set([0x00c2, 0x00c3, 0x00e0, 0x00e1, 0x00e2, 0x00e3]);
const CONTINUATION_LO = 0x0080;
const CONTINUATION_HI = 0x00bf;

/** A UTF-8 lead byte followed by a continuation byte, both read as Latin-1. */
function isMojibake(text: string): boolean {
  for (let i = 0; i < text.length - 1; i += 1) {
    if (!LEADS.has(text.charCodeAt(i))) continue;
    const next = text.charCodeAt(i + 1);
    if (next >= CONTINUATION_LO && next <= CONTINUATION_HI) return true;
  }
  return false;
}

const hasReplacement = (text: string) => text.includes(String.fromCharCode(REPLACEMENT));

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const rel = relative(ROOT, full).split(sep).join("/");
      return SKIP_DIRS.has(entry.name) || SKIP_DIRS.has(rel) ? [] : walk(full);
    }
    return entry.isFile() ? [full] : [];
  });
}

const files = walk(ROOT).flatMap((path) => {
  const buffer = readFileSync(path);
  // A NUL byte means an image, a font or a database file - not ours to read.
  if (buffer.includes(0)) return [];
  return [{ path: relative(ROOT, path).split(sep).join("/"), text: buffer.toString("utf8") }];
});

/** Every offending line, named, because "a file is wrong" is not actionable. */
function offenders(broken: (text: string) => boolean): string[] {
  return files
    .filter(({ text }) => broken(text))
    .flatMap(({ path, text }) =>
      text
        .split("\n")
        .map((line, index) => ({ line, number: index + 1 }))
        .filter(({ line }) => broken(line))
        .map(({ line, number }) => `${path}:${number}  ${line.trim().slice(0, 80)}`),
    );
}

describe("every text file in the repo", () => {
  /** If this is empty the walk is broken and the rest of the file proves nothing. */
  it("is actually being read", () => {
    const paths = files.map((file) => file.path);
    expect(files.length).toBeGreaterThan(150);
    expect(paths).toContain("messages/th.json");
    expect(paths).toContain("content/format.ts");
  });

  it("is not mojibake", () => {
    expect(offenders(isMojibake)).toEqual([]);
  });

  it("has no replacement characters", () => {
    expect(offenders(hasReplacement)).toEqual([]);
  });

  /**
   * Worth failing on even where it is harmless: a BOM means the tool that
   * wrote the file re-encodes, so the next file it writes may not be harmless.
   */
  it("has no byte-order marks", () => {
    const bom = String.fromCharCode(BOM);
    const withBom = files
      .filter(({ text }) => text.startsWith(bom))
      .map(({ path }) => path);
    expect(withBom).toEqual([]);
  });

  /**
   * The checks above are only as good as their ability to fail, and all three
   * look for characters that must not appear in this file - so they cannot be
   * demonstrated on a fixture written into it. Built here instead.
   */
  it("would notice if any of that were present", () => {
    const thai = "ลาก"; // three Thai letters, correctly encoded
    const damaged = Buffer.from(thai, "utf8").toString("latin1");

    expect(isMojibake(thai)).toBe(false);
    expect(isMojibake(damaged)).toBe(true);
    expect(isMojibake("2x" + String.fromCharCode(0x00d7) + String.fromCharCode(0x00b7))).toBe(false);
    expect(hasReplacement(thai)).toBe(false);
    expect(hasReplacement(String.fromCharCode(REPLACEMENT))).toBe(true);
  });
});
