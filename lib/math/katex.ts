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
 * Reads the balanced `{...}` group starting at `index` (which must be the `{`).
 * Returns the contents and the index just past the closing brace.
 */
function readGroup(source: string, index: number): [string, number] {
  if (source[index] !== "{") {
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
