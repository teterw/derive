/**
 * Turns what a learner typed into KaTeX, so the answer box can show the maths
 * rather than the keystrokes.
 *
 * Why not mathjs, which is already the parser everywhere else? Because this
 * one runs in the browser on every keystroke, and mathjs is about half a
 * megabyte. A learner on a school connection should not download a computer
 * algebra system to be shown that `m^5` means m to the fifth.
 *
 * The risk in a second parser is that it disagrees with the first, and a
 * preview that lies about how the answer will be read is worse than no
 * preview. `to-tex.test.ts` pins that down: for a corpus of inputs it parses
 * each one with *both* this and mathjs and asserts the trees have the same
 * shape. This file is allowed to understand less than mathjs - it is not
 * allowed to understand something differently.
 */

type Token =
  | { kind: "number"; text: string }
  | { kind: "name"; text: string }
  | { kind: "op"; text: string }
  | { kind: "open" }
  | { kind: "close" }
  | { kind: "comma" };

class ParseError extends Error {}

/**
 * Functions that print as a named operator: `sin(x)` as `\sin\left(x\right)`.
 *
 * Without these, `cos` reaches the letter-run branch below and is printed as
 * the product c times o times s - which is what an answer of `\cos x` would
 * have looked like on the page. mathjs calls the natural logarithm `log` and
 * base ten `log10`; TeX calls them the other way round, which is why the two
 * are crossed over here.
 */
const NAMED_FUNCTIONS: Record<string, string> = {
  sin: "\\sin",
  cos: "\\cos",
  tan: "\\tan",
  csc: "\\csc",
  sec: "\\sec",
  cot: "\\cot",
  asin: "\\arcsin",
  acos: "\\arccos",
  atan: "\\arctan",
  sinh: "\\sinh",
  cosh: "\\cosh",
  tanh: "\\tanh",
  log: "\\ln",
  log10: "\\log",
  exp: "\\exp",
};

const FUNCTIONS = new Set([
  "sqrt",
  "cbrt",
  "abs",
  ...Object.keys(NAMED_FUNCTIONS),
]);

/** Names that are a symbol rather than a variable, and their TeX. */
const CONSTANTS: Record<string, string> = {
  pi: "\\pi",
  theta: "\\theta",
  infinity: "\\infty",
};

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index]!;

    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (
      /[0-9]/.test(char) ||
      (char === "." && /[0-9]/.test(source[index + 1] ?? ""))
    ) {
      let text = "";
      while (index < source.length && /[0-9.]/.test(source[index]!)) {
        text += source[index];
        index += 1;
      }
      tokens.push({ kind: "number", text });
      continue;
    }

    if (/[a-zA-Z]/.test(char)) {
      let text = "";
      while (index < source.length && /[a-zA-Z]/.test(source[index]!)) {
        text += source[index];
        index += 1;
      }
      /*
       * `log10` is one name, not a log times ten. This is the only name in
       * mathjs with a digit in it that reaches here, and widening the rule to
       * letters-then-digits would silently turn `x2` - a perfectly ordinary
       * typo for `x^2` - into a variable nobody can see is wrong.
       */
      if (text === "log" && source.slice(index, index + 2) === "10") {
        text = "log10";
        index += 2;
      }
      tokens.push({ kind: "name", text });
      continue;
    }

    if (char === "(") {
      tokens.push({ kind: "open" });
      index += 1;
      continue;
    }
    if (char === ")") {
      tokens.push({ kind: "close" });
      index += 1;
      continue;
    }
    if (char === ",") {
      tokens.push({ kind: "comma" });
      index += 1;
      continue;
    }
    if ("+-*/^".includes(char)) {
      tokens.push({ kind: "op", text: char });
      index += 1;
      continue;
    }

    throw new ParseError(`unexpected ${char}`);
  }

  return tokens;
}

/**
 * Precedence levels, used to decide where brackets are genuinely needed.
 * Printing every bracket the input had would make `(2)+(3)` of `2+3`; printing
 * none would make `1/(x+1)` into a fraction over just `x`.
 */
