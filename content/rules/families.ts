import type { L, Rule, RuleId } from "../types";

/**
 * The formula sheet, grouped by what a rule *does* rather than by which
 * chapter happens to use it.
 *
 * `/rules` grouped by topic, which had two problems. A rule used by three
 * chapters appeared three times - 115 rules made 171 cards - and the grouping
 * answered "where would I meet this?" when the question a formula sheet is
 * opened with is "what does this kind of thing do?". Every rule about roots in
 * one place, every rule about powers in another, is the shape a reference
 * wants.
 *
 * The families are read off the rule ids, which already carry them: `rad.*`
 * is root behaviour, `exp.*` is power behaviour, and so on. That is not a
 * coincidence to be relied on quietly, so `families.test.ts` checks every rule
 * lands in exactly one.
 *
 * Order is roughly the curriculum's, so a learner scanning down meets them in
 * the order they were taught.
 */
export const RULE_FAMILIES: { prefix: string; name: L; blurb: L }[] = [
  {
    prefix: "arith",
    name: { th: "เลขคณิตและพีชคณิตพื้นฐาน", en: "Arithmetic and basic algebra" },
    blurb: {
      th: "กฎที่ใช้ได้ทุกที่ ตั้งแต่การกระจายวงเล็บไปจนถึงการย้ายข้าง",
      en: "The rules that apply everywhere, from expanding a bracket to moving a term across.",
    },
  },
  {
    prefix: "eq",
    name: { th: "สมการเชิงเส้น", en: "Linear equations" },
    blurb: {
      th: "การทำสิ่งเดียวกันทั้งสองข้างจนเหลือตัวแปรอยู่ตัวเดียว",
      en: "Doing the same thing to both sides until the unknown stands alone.",
    },
  },
  {
    prefix: "ineq",
    name: { th: "อสมการ", en: "Inequalities" },
    blurb: {
      th: "เหมือนสมการ ยกเว้นตอนคูณหรือหารด้วยจำนวนลบ",
      en: "Like equations, except when multiplying or dividing by a negative.",
    },
  },
  {
    prefix: "exp",
    name: { th: "พฤติกรรมของเลขยกกำลัง", en: "How powers behave" },
    blurb: {
      th: "คูณแล้วบวกเลขชี้กำลัง หารแล้วลบ และเลขชี้กำลังที่เป็นศูนย์ ติดลบ หรือเศษส่วน",
      en: "Multiply and add the exponents, divide and subtract them, and what zero, negative and fractional exponents mean.",
    },
  },
  {
    prefix: "rad",
    name: { th: "พฤติกรรมของกรณฑ์", en: "How roots behave" },
    blurb: {
      th: "การถอดตัวประกอบออกจากราก การบวกลบกรณฑ์ และการทำให้ตัวส่วนไม่ติดกรณฑ์",
      en: "Pulling factors out of a root, adding roots, and clearing a root from a denominator.",
    },
  },
  {
    prefix: "quad",
    name: { th: "สมการกำลังสอง", en: "Quadratics" },
    blurb: {
      th: "การแยกตัวประกอบ การทำให้เป็นกำลังสองสมบูรณ์ สูตร และดิสคริมิแนนต์",
      en: "Factorising, completing the square, the formula, and the discriminant.",
    },
  },
  {
    prefix: "poly",
    name: { th: "พหุนาม", en: "Polynomials" },
    blurb: {
      th: "การแยกตัวประกอบของพหุนามดีกรีสูงกว่าสอง",
      en: "Factorising beyond degree two.",
    },
  },
  {
    prefix: "func",
    name: { th: "ฟังก์ชัน", en: "Functions" },
    blurb: {
      th: "สัญกรณ์ กราฟ ฟังก์ชันประกอบ และฟังก์ชันผกผัน",
      en: "Notation, graphs, composing functions and inverting them.",
    },
  },
  {
    prefix: "log",
    name: { th: "ลอการิทึม", en: "Logarithms" },
    blurb: {
      th: "เลขยกกำลังกลับทาง และกฎที่เปลี่ยนคูณเป็นบวก",
      en: "Powers read backwards, and the rules that turn multiplying into adding.",
    },
  },
  {
    prefix: "trig",
    name: { th: "ตรีโกณมิติ", en: "Trigonometry" },
    blurb: {
      th: "อัตราส่วนในสามเหลี่ยมมุมฉาก วงกลมหนึ่งหน่วย เอกลักษณ์ และกฎของไซน์โคไซน์",
      en: "Ratios in a right triangle, the unit circle, the identities, and the sine and cosine laws.",
    },
  },
  {
    prefix: "seq",
    name: { th: "ลำดับ", en: "Sequences" },
    blurb: {
      th: "พจน์ทั่วไปของลำดับเลขคณิตและเรขาคณิต",
      en: "The nth term of an arithmetic or geometric sequence.",
    },
  },
  {
    prefix: "series",
    name: { th: "อนุกรม", en: "Series" },
    blurb: {
      th: "ผลบวกของลำดับ ทั้งแบบจำกัดและอนันต์",
      en: "Adding a sequence up, finitely and infinitely.",
    },
  },
  {
    prefix: "calc",
    name: { th: "แคลคูลัสเบื้องต้น", en: "Introductory calculus" },
    blurb: {
      th: "ลิมิต อนุพันธ์ และปฏิยานุพันธ์ อย่างที่ ม.6 สอน",
      en: "Limits, derivatives and antiderivatives as ม.6 teaches them.",
    },
  },
  {
    prefix: "c1",
    name: { th: "แคลคูลัส 1", en: "Calculus I" },
    blurb: {
      th: "กฎลูกโซ่ การประยุกต์ ทฤษฎีบทค่าเฉลี่ย ปริพันธ์ และทฤษฎีบทหลักมูล",
      en: "The chain rule, applications, the mean value theorem, integrals and the fundamental theorem.",
    },
  },
  {
    prefix: "model",
    name: { th: "การตั้งสมการจากโจทย์", en: "Turning words into equations" },
    blurb: {
      th: "การอ่านโจทย์ปัญหาแล้วเขียนเป็นสมการ และการทิ้งคำตอบที่เป็นไปไม่ได้",
      en: "Reading a situation into an equation, and throwing away the root that cannot happen.",
    },
  },
];

/** The family a rule id belongs to, by its prefix. `null` if none claims it. */
export function familyOf(id: RuleId): string | null {
  const prefix = id.split(".")[0] ?? "";
  return RULE_FAMILIES.some((family) => family.prefix === prefix)
    ? prefix
    : null;
}

/** Rules grouped into families, in family order, empty families dropped. */
export function groupByFamily<T extends Pick<Rule, "id">>(
  rules: T[],
): { family: (typeof RULE_FAMILIES)[number]; rules: T[] }[] {
  return RULE_FAMILIES.map((family) => ({
    family,
    rules: rules.filter((rule) => familyOf(rule.id) === family.prefix),
  })).filter((group) => group.rules.length > 0);
}
