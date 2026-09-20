import type { Skill, Topic } from "../types";

/**
 * ความสัมพันธ์และฟังก์ชัน · ม.4 เพิ่มเติม.
 *
 * The first ม.4 topic in the app, and the one that changes what a letter
 * means. Up to here `x` has been a number waiting to be found; from here it is
 * an *input*, and `f` is a thing you do to it. Composition, inverses and
 * domains are all consequences of that one shift, and every one of them is
 * assumed without comment by the time calculus asks for `f'(g(x))`.
 *
 * Three skills, each with an answer a machine can mark: a value or an
 * expression. Domain and range as *sets* are the natural ม.4 question and are
 * deliberately not asked that way here - an interval is not something
 * `lib/math/check.ts` can compare, and a question whose marking is a string
 * match would be worse than no question. What is asked instead is the number
 * the domain turns on, which is where all the thinking is anyway.
 */
export const funcRelationsTopic: Topic = {
  id: "func.relations",
  name: {
    th: "ความสัมพันธ์และฟังก์ชัน",
    en: "Relations and functions",
  },
  grade: { th: "ม.4 เพิ่มเติม", en: "Grade 10, advanced" },
  summary: {
    th: "หาค่าฟังก์ชันและฟังก์ชันประกอบ หาฟังก์ชันผกผัน และหาค่าที่ฟังก์ชันไม่นิยาม",
    en: "Evaluate functions and composites, find inverses, and find where a function is undefined.",
  },
  skillIds: ["func.evaluate", "func.composite", "func.inverse"],
};

export const funcRelationsSkills: Skill[] = [
  {
    id: "func.evaluate",
    topicId: "func.relations",
    name: {
      th: "การหาค่าของฟังก์ชัน",
      en: "Evaluating a function",
    },
    summary: {
      th: "f(a) คือการแทน a ลงในทุกที่ที่มี x ไม่ใช่การคูณ f กับ a",
      en: "f(a) means putting a wherever x appears - it is not f times a.",
    },
    formula: "f(x) = 2x + 1 \\Rightarrow f(3) = 7",
    strictForm: null,
    prerequisites: ["eq.linear.solve"],
    ruleIds: ["func.notation", "arith.distribute"],
  },
  {
    id: "func.composite",
    topicId: "func.relations",
    name: {
      th: "ฟังก์ชันประกอบ",
      en: "Composite functions",
    },
    summary: {
      th: "f(g(x)) คือใส่ g ก่อนแล้วจึงใส่ f ลำดับสลับกันได้คนละคำตอบ",
      en: "f(g(x)) is g first and f second, and swapping the order gives a different function.",
    },
    formula: "(f \\circ g)(x) = f(g(x))",
    strictForm: null,
    prerequisites: ["func.evaluate"],
    ruleIds: ["func.composite", "func.notation", "arith.distribute"],
  },
  {
    id: "func.inverse",
    topicId: "func.relations",
    name: {
      th: "ฟังก์ชันผกผัน",
      en: "Inverse functions",
    },
    summary: {
      th: "สลับ x กับ y แล้วแก้หา y ฟังก์ชันผกผันคือการเดินย้อนกลับ",
      en: "Swap x and y and solve for y: the inverse undoes what the function did.",
    },
    formula: "f(f^{-1}(x)) = x",
    strictForm: null,
    prerequisites: ["func.evaluate", "eq.linear.solve"],
    ruleIds: ["func.inverse-swap", "func.notation", "eq.move-term"],
  },
];
