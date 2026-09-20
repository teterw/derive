import type { Skill, Topic } from "../types";

/**
 * อนุพันธ์และกฎการหาอนุพันธ์ · Calculus I.
 *
 * ม.6 differentiated polynomials, which needs one rule. This chapter needs the
 * definition those rules came from, two rules for combining functions, and the
 * derivatives of the functions that are not polynomials - which the app could
 * not have carried at all before `lib/math/katex.ts` learnt to read `\sin`.
 */
export const c1DerivativeTopic: Topic = {
  id: "c1.derivative",
  name: {
    th: "อนุพันธ์และกฎการหาอนุพันธ์",
    en: "Derivatives and differentiation rules",
  },
  grade: { th: "แคลคูลัส 1", en: "Calculus I" },
  summary: {
    th: "อนุพันธ์จากนิยาม กฎผลคูณและกฎผลหาร และอนุพันธ์ของฟังก์ชันตรีโกณมิติ เอกซ์โพเนนเชียลและลอการิทึม",
    en: "The derivative from first principles, the product and quotient rules, and the derivatives of the trigonometric, exponential and logarithmic functions.",
  },
  skillIds: [
    "c1.first-principles",
    "c1.product-quotient",
    "c1.trig-derivative",
    "c1.exp-log-derivative",
  ],
};

export const c1DerivativeSkills: Skill[] = [
  {
    id: "c1.first-principles",
    topicId: "c1.derivative",
    name: {
      th: "อนุพันธ์จากนิยาม",
      en: "First principles",
    },
    summary: {
      th: "หาอนุพันธ์จากลิมิตของผลต่างความชัน ซึ่งเป็นที่มาของกฎทุกข้อในบทนี้",
      en: "The derivative as a limit of slopes, which is where every rule in the chapter comes from.",
    },
    formula: "\\lim_{h \\to 0}\\dfrac{f(x+h) - f(x)}{h}",
    strictForm: null,
    prerequisites: ["calc.derivative", "c1.one-sided"],
    ruleIds: ["c1.first-principles", "calc.limit-factor-cancel"],
  },
  {
    id: "c1.product-quotient",
    topicId: "c1.derivative",
    name: {
      th: "กฎผลคูณและกฎผลหาร",
      en: "The product and quotient rules",
    },
    summary: {
      th: "อนุพันธ์ของผลคูณและผลหาร ซึ่งไม่ใช่ผลคูณหรือผลหารของอนุพันธ์",
      en: "Differentiating a product and a quotient - neither of which is the product or quotient of the derivatives.",
    },
    formula: "(fg)' = f'g + fg'",
    strictForm: null,
    prerequisites: ["calc.derivative"],
    ruleIds: [
      "c1.product-rule",
      "c1.quotient-rule",
      "calc.derivative-power",
      "calc.derivative-sum",
      "arith.combine-like-terms",
      "quad.common-factor",
    ],
  },
  {
    id: "c1.trig-derivative",
    topicId: "c1.derivative",
    name: {
      th: "อนุพันธ์ของฟังก์ชันตรีโกณมิติ",
      en: "Trigonometric derivatives",
    },
    summary: {
      th: "อนุพันธ์ของ sin cos และ tan และการใช้ร่วมกับกฎผลคูณ",
      en: "The derivatives of sine, cosine and tangent, and using them alongside the product rule.",
    },
    formula: "\\dfrac{d}{dx}\\sin x = \\cos x",
    strictForm: null,
    prerequisites: ["c1.trig-limit", "c1.product-quotient"],
    ruleIds: [
      "c1.trig-derivative",
      "c1.product-rule",
      "c1.quotient-rule",
      "calc.derivative-sum",
      "trig.pythagorean-identity",
    ],
  },
  {
    id: "c1.exp-log-derivative",
    topicId: "c1.derivative",
    name: {
      th: "อนุพันธ์ของเอกซ์โพเนนเชียลและลอการิทึม",
      en: "Exponential and logarithmic derivatives",
    },
    summary: {
      th: "ฟังก์ชันที่อนุพันธ์เท่ากับตัวเอง และฟังก์ชันที่อนุพันธ์กลายเป็นเศษส่วนธรรมดา",
      en: "The function that is its own derivative, and the one whose derivative is an ordinary fraction.",
    },
    formula: "\\dfrac{d}{dx}e^x = e^x",
    strictForm: null,
    prerequisites: ["c1.product-quotient", "log.definition"],
    ruleIds: [
      "c1.exp-log-derivative",
      "c1.product-rule",
      "calc.derivative-sum",
      "arith.simplify-fraction",
      "quad.common-factor",
    ],
  },
];
