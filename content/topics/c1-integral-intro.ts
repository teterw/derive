import type { Skill, Topic } from "../types";

/**
 * ปริพันธ์ไม่จำกัดเขตและปริพันธ์จำกัดเขต · Calculus I.
 *
 * The second half of the subject. ม.6 met an antiderivative as differentiation
 * run backwards and a definite integral as an area; this chapter adds the one
 * technique that makes either of them usable on anything beyond a polynomial -
 * substitution, which is the chain rule read from right to left - and the
 * Riemann sum that the definite integral actually *is*.
 */
export const c1IntegralIntroTopic: Topic = {
  id: "c1.integral-intro",
  name: {
    th: "ปริพันธ์ไม่จำกัดเขตและจำกัดเขต",
    en: "Indefinite and definite integrals",
  },
  grade: { th: "แคลคูลัส 1", en: "Calculus I" },
  summary: {
    th: "ปริพันธ์ของกำลังและของฟังก์ชันพื้นฐาน การแทนค่า ปริพันธ์จำกัดเขต และผลบวกรีมันน์",
    en: "Integrating powers and the standard functions, substitution, definite integrals, and Riemann sums.",
  },
  skillIds: [
    "c1.integral-power",
    "c1.substitution",
    "c1.definite",
    "c1.riemann",
  ],
};

export const c1IntegralIntroSkills: Skill[] = [
  {
    id: "c1.integral-power",
    topicId: "c1.integral-intro",
    name: {
      th: "ปริพันธ์ของกำลังและฟังก์ชันพื้นฐาน",
      en: "Integrating powers and standard functions",
    },
    summary: {
      th: "กฎกำลังกลับทาง และปริพันธ์ของ sin cos และ e ยกกำลัง x",
      en: "The power rule backwards, and the integrals of sine, cosine and the exponential.",
    },
    formula: "\\int x^n dx = \\dfrac{x^{n+1}}{n+1} + C",
    strictForm: null,
    prerequisites: ["calc.integral", "c1.exp-log-derivative"],
    ruleIds: [
      "c1.integral-power",
      "calc.antiderivative-power",
      "calc.derivative-constant",
    ],
  },
  {
    id: "c1.substitution",
    topicId: "c1.integral-intro",
    name: {
      th: "การหาปริพันธ์โดยการแทนค่า",
      en: "Substitution",
    },
    summary: {
      th: "กฎลูกโซ่กลับทาง ใช้เมื่ออนุพันธ์ของข้างในปรากฏเป็นตัวคูณอยู่แล้ว",
      en: "The chain rule backwards, for when the inside's derivative is already there as a factor.",
    },
    formula: "\\int f(g)g'\\,dx = \\int f(u)\\,du",
    strictForm: null,
    prerequisites: ["c1.integral-power", "c1.chain-power"],
    ruleIds: ["c1.substitution", "c1.integral-power", "c1.chain-rule"],
  },
  {
    id: "c1.definite",
    topicId: "c1.integral-intro",
    name: {
      th: "ปริพันธ์จำกัดเขต",
      en: "Definite integrals",
    },
    summary: {
      th: "ปริพันธ์ที่มีขอบเขต ซึ่งให้จำนวนออกมา ไม่ใช่ฟังก์ชัน",
      en: "An integral with limits, which gives a number rather than a function.",
    },
    formula: "\\int_a^b f\\,dx = F(b) - F(a)",
    strictForm: null,
    prerequisites: ["c1.substitution"],
    ruleIds: [
      "c1.definite-integral",
      "c1.integral-power",
      "c1.substitution",
    ],
  },
  {
    id: "c1.riemann",
    topicId: "c1.integral-intro",
    name: {
      th: "ผลบวกรีมันน์",
      en: "Riemann sums",
    },
    summary: {
      th: "พื้นที่ใต้กราฟจากการแบ่งเป็นแท่งสี่เหลี่ยม ซึ่งเป็นนิยามของปริพันธ์จำกัดเขต",
      en: "The area under a graph as a sum of rectangles, which is what a definite integral is.",
    },
    formula: "\\sum_{i=1}^{n} f(x_i)\\Delta x",
    strictForm: null,
    prerequisites: ["c1.definite", "seq.arithmetic"],
    ruleIds: ["c1.riemann-sum", "c1.definite-integral"],
  },
];
