import { makeStep } from "../step";
import type { Difficulty, Generator, Question, RNG, Step } from "../types";

const ID = "exp.scientific-notation";
const SKILL = "exp.scientific";
const TOPIC = "exponents-radicals";

/**
 * สัญกรณ์วิทยาศาสตร์.
 *
 * Decimal strings are built digit by digit rather than through floating point:
 * `2.5e-4` printed by JavaScript is `0.00025`, but `1.1e-7` is `1.1e-7`, and a
 * question stem must never show a learner exponential notation it has not
 * taught yet.
 */

type Mantissa = { digits: number; decimals: number; text: string };

function mantissa(rng: RNG, maxDecimals: number): Mantissa {
  const decimals = rng.int(1, maxDecimals);
  const lead = rng.int(1, 9);
  let rest = "";
  for (let i = 0; i < decimals; i++) rest += String(rng.int(0, 9));
  // Never end on a trailing zero: 4.30 is not how anyone writes it.
  rest = rest.replace(/0+$/, "");
  const text = rest ? `${lead}.${rest}` : String(lead);
  const digits = Number(`${lead}${rest}`);
  return { digits, decimals: rest.length, text };
}

/** Mantissas of the form 2^a 5^b, which every decimal divides exactly by. */
function exactDivisor(rng: RNG): Mantissa {
  const value = rng.pick([2, 4, 5, 8, 2.5, 1.6, 1.25] as const);
  const text = String(value);
  const decimals = text.includes(".") ? text.split(".")[1]!.length : 0;
  return { digits: Number(text.replace(".", "")), decimals, text };
}

/** The plain decimal for `digits * 10^(exponent - decimals)`. */
function plainDecimal({ digits, decimals }: Mantissa, exponent: number): string {
  const shift = exponent - decimals;
  const text = String(digits);
  if (shift >= 0) return text + "0".repeat(shift);
  const pointFromRight = -shift;
  if (pointFromRight < text.length) {
    const cut = text.length - pointFromRight;
    return `${text.slice(0, cut)}.${text.slice(cut)}`;
  }
  return `0.${"0".repeat(pointFromRight - text.length)}${text}`;
}

function scientific(m: Mantissa, exponent: number): string {
  return `${m.text} \\times 10^{${exponent}}`;
}

export const expScientificNotation: Generator = {
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
      prompt: built.prompt,
      stem: built.stem,
      answer: { kind: "exact", value: built.answerMath },
      steps: built.steps,
      hints: built.hints,
      rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
    };
  },
};

type Built = {
  prompt: { th: string; en: string };
  stem: string;
  answerMath: string;
  steps: Step[];
  hints: { th: string; en: string }[];
};

const WRITE_PROMPT = {
  th: "จงเขียนในรูปสัญกรณ์วิทยาศาสตร์",
  en: "Write in scientific notation",
};

const COMPUTE_PROMPT = {
  th: "จงหาผลลัพธ์ในรูปสัญกรณ์วิทยาศาสตร์",
  en: "Give the result in scientific notation",
};

