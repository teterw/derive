import { describe, expect, it } from "vitest";
import katex from "katex";
import { classify, segment } from "./math-text";
import { allRules } from "@/content/rules";
import { lessons } from "@/content/lessons";
import { generateQuestion, generators } from "@/content/generators";

const math = (text: string) =>
  segment(text)
    .filter((part) => part.kind === "math")
    .map((part) => part.value);

const prose = (text: string) =>
  segment(text)
    .filter((part) => part.kind === "text")
    .map((part) => part.value)
    .join("");

describe("classify", () => {
  it("calls notation notation", () => {
    for (const token of ["\\sqrt{16}", "x^2", "2x^2", "(-2)(-3)", "=", "12"]) {
      expect(classify(token), token).toBe("strong");
    }
  });

  it("calls a lone Latin letter weak, not notation", () => {
    for (const token of ["x", "A", "a"]) {
      expect(classify(token), token).toBe("weak");
    }
  });

  it("still calls hyphenated English a word", () => {
    for (const token of ["step-by-step", "A-Level", "well-known"]) {
      expect(classify(token), token).toBe("prose");
    }
  });

  it("calls words words, in both languages", () => {
    for (const token of ["the", "product", "เหมือนกัน", "ฐานเป็น"]) {
      expect(classify(token), token).toBe("prose");
    }
  });
});

describe("segment", () => {
  it("pulls notation out of Thai prose", () => {
    expect(math("ฐานเป็น m เหมือนกัน จึงนำเลขชี้กำลังมาบวกกัน")).toEqual([]);
    expect(math("ครึ่งหนึ่งของ 6 คือ 3")).toEqual(["6", "3"]);
    expect(math("\\sqrt{16} = 4 ถอดออกมาได้")).toEqual(["\\sqrt{16} = 4"]);
  });

  it("keeps a variable attached to the formula it belongs to", () => {
    expect(math("so x = 2")).toEqual(["x = 2"]);
  });

  it("renders a coefficient beside a variable as maths", () => {
    expect(math("คิดดิสคริมิแนนต์ b^2 - 4ac ก่อน")).toEqual(["b^2 - 4ac"]);
    expect(math("so 4ac is subtracted")).toEqual(["4ac"]);
  });

  /**
   * `bx` is genuinely ambiguous - two letters, no digit, no operator, exactly
   * like the English words "is" and "by" that surround it in real sentences.
   * The guess cannot win, so content marks those few formulas explicitly.
   */
  it("needs explicit delimiters when a term is indistinguishable from a word", () => {
    expect(math("the general form ax^2 + bx + c = 0 solves")).not.toEqual([
      "ax^2 + bx + c = 0",
    ]);
    expect(math("the general form $ax^2 + bx + c = 0$ solves")).toEqual([
      "ax^2 + bx + c = 0",
    ]);
  });

  it("does not turn the English article a into a variable", () => {
    expect(math("a perfect square")).toEqual([]);
    expect(prose("a perfect square")).toBe("a perfect square");
  });

  it("does not turn a dash into a minus sign", () => {
    expect(math("Careful - one of the roots is a fraction")).toEqual([]);
  });

  it("leaves sentence punctuation outside the formula", () => {
    expect(math("4 + 2 = 6.")).toEqual(["4 + 2 = 6"]);
    expect(prose("4 + 2 = 6.")).toBe(".");
  });

  /**
   * The bug: `)` was stripped as sentence punctuation wherever a run ended
   * with one, so every `\left(...\right)` written inside a sentence lost its
   * closing bracket and KaTeX threw on the fragment. Half the ม.2 factoring
   * chapter's explanations are a bracket in the middle of a sentence.
   */
  it("keeps a bracket that the formula itself opened", () => {
    const sentence = "จึงเขียนเป็น \\left(x - 1\\right) ยกกำลังสอง";
    expect(math(sentence)).toEqual(["\\left(x - 1\\right)"]);
    expect(prose(sentence)).not.toContain(")");
  });

  it("still strips a bracket the formula did not open", () => {
    expect(math("the root is 2 + 3)")).toEqual(["2 + 3"]);
    expect(math("x^2 = 4).")).toEqual(["x^2 = 4"]);
  });

  it("honours explicit dollar delimiters", () => {
    expect(math("the value $a$ matters")).toEqual(["a"]);
  });

  it("keeps the whole sentence, whichever way it splits", () => {
    const samples = [
      "ฐานเป็น m เหมือนกัน จึงนำเลขชี้กำลังมาบวกกัน",
      "The base x is the same, so the exponents add.",
      "72 = 36 \\times 2 และ 36 เป็นกำลังสองสมบูรณ์",
    ];
    for (const sample of samples) {
      const rebuilt = segment(sample)
        .map((part) => part.value)
        .join("");
      expect(rebuilt.replace(/\s+/g, " ")).toBe(sample.replace(/\s+/g, " "));
    }
  });
});

/**
 * The segmenter runs on every explanation in the app, so it has to cope with
 * the whole corpus - not just the examples above.
 */
