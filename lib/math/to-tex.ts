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

const FUNCTIONS = new Set(["sqrt", "cbrt", "abs"]);

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

    if (/[0-9]/.test(char) || (char === "." && /[0-9]/.test(source[index + 1] ?? ""))) {
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
    if (this.position !== this.tokens.length) throw new ParseError("trailing input");
    return node;
  }

  private parseSum(): Rendered {
    let left = this.parseProduct();
    for (;;) {
      const token = this.peek();
      if (token?.kind !== "op" || (token.text !== "+" && token.text !== "-")) break;
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
                tex: `${wrap(left, PRODUCT)} \\cdot ${wrap(right, PRODUCT)}`,
                precedence: PRODUCT,
              };
        continue;
      }

      // Implicit multiplication: a value immediately followed by another value.
      if (token?.kind === "number" || token?.kind === "name" || token?.kind === "open") {
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
