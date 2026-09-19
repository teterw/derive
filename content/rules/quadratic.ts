import type { Rule } from "../types";

const TOPIC = ["quadratic-equations"];

/**
 * สมการกำลังสองตัวแปรเดียว · Quadratic equations in one variable.
 *
 * การแยกตัวประกอบ = factorisation, ตัวประกอบร่วม = common factor,
 * ดิสคริมิแนนต์ = discriminant, ราก = root.
 */
export const quadraticRules: Rule[] = [
  {
    id: "quad.common-factor",
    topicIds: TOPIC,
    name: {
      th: "การแยกตัวประกอบด้วยตัวประกอบร่วม",
      en: "Factoring out a common factor",
    },
    statement: "ab + ac = a(b + c)",
    plain: {
      th: "ถ้าทุกพจน์มีตัวประกอบร่วม ให้ดึงออกมาไว้หน้าวงเล็บ",
      en: "If every term shares a factor, pull it outside the bracket.",
    },
    examples: [
      { from: "x^2 - 7x", to: "x(x - 7)" },
      { from: "6x^2 + 9x", to: "3x(2x + 3)" },
    ],
    seeAlso: ["arith.distribute", "quad.zero-product"],
  },
  {
    id: "quad.trinomial-pattern",
    topicIds: TOPIC,
    name: {
      th: "การแยกตัวประกอบตรีนาม",
      en: "Factoring a trinomial",
    },
    statement: "x^2 + (p+q)x + pq = (x + p)(x + q)",
    plain: {
      th: "หาสองจำนวนที่คูณกันได้พจน์คงที่ และบวกกันได้สัมประสิทธิ์ของ x",
      en: "Find two numbers that multiply to the constant term and add to the coefficient of x.",
    },
    mnemonic: {
      th: "หาสองจำนวนที่ คูณได้ท้าย บวกได้กลาง",
      en: "Find two numbers that multiply to the last term and add to the middle one.",
    },
    examples: [
      {
        from: "x^2 - 5x + 6",
        to: "(x - 2)(x - 3)",
        note: {
          th: "(-2)(-3) = 6 และ (-2) + (-3) = -5",
          en: "(-2)(-3) = 6 and (-2) + (-3) = -5.",
        },
      },
      { from: "x^2 + 2x - 15", to: "(x + 5)(x - 3)" },
    ],
    seeAlso: ["quad.diff-squares", "quad.perfect-square-trinomial"],
  },
  {
    id: "quad.diff-squares",
    topicIds: TOPIC,
    name: {
      th: "ผลต่างกำลังสอง",
      en: "Difference of squares",
    },
    statement: "a^2 - b^2 = (a - b)(a + b)",
    plain: {
      th: "กำลังสองลบกำลังสอง แยกเป็นผลต่างคูณผลบวกได้เสมอ",
      en: "A square minus a square always splits into a difference times a sum.",
    },
    mnemonic: {
      th: "ผลต่างกำลังสอง เท่ากับ ผลบวก คูณ ผลต่าง",
      en: "A difference of squares is the sum times the difference.",
    },
    examples: [
      { from: "x^2 - 49", to: "(x - 7)(x + 7)" },
      { from: "9x^2 - 25", to: "(3x - 5)(3x + 5)" },
    ],
    seeAlso: ["quad.trinomial-pattern", "rad.conjugate"],
  },
  {
    id: "quad.perfect-square-trinomial",
    topicIds: TOPIC,
    name: {
      th: "ตรีนามกำลังสองสมบูรณ์",
      en: "Perfect square trinomial",
    },
    statement: "a^2 \\pm 2ab + b^2 = (a \\pm b)^2",
    plain: {
      th: "ตรีนามที่พจน์หัวและพจน์ท้ายเป็นกำลังสอง และพจน์กลางเป็นสองเท่าของผลคูณราก",
      en: "First and last terms are squares, and the middle term is twice their product.",
    },
    mnemonic: {
      th: "หน้ากำลังสอง บวกสองหน้าหลัง บวกหลังกำลังสอง",
      en: "Front squared, plus twice front-times-back, plus back squared - the standard Thai chant, where หน้า and หลัง are the first and second terms.",
    },
    examples: [
      { from: "x^2 + 6x + 9", to: "(x + 3)^2" },
      { from: "x^2 - 10x + 25", to: "(x - 5)^2" },
    ],
    seeAlso: ["quad.trinomial-pattern", "quad.complete-square"],
  },
  {
    id: "quad.zero-product",
    topicIds: TOPIC,
    name: {
      th: "สมบัติการคูณเป็นศูนย์",
      en: "Zero product property",
    },
    statement: "AB = 0 \\iff A = 0 \\ \\text{หรือ} \\ B = 0",
    plain: {
      th: "ถ้าผลคูณเป็นศูนย์ ต้องมีตัวใดตัวหนึ่งเป็นศูนย์",
      en: "If a product is zero, at least one of the factors is zero.",
    },
    mnemonic: {
      th: "คูณกันได้ศูนย์ ต้องมีตัวใดตัวหนึ่งเป็นศูนย์",
      en: "If a product is zero, one of the factors has to be zero.",
    },
    examples: [
      {
        from: "(x - 2)(x - 3) = 0",
        to: "x = 2 \\ \\text{หรือ} \\ x = 3",
        note: {
          th: "ต้องจัดให้ข้างหนึ่งเป็น 0 ก่อนจึงใช้สมบัตินี้ได้",
          en: "One side must be 0 before this property can be used.",
        },
      },
    ],
    seeAlso: ["quad.common-factor", "quad.trinomial-pattern"],
  },
  {
    id: "quad.complete-square",
    topicIds: TOPIC,
    name: {
      th: "การทำให้เป็นกำลังสองสมบูรณ์",
      en: "Completing the square",
    },
    statement:
      "x^2 + bx = \\left(x + \\frac{b}{2}\\right)^2 - \\left(\\frac{b}{2}\\right)^2",
    plain: {
      th: "เติมกำลังสองของครึ่งหนึ่งของสัมประสิทธิ์ x แล้วลบออกเท่าเดิม",
      en: "Add the square of half the coefficient of x, then take the same amount back off.",
    },
    examples: [
      { from: "x^2 + 6x", to: "(x + 3)^2 - 9" },
      { from: "x^2 - 5x", to: "\\left(x - \\frac{5}{2}\\right)^2 - \\frac{25}{4}" },
    ],
    seeAlso: ["quad.perfect-square-trinomial", "quad.formula"],
  },
  {
    id: "quad.square-root-property",
    topicIds: TOPIC,
    name: {
      th: "การถอดรากสองข้าง",
      en: "Square root property",
    },
    statement: "X^2 = k \\iff X = \\pm\\sqrt{k}",
    conditions: { th: "เมื่อ k \\geq 0", en: "for k \\geq 0" },
    plain: {
      th: "ถอดรากทั้งสองข้างได้สองคำตอบ คือบวกและลบ",
      en: "Taking the root of both sides gives two answers, one positive and one negative.",
    },
    examples: [
      { from: "(x + 3)^2 = 16", to: "x + 3 = \\pm 4" },
      { from: "x^2 = 7", to: "x = \\pm\\sqrt{7}" },
    ],
    seeAlso: ["quad.complete-square", "rad.perfect-square-extract"],
  },
  {
    id: "quad.formula",
    topicIds: TOPIC,
    name: {
      th: "สูตรหาคำตอบของสมการกำลังสอง",
      en: "Quadratic formula",
    },
    statement: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
    conditions: {
      th: "สำหรับ $ax^2 + bx + c = 0$ เมื่อ a \\neq 0",
      en: "for $ax^2 + bx + c = 0$ with a \\neq 0",
    },
    plain: {
      th: "สูตรนี้ใช้ได้กับสมการกำลังสองทุกสมการ แม้แยกตัวประกอบไม่ได้",
      en: "This works for every quadratic, including the ones that will not factor.",
    },
    mnemonic: {
      th: "ลบบี บวกลบ รากบีกำลังสองลบสี่เอซี ส่วนสองเอ",
      en: "Minus b, plus-or-minus the root of b squared minus four a c, all over two a - said as one line, which is how it is memorised.",
    },
    examples: [
      {
        from: "x^2 - 5x + 6 = 0",
        to: "x = \\frac{5 \\pm 1}{2} = 3, 2",
        note: {
          th: "a = 1, b = -5, c = 6",
          en: "a = 1, b = -5, c = 6.",
        },
      },
    ],
    seeAlso: ["quad.discriminant", "quad.complete-square"],
  },
  {
    id: "quad.discriminant",
    topicIds: TOPIC,
    name: {
      th: "ดิสคริมิแนนต์กับจำนวนคำตอบ",
      en: "The discriminant and the number of roots",
    },
    statement: "D = b^2 - 4ac",
    plain: {
      th: "D > 0 มีสองคำตอบ, D = 0 มีคำตอบเดียว, D < 0 ไม่มีคำตอบที่เป็นจำนวนจริง",
      en: "D > 0 gives two roots, D = 0 gives one, D < 0 gives none in the real numbers.",
    },
    mnemonic: {
      th: "D มากกว่าศูนย์ได้สองคำตอบ D เท่ากับศูนย์ได้คำตอบเดียว D น้อยกว่าศูนย์ไม่มีคำตอบจำนวนจริง",
      en: "D above zero gives two roots, D zero gives one, D below zero gives none in the reals.",
    },
    examples: [
      {
        from: "x^2 - 4x + 4 = 0",
        to: "D = 0",
        note: {
          th: "มีคำตอบเดียวคือ x = 2",
          en: "One root, x = 2.",
        },
      },
      { from: "x^2 + x + 1 = 0", to: "D = -3 < 0" },
    ],
    seeAlso: ["quad.formula"],
  },
];
