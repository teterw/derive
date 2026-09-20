import {
  coefficient,
  gcd,
  isPerfectSquare,
  linearExpr,
  paren,
  sumTerms,
} from "../format";
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

const TOPIC = "poly.factor-higher";

const PROMPT = {
  th: "จงแยกตัวประกอบโดยการจัดหมู่",
  en: "Factorise by grouping",
};

/**
 * จัดหมู่พหุนามดีกรีสาม.
 *
 * The ม.2 grouping skill again, one degree up: built backwards from
 * `(px + a)(x^2 + b)`, expanded into the four terms `px^3 + ax^2 + pbx + ab`
 * and left uncollected. What changes is the first pair - `px^3 + ax^2` gives
 * up an `x^2`, not an `x` - and what is left is a quadratic rather than a
 * linear factor.
 *
 * `b` is never a value that would let `x^2 + b` factor again, except at
 * difficulty 4 where it always does and the last step says so. Otherwise the
 * stated answer would not be the fully factored one, and the marker would be
 * accepting an answer more correct than the one being taught.
 */
type Shape = { p: number; a: number; b: number; splits: boolean };

function shapeFor(rng: RNG, difficulty: Difficulty): Shape {
  if (difficulty === 4) {
    // `(x + a)(x^2 - k^2)`, which goes on to a difference of squares.
    const k = rng.int(2, 6);
    let a = rng.nonZeroInt(-6, 6);
    // `a = ±k` would repeat a factor, and `(x-2)(x-2)(x+2)` is written squared.
    if (Math.abs(a) === k) a = a > 0 ? a + 1 : a - 1;
    return { p: 1, a, b: -(k * k), splits: true };
  }

  const p = difficulty === 3 ? rng.int(2, 4) : 1;
  let a = difficulty === 1 ? rng.int(1, 6) : rng.nonZeroInt(-6, 6);
  while (gcd(p, a) !== 1) a += a < 0 ? -1 : 1;

  /*
   * `x^2 + b` must not factor. It cannot when `b` is positive; when it is
   * negative it is a difference of squares exactly when `|b|` is a square, so
   * those values are the ones to step over.
   */
  let b = difficulty === 1 ? rng.int(2, 9) : rng.nonZeroInt(-9, 9);
  while (b < 0 && isPerfectSquare(-b)) b -= 1;

  return { p, a, b, splits: false };
}

