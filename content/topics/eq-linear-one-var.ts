import type { Skill, Topic } from "../types";

/**
 * สมการเชิงเส้นตัวแปรเดียว · ม.1 เทอม 2.
 *
 * The third item in the build order (docs/CURRICULUM.md §Build order) and the
 * earliest school topic the app carries. Everything above it - quadratics,
 * factoring, and eventually every equation calculus ever asks you to solve -
 * ends with a linear equation, so this is where the habit of *keeping the
 * equation balanced* is either formed or missed.
 *
 * Three skills: solving one, solving one with fractions in it, and setting one
 * up from a sentence. The last of those is the one ม.1 exams actually test.
 */
export const eqLinearOneVarTopic: Topic = {
  id: "eq.linear-one-var",
  name: {
    th: "สมการเชิงเส้นตัวแปรเดียว",
    en: "Linear equations in one variable",
  },
  grade: { th: "ม.1 พื้นฐาน", en: "Grade 7, basic" },
  summary: {
    th: "แก้สมการเชิงเส้นด้วยการย้ายข้างและทำทั้งสองข้างเท่ากัน รวมถึงสมการที่มีเศษส่วนและโจทย์ปัญหา",
    en: "Solve linear equations by balancing and moving terms, including ones with fractions, and set them up from a word problem.",
  },
  skillIds: ["eq.linear.solve", "eq.linear.fractions", "eq.linear.word"],
};

export const eqLinearOneVarSkills: Skill[] = [
  {
    id: "eq.linear.solve",
    topicId: "eq.linear-one-var",
    name: {
      th: "แก้สมการเชิงเส้นตัวแปรเดียว",
      en: "Solving a linear equation",
    },
    summary: {
      th: "ย้ายพจน์จนตัวแปรอยู่ข้างเดียว แล้วหารด้วยสัมประสิทธิ์",
      en: "Move terms until the variable is alone, then divide by its coefficient.",
    },
    formula: "ax + b = c \\Rightarrow x = \\dfrac{c - b}{a}",
    strictForm: null,
    prerequisites: [],
    ruleIds: [
      "eq.balance",
      "eq.move-term",
      "eq.collect-variable",
      "arith.distribute",
      "arith.combine-like-terms",
    ],
  },
  {
    id: "eq.linear.fractions",
    topicId: "eq.linear-one-var",
    name: {
      th: "สมการที่มีเศษส่วน",
      en: "Equations with fractions",
    },
    summary: {
      th: "คูณทั้งสองข้างด้วยตัวส่วนร่วม ให้เศษส่วนหายไปก่อน แล้วแก้ตามปกติ",
      en: "Multiply both sides by the common denominator to clear the fractions, then solve as usual.",
    },
    formula: "\\dfrac{A}{m} = \\dfrac{B}{n} \\Rightarrow nA = mB",
    strictForm: null,
    prerequisites: ["eq.linear.solve"],
    ruleIds: [
      "eq.clear-fractions",
      "eq.balance",
      "eq.move-term",
      "eq.collect-variable",
      "arith.distribute",
    ],
  },
  {
    id: "eq.linear.word",
    topicId: "eq.linear-one-var",
    name: {
      th: "โจทย์ปัญหาสมการเชิงเส้น",
      en: "Linear word problems",
    },
    summary: {
      th: "ตั้งตัวแปรแทนสิ่งที่โจทย์ถาม เขียนเงื่อนไขเป็นสมการ แล้วแก้",
      en: "Name the unknown, write the condition as an equation, then solve it.",
    },
    formula: "\\text{โจทย์} \\rightarrow ax + b = c",
    strictForm: null,
    prerequisites: ["eq.linear.solve"],
    ruleIds: [
      "model.equation",
      "eq.move-term",
      "eq.collect-variable",
      "eq.balance",
      "arith.distribute",
    ],
  },
];