describe("the real corpus", () => {
  function everyString(): string[] {
    const strings: string[] = [];

    for (const rule of allRules) {
      strings.push(rule.plain.th, rule.plain.en);
      if (rule.conditions) strings.push(rule.conditions.th, rule.conditions.en);
      for (const example of rule.examples) {
        if (example.note) strings.push(example.note.th, example.note.en);
      }
    }

    for (const lesson of lessons) {
      strings.push(
        lesson.intro.th,
        lesson.intro.en,
        lesson.bigIdea.th,
        lesson.bigIdea.en,
        ...lesson.pitfalls.flatMap((pitfall) => [pitfall.th, pitfall.en]),
      );
    }

    for (const generator of generators) {
      for (const difficulty of generator.difficulties) {
        for (const seed of [1, 2, 3, 5, 8]) {
          const question = generateQuestion(generator.id, seed, difficulty);
          strings.push(question.prompt.th, question.prompt.en);
          for (const step of question.steps) {
            strings.push(step.explain.th, step.explain.en);
          }
          for (const hint of question.hints) strings.push(hint.th, hint.en);
          for (const mistake of question.misconceptions ?? []) {
            strings.push(mistake.explain.th, mistake.explain.en);
          }
        }
      }
    }

    return strings;
  }

  const corpus = everyString();

  it("covers a corpus worth testing against", () => {
    expect(corpus.length).toBeGreaterThan(1000);
  });

  it("never loses or invents a character", () => {
    for (const text of corpus) {
      const rebuilt = segment(text)
        .map((part) => part.value)
        .join("");
      // `$` is a delimiter, not content - it is consumed on the way through.
      expect(rebuilt.replace(/\s+/g, " ").trim()).toBe(
        text.replace(/\$/g, "").replace(/\s+/g, " ").trim(),
      );
    }
  });

  /**
   * A dash used as punctuation, swallowed by the formula in front of it.
   *
   * "ไม่ใช่ x - คูณกลับ" reads as a sentence and renders as one on a page. Put
   * a variable immediately before the dash and the segmenter sees `x` followed
   * by an operator, decides the pair is notation, and KaTeX typesets it as
   * `x−` - a minus sign hanging off the end of a formula, with the sentence's
   * punctuation gone. It renders perfectly, so the check above is happy.
   *
   * A maths fragment ending in a bare operator is always this mistake: no
   * expression worth showing ends in a `+`. The fix is `$x$`, which says which
   * part is notation rather than leaving it to be guessed.
   */
  it("never ends a formula on a dangling operator", () => {
    // Every offender at once: this is an authoring mistake, and finding them
    // one failed run at a time is how a five-minute fix takes an hour.
    const dangling = new Set<string>();
    for (const text of corpus) {
      for (const part of segment(text)) {
        if (part.kind !== "math") continue;
        /*
         * A fragment that is *only* an operator is a deliberate one - the
         * `$<$` in "the sign turns from < to >" - and renders exactly as
         * intended. What is wrong is an operator left hanging off the end of
         * something, which is a sentence dash swallowed by the formula in
         * front of it.
         */
        const fragment = part.value.trim();
        if (fragment.length > 1 && /[-+*/=<>]$/.test(fragment)) {
          dangling.add(text);
        }
      }
    }
    expect(
      dangling.size,
      ["wrap the formula in $...$:", ...dangling].join("\n  "),
    ).toBe(0);
  });

  it("only hands KaTeX fragments it can actually render", () => {
    for (const text of corpus) {
      for (const part of segment(text)) {
        if (part.kind !== "math") continue;
        expect(
          () => katex.renderToString(part.value, { throwOnError: true }),
          `from ${JSON.stringify(text)}: ${part.value}`,
        ).not.toThrow();
      }
    }
  });

  /**
   * A mis-escaped command in a template literal loses its backslash: "\left"
   * written with one backslash becomes plain "left", which the check above
   * cannot see because there is no backslash left to find. "\times" is worse:
   * it becomes a tab. Both have happened here, so both are checked for.
   */
  it("never contains a LaTeX command that lost its backslash", () => {
    const COMMANDS =
      /\b(left|right|frac|sqrt|cdot|times|div|neq|geq|leq|pm)\s*[({]/;
    const TAB = String.fromCharCode(9);
    for (const text of corpus) {
      // Strip the properly escaped commands first; anything left is a slip.
      const stripped = text.replace(/\\[a-zA-Z]+/g, " ");
      expect(
        COMMANDS.test(stripped),
        `command missing its backslash: ${text}`,
      ).toBe(false);
      expect(text.includes(TAB), `stray tab from a bad escape: ${text}`).toBe(
        false,
      );
    }
  });

  it("never leaves a raw KaTeX command sitting in prose", () => {
    for (const text of corpus) {
      for (const part of segment(text)) {
        if (part.kind !== "text") continue;
        expect(
          /\\[a-zA-Z]+/.test(part.value),
          `unrendered command in ${JSON.stringify(text)}: ${part.value}`,
        ).toBe(false);
      }
    }
  });
});
