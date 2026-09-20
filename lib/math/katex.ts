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

/**
 * Named constants. `\theta` becomes the symbol `theta`, which mathjs treats as
 * an ordinary variable - which is what it is.
 */
const CONSTANTS: Record<string, string> = {
  pi: "pi",
  theta: "theta",
};

/**
 * The functions TeX writes as commands, and their mathjs names.
 *
 * `\ln` is mathjs's `log`, and `\log` written without a base is `log10` -
 * base ten is what ม.ปลาย means by a bare `\log`. A base written as a
 * subscript still refuses, because `_` does, and that is the honest answer:
 * `\log_{2} 8` needs a decision this parser should not make silently.
 *
 * `^\circ` is deliberately absent, so a stem in degrees still refuses. mathjs
 * works in radians, and `sin(30)` is not `\sin 30^\circ` - it is a different
 * number, and the only thing worse than refusing a stem is converting one
 * into a plausible wrong answer.
 */
const FUNCTIONS: Record<string, string> = {
  sin: "sin",
  cos: "cos",
  tan: "tan",
  csc: "csc",
  sec: "sec",
  cot: "cot",
  arcsin: "asin",
  arccos: "acos",
  arctan: "atan",
  sinh: "sinh",
  cosh: "cosh",
  tanh: "tanh",
  ln: "log",
  log: "log10",
  exp: "exp",
};

/**
 * The argument of a function command, taken off the front of already-converted
 * mathjs source.
 *
 * `\sin 2x + 1` is `sin(2x) + 1` and not `sin(2x + 1)`: a function binds to the
 * term beside it, and an operator ends that term. Reading it from the converted
 * text rather than the TeX means `\sin\frac{\pi}{6}` needs no special case -
 * `((pi)/(6))` is one balanced atom by the time this sees it.
 *
 * A space ends the argument too, so `\sin 2 x` is `sin(2) x`. That is the one
 * place this guesses, and it guesses the way the spacing reads.
 */
function takeAtom(text: string, command: string): [string, number] {
  let i = 0;
  while (i < text.length && /\s/.test(text[i]!)) i += 1;
  const start = i;
  let depth = 0;

  /*
   * A bracketed argument ends at its bracket. `\sin(x)^2` is the square of the
   * sine and `\sin x^2` is the sine of the square - the brackets are the only
   * thing telling them apart, and the power left behind here attaches to the
   * whole call, which is what it means.
   */
  /*
   * A function call *is* the argument when it starts the atom: `\ln|x-3|`
   * arrives here already converted to `abs(x-3)`, and `\ln\sqrt{x}` as
   * `sqrt(x)`. Without this the loop below stops at the first letter - the
   * "a" of "abs" - and the rest becomes a stray factor, so `\ln|x-3|` came out
   * as `log(a)*bs*(x-3)`.
   *
   * It has to sit *before* the rule that a following call starts a new factor,
   * which is about `\sin A\cos B` and is right there and wrong here: the
   * difference is whether the call begins the atom or follows something.
   */
  const leadingCall = /^[A-Za-z_]\w*\(/.exec(text.slice(i));
  if (text[i] === "(" || leadingCall) {
    const open = i + (leadingCall ? leadingCall[0].length - 1 : 0);
    for (let j = open; j < text.length; j += 1) {
      if (text[j] === "(") depth += 1;
      else if (text[j] === ")") {
        depth -= 1;
        if (depth === 0) return [text.slice(i, j + 1), j + 1];
      }
    }
    throw new KatexConversionError(
      `${command} has an unclosed argument in ${JSON.stringify(text)}`,
    );
  }

  while (i < text.length) {
    const char = text[i]!;
    /*
     * The next function call starts a new factor: `\sin A\cos B` is a product
     * of two values and not the sine of a product, however little space the
     * typesetting leaves between them.
     */
    if (depth === 0 && i > start && /^[A-Za-z_]\w*\(/.test(text.slice(i))) {
      break;
    }
    if (char === "(") depth += 1;
    else if (char === ")") {
      if (depth === 0) break;
      depth -= 1;
    } else if (depth === 0 && /[\s+\-*/=<>,]/.test(char)) break;
    i += 1;
  }

  if (i === start) {
    throw new KatexConversionError(
      `${command} has no argument in ${JSON.stringify(text)}`,
    );
  }
  return [text.slice(start, i), i];
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
      /*
       * `x\sqrt{...}` is a product, and this branch writes a *name* before its
       * bracket - so without the star it lands as the symbol `xsqrt`, which
       * mathjs cannot evaluate and a correct answer comes back unreadable.
       * `\frac` needs no such guard because it emits a bracket directly, which
       * `insertImplicitMultiplication` already handles. Same trap, and same
       * fix, as `x\ln x` in round eight.
       */
      if (/[A-Za-z0-9_)]$/.test(out)) out += "*";
      out +=
        degree === null
          ? `sqrt(${convertCommands(radicand)})`
          : `nthRoot(${convertCommands(radicand)}, ${convertCommands(degree)})`;
      i = afterGroup;
      continue;
    }

    /*
     * `|x - 3|`, which Calculus II writes constantly - `\ln|x-p|` is the
     * antiderivative of `1/(x-p)` as every textbook states it, and writing it
     * without the bars to keep the parser happy would be teaching the wrong
     * notation. `\left|` and `\right|` have already been stripped to bare
     * bars by `BINARY_REPLACEMENTS`.
     *
     * Bars do not nest - there is no `||a| - |b||` in this curriculum - so the
     * match is the next bar, and an unmatched one is an error rather than a
     * guess.
     */
    if (rest.startsWith("|")) {
      const close = source.indexOf("|", i + 1);
      if (close === -1) {
        throw new KatexConversionError("an absolute value bar is unmatched");
      }
      if (/[A-Za-z0-9_)]$/.test(out)) out += "*";
      out += `abs(${convertCommands(source.slice(i + 1, close))})`;
      i = close + 1;
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
      const named = /^\\([a-zA-Z]+)/.exec(rest);
      const constant = named && CONSTANTS[named[1]!];
      if (constant) {
        out += constant;
        i += named![0].length;
        continue;
      }

      const fn = named && FUNCTIONS[named[1]!];
      if (fn) {
        let index = i + named![0].length;
        while (index < source.length && /\s/.test(source[index]!)) index += 1;

        /*
         * `\sin^2 x` is `sin(x)^2`. The power sits on the value of the
         * function, not on its angle - the one piece of notation in school
         * mathematics that means something other than what it looks like.
         */
        let power: string | null = null;
        if (source[index] === "^") {
          const [group, after] = readGroup(source, index + 1);
          power = convertCommands(group);
          index = after;
        }

        const following = convertCommands(source.slice(index));
        const [argument, used] = takeAtom(following, named![0]);
        /*
         * `x\ln x` is x times a logarithm. Without this separator the two run
         * together into `xlog(x)`, which mathjs reads as a function called
         * `xlog` - and then fails on a symbol nobody wrote.
         */
        if (/[A-Za-z0-9_)]$/.test(out)) out += "*";
        out +=
          power === null
            ? `${fn}(${argument})`
            : `(${fn}(${argument}))^(${power})`;
        out += following.slice(used);
        i = source.length;
        continue;
      }

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
  "csc",
  "sec",
  "cot",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "min",
  "max",
]);

