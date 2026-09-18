import { gcd, radical } from "../format";
import { makeStep } from "../step";
import type { Difficulty, Generator, Question, RNG, Step } from "../types";

const ID = "rad.rationalize-core";
const SKILL = "rad.rationalize";
const TOPIC = "exponents-radicals";

const SQUARE_FREE = [2, 3, 5, 6, 7, 10, 11, 13];

/**
 * การทำให้ตัวส่วนไม่ติดกรณฑ์.
 *
 * Easy and medium use a single-term denominator; hard and challenge use the
 * conjugate, which is the same difference-of-squares idea the quadratics topic
 * leans on later.
 */
export const radRationalizeCore: Generator = {
  id: ID,
  skillId: SKILL,
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const built = build(rng, difficulty);
    return {
      id: `${ID}:${rng.seed}:${difficulty}`,
      generatorId: ID,
      skillId: SKILL,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: {
        th: "จงทำให้ตัวส่วนไม่ติดกรณฑ์",
        en: "Rationalise the denominator",
      },
      stem: built.stem,
      answer: { kind: "exact", value: built.answerMath },
      steps: built.steps,
      hints: built.hints,
      rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
    };
  },
};

type Built = {
  stem: string;
  answerMath: string;
  steps: Step[];
  hints: { th: string; en: string }[];
};

function build(rng: RNG, difficulty: Difficulty): Built {
  if (difficulty <= 2) return monomial(rng, difficulty);
  return conjugate(rng, difficulty);
}

/** `\frac{a}{\sqrt{b}}` and `\frac{a\sqrt{c}}{\sqrt{b}}`. */
function monomial(rng: RNG, difficulty: Difficulty): Built {
  const b = rng.pick(SQUARE_FREE);
  const a = difficulty === 1 ? rng.int(1, 9) : rng.int(2, 12);

  const stem = `\\frac{${a}}{\\sqrt{${b}}}`;

  // a\sqrt{b}/b, reduced.
  const divisor = gcd(a, b);
  const numeratorCoefficient = a / divisor;
  const denominator = b / divisor;

  const answerKatex =
    denominator === 1
      ? radical(numeratorCoefficient, b)
      : `\\frac{${radical(numeratorCoefficient, b)}}{${denominator}}`;
  const answerMath =
    denominator === 1
      ? `${numeratorCoefficient}*sqrt(${b})`
      : `${numeratorCoefficient}*sqrt(${b})/${denominator}`;

  const steps: Step[] = [
    makeStep(
      `\\frac{${a}}{\\sqrt{${b}}} \\cdot \\frac{\\sqrt{${b}}}{\\sqrt{${b}}}`,
      "rad.rationalize-monomial",
      {
        th: `คูณทั้งเศษและส่วนด้วย \\sqrt{${b}} ซึ่งเท่ากับคูณด้วย 1`,
        en: `Multiply top and bottom by \\sqrt{${b}} - that is multiplying by 1.`,
      },
    ),
    makeStep(`\\frac{${radical(a, b)}}{${b}}`, "rad.product", {
      th: `ตัวส่วนกลายเป็น \\sqrt{${b}} \\cdot \\sqrt{${b}} = ${b}`,
      en: `The denominator becomes \\sqrt{${b}} \\cdot \\sqrt{${b}} = ${b}.`,
    }),
  ];

  if (divisor > 1) {
    steps.push(
      makeStep(answerKatex, "arith.simplify-fraction", {
        th: `ตัด ${divisor} ออกจากทั้งเศษและส่วน`,
        en: `Cancel the factor of ${divisor}.`,
      }),
    );
  }

  return {
    stem,
    answerMath,
    steps,
    hints: [
      {
        th: "ตัวส่วนติดกรณฑ์อยู่ ต้องกำจัดออก",
        en: "There is a root on the bottom; it has to go.",
      },
      {
        th: `คูณทั้งเศษและส่วนด้วย \\sqrt{${b}}`,
        en: `Multiply top and bottom by \\sqrt{${b}}.`,
      },
      {
        th: `\\sqrt{${b}} \\cdot \\sqrt{${b}} = ${b}`,
        en: `\\sqrt{${b}} \\cdot \\sqrt{${b}} = ${b}.`,
      },
    ],
  };
}

