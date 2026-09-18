import { coefficientPower, power } from "../format";
import { makeStep } from "../step";
import type {
  Difficulty,
  Generator,
  Misconception,
  Question,
  RNG,
  Step,
} from "../types";

const ID = "exp.zero-negative";
const SKILL = "exp.negative-zero";
const TOPIC = "exponents-radicals";

/**
 * เลขชี้กำลังเป็นศูนย์และจำนวนเต็มลบ.
 *
 * The skill declares `strictForm: "positive-exponents"`, so every answer here
 * must land with no negative exponent left - `1/8`, not `2^{-3}`.
 */
export const expZeroNegative: Generator = {
  id: ID,
  skillId: SKILL,
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const v = rng.pick(["x", "y", "a", "b"] as const);
    const built = build(rng, v, difficulty);

    return {
      id: `${ID}:${rng.seed}:${difficulty}`,
      generatorId: ID,
      skillId: SKILL,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: {
        th: "จงเขียนให้อยู่ในรูปที่มีเลขชี้กำลังเป็นบวก",
        en: "Rewrite with positive exponents only",
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

type Built = {
  stem: string;
  answerMath: string;
  steps: Step[];
  hints: { th: string; en: string }[];
  misconceptions?: Misconception[];
};

function build(rng: RNG, v: string, difficulty: Difficulty): Built {
  if (difficulty === 1) {
    // Half the time the zero exponent, half a small numeric negative power:
    // the two facts this skill is built on.
    if (rng.bool()) {
      const base = rng.int(2, 12);
      const exponent = rng.int(2, 6);
      return {
        stem: `\\frac{${power(String(base), exponent)}}{${power(String(base), exponent)}}`,
        answerMath: "1",
        steps: [
          makeStep(power(String(base), 0), "exp.quotient", {
            th: `ฐานเดียวกัน ลบเลขชี้กำลัง: ${exponent} - ${exponent} = 0`,
            en: `Same base, so subtract: ${exponent} - ${exponent} = 0.`,
          }),
          makeStep("1", "exp.zero", {
            th: `${base} \\neq 0 ดังนั้น ${base}^0 = 1`,
            en: `${base} \\neq 0, so ${base}^0 = 1.`,
          }),
        ],
        hints: [
          {
            th: "ตัวเศษกับตัวส่วนเท่ากันพอดี",
            en: "The top and the bottom are the same number.",
          },
          { th: "ใช้สมบัติการหารของเลขยกกำลัง", en: "Use the quotient rule." },
          { th: "อะไรยกกำลังศูนย์ได้เท่าไร", en: "What is anything to the power zero?" },
        ],
      };
    }

    const base = rng.int(2, 5);
    const exponent = rng.int(2, 4);
    const value = base ** exponent;
    return {
      stem: power(String(base), -exponent),
      answerMath: `1/${value}`,
      misconceptions: [
        {
          answer: { kind: "exact", value: `-${value}` },
          explain: {
            th: "เครื่องหมายลบอยู่บนเลขชี้กำลัง ไม่ใช่บนคำตอบ - เลขชี้กำลังลบหมายถึงส่วนกลับ",
            en: "The minus is on the exponent, not on the answer - a negative exponent means the reciprocal.",
          },
        },
      ],
      steps: [
        makeStep(`\\frac{1}{${power(String(base), exponent)}}`, "exp.negative", {
          th: "เลขชี้กำลังลบ หมายถึงส่วนกลับ",
          en: "A negative exponent means the reciprocal.",
        }),
        makeStep(`\\frac{1}{${value}}`, "exp.negative", {
          th: `${base}^{${exponent}} = ${value}`,
          en: `${base}^{${exponent}} = ${value}.`,
        }),
      ],
      hints: [
        {
          th: "เครื่องหมายลบบนเลขชี้กำลังไม่ได้ทำให้คำตอบติดลบ",
          en: "A minus sign in the exponent does not make the answer negative.",
        },
        { th: "ใช้กฎเลขชี้กำลังเป็นจำนวนเต็มลบ", en: "Use the negative exponent rule." },
        {
          th: `เขียนเป็น \\frac{1}{${base}^{${exponent}}} ก่อน`,
          en: `Write it as \\frac{1}{${base}^{${exponent}}} first.`,
        },
      ],
    };
  }

  if (difficulty === 2) {
    const n = rng.int(2, 6);
    const c = rng.int(2, 6);
    return {
      stem: `${c}${power(v, -n)}`,
      answerMath: `${c}/${v}^(${n})`,
      steps: [
        makeStep(`${c} \\cdot \\frac{1}{${power(v, n)}}`, "exp.negative", {
          th: `${power(v, -n)} คือส่วนกลับของ ${power(v, n)} ส่วนสัมประสิทธิ์ ${c} ไม่ได้ติดลบด้วย`,
          en: `${power(v, -n)} is the reciprocal of ${power(v, n)}; the coefficient ${c} is not affected.`,
        }),
        makeStep(`\\frac{${c}}{${power(v, n)}}`, "exp.negative", {
          th: "รวมเป็นเศษส่วนเดียว",
          en: "Write it as a single fraction.",
        }),
      ],
      hints: [
        {
          th: `เลขชี้กำลังลบอยู่กับ ${v} เท่านั้น ไม่ได้อยู่กับ ${c}`,
          en: `The negative exponent belongs to ${v}, not to ${c}.`,
        },
        { th: "ใช้กฎเลขชี้กำลังเป็นจำนวนเต็มลบ", en: "Use the negative exponent rule." },
        {
          th: `${c}${power(v, -n)} = ${c} \\cdot \\frac{1}{${power(v, n)}}`,
          en: `${c}${power(v, -n)} = ${c} \\cdot \\frac{1}{${power(v, n)}}.`,
        },
      ],
    };
  }

  if (difficulty === 3) {
    const m = rng.int(1, 4);
    const n = m + rng.int(2, 5);
    return {
      stem: `\\frac{${power(v, m)}}{${power(v, n)}}`,
      answerMath: `1/${v}^(${n - m})`,
      steps: [
        makeStep(power(v, `${m}-${n}`), "exp.quotient", {
          th: "ฐานเดียวกัน ลบเลขชี้กำลัง",
          en: "Same base, so subtract the exponents.",
        }),
        makeStep(power(v, m - n), "exp.quotient", {
          th: `${m} - ${n} = ${m - n} ซึ่งติดลบ`,
          en: `${m} - ${n} = ${m - n}, which is negative.`,
        }),
        makeStep(`\\frac{1}{${power(v, n - m)}}`, "exp.negative", {
          th: "เปลี่ยนเลขชี้กำลังลบให้เป็นส่วนกลับ",
          en: "Turn the negative exponent into a reciprocal.",
        }),
      ],
      hints: [
        {
          th: "ตัวส่วนมีเลขชี้กำลังมากกว่าตัวเศษ",
          en: "The bottom has the larger exponent.",
        },
        {
          th: "ลบเลขชี้กำลังก่อน แล้วค่อยจัดการเครื่องหมายลบ",
          en: "Subtract first, then deal with the minus sign.",
        },
        {
          th: `จะได้ ${power(v, m - n)}`,
          en: `You get ${power(v, m - n)}.`,
        },
      ],
    };
  }

  // Difficulty 4: a negative exponent outside a bracket that already holds one.
  const c = rng.int(2, 4);
  const m = rng.int(1, 3);
  const n = rng.int(2, 3);
  const cn = c ** n;
  return {
    stem: `\\left(${coefficientPower(c, v, -m)}\\right)^{${-n}}`,
    answerMath: `${v}^(${m * n})/${cn}`,
    steps: [
      makeStep(
        `${power(String(c), -n)} \\cdot \\left(${power(v, -m)}\\right)^{${-n}}`,
        "exp.power-of-product",
        {
          th: `ยกกำลัง ${-n} ให้ทั้งสัมประสิทธิ์และตัวแปร`,
          en: `Raise both the coefficient and the variable to the power ${-n}.`,
        },
      ),
      makeStep(
        `${power(String(c), -n)}${power(v, m * n)}`,
        "exp.power-of-power",
        {
          th: `เลขชี้กำลังของ ${v} คือ (${-m}) \\times (${-n}) = ${m * n}`,
          en: `The exponent of ${v} is (${-m}) \\times (${-n}) = ${m * n}.`,
        },
      ),
      makeStep(`\\frac{${power(v, m * n)}}{${cn}}`, "exp.negative", {
        th: `${power(String(c), -n)} = \\frac{1}{${cn}}`,
        en: `${power(String(c), -n)} = \\frac{1}{${cn}}.`,
      }),
    ],
    hints: [
      {
        th: "ลบคูณลบได้บวก - ระวังเครื่องหมายของเลขชี้กำลัง",
        en: "Negative times negative is positive - watch the exponent signs.",
      },
      {
        th: "กระจายเลขชี้กำลังนอกวงเล็บเข้าไปก่อน",
        en: "Distribute the outside exponent first.",
      },
      {
        th: `สัมประสิทธิ์กลายเป็น ${power(String(c), -n)}`,
        en: `The coefficient becomes ${power(String(c), -n)}.`,
      },
    ],
  };
}
