import { Tex } from "./katex";
import { MathText } from "./math-text";

/**
 * A question, presented the way its own shape asks for.
 *
 * Most questions are an instruction and an expression - "จงแยกตัวประกอบ" over
 * a big `x^2 - 5x + 6`. A word problem is the other way round: the sentence
 * *is* the question and the expression is a restatement, so putting the
 * sentence in small grey text above a large formula hides the actual problem.
 */
const WORD_PROBLEM_LENGTH = 70;

/**
 * The instruction is the question.
 *
 * It used to be `text-sm text-muted` floating above a `text-4xl` formula, and
 * that was a correctness bug rather than a matter of taste. The same
 * expression is asked about in several different ways - จงแยกตัวประกอบ,
 * จงหาผลลัพธ์, จงแก้สมการ - and two prompts can differ by one word
 * (จงจัดรูปให้อยู่ในรูปเลขยกกำลังอย่างง่าย against
 * จงจัดรูปให้อยู่ในรูปอย่างง่าย). The instruction was the only thing telling
 * those questions apart, and it was the quietest thing on the page. Skimming
 * it means answering, confidently, a question nobody asked.
 *
 * So it is a band at the top of the card rather than a caption above it: its
 * own region, with an accent rule down the left edge, a tint that separates it
 * from the formula below, and type at reading size and weight. The eye enters
 * the card at the instruction and reaches the maths second, which is the order
 * the question has to be read in.
 *
 * `data-prompt` is the hook the tests and `render-check` assert on - see
 * `question-display.test.tsx`, which exists specifically to stop this being
 * quietly demoted back to grey 14px.
 */
const INSTRUCTION =
  "border-b border-border border-l-4 border-l-accent bg-accent/10 " +
  "px-4 py-3 text-base font-semibold leading-snug text-fg sm:text-lg";

export function QuestionDisplay({
  prompt,
  stem,
  size = "large",
}: {
  prompt: string;
  stem: string;
  size?: "large" | "medium";
}) {
  const wordProblem = prompt.length > WORD_PROBLEM_LENGTH;

  /*
   * The question is the largest thing on the page, and the box around it is
   * quiet. It was the other way round: a small formula floating in a tall
   * bordered panel, so the panel read as the main object and the maths as an
   * afterthought. The padding now scales with the viewport instead of being a
   * fixed `py-8` that looked cavernous on a phone.
   */
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {/*
        A word problem's sentence is already the main object, so it keeps
        reading weight rather than instruction weight - but it lives in the
        same band, so "what am I being asked" is in the same place on every
        question in the app.
      */}
      <p
        data-prompt
        className={
          wordProblem
            ? "border-b border-border border-l-4 border-l-accent bg-accent/10 px-4 py-4 text-base font-medium leading-relaxed text-fg sm:text-lg"
            : INSTRUCTION
        }
      >
        <MathText text={prompt} />
      </p>

      <div className="overflow-x-auto px-4 py-6 sm:py-8">
        <Tex
          tex={stem}
          display
          className={
            wordProblem
              ? "text-lg sm:text-xl"
              : size === "large"
                ? "text-2xl sm:text-3xl md:text-4xl"
                : "text-xl sm:text-2xl"
          }
        />
      </div>
    </div>
  );
}
