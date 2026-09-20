import type { Skill, Topic } from "../types";

/**
 * ฟังก์ชันเอกซ์โพเนนเชียลและลอการิทึม · ม.4 เพิ่มเติม.
 *
 * The last chapter of build-order item 3, and the one that finishes the
 * functions layer. A logarithm is not a new operation - it is the question
 * "what power was that?", which ม.2's exponent laws already answer for whole
 * numbers. Every rule here is one of those laws, read backwards.
 *
 * Calculus needs this chapter twice over: `e^x` is the function that is its own
 * derivative, and `\ln x` is the antiderivative of `1/x` - the one gap in the
 * power rule. A learner who is shaky on what `\log_b` *means* cannot be taught
 * either.
 *
 * ## Why nothing here is machine-readable from the stem
 *
 * `lib/math/katex.ts` refuses subscripts - they are not machine-readable and
 * guessing would be a silent mistranslation - so `\log_{2} 8` cannot be
 * converted, and every question in this chapter carries `machineStem: null`.
 * The chapter's own test checks each answer against the definition instead,
 * which is a stronger statement than the generic gate could make anyway.
 */
export const funcExpLogTopic: Topic = {
  id: "func.exp-log",
  name: {
    th: "ฟังก์ชันเอกซ์โพเนนเชียลและลอการิทึม",
    en: "Exponential and logarithmic functions",
  },
  grade: { th: "ม.4 เพิ่มเติม", en: "Grade 10, advanced" },
  summary: {
    th: "อ่านลอการิทึมเป็นคำถามว่ายกกำลังเท่าไร ใช้สมบัติของลอการิทึม และแก้สมการที่ตัวแปรอยู่บนเลขชี้กำลัง",
    en: "Read a logarithm as the question what power was that, use the log laws, and solve equations with the unknown in the exponent.",
  },
  skillIds: ["log.definition", "log.laws", "exp.log.equations"],
};

export const funcExpLogSkills: Skill[] = [
  {
    id: "log.definition",
    topicId: "func.exp-log",
    name: {
      th: "นิยามของลอการิทึม",
      en: "What a logarithm is",
    },
    summary: {
      th: "log ฐาน b ของ x คือคำถามว่า b ยกกำลังเท่าไรจึงได้ x",
      en: "Log base b of x asks: b to what power gives x?",
    },
    formula: "\\log_b x = y \\iff b^y = x",
    strictForm: null,
    prerequisites: ["exp.integer-laws", "exp.negative-zero"],
    ruleIds: ["log.definition", "exp.negative", "exp.zero"],
  },
  {
    id: "log.laws",
    topicId: "func.exp-log",
    name: {
      th: "สมบัติของลอการิทึม",
      en: "The laws of logarithms",
    },
    summary: {
      th: "คูณกลายเป็นบวก หารกลายเป็นลบ ยกกำลังกลายเป็นคูณ เพราะลอการิทึมคือเลขชี้กำลัง",
      en: "Multiplying becomes adding, dividing becomes subtracting, and a power becomes a multiplier - because a logarithm is an exponent.",
    },
    formula: "\\log_b MN = \\log_b M + \\log_b N",
    strictForm: null,
    prerequisites: ["log.definition"],
    ruleIds: [
      "log.product",
      "log.quotient",
      "log.power",
      "log.definition",
    ],
  },
  {
    id: "exp.log.equations",
    topicId: "func.exp-log",
    name: {
      th: "สมการเอกซ์โพเนนเชียลและลอการิทึม",
      en: "Exponential and logarithmic equations",
    },
    summary: {
      th: "ทำสองข้างให้ฐานเดียวกันแล้วเทียบเลขชี้กำลัง หรือเปลี่ยนลอการิทึมกลับเป็นเลขยกกำลัง",
      en: "Make both sides the same base and compare exponents, or turn the logarithm back into a power.",
    },
    formula: "b^m = b^n \\iff m = n",
    strictForm: null,
    prerequisites: ["log.definition", "eq.linear.solve"],
    ruleIds: [
      "exp.same-base",
      "log.definition",
      "exp.power-of-power",
      "eq.collect-variable",
    ],
  },
];
