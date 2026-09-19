import { VARIABLES, coefficientPower, power } from "../format";
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

const ID = "exp.laws-core";
const SKILL = "exp.integer-laws";
const TOPIC = "exponents-radicals";

/**
 * สมบัติของเลขยกกำลัง · The exponent laws, on positive integer exponents.
 *
 * Built forwards from the exponents, which is the same thing as backwards from
 * the answer here: choosing `m` and `n` fixes both the question and the result
 * with certainty, so the derivation is known, not inferred.
 *
 * Negative and zero exponents are deliberately left to `exp.negative-zero`;
 * this skill is only the four combining laws.
 */

type Shape = "product" | "quotient" | "power-of-power" | "power-of-product";

function shapeFor(rng: RNG, difficulty: Difficulty): Shape {
  switch (difficulty) {
    case 1:
      return rng.pick(["product", "quotient"] as const);
    case 2:
      return rng.pick([
        "power-of-power",
        "power-of-product",
        "product",
      ] as const);
    default:
      return rng.pick([
        "product",
        "quotient",
        "power-of-power",
        "power-of-product",
      ] as const);
  }
}

export const expLawsCore: Generator = {
  id: ID,
  skillId: SKILL,
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const variable = rng.pick(VARIABLES);
    const shape = shapeFor(rng, difficulty);

    const built =
      difficulty >= 3
        ? buildCompound(rng, variable, difficulty)
        : buildSimple(rng, variable, shape);

    return {
      id: `${ID}:${rng.seed}:${difficulty}`,
      generatorId: ID,
      skillId: SKILL,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: {
        th: "จงจัดรูปให้อยู่ในรูปเลขยกกำลังอย่างง่าย",
        en: "Simplify to a single power",
      },
      stem: built.stem,
      answer: { kind: "exact", value: built.answerMath },
      steps: built.steps,
      hints: built.hints,
      ...(built.misconceptions ? { misconceptions: built.misconceptions } : {}),
      rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
    };
  },
};

/** mathjs source for a single term, e.g. `4*x^(2)`, `x`, `9`. */
function mathTerm(
  coefficientValue: number,
  variable: string,
  exponent: number,
): string {
  const body =
    exponent === 0
      ? "1"
      : exponent === 1
        ? variable
        : `${variable}^(${exponent})`;
  if (exponent === 0) return String(coefficientValue);
  return coefficientValue === 1 ? body : `${coefficientValue}*${body}`;
}

type Built = {
  stem: string;
  answerMath: string;
  steps: Step[];
  hints: { th: string; en: string }[];
  misconceptions?: Misconception[];
};