/**
 * Two variables written side by side.
 *
 * mathjs reads `xy` as a single symbol *named* `xy`, so `x^2 + 5xy + 6y^2` and
 * `(x + 2y)(x + 3y)` come out in different alphabets and a correct two-variable
 * factorisation is marked wrong - the exact "silent mistranslation" this file
 * exists to refuse. `2y` is fine, because a digit beside a letter is already
 * implicit multiplication to mathjs; it is only letter-beside-letter that is
 * ambiguous.
 *
 * Narrow on purpose: only runs made entirely of the letters questions use for
 * unknowns (`VARIABLES` in `content/format.ts`), the sequence index `n`, and
 * the constant `e`. Splitting every letter run would turn `pi` into a product
 * and, where `convertCommands` has just written a function name, `xsqrt(3)`
 * into five factors.
 *
 * `e` earns its place here for the calculus chapters: `xe^x` is x times the
 * exponential, and left alone mathjs reads `xe` as one symbol and then cannot
 * evaluate it - so a correct derivative came back "unreadable".
 */
const VARIABLE_RUN = /(?<![A-Za-z])[xyne]{2,}(?![A-Za-z])/g;

/**
 * mathjs reads `x(4x - 9)` as a call to a function named x, which then fails
 * to evaluate - so a correct factorisation would look wrong. Anything that is
 * not a known function name gets an explicit `*`.
 */
export function insertImplicitMultiplication(text: string): string {
  return text
    .replace(VARIABLE_RUN, (run) => run.split("").join("*"))
    .replace(/([A-Za-z_]\w*|\d)\s*\(/g, (match, token: string) =>
      FUNCTION_NAMES.has(token) ? match : `${token}*(`,
    )
    .replace(/\)\s*\(/g, ")*(")
    /*
     * A bracket closing against a name: `\sin x\cos x` converts to
     * `sin(x)cos(x)`, and `(x+1)y` is a product a learner writes without
     * thinking. mathjs reads neither as multiplication on its own.
     */
    .replace(/\)\s*(?=[A-Za-z_])/g, ")*");
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
