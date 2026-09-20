import type { Rule } from "../types";
import {
  asOperator,
  binary,
  constant,
  rewriteFirst,
  unparen,
} from "./misapply";

/**
 * ปริพันธ์ · Calculus I.
 *
 * Integration arrives twice over, and the two arrivals look unrelated: as the
 * inverse of differentiation, and as the area under a curve. That they are the
 * same operation is the fundamental theorem, and it is genuinely surprising -
 * worth not flattening into "the rule for integrals".
 *
 * ปริพันธ์ไม่จำกัดเขต = indefinite integral, ปริพันธ์จำกัดเขต = definite
 * integral, การแทนค่า = substitution.
 */
const TOPIC = ["c1.integral-intro"];

export const calculusIntegralRules: Rule[] = [
  {
    id: "c1.integral-power",
    topicIds: TOPIC,
    name: {
      th: "ปริพันธ์ของกำลัง",
      en: "Integrating a power",
    },
    statement: "\\int x^n\\,dx = \\frac{x^{n+1}}{n+1} + C",
    conditions: {
      th: "เมื่อ n ไม่เท่ากับ -1 กรณีนั้นให้ลอการิทึมแทน",
      en: "for n other than -1, where the answer is a logarithm instead",
    },
    plain: {
      th: "กฎกำลังกลับทาง บวกหนึ่งที่เลขชี้กำลังแล้วหารด้วยเลขชี้กำลังใหม่ ตรวจได้ทุกครั้งด้วยการหาอนุพันธ์กลับ",
      en: "The power rule backwards: up one on the exponent, then divide by what you get. Differentiating your answer checks it every time.",
    },
    mnemonic: {
      th: "บวกหนึ่ง แล้วหารด้วยตัวใหม่",
      en: "Up one, then divide by that.",
    },
    examples: [
      { from: "\\int x^3\\,dx", to: "\\frac{x^4}{4} + C" },
      {
        from: "\\int \\frac{1}{x}\\,dx",
        to: "\\ln|x| + C",
        note: {
          th: "กรณียกเว้น เพราะบวกหนึ่งแล้วจะได้หารด้วยศูนย์",
          en: "The exception, because adding one would leave a division by zero.",
        },
      },
    ],
    seeAlso: ["calc.antiderivative-power", "c1.substitution"],
    /**
     * Divided by the old exponent. It is the same slip as in the ม.6 chapter
     * and it survives into university, so it is named in both.
     */
    misapplications: [
      {
        id: "c1.integral-power/divided-by-the-old-exponent",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const quotient = asOperator(node, "/");
            if (!quotient) return null;
            const divisor = unparen(quotient.args[1]!);
            const value = Number(divisor.toString());
            if (!Number.isFinite(value) || value < 2) return null;
            return binary("/", quotient.args[0]!, constant(value - 1));
          }),
        explain: {
          th: "หารด้วยเลขชี้กำลังเดิม ต้องหารด้วยเลขชี้กำลังใหม่",
          en: "Divided by the old exponent rather than the new one.",
        },
        example: { from: "x^4/4", right: "x^4/4", wrong: "x^4/3" },
      },
    ],
  },
  {
    id: "c1.substitution",
    topicIds: TOPIC,
    name: {
      th: "การหาปริพันธ์โดยการแทนค่า",
      en: "Integration by substitution",
    },
    statement: "\\int f(g(x))g'(x)\\,dx = \\int f(u)\\,du",
    plain: {
      th: "กฎลูกโซ่กลับทาง ถ้ามองเห็นว่าส่วนหนึ่งของตัวถูกอินทิเกรตคืออนุพันธ์ของอีกส่วนหนึ่ง ก็ตั้งส่วนนั้นเป็น u แล้วปัญหาจะกลายเป็นปริพันธ์ง่าย ๆ",
      en: "The chain rule run backwards. If part of what is being integrated is the derivative of another part, call that other part u and the problem collapses.",
    },
    mnemonic: {
      th: "มองหาอนุพันธ์ของข้างในที่คูณอยู่",
      en: "Look for the inside's derivative, hiding as a factor.",
    },
    examples: [
      {
        from: "\\int 2x(x^2 + 1)^3\\,dx",
        to: "\\frac{(x^2+1)^4}{4} + C",
        note: {
          th: "2x คืออนุพันธ์ของ x กำลังสองบวกหนึ่งพอดี จึงตั้ง u เป็นวงเล็บนั้น",
          en: "The 2x is exactly the bracket's derivative, so the bracket is u.",
        },
      },
      { from: "\\int \\cos(3x)\\,dx", to: "\\frac{\\sin 3x}{3} + C" },
    ],
    seeAlso: ["c1.chain-rule", "c1.integral-power"],
  },
  {
    id: "c1.definite-integral",
    topicIds: TOPIC,
    name: {
      th: "ปริพันธ์จำกัดเขต",
      en: "The definite integral",
    },
    statement: "\\int_a^b f(x)\\,dx = F(b) - F(a)",
    plain: {
      th: "ปริพันธ์จำกัดเขตเป็นจำนวน ไม่ใช่ฟังก์ชัน ค่าคงตัว C ตัดกันเองเสมอ จึงไม่ต้องเขียน",
      en: "A definite integral is a number, not a function. The constant cancels itself, so it is never written.",
    },
    mnemonic: {
      th: "ขอบบนลบขอบล่าง",
      en: "Top minus bottom.",
    },
    examples: [
      { from: "\\int_0^3 2x\\,dx", to: "9" },
      {
        from: "\\int_1^2 x^2\\,dx",
        to: "\\frac{7}{3}",
        note: {
          th: "คำตอบเป็นเศษส่วนได้ และมักจะเป็น",
          en: "The answer is often a fraction, and that is fine.",
        },
      },
    ],
    seeAlso: ["c1.integral-power", "calc.definite-integral"],
    /**
     * The limits the wrong way round, which negates the answer - and gives a
     * negative area for a curve that never dips below the axis.
     */
    misapplications: [
      {
        id: "c1.definite-integral/swapped-the-limits",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const difference = asOperator(node, "-");
            if (!difference) return null;
            return binary("-", difference.args[1]!, difference.args[0]!);
          }),
        explain: {
          th: "สลับขอบบนกับขอบล่าง คำตอบจะติดลบทั้งก้อน",
          en: "The limits are the wrong way round, which negates the whole answer.",
        },
        example: { from: "9 - 1", right: "8", wrong: "-8" },
      },
    ],
  },
  {
    id: "c1.riemann-sum",
    topicIds: TOPIC,
    name: {
      th: "ผลบวกรีมันน์",
      en: "Riemann sums",
    },
    statement: "\\int_a^b f \\approx \\sum f(x_i)\\Delta x",
    plain: {
      th: "แบ่งพื้นที่ใต้กราฟเป็นแท่งสี่เหลี่ยมแล้วบวกกัน ยิ่งแท่งแคบยิ่งใกล้ความจริง ปริพันธ์คือลิมิตของผลบวกนี้ ซึ่งเป็นนิยามของมันจริง ๆ ไม่ใช่แค่การประมาณ",
      en: "Chop the area into rectangles and add them up. Narrower rectangles get closer, and the integral is the limit of that sum - which is its definition, not an approximation to it.",
    },
    mnemonic: {
      th: "แท่งสี่เหลี่ยมบาง ๆ บวกกันจนไม่มีที่สิ้นสุด",
      en: "Thin rectangles, added up for ever.",
    },
    examples: [
      {
        from: "\\int_0^1 x\\,dx \\text{ ด้วย 4 แท่ง}",
        to: "\\approx 0.625",
        note: {
          th: "ใช้ปลายขวาจะได้ค่าเกินจริงสำหรับฟังก์ชันเพิ่ม ใช้ปลายซ้ายจะได้ค่าน้อยกว่าจริง",
          en: "Right-hand rectangles overshoot for a rising function; left-hand ones fall short.",
        },
      },
    ],
    seeAlso: ["c1.definite-integral"],
  },
];
