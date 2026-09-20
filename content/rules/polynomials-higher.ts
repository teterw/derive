import type { Rule } from "../types";
import { asOperator, binary, rewriteFirst, unparen } from "./misapply";

/**
 * การแยกตัวประกอบของพหุนามดีกรีสูงกว่าสอง · ม.3.
 *
 * Three routes down from degree three to a linear factor times a quadratic:
 * a pattern (the cubes), a rearrangement (grouping, which lives in
 * `polynomials.ts` because ม.2 meets it first), and the theorem you reach for
 * when neither works.
 *
 * ผลบวกของกำลังสาม = sum of cubes, ทฤษฎีบทตัวประกอบ = the factor theorem.
 */
const TOPIC = ["poly.factor-higher"];

/**
 * The middle sign of the quadratic factor, flipped.
 *
 * `a^3 + b^3` is `(a+b)(a^2 - ab + b^2)`: the bracket's middle term takes the
 * *opposite* sign to the one between the cubes. Writing the same sign twice is
 * the mistake this pair of rules exists to name, and it is the one every
 * textbook warns about, usually with a chant.
 */
function flipMiddleSign(math: string): string | null {
  return rewriteFirst(math, (node) => {
    const product = asOperator(node, "*");
    if (!product) return null;
    /*
     * `a^2 - ab + b^2` parses as `(a^2 - ab) + b^2`, so the trailing `+ b^2`
     * is the outer node and the sign that matters is the inner one. The last
     * term is a square and therefore always added, which is why only the
     * inner operator has two possibilities.
     */
    const quadratic = asOperator(unparen(product.args[1]!), "+");
    if (!quadratic) return null;
    for (const middle of ["+", "-"] as const) {
      const head = asOperator(unparen(quadratic.args[0]!), middle);
      if (!head) continue;
      return binary(
        "*",
        product.args[0]!,
        binary(
          "+",
          binary(middle === "+" ? "-" : "+", head.args[0]!, head.args[1]!),
          quadratic.args[1]!,
        ),
      );
    }
    return null;
  });
}

