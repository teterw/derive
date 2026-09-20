import type { Skill, Topic } from "../types";

/**
 * การประยุกต์ของอนุพันธ์ · Calculus I.
 *
 * Everything so far has been about computing a derivative. This chapter is
 * about reading one: the sign of `f'` gives the direction of the graph, the
 * sign of `f''` gives its curvature, and between them every feature of a curve
 * can be found without plotting a single point.
 *
 * It is also where calculus starts answering questions that were asked long
 * before it: the largest rectangle for a given fence was a ม.3 question that
 * could only be answered by completing the square, and only for a rectangle.
 */
export const c1ApplicationsTopic: Topic = {
  id: "c1.applications",
  name: {
    th: "การประยุกต์ของอนุพันธ์",
    en: "Applications of the derivative",
  },
  grade: { th: "แคลคูลัส 1", en: "Calculus I" },
  summary: {
    th: "ช่วงที่ฟังก์ชันเพิ่มและลด การทดสอบด้วยอนุพันธ์อันดับสอง ค่าสูงสุดต่ำสุดบนช่วงปิด โจทย์หาค่าเหมาะที่สุด และอัตราการเปลี่ยนแปลงที่สัมพันธ์กัน",
    en: "Where a function rises and falls, the second derivative test, extreme values on a closed interval, optimisation problems, and related rates.",
  },
  skillIds: [
    "c1.monotonic",
    "c1.extrema",
    "c1.optimisation",
    "c1.related-rates",
  ],
};

export const c1ApplicationsSkills: Skill[] = [
  {
    id: "c1.monotonic",
    topicId: "c1.applications",
    name: {
      th: "ช่วงที่เพิ่ม ลด และความเว้า",
      en: "Rising, falling and bending",
    },
    summary: {
      th: "อ่านทิศทางและความโค้งของกราฟจากเครื่องหมายของอนุพันธ์อันดับหนึ่งและอันดับสอง",
      en: "Reading a graph's direction and curvature from the signs of the first and second derivatives.",
    },
    formula: "f'(x) > 0 \\Rightarrow f \\nearrow",
    strictForm: null,
    prerequisites: ["calc.tangent", "c1.chain-power"],
    ruleIds: [
      "c1.increasing-decreasing",
      "c1.inflection",
      "calc.critical-point",
      "calc.derivative-sum",
    ],
  },
  {
    id: "c1.extrema",
    topicId: "c1.applications",
    name: {
      th: "ค่าสูงสุดและค่าต่ำสุด",
      en: "Maxima and minima",
    },
    summary: {
      th: "จำแนกจุดวิกฤตด้วยอนุพันธ์อันดับสอง และหาค่าสูงสุดต่ำสุดบนช่วงปิด",
      en: "Classifying critical points with the second derivative, and finding extreme values on a closed interval.",
    },
    formula: "f''(c) > 0 \\Rightarrow \\min",
    strictForm: null,
    prerequisites: ["c1.monotonic"],
    ruleIds: [
      "c1.second-derivative",
      "c1.closed-interval",
      "calc.critical-point",
      "calc.tangent-slope",
    ],
  },
  {
    id: "c1.optimisation",
    topicId: "c1.applications",
    name: {
      th: "โจทย์หาค่าเหมาะที่สุด",
      en: "Optimisation",
    },
    summary: {
      th: "แปลงโจทย์เป็นฟังก์ชันตัวแปรเดียว แล้วหาค่าสูงสุดหรือต่ำสุดของมัน",
      en: "Turning a problem into a function of one variable, and then finding its largest or smallest value.",
    },
    formula: "A'(x) = 0",
    strictForm: null,
    prerequisites: ["c1.extrema", "quad.word-problems"],
    ruleIds: ["calc.critical-point", "c1.second-derivative", "model.equation"],
  },
  {
    id: "c1.related-rates",
    topicId: "c1.applications",
    name: {
      th: "อัตราการเปลี่ยนแปลงที่สัมพันธ์กัน",
      en: "Related rates",
    },
    summary: {
      th: "เมื่อสองปริมาณสัมพันธ์กัน อัตราการเปลี่ยนแปลงของมันก็สัมพันธ์กันด้วย",
      en: "When two quantities are tied together, so are the rates at which they change.",
    },
    formula: "\\dfrac{dV}{dt} = \\dfrac{dV}{dr}\\dfrac{dr}{dt}",
    strictForm: null,
    prerequisites: ["c1.chain-transcendental", "c1.implicit"],
    ruleIds: ["c1.related-rates", "c1.chain-rule", "c1.implicit"],
  },
];
