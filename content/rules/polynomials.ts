import type { Rule } from "../types";
import {
  add,
  asOperator,
  multiply,
  negate,
  rewriteFirst,
  unparen,
} from "./misapply";

/**
 * การแยกตัวประกอบของพหุนามดีกรีสอง · ม.2.
 *
 * The moves the ม.2 chapter adds on top of common factors, trinomials and
 * differences of squares - which live in `quadratic.ts`, because solving a
 * quadratic needs them and that topic shipped first. See
 * `content/topics/poly-factor-degree-2.ts` for why they were not moved.
 *
 * การจัดหมู่ = grouping, ตัวแปรแทน = a substituted variable.
 */
const TOPIC = ["poly.factor-degree-2"];

/** Grouping is met in ม.2 and picked up again, one degree higher, in ม.3. */
const BOTH_CHAPTERS = ["poly.factor-degree-2", "poly.factor-higher"];

export const polynomialRules: Rule[] = [
  {
    id: "poly.grouping",
    topicIds: BOTH_CHAPTERS,
    name: {
      th: "การแยกตัวประกอบโดยการจัดหมู่",
      en: "Factoring by grouping",
    },
    statement: "ax + ay + bx + by = (a + b)(x + y)",
    plain: {
      th: "จับพจน์เข้าคู่ ดึงตัวประกอบร่วมของแต่ละคู่ออกมา ถ้าทำถูกคู่ วงเล็บที่เหลือจะเหมือนกัน แล้วดึงวงเล็บนั้นออกมาอีกชั้น",
      en: "Pair the terms and take a common factor out of each pair. If the pairing is right the two brackets match, and that bracket comes out too.",
    },
    mnemonic: {
      th: "จับคู่ ดึงร่วม เหลือวงเล็บเหมือนกัน แล้วดึงวงเล็บออก",
      en: "Pair, pull, match, pull again.",
    },
    examples: [
      {
        from: "x^2 + 3x + 2x + 6",
        to: "(x + 2)(x + 3)",
        note: {
          // `$...$`: without them the dash is read as the end of the formula
          // and typeset as a minus sign hanging off it.
          th: "$x(x + 3) + 2(x + 3)$ - วงเล็บเหมือนกันทั้งสองคู่",
          en: "$x(x + 3) + 2(x + 3)$ - the same bracket comes out of both pairs.",
        },
      },
      { from: "6x^2 + 9x + 4x + 6", to: "(3x + 2)(2x + 3)" },
    ],
    seeAlso: ["quad.common-factor", "quad.trinomial-pattern"],
    /**
     * The second pair is where this goes wrong, and it goes wrong at the sign:
     * `-2x - 6` needs `-2(x + 3)`, and a learner who takes out `+2` gets
     * `2(-x - 3)`, does not notice the brackets no longer match, and writes
     * down the sign they expected.
     */
    misapplications: [
      {
        id: "poly.grouping/sign-on-second-pair",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const product = asOperator(node, "*");
            if (!product) return null;
            const second = asOperator(unparen(product.args[1]!), "-");
            if (!second) return null;
            return multiply(
              product.args[0]!,
              add(second.args[0]!, second.args[1]!),
            );
          }),
        explain: {
          th: "เครื่องหมายของคู่หลังกลับด้าน - ถ้าคู่หลังเป็นลบ ต้องดึงตัวลบออกมาด้วย",
          en: "The sign on the second pair is the wrong way round: a negative pair has to have the minus taken out with it.",
        },
        example: {
          from: "(x + 3) * (x - 2)",
          right: "x^2 + x - 6",
          wrong: "x^2 + 5x + 6",
        },
      },
    ],
  },
  {
    id: "poly.substitute",
    topicIds: TOPIC,
    name: {
      th: "การใช้ตัวแปรแทน",
      en: "Substituting for a repeated chunk",
    },
    statement: "x^4 + bx^2 + c = \\left(x^2\\right)^2 + b\\left(x^2\\right) + c",
    plain: {
      th: "ถ้าพหุนามเขียนใหม่ได้โดยมีก้อนเดิมซ้ำสองชั้น ให้มองก้อนนั้นเป็นตัวแปรเดียว แล้วแยกตัวประกอบตามปกติ",
      en: "When the same chunk appears squared and on its own, treat the chunk as a single variable and factor as usual.",
    },
    mnemonic: {
      th: "มองก้อนเป็นตัวเดียว แยกให้เสร็จ แล้วค่อยใส่ก้อนกลับ",
      en: "One chunk, one letter: factor, then put the chunk back.",
    },
    examples: [
      {
        from: "x^4 - 5x^2 + 6",
        to: "\\left(x^2 - 2\\right)\\left(x^2 - 3\\right)",
        note: {
          th: "มอง x^2 เป็นก้อนเดียว จะได้ตรีนามธรรมดาที่คูณได้ 6 บวกได้ -5",
          en: "With x^2 as the chunk it is an ordinary trinomial: two numbers multiplying to 6 and adding to -5.",
        },
      },
      {
        from: "x^4 - 13x^2 + 36",
        to: "(x - 2)(x + 2)(x - 3)(x + 3)",
        note: {
          th: "แยกได้ \\left(x^2 - 4\\right)\\left(x^2 - 9\\right) ก่อน แล้วแต่ละวงเล็บยังเป็นผลต่างกำลังสองอีก",
          en: "It factors to \\left(x^2 - 4\\right)\\left(x^2 - 9\\right) first, and each bracket is still a difference of squares.",
        },
      },
    ],
    seeAlso: ["quad.trinomial-pattern", "quad.diff-squares"],
    /**
     * The whole point of the substitution is that the chunk is `x^2`, not `x`.
     * A learner who factors the trinomial correctly and then writes the roots
     * against `x` has skipped putting the chunk back.
     */
    misapplications: [
      {
        id: "poly.substitute/forgot-to-put-the-chunk-back",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const squared = asOperator(node, "^");
            if (!squared) return null;
            const base = unparen(squared.args[0]!);
            if (base.type !== "SymbolNode") return null;
            if (squared.args[1]!.toString() !== "2") return null;
            return base;
          }),
        explain: {
          th: "ลืมใส่ก้อนกลับ - ที่แยกได้คือค่าของ x^2 ไม่ใช่ค่าของ x",
          en: "Forgot to put the chunk back: what came out of the trinomial was x^2, not x.",
        },
        example: {
          from: "(x^2 - 2) * (x^2 - 3)",
          right: "x^4 - 5x^2 + 6",
          wrong: "(x - 2) * (x^2 - 3)",
        },
      },
    ],
  },
  {
    id: "poly.two-variable-pattern",
    topicIds: TOPIC,
    name: {
      th: "รูปแบบเดิมในพหุนามสองตัวแปร",
      en: "The same patterns, in two variables",
    },
    statement: "x^2 + (p+q)xy + pq\\,y^2 = (x + py)(x + qy)",
    plain: {
      th: "พหุนามสองตัวแปรใช้สูตรเดิมทุกข้อ ต่างกันแค่พจน์ท้ายของวงเล็บมี y ติดอยู่ด้วย",
      en: "Two-variable polynomials use exactly the same patterns; the last term in each bracket simply carries a y.",
    },
    mnemonic: {
      th: "มอง y เป็นหน่วย แล้วทำเหมือนโจทย์ตัวแปรเดียว",
      en: "Treat y as the unit and it is the one-variable question again.",
    },
    examples: [
      { from: "9x^2 - 16y^2", to: "(3x - 4y)(3x + 4y)" },
      {
        from: "x^2 + 5xy + 6y^2",
        to: "(x + 2y)(x + 3y)",
        note: {
          th: "2 กับ 3 คูณกันได้ 6 และบวกกันได้ 5 เหมือนเดิม ต่างแค่มี y ติดไปด้วย",
          en: "2 and 3 still multiply to 6 and add to 5; they just carry a y.",
        },
      },
    ],
    seeAlso: ["quad.diff-squares", "quad.trinomial-pattern"],
    /**
     * Dropping the y is the mistake this skill exists to catch. The numbers
     * are worked out correctly and then written against nothing.
     */
    misapplications: [
      {
        id: "poly.two-variable-pattern/dropped-the-y",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const product = asOperator(node, "*");
            if (!product) return null;
            const stripped = product.args.map((argument) =>
              dropTrailingY(unparen(argument)),
            );
            if (stripped.every((argument) => argument === null)) return null;
            return multiply(
              stripped[0] ?? product.args[0]!,
              stripped[1] ?? product.args[1]!,
            );
          }),
        explain: {
          th: "ลืม y ในวงเล็บ - ตัวเลขถูกแล้ว แต่พจน์ท้ายของวงเล็บต้องมี y ติดอยู่",
          en: "Dropped the y. The numbers are right, but the last term in the bracket carries a y.",
        },
        example: {
          // Explicit `*` between the variables: an answer value is mathjs
          // source and is not normalised, and mathjs reads a bare `xy` as one
          // symbol called "xy".
          from: "(x + 2*y) * (x + 3*y)",
          right: "x^2 + 5*x*y + 6*y^2",
          wrong: "(x + 2) * (x + 3)",
        },
      },
    ],
  },
];

/** `x + 2y` with the y taken off: `x + 2`. Null when there is no y to take. */
function dropTrailingY(node: ReturnType<typeof unparen>) {
  for (const op of ["+", "-"] as const) {
    const sum = asOperator(node, op);
    if (!sum) continue;
    const tail = unparen(sum.args[1]!);
    const coefficient = asOperator(tail, "*");
    if (coefficient && coefficient.args[1]!.toString() === "y") {
      const rebuilt = coefficient.args[0]!;
      return op === "+"
        ? add(sum.args[0]!, rebuilt)
        : add(sum.args[0]!, negate(rebuilt));
    }
  }
  return null;
}
