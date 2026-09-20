// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { QuestionDisplay } from "./question-display";
import { generateQuestion, generators } from "@/content/generators";

/**
 * The instruction line is load-bearing, not decoration.
 *
 * Several generators ask about the same expression in different ways, and two
 * prompts can differ by a single word - จงจัดรูปให้อยู่ในรูปเลขยกกำลังอย่างง่าย
 * against จงจัดรูปให้อยู่ในรูปอย่างง่าย. When the prompt was 14px grey above a
 * 36px formula, the only thing distinguishing those two questions was the
 * quietest thing on the page.
 *
 * These assertions are about visual weight, which is unusual for a test and is
 * the point: the bug was entirely a styling decision, so a test that only
 * checked the text was present would have passed throughout.
 */
function promptNode(prompt: string, stem = "x^2 - 5x + 6"): HTMLElement {
  const { container } = render(<QuestionDisplay prompt={prompt} stem={stem} />);
  const node = container.querySelector("[data-prompt]");
  expect(node, "no [data-prompt] element").not.toBeNull();
  return node as HTMLElement;
}

describe("QuestionDisplay", () => {
  it("shows the instruction", () => {
    expect(promptNode("จงแยกตัวประกอบ").textContent).toContain(
      "จงแยกตัวประกอบ",
    );
  });

  it("does not whisper it", () => {
    const classes = promptNode("จงแยกตัวประกอบ").className;
    // The exact treatment the bug was made of.
    expect(classes, "the instruction is muted again").not.toContain(
      "text-muted",
    );
    expect(classes, "the instruction is small again").not.toContain("text-sm");
    expect(classes).toMatch(/font-(semibold|bold|medium)/);
  });

  it("puts the instruction above the maths, inside one card", () => {
    const { container } = render(
      <QuestionDisplay prompt="จงแยกตัวประกอบ" stem="x^2 - 5x + 6" />,
    );
    const prompt = container.querySelector("[data-prompt]")!;
    const katexNode = container.querySelector(".katex")!;
    expect(katexNode).not.toBeNull();
    // One card holds both...
    const card = prompt.parentElement!;
    expect(card.contains(katexNode)).toBe(true);
    // ...and the instruction comes first in it.
    expect(
      prompt.compareDocumentPosition(katexNode) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  /**
   * A word problem's sentence *is* the question, so it is not reduced to a
   * label - but it lives in the same band, so "what am I being asked" is in
   * the same place on every question in the app.
   */
  it("keeps a word problem's sentence at reading size", () => {
    const sentence =
      "สี่เหลี่ยมผืนผ้ารูปหนึ่งมีความยาวมากกว่าความกว้าง 3 เมตร และมีพื้นที่ 40 ตารางเมตร จงหาความกว้างเป็นเมตร";
    const node = promptNode(sentence, "x(x + 3) = 40");
    expect(node.textContent).toContain("จงหาความกว้าง");
    expect(node.className).not.toContain("text-muted");
  });

  /**
   * Every prompt in the corpus has to survive the segmenter and render.
   *
   * This is a full React render with KaTeX in it, once per generator per
   * difficulty per language, so it costs a few hundred renders and grows with
   * every chapter added. It went past the 5s default the day the trigonometry
   * chapter landed; the explicit timeout is generous on purpose, because the
   * alternative - sampling the corpus - would let exactly the sort of prompt
   * this is here to catch slip through.
   */
  it("renders every generator's prompt", { timeout: 60_000 }, () => {
    for (const generator of generators) {
      for (const difficulty of generator.difficulties) {
        const question = generateQuestion(generator.id, 7, difficulty);
        for (const locale of ["th", "en"] as const) {
          const node = promptNode(question.prompt[locale], question.stem);
          expect(
            node.textContent?.trim(),
            `${generator.id} d${difficulty} ${locale}`,
          ).not.toBe("");
        }
      }
    }
  });
});
