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
  th: "จงแยกตัวประกอบโดยการจัดหมู่",
  en: "Factorise by grouping",
};

/**
 * แยกตัวประกอบโดยการจัดหมู่.
 *
 * Built backwards from `g(Ax + B)(Cx + D)`, expanded but **not collected**: the
 * question is the four terms `ACx^2 + ADx + BCx + BD`, in that order, because
 * the middle term arriving pre-split is what makes this grouping rather than
 * trinomial factoring.
 *
 * The prompt says so out loud. `6x^2 + 9x + 4x + 6` and `6x^2 + 13x + 6` are
 * the same polynomial and the same answer, and a learner who does not notice
 * the four terms will grind through the trinomial method and get there anyway -
 * which teaches nothing, since the point of the chapter is the pairing.
 */
type Shape = {
  /** `(Ax + B)(Cx + D)`, all four expanded terms kept apart. */
  a: number;
  b: number;
  c: number;
  d: number;
  /** A common factor in front of the lot. */
  g: number;
};

/**
 * Nudges `value` off `avoid`, staying inside the range and skipping zero.
 *
 * Two identical brackets would make the answer `(x + 1)(x + 1)`, which nobody
 * writes - it is `(x + 1)^2` - so the model answer would be teaching a worse
 * notation than the one the previous skill in this chapter just taught. The
 * marker accepts both, which is exactly why a test would not have caught it.
 */
function nudge(value: number, avoid: number, limit: number): number {
  if (value !== avoid) return value;
  const next = value >= limit ? value - 1 : value + 1;
  return next === 0 ? next + 1 : next;
}

function shapeFor(rng: RNG, difficulty: Difficulty): Shape {
  if (difficulty <= 2) {
    // `(x + b)(x + d)`, so the four terms are x^2, bx, dx, bd.
    const range = difficulty === 1 ? 7 : 8;
    const b =
      difficulty === 1 ? rng.int(1, range) : rng.nonZeroInt(-range, range);
    const d =
      difficulty === 1 ? rng.int(1, range) : rng.nonZeroInt(-range, range);
    return { a: 1, b, c: 1, d: nudge(d, b, range), g: 1 };
  }

  const a = rng.int(2, 5);
  const c = rng.int(1, 3);
  let b = rng.nonZeroInt(-6, 6);
  let d = rng.nonZeroInt(-6, 6);
  /*
   * Coprime within each bracket. Otherwise the whole polynomial has a common
   * factor that should have come out first, and the "fully factored" answer
   * this generator states would not be fully factored.
   */
  while (gcd(a, b) !== 1) b += b < 0 ? -1 : 1;
  while (gcd(c, d) !== 1) d += d < 0 ? -1 : 1;

  // Same reason as above: `(2x + 3)(2x + 3)` should be written squared.
  if (a === c && b === d) d = nudge(d, b, 6);

  return { a, b, c, d, g: difficulty === 4 ? rng.int(2, 4) : 1 };
}

/** `Ax` as it is written in front of a bracket: `3x`, `x`, `-x`. */
function front(a: number): string {
  return coefficient(a, "x");
}

