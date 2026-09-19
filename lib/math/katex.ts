/**
 * KaTeX -> mathjs source.
 *
 * Questions carry one display string (KaTeX) so there is a single source of
 * truth for what the learner sees. The property tests need to *evaluate* that
 * string, which is what this converts. It covers exactly the subset the
 * generators emit - anything else throws rather than guessing, because a
 * silent mistranslation would make a broken derivation look verified.
 */

export class KatexConversionError extends Error {}

const BINARY_REPLACEMENTS: [RegExp, string][] = [
  [/\\cdot/g, "*"],
  [/\\times/g, "*"],
  [/\\div/g, "/"],
  [/\\left/g, ""],
  [/\\right/g, ""],
  [/\\,/g, " "],
  [/\\;/g, " "],
  [/\\!/g, ""],
  [/\\ /g, " "],
  [/\\displaystyle/g, ""],
  [/~/g, " "],
];

/** Commands that are display-only and carry no mathematical content. */
const STRIP = /\\(?:mathrm|text|operatorname)\{([^{}]*)\}/g;

/**
 * Reads a command's argument starting at `index`: a balanced `{...}` group, or
 * a single token where TeX allows one.
 *
 * `\sqrt5` is not a typo, it is TeX - a command takes the next single token
 * when there are no braces, so `\sqrt5` is `\sqrt{5}` and `\frac12` is one
 * half. This used to insist on the brace, and the cost was not theoretical:
 * MathLive writes the unbraced form whenever the argument is one character, so
 * every answer with a single-digit radical or fraction built in the maths field
 * came back `unparseable` and was marked wrong. Answering 9√5 - 4√5 with 5√5 -
 * correctly - was scored as a mistake.
 *
 * Reading it here rather than repairing MathLive's output is the right place
 * for it: this is a LaTeX parser, `\sqrt5` is LaTeX, and a learner who types it
 * by hand deserves the same answer as one who presses the key.
 */
function readGroup(source: string, start: number): [string, number] {
  // TeX skips whitespace between a command name and its argument, so `\sqrt x`
  // and `\sqrt{x}` are the same thing and `\sqrt 5` is not an error.
  let index = start;
  while (index < source.length && /\s/.test(source[index]!)) index += 1;

  if (source[index] !== "{") {
    // A command: `\sqrt\pi`, `\frac\alpha2`. The whole command is one token.
    if (source[index] === "\\") {
      let end = index + 1;
      while (end < source.length && /[a-zA-Z]/.test(source[end]!)) end += 1;
      // A single-character control symbol such as `\{` still consumes one.
      if (end === index + 1) end += 1;
      return [source.slice(index, end), end];
    }

    // Any other single character, which is what the digit cases hit.
    const char = source[index];
    if (char !== undefined && char !== "}" && !/\s/.test(char)) {
      return [char, index + 1];
    }

    throw new KatexConversionError(
      `expected a group at ${index} in ${JSON.stringify(source)}`,
    );
  }
  let depth = 0;
  for (let i = index; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return [source.slice(index + 1, i), i + 1];
    }
  }
  throw new KatexConversionError(
    `unbalanced braces in ${JSON.stringify(source)}`,
  );
}

/** Reads `[...]` (the optional argument of \sqrt). */
function readOptional(source: string, index: number): [string | null, number] {
  if (source[index] !== "[") return [null, index];
  const end = source.indexOf("]", index);
  if (end === -1) {
    throw new KatexConversionError(
      `unbalanced brackets in ${JSON.stringify(source)}`,
    );
  }
  return [source.slice(index + 1, end), end + 1];
}

function convertCommands(source: string): string {
  let out = "";
  let i = 0;

  while (i < source.length) {
    const rest = source.slice(i);

    if (rest.startsWith("\\frac")) {
      const [numerator, afterNum] = readGroup(source, i + "\\frac".length);
      const [denominator, afterDen] = readGroup(source, afterNum);
      out += `((${convertCommands(numerator)})/(${convertCommands(denominator)}))`;
      i = afterDen;
      continue;
    }

    if (rest.startsWith("\\dfrac") || rest.startsWith("\\tfrac")) {
      const [numerator, afterNum] = readGroup(source, i + 6);
      const [denominator, afterDen] = readGroup(source, afterNum);
      out += `((${convertCommands(numerator)})/(${convertCommands(denominator)}))`;
      i = afterDen;
      continue;
    }

    if (rest.startsWith("\\sqrt")) {
      const [degree, afterOpt] = readOptional(source, i + "\\sqrt".length);
      const [radicand, afterGroup] = readGroup(source, afterOpt);
      out +=
        degree === null
          ? `sqrt(${convertCommands(radicand)})`
          : `nthRoot(${convertCommands(radicand)}, ${convertCommands(degree)})`;
      i = afterGroup;
      continue;
    }

    if (rest.startsWith("^") || rest.startsWith("_")) {
      const symbol = source[i]!;
      if (source[i + 1] === "{") {
        const [group, after] = readGroup(source, i + 1);
        if (symbol === "_") {
          throw new KatexConversionError("subscripts are not machine-readable");
        }
        out += `^(${convertCommands(group)})`;
        i = after;
        continue;
      }
      if (symbol === "_") {
        throw new KatexConversionError("subscripts are not machine-readable");
      }
      out += "^";
      i += 1;
      continue;
    }

    if (rest.startsWith("{")) {
      const [group, after] = readGroup(source, i);
      out += `(${convertCommands(group)})`;
      i = after;
      continue;
    }

    if (source[i] === "\\") {
      const match = /^\\[a-zA-Z]+/.exec(rest);
      throw new KatexConversionError(
        `unsupported command ${match ? match[0] : "\\"} in ${JSON.stringify(source)}`,
      );
    }

    out += source[i];
    i += 1;
  }

  return out;
}

/**
 * Converts a KaTeX expression to mathjs source. Throws on anything outside the
 * supported subset, including `\pm`, which is genuinely two expressions and
 * must be split by the caller before conversion.
 */
export function katexToMath(katex: string): string {
  if (/\\pm|\\mp/.test(katex)) {
    throw new KatexConversionError(
      "\\pm stands for two expressions; split them before converting",
    );
  }

  let source = katex.replace(STRIP, "$1");
  for (const [pattern, replacement] of BINARY_REPLACEMENTS) {
    source = source.replace(pattern, replacement);
  }
  const converted = convertCommands(source).replace(/\s+/g, " ").trim();
  return insertImplicitMultiplication(converted);
}

const FUNCTION_NAMES = new Set([
  "sqrt",
  "nthRoot",
  "cbrt",
  "abs",
  "log",
  "log10",
  "log2",
  "ln",
  "exp",
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "min",
  "max",
]);

/**
 * mathjs reads `x(4x - 9)` as a call to a function named x, which then fails
 * to evaluate - so a correct factorisation would look wrong. Anything that is
 * not a known function name gets an explicit `*`.
 */
export function insertImplicitMultiplication(text: string): string {
  return text
    .replace(/([A-Za-z_]\w*|\d)\s*\(/g, (match, token: string) =>
      FUNCTION_NAMES.has(token) ? match : `${token}*(`,
    )
    .replace(/\)\s*\(/g, ")*(");
}

/** True when the string is inside the subset `katexToMath` understands. */
export function isMachineReadable(katex: string): boolean {
  try {
    katexToMath(katex);
    return true;
  } catch {
    return false;
  }
}
