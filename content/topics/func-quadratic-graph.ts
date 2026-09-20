import type { Skill, Topic } from "../types";

/**
 * กราฟของฟังก์ชันกำลังสอง · ม.3 เทอม 1.
 *
 * Build-order item 3 (docs/CURRICULUM.md): the first topic that is about a
 * *function* rather than about an expression or an equation, and the first
 * place a learner is asked what a formula looks like rather than what it
 * equals. Everything calculus later does to a curve - where it turns, which
 * way it opens, where it crosses - is asked here first, about the one curve
 * that can be answered by algebra alone.
 *
 * The three skills are the three questions a ม.3 paper asks about a parabola,
 * and they are in dependency order: get it into the form that shows the
 * vertex, read the vertex off, then find where it meets the axes.
 */
export const funcQuadraticGraphTopic: Topic = {
  id: "func.quadratic-graph",
  name: {
    th: "กราฟของฟังก์ชันกำลังสอง",
    en: "Graphs of quadratic functions",
  },
  grade: { th: "ม.3 พื้นฐาน", en: "Grade 9, basic" },
  summary: {
    th: "จัดรูปเป็นกำลังสองสมบูรณ์เพื่ออ่านจุดยอด หาแกนสมมาตรและค่าสูงสุดต่ำสุด และหาจุดตัดแกน",
    en: "Complete the square to read the vertex off, find the axis of symmetry and the greatest or least value, and find where the curve meets the axes.",
  },
  skillIds: [
    "func.quad.vertex-form",
    "func.quad.vertex",
    "func.quad.intercepts",
  ],
};

export const funcQuadraticGraphSkills: Skill[] = [
  {
    id: "func.quad.vertex-form",
    topicId: "func.quadratic-graph",
    name: {
      th: "เขียนในรูปกำลังสองสมบูรณ์",
      en: "Writing it in completed-square form",
    },
    summary: {
      th: "จัดรูปจาก ax^2 + bx + c เป็น a(x - h)^2 + k ซึ่งเป็นรูปที่อ่านจุดยอดได้ทันที",
      en: "Turn ax^2 + bx + c into a(x - h)^2 + k, the form the vertex can be read straight off.",
    },
    formula: "ax^2 + bx + c = a(x - h)^2 + k",
    strictForm: "vertex-form",
    prerequisites: ["quad.completing-square"],
    ruleIds: [
      "func.vertex-form",
      "quad.complete-square",
      "quad.perfect-square-trinomial",
      "arith.distribute",
    ],
  },
  {
    id: "func.quad.vertex",
    topicId: "func.quadratic-graph",
    name: {
      th: "จุดยอด แกนสมมาตร และค่าสูงสุดต่ำสุด",
      en: "Vertex, axis of symmetry, and the greatest or least value",
    },
    summary: {
      th: "จุดยอดบอกทั้งแกนสมมาตรและค่าที่สูงที่สุดหรือต่ำที่สุดของฟังก์ชัน",
      en: "The vertex gives both the axis of symmetry and the largest or smallest value the function takes.",
    },
    formula: "x = -\\dfrac{b}{2a}",
    strictForm: null,
    prerequisites: ["func.quad.vertex-form"],
    ruleIds: [
      "func.axis-of-symmetry",
      "func.vertex-form",
      "func.parabola-direction",
    ],
  },
  {
    id: "func.quad.intercepts",
    topicId: "func.quadratic-graph",
    name: {
      th: "จุดตัดแกน x และแกน y",
      en: "Where the curve meets the axes",
    },
    summary: {
      th: "จุดตัดแกน y คือค่าเมื่อ x เป็นศูนย์ จุดตัดแกน x คือคำตอบของสมการ",
      en: "The y-intercept is the value at x = 0; the x-intercepts are the roots of the equation.",
    },
    formula: "y = 0 \\Rightarrow ax^2 + bx + c = 0",
    strictForm: null,
    prerequisites: ["quad.solve-by-factoring", "func.quad.vertex"],
    ruleIds: [
      "func.intercepts",
      "quad.zero-product",
      "quad.trinomial-pattern",
      "quad.discriminant",
    ],
  },
];