function build(rng: RNG, difficulty: Difficulty) {
  const { p, a, b, splits } = shapeFor(rng, difficulty);

  /** The shared bracket, `px + a`, and the quadratic it multiplies. */
  const shared = linearExpr(p, a);
  const quadratic = sumTerms(["x^2", String(b)]);

  /** `px^3 + ax^2 + pbx + ab`, kept apart and in that order. */
  const terms = [
    coefficient(p, "x^3"),
    coefficient(a, "x^2"),
    coefficient(p * b, "x"),
    String(a * b),
  ];
  const stem = sumTerms(terms);

  const pairOne = sumTerms([terms[0]!, terms[1]!]);
  const pairTwo = sumTerms([terms[2]!, terms[3]!]);

  const grouped = sumTerms([paren(pairOne), paren(pairTwo)]);
  const pulled = sumTerms([
    `x^2${paren(shared)}`,
    coefficient(b, paren(shared)),
  ]);
  const halfway = `${paren(shared)}${paren(quadratic)}`;

  const steps: Step[] = [
    makeStep(grouped, "poly.grouping", {
      th: "จับสองพจน์แรกเข้าคู่ และสองพจน์หลังเข้าคู่",
      en: "Pair the first two terms, and the last two.",
    }),
    makeStep(pulled, "quad.common-factor", {
      th: `คู่หน้าดึง x^2 ออกมาได้ ไม่ใช่แค่ x ส่วนคู่หลังดึง ${b} ออกมา`,
      en: `The first pair gives up an x^2, not just an x; the second gives up ${b}.`,
    }),
    makeStep(halfway, "poly.grouping", {
      th: `ทั้งสองคู่เหลือ ${paren(shared)} เหมือนกัน จึงดึงออกมาได้อีกชั้น`,
      en: `Both pairs leave the same ${paren(shared)}, so that comes out too.`,
    }),
  ];

  const root = splits ? Math.round(Math.sqrt(-b)) : 0;
  const answerKatex = splits
    ? `${paren(shared)}${paren(linearExpr(1, -root))}${paren(linearExpr(1, root))}`
    : halfway;
  const answerMath = splits
    ? `(${shared})*(${linearExpr(1, -root)})*(${linearExpr(1, root)})`
    : `(${shared})*(${quadratic})`;

  if (splits) {
    steps.push(
      makeStep(answerKatex, "quad.diff-squares", {
        th: `ยังไม่จบ เพราะ ${quadratic} เป็นผลต่างกำลังสอง แยกต่อได้อีก`,
        en: `Not finished: ${quadratic} is a difference of squares and factors again.`,
      }),
    );
  }

  const misconceptions: Misconception[] = namedMistakes(
    { kind: "exact", value: answerMath },
    [
      /*
       * The sign on the second pair. `-5x - 15` needs `-5` taken out, not `5`;
       * a learner who pulls the positive does not notice that the bracket left
       * behind no longer matches the first pair's, and writes the sign they
       * expected.
       */
      ...(b < 0 && !splits
        ? [
            {
              answer: {
                kind: "exact" as const,
                value: `(${shared})*(${sumTerms(["x^2", String(-b)])})`,
              },
              explain: {
                th: `คู่หลังเป็นลบ ต้องดึง ${b} ออกมาทั้งเครื่องหมาย ถ้าดึง ${-b} วงเล็บที่เหลือจะไม่เหมือนคู่หน้า`,
                en: `The second pair is negative, so ${b} comes out with its sign. Take out ${-b} and the bracket left behind no longer matches the first pair's.`,
              },
            },
          ]
        : []),
      /*
       * Taking `x` out of the first pair rather than `x^2` - the one thing
       * that is different from the degree-two version of this skill.
       */
      {
        answer: {
          kind: "exact" as const,
          value: `(${shared})*(${sumTerms(["x", String(b)])})`,
        },
        explain: {
          th: `คู่หน้าดึงได้ถึง x^2 ไม่ใช่แค่ x ถ้าดึงแค่ x จะเหลือ ${paren(sumTerms([coefficient(p, "x^2"), coefficient(a, "x")]))} ซึ่งไม่ตรงกับคู่หลัง`,
          en: `The first pair has an x^2 in common, not just an x. Taking out only x leaves ${paren(sumTerms([coefficient(p, "x^2"), coefficient(a, "x")]))}, which does not match the second pair.`,
        },
      },
    ],
  );

  return {
    stem,
    answerKatex,
    answerMath,
    steps,
    misconceptions,
    hints: [
      {
        th: "โจทย์มีสี่พจน์ ลองจับสองพจน์แรกเข้าคู่ และสองพจน์หลังเข้าคู่",
        en: "There are four terms: pair the first two, and the last two.",
      },
      {
        th: `คู่หน้า ${paren(pairOne)} ดึง x^2 ออกมาได้`,
        en: `The first pair, ${paren(pairOne)}, gives up an x^2.`,
      },
      {
        th: splits
          ? `ทั้งสองคู่เหลือ ${paren(shared)} เหมือนกัน แล้วดูวงเล็บที่เหลืออีกทีว่าแยกต่อได้ไหม`
          : `ถ้าทำถูก ทั้งสองคู่จะเหลือ ${paren(shared)} เหมือนกัน`,
        en: splits
          ? `Both pairs leave the same ${paren(shared)}, and then the other bracket is worth a second look.`
          : `Done right, both pairs leave the same ${paren(shared)}.`,
      },
    ],
  };
}

export const polyHigherGrouping: Generator = {
  id: "poly.higher-grouping",
  skillId: "poly.higher-grouping",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const built = build(rng, difficulty);
    return {
      id: `${polyHigherGrouping.id}:${rng.seed}:${difficulty}`,
      generatorId: polyHigherGrouping.id,
      skillId: polyHigherGrouping.skillId,
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