export const polynomialHigherRules: Rule[] = [
  {
    id: "poly.sum-cubes",
    topicIds: TOPIC,
    name: {
      th: "ผลบวกของกำลังสาม",
      en: "Sum of cubes",
    },
    statement: "a^3 + b^3 = (a + b)(a^2 - ab + b^2)",
    plain: {
      th: "ผลบวกของกำลังสามแยกได้เสมอ เป็นผลบวกคูณกับตรีนามที่มีเครื่องหมายกลางเป็นลบ",
      en: "A sum of cubes always factors: the sum, times a trinomial whose middle term is negative.",
    },
    mnemonic: {
      th: "หน้าบวกหลัง หน้ากำลังสอง ลบหน้าหลัง บวกหลังกำลังสอง",
      en: "Front plus back, then front squared minus front-times-back plus back squared - the chant, where หน้า and หลัง are the two cube roots.",
    },
    examples: [
      { from: "x^3 + 27", to: "(x + 3)(x^2 - 3x + 9)" },
      {
        from: "8x^3 + 125",
        to: "(2x + 5)(4x^2 - 10x + 25)",
        note: {
          th: "รากที่สามของ 8x^3 คือ 2x และของ 125 คือ 5",
          en: "The cube roots are 2x and 5.",
        },
      },
    ],
    seeAlso: ["poly.diff-cubes", "quad.diff-squares"],
    misapplications: [
      {
        id: "poly.sum-cubes/middle-sign",
        apply: flipMiddleSign,
        explain: {
          th: "เครื่องหมายกลางของตรีนามต้องตรงข้ามกับเครื่องหมายระหว่างสองกำลังสาม ไม่ใช่เหมือนกัน",
          en: "The trinomial's middle sign is the opposite of the one between the cubes, not the same.",
        },
        example: {
          from: "(x + 3) * (x^2 - 3*x + 9)",
          right: "x^3 + 27",
          wrong: "(x + 3) * (x^2 + 3*x + 9)",
        },
      },
    ],
  },
  {
    id: "poly.diff-cubes",
    topicIds: TOPIC,
    name: {
      th: "ผลต่างของกำลังสาม",
      en: "Difference of cubes",
    },
    statement: "a^3 - b^3 = (a - b)(a^2 + ab + b^2)",
    plain: {
      th: "ผลต่างของกำลังสามแยกได้เสมอ เป็นผลต่างคูณกับตรีนามที่มีเครื่องหมายกลางเป็นบวก",
      en: "A difference of cubes always factors: the difference, times a trinomial whose middle term is positive.",
    },
    mnemonic: {
      th: "หน้าลบหลัง หน้ากำลังสอง บวกหน้าหลัง บวกหลังกำลังสอง",
      en: "Front minus back, then front squared plus front-times-back plus back squared.",
    },
    examples: [
      { from: "x^3 - 8", to: "(x - 2)(x^2 + 2x + 4)" },
      {
        from: "27x^3 - 64",
        to: "(3x - 4)(9x^2 + 12x + 16)",
        note: {
          th: "ต่างจากผลต่างกำลังสอง ตรงที่ตรีนามที่เหลือแยกต่อไม่ได้อีก",
          en: "Unlike a difference of squares, the trinomial left behind does not factor again.",
        },
      },
    ],
    seeAlso: ["poly.sum-cubes", "quad.diff-squares"],
    misapplications: [
      {
        id: "poly.diff-cubes/middle-sign",
        apply: flipMiddleSign,
        explain: {
          th: "เครื่องหมายกลางของตรีนามต้องตรงข้ามกับเครื่องหมายระหว่างสองกำลังสาม ไม่ใช่เหมือนกัน",
          en: "The trinomial's middle sign is the opposite of the one between the cubes, not the same.",
        },
        example: {
          from: "(x - 2) * (x^2 + 2*x + 4)",
          right: "x^3 - 8",
          wrong: "(x - 2) * (x^2 - 2*x + 4)",
        },
      },
    ],
  },
  {
    id: "poly.factor-theorem",
    topicIds: TOPIC,
    name: {
      th: "ทฤษฎีบทตัวประกอบ",
      en: "The factor theorem",
    },
    statement: "P(r) = 0 \\iff (x - r) \\mid P(x)",
    plain: {
      th: "ถ้าแทน x ด้วย r แล้ว P(x) เป็นศูนย์ แปลว่า x ลบ r เป็นตัวประกอบของ P(x) และในทางกลับกันด้วย",
      en: "If putting r in for x makes the polynomial zero, then x minus r is a factor of it - and the other way round too.",
    },
    mnemonic: {
      th: "แทนแล้วได้ศูนย์ แปลว่าหารลงตัว",
      en: "Substitute and get zero: it divides exactly.",
    },
    examples: [
      {
        from: "P(x) = x^3 - 6x^2 + 11x - 6",
        to: "P(1) = 0",
        note: {
          th: "ลองค่าที่หารพจน์คงที่ลงตัวก่อนเสมอ - ตัวประกอบของ 6 คือ 1, 2, 3, 6",
          en: "Try the values that divide the constant term first: for 6 those are 1, 2, 3 and 6.",
        },
      },
      { from: "P(1) = 0", to: "(x - 1) \\mid P(x)" },
    ],
    seeAlso: ["poly.divide-by-factor", "quad.zero-product"],
  },
  {
    id: "poly.divide-by-factor",
    topicIds: TOPIC,
    name: {
      th: "การหารด้วยตัวประกอบที่หาได้",
      en: "Dividing out the factor you found",
    },
    statement: "P(x) = (x - r)\\,Q(x)",
    conditions: {
      th: "เมื่อ P(r) = 0 และ Q(x) มีดีกรีน้อยกว่า P(x) อยู่หนึ่ง",
      en: "when P(r) = 0, and Q(x) is one degree lower than P(x)",
    },
    plain: {
      th: "หารพหุนามด้วยตัวประกอบที่หาได้ ผลหารจะมีดีกรีลดลงหนึ่ง และไม่มีเศษ",
      en: "Divide by the factor you found: the quotient is one degree lower, and there is no remainder.",
    },
    examples: [
      {
        from: "x^3 - 6x^2 + 11x - 6",
        to: "(x - 1)(x^2 - 5x + 6)",
        note: {
          th: "เศษต้องเป็นศูนย์ ถ้าไม่เป็น แปลว่าหาตัวประกอบผิด",
          en: "The remainder has to be zero. If it is not, the factor was wrong.",
        },
      },
    ],
    seeAlso: ["poly.factor-theorem", "quad.trinomial-pattern"],
  },
];
