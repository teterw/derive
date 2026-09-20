import type { Rule } from "../types";

/**
 * The moves that are not specific to one topic: keeping an equation balanced,
 * moving a term across, and tidying an expression up. Every step in a
 * derivation has to name a rule, and these are the honest names for the steps
 * that would otherwise be hand-waved as "simplify".
 */
const BOTH = [
  "exponents-radicals",
  "quadratic-equations",
  "poly.factor-degree-2",
  "poly.factor-higher",
  "eq.linear-one-var",
  "ineq.linear-one-var",
  "func.quadratic-graph",
  "func.relations",
];

/** Balancing and modelling start in ม.1 and never stop being used. */
const EQUATIONS = [
  "quadratic-equations",
  "eq.linear-one-var",
  "ineq.linear-one-var",
  "func.relations",
];

export const algebraRules: Rule[] = [
  {
    id: "eq.balance",
    topicIds: EQUATIONS,
    name: {
      th: "สมบัติการเท่ากัน (ทำสิ่งเดียวกันทั้งสองข้าง)",
      en: "Balance property of equations",
    },
    statement: "A = B \\implies A + c = B + c",
    plain: {
      th: "ทำสิ่งเดียวกันกับทั้งสองข้างของสมการ สมการยังคงเป็นจริง",
      en: "Do the same thing to both sides and the equation still holds.",
    },
    examples: [
      { from: "x - 3 = 5", to: "x - 3 + 3 = 5 + 3" },
      { from: "2x = 10", to: "\\frac{2x}{2} = \\frac{10}{2}" },
    ],
    seeAlso: ["eq.move-term"],
  },
  {
    id: "eq.move-term",
    topicIds: EQUATIONS,
    name: {
      th: "การย้ายข้าง",
      en: "Moving a term to the other side",
    },
    statement: "A + c = B \\iff A = B - c",
    plain: {
      th: "ย้ายพจน์ข้ามเครื่องหมายเท่ากับ ต้องเปลี่ยนเครื่องหมายของพจน์นั้น",
      en: "A term that crosses the equals sign changes its sign.",
    },
    examples: [
      { from: "x^2 = 5x - 6", to: "x^2 - 5x + 6 = 0" },
      { from: "3x + 4 = 10", to: "3x = 6" },
    ],
    seeAlso: ["eq.balance"],
  },
  {
    id: "arith.combine-like-terms",
    topicIds: BOTH,
    name: {
      th: "การรวมพจน์คล้าย",
      en: "Combining like terms",
    },
    statement: "ax + bx = (a+b)x",
    plain: {
      th: "พจน์ที่มีตัวแปรและเลขชี้กำลังเหมือนกัน รวมกันได้โดยบวกสัมประสิทธิ์",
      en: "Terms with the same variable part combine by adding their coefficients.",
    },
    examples: [
      { from: "3x + 5x", to: "8x" },
      { from: "7x^2 - 2x^2", to: "5x^2" },
    ],
    seeAlso: ["rad.like-terms"],
  },
  {
    id: "arith.simplify-fraction",
    topicIds: BOTH,
    name: {
      th: "การลดรูปเศษส่วน",
      en: "Reducing a fraction",
    },
    statement: "\\frac{ka}{kb} = \\frac{a}{b}",
    conditions: {
      th: "เมื่อ k \\neq 0 และ b \\neq 0",
      en: "for k \\neq 0 and b \\neq 0",
    },
    plain: {
      th: "ตัดตัวประกอบร่วมของเศษและส่วนออกได้",
      en: "A factor shared by the top and the bottom cancels.",
    },
    examples: [
      { from: "\\frac{6}{8}", to: "\\frac{3}{4}" },
      { from: "\\frac{4 + 2\\sqrt{3}}{2}", to: "2 + \\sqrt{3}" },
    ],
    seeAlso: ["quad.common-factor"],
  },
  {
    id: "model.equation",
    topicIds: EQUATIONS,
    name: {
      th: "การตั้งสมการจากโจทย์ปัญหา",
      en: "Translating a word problem into an equation",
    },
    statement: "\\text{สิ่งที่โจทย์ถาม} \\rightarrow x",
    plain: {
      th: "ตั้งตัวแปรแทนสิ่งที่โจทย์ถาม แล้วเขียนเงื่อนไขในโจทย์เป็นสมการ",
      en: "Name the unknown, then write the condition in the problem as an equation.",
    },
    examples: [
      {
        from: "\\text{พื้นที่ } 40, \\ \\text{ยาวกว่ากว้าง } 3",
        to: "x(x + 3) = 40",
      },
    ],
    seeAlso: ["eq.move-term", "quad.zero-product"],
  },
  {
    id: "model.reject-root",
    topicIds: ["quadratic-equations"],
    name: {
      th: "การตัดคำตอบที่ไม่สมเหตุสมผล",
      en: "Rejecting a root that does not fit",
    },
    statement: "x > 0",
    plain: {
      th: "สมการอาจมีสองคำตอบ แต่บริบทของโจทย์อาจยอมรับได้เพียงคำตอบเดียว",
      en: "The equation may have two roots while the situation allows only one.",
    },
    examples: [
      {
        from: "x = 5 \\text{ หรือ } x = -8",
        to: "x = 5",
        note: {
          th: "ความยาวเป็นลบไม่ได้",
          en: "A length cannot be negative.",
        },
      },
    ],
    seeAlso: ["quad.zero-product", "model.equation"],
  },
  {
    id: "arith.distribute",
    topicIds: BOTH,
    name: {
      th: "สมบัติการแจกแจง",
      en: "Distributive property",
    },
    statement: "a(b + c) = ab + ac",
    plain: {
      th: "คูณกระจายเข้าไปทุกพจน์ในวงเล็บ",
      en: "Multiply into every term inside the bracket.",
    },
    examples: [
      { from: "3(x + 4)", to: "3x + 12" },
      { from: "(x+2)(x+5)", to: "x^2 + 7x + 10" },
    ],
    seeAlso: ["quad.common-factor"],
  },
];
