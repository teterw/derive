import type { Skill, Topic } from "../types";

/**
 * กฎลูกโซ่ และการหาอนุพันธ์โดยปริยาย · Calculus I.
 *
 * The last rule of differentiation, and the one that makes the others usable:
 * every rule so far has needed the variable to appear on its own, and almost
 * nothing in the world is written that way.
 *
 * Implicit differentiation is in the same chapter because it is the same rule.
 * `y` is a function of x whether or not anyone has written it as one, so
 * differentiating it hands back a `\frac{dy}{dx}` - and that is the entire
 * technique.
 */
export const c1ChainTopic: Topic = {
  id: "c1.chain",
  name: {
    th: "กฎลูกโซ่และอนุพันธ์โดยปริยาย",
    en: "The chain rule and implicit differentiation",
  },
  grade: { th: "แคลคูลัส 1", en: "Calculus I" },
  summary: {
    th: "การหาอนุพันธ์ของฟังก์ชันประกอบ ทั้งแบบชั้นเดียวและซ้อนกัน และการหาอนุพันธ์เมื่อ y ไม่ได้เขียนในรูปของ x",
    en: "Differentiating composite functions, one layer and several, and differentiating when y is not written in terms of x at all.",
  },
  skillIds: [
    "c1.chain-power",
    "c1.chain-transcendental",
    "c1.chain-combined",
    "c1.implicit",
  ],
};

export const c1ChainSkills: Skill[] = [
  {
    id: "c1.chain-power",
    topicId: "c1.chain",
    name: {
      th: "กฎลูกโซ่กับกำลัง",
      en: "The chain rule on a power",
    },
    summary: {
      th: "อนุพันธ์ของวงเล็บยกกำลัง โดยไม่ต้องกระจายวงเล็บออกมาก่อน",
      en: "Differentiating a bracket raised to a power, without expanding it first.",
    },
    formula: "\\dfrac{d}{dx}(g(x))^n = n(g(x))^{n-1}g'(x)",
    strictForm: null,
    prerequisites: ["c1.product-quotient"],
    ruleIds: ["c1.chain-rule", "calc.derivative-power"],
  },
  {
    id: "c1.chain-transcendental",
    topicId: "c1.chain",
    name: {
      th: "กฎลูกโซ่กับฟังก์ชันอดิศัย",
      en: "The chain rule on sines and exponentials",
    },
    summary: {
      th: "อนุพันธ์ของ sin ของอะไรสักอย่าง e ยกกำลังอะไรสักอย่าง และ ln ของอะไรสักอย่าง",
      en: "Differentiating the sine of something, e to the something, and the log of something.",
    },
    formula: "\\dfrac{d}{dx}\\sin(g(x)) = \\cos(g(x))\\,g'(x)",
    strictForm: null,
    prerequisites: ["c1.chain-power", "c1.trig-derivative"],
    ruleIds: ["c1.chain-rule", "c1.trig-derivative", "c1.exp-log-derivative"],
  },
  {
    id: "c1.chain-combined",
    topicId: "c1.chain",
    name: {
      th: "กฎลูกโซ่ร่วมกับกฎอื่น",
      en: "The chain rule with the others",
    },
    summary: {
      th: "เมื่อกฎลูกโซ่มาพร้อมกฎผลคูณ หรือเมื่อมีสามชั้นซ้อนกัน",
      en: "When the chain rule arrives with the product rule, or when there are three layers.",
    },
    formula: "\\dfrac{d}{dx}f(g(h(x)))",
    strictForm: null,
    prerequisites: ["c1.chain-transcendental"],
    ruleIds: ["c1.chain-depth", "c1.chain-rule", "c1.product-rule"],
  },
  {
    id: "c1.implicit",
    topicId: "c1.chain",
    name: {
      th: "อนุพันธ์โดยปริยาย",
      en: "Implicit differentiation",
    },
    summary: {
      th: "หา dy/dx จากสมการที่ไม่ได้เขียน y ในรูปของ x",
      en: "Finding dy/dx from an equation that never writes y in terms of x.",
    },
    formula: "\\dfrac{d}{dx}y^2 = 2y\\dfrac{dy}{dx}",
    strictForm: null,
    prerequisites: ["c1.chain-power"],
    ruleIds: [
      "c1.implicit",
      "c1.chain-rule",
      "c1.product-rule",
      "eq.collect-variable",
      "eq.balance",
    ],
  },
];
