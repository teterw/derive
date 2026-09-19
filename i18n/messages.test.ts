import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import th from "@/messages/th.json";

/**
 * What the two locale files have to agree about.
 *
 * The bytes themselves are checked repo-wide in `scripts/encoding.test.ts` -
 * Thai is not only in here, it is in every lesson and question stem in
 * `content/`, and it corrupts the same way everywhere.
 */

type Tree = { [key: string]: string | Tree };

function entries(tree: Tree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]): [string, string][] => {
    const path = prefix === "" ? key : `${prefix}.${key}`;
    return typeof value === "string" ? [[path, value]] : entries(value, path);
  });
}

const paths = (tree: Tree) => entries(tree).map(([path]) => path);

describe.each([
  ["th", th as Tree],
  ["en", en as Tree],
])("messages/%s.json", (_locale, tree) => {
  it("has no blank strings", () => {
    const blank = entries(tree)
      .filter(([, value]) => value.trim() === "")
      .map(([path]) => path);

    expect(blank).toEqual([]);
  });
});

/**
 * CLAUDE.md has required this since the second locale existed and nothing has
 * ever checked it. A key present in one file and missing from the other throws
 * at render time in whichever locale is short - which is exactly the locale
 * the author is not looking at.
 */
describe("the two locales", () => {
  it("carry the same keys", () => {
    const thKeys = paths(th as Tree);
    const enKeys = paths(en as Tree);

    expect(thKeys.filter((key) => !enKeys.includes(key)), "missing from en").toEqual([]);
    expect(enKeys.filter((key) => !thKeys.includes(key)), "missing from th").toEqual([]);
  });
});