/** `\frac{c}{p + \sqrt{b}}`, cleared with the conjugate. */
function conjugate(rng: RNG, difficulty: Difficulty): Built {
  const b = rng.pick(SQUARE_FREE);
  const p = rng.int(1, difficulty === 4 ? 7 : 4);
  const plus = rng.bool();
  const c = rng.int(1, 9);

  // (p + √b)(p − √b) = p² − b, which must not be zero.
  const denominator = p * p - b;
  if (denominator === 0) {
    return monomial(rng, 2);
  }

  const sign = plus ? "+" : "-";
  const flipped = plus ? "-" : "+";
  const stem = `\\frac{${c}}{${p} ${sign} \\sqrt{${b}}}`;

  const expandedNumerator = `${c}\\left(${p} ${flipped} \\sqrt{${b}}\\right)`;
  const numeratorConstant = c * p;
  const numeratorRadical = plus ? -c : c;

  const divisor = gcd(
    gcd(Math.abs(numeratorConstant), Math.abs(numeratorRadical)),
    Math.abs(denominator),
  );
  // p^2 - b is negative whenever b > p^2, and nobody leaves a minus sign on
  // the bottom of a fraction.
  const flipSign = denominator < 0 ? -1 : 1;
  const finalConstant = (flipSign * numeratorConstant) / divisor;
  const finalRadical = (flipSign * numeratorRadical) / divisor;
  const finalDenominator = (flipSign * denominator) / divisor;

  const numeratorText = `${finalConstant} ${finalRadical < 0 ? "-" : "+"} ${radical(
    Math.abs(finalRadical),
    b,
  )}`;

  const answerKatex =
    finalDenominator === 1
      ? numeratorText
      : `\\frac{${numeratorText}}{${finalDenominator}}`;

  const answerMath = `(${finalConstant} ${
    finalRadical < 0 ? "-" : "+"
  } ${Math.abs(finalRadical)}*sqrt(${b}))/${finalDenominator}`;

  const expandedKatex = `\\frac{${c * p} ${plus ? "-" : "+"} ${radical(
    c,
    b,
  )}}{${denominator}}`;

  const steps: Step[] = [
    makeStep(
      `\\frac{${c}}{${p} ${sign} \\sqrt{${b}}} \\cdot \\frac{${p} ${flipped} \\sqrt{${b}}}{${p} ${flipped} \\sqrt{${b}}}`,
      "rad.conjugate",
      {
        th: `คูณทั้งเศษและส่วนด้วยสังยุค ${p} ${flipped} \\sqrt{${b}}`,
        en: `Multiply top and bottom by the conjugate ${p} ${flipped} \\sqrt{${b}}.`,
      },
    ),
    makeStep(
      `\\frac{${expandedNumerator}}{${p}^2 - ${b}}`,
      "rad.conjugate",
      {
        th: `ตัวส่วนเป็นผลต่างกำลังสอง: ${p}^2 - ${b}`,
        en: `The denominator is a difference of squares: ${p}^2 - ${b}.`,
      },
    ),
    makeStep(expandedKatex, "arith.distribute", {
      th: `กระจาย ${c} เข้าไปในวงเล็บ และ ${p}^2 - ${b} = ${denominator}`,
      en: `Distribute the ${c}, and ${p}^2 - ${b} = ${denominator}.`,
    }),
  ];

  if (answerKatex !== expandedKatex) {
    steps.push(
      makeStep(answerKatex, "arith.simplify-fraction", {
        th:
          divisor > 1
            ? `ตัดตัวประกอบร่วม ${divisor} ออก`
            : "ย้ายเครื่องหมายลบจากตัวส่วนขึ้นมาไว้ที่ตัวเศษ",
        en:
          divisor > 1
            ? `Cancel the common factor of ${divisor}.`
            : "Move the minus sign out of the denominator.",
      }),
    );
  }

  return {
    stem,
    answerMath,
    steps,
    hints: [
      {
        th: "คูณด้วยกรณฑ์เฉย ๆ ไม่พอ เพราะตัวส่วนมีสองพจน์",
        en: "Multiplying by the root alone will not work - the bottom has two terms.",
      },
      {
        th: "ใช้สังยุค คือเปลี่ยนเครื่องหมายกลางให้ตรงข้าม",
        en: "Use the conjugate: the same terms with the middle sign flipped.",
      },
      {
        th: `ตัวส่วนจะกลายเป็น ${p}^2 - ${b} = ${denominator}`,
        en: `The denominator becomes ${p}^2 - ${b} = ${denominator}.`,
      },
    ],
  };
}
