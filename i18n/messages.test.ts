import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import th from "@/messages/th.json";
import { FORM_REQUIREMENTS } from "@/content/types";
import { DAILY_BANDS } from "@/lib/daily/challenge";
import { skills } from "@/content/topics";

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

/**
 * Keys the code builds rather than writes.
 *
 * Parity above compares the two files with each other, so a key missing from
 * *both* passes it. That is what happened: `practice.accepts.vertex-form` did
 * not exist in either locale, and because the runner looks that key up as
 * `accepts.${form}`, nothing referenced it literally for a search to find.
 * The symptom was the string `practice.accepts.vertex-form` rendered to the
 * learner underneath a wrong answer, on the one skill in the app that asks
 * for completed-square form.
 *
 * So: every family whose key is interpolated is checked against the set of
 * values the code can actually produce.
 */
describe.each([
  ["th", th as Tree],
  ["en", en as Tree],
])("interpolated keys in messages/%s.json", (_locale, tree) => {
  const has = (path: string) => paths(tree).includes(path);

  it.each(FORM_REQUIREMENTS)(
    "explains the %s requirement both ways round",
    (form) => {
      expect(has(`practice.accepts.${form}`), "the rule, stated").toBe(true);
      expect(has(`practice.formError.${form}`), "the rule, broken").toBe(true);
    },
  );

  it("has a name and a note for every daily band", () => {
    for (const band of Object.keys(DAILY_BANDS)) {
      expect(has(`daily.band.${band}`), band).toBe(true);
      expect(has(`daily.bandNote.${band}`), band).toBe(true);
    }
  });
});

/**
 * The link back the other way: a skill can only ask for a form the messages
 * know how to talk about. This fails on the skill rather than on the message,
 * which is the more useful end to be told about when adding content.
 */
describe("every skill's strict form", () => {
  it("is one the app has words for", () => {
    const orphans = skills
      .filter(
        (skill) =>
          skill.strictForm !== null &&
          !(FORM_REQUIREMENTS as readonly string[]).includes(skill.strictForm),
      )
      .map((skill) => `${skill.id} -> ${skill.strictForm}`);

    expect(orphans).toEqual([]);
  });
});
