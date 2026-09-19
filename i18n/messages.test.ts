import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import th from "@/messages/th.json";

/**
 * The message files are the one place in this repo where the bytes themselves
 * can be wrong while everything still compiles, every test passes and the page
 * renders - just with Thai turned into `à¸¥à¸²à¸`. Nothing downstream can
 * notice, because to a bundler one string is as good as another.
 *
 * It happened: three keys were appended through a PowerShell pipe
 * (`Get-Content ... | node`), which re-encodes UTF-8 on the way through, and
 * the damage was only ever going to be found by a person looking at the
 * screen. So the bytes get checked here instead.
 */

type Tree = { [key: string]: string | Tree };

function paths(tree: Tree, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix === "" ? key : `${prefix}.${key}`;
    return typeof value === "string" ? [path] : paths(value, path);
  });
}

function entries(tree: Tree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]): [string, string][] => {
    const path = prefix === "" ? key : `${prefix}.${key}`;
    return typeof value === "string" ? [[path, value]] : entries(value, path);
  });
}

const FILES: [string, Tree][] = [
  ["th", th as Tree],
  ["en", en as Tree],
];

/**
 * A UTF-8 lead byte followed by a continuation byte, both read as Latin-1.
 *
 * The leads are only the ones that cannot start a real word: `Ã`/`Â` and the
 * accented a's. `×` and `÷` are deliberately absent - `lib/math/check.ts`
 * holds the perfectly legitimate `[×·∙]`, which a wider pattern flags.
 */
const MOJIBAKE = /[ÂÃàáâã][\u0080-¿]/;

describe.each(FILES)("messages/%s.json", (locale, tree) => {
  it("is not mojibake", () => {
    const damaged = entries(tree)
      .filter(([, value]) => MOJIBAKE.test(value))
      .map(([path, value]) => `${path}: ${value}`);

    expect(damaged, `${locale} has re-encoded text`).toEqual([]);
  });

  /** What a decoder writes when it has already given up on the bytes. */
  it("has no replacement characters", () => {
    const damaged = entries(tree)
      .filter(([, value]) => value.includes("�"))
      .map(([path]) => path);

    expect(damaged).toEqual([]);
  });

  it("has no blank strings", () => {
    const blank = entries(tree)
      .filter(([, value]) => value.trim() === "")
      .map(([path]) => path);

    expect(blank).toEqual([]);
  });
});

/**
 * CLAUDE.md has required this since the first locale was added and nothing has
 * ever checked it. A key present in one file and missing from the other throws
 * at render time in whichever locale is short, which is exactly the locale the
 * author is not looking at.
 */
describe("the two locales", () => {
  it("carry the same keys", () => {
    const thKeys = paths(th as Tree).sort();
    const enKeys = paths(en as Tree).sort();

    expect(thKeys.filter((key) => !enKeys.includes(key)), "missing from en").toEqual([]);
    expect(enKeys.filter((key) => !thKeys.includes(key)), "missing from th").toEqual([]);
  });
});
