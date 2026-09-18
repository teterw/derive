import { extractSquareFactor, radical } from "../format";
import { makeStep } from "../step";
import type { Difficulty, Generator, Question, RNG, Step } from "../types";

const ID = "rad.simplify-sqrt";
const SKILL = "rad.simplify";
const TOPIC = "exponents-radicals";

/** Square-free radicands worth landing on. */
const SQUARE_FREE = [2, 3, 5, 6, 7, 10, 11, 13, 14, 15];

/**
 * การจัดรูปกรณฑ์ที่สอง.
 *
 * Built backwards: choose the answer `k\sqrt{m}` first, then the question is
 * `\sqrt{k^2 m}`. The factorisation in the steps is therefore known to be
 * right, not searched for.
 */
export const radSimplifySqrt: Generator = {
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
        th: "จงจัดรูปให้อยู่ในรูปอย่างง่าย",
        en: "Simplify to lowest radical form",
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

function mathRadical(coefficientValue: number, radicand: number): string {
  if (radicand === 1) return String(coefficientValue);
  if (coefficientValue === 1) return `sqrt(${radicand})`;
  return `${coefficientValue}*sqrt(${radicand})`;
}

function build(rng: RNG, difficulty: Difficulty): Built {
  if (difficulty <= 2) {
    const k = rng.int(2, difficulty === 1 ? 4 : 7);
    const m = rng.pick(
      difficulty === 1 ? SQUARE_FREE.slice(0, 5) : SQUARE_FREE,
    );
    const outerCoefficient = difficulty === 1 ? 1 : rng.int(1, 5);
    const radicand = k * k * m;

    const stem =
      outerCoefficient === 1
        ? `\\sqrt{${radicand}}`
        : `${outerCoefficient}\\sqrt{${radicand}}`;

    return {
      stem,
      answerMath: mathRadical(outerCoefficient * k, m),
      steps: [
        makeStep(
          outerCoefficient === 1
            ? `\\sqrt{${k * k} \\cdot ${m}}`
            : `${outerCoefficient}\\sqrt{${k * k} \\cdot ${m}}`,
          "rad.perfect-square-extract",
          {
            th: `แยก ${radicand} เป็น ${k * k} \\times ${m} โดย ${k * k} เป็นกำลังสองสมบูรณ์`,
            en: `Split ${radicand} into ${k * k} \\times ${m}, where ${k * k} is a perfect square.`,
          },
        ),
        makeStep(
          radical(outerCoefficient * k, m),
          "rad.perfect-square-extract",
          {
            th:
              outerCoefficient === 1
                ? `\\sqrt{${k * k}} = ${k} ถอดออกมานอกกรณฑ์ได้`
                : `\\sqrt{${k * k}} = ${k} คูณกับ ${outerCoefficient} ได้ ${outerCoefficient * k}`,
            en:
              outerCoefficient === 1
                ? `\\sqrt{${k * k}} = ${k}, which comes out of the root.`
                : `\\sqrt{${k * k}} = ${k}, and ${k} \\times ${outerCoefficient} = ${outerCoefficient * k}.`,
          },
        ),
      ],
      hints: [
        {
          th: `${radicand} หารด้วยกำลังสองสมบูรณ์ตัวใดลงตัวบ้าง`,
          en: `Which perfect square divides ${radicand}?`,
        },
        {
          th: "ใช้การถอดตัวประกอบกำลังสองออกจากตัวถูกกรณฑ์",
          en: "Pull the perfect-square factor out of the radicand.",
        },
        {
          th: `${radicand} = ${k * k} \\times ${m}`,
          en: `${radicand} = ${k * k} \\times ${m}.`,
        },
      ],
    };
  }

  if (difficulty === 3) {
    // A product whose factors look innocent until you multiply them out:
    // \sqrt{6} \cdot \sqrt{8} = \sqrt{48} = 4\sqrt{3}.
    const left = rng.pick([2, 3, 5, 6, 7, 8, 10, 12, 14, 15, 18, 20]);
    const right = rng.pick([2, 3, 5, 6, 7, 8, 10, 12, 14, 15, 18, 20]);
    return buildProduct(left, right);
  }

  // Difficulty 4: a quotient of roots, which has to be combined before it can
  // be simplified.
  const inside = rng.pick(SQUARE_FREE);
  const k = rng.int(2, 6);
  const denominator = rng.pick([2, 3, 5, 7]);
  const quotient = k * k * inside;
  const numerator = quotient * denominator;

  return {
    stem: `\\frac{\\sqrt{${numerator}}}{\\sqrt{${denominator}}}`,
    answerMath: mathRadical(k, inside),
    steps: [
      makeStep(`\\sqrt{\\frac{${numerator}}{${denominator}}}`, "rad.quotient", {
        th: "หารกรณฑ์ด้วยกรณฑ์ ให้หารตัวถูกกรณฑ์กัน",
        en: "Dividing two roots divides what is inside them.",
      }),
      makeStep(`\\sqrt{${quotient}}`, "rad.quotient", {
        th: `${numerator} \\div ${denominator} = ${quotient}`,
        en: `${numerator} \\div ${denominator} = ${quotient}.`,
      }),
      makeStep(`\\sqrt{${k * k} \\cdot ${inside}}`, "rad.perfect-square-extract", {
        th: `${quotient} = ${k * k} \\times ${inside}`,
        en: `${quotient} = ${k * k} \\times ${inside}.`,
      }),
      makeStep(radical(k, inside), "rad.perfect-square-extract", {
        th: `\\sqrt{${k * k}} = ${k}`,
        en: `\\sqrt{${k * k}} = ${k}.`,
      }),
    ],
    hints: [
      {
        th: "อย่าเพิ่งจัดรูปแต่ละกรณฑ์ ลองรวมเป็นกรณฑ์เดียวก่อน",
        en: "Do not simplify each root first - combine them into one.",
      },
      { th: "ใช้สมบัติการหารของกรณฑ์ที่สอง", en: "Use the quotient rule for roots." },
      {
        th: `\\frac{${numerator}}{${denominator}} = ${quotient}`,
        en: `\\frac{${numerator}}{${denominator}} = ${quotient}.`,
      },
    ],
  };

}

function buildProduct(left: number, right: number): Built {
  const product = left * right;
  const { outside, inside } = extractSquareFactor(product);

  const extraction: Step[] =
    outside === 1
      ? []
      : inside === 1
        ? [
            makeStep(String(outside), "rad.perfect-square-extract", {
              th: `${product} เป็นกำลังสองสมบูรณ์ และ \\sqrt{${product}} = ${outside}`,
              en: `${product} is a perfect square, and \\sqrt{${product}} = ${outside}.`,
            }),
          ]
        : [
            makeStep(
              `\\sqrt{${outside * outside} \\cdot ${inside}}`,
              "rad.perfect-square-extract",
              {
                th: `${product} = ${outside * outside} \\times ${inside}`,
                en: `${product} = ${outside * outside} \\times ${inside}.`,
              },
            ),
            makeStep(radical(outside, inside), "rad.perfect-square-extract", {
              th: `\\sqrt{${outside * outside}} = ${outside}`,
              en: `\\sqrt{${outside * outside}} = ${outside}.`,
            }),
          ];

  return {
    stem: `\\sqrt{${left}} \\cdot \\sqrt{${right}}`,
    answerMath: mathRadical(outside, inside),
    steps: [
      makeStep(`\\sqrt{${left} \\cdot ${right}}`, "rad.product", {
        th: "คูณกรณฑ์เข้าด้วยกัน ให้คูณตัวถูกกรณฑ์",
        en: "Multiplying roots multiplies what is inside them.",
      }),
      makeStep(`\\sqrt{${product}}`, "rad.product", {
        th: `${left} \\times ${right} = ${product}`,
        en: `${left} \\times ${right} = ${product}.`,
      }),
      ...extraction,
    ],
    hints: [
      {
        th: "คูณตัวถูกกรณฑ์เข้าด้วยกันก่อน",
        en: "Multiply the radicands together first.",
      },
      { th: "แล้วมองหากำลังสองสมบูรณ์", en: "Then look for a perfect square." },
      {
        th: `${left} \\times ${right} = ${product}`,
        en: `${left} \\times ${right} = ${product}.`,
      },
    ],
  };
}
