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
 * แยกตัวประกอบกำลังสองสมบูรณ์.
 *
 * Built backwards, like every generator here: the answer `g(px + q)^2` is
 * chosen first and then expanded into the question, so the factorisation is
 * known rather than searched for.
 *
 * The teaching point is the middle term. `x^2 + 6x + 9` is a square because 6
 * is *twice* 3, not because it is 3 - and the mistake this shape produces is
 * `(x + 6)^2`, which is why that is the named wrong answer at every
 * difficulty.
 */
function build(
  rng: RNG,
  difficulty: Difficulty,
): {
  stem: string;
  answerKatex: string;
  answerMath: string;
  steps: Step[];
  hints: { th: string; en: string }[];
  misconceptions?: Misconception[];
} {
  /** The bracket is `p x + q`, and the whole thing may carry a factor `g`. */
  const p = difficulty >= 3 ? rng.int(2, 5) : 1;
  const g = difficulty === 4 ? rng.int(2, 5) : 1;

  /*
   * The sign varies from the first question. It costs nothing - `x^2 - 6x + 9`
   * is no harder to recognise than `x^2 + 6x + 9` - and the ladder has real
   * rungs to climb without it: a leading coefficient at 3, a common factor at
   * 4. The alternative was raising `q` at the bottom to get enough distinct
   * questions, which would have made the *arithmetic* the difficulty (is 324
   * a square?) rather than the pattern, and made easy harder than medium.
   */
  const sign = rng.sign();

  // Coprime, or the bracket itself would still have a common factor and the
  // answer would not be the fully factored form it claims to be.
  let q = rng.int(1, difficulty === 1 ? 9 : 14);
  while (gcd(p, q) !== 1) q += 1;

  const signedQ = sign * q;
  const inner = linearExpr(p, signedQ);
  const bracket = `${paren(inner)}^2`;
  const answerKatex = g === 1 ? bracket : `${g}${bracket}`;
  const answerMath =
    g === 1 ? `(${inner})^2` : `${g}*(${inner})^2`;

  const square = p * p;
  const middle = 2 * p * signedQ;
  const last = q * q;

  const terms = (factor: number) =>
    sumTerms([
      coefficient(factor * square, "x^2"),
      coefficient(factor * middle, "x"),
      String(factor * last),
    ]);

  const stem = terms(g);
  const steps: Step[] = [];

  if (g > 1) {
    steps.push(
      makeStep(`${g}${paren(terms(1))}`, "quad.common-factor", {
        th: `ทุกพจน์หารด้วย ${g} ลงตัว ดึงออกมาก่อน`,
        en: `Every term is divisible by ${g}, so take it out first.`,
      }),
    );
  }

  /*
   * The recognition step, written the way the ตรีนามกำลังสองสมบูรณ์ chant
   * reads it: หน้ากำลังสอง, สองหน้าหลัง, หลังกำลังสอง. Naming the two pieces
   * before combining them is the whole method - a learner who cannot see
   * which part is หน้า and which is หลัง cannot use the rule.
   */
  const front = coefficient(p, "x");
  const back = String(q);
  const recognised = sumTerms([
    `${paren(front)}^2`,
    `${sign < 0 ? "-" : ""}2${paren(front)}${paren(back)}`,
    `${paren(back)}^2`,
  ]);

  steps.push(
    makeStep(
      g === 1 ? recognised : `${g}${paren(recognised)}`,
      "quad.perfect-square-trinomial",
      {
        th: `หน้าคือ ${front} หลังคือ ${back} และพจน์กลาง ${coefficient(middle, "x")} เท่ากับสองเท่าของ ${front} คูณ ${back} พอดี`,
        en: `The front is ${front}, the back is ${back}, and the middle term ${coefficient(middle, "x")} is exactly twice ${front} times ${back}.`,
      },
    ),
    makeStep(answerKatex, "quad.perfect-square-trinomial", {
      th: `จึงเขียนเป็น ${paren(inner)} ยกกำลังสอง`,
      en: `So it is ${paren(inner)} squared.`,
    }),
  );

  return {
    stem,
    answerKatex,
    answerMath,
    steps,
    misconceptions: namedMistakes({ kind: "exact", value: answerMath }, [
      /*
       * Taking the whole middle coefficient instead of half of it. The most
       * common slip on this shape by a distance, and it survives a glance
       * because the answer still looks like a square.
       */
      {
        answer: {
          kind: "exact",
          value:
            g === 1
              ? `(${linearExpr(p, middle)})^2`
              : `${g}*(${linearExpr(p, middle)})^2`,
        },
        explain: {
          th: `${paren(linearExpr(p, middle))}^2 คูณกลับได้พจน์กลาง ${coefficient(2 * p * middle, "x")} ซึ่งไม่ตรงกับโจทย์ - พจน์ท้ายของวงเล็บคือ ครึ่งหนึ่ง ของสัมประสิทธิ์ x`,
          en: `${paren(linearExpr(p, middle))}^2 multiplies back to a middle term of ${coefficient(2 * p * middle, "x")}, which is not the question - the number in the bracket is half the coefficient of x.`,
        },
      },
      /*
       * The sign. `x^2 - 10x + 25` is `(x - 5)^2`; a learner reading only the
       * `+ 25` writes `(x + 5)^2`, which squares to the same last term.
       *
       * Only worth naming when there is a sign to get wrong. On an all-plus
       * question nobody writes a minus, and a "mistake" nobody makes is noise
       * in the one place a learner is actually reading carefully.
       */
      ...(sign < 0
        ? [
            {
              answer: {
                kind: "exact" as const,
                value:
                  g === 1
                    ? `(${linearExpr(p, -signedQ)})^2`
                    : `${g}*(${linearExpr(p, -signedQ)})^2`,
              },
              explain: {
                th: "เครื่องหมายในวงเล็บต้องตามพจน์กลาง ไม่ใช่พจน์ท้าย - พจน์ท้ายเป็นบวกเสมอเพราะมาจากการยกกำลังสอง",
                en: "The sign in the bracket follows the middle term, not the last one - the last term is positive either way, because it is a square.",
              },
            },
          ]
        : []),
    ]),
    hints: [
      {
        th: "พจน์หน้าและพจน์ท้ายเป็นกำลังสองของอะไรบ้าง",
        en: "What are the first and last terms squares of?",
      },
      {
        th: `${coefficient(square, "x^2")} คือ ${paren(front)}^2 และ ${last} คือ ${back}^2`,
        en: `${coefficient(square, "x^2")} is ${paren(front)}^2 and ${last} is ${back}^2.`,
      },
      {
        th: `ตรวจพจน์กลาง: สองเท่าของ ${front} คูณ ${back} คือ ${coefficient(Math.abs(middle), "x")} ตรงกับโจทย์`,
        en: `Check the middle: twice ${front} times ${back} is ${coefficient(Math.abs(middle), "x")}, which matches.`,
      },
    ],
  };
}

export const polyPerfectSquare: Generator = {
  id: "poly.perfect-square",
  skillId: "poly.perfect-square",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const built = build(rng, difficulty);
    return {
      id: `${polyPerfectSquare.id}:${rng.seed}:${difficulty}`,
      generatorId: polyPerfectSquare.id,
      skillId: polyPerfectSquare.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: PROMPT,
      stem: built.stem,
      answer: { kind: "exact", value: built.answerMath },
      steps: built.steps,
      hints: built.hints,
      ...(built.misconceptions?.length
        ? { misconceptions: built.misconceptions }
        : {}),
      rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
    };
  },
};
