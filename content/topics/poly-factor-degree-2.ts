import type { Skill, Topic } from "../types";

/**
 * การแยกตัวประกอบของพหุนามดีกรีสอง · ม.2 เทอม 2.
 *
 * ## Why this topic does not contain the obvious four
 *
 * The `quadratic-equations` pilot (ม.3) already ships `quad.factor-common`,
 * `quad.factor-trinomial` and `quad.diff-squares`, because solving a quadratic
 * needs them. `attempts.topic_id` is written per row, so moving a skill to a
 * different topic later leaves every attempt already recorded pointing at the
 * old one, and per-topic statistics quietly go wrong for the history.
 *
 * So this topic carries what does not exist yet - the rest of the ม.2 chapter -
 * and names the three pilot skills as prerequisites instead of duplicating
 * them. Read together, the two topics are the whole chapter. If the three ever
 * should move here, that is a decision plus a backfill of `attempts.topic_id`,
 * not something to do by accident while authoring content.
 */
export const polyFactorDegree2Topic: Topic = {
  id: "poly.factor-degree-2",
  name: {
    th: "การแยกตัวประกอบของพหุนามดีกรีสอง",
    en: "Factoring degree-two polynomials",
  },
  grade: { th: "ม.2 พื้นฐาน", en: "Grade 8, basic" },
  summary: {
    th: "กำลังสองสมบูรณ์ การจัดหมู่ การใช้ตัวแปรแทน และพหุนามสองตัวแปร ต่อจากตัวประกอบร่วม ตรีนาม และผลต่างกำลังสอง",
    en: "Perfect squares, grouping, substitution and two-variable polynomials - after common factors, trinomials and differences of squares.",
  },
  skillIds: [
    "poly.perfect-square",
    "poly.grouping",
    "poly.two-variables",
    "poly.substitution",
  ],
};

export const polyFactorDegree2Skills: Skill[] = [
  {
    id: "poly.perfect-square",
    topicId: "poly.factor-degree-2",
    name: {
      th: "แยกตัวประกอบกำลังสองสมบูรณ์",
      en: "Factoring a perfect square",
    },
    summary: {
      th: "รู้จักตรีนามที่เป็นกำลังสองพอดี แล้วเขียนเป็นวงเล็บกำลังสองทันที",
      en: "Recognise a trinomial that is already a square, and write it as one bracket squared.",
    },
    formula: "a^2 \\pm 2ab + b^2 = (a \\pm b)^2",
    strictForm: "factored",
    prerequisites: ["quad.factor-trinomial"],
    ruleIds: [
      "quad.perfect-square-trinomial",
      "quad.common-factor",
      "arith.distribute",
    ],
  },
  {
    id: "poly.grouping",
    topicId: "poly.factor-degree-2",
    name: {
      th: "แยกตัวประกอบโดยการจัดหมู่",
      en: "Factoring by grouping",
    },
    summary: {
      th: "จับพจน์เข้าคู่ ดึงตัวประกอบร่วมของแต่ละคู่ แล้วดึงวงเล็บที่เหมือนกันออกมา",
      en: "Pair the terms, take a common factor out of each pair, then take out the bracket they share.",
    },
    formula: "ax + ay + bx + by = (a+b)(x+y)",
    strictForm: "factored",
    prerequisites: ["quad.factor-common", "quad.factor-trinomial"],
    ruleIds: ["poly.grouping", "quad.common-factor", "arith.distribute"],
  },
  {
    id: "poly.two-variables",
    topicId: "poly.factor-degree-2",
    name: {
      th: "แยกตัวประกอบพหุนามสองตัวแปร",
      en: "Factoring in two variables",
    },
    summary: {
      th: "สูตรเดิมทุกข้อ ใช้ได้เมื่อพจน์ท้ายเป็น y แทนที่จะเป็นตัวเลข",
      en: "The same patterns, with y in the last term instead of a number.",
    },
    formula: "a^2x^2 - b^2y^2 = (ax - by)(ax + by)",
    strictForm: "factored",
    prerequisites: ["quad.diff-squares", "quad.factor-trinomial"],
    ruleIds: [
      "poly.two-variable-pattern",
      "quad.diff-squares",
      "quad.common-factor",
    ],
  },
  {
    id: "poly.substitution",
    topicId: "poly.factor-degree-2",
    name: {
      th: "แยกตัวประกอบโดยใช้ตัวแปรแทน",
      en: "Factoring by substitution",
    },
    summary: {
      th: "มองก้อนที่ซ้ำกันเป็นตัวแปรเดียว แยกตัวประกอบตามปกติ แล้วใส่ก้อนนั้นกลับเข้าไป",
      en: "Treat the repeated chunk as one variable, factor as usual, then put the chunk back.",
    },
    formula: "x^4 + bx^2 + c \\to (x^2 - p)(x^2 - q)",
    strictForm: "factored",
    prerequisites: ["quad.factor-trinomial", "quad.diff-squares"],
    ruleIds: [
      "poly.substitute",
      "quad.trinomial-pattern",
      "quad.diff-squares",
    ],
  },
];
