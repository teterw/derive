import { checkAnswer } from "@/lib/math/check";
import type { Answer, Misconception } from "./types";

/**
 * Keeps only the named mistakes that are actually wrong.
 *
 * Some questions are symmetric in exactly the way a mistake is: the roots of
 * `x^2 - 4 = 0` are 2 and -2, so "you flipped the signs" describes the right
 * answer. Rather than making every generator reason about its own edge cases,
 * every candidate is checked against the real answer here and dropped if it
 * matches.
 *
 * The property gate asserts the same thing, so a generator that skips this
 * helper still cannot ship a misconception that accuses a correct learner.
 */
export function namedMistakes(
  answer: Answer,
  candidates: Misconception[],
): Misconception[] {
  return candidates.filter((candidate) => {
    const text = asText(candidate.answer);
    if (text === null) return false;
    return !checkAnswer(answer, text).correct;
  });
}

function asText(answer: Answer): string | null {
  switch (answer.kind) {
    case "exact":
      return answer.value;
    case "numeric":
      return String(answer.value);
    case "set":
      return answer.values.join(", ");
    case "choice":
      return answer.correct;
  }
}
