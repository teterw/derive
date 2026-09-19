/**
 * Every letter that appears in a question stem, and which generator put it
 * there. Run it after touching a generator to check no skill has quietly gone
 * back to naming its unknown `k`.
 *
 * Reads the built content through tsx; see `pnpm vars`.
 */
import { generators, generateQuestion } from "../content/generators/index.ts";

const seen = new Map();

for (const generator of generators) {
  for (const difficulty of generator.difficulties) {
    for (let seed = 1; seed <= 25; seed += 1) {
      const question = generateQuestion(generator.id, seed, difficulty);
      // Strip LaTeX commands first, or `\frac` contributes f, r, a, c.
      const letters = question.stem.replace(/\\[a-zA-Z]+/g, " ").match(/[a-zA-Z]/g) ?? [];
      for (const letter of letters) {
        if (!seen.has(letter)) seen.set(letter, new Set());
        seen.get(letter).add(generator.id);
      }
    }
  }
}

const ALLOWED = new Set(["x", "y"]);
let unexpected = 0;

for (const [letter, owners] of [...seen].sort()) {
  const flag = ALLOWED.has(letter) ? "   " : "!! ";
  if (!ALLOWED.has(letter)) unexpected += 1;
  console.log(`${flag}${letter}  ${[...owners].sort().join(", ")}`);
}

console.log(
  unexpected === 0
    ? "\nEvery unknown is x or y."
    : `\n${unexpected} letter(s) outside the agreed set - see the !! rows.`,
);
