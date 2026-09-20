import type { Rule } from "../types";
import { asOperator, binary, negate, rewriteFirst, unparen } from "./misapply";

/**
 * กราฟของฟังก์ชันกำลังสอง · ม.3.
 *
 * Four rules, and between them they answer every question a ม.3 paper asks
 * about a parabola: what shape is it, where does it turn, what is the biggest
 * or smallest it gets, and where does it cross.
 *
 * จุดยอด = vertex, แกนสมมาตร = axis of symmetry, จุดตัดแกน = intercept.
 */
const TOPIC = ["func.quadratic-graph"];

export const functionRules: Rule[] = [
  {
    id: "func.vertex-form",
    topicIds: TOPIC,
    name: {
      th: "รูปกำลังสองสมบูรณ์และจุดยอด",
      en: "Completed-square form and the vertex",
    },
    statement: "y = a(x - h)^2 + k \\implies (h,\\ k)",
    plain: {
      th: "เมื่อเขียนฟังก์ชันในรูปนี้ได้ จุดยอดอ่านได้ทันทีจากตัวเลขในวงเล็บและตัวที่บวกอยู่ท้าย โดยค่าในวงเล็บต้องกลับเครื่องหมาย",
      en: "Once it is in this form the vertex can be read straight off - from the number inside the bracket, with its sign flipped, and the one added at the end.",
    },
    mnemonic: {
      th: "ในวงเล็บกลับเครื่องหมาย ข้างนอกไม่กลับ",
      en: "Inside the bracket the sign flips; outside it does not.",
    },
    examples: [
      {
        from: "y = (x - 3)^2 + 5",
        to: "(3,\\ 5)",
        note: {
          th: "ในวงเล็บเป็นลบ 3 จุดยอดจึงอยู่ที่ x เท่ากับบวก 3",
          en: "Minus 3 inside the bracket puts the vertex at x equals plus 3.",
        },
      },
      { from: "y = 2(x + 1)^2 - 7", to: "(-1,\\ -7)" },
    ],
    seeAlso: ["quad.complete-square", "func.axis-of-symmetry"],
    /**
     * Reading the vertex straight out of the bracket without flipping its
     * sign. The same slip as reading roots off a factorisation, and just as
     * common.
     */
    misapplications: [
      {
        id: "func.vertex-form/did-not-flip",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const squared = asOperator(node, "^");
            if (!squared) return null;
            if (squared.args[1]!.toString() !== "2") return null;
            for (const op of ["+", "-"] as const) {
              const inside = asOperator(unparen(squared.args[0]!), op);
              if (!inside) continue;
              return binary(
                "^",
                binary(
                  op === "+" ? "-" : "+",
                  inside.args[0]!,
                  inside.args[1]!,
                ),
                squared.args[1]!,
              );
            }
            return null;
          }),
        explain: {
          th: "ค่าในวงเล็บต้องกลับเครื่องหมายก่อนจึงจะเป็นพิกัดของจุดยอด",
          en: "The number inside the bracket has to have its sign flipped before it is the vertex's coordinate.",
        },
        example: {
          from: "(x - 3)^2",
          right: "x^2 - 6*x + 9",
          wrong: "(x + 3)^2",
        },
      },
    ],
  },
  {
    id: "func.axis-of-symmetry",
    topicIds: TOPIC,
    name: {
      th: "แกนสมมาตรของพาราโบลา",
      en: "The axis of symmetry",
    },
    statement: "x = -\\frac{b}{2a}",
    conditions: {
      th: "สำหรับ $y = ax^2 + bx + c$ เมื่อ a \\neq 0",
      en: "for $y = ax^2 + bx + c$ with a \\neq 0",
    },
    plain: {
      th: "พาราโบลาสมมาตรรอบเส้นตรงแนวตั้งที่ผ่านจุดยอด และเส้นนั้นหาได้จากสัมประสิทธิ์โดยไม่ต้องจัดรูปอะไรเลย",
      en: "A parabola is symmetric about the vertical line through its vertex, and that line comes straight from the coefficients with no rearranging at all.",
    },
    mnemonic: {
      th: "ลบบีส่วนสองเอ ตัวเดียวกับที่อยู่หน้าเครื่องหมายบวกลบในสูตรหาคำตอบ",
      en: "Minus b over two a - the same piece that sits in front of the plus-or-minus in the quadratic formula.",
    },
    examples: [
      { from: "y = x^2 - 6x + 5", to: "x = 3" },
      {
        from: "y = 2x^2 + 8x + 1",
        to: "x = -2",
        note: {
          th: "a = 2 และ b = 8 จึงได้ -8 หารด้วย 4",
          en: "a = 2 and b = 8, so it is -8 over 4.",
        },
      },
    ],
    seeAlso: ["func.vertex-form", "quad.formula"],
  },
  {
    id: "func.parabola-direction",
    topicIds: TOPIC,
    name: {
      th: "ทิศทางการเปิดของพาราโบลา",
      en: "Which way the parabola opens",
    },
    statement: "a > 0 \\implies \\smile, \\quad a < 0 \\implies \\frown",
    plain: {
      th: "สัมประสิทธิ์หน้า x กำลังสองบอกทิศทางการเปิด และทิศทางนั้นบอกว่าจุดยอดเป็นค่าต่ำสุดหรือค่าสูงสุด",
      en: "The coefficient of x squared says which way it opens, and that says whether the vertex is the least value or the greatest.",
    },
    mnemonic: {
      th: "บวกยิ้ม ลบคว่ำ",
      en: "Positive smiles, negative frowns.",
    },
    examples: [
      {
        from: "y = -2(x - 1)^2 + 8",
        to: "\\max = 8",
        note: {
          th: "เปิดลง จุดยอดจึงเป็นจุดที่สูงที่สุด",
          en: "It opens downwards, so the vertex is the highest point.",
        },
      },
      { from: "y = 3(x + 2)^2 - 4", to: "\\min = -4" },
    ],
    seeAlso: ["func.vertex-form"],
    /**
     * Reporting the vertex as a minimum when the parabola opens downwards.
     * The arithmetic is right and the conclusion is upside down.
     */
    misapplications: [
      {
        id: "func.parabola-direction/wrong-way-up",
        apply: (math) => rewriteFirst(math, (node) => negate(node)),
        explain: {
          th: "สัมประสิทธิ์หน้า x กำลังสองเป็นลบ กราฟจึงเปิดลง จุดยอดเป็นค่าสูงสุด ไม่ใช่ค่าต่ำสุด",
          en: "The coefficient of x squared is negative, so the graph opens downwards and the vertex is a maximum, not a minimum.",
        },
        example: { from: "8", right: "8", wrong: "-8" },
      },
    ],
  },
  {
    id: "func.intercepts",
    topicIds: TOPIC,
    name: {
      th: "จุดตัดแกน x และแกน y",
      en: "Where a curve meets the axes",
    },
    statement: "y\\text{-intercept}: x = 0, \\quad x\\text{-intercept}: y = 0",
    plain: {
      th: "แทน x ด้วยศูนย์ได้จุดตัดแกน y แทน y ด้วยศูนย์แล้วแก้สมการได้จุดตัดแกน x ซึ่งอาจมีสองจุด หนึ่งจุด หรือไม่มีเลย",
      en: "Put x = 0 for where it crosses the y-axis; put y = 0 and solve for where it crosses the x-axis - which may be twice, once, or not at all.",
    },
    mnemonic: {
      th: "ตัดแกนไหน ให้อีกตัวเป็นศูนย์",
      en: "To cross an axis, the other coordinate is zero.",
    },
    examples: [
      {
        from: "y = x^2 - 5x + 6",
        to: "(0,\\ 6), \\ (2,\\ 0), \\ (3,\\ 0)",
        note: {
          th: "จุดตัดแกน y คือพจน์คงที่เสมอ ส่วนจุดตัดแกน x คือรากของสมการ",
          en: "The y-intercept is always the constant term; the x-intercepts are the roots.",
        },
      },
      { from: "y = x^2 + 1", to: "(0,\\ 1)" },
    ],
    seeAlso: ["quad.zero-product", "quad.discriminant"],
  },
];
