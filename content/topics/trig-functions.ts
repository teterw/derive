import type { Skill, Topic } from "../types";

/**
 * ฟังก์ชันตรีโกณมิติ · ม.5.
 *
 * Build-order item 5 (docs/CURRICULUM.md). Where `trig.ratios` was about a
 * triangle, this is about a circle, and the change of picture is the content:
 * a ratio of sides cannot describe an angle of 150 degrees, and a point going
 * round a circle describes every angle there is.
 *
 * ## Radians, from here on
 *
 * Every angle in this topic is in radians. That is not a style choice - the
 * derivative of `\sin x` is `\cos x` only when x is in radians, so a chapter
 * taught in degrees would have to be untaught before calculus. It also means
 * the stems are machine-readable for the first time in trigonometry: mathjs
 * works in radians too, so `lib/math/katex.ts` can convert these and the §9
 * gate checks them like any other chapter.
 */
export const trigFunctionsTopic: Topic = {
  id: "trig.functions",
  name: {
    th: "ฟังก์ชันตรีโกณมิติ",
    en: "Trigonometric functions",
  },
  grade: { th: "ม.5 เพิ่มเติม", en: "Grade 11, advanced" },
  summary: {
    th: "ขยายนิยามของตรีโกณมิติจากสามเหลี่ยมมุมฉากไปสู่วงกลมหนึ่งหน่วย เอกลักษณ์ สมการตรีโกณมิติ และกฎของไซน์กับโคไซน์",
    en: "Trigonometry moved off the right-angled triangle and onto the unit circle: identities, trigonometric equations, and the laws of sines and cosines.",
  },
  skillIds: [
    "trig.unit-circle",
    "trig.identities",
    "trig.equations",
    "trig.laws",
  ],
};

export const trigFunctionsSkills: Skill[] = [
  {
    id: "trig.unit-circle",
    topicId: "trig.functions",
    name: {
      th: "ค่าของฟังก์ชันตรีโกณมิติของมุมใด ๆ",
      en: "Values at any angle",
    },
    summary: {
      th: "หาค่าที่แน่นอนของมุมในทุกจตุภาค ด้วยมุมอ้างอิงและเครื่องหมายประจำจตุภาค",
      en: "Exact values in every quadrant, from a reference angle and the sign that quadrant carries.",
    },
    formula: "\\sin\\dfrac{5\\pi}{6} = \\dfrac{1}{2}",
    strictForm: null,
    prerequisites: ["trig.special"],
    ruleIds: [
      "trig.unit-circle",
      "trig.quadrant-signs",
      "trig.reference-angle",
      "trig.radian-measure",
      "trig.pythagorean-identity",
    ],
  },
  {
    id: "trig.identities",
    topicId: "trig.functions",
    name: {
      th: "เอกลักษณ์ตรีโกณมิติ",
      en: "Trigonometric identities",
    },
    summary: {
      th: "จัดรูปนิพจน์ด้วยเอกลักษณ์พีทาโกรัส เอกลักษณ์ผลหาร และสูตรผลบวกของมุม",
      en: "Simplifying with the Pythagorean identity, the quotient identities and the compound angle formulae.",
    },
    formula: "\\sin^2\\theta + \\cos^2\\theta = 1",
    strictForm: null,
    prerequisites: ["trig.unit-circle"],
    ruleIds: [
      "trig.pythagorean-identity",
      "trig.quotient-identity",
      "trig.compound-angle",
      "trig.double-angle",
      "trig.quadrant-signs",
    ],
  },
  {
    id: "trig.equations",
    topicId: "trig.functions",
    name: {
      th: "สมการตรีโกณมิติ",
      en: "Trigonometric equations",
    },
    summary: {
      th: "หาทุกมุมในหนึ่งรอบที่ทำให้สมการเป็นจริง ไม่ใช่แค่มุมแรกที่นึกออก",
      en: "Finding every angle in one turn that satisfies the equation, not just the first one that comes to mind.",
    },
    formula: "\\theta = \\dfrac{\\pi}{6}, \\dfrac{5\\pi}{6}",
    strictForm: null,
    prerequisites: ["trig.unit-circle", "eq.linear.solve"],
    ruleIds: [
      "trig.general-solution",
      "trig.quadrant-signs",
      "trig.reference-angle",
      "quad.trinomial-pattern",
      "quad.zero-product",
    ],
  },
  {
    id: "trig.laws",
    topicId: "trig.functions",
    name: {
      th: "กฎของไซน์และกฎของโคไซน์",
      en: "The laws of sines and cosines",
    },
    summary: {
      th: "แก้สามเหลี่ยมที่ไม่มีมุมฉาก ด้วยกฎของไซน์เมื่อรู้คู่ด้านกับมุมตรงข้าม และกฎของโคไซน์เมื่อรู้สองด้านกับมุมระหว่างนั้น",
      en: "Solving a triangle with no right angle: the law of sines when a side and its opposite angle are known, the law of cosines when two sides and the angle between them are.",
    },
    formula: "c^2 = a^2 + b^2 - 2ab\\cos C",
    strictForm: null,
    prerequisites: ["trig.unit-circle", "trig.solve"],
    ruleIds: [
      "trig.law-of-cosines",
      "trig.law-of-sines",
      "trig.pythagoras",
      "trig.quadrant-signs",
      "trig.general-solution",
    ],
  },
];
