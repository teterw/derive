import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import th from "@/messages/th.json";

/**
 * Message keys nothing renders.
 *
 * They are invisible, which is the problem. `daily.subtitle` went on promising
 * that "everyone gets the same set" for a while after that stopped being true,
 * and a pile of strings nobody reads is exactly where that kind of lie
 * survives. Fifteen of these had accumulated by the time anyone counted.
 *
 * The test is deliberately generous - it looks for the leaf name quoted
 * anywhere in the source, and for a parent used to build keys dynamically. A
 * false "unused" would have someone delete live text, which is far worse than
 * letting a genuinely dead key sit for another week.
 */

const ROOT = join(import.meta.dirname, "..");
const SKIP = new Set([".git", ".next", "node_modules", "messages", "drizzle"]);

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return SKIP.has(entry.name) ? [] : walk(full);
    return /\.(ts|tsx|mjs)$/.test(entry.name) ? [full] : [];
  });
}

/** Every source file except the tests, which reference keys without rendering them. */
const source = walk(ROOT)
  .filter((file) => !file.includes(".test."))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");

type Tree = { [key: string]: string | Tree };

function paths(tree: Tree, prefix: string[] = []): string[][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string"
      ? [[...prefix, key]]
      : paths(value, [...prefix, key]),
  );
}

function referenced(path: string[]): boolean {
  const leaf = path[path.length - 1]!;
  const parent = path[path.length - 2];

  // `t("leaf")`, or any other quoted use of the name.
  if (source.includes(`"${leaf}"`) || source.includes(`'${leaf}'`)) return true;
  // A template key, or a property access such as `messages.practice.leaf`.
  if (source.includes(`\`${leaf}`) || source.includes(`.${leaf}`)) return true;
  // `t(\`band.${chosen}\`)` - the whole group is reachable.
  if (parent && source.includes(`\`${parent}.\${`)) return true;

  return false;
}

describe("messages", () => {
  /** If this is empty the walk is broken and the test below proves nothing. */
  it("is checked against a source tree that was actually read", () => {
    expect(source.length).toBeGreaterThan(100_000);
    expect(source).toContain("setRequestLocale");
  });

  it("has no keys that nothing renders", () => {
    const unused = paths(th as Tree)
      .filter((path) => !referenced(path))
      .map((path) => path.join("."));

    expect(unused).toEqual([]);
  });
});
