import { coefficient, gcd, linearExpr, paren, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type {
  Difficulty,
  Generator,
  Misconception,
  Question,
  RNG,
  Step,
} from "../types";

const TOPIC = "poly.factor-degree-2";

const PROMPT = {
  th: "จงแยกตัวประกอบ",
  en: "Factorise",
};

/**
 * แยกตัวประกอบโดยใช้ตัวแปรแทน.
 *
 * The chunk is written as `\left(x^2\right)` rather than given a new letter.
 * Textbooks introduce a `u` here, and a `u` is one more thing to explain, one
 * more thing to substitute back, and a letter outside the two this app has
 * agreed to use for unknowns (`VARIABLES` in `content/format.ts`, and
 * `pnpm vars`). Showing the chunk in its own bracket says the same thing and
 * leaves nothing to put back.
 *
 * Difficulty 2 is the one that matters: the trinomial factors, and then both
 * brackets factor *again*. Stopping at `\left(x^2 - 4\right)\left(x^2 - 9\right)`
 * is the mistake, and the steps say so rather than jumping to the end.
 */

/** Values whose square root is not an integer, so `x^2 - n` stops there. */
const NOT_SQUARES = [2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 14, 15];

/**
 * `(m, n)` for the pairs that factor twice, small enough that the constant
 * term stays readable: `m^2 n^2` with `mn <= 24` is at most 576.
 */
const SQUARE_PAIRS: [number, number][] = (() => {
  const pairs: [number, number][] = [];
  for (let m = 1; m <= 7; m++) {
    for (let n = m + 1; n <= 7; n++) {
      if (m * n <= 24) pairs.push([m, n]);
    }
  }
  return pairs;
})();

type Built = {
  stem: string;
  answerKatex: string;
  answerMath: string;
  steps: Step[];
  hints: { th: string; en: string }[];
  misconceptions: Misconception[];
};

const CHUNK = paren("x^2");

/** `x^4 - (p+q)x^2 + pq`, which stops at two quadratic brackets. */
function quartic(rng: RNG, difficulty: Difficulty): Built {
  const a = difficulty === 3 ? rng.int(2, 3) : 1;

  /*
   * `p` goes with the `ax^2` bracket and has to be coprime to `a`, or the
   * whole polynomial has a common factor that should have come out first.
   * Both of these walk a *bounded* list rather than looping until the draw is
   * lucky - the first version of this advanced `q` when the condition it was
   * testing was about `p`, which never became false and hung the suite.
   */
  const candidates = NOT_SQUARES.filter((value) => gcd(a, value) === 1);
  const p = rng.pick(candidates);
  const others = candidates.filter((value) => value !== p);
  const q = rng.pick(others);

  const middle = -(a * q + p);
  const last = p * q;

  const stem = sumTerms([
    coefficient(a, "x^4"),
    coefficient(middle, "x^2"),
    String(last),
  ]);

  const bracketOne = sumTerms([coefficient(a, "x^2"), String(-p)]);
  const bracketTwo = sumTerms(["x^2", String(-q)]);
  const answerKatex = `${paren(bracketOne)}${paren(bracketTwo)}`;
  const answerMath = `(${bracketOne})*(${bracketTwo})`;

  const asChunk = sumTerms([
    a === 1 ? `${CHUNK}^2` : `${a}${CHUNK}^2`,
    coefficient(middle, CHUNK),
    String(last),
  ]);

  return {
    stem,
    answerKatex,
    answerMath,
    steps: [
      makeStep(asChunk, "poly.substitute", {
        th: `เขียนใหม่โดยมอง ${CHUNK} เป็นก้อนเดียว จะได้ตรีนามธรรมดา`,
        en: `Rewrite it with ${CHUNK} as a single chunk, and it is an ordinary trinomial.`,
      }),
      makeStep(answerKatex, "quad.trinomial-pattern", {
        th:
          a === 1
            ? `หาสองจำนวนที่คูณกันได้ ${last} และบวกกันได้ ${middle}: ได้ ${-p} กับ ${-q}`
            : `สัมประสิทธิ์หน้าก้อนคือ ${a} จึงแยกเป็น ${paren(bracketOne)} คูณกับ ${paren(bracketTwo)}`,
        en:
          a === 1
            ? `Two numbers multiplying to ${last} and adding to ${middle}: ${-p} and ${-q}.`
            : `The coefficient in front of the chunk is ${a}, so the factors are ${paren(bracketOne)} and ${paren(bracketTwo)}.`,
      }),
    ],
    misconceptions: namedMistakes({ kind: "exact", value: answerMath }, [
      /*
       * Factoring the trinomial correctly and then writing the result against
       * `x` instead of against the chunk. Exactly the step the method exists
       * to make explicit.
       */
      {
        answer: {
          kind: "exact",
          value: `(${linearExpr(a, -p)})*(${linearExpr(1, -q)})`,
        },
        explain: {
          th: `ก้อนที่แยกได้คือ ${CHUNK} ไม่ใช่ $x$ ถ้าคูณ ${paren(linearExpr(a, -p))}${paren(linearExpr(1, -q))} กลับ จะได้พหุนามดีกรีสอง ไม่ใช่ดีกรีสี่`,
          en: `The chunk that came out of the trinomial was ${CHUNK}, not x. Multiplying ${paren(linearExpr(a, -p))}${paren(linearExpr(1, -q))} back out gives a degree-two polynomial, not a degree-four one.`,
        },
      },
    ]),
    hints: [
      {
        th: `โจทย์มีแต่ x^4 กับ x^2 ลองมอง ${CHUNK} เป็นก้อนเดียว`,
        en: `There is only x^4 and x^2 here, so try treating ${CHUNK} as one chunk.`,
      },
      {
        th: `จะได้ตรีนามที่คูณกันได้ ${last} และบวกกันได้ ${middle}`,
        en: `That gives a trinomial: two numbers multiplying to ${last} and adding to ${middle}.`,
      },
      {
        th: `คือ ${-p} กับ ${-q} แล้วอย่าลืมว่าก้อนคือ ${CHUNK}`,
        en: `They are ${-p} and ${-q}, and remember the chunk is ${CHUNK}.`,
      },
    ],
  };
}

/** `x^4 - (m^2+n^2)x^2 + m^2n^2`, which factors all the way to four brackets. */
function factorsTwice(rng: RNG): Built {
  const [m, n] = rng.pick(SQUARE_PAIRS);
  const middle = -(m * m + n * n);
  const last = m * m * n * n;

  const stem = sumTerms(["x^4", coefficient(middle, "x^2"), String(last)]);

  const halfway = `${paren(`x^2 - ${m * m}`)}${paren(`x^2 - ${n * n}`)}`;
  const answerKatex = [m, n]
    .flatMap((root) => [paren(`x - ${root}`), paren(`x + ${root}`)])
    .join("");
  const answerMath = [m, n]
    .flatMap((root) => [`(x - ${root})`, `(x + ${root})`])
    .join("*");

  const asChunk = sumTerms([
    `${CHUNK}^2`,
    coefficient(middle, CHUNK),
    String(last),
  ]);

  return {
    stem,
    answerKatex,
    answerMath,
    steps: [
      makeStep(asChunk, "poly.substitute", {
        th: `มอง ${CHUNK} เป็นก้อนเดียว`,
        en: `Treat ${CHUNK} as one chunk.`,
      }),
      makeStep(halfway, "quad.trinomial-pattern", {
        th: `สองจำนวนที่คูณกันได้ ${last} และบวกกันได้ ${middle} คือ ${-(m * m)} กับ ${-(n * n)}`,
        en: `Two numbers multiplying to ${last} and adding to ${middle}: ${-(m * m)} and ${-(n * n)}.`,
      }),
      makeStep(answerKatex, "quad.diff-squares", {
        th: `ยังไม่จบ เพราะ ${m * m} และ ${n * n} เป็นกำลังสองสมบูรณ์ ทั้งสองวงเล็บจึงยังเป็นผลต่างกำลังสองที่แยกต่อได้อีก`,
        en: `Not finished: ${m * m} and ${n * n} are perfect squares, so both brackets are still differences of squares.`,
      }),
    ],
    /*
     * "Stopped halfway" is the mistake here, and it cannot be a named wrong
     * answer: `(x^2-4)(x^2-9)` *is* the right value, and `namedMistakes` would
     * drop it - correctly, because telling a learner who wrote it that they
     * are wrong would be worse than saying nothing. It is taught in the last
     * step and in the hint instead.
     */
    misconceptions: [],
    hints: [
      {
        th: `มอง ${CHUNK} เป็นก้อนเดียวก่อน`,
        en: `Start by treating ${CHUNK} as one chunk.`,
      },
      {
        th: `จะแยกได้ ${halfway}`,
        en: `That gives ${halfway}.`,
      },
      {
        th: "ดูอีกที - แต่ละวงเล็บยังแยกต่อได้อีกหรือไม่",
        en: "Look again: can each bracket be factored further?",
      },
    ],
  };
}

/** `(x+k)^2 - (p+q)(x+k) + pq`, where the chunk is a bracket, not a power. */
function bracketChunk(rng: RNG): Built {
  const k = rng.int(1, 6);
  const p = rng.int(1, 8);
  let q = rng.int(1, 8);
  // Distinct, and neither may cancel the k - `x` alone as a factor is a
  // different (easier) question and reads like a mistake in the answer.
  while (q === p || k - q === 0) q = (q % 8) + 1;
  const safeP = k - p === 0 ? p + 1 : p;

  const chunk = paren(linearExpr(1, k));
  const middle = -(safeP + q);
  const last = safeP * q;

  const stem = sumTerms([
    `${chunk}^2`,
    coefficient(middle, chunk),
    String(last),
  ]);

  const factored = `${paren(`${chunk} - ${safeP}`)}${paren(`${chunk} - ${q}`)}`;
  const answerKatex = `${paren(linearExpr(1, k - safeP))}${paren(linearExpr(1, k - q))}`;
  const answerMath = `(${linearExpr(1, k - safeP)})*(${linearExpr(1, k - q)})`;

  return {
    stem,
    answerKatex,
    answerMath,
    steps: [
      makeStep(factored, "poly.substitute", {
        th: `มอง ${chunk} เป็นก้อนเดียว จะได้สองจำนวนที่คูณกันได้ ${last} และบวกกันได้ ${middle} คือ ${-safeP} กับ ${-q}`,
        en: `With ${chunk} as the chunk, two numbers multiply to ${last} and add to ${middle}: ${-safeP} and ${-q}.`,
      }),
      makeStep(answerKatex, "arith.combine-like-terms", {
        th: "รวมพจน์ในแต่ละวงเล็บให้เรียบร้อย",
        en: "Tidy each bracket up.",
      }),
    ],
    misconceptions: namedMistakes({ kind: "exact", value: answerMath }, [
      {
        answer: {
          kind: "exact",
          value: `(${linearExpr(1, k + safeP)})*(${linearExpr(1, k + q)})`,
        },
        explain: {
          th: `สองจำนวนนั้นคือ ${-safeP} กับ ${-q} ไม่ใช่ ${safeP} กับ ${q} เพราะพจน์กลาง ${coefficient(middle, chunk)} เป็นลบ`,
          en: `The two numbers are ${-safeP} and ${-q}, not ${safeP} and ${q}, because the middle term ${coefficient(middle, chunk)} is negative.`,
        },
      },
    ]),
    hints: [
      {
        th: `${chunk} โผล่มาสองที ทั้งกำลังสองและตัวเปล่า ลองมองเป็นก้อนเดียว`,
        en: `${chunk} appears twice, squared and on its own - treat it as one chunk.`,
      },
      {
        th: `จะได้ ${factored}`,
        en: `That gives ${factored}.`,
      },
      {
        th: "แล้วรวมพจน์ในวงเล็บให้เรียบร้อย",
        en: "Then tidy up inside each bracket.",
      },
    ],
  };
}

export const polySubstitution: Generator = {
  id: "poly.substitution",
  skillId: "poly.substitution",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const built =
      difficulty === 2
        ? factorsTwice(rng)
        : difficulty === 4
          ? bracketChunk(rng)
          : quartic(rng, difficulty);

    return {
      id: `${polySubstitution.id}:${rng.seed}:${difficulty}`,
      generatorId: polySubstitution.id,
      skillId: polySubstitution.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: PROMPT,
      stem: built.stem,
      answer: { kind: "exact", value: built.answerMath },
      steps: built.steps,
      hints: built.hints,
      ...(built.misconceptions.length
        ? { misconceptions: built.misconceptions }
        : {}),
      rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
    };
  },
};
