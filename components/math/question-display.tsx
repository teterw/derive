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

  if (wordProblem) {
    return (
      <div className="rounded-xl border border-border bg-surface px-5 py-5">
        <p className="text-base leading-relaxed sm:text-lg">
          <MathText text={prompt} />
        </p>
        <div className="mt-4 overflow-x-auto border-t border-border pt-4">
          <Tex tex={stem} display className="text-lg" />
        </div>
      </div>
    );
  }

  /*
   * The question is the largest thing on the page, and the box around it is
   * quiet. It was the other way round: a small formula floating in a tall
   * bordered panel, so the panel read as the main object and the maths as an
   * afterthought. The padding now scales with the viewport instead of being a
   * fixed `py-8` that looked cavernous on a phone.
   */
  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-muted">
        <MathText text={prompt} />
      </p>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface px-4 py-6 sm:py-8">
        <Tex
          tex={stem}
          display
          className={
            size === "large"
              ? "text-2xl sm:text-3xl md:text-4xl"
              : "text-xl sm:text-2xl"
          }
        />
      </div>
    </div>
  );
}
