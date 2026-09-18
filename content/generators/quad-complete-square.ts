import {
  fraction,
  isPerfectSquare,
  linearExpr,
  orJoin,
  quadraticExpr,
} from "../format";
import { solveQuadratic } from "../quad-roots";
import { makeStep } from "../step";
import type { Difficulty, Generator, Question, RNG, Step } from "../types";

const ID = "quad.completing-square";
const SKILL = "quad.completing-square";
const TOPIC = "quadratic-equations";

/**
 * การทำให้เป็นกำลังสองสมบูรณ์.
 *
 * Built backwards from `(x + h)^2 = k`: choosing `h` and `k` fixes the
 * equation `x^2 + 2hx + (h^2 - k) = 0` and both of its roots, so the completed
 * square in the derivation is the one the question was made from.
 */
export const quadCompletingSquare: Generator = {
  id: ID,
  skillId: SKILL,
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const { a, b, c } = coefficients(rng, difficulty);
    const roots = solveQuadratic(a, b, c);

    const stem = `${quadraticExpr(a, b, c)} = 0`;
    const steps: Step[] = [];

    // Everything below is written for a leading coefficient of 1, so divide
    // through first when there is one.
    let ib = b;
    let ic = c;
    if (a !== 1) {
      ib = b / a;
      ic = c / a;
      steps.push(
        makeStep(`${quadraticExpr(1, ib, ic)} = 0`, "eq.balance", {
          th: `หารทั้งสองข้างด้วย ${a} เพื่อให้สัมประสิทธิ์หน้า x^2 เป็น 1`,
          en: `Divide both sides by ${a} so the coefficient of x^2 is 1.`,
        }),
      );
    }

    const half = ib / 2;
    const halfText = fraction(ib, 2);
      const halfSquaredText = fraction(ib * ib, 4);
      const rightSideText = fraction(ib * ib - 4 * ic, 4);

    steps.push(
      makeStep(`${quadraticExpr(1, ib, 0)} = ${-ic}`, "eq.move-term", {
        th: `ย้ายพจน์คงที่ไปอีกข้าง`,
        en: `Move the constant term to the other side.`,
      }),
      makeStep(
        `${quadraticExpr(1, ib, 0)} + ${halfSquaredText} = ${-ic} + ${halfSquaredText}`,
        "quad.complete-square",
        {
          th: `ครึ่งหนึ่งของ ${ib} คือ ${halfText} ยกกำลังสองได้ ${halfSquaredText} เติมทั้งสองข้าง`,
          en: `Half of ${ib} is ${halfText}; its square is ${halfSquaredText}. Add it to both sides.`,
        },
      ),
      makeStep(
        `\\left(${linearExpr(1, 0)} ${half < 0 ? "-" : "+"} ${fraction(
          Math.abs(ib),
          2,
        )}\\right)^2 = ${rightSideText}`,
        "quad.perfect-square-trinomial",
        {
          th: `ข้างซ้ายเป็นกำลังสองสมบูรณ์แล้ว`,
          en: `The left side is now a perfect square.`,
        },
      ),
    );

    const squareRootLine = `x ${half < 0 ? "-" : "+"} ${fraction(
      Math.abs(ib),
      2,
    )} = \\pm\\sqrt{${rightSideText}}`;

    steps.push(
      makeStep(
        squareRootLine,
        "quad.square-root-property",
        {
          th: "ถอดรากทั้งสองข้าง ได้ทั้งค่าบวกและค่าลบ",
          en: "Take the square root of both sides - plus and minus.",
        },
        { math: null },
      ),
    );

    if (roots.plusMinusKatex) {
      steps.push(
        makeStep(
          `x = ${roots.plusMinusKatex}`,
          "eq.move-term",
          {
            th: `ย้าย ${halfText} ไปอีกข้าง แล้วจัดรูป`,
            en: `Move the ${halfText} across and tidy up.`,
          },
          { math: null },
        ),
      );
    }

    const solution = orJoin(roots.katex.map((root) => `x = ${root}`));
    steps.push(
      makeStep(
        solution.th,
        "quad.square-root-property",
        roots.count === 1
          ? {
              th: "รากซ้ำ จึงมีคำตอบเดียว",
              en: "A repeated root, so there is only one solution.",
            }
          : {
              th: "แยกเป็นสองคำตอบ",
              en: "Split into the two solutions.",
            },
        { math: null, exprEn: solution.en },
      ),
    );

    return {
      id: `${ID}:${rng.seed}:${difficulty}`,
      generatorId: ID,
      skillId: SKILL,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: {
        th: "จงแก้สมการโดยการทำให้เป็นกำลังสองสมบูรณ์",
        en: "Solve by completing the square",
      },
      stem,
      answer: { kind: "set", values: roots.math },
      steps,
      hints: [
        {
          th:
            a === 1
              ? "ย้ายพจน์คงที่ไปอีกข้างก่อน"
              : `หารทั้งสองข้างด้วย ${a} ก่อน`,
          en:
            a === 1
              ? "Move the constant across first."
              : `Divide through by ${a} first.`,
        },
        {
          th: `เติมกำลังสองของครึ่งหนึ่งของ ${ib} ทั้งสองข้าง`,
          en: `Add the square of half of ${ib} to both sides.`,
        },
        {
          th: `จะได้ ${halfSquaredText} ที่ต้องเติม`,
          en: `That amount is ${halfSquaredText}.`,
        },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/**
 * Coefficients with a non-negative discriminant, chosen so that each
 * difficulty gets the kind of arithmetic it is supposed to practise.
 */
function coefficients(
  rng: RNG,
  difficulty: Difficulty,
): { a: number; b: number; c: number } {
  if (difficulty === 1) {
    // b even, k a perfect square: integer roots, no fractions anywhere.
    const h = rng.nonZeroInt(-7, 7);
    const s = rng.int(1, 6);
    return { a: 1, b: 2 * h, c: h * h - s * s };
  }

  if (difficulty === 2) {
    // b even, k not a square: the roots are surds.
    const h = rng.nonZeroInt(-7, 7);
    let k = rng.int(2, 30);
    if (isPerfectSquare(k)) k += 1;
    return { a: 1, b: 2 * h, c: h * h - k };
  }

  if (difficulty === 3) {
    // b odd, so half of it is a fraction and every line carries quarters.
    const b = rng.nonZeroInt(-4, 4) * 2 + 1;
    let c = rng.nonZeroInt(-8, 8);
    // Keep the discriminant non-negative.
    while (b * b - 4 * c < 0) c -= 1;
    return { a: 1, b, c };
  }

  // Difficulty 4: a leading coefficient to divide out first, with the inner
  // coefficients still whole numbers.
  const a = rng.int(2, 4);
  const h = rng.nonZeroInt(-5, 5);
  const k = rng.int(1, 20);
  return { a, b: a * 2 * h, c: a * (h * h - k) };
}
