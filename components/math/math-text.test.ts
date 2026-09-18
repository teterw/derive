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
      expect(rebuilt.replace(/\s+/g, " ").trim()).toBe(
        text.replace(/\s+/g, " ").trim(),
      );
    }
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
