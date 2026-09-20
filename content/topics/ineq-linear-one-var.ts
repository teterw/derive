import type { Skill, Topic } from "../types";

/**
 * อสมการเชิงเส้นตัวแปรเดียว · ม.3 เทอม 1.
 *
 * The last item of the algebra spine (docs/CURRICULUM.md §Build order), and a
 * chapter with exactly one idea in it: an inequality behaves like an equation
 * until you multiply or divide by a negative, at which point the sign turns
 * round. Everything else here is ม.1 again.
 *
 * ## Why the first skill is multiple choice
 *
 * An inequality's answer is `x < 5`, which is a *statement*, not a value, and
 * `lib/math/check.ts` compares expressions by evaluating them at sample
 * points. Two inequalities evaluate to booleans, and sampling cannot tell
 * `x < 5` from `x \leq 5` at all unless 5 itself happens to be sampled - so a
 * typed answer would be marked by a check that silently could not see the
 * difference between strict and non-strict, which is half of what the chapter
 * teaches.
 *
 * Four relations with the right boundary, chosen from, tests precisely the
 * thing the chapter is about and marks exactly. The arithmetic is tested by
 * the other two skills, whose answers are numbers.
 */
export const ineqLinearOneVarTopic: Topic = {
  id: "ineq.linear-one-var",
  name: {
    th: "อสมการเชิงเส้นตัวแปรเดียว",
    en: "Linear inequalities in one variable",
  },
  grade: { th: "ม.3 พื้นฐาน", en: "Grade 9, basic" },
  summary: {
    th: "แก้อสมการเชิงเส้น รู้ว่าเมื่อไรเครื่องหมายต้องกลับด้าน หาจำนวนเต็มที่สอดคล้อง และแก้โจทย์ปัญหา",
    en: "Solve linear inequalities, know when the sign turns round, find the integers that satisfy one, and use them on a word problem.",
  },
  skillIds: [
    "ineq.linear.solve",
    "ineq.linear.integers",
    "ineq.linear.word",
  ],
};

export const ineqLinearOneVarSkills: Skill[] = [
  {
    id: "ineq.linear.solve",
    topicId: "ineq.linear-one-var",
    name: {
      th: "แก้อสมการเชิงเส้นตัวแปรเดียว",
      en: "Solving a linear inequality",
    },
    summary: {
      th: "ทำเหมือนสมการทุกอย่าง ยกเว้นเมื่อคูณหรือหารด้วยจำนวนลบ ต้องกลับเครื่องหมาย",
      en: "Exactly like an equation, except that multiplying or dividing by a negative turns the sign round.",
    },
    formula: "a < b \\Rightarrow -a > -b",
    strictForm: null,
    prerequisites: ["eq.linear.solve"],
    ruleIds: [
      "ineq.flip-on-negative",
      "ineq.balance",
      "eq.move-term",
      "eq.collect-variable",
      "arith.distribute",
    ],
  },
  {
    id: "ineq.linear.integers",
    topicId: "ineq.linear-one-var",
    name: {
      th: "จำนวนเต็มที่สอดคล้องกับอสมการ",
      en: "The integers that satisfy an inequality",
    },
    summary: {
      th: "แก้อสมการก่อน แล้วอ่านค่าจำนวนเต็มที่มากที่สุดหรือน้อยที่สุดจากคำตอบ",
      en: "Solve the inequality, then read the largest or smallest whole number out of the answer.",
    },
    formula: "3x + 4 < 25 \\Rightarrow x_{\\max} = 6",
    strictForm: null,
    prerequisites: ["ineq.linear.solve"],
    ruleIds: [
      "ineq.integer-solutions",
      "ineq.flip-on-negative",
      "ineq.balance",
      "eq.move-term",
    ],
  },
  {
    id: "ineq.linear.word",
    topicId: "ineq.linear-one-var",
    name: {
      th: "โจทย์ปัญหาอสมการ",
      en: "Inequality word problems",
    },
    summary: {
      th: "คำว่า ไม่เกิน อย่างน้อย และ มากที่สุด คือสัญญาณว่าโจทย์เป็นอสมการ",
      en: "At most, at least and no more than are the words that make a problem an inequality.",
    },
    formula: "\\square \\rightarrow ax + b \\leq c",
    strictForm: null,
    prerequisites: ["ineq.linear.integers", "eq.linear.word"],
    ruleIds: [
      "model.equation",
      "ineq.integer-solutions",
      "ineq.balance",
      "eq.move-term",
      "arith.distribute",
    ],
  },
];
