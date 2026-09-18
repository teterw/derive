import type { Rule } from "../types";

const TOPIC = ["exponents-radicals"];

/**
 * กรณฑ์ที่สอง · Square roots.
 *
 * ตัวถูกกรณฑ์ = radicand, จัดรูป = simplify,
 * ทำให้ตัวส่วนไม่ติดกรณฑ์ = rationalise the denominator.
 */
export const radicalRules: Rule[] = [
  {
    id: "rad.product",
    topicIds: TOPIC,
    name: {
      th: "สมบัติการคูณของกรณฑ์ที่สอง",
      en: "Product rule for square roots",
    },
    statement: "\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab}",
    conditions: {
      th: "เมื่อ a \\geq 0 และ b \\geq 0",
      en: "for a \\geq 0 and b \\geq 0",
    },
    plain: {
      th: "คูณกรณฑ์เข้าด้วยกัน ให้คูณตัวถูกกรณฑ์เข้าด้วยกัน",
      en: "Multiplying two square roots multiplies what is inside them.",
    },
    examples: [
      { from: "\\sqrt{3} \\cdot \\sqrt{12}", to: "\\sqrt{36} = 6" },
      { from: "\\sqrt{2} \\cdot \\sqrt{5}", to: "\\sqrt{10}" },
    ],
    seeAlso: ["rad.perfect-square-extract", "rad.quotient"],
  },
  {
    id: "rad.quotient",
    topicIds: TOPIC,
    name: {
      th: "สมบัติการหารของกรณฑ์ที่สอง",
      en: "Quotient rule for square roots",
    },
    statement: "\\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}}",
    conditions: {
      th: "เมื่อ a \\geq 0 และ b > 0",
      en: "for a \\geq 0 and b > 0",
    },
    plain: {
      th: "หารกรณฑ์ด้วยกรณฑ์ ให้หารตัวถูกกรณฑ์กัน",
      en: "Dividing two square roots divides what is inside them.",
    },
    examples: [{ from: "\\frac{\\sqrt{50}}{\\sqrt{2}}", to: "\\sqrt{25} = 5" }],
    seeAlso: ["rad.product", "rad.rationalize-monomial"],
  },
  {
    id: "rad.perfect-square-extract",
    topicIds: TOPIC,
    name: {
      th: "การถอดตัวประกอบกำลังสองออกจากตัวถูกกรณฑ์",
      en: "Extracting a perfect square from the radicand",
    },
    statement: "\\sqrt{k^2 m} = k\\sqrt{m}",
    conditions: { th: "เมื่อ k > 0 และ m \\geq 0", en: "for k > 0, m \\geq 0" },
    plain: {
      th: "แยกตัวประกอบที่เป็นกำลังสองสมบูรณ์ออกมานอกเครื่องหมายกรณฑ์",
      en: "Pull any perfect-square factor out from under the root sign.",
    },
    examples: [
      {
        from: "\\sqrt{72}",
        to: "6\\sqrt{2}",
        note: {
          th: "72 = 36 \\cdot 2 และ 36 เป็นกำลังสองสมบูรณ์",
          en: "72 = 36 \\cdot 2, and 36 is a perfect square.",
        },
      },
      { from: "\\sqrt{45}", to: "3\\sqrt{5}" },
    ],
    seeAlso: ["rad.product"],
  },
  {
    id: "rad.like-terms",
    topicIds: TOPIC,
    name: {
      th: "การบวกลบกรณฑ์ที่เหมือนกัน",
      en: "Adding like radicals",
    },
    statement: "a\\sqrt{c} + b\\sqrt{c} = (a+b)\\sqrt{c}",
    plain: {
      th: "บวกลบกรณฑ์ได้เฉพาะเมื่อตัวถูกกรณฑ์เหมือนกัน เหมือนการรวมพจน์คล้าย",
      en: "Radicals add only when the radicands match, just like like terms.",
    },
    examples: [
      { from: "3\\sqrt{5} + 4\\sqrt{5}", to: "7\\sqrt{5}" },
      {
        from: "\\sqrt{8} + \\sqrt{2}",
        to: "3\\sqrt{2}",
        note: {
          th: "ต้องจัดรูป \\sqrt{8} เป็น 2\\sqrt{2} ก่อน จึงจะรวมกันได้",
          en: "Simplify \\sqrt{8} to 2\\sqrt{2} first, then they combine.",
        },
      },
    ],
    seeAlso: ["rad.perfect-square-extract", "arith.combine-like-terms"],
  },
  {
    id: "rad.rationalize-monomial",
    topicIds: TOPIC,
    name: {
      th: "การทำให้ตัวส่วนไม่ติดกรณฑ์ (ตัวส่วนพจน์เดียว)",
      en: "Rationalising a single-term denominator",
    },
    statement: "\\frac{a}{\\sqrt{b}} = \\frac{a\\sqrt{b}}{b}",
    conditions: { th: "เมื่อ b > 0", en: "for b > 0" },
    plain: {
      th: "คูณทั้งเศษและส่วนด้วยกรณฑ์ตัวเดิม ตัวส่วนจะไม่ติดกรณฑ์",
      en: "Multiply top and bottom by the same root to clear it from the bottom.",
    },
    examples: [
      { from: "\\frac{1}{\\sqrt{2}}", to: "\\frac{\\sqrt{2}}{2}" },
      { from: "\\frac{6}{\\sqrt{3}}", to: "2\\sqrt{3}" },
    ],
    seeAlso: ["rad.conjugate", "rad.product"],
  },
  {
    id: "rad.conjugate",
    topicIds: TOPIC,
    name: {
      th: "การใช้สังยุคทำให้ตัวส่วนไม่ติดกรณฑ์",
      en: "Rationalising with the conjugate",
    },
    statement: "(a + \\sqrt{b})(a - \\sqrt{b}) = a^2 - b",
    plain: {
      th: "คูณด้วยสังยุค คือเปลี่ยนเครื่องหมายกลางให้ตรงข้าม แล้วกรณฑ์จะหายไป",
      en: "Multiply by the conjugate - the same terms with the middle sign flipped - and the root cancels.",
    },
    examples: [
      {
        from: "\\frac{1}{3 + \\sqrt{5}}",
        to: "\\frac{3 - \\sqrt{5}}{4}",
        note: {
          th: "ตัวส่วนกลายเป็น 3^2 - 5 = 4",
          en: "The denominator becomes 3^2 - 5 = 4.",
        },
      },
    ],
    seeAlso: ["rad.rationalize-monomial", "quad.diff-squares"],
  },
];
