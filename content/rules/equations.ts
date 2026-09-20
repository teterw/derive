import type { Rule } from "../types";
import { asOperator, binary, rewriteFirst, unparen } from "./misapply";

/**
 * สมการเชิงเส้นตัวแปรเดียว · ม.1.
 *
 * The two moves that only appear once an equation has a variable on both
 * sides or a denominator under one. Balancing and moving a term already live
 * in `algebra.ts`, because the quadratic topic needed them first.
 *
 * ย้ายข้าง = move a term across, ค.ร.น. = lowest common multiple.
 */
const TOPIC = [
  "eq.linear-one-var",
  "ineq.linear-one-var",
  "func.exp-log",
];

export const equationRules: Rule[] = [
  {
    id: "eq.collect-variable",
    topicIds: TOPIC,
    name: {
      th: "การรวมตัวแปรไว้ข้างเดียว",
      en: "Collecting the variable on one side",
    },
    statement: "ax + c = bx + d \\iff (a - b)x = d - c",
    plain: {
      th: "ถ้ามีตัวแปรทั้งสองข้าง ให้ย้ายตัวแปรไปรวมกันข้างหนึ่ง และย้ายตัวเลขไปรวมกันอีกข้างหนึ่ง",
      en: "With the variable on both sides, move all of it to one side and all the numbers to the other.",
    },
    mnemonic: {
      th: "ตัวแปรไปข้างหนึ่ง ตัวเลขไปอีกข้างหนึ่ง",
      en: "Letters one side, numbers the other.",
    },
    examples: [
      {
        from: "5x + 3 = 2x + 9",
        to: "3x = 6",
        note: {
          th: "ย้าย 2x ไปลบทางซ้าย และย้าย 3 ไปลบทางขวา",
          en: "2x moves left as a subtraction, and 3 moves right as one.",
        },
      },
      { from: "7 - x = 2x + 1", to: "6 = 3x" },
    ],
    seeAlso: ["eq.move-term", "eq.balance"],
    /**
     * Moving a term across without changing its sign. The commonest mistake in
     * the whole topic, and the reason the rule is stated as an equivalence
     * rather than as an instruction.
     */
    misapplications: [
      {
        id: "eq.collect-variable/kept-the-sign",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            // A zero form `(lhs) - (rhs)`: keeping the sign turns it into a sum.
            const difference = asOperator(node, "-");
            if (!difference) return null;
            return binary(
              "+",
              difference.args[0]!,
              unparen(difference.args[1]!),
            );
          }),
        explain: {
          th: "ย้ายข้างแล้วลืมเปลี่ยนเครื่องหมาย พจน์ที่ข้ามเครื่องหมายเท่ากับต้องกลับเครื่องหมายเสมอ",
          en: "Moved a term across without changing its sign. Anything that crosses the equals sign flips.",
        },
        example: {
          from: "(5*x + 3) - (2*x + 9)",
          right: "3*x - 6",
          wrong: "7*x + 12",
        },
      },
    ],
  },
  {
    id: "eq.clear-fractions",
    topicIds: TOPIC,
    name: {
      th: "การกำจัดเศษส่วนในสมการ",
      en: "Clearing fractions from an equation",
    },
    statement: "\\frac{A}{m} = \\frac{B}{n} \\iff nA = mB",
    conditions: {
      th: "เมื่อ m \\neq 0 และ n \\neq 0",
      en: "for m \\neq 0 and n \\neq 0",
    },
    plain: {
      th: "คูณทั้งสองข้างด้วยตัวส่วนร่วม เศษส่วนจะหายไปทั้งสมการ แล้วแก้ต่อแบบธรรมดา",
      en: "Multiply both sides by the common denominator and every fraction disappears; then solve as usual.",
    },
    mnemonic: {
      th: "คูณไขว้ได้ ถ้ามีเศษส่วนข้างละตัวพอดี",
      en: "Cross-multiply, when there is exactly one fraction on each side.",
    },
    examples: [
      {
        from: "\\frac{x}{2} + \\frac{x}{3} = 5",
        to: "3x + 2x = 30",
        note: {
          th: "ค.ร.น. ของ 2 กับ 3 คือ 6 จึงคูณทุกพจน์ด้วย 6",
          en: "The lowest common multiple of 2 and 3 is 6, so every term is multiplied by 6.",
        },
      },
      { from: "\\frac{x + 1}{3} = \\frac{x - 2}{4}", to: "4(x + 1) = 3(x - 2)" },
    ],
    seeAlso: ["eq.balance", "arith.simplify-fraction"],
    /**
     * Multiplying only the fractions and leaving the whole numbers alone, which
     * is what happens when "cancel the denominators" is remembered as a trick
     * rather than as multiplying every term.
     */
    misapplications: [
      {
        id: "eq.clear-fractions/missed-a-term",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const difference = asOperator(node, "-");
            if (!difference) return null;
            const quotient = asOperator(unparen(difference.args[0]!), "/");
            if (!quotient) return null;
            // The fraction is cleared; the term on the other side is not.
            return binary(
              "-",
              quotient.args[0]!,
              unparen(difference.args[1]!),
            );
          }),
        explain: {
          th: "คูณเฉพาะพจน์ที่เป็นเศษส่วน พจน์ที่เป็นจำนวนเต็มก็ต้องคูณด้วยเหมือนกันทุกพจน์",
          en: "Only the fractions were multiplied. Every term has to be multiplied, whole numbers included.",
        },
        example: {
          from: "(x/2) - (5)",
          right: "x/2 - 5",
          wrong: "x - 5",
        },
      },
    ],
  },
  {
    id: "eq.check-solution",
    topicIds: TOPIC,
    name: {
      th: "การตรวจคำตอบ",
      en: "Checking the solution",
    },
    statement: "P(r) = Q(r)",
    plain: {
      th: "แทนคำตอบกลับเข้าไปในสมการเดิม ถ้าสองข้างเท่ากันจริง แสดงว่าคำตอบถูก",
      en: "Put the answer back into the original equation. If the two sides come out equal, it is right.",
    },
    mnemonic: {
      th: "แทนกลับเข้าสมการเดิม ไม่ใช่สมการที่จัดรูปแล้ว",
      en: "Substitute into the original equation, not into one you rearranged.",
    },
    examples: [
      {
        from: "3x + 5 = 20, \\ x = 5",
        to: "3(5) + 5 = 20",
        note: {
          th: "ตรวจกับสมการเดิมเสมอ ถ้าจัดรูปผิดไปแล้วการตรวจกับสมการใหม่จะไม่จับข้อผิดพลาด",
          en: "Always against the original: checking against a line you rearranged will not catch a mistake in the rearranging.",
        },
      },
    ],
    seeAlso: ["eq.balance"],
  },
];
