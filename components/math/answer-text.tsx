import { answerToTex } from "@/lib/math/to-tex";
import { Tex } from "./katex";
import { cn } from "@/lib/utils";

/**
 * An answer - the learner's or the right one - shown as maths.
 *
 * Everywhere an answer is displayed it came in as typed text, and typed text
 * is the form a person is *least* able to read back: `3*sqrt(5)/2` is a thing
 * you have to decode rather than see. Feedback that has to be decoded is not
 * feedback.
 *
 * Input that cannot be parsed still has to be shown, because it is what the
 * learner actually typed and hiding it would be dishonest about why the answer
 * was marked wrong. That case falls back to monospace, which at least signals
 * "this is literal text".
 */
export function AnswerText({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const tex = answerToTex(value);

  /*
   * `data-answer` carries the answer as it was typed. Once it is rendered,
   * KaTeX has scattered it across a few dozen spans and there is no longer any
   * single node whose text is "2, 3" - so this is what a test, or the render
   * check, asserts against instead of picking through KaTeX's internals.
   */
  if (tex === null) {
    return (
      <span data-answer={value} className={cn("font-mono", className)}>
        {value}
      </span>
    );
  }

  return (
    <span data-answer={value} className={className}>
      <Tex tex={tex} />
    </span>
  );
}