const SUM = 1;
const PRODUCT = 2;
const POWER = 3;
const ATOM = 4;

type Rendered = { tex: string; precedence: number };

function wrap(node: Rendered, minimum: number): string {
  return node.precedence < minimum ? `\\left(${node.tex}\\right)` : node.tex;
}

/**
 * A product, written the way it is written by hand.
 *
 * `3*sqrt(2)` is `3√2`, not `3 · √2`. The dot is only needed between two
 * numbers, where dropping it would silently turn 2 times 3 into twenty-three;
 * everywhere else it is noise, and on this site the noise lands on the "the
 * correct answer is" line, where an answer that looks more complicated than the
 * one the learner wrote is actively discouraging.
 *
 * The test is what the right-hand side *starts with*, because that is the only
 * thing that can run into the left.
 */
function times(left: string, right: string): string {
  /*
   * A negative right-hand side needs its brackets back. `x \cdot (-\sin x)`
   * printed as `x-\sin x` does not merely look wrong - it *is* a different
   * expression, and it is the one the learner would be shown as correct.
   */
  if (right.startsWith("-")) return `${left}\\left(${right}\\right)`;
  return /^[0-9.]/.test(right) ? `${left} \\cdot ${right}` : `${left}${right}`;
}

class Parser {
  private position = 0;