function buildSimple(rng: RNG, v: string, shape: Shape): Built {
  switch (shape) {
    case "product": {
      const m = rng.int(2, 7);
      const n = rng.int(2, 7);
      const stem = `${power(v, m)} \\cdot ${power(v, n)}`;
      return {
        stem,
        answerMath: mathTerm(1, v, m + n),
        misconceptions: namedMistakes(
          { kind: "exact", value: mathTerm(1, v, m + n) },
          [
            {
              answer: { kind: "exact", value: mathTerm(1, v, m * n) },
              explain: {
                th: `นั่นคือการคูณเลขชี้กำลัง (${m} \\times ${n}) แต่การคูณเลขยกกำลังฐานเดียวกันต้องบวกเลขชี้กำลัง`,
                en: `That multiplies the exponents (${m} \\times ${n}). Multiplying powers of the same base adds them.`,
              },
            },
          ],
        ),
        steps: [
          makeStep(power(v, `${m}+${n}`), "exp.product", {
            th: `ฐานเป็น ${v} เหมือนกัน จึงนำเลขชี้กำลังมาบวกกัน`,
            en: `The base ${v} is the same, so the exponents add.`,
          }),
          makeStep(power(v, m + n), "exp.product", {
            th: `${m} + ${n} = ${m + n}`,
            en: `${m} + ${n} = ${m + n}.`,
          }),
        ],
        hints: [
          {
            th: "ฐานทั้งสองตัวเหมือนกันหรือไม่",
            en: "Are the two bases the same?",
          },
          {
            th: "ใช้สมบัติการคูณของเลขยกกำลัง",
            en: "Use the product of powers rule.",
          },
          {
            th: `นำเลขชี้กำลัง ${m} และ ${n} มาบวกกัน`,
            en: `Add the exponents ${m} and ${n}.`,
          },
        ],
      };
    }

    case "quotient": {
      const n = rng.int(2, 5);
      const m = n + rng.int(1, 5);
      const stem = `\\frac{${power(v, m)}}{${power(v, n)}}`;
      return {
        stem,
        answerMath: mathTerm(1, v, m - n),
        misconceptions: namedMistakes(
          { kind: "exact", value: mathTerm(1, v, m - n) },
          [
            {
              answer: { kind: "exact", value: mathTerm(1, v, m + n) },
              explain: {
                th: `นั่นคือการบวกเลขชี้กำลัง แต่การหารเลขยกกำลังฐานเดียวกันต้องลบเลขชี้กำลัง: ${m} - ${n}`,
                en: `That adds the exponents. Dividing powers of the same base subtracts them: ${m} - ${n}.`,
              },
            },
          ],
        ),
        steps: [
          makeStep(power(v, `${m}-${n}`), "exp.quotient", {
            th: `ฐานเป็น ${v} เหมือนกัน จึงนำเลขชี้กำลังมาลบกัน`,
            en: `The base ${v} is the same, so the exponents subtract.`,
          }),
          makeStep(power(v, m - n), "exp.quotient", {
            th: `${m} - ${n} = ${m - n}`,
            en: `${m} - ${n} = ${m - n}.`,
          }),
        ],
        hints: [
          {
            th: "ตัวเศษและตัวส่วนมีฐานเดียวกัน",
            en: "Top and bottom share a base.",
          },
          {
            th: "ใช้สมบัติการหารของเลขยกกำลัง",
            en: "Use the quotient of powers rule.",
          },
          {
            th: `นำ ${m} ลบด้วย ${n}`,
            en: `Subtract ${n} from ${m}.`,
          },
        ],
      };
    }

    case "power-of-power": {
      const m = rng.int(2, 5);
      const n = rng.int(2, 4);
      const stem = `\\left(${power(v, m)}\\right)^{${n}}`;
      return {
        stem,
        answerMath: mathTerm(1, v, m * n),
        misconceptions: namedMistakes(
          { kind: "exact", value: mathTerm(1, v, m * n) },
          [
            {
              answer: { kind: "exact", value: mathTerm(1, v, m + n) },
              explain: {
                th: `นั่นคือการบวกเลขชี้กำลัง (${m} + ${n}) แต่การยกกำลังซ้อนต้องคูณเลขชี้กำลัง`,
                en: `That adds the exponents (${m} + ${n}). A power of a power multiplies them.`,
              },
            },
          ],
        ),
        steps: [
          makeStep(power(v, `${m} \\cdot ${n}`), "exp.power-of-power", {
            th: "ยกกำลังซ้อนกัน ให้นำเลขชี้กำลังมาคูณกัน",
            en: "A power raised to a power multiplies the exponents.",
          }),
          makeStep(power(v, m * n), "exp.power-of-power", {
            th: `${m} \\times ${n} = ${m * n}`,
            en: `${m} \\times ${n} = ${m * n}.`,
          }),
        ],
        hints: [
          {
            th: "อย่าบวกเลขชี้กำลัง - ลองดูว่านี่เป็นการคูณหรือการบวก",
            en: "Do not add here - check whether this multiplies or adds.",
          },
          {
            th: "ใช้กฎเลขยกกำลังของเลขยกกำลัง",
            en: "Use the power of a power rule.",
          },
          { th: `คูณ ${m} กับ ${n}`, en: `Multiply ${m} by ${n}.` },
        ],
      };
    }

    case "power-of-product": {
      const c = rng.int(2, 4);
      const m = rng.int(1, 3);
      const n = rng.int(2, 3);
      const stem = `\\left(${coefficientPower(c, v, m)}\\right)^{${n}}`;
      const cn = c ** n;
      return {
        stem,
        answerMath: mathTerm(cn, v, m * n),
        steps: [
          makeStep(
            `${power(String(c), n)} \\cdot \\left(${power(v, m)}\\right)^{${n}}`,
            "exp.power-of-product",
            {
              th: "ยกกำลังผลคูณ ให้ยกกำลังทุกตัวที่คูณกันอยู่",
              en: "A power of a product raises each factor.",
            },
          ),
          makeStep(coefficientPower(cn, v, m * n), "exp.power-of-power", {
            th: `${c}^{${n}} = ${cn} และเลขชี้กำลังของ ${v} คือ ${m} \\times ${n} = ${m * n}`,
            en: `${c}^{${n}} = ${cn}, and the exponent of ${v} is ${m} \\times ${n} = ${m * n}.`,
          }),
        ],
        hints: [
          {
            th: "เลขสัมประสิทธิ์ก็ต้องถูกยกกำลังด้วย",
            en: "The coefficient gets raised to the power too.",
          },
          {
            th: "ใช้กฎเลขยกกำลังของผลคูณ แล้วตามด้วยกฎเลขยกกำลังของเลขยกกำลัง",
            en: "Use the power of a product rule, then the power of a power rule.",
          },
          {
            th: `เริ่มจาก ${c}^{${n}}`,
            en: `Start with ${c}^{${n}}.`,
          },
        ],
      };
    }
  }
}

