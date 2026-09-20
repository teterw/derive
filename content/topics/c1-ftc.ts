import type { Skill, Topic } from "../types";

/**
 * ทฤษฎีบทหลักมูลของแคลคูลัส · Calculus I.
 *
 * The last chapter of the course and the reason for all of it. Two questions
 * that have nothing obviously to do with each other - how steep is this curve,
 * and how much area is under it - turn out to be the same question asked
 * backwards, and everything computable about integrals follows from that.
 *
 * The skills here are the two halves of the theorem and the two things it is
 * immediately used for: turning a rate into a total, and finding the area
 * between two curves rather than under one.
 */
export const c1FtcTopic: Topic = {
  id: "c1.ftc",
  name: {
    th: "ทฤษฎีบทหลักมูลของแคลคูลัส",
    en: "The fundamental theorem of calculus",
  },
  grade: { th: "แคลคูลัส 1", en: "Calculus I" },
  summary: {
    th: "ทั้งสองส่วนของทฤษฎีบทหลักมูล การหาการเปลี่ยนแปลงสุทธิจากอัตรา และพื้นที่ระหว่างเส้นโค้งสองเส้น",
    en: "Both halves of the fundamental theorem, finding a net change from a rate, and the area between two curves.",
  },
  skillIds: [
    "c1.ftc-first",
    "c1.ftc-second",
    "c1.net-change",
    "c1.area-between",
  ],
};

export const c1FtcSkills: Skill[] = [
  {
    id: "c1.ftc-first",
    topicId: "c1.ftc",
    name: {
      th: "ทฤษฎีบทหลักมูล ส่วนที่หนึ่ง",
      en: "The fundamental theorem, part one",
    },
    summary: {
      th: "อนุพันธ์ของพื้นที่สะสมคือความสูงของกราฟที่ขอบ ไม่ต้องหาปริพันธ์เลย",
      en: "The derivative of accumulated area is the height at the edge - no integrating required.",
    },
    formula: "\\dfrac{d}{dx}\\int_a^x f(t)\\,dt = f(x)",
    strictForm: null,
    prerequisites: ["c1.definite", "c1.chain-power"],
    ruleIds: ["c1.ftc-first", "c1.chain-rule"],
  },
  {
    id: "c1.ftc-second",
    topicId: "c1.ftc",
    name: {
      th: "ทฤษฎีบทหลักมูล ส่วนที่สอง",
      en: "The fundamental theorem, part two",
    },
    summary: {
      th: "พื้นที่ใต้กราฟจากปฏิยานุพันธ์ โดยไม่ต้องบวกแท่งสี่เหลี่ยมสักแท่ง",
      en: "The area under a graph from an antiderivative, without adding a single rectangle.",
    },
    formula: "\\int_a^b f = F(b) - F(a)",
    strictForm: null,
    prerequisites: ["c1.definite"],
    ruleIds: ["c1.ftc-second", "c1.definite-integral", "c1.integral-power"],
  },
  {
    id: "c1.net-change",
    topicId: "c1.ftc",
    name: {
      th: "การเปลี่ยนแปลงสุทธิจากอัตรา",
      en: "Net change from a rate",
    },
    summary: {
      th: "ปริพันธ์ของความเร็วคือการกระจัด ปริพันธ์ของอัตราการไหลคือปริมาตร",
      en: "The integral of a speed is a displacement; the integral of a flow rate is a volume.",
    },
    formula: "\\int_a^b f'(x)\\,dx = f(b) - f(a)",
    strictForm: null,
    prerequisites: ["c1.ftc-second"],
    ruleIds: ["c1.net-change", "c1.ftc-second"],
  },
  {
    id: "c1.area-between",
    topicId: "c1.ftc",
    name: {
      th: "พื้นที่ระหว่างเส้นโค้ง",
      en: "The area between curves",
    },
    summary: {
      th: "หาจุดตัดก่อน แล้วอินทิเกรตผลต่างของเส้นบนกับเส้นล่าง",
      en: "Find where they cross, then integrate the upper curve minus the lower.",
    },
    formula: "A = \\int_a^b (f - g)\\,dx",
    strictForm: null,
    prerequisites: ["c1.ftc-second", "quad.solve-by-factoring"],
    ruleIds: ["c1.area-between", "c1.ftc-second", "quad.zero-product"],
  },
];
