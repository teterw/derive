import type { Skill, Topic } from "../types";

/**
 * อัตราส่วนตรีโกณมิติ · ม.3 เทอม 2.
 *
 * Build-order item 4 (docs/CURRICULUM.md), and the first topic in the app that
 * is about a *shape*. Everything before it could be checked by substituting a
 * number; a trigonometric ratio has to be checked against a triangle, and the
 * triangle is not on the page.
 *
 * So every question here is built from a right-angled triangle whose three
 * sides are whole numbers - a Pythagorean triple - or from one of the three
 * angles whose ratios are exact. That is not a simplification of the subject:
 * it is what ม.3 asks for, and it is the only way the answer can be an exact
 * value rather than a rounded decimal.
 *
 * ## Exact values, not decimals
 *
 * `\sin 60^\circ` is `\frac{\sqrt{3}}{2}`, and `0.866` is a different number.
 * The answer checker compares to nine decimal places, so a learner who types
 * the decimal is marked wrong - which is the ม.3 convention (ตอบเป็นค่าที่
 * แน่นอน) and is worth being firm about, because the exact form is the one
 * that survives being multiplied by something else later.
 */
export const trigRatiosTopic: Topic = {
  id: "trig.ratios",
  name: {
    th: "อัตราส่วนตรีโกณมิติ",
    en: "Trigonometric ratios",
  },
  grade: { th: "ม.3 พื้นฐาน", en: "Grade 9, basic" },
  summary: {
    th: "นิยามของ sin cos tan จากสามเหลี่ยมมุมฉาก ค่าของมุมพิเศษ และการนำไปหาด้านหรือมุมที่ขาดหาย",
    en: "What sin, cos and tan mean in a right-angled triangle, the exact values at the special angles, and using them to find a missing side or angle.",
  },
  skillIds: ["trig.definition", "trig.special", "trig.solve"],
};

export const trigRatiosSkills: Skill[] = [
  {
    id: "trig.definition",
    topicId: "trig.ratios",
    name: {
      th: "นิยามอัตราส่วนตรีโกณมิติ",
      en: "What the ratios mean",
    },
    summary: {
      th: "sin คือข้ามส่วนฉาก cos คือชิดส่วนฉาก tan คือข้ามส่วนชิด ทั้งสามเป็นอัตราส่วนของด้าน",
      en: "Sine is opposite over hypotenuse, cosine adjacent over hypotenuse, tangent opposite over adjacent. All three are ratios of sides.",
    },
    formula: "\\sin A = \\dfrac{\\text{ตรงข้าม}}{\\text{ด้านตรงข้ามมุมฉาก}}",
    strictForm: null,
    prerequisites: [],
    ruleIds: ["trig.sohcahtoa", "trig.pythagoras"],
  },
  {
    id: "trig.special",
    topicId: "trig.ratios",
    name: {
      th: "อัตราส่วนตรีโกณมิติของมุมพิเศษ",
      en: "The special angles",
    },
    summary: {
      th: "มุม 30 45 และ 60 องศา มีค่าที่แน่นอน หาได้จากสามเหลี่ยมสองรูปที่ควรจำ",
      en: "Thirty, forty-five and sixty degrees have exact values, and both come from two triangles worth remembering.",
    },
    formula: "\\sin 30^\\circ = \\dfrac{1}{2}",
    strictForm: null,
    prerequisites: ["trig.definition"],
    ruleIds: ["trig.special-angles", "trig.sohcahtoa", "rad.rationalize-monomial"],
  },
  {
    id: "trig.solve",
    topicId: "trig.ratios",
    name: {
      th: "หาด้านหรือมุมที่ขาดหาย",
      en: "Finding a missing side or angle",
    },
    summary: {
      th: "รู้ด้านหนึ่งกับมุมหนึ่ง ก็หาด้านที่เหลือได้ รู้สองด้าน ก็หามุมได้",
      en: "One side and one angle give the other sides; two sides give the angle.",
    },
    formula: "\\text{ตรงข้าม} = \\text{ฉาก} \\times \\sin A",
    strictForm: null,
    prerequisites: ["trig.special", "eq.linear.solve"],
    ruleIds: ["trig.sohcahtoa", "trig.special-angles", "trig.pythagoras"],
  },
];
