/**
 * Repairs the LaTeX MathLive hands back.
 *
 * ## The bug
 *
 * Type `x`, `^`, `1`, `2` into a mathfield and the second digit lands *outside*
 * the superscript. MathLive's own output says so at every level:
 *
 * ```
 * x -> "x"      ^ -> "x^{}"      1 -> "x^1"      2 -> "x^12"
 * MathML:  <msup><mi>x</mi><mn>1</mn></msup><mn>2</mn>
 * ```
 *
 * So `x^12` is not a serialisation quirk - the model itself has x-to-the-1
 * followed by a loose 2, and the field renders it that way: a small 1 and a
 * full-size 2. Subscripts are unaffected (`a_{12}` comes back correctly), which
 * is what marks this as a bug in the superscript path rather than a convention.
 *
 * MathLive 0.110.0 is the newest release, so there is no upgrade to take, and
 * the formats that would preserve the structure - `math-json` - need the
 * compute engine, which is far larger than the rest of the field put together.
 *
 * ## The repair, and what it costs
 *
 * Brace the argument of every `^` and `_` that has not got one. `x^12` becomes
 * `x^{12}`, which is what the learner meant and what the field then renders.
 *
 * This cannot be perfect, and it is worth being plain about why: MathLive emits
 * exactly the same `x^12` whether the 2 was typed inside the exponent or after
 * leaving it, so the information needed to tell those apart is already gone
 * before this function sees the string. It resolves the ambiguity towards the
 * exponent, because `x^12` meaning "x to the 1, times 2" is not something
 * anyone writes - they write `2x`. The reading this picks is the one a person
 * typing it meant, essentially always, and when it is wrong it is wrong
 * visibly: the field re-renders, so you can see it and fix it.
 *
 * Digits group as a run, so `x^12+3` is x-to-the-12 plus 3 rather than
 * x-to-the-12-plus-3. A command, a sign with digits, or any single character
 * each take one argument.
 */

const DIGIT = /[0-9]/;
const LETTER = /[a-zA-Z]/;

/**
 * True when the maths field still has an empty box in it.
 *
 * MathLive draws `\placeholder{}` as a visible empty square - press the `x²`
 * key without a base and the value is `\placeholder{}^2`, with a box where the
 * base should be. Submitting that is never intentional, and it used to cost the
 * learner the question: the placeholder is stripped before marking, `^2` is
 * left, that does not parse, and an unparseable answer is a wrong answer. It is
 * in the database, with the attempt it was marked against.
 *
 * So the runner treats it the way it treats an empty box, which is the honest
 * reading: there is a blank in the answer, so the answer is not finished.
 */
export function hasEmptyBox(latex: string): boolean {
  return latex.includes("\\placeholder");
}

/** True when there is nothing in the field worth marking. */
export function isBlankAnswer(latex: string): boolean {
  return latex.trim() === "" || hasEmptyBox(latex);
}

/** How far the unbraced argument starting at `from` runs. */
function argumentEnd(latex: string, from: number): number {
  let i = from;

  // A command: `\alpha`, `\pi`.
  if (latex[i] === "\\") {
    i += 1;
    while (i < latex.length && LETTER.test(latex[i])) i += 1;
    // A single-character command such as `\{` still consumes one character.
    return i === from + 1 ? i + 1 : i;
  }

  // A signed number: `x^-2`.
  if (latex[i] === "-" || latex[i] === "+") {
    i += 1;
    while (i < latex.length && DIGIT.test(latex[i])) i += 1;
    return i;
  }

  // A run of digits - the case this function exists for.
  if (DIGIT.test(latex[i])) {
    while (i < latex.length && DIGIT.test(latex[i])) i += 1;
    return i;
  }

  // Anything else takes exactly one character, which is TeX's own rule.
  return i + 1;
}

/**
 * Braces every superscript and subscript argument that lacks braces.
 *
 * Idempotent, so it is safe to run on a value that has already been through it
 * - which matters, because the repaired value is written back into the field
 * and comes round again on the next keystroke.
 */
export function normalizeMathfieldLatex(latex: string): string {
  let out = "";
  let i = 0;

  while (i < latex.length) {
    const char = latex[i];

    if (char !== "^" && char !== "_") {
      out += char;
      i += 1;
      continue;
    }

    out += char;
    i += 1;

    // MathLive does not emit spaces here, but hand-written LaTeX can.
    while (i < latex.length && latex[i] === " ") {
      out += latex[i];
      i += 1;
    }

    // Already braced, or a trailing `^` mid-edit: leave it alone. The brace and
    // everything inside it is copied by the ordinary path, so a nested
    // superscript is normalised too.
    if (i >= latex.length || latex[i] === "{") continue;

    const end = argumentEnd(latex, i);
    out += `{${latex.slice(i, end)}}`;
    i = end;
  }

  return out;
}
