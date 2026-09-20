import { describe, expect, it } from "vitest";
import { allRules } from "./rules";
import { skills } from "./topics";
import { generators, generateQuestion } from "./generators";
import type { Difficulty } from "./types";

/**
 * A shared KaTeX string has to read the same in both languages.
 *
 * Most strings in this app come in pairs - `{ th, en }` - and the renderer
 * picks one. A handful do not: a rule's `statement`, its worked examples, a
 * skill's `formula`, a question's `stem`, and the KaTeX of a derivation step
 * are each *one* string, shown to a Thai reader and an English reader alike.
 *
 * Put a Thai word inside `\text{...}` in one of those and it appears, in Thai,
 * on the English page. `\frac{0}{0} \Rightarrow แยกตัวประกอบแล้วตัดทอน` sat on
 * the English lesson for `calc.limits` doing exactly that, and it was
 * unmissable on screen while being invisible to every test in the suite.
 *
 * The principle was already written down - `eq-linear-word.ts` uses `\square`
 * rather than `\text{จำนวน}` and says why: "unlike `\text{จำนวน}` it reads the
 * same in both languages." It just was not enforced anywhere.
 *
 * ## What to do when this fails
 *
 * Reach for notation first, because a formula full of words is usually a
 * formula that has not been written properly yet:
 *
 *   - "on [a, b]"       -> `x \in [a, b]`
 *   - "increasing"      -> `\nearrow`
 *   - "minimum"         -> `\min`
 *   - "upper - lower"   -> `f(x) - g(x)`
 *   - "width x length"  -> `w \times \ell`
 *
 * Where the words are genuinely doing linguistic work, move them out of the
 * KaTeX and into the bilingual field beside it - `plain`, `note`, or the
 * question's `prompt`. A derivation step has its own escape hatch, `exprEn`,
 * and a step carrying one is not an offence here.
 */

/** Thai, and the other scripts a stray paste could bring in. */
const NON_LATIN = /[฀-๿ऀ-ॿ一-鿿؀-ۿ]/;

const SEEDS = [1, 2, 3, 5, 8, 13, 21];

function offenders(): string[] {
  const found: string[] = [];
  const check = (where: string, katex: string) => {
    if (NON_LATIN.test(katex)) found.push(`${where}\n      ${katex}`);
  };

  for (const rule of allRules) {
    check(`rule ${rule.id} · statement`, rule.statement);
    rule.examples.forEach((example, index) => {
      check(`rule ${rule.id} · example ${index} from`, example.from);
      check(`rule ${rule.id} · example ${index} to`, example.to);
    });
  }

  for (const skill of skills) {
    check(`skill ${skill.id} · formula`, skill.formula);
  }

  for (const generator of generators) {
    for (const difficulty of generator.difficulties as Difficulty[]) {
      for (const seed of SEEDS) {
        const question = generateQuestion(generator.id, seed, difficulty);
        const where = `${generator.id} d${difficulty} seed ${seed}`;
        check(`${where} · stem`, question.stem);
        question.steps.forEach((step, index) => {
          /*
           * A step may carry words - "x = 2 หรือ x = 3" - and `Step` already
           * has the escape hatch for it: `exprEn` is the English line, and the
           * renderer picks. So a step is only an offence when it has words and
           * no translation beside them.
           */
          if (step.exprEn) return;
          check(`${where} · step ${index}`, step.expr);
        });
      }
    }
  }

  return found;
}

describe("shared KaTeX", () => {
  it("is language-neutral, because both locales are shown the same string", () => {
    const found = offenders();
    expect(
      found,
      `\n  ${found.length} shared KaTeX string(s) carry words from one language:\n\n    ${found.join("\n    ")}\n`,
    ).toEqual([]);
  });
});
