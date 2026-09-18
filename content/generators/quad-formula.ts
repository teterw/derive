import { isPerfectSquare, orJoin, quadraticExpr, radical } from "../format";
import { solveQuadratic, simplifySquareRoot } from "../quad-roots";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Difficulty, Generator, Question, RNG, Step } from "../types";

const ID = "quad.formula-core";
const SKILL = "quad.formula";
const TOPIC = "quadratic-equations";

/**
 * สูตรหาคำตอบของสมการกำลังสอง.
 *
 * Coefficients are chosen so the discriminant is non-negative by construction,
 * and the roots come from the shared solver, so what the steps say and what
 * the answer says cannot drift apart.
 */
export const quadFormulaCore: Generator = {
  id: ID,
  skillId: SKILL,
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const { a, b, c } = coefficients(rng, difficulty);
    const roots = solveQuadratic(a, b, c);
    const discriminant = roots.discriminant;

    const stem = `${quadraticExpr(a, b, c)} = 0`;

    const steps: Step[] = [
      makeStep(
        `x = \\frac{-\\left(${b}\\right) \\pm \\sqrt{\\left(${b}\\right)^2 - 4\\left(${a}\\right)\\left(${c}\\right)}}{2\\left(${a}\\right)}`,
        "quad.formula",
        {
          th: `แทน a = ${a}, b = ${b}, c = ${c} ลงในสูตร`,
          en: `Substitute a = ${a}, b = ${b}, c = ${c} into the formula.`,
        },
        { math: null },
      ),
      makeStep(
        `x = \\frac{${-b} \\pm \\sqrt{${discriminant}}}{${2 * a}}`,
        "quad.discriminant",
        {
          th: `ดิสคริมิแนนต์ D = ${b}^2 - 4(${a})(${c}) = ${discriminant}`,
          en: `The discriminant is D = ${b}^2 - 4(${a})(${c}) = ${discriminant}.`,
        },
        { math: null },
      ),
    ];

    if (!roots.rational) {
      const simplified = simplifySquareRoot(discriminant);
      if (simplified.outside > 1) {
        steps.push(
          makeStep(
            `x = \\frac{${-b} \\pm ${simplified.katex}}{${2 * a}}`,
            "rad.perfect-square-extract",
            {
              th: `\\sqrt{${discriminant}} = ${simplified.katex}`,
              en: `\\sqrt{${discriminant}} = ${simplified.katex}.`,
            },
            { math: null },
          ),
        );
      }
      if (roots.plusMinusKatex) {
        steps.push(
          makeStep(
            `x = ${roots.plusMinusKatex}`,
            "arith.simplify-fraction",
            {
              th: "ตัดตัวประกอบร่วมของตัวเศษและตัวส่วน",
              en: "Cancel the factor shared by the top and the bottom.",
            },
            { math: null },
          ),
        );
      }
    } else if (discriminant > 0) {
      const root = Math.round(Math.sqrt(discriminant));
      steps.push(
        makeStep(
          `x = \\frac{${-b} \\pm ${root}}{${2 * a}}`,
          "quad.formula",
          {
            th: `\\sqrt{${discriminant}} = ${root} ซึ่งเป็นจำนวนเต็ม แสดงว่าคำตอบเป็นจำนวนตรรกยะ`,
            en: `\\sqrt{${discriminant}} = ${root}, a whole number, so the roots are rational.`,
          },
          { math: null },
        ),
      );
    }

    const solution = orJoin(roots.katex.map((root) => `x = ${root}`));
    steps.push(
      makeStep(
        solution.th,
        discriminant === 0 ? "quad.discriminant" : "quad.formula",
        discriminant === 0
          ? {
              th: "D = 0 จึงมีคำตอบเดียว (รากซ้ำ)",
              en: "D = 0, so there is one repeated root.",
            }
          : {
              th: "แยกเครื่องหมายบวกและลบออกเป็นสองคำตอบ",
              en: "Split the plus and the minus into two roots.",
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
        th: "จงแก้สมการโดยใช้สูตร",
        en: "Solve using the quadratic formula",
      },
      stem,
      answer: { kind: "set", values: roots.math },
      steps,
      /**
       * Forgetting that the formula opens with *minus* b. The discriminant is
       * unchanged by the sign of b, so the wrong roots are exactly the roots
       * of the equation with b flipped - which is what makes them findable.
       */
      misconceptions: namedMistakes({ kind: "set", values: roots.math }, [
        {
          answer: { kind: "set", values: solveQuadratic(a, -b, c).math },
          explain: {
            th: `สูตรขึ้นต้นด้วย -b ไม่ใช่ b ตรงนี้ b = ${b} ดังนั้น -b = ${-b}`,
            en: `The formula starts with -b, not b. Here b = ${b}, so -b = ${-b}.`,
          },
        },
      ]),
      hints: [
        {
          th: `เขียน a, b, c ออกมาก่อน: a = ${a}, b = ${b}, c = ${c}`,
          en: `Write down a, b and c first: a = ${a}, b = ${b}, c = ${c}.`,
        },
        {
          th: "หาดิสคริมิแนนต์ b^2 - 4ac ก่อนแทนในสูตร",
          en: "Work out b^2 - 4ac before anything else.",
        },
        {
          th: `D = ${discriminant}`,
          en: `D = ${discriminant}.`,
        },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

function coefficients(
  rng: RNG,
  difficulty: Difficulty,
): { a: number; b: number; c: number } {
  if (difficulty === 1) {
    // Rational roots, a = 1: the formula agrees with factoring, which is the
    // point of meeting it here first.
    const p = rng.nonZeroInt(-7, 7);
    const q = rng.nonZeroInt(-7, 7);
    return { a: 1, b: -(p + q), c: p * q };
  }

  if (difficulty === 2) {
    // Irrational roots, a = 1: the case factoring cannot reach.
    const b = rng.nonZeroInt(-9, 9);
    let c = rng.nonZeroInt(-9, 9);
    while (b * b - 4 * c < 0 || isPerfectSquare(b * b - 4 * c)) c -= 1;
    return { a: 1, b, c };
  }

  if (difficulty === 3) {
    // A leading coefficient, and a discriminant that needs simplifying.
    const a = rng.int(2, 4);
    const b = rng.nonZeroInt(-9, 9);
    let c = rng.nonZeroInt(-6, 6);
    while (b * b - 4 * a * c < 0) c -= 1;
    return { a, b, c };
  }

  // Difficulty 4: a repeated root some of the time, which is the case
  // learners most often miscount.
  if (rng.bool(0.4)) {
    const a = rng.int(1, 3);
    const h = rng.nonZeroInt(-6, 6);
    // a(x - h)^2 = a x^2 - 2ahx + ah^2, so D = 0 exactly.
    return { a, b: -2 * a * h, c: a * h * h };
  }
  const a = rng.int(2, 5);
  const b = rng.nonZeroInt(-11, 11);
  let c = rng.nonZeroInt(-8, 8);
  while (b * b - 4 * a * c < 0) c -= 1;
  return { a, b, c };
}

/** Kept next to the generator: the radical helper its steps lean on. */
export { radical };
