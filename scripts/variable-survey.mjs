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
      /*
       * Strip LaTeX commands first, or `\frac` contributes f, r, a, c - and
       * then strip *function names*, which are a letter sitting immediately in
       * front of a bracket. `f(x) = 2x + 1` names its function `f` and its
       * unknown `x`, and only the second of those is what this script is
       * about. Without this the whole ม.4 functions chapter reports two
       * unexpected letters for ever, and a warning nobody can act on is a
       * warning everybody learns to skip.
       */
      /*
       * Then strip two more things that are *names* rather than unknowns:
       *
       *   - a letter carrying a subscript. `a_1`, `a_n` and `S_n` name a
       *     sequence and its sum, which is what every textbook calls them.
       *   - a letter being handed a value. `a = 3, \ b = 5, \ C = \frac{\pi}{3}`
       *     labels the sides of a triangle; those letters are given, not
       *     solved for, and the unknown in that same question is still `x`.
       *
       * What is left is what this script is about: the letter a question
       * expects the learner to find.
       */
      const letters =
        question.stem
          .replace(/[a-zA-Z]_\{[^{}]*\}/g, " ")
          .replace(/[a-zA-Z]_[a-zA-Z0-9]/g, " ")
          // Before the commands go, or `c = \sqrt{19}` loses what follows the
          // equals sign and stops looking like a given.
          .replace(/(?<![a-zA-Z])[a-zA-Z]\s*=\s*(?=[-\d\\])/g, " ")
          /*
           * `\text{...}` and `\mathrm{...}` hold prose and units - `\mathrm{km}`
           * is a kilometre, not a k times an m. Both go *with their contents*,
           * and before the generic command strip below, which would otherwise
           * remove the command and leave the letters behind looking like
           * algebra.
           */
          .replace(/\\(?:text|mathrm|operatorname)\{[^{}]*\}/g, " ")
          // `\begin{cases}` names an environment; c, a, s and e are not algebra.
          .replace(/\\(?:begin|end)\{[a-zA-Z*]+\}/g, " ")
          .replace(/\\[a-zA-Z]+/g, " ")
          // `f(x)` and `f'(3)`: a name with as many primes as it likes.
          .replace(/[a-zA-Z]'*\s*\(/g, "(")
          /*
           * `\frac{dr}{dt}` is one symbol - a rate - not two unknowns called r
           * and t. It goes before anything else looks at it. (The `\frac` has
           * already been stripped by the time this runs, which is why the
           * pattern matches the braces on their own.)
           */
          .replace(/\{\s*d[a-z]?\s*\}\s*\{\s*d[a-z]\s*\}/g, " ")
          // The `d` of `dx` belongs to the integral sign, not to the algebra.
          .replace(/(?<![a-zA-Z])d(?=[a-z](?![a-zA-Z]))/g, " ")
          /*
           * A lone capital names a point, an angle or a vertex - `\sin A`, and
           * triangle ABC. Unknowns in this app are lower case (`VARIABLES` in
           * content/format.ts), so a capital is never the thing a learner is
           * being asked to find.
           */
          .replace(/(?<![a-zA-Z])[A-Z](?![a-zA-Z])/g, " ")
          .match(/[a-zA-Z]/g) ?? [];
      for (const letter of letters) {
        if (!seen.has(letter)) seen.set(letter, new Set());
        seen.get(letter).add(generator.id);
      }
    }
  }
}

/*
 * `n` joins the list for the sequences chapters, where it is not an unknown
 * quantity at all - it is which term you are asking for, always a counting
 * number, and `a_n` is what the curriculum itself writes. Renaming it `x`
 * would contradict every textbook the learner owns.
 *
 * `k` joins it for continuity, where the *variable* is still `x` and `k` is a
 * parameter of the function - `f(x) = kx + 3`, choose k. That is a different
 * job from naming an unknown, and `k` is what every textbook calls it. The
 * thing this script exists to catch is a question whose unknown *variable*
 * has drifted away from x and y, and both of those stems still have their x.
 *
 * `e` is a number rather than a letter: it stands for 2.718..., it is never
 * what a question is asking for, and the calculus chapters write it
 * constantly.
 *
 * `r`, `h` and `t` name a radius, a height and a time in a stated model - a
 * sphere being inflated, a box being built, a car being driven. They are
 * measured quantities with their own units, not a choice of letter for an
 * unknown, and calling them `x` and `y` would make the model harder to read
 * rather than easier. "The distance after x seconds" is not an improvement on
 * anything.
 *
 * `w` joins them for the same reason: the rectangle word problems set up
 * `w \times \ell`, a width and a length. That stem used to say
 * `\text{กว้าง} \times \text{ยาว}`, which put Thai on the English page and is
 * why it now uses letters at all.
 */
const ALLOWED = new Set(["x", "y", "n", "k", "e", "r", "h", "t", "w"]);
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