function build(rng: RNG, difficulty: Difficulty): Built {
  if (difficulty <= 2) {
    const m = mantissa(rng, 2);
    // Large numbers first, then the small ones that need a negative exponent.
    const exponent =
      difficulty === 1 ? rng.int(3, 7) : -rng.int(2, 6);
    const plain = plainDecimal(m, exponent);

    return {
      prompt: WRITE_PROMPT,
      stem: plain,
      answerMath: `${m.text}*10^(${exponent})`,
      steps: [
        makeStep(
          `${m.text} \\times 10^{${exponent}}`,
          "exp.scientific-form",
          exponent > 0
            ? {
                th: `เลื่อนจุดทศนิยมมาอยู่หลังหลักแรก ต้องเลื่อนไปทางซ้าย ${exponent} ตำแหน่ง จึงคูณด้วย 10^{${exponent}}`,
                en: `Move the point to just after the first digit - ${exponent} places left - so multiply by 10^{${exponent}}.`,
              }
            : {
                th: `เลื่อนจุดทศนิยมไปทางขวา ${-exponent} ตำแหน่ง จึงคูณด้วย 10^{${exponent}}`,
                en: `Move the point ${-exponent} places right, so multiply by 10^{${exponent}}.`,
              },
        ),
      ],
      hints: [
        {
          th: "ตัวเลขหน้าจุดต้องมีหลักเดียว และไม่ใช่ศูนย์",
          en: "Exactly one non-zero digit goes before the point.",
        },
        {
          th: "นับว่าจุดทศนิยมต้องเลื่อนกี่ตำแหน่ง",
          en: "Count how many places the point moves.",
        },
        {
          th: `จะได้ ${m.text} \\times 10^{?}`,
          en: `You get ${m.text} \\times 10^{?}.`,
        },
      ],
    };
  }

  // Difficulty 3 and 4: arithmetic in scientific notation, where the answer
  // usually needs renormalising because the mantissas multiply past 10.
  const a = mantissa(rng, 1);
  const isProduct = difficulty === 3 ? true : rng.bool();
  /**
   * Division only ever uses a mantissa that divides a power of ten, so the
   * quotient terminates. `3.2 \div 8.6` would give 0.372093..., and a question
   * whose answer has to be rounded is a question whose answer is wrong.
   */
  const b = isProduct ? mantissa(rng, 1) : exactDivisor(rng);
  const expA = rng.int(2, 8) * (rng.bool() ? 1 : -1);
  const expB = rng.int(2, 6) * (rng.bool() ? 1 : -1);

  const rawMantissa = isProduct
    ? (a.digits / 10 ** a.decimals) * (b.digits / 10 ** b.decimals)
    : (a.digits / 10 ** a.decimals) / (b.digits / 10 ** b.decimals);
  const rawExponent = isProduct ? expA + expB : expA - expB;

  // Renormalise into 1 <= |A| < 10.
  let shift = 0;
  let value = rawMantissa;
  while (value >= 10) {
    value /= 10;
    shift += 1;
  }
  while (value < 1) {
    value *= 10;
    shift -= 1;
  }
  const finalExponent = rawExponent + shift;
  const finalMantissa = Number(value.toFixed(6));

  const operator = isProduct ? "\\times" : "\\div";
  const stem = `\\left(${scientific(a, expA)}\\right) ${operator} \\left(${scientific(
    b,
    expB,
  )}\\right)`;

  const rawText = Number(rawMantissa.toFixed(6));

  const steps: Step[] = [
    makeStep(
      `\\left(${a.text} ${operator} ${b.text}\\right) \\times \\left(10^{${expA}} ${operator} 10^{${expB}}\\right)`,
      "exp.scientific-form",
      {
        th: "จัดกลุ่มตัวเลขหน้ากับกำลังของสิบแยกกัน",
        en: "Group the mantissas together and the powers of ten together.",
      },
    ),
    makeStep(
      `${rawText} \\times 10^{${rawExponent}}`,
      isProduct ? "exp.product" : "exp.quotient",
      isProduct
        ? {
            th: `คูณกำลังของสิบโดยบวกเลขชี้กำลัง: ${expA} + ${expB} = ${rawExponent}`,
            en: `Multiplying powers of ten adds the exponents: ${expA} + ${expB} = ${rawExponent}.`,
          }
        : {
            th: `หารกำลังของสิบโดยลบเลขชี้กำลัง: ${expA} - (${expB}) = ${rawExponent}`,
            en: `Dividing powers of ten subtracts the exponents: ${expA} - (${expB}) = ${rawExponent}.`,
          },
    ),
  ];

  if (shift !== 0) {
    steps.push(
      makeStep(`${finalMantissa} \\times 10^{${finalExponent}}`, "exp.scientific-form", {
        th: `${rawText} ยังไม่อยู่ในช่วง 1 ถึง 10 จึงต้องเลื่อนจุดทศนิยมและปรับเลขชี้กำลังเป็น ${finalExponent}`,
        en: `${rawText} is not between 1 and 10, so move the point and adjust the exponent to ${finalExponent}.`,
      }),
    );
  }

  return {
    prompt: COMPUTE_PROMPT,
    stem,
    answerMath: `${finalMantissa}*10^(${finalExponent})`,
    steps,
    hints: [
      {
        th: "แยกคิดเลขหน้ากับกำลังของสิบ",
        en: "Handle the mantissas and the powers of ten separately.",
      },
      {
        th: isProduct
          ? "คูณกำลังของสิบ ให้บวกเลขชี้กำลัง"
          : "หารกำลังของสิบ ให้ลบเลขชี้กำลัง",
        en: isProduct
          ? "Multiplying powers of ten adds exponents."
          : "Dividing powers of ten subtracts exponents.",
      },
      {
        th: "ตรวจว่าตัวเลขหน้าอยู่ระหว่าง 1 ถึง 10 หรือยัง",
        en: "Check the mantissa really is between 1 and 10.",
      },
    ],
  };
}