/**
 * Difficulty 3 and 4: a quotient whose numerator is itself a power of a
 * product, so it takes three laws and some arithmetic on the coefficients.
 */
function buildCompound(rng: RNG, v: string, difficulty: Difficulty): Built {
  const c = rng.int(2, difficulty === 4 ? 5 : 3);
  const m = rng.int(2, 3);
  const n = rng.int(2, 3);
  const denominatorCoefficient = rng.pick([1, c, c * c].filter((x) => x <= 25));
  /** Difficulty 4 hangs an extra factor on the numerator, so it needs the
   * product rule as well as the other two. */
  const p = difficulty === 4 ? rng.int(1, 3) : 0;
  const numeratorExponent = m * n + p;
  const q = rng.int(1, numeratorExponent - 1);

  const numeratorCoefficient = c ** n;
  const resultCoefficient = numeratorCoefficient / denominatorCoefficient;
  const resultExponent = numeratorExponent - q;

  const denominator = coefficientPower(denominatorCoefficient, v, q);
  const extra = p === 0 ? "" : ` \\cdot ${coefficientPower(1, v, p)}`;
  const stem = `\\frac{\\left(${coefficientPower(
    c,
    v,
    m,
  )}\\right)^{${n}}${extra}}{${denominator}}`;
  const expanded = `\\frac{${coefficientPower(
    numeratorCoefficient,
    v,
    m * n,
  )}${extra}}{${denominator}}`;

  const steps: Step[] = [
    makeStep(expanded, "exp.power-of-product", {
      th: `กระจายเลขชี้กำลัง ${n} เข้าไปทั้งสัมประสิทธิ์และตัวแปร`,
      en: `Raise both the coefficient and the variable to the power ${n}.`,
    }),
  ];

  if (p > 0) {
    steps.push(
      makeStep(
        `\\frac{${coefficientPower(
          numeratorCoefficient,
          v,
          numeratorExponent,
        )}}{${denominator}}`,
        "exp.product",
        {
          th: `ตัวเศษมีฐานเดียวกัน จึงบวกเลขชี้กำลัง: ${m * n} + ${p} = ${numeratorExponent}`,
          en: `The numerator has one base, so the exponents add: ${m * n} + ${p} = ${numeratorExponent}.`,
        },
      ),
    );
  }

  steps.push(
    makeStep(
      coefficientPower(resultCoefficient, v, `${numeratorExponent}-${q}`),
      "exp.quotient",
      {
        th: `หารสัมประสิทธิ์ ${numeratorCoefficient} \\div ${denominatorCoefficient} = ${resultCoefficient} และลบเลขชี้กำลัง`,
        en: `Divide the coefficients, ${numeratorCoefficient} \\div ${denominatorCoefficient} = ${resultCoefficient}, and subtract the exponents.`,
      },
    ),
    makeStep(
      coefficientPower(resultCoefficient, v, resultExponent),
      "exp.quotient",
      {
        th: `${numeratorExponent} - ${q} = ${resultExponent}`,
        en: `${numeratorExponent} - ${q} = ${resultExponent}.`,
      },
    ),
  );

  return {
    stem,
    answerMath: mathTerm(resultCoefficient, v, resultExponent),
    steps,
    hints: [
      {
        th: "จัดการวงเล็บก่อน แล้วค่อยหาร",
        en: "Deal with the bracket first, then divide.",
      },
      {
        th: "ใช้กฎเลขยกกำลังของผลคูณ แล้วใช้สมบัติการหาร",
        en: "Power of a product first, then the quotient rule.",
      },
      {
        th: `วงเล็บกลายเป็น ${coefficientPower(numeratorCoefficient, v, m * n)}`,
        en: `The bracket becomes ${coefficientPower(numeratorCoefficient, v, m * n)}.`,
      },
    ],
  };
}