  constructor(private readonly tokens: Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private next(): Token {
    const token = this.tokens[this.position];
    if (!token) throw new ParseError("unexpected end");
    this.position += 1;
    return token;
  }

  private expect(kind: Token["kind"]): Token {
    const token = this.next();
    if (token.kind !== kind) throw new ParseError(`expected ${kind}`);
    return token;
  }

  parse(): Rendered {
    const node = this.parseSum();
    if (this.position !== this.tokens.length)
      throw new ParseError("trailing input");
    return node;
  }

  private parseSum(): Rendered {
    let left = this.parseProduct();
    for (;;) {
      const token = this.peek();
      if (token?.kind !== "op" || (token.text !== "+" && token.text !== "-"))
        break;
      this.next();
      const right = this.parseProduct();
      left = {
        tex: `${wrap(left, SUM)} ${token.text} ${wrap(right, SUM)}`,
        precedence: SUM,
      };
    }
    return left;
  }

  /** Handles explicit `*` and `/` as well as juxtaposition like `2x` or `x(x+1)`. */
  private parseProduct(): Rendered {
    let left = this.parseUnary();

    for (;;) {
      const token = this.peek();

      if (token?.kind === "op" && (token.text === "*" || token.text === "/")) {
        this.next();
        const right = this.parseUnary();
        left =
          token.text === "/"
            ? {
                tex: `\\frac{${right.tex === "" ? "" : left.tex}}{${right.tex}}`,
                precedence: ATOM,
              }
            : {
                tex: times(wrap(left, PRODUCT), wrap(right, PRODUCT)),
                precedence: PRODUCT,
              };
        continue;
      }

      // Implicit multiplication: a value immediately followed by another value.
      if (
        token?.kind === "number" ||
        token?.kind === "name" ||
        token?.kind === "open"
      ) {
        const right = this.parseUnary();
        left = {
          tex: `${wrap(left, PRODUCT)}${wrap(right, PRODUCT)}`,
          precedence: PRODUCT,
        };
        continue;
      }

      break;
    }

    return left;
  }

  private parseUnary(): Rendered {
    const token = this.peek();
    if (token?.kind === "op" && (token.text === "-" || token.text === "+")) {
      this.next();
      const operand = this.parseUnary();
      return {
        tex: `${token.text}${wrap(operand, PRODUCT)}`,
        precedence: PRODUCT,
      };
    }
    return this.parsePower();
  }

  private parsePower(): Rendered {
    const base = this.parseAtom();
    const token = this.peek();
    if (token?.kind === "op" && token.text === "^") {
      this.next();
      // Right-associative, and the exponent never needs brackets in TeX
      // because the braces already group it.
      const exponent = this.parseUnary();
      return {
        tex: `${wrap(base, ATOM)}^{${exponent.tex}}`,
        precedence: POWER,
      };
    }
    return base;
  }

  private parseAtom(): Rendered {
    const token = this.next();

    if (token.kind === "number") {
      return { tex: token.text, precedence: ATOM };
    }

    if (token.kind === "name") {
      const lower = token.text.toLowerCase();

      if (FUNCTIONS.has(lower) && this.peek()?.kind === "open") {
        this.expect("open");
        const argument = this.parseSum();
        this.expect("close");
        if (lower === "sqrt") {
          return { tex: `\\sqrt{${argument.tex}}`, precedence: ATOM };
        }
        if (lower === "cbrt") {
          return { tex: `\\sqrt[3]{${argument.tex}}`, precedence: ATOM };
        }
        const named = NAMED_FUNCTIONS[lower];
        if (named) {
          return {
            tex: `${named}\\left(${argument.tex}\\right)`,
            precedence: ATOM,
          };
        }
        return { tex: `\\left|${argument.tex}\\right|`, precedence: ATOM };
      }

      if (CONSTANTS[lower]) {
        return { tex: CONSTANTS[lower]!, precedence: ATOM };
      }

      // A run of letters is a product of single-letter variables, which is how
      // the checker reads it too: `ac` is a times c, not a variable named ac.
      if (token.text.length > 1) {
        return { tex: token.text.split("").join(""), precedence: PRODUCT };
      }

      return { tex: token.text, precedence: ATOM };
    }

    if (token.kind === "open") {
      const inner = this.parseSum();
      this.expect("close");
      // Remember it was bracketed, but let the printer decide if it still is.
      return { tex: inner.tex, precedence: inner.precedence };
    }

    throw new ParseError("expected a value");
  }
}

/**
 * True when the text is already LaTeX rather than typed plain text.
 *
 * A backslash is the usual tell: the plain-text answer format has no use for
 * one, and every LaTeX command starts with it. Answers built in the maths field
 * arrive this way and should be rendered as they are.
 *
 * A braced superscript is the other tell, and leaving it out was a bug. The
 * maths field produces `x^{12}` for an exponent with no command anywhere in it,
 * so a backslash-only test called that plain text, handed it to the plain-text
 * parser, got nothing back - braces are not part of that grammar - and fell
 * through to the monospace branch. The learner's answer was then displayed as
 * the literal characters `x^{12}`. `lib/math/check.ts` already tests for both,
 * for the same reason; these two are meant to agree.
 */
export function looksLikeLatex(source: string): boolean {
  return /\\[a-zA-Z]/.test(source) || /[\^_]\s*\{/.test(source);
}

/**
 * One expression to TeX, or `null` when it cannot be read.
 *
 * `null` is a normal outcome, not a failure: a half-typed `2x +` is
 * unreadable and the box simply shows nothing yet.
 */
export function toTex(source: string): string | null {
  const trimmed = source.trim();
  if (trimmed === "") return null;
  try {
    return new Parser(tokenize(trimmed)).parse().tex;
  } catch {
    return null;
  }
}

/**
 * A whole answer, which may be a set: `2, -5` renders as `2, -5` with each
 * part laid out properly. Returns null if *any* part is unreadable, because a
 * half-rendered set is more confusing than none.
 */
export function answerToTex(source: string): string | null {
  const trimmed = source.trim();
  if (trimmed === "") return null;

  const stripped = trimmed.replace(/^\{([\s\S]*)\}$/, "$1");
  // "x = 2, x = -5" and "2, -5" are both sets; drop the "x =" the learner may
  // have written, the same way the checker does.
  const parts = stripped
    .split(",")
    .map((part) => part.replace(/^\s*[a-zA-Z]\s*=\s*/, "").trim())
    .filter((part) => part !== "");

  if (parts.length === 0) return null;

  const rendered = parts.map(toTex);
  if (rendered.some((part) => part === null)) return null;
  return rendered.join(",\\quad ");
}
