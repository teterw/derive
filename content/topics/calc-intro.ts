import type { Skill, Topic } from "../types";

/**
 * แคลคูลัสเบื้องต้น · ม.6.
 *
 * Build-order item 6, and the point of the whole curriculum map: everything
 * before it exists to make this chapter possible. Factoring is here because a
 * zero-over-zero limit needs it; the quadratic formula is here because a
 * turning point needs it; sequences are here because a limit of one is what a
 * limit *is*.
 *
 * ## Checking calculus without a computer algebra system
 *
 * The app has no symbolic differentiator, and adding one to check the content
 * would mean trusting a second implementation of the same idea. Instead
 * `calc-intro.test.ts` checks every derivative *numerically* - a central
 * difference at several points - and every antiderivative by differentiating
 * it back. That is an independent oracle rather than a second opinion, which
 * is what a check is supposed to be.
 */
export const calcIntroTopic: Topic = {
  id: "calc.intro",
  name: {
    th: "แคลคูลัสเบื้องต้น",
    en: "Introductory calculus",
  },
  grade: { th: "ม.6 เพิ่มเติม", en: "Grade 12, advanced" },
  summary: {
    th: "ลิมิต อนุพันธ์และความหมายเชิงเรขาคณิต การหาจุดสูงสุดต่ำสุด และปฏิยานุพันธ์กับพื้นที่ใต้กราฟ",
    en: "Limits, derivatives and what they mean geometrically, turning points, and antiderivatives and the area under a curve.",
  },
  skillIds: [
    "calc.limit",
    "calc.derivative",
    "calc.tangent",
    "calc.integral",
  ],
};

export const calcIntroSkills: Skill[] = [
  {
    id: "calc.limit",
    topicId: "calc.intro",
    name: {
      th: "ลิมิตของฟังก์ชัน",
      en: "Limits",
    },
    summary: {
      th: "ค่าที่ฟังก์ชันเข้าใกล้ รวมถึงรูปแบบศูนย์ส่วนศูนย์ที่ต้องจัดรูปก่อน",
      en: "What a function approaches, including the zero-over-zero form that has to be tidied up first.",
    },
    formula: "\\lim_{x \\to a} f(x)",
    strictForm: null,
    prerequisites: ["quad.factor-trinomial"],
    ruleIds: ["calc.limit-substitution", "calc.limit-factor-cancel"],
  },
  {
    id: "calc.derivative",
    topicId: "calc.intro",
    name: {
      th: "อนุพันธ์",
      en: "Derivatives",
    },
    summary: {
      th: "กฎกำลัง อนุพันธ์ทีละพจน์ และกฎผลคูณ",
      en: "The power rule, differentiating term by term, and the product rule.",
    },
    formula: "\\dfrac{d}{dx}x^n = nx^{n-1}",
    strictForm: null,
    prerequisites: ["calc.limit", "exp.integer-laws"],
    ruleIds: [
      "calc.derivative-power",
      "calc.derivative-sum",
      "calc.derivative-constant",
      "calc.derivative-product",
      "calc.tangent-slope",
      "arith.distribute",
    ],
  },
  {
    id: "calc.tangent",
    topicId: "calc.intro",
    name: {
      th: "ความชันและจุดสูงสุดต่ำสุด",
      en: "Slopes and turning points",
    },
    summary: {
      th: "อนุพันธ์คือความชันของเส้นสัมผัส และเป็นศูนย์ที่จุดสูงสุดหรือต่ำสุด",
      en: "The derivative is the slope of the tangent, and it is zero at a high or low point.",
    },
    formula: "m = f'(a)",
    strictForm: null,
    prerequisites: ["calc.derivative", "func.quad.vertex"],
    ruleIds: [
      "calc.tangent-slope",
      "calc.critical-point",
      "calc.derivative-sum",
      "quad.zero-product",
      "eq.balance",
    ],
  },
  {
    id: "calc.integral",
    topicId: "calc.intro",
    name: {
      th: "ปฏิยานุพันธ์และพื้นที่",
      en: "Antiderivatives and area",
    },
    summary: {
      th: "การหาอนุพันธ์กลับทาง ปริพันธ์จำกัดเขต และพื้นที่ใต้เส้นโค้ง",
      en: "Differentiation run backwards, definite integrals, and the area under a curve.",
    },
    formula: "\\int_a^b f(x)\\,dx = F(b) - F(a)",
    strictForm: null,
    prerequisites: ["calc.derivative"],
    ruleIds: [
      "calc.antiderivative-power",
      "calc.definite-integral",
      "calc.derivative-constant",
    ],
  },
];
