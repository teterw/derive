import type { Rule } from "../types";

const TOPIC = ["exponents-radicals"];

/**
 * เลขยกกำลัง · Laws of exponents.
 *
 * Thai terminology follows หลักสูตร สสวท. ฉบับปรับปรุง พ.ศ. 2560:
 * ฐาน = base, เลขชี้กำลัง = exponent.
 */
export const exponentRules: Rule[] = [
  {
    id: "exp.product",
    topicIds: TOPIC,
    name: {
      th: "สมบัติการคูณของเลขยกกำลัง",
      en: "Product of powers",
    },
    statement: "a^m \\cdot a^n = a^{m+n}",
    conditions: { th: "เมื่อ a \\neq 0", en: "for a \\neq 0" },
    plain: {
      th: "คูณเลขยกกำลังที่มีฐานเดียวกัน ให้นำเลขชี้กำลังมาบวกกัน",
      en: "Multiplying powers of the same base adds the exponents.",
    },
    examples: [
      { from: "2^3 \\cdot 2^4", to: "2^{7}" },
      { from: "x^2 \\cdot x^5", to: "x^{7}" },
      {
        from: "a^{-2} \\cdot a^{5}",
        to: "a^{3}",
        note: {
          th: "เลขชี้กำลังลบก็บวกกันได้ตามปกติ",
          en: "Negative exponents add in the same way.",
        },
      },
    ],
    seeAlso: ["exp.quotient", "exp.power-of-power"],
  },
  {
    id: "exp.quotient",
    topicIds: TOPIC,
    name: {
      th: "สมบัติการหารของเลขยกกำลัง",
      en: "Quotient of powers",
    },
    statement: "\\frac{a^m}{a^n} = a^{m-n}",
    conditions: { th: "เมื่อ a \\neq 0", en: "for a \\neq 0" },
    plain: {
      th: "หารเลขยกกำลังที่มีฐานเดียวกัน ให้นำเลขชี้กำลังมาลบกัน",
      en: "Dividing powers of the same base subtracts the exponents.",
    },
    examples: [
      { from: "\\frac{5^7}{5^3}", to: "5^{4}" },
      { from: "\\frac{x^3}{x^8}", to: "x^{-5}" },
    ],
    seeAlso: ["exp.product", "exp.negative"],
  },
  {
    id: "exp.power-of-power",
    topicIds: TOPIC,
    name: {
      th: "เลขยกกำลังของเลขยกกำลัง",
      en: "Power of a power",
    },
    statement: "\\left(a^m\\right)^n = a^{mn}",
    plain: {
      th: "ยกกำลังซ้อนกัน ให้นำเลขชี้กำลังมาคูณกัน",
      en: "Raising a power to a power multiplies the exponents.",
    },
    examples: [
      { from: "\\left(3^2\\right)^4", to: "3^{8}" },
      { from: "\\left(x^{-2}\\right)^{3}", to: "x^{-6}" },
    ],
    seeAlso: ["exp.product"],
  },
  {
    id: "exp.power-of-product",
    topicIds: TOPIC,
    name: {
      th: "เลขยกกำลังของผลคูณ",
      en: "Power of a product",
    },
    statement: "(ab)^n = a^n b^n",
    plain: {
      th: "ยกกำลังผลคูณ ให้ยกกำลังทุกตัวที่คูณกันอยู่",
      en: "A power of a product is the product of the powers.",
    },
    examples: [
      { from: "(2x)^3", to: "8x^3" },
      { from: "\\left(3a^2\\right)^{2}", to: "9a^{4}" },
    ],
    seeAlso: ["exp.power-of-power", "exp.power-of-quotient"],
  },
  {
    id: "exp.power-of-quotient",
    topicIds: TOPIC,
    name: {
      th: "เลขยกกำลังของผลหาร",
      en: "Power of a quotient",
    },
    statement: "\\left(\\frac{a}{b}\\right)^n = \\frac{a^n}{b^n}",
    conditions: { th: "เมื่อ b \\neq 0", en: "for b \\neq 0" },
    plain: {
      th: "ยกกำลังเศษส่วน ให้ยกกำลังทั้งตัวเศษและตัวส่วน",
      en: "A power of a fraction raises both the top and the bottom.",
    },
    examples: [{ from: "\\left(\\frac{2}{3}\\right)^{3}", to: "\\frac{8}{27}" }],
    seeAlso: ["exp.power-of-product"],
  },
  {
    id: "exp.zero",
    topicIds: TOPIC,
    name: {
      th: "เลขชี้กำลังเป็นศูนย์",
      en: "Zero exponent",
    },
    statement: "a^0 = 1",
    conditions: { th: "เมื่อ a \\neq 0", en: "for a \\neq 0" },
    plain: {
      th: "อะไรก็ตามที่ไม่ใช่ศูนย์ ยกกำลังศูนย์ได้ 1 เสมอ",
      en: "Anything except zero, raised to the power zero, is 1.",
    },
    examples: [
      { from: "7^0", to: "1" },
      {
        from: "\\frac{a^3}{a^3}",
        to: "a^0 = 1",
        note: {
          th: "นี่คือเหตุผลว่าทำไม a^0 ต้องเป็น 1",
          en: "This is why a^0 has to be 1.",
        },
      },
    ],
    seeAlso: ["exp.quotient"],
  },
  {
    id: "exp.negative",
    topicIds: TOPIC,
    name: {
      th: "เลขชี้กำลังเป็นจำนวนเต็มลบ",
      en: "Negative exponent",
    },
    statement: "a^{-n} = \\frac{1}{a^n}",
    conditions: { th: "เมื่อ a \\neq 0", en: "for a \\neq 0" },
    plain: {
      th: "เลขชี้กำลังติดลบ หมายถึงส่วนกลับของเลขยกกำลังนั้น",
      en: "A negative exponent means the reciprocal of the power.",
    },
    examples: [
      { from: "2^{-3}", to: "\\frac{1}{8}" },
      { from: "\\frac{1}{x^{-2}}", to: "x^{2}" },
    ],
    seeAlso: ["exp.quotient", "exp.zero"],
  },
  {
    id: "exp.scientific-form",
    topicIds: TOPIC,
    name: {
      th: "สัญกรณ์วิทยาศาสตร์",
      en: "Scientific notation",
    },
    statement: "A \\times 10^n",
    conditions: {
      th: "เมื่อ 1 \\leq |A| < 10 และ n เป็นจำนวนเต็ม",
      en: "with 1 \\leq |A| < 10 and n an integer",
    },
    plain: {
      th: "เขียนจำนวนเป็นตัวเลขหนึ่งหลักจุดทศนิยม คูณด้วยกำลังของสิบ",
      en: "Write the number as one digit, a decimal part, and a power of ten.",
    },
    examples: [
      { from: "43000", to: "4.3 \\times 10^{4}" },
      { from: "0.00025", to: "2.5 \\times 10^{-4}" },
    ],
    seeAlso: ["exp.negative", "exp.product"],
  },
];
