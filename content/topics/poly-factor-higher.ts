import type { Skill, Topic } from "../types";

/**
 * การแยกตัวประกอบของพหุนามดีกรีสูงกว่าสอง · ม.3 เทอม 1.
 *
 * Next in the build order after `poly.factor-degree-2`
 * (docs/CURRICULUM.md §Build order), and the last of the pure-factoring
 * chapters: everything here is a way of getting a degree-three polynomial down
 * to a linear factor times a quadratic, at which point ม.2 finishes the job.
 *
 * The three skills are the three routes a ม.3 textbook offers, in the order it
 * offers them - a pattern you recognise, a rearrangement you spot, and the
 * theorem you fall back on when neither works.
 */
export const polyFactorHigherTopic: Topic = {
  id: "poly.factor-higher",
  name: {
    th: "การแยกตัวประกอบของพหุนามดีกรีสูงกว่าสอง",
    en: "Factoring polynomials of degree higher than two",
  },
  grade: { th: "ม.3 พื้นฐาน", en: "Grade 9, basic" },
  summary: {
    th: "ผลบวกและผลต่างของกำลังสาม การจัดหมู่พหุนามดีกรีสาม และทฤษฎีบทตัวประกอบ",
    en: "Sums and differences of cubes, grouping a cubic, and the factor theorem.",
  },
  skillIds: ["poly.cubes", "poly.higher-grouping", "poly.factor-theorem"],
};

export const polyFactorHigherSkills: Skill[] = [
  {
    id: "poly.cubes",
    topicId: "poly.factor-higher",
    name: {
      th: "ผลบวกและผลต่างของกำลังสาม",
      en: "Sums and differences of cubes",
    },
    summary: {
      th: "จำรูปแบบสองสูตรนี้ แล้วแยกได้ทันทีโดยไม่ต้องหารเลย",
      en: "Recognise the two patterns and factor straight away, with no division.",
    },
    formula: "a^3 \\pm b^3 = (a \\pm b)(a^2 \\mp ab + b^2)",
    strictForm: "factored",
    prerequisites: ["quad.diff-squares", "poly.perfect-square"],
    ruleIds: ["poly.sum-cubes", "poly.diff-cubes", "quad.common-factor"],
  },
  {
    id: "poly.higher-grouping",
    topicId: "poly.factor-higher",
    name: {
      th: "จัดหมู่พหุนามดีกรีสาม",
      en: "Grouping a cubic",
    },
    summary: {
      th: "สี่พจน์เหมือนเดิม แต่คู่หน้าดึงได้ x^2 ออกมา เหลือวงเล็บดีกรีสอง",
      en: "Four terms again, but the first pair gives up an x^2 and what is left is a quadratic.",
    },
    formula: "x^3 + ax^2 + bx + ab = (x + a)(x^2 + b)",
    strictForm: "factored",
    prerequisites: ["poly.grouping"],
    ruleIds: [
      "poly.grouping",
      "quad.common-factor",
      "quad.diff-squares",
      "arith.distribute",
    ],
  },
  {
    id: "poly.factor-theorem",
    topicId: "poly.factor-higher",
    name: {
      th: "ทฤษฎีบทตัวประกอบ",
      en: "The factor theorem",
    },
    summary: {
      th: "หาค่าที่แทนแล้วได้ศูนย์ นั่นคือตัวประกอบหนึ่งตัว แล้วหารออกเพื่อเหลือดีกรีสอง",
      en: "Find a value that makes it zero - that is one factor - then divide it out and a quadratic is left.",
    },
    formula: "P(r) = 0 \\iff (x - r) \\mid P(x)",
    strictForm: "factored",
    prerequisites: ["poly.higher-grouping", "quad.factor-trinomial"],
    ruleIds: [
      "poly.factor-theorem",
      "poly.divide-by-factor",
      "quad.trinomial-pattern",
      "quad.common-factor",
    ],
  },
];
