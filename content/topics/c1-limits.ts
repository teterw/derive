import type { Skill, Topic } from "../types";

/**
 * ลิมิตและความต่อเนื่อง · Calculus I.
 *
 * The first university chapter, and the first that treats a limit as an object
 * of study rather than a tool. ม.6 asked what a function approaches when
 * substitution fails; this asks what happens when the two sides disagree, what
 * happens as x runs off to infinity, and what "continuous" actually requires -
 * three questions the school chapter never has to face.
 *
 * Every question here is still checked by measuring rather than by re-deriving:
 * `c1-limits.test.ts` evaluates the functions close to the point, far out
 * along the axis, and on both sides of a join.
 */
export const c1LimitsTopic: Topic = {
  id: "c1.limits",
  name: {
    th: "ลิมิตและความต่อเนื่อง",
    en: "Limits and continuity",
  },
  grade: { th: "แคลคูลัส 1", en: "Calculus I" },
  summary: {
    th: "ลิมิตซ้ายขวา ลิมิตที่อนันต์และเส้นกำกับ ความต่อเนื่อง และลิมิตตรีโกณมิติพื้นฐาน",
    en: "One-sided limits, limits at infinity and asymptotes, continuity, and the fundamental trigonometric limit.",
  },
  skillIds: [
    "c1.one-sided",
    "c1.infinity",
    "c1.continuity",
    "c1.trig-limit",
  ],
};

export const c1LimitsSkills: Skill[] = [
  {
    id: "c1.one-sided",
    topicId: "c1.limits",
    name: {
      th: "ลิมิตซ้ายและลิมิตขวา",
      en: "One-sided limits",
    },
    summary: {
      th: "ฟังก์ชันที่นิยามเป็นช่วง ๆ และการดูว่าสองข้างของรอยต่อตรงกันหรือไม่",
      en: "Functions defined in pieces, and whether the two sides of a join agree.",
    },
    formula: "\\lim_{x \\to a^-} f(x)",
    strictForm: null,
    prerequisites: ["calc.limit"],
    ruleIds: ["c1.one-sided", "c1.continuity", "calc.limit-substitution"],
  },
  {
    id: "c1.infinity",
    topicId: "c1.limits",
    name: {
      th: "ลิมิตที่อนันต์และเส้นกำกับ",
      en: "Limits at infinity and asymptotes",
    },
    summary: {
      th: "พฤติกรรมของฟังก์ชันตรรกยะเมื่อ x ใหญ่ขึ้นเรื่อย ๆ และตำแหน่งของเส้นกำกับ",
      en: "What a rational function does far out, and where its asymptotes are.",
    },
    formula: "\\lim_{x \\to \\infty}\\dfrac{1}{x^n} = 0",
    strictForm: null,
    prerequisites: ["calc.limit", "func.quad.intercepts"],
    ruleIds: ["c1.limit-at-infinity", "c1.asymptote"],
  },
  {
    id: "c1.continuity",
    topicId: "c1.limits",
    name: {
      th: "ความต่อเนื่อง",
      en: "Continuity",
    },
    summary: {
      th: "เงื่อนไขสามข้อของความต่อเนื่อง และการเลือกค่าคงตัวที่ทำให้กราฟไม่ขาด",
      en: "The three conditions for continuity, and choosing a constant that closes a gap.",
    },
    formula: "\\lim_{x \\to a} f(x) = f(a)",
    strictForm: null,
    prerequisites: ["c1.one-sided", "eq.linear.solve"],
    ruleIds: [
      "c1.continuity",
      "c1.one-sided",
      "calc.limit-factor-cancel",
      "calc.limit-substitution",
      "eq.balance",
    ],
  },
  {
    id: "c1.trig-limit",
    topicId: "c1.limits",
    name: {
      th: "ลิมิตตรีโกณมิติ",
      en: "Trigonometric limits",
    },
    summary: {
      th: "ลิมิตที่ศูนย์ของ sin x ส่วน x และรูปแบบที่ต่อยอดจากมัน",
      en: "The limit of sine over its angle at zero, and everything built on it.",
    },
    formula: "\\lim_{x \\to 0}\\dfrac{\\sin x}{x} = 1",
    strictForm: null,
    prerequisites: ["calc.limit", "trig.unit-circle"],
    ruleIds: ["c1.trig-limit", "calc.limit-substitution"],
  },
];
