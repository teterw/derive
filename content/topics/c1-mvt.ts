import type { Skill, Topic } from "../types";

/**
 * ทฤษฎีบทค่าเฉลี่ย · Calculus I.
 *
 * A short chapter and a pivotal one. It is the first result in the course that
 * asserts something *exists* without showing how to find it, and nearly
 * everything afterwards - that a zero derivative means a constant function,
 * that two antiderivatives differ by a constant, that the fundamental theorem
 * is true - rests on it.
 *
 * Three skills rather than four: the theorem, the special case it is usually
 * proved from, and what it is actually used for. Padding it to four would mean
 * inventing a distinction the mathematics does not have.
 */
export const c1MvtTopic: Topic = {
  id: "c1.mvt",
  name: {
    th: "ทฤษฎีบทค่าเฉลี่ย",
    en: "The mean value theorem",
  },
  grade: { th: "แคลคูลัส 1", en: "Calculus I" },
  summary: {
    th: "ทฤษฎีบทของโรล ทฤษฎีบทค่าเฉลี่ย และการใช้มันประมาณค่าการเปลี่ยนแปลงของฟังก์ชัน",
    en: "Rolle's theorem, the mean value theorem, and using it to bound how much a function can change.",
  },
  skillIds: ["c1.rolle", "c1.mean-value", "c1.mvt-bound"],
};

export const c1MvtSkills: Skill[] = [
  {
    id: "c1.rolle",
    topicId: "c1.mvt",
    name: {
      th: "ทฤษฎีบทของโรล",
      en: "Rolle's theorem",
    },
    summary: {
      th: "ถ้าปลายทั้งสองของช่วงมีค่าเท่ากัน ต้องมีจุดหนึ่งที่ความชันเป็นศูนย์",
      en: "If the two ends of an interval are at the same height, somewhere between them the slope is zero.",
    },
    formula: "f(a) = f(b) \\Rightarrow f'(c) = 0",
    strictForm: null,
    prerequisites: ["c1.extrema"],
    ruleIds: ["c1.rolle", "calc.critical-point"],
  },
  {
    id: "c1.mean-value",
    topicId: "c1.mvt",
    name: {
      th: "ทฤษฎีบทค่าเฉลี่ย",
      en: "The mean value theorem",
    },
    summary: {
      th: "ความชันเฉลี่ยตลอดช่วงต้องเกิดขึ้นจริงที่จุดใดจุดหนึ่งภายในช่วง",
      en: "The average slope across an interval is achieved exactly, at some point inside it.",
    },
    formula: "f'(c) = \\dfrac{f(b) - f(a)}{b - a}",
    strictForm: null,
    prerequisites: ["c1.rolle"],
    ruleIds: ["c1.mean-value", "c1.rolle", "calc.tangent-slope"],
  },
  {
    id: "c1.mvt-bound",
    topicId: "c1.mvt",
    name: {
      th: "การประมาณค่าด้วยทฤษฎีบทค่าเฉลี่ย",
      en: "Bounding a change",
    },
    summary: {
      th: "รู้แค่ว่าอัตราการเปลี่ยนแปลงไม่เกินเท่าใด ก็บอกได้ว่าค่าของฟังก์ชันเปลี่ยนไปได้มากที่สุดเท่าใด",
      en: "Knowing only a bound on the rate is enough to bound how far the quantity can have moved.",
    },
    formula: "|f(b) - f(a)| \\le M(b - a)",
    strictForm: null,
    prerequisites: ["c1.mean-value"],
    ruleIds: ["c1.mvt-consequence", "c1.mean-value"],
  },
];