function build(rng: RNG, difficulty: Difficulty) {
  const { a, b, c, d, g } = shapeFor(rng, difficulty);

  const bracketOne = linearExpr(a, b); // Ax + B
  const bracketTwo = linearExpr(c, d); // Cx + D

  /** The four terms of the expansion, kept apart and in AC/AD/BC/BD order. */
  const terms = (factor: number) => [
    coefficient(factor * a * c, "x^2"),
    coefficient(factor * a * d, "x"),
    coefficient(factor * b * c, "x"),
    String(factor * b * d),
  ];

  const stem = sumTerms(terms(g));
  const answerKatex = `${g === 1 ? "" : g}${paren(bracketOne)}${paren(bracketTwo)}`;
  const answerMath = `${g === 1 ? "" : `${g}*`}(${bracketOne})*(${bracketTwo})`;

  const steps: Step[] = [];

  if (g > 1) {
    steps.push(
      makeStep(`${g}${paren(sumTerms(terms(1)))}`, "quad.common-factor", {
        th: `ทุกพจน์หารด้วย ${g} ลงตัว ดึงออกมาก่อนแล้วค่อยจัดหมู่`,
        en: `Every term is divisible by ${g}: take it out first, then group.`,
      }),
    );
  }

  const inner = terms(1);
  const pairOne = sumTerms([inner[0]!, inner[1]!]);
  const pairTwo = sumTerms([inner[2]!, inner[3]!]);
  const grouped = sumTerms([paren(pairOne), paren(pairTwo)]);
  const pulled = sumTerms([
    `${front(a)}${paren(bracketTwo)}`,
    coefficient(b, paren(bracketTwo)),
  ]);

  const wrap = (body: string) => (g === 1 ? body : `${g}${paren(body)}`);

  steps.push(
    makeStep(wrap(grouped), "poly.grouping", {
      th: "จับสองพจน์แรกเข้าคู่ และสองพจน์หลังเข้าคู่",
      en: "Pair the first two terms, and the last two.",
    }),
    makeStep(wrap(pulled), "quad.common-factor", {
      th: `ดึงตัวประกอบร่วมของแต่ละคู่ออกมา: คู่หน้าได้ ${front(a)} คู่หลังได้ ${b}`,
      en: `Take the common factor out of each pair: ${front(a)} from the first, ${b} from the second.`,
    }),
    makeStep(answerKatex, "poly.grouping", {
      th: `ทั้งสองคู่เหลือ ${paren(bracketTwo)} เหมือนกัน จึงดึงออกมาได้อีกชั้น`,
      en: `Both pairs leave the same ${paren(bracketTwo)}, so that comes out too.`,
    }),
  );

  const misconceptions: Misconception[] = namedMistakes(
    { kind: "exact", value: answerMath },
    [
      /*
       * The sign on the second pair. `- 4x - 6` needs `-2` taken out, not
       * `2`; a learner who pulls the positive does not notice the brackets no
       * longer match and writes down the sign they were expecting.
       */
      ...(b < 0
        ? [
            {
              answer: {
                kind: "exact" as const,
                value: `${g === 1 ? "" : `${g}*`}(${linearExpr(a, -b)})*(${bracketTwo})`,
              },
              explain: {
                th: `คู่หลังเป็นลบ ต้องดึง ${b} ออกมาทั้งเครื่องหมาย ถ้าดึง ${-b} วงเล็บที่เหลือจะไม่เหมือนคู่หน้า`,
                en: `The second pair is negative, so ${b} comes out with its sign. Take out ${-b} and the bracket left behind no longer matches the first pair's.`,
              },
            },
          ]
        : []),
      /*
       * Taking `x` out of the first pair instead of `Ax`, which leaves a
       * bracket that does not match and an answer one factor short.
       */
      ...(a > 1
        ? [
            {
              answer: {
                kind: "exact" as const,
                value: `${g === 1 ? "" : `${g}*`}(${linearExpr(1, b)})*(${bracketTwo})`,
              },
              explain: {
                th: `คู่หน้าดึงได้ถึง ${front(a)} ไม่ใช่แค่ $x$ ถ้าดึงแค่ $x$ จะเหลือ ${paren(linearExpr(a * c, a * d))} ซึ่งไม่ตรงกับคู่หลัง`,
                en: `The first pair has ${front(a)} in common, not just x. Taking out only x leaves ${paren(linearExpr(a * c, a * d))}, which does not match the second pair.`,
              },
            },
          ]
        : []),
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
        th: `คู่หน้า ${paren(pairOne)} มี ${front(a)} เป็นตัวประกอบร่วม`,
        en: `The first pair, ${paren(pairOne)}, has ${front(a)} in common.`,
      },
      {
        th: `ถ้าทำถูก ทั้งสองคู่จะเหลือ ${paren(bracketTwo)} เหมือนกัน`,
        en: `Done right, both pairs leave the same ${paren(bracketTwo)}.`,
      },
    ],
  };
}

export const polyGrouping: Generator = {
  id: "poly.grouping",
  skillId: "poly.grouping",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const built = build(rng, difficulty);
    return {
      id: `${polyGrouping.id}:${rng.seed}:${difficulty}`,
      generatorId: polyGrouping.id,
      skillId: polyGrouping.skillId,
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
