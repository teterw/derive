import type { Skill, Topic } from "../types";

export const quadraticEquationsTopic: Topic = {
  id: "quadratic-equations",
  name: {
    th: "สมการกำลังสองตัวแปรเดียว",
    en: "Quadratic equations in one variable",
  },
  grade: { th: "ม.3 พื้นฐาน", en: "Grade 9, basic" },
  summary: {
    th: "แยกตัวประกอบพหุนามดีกรีสอง แล้วแก้สมการด้วยการแยกตัวประกอบ การทำให้เป็นกำลังสองสมบูรณ์ และสูตร",
    en: "Factor quadratics, then solve by factoring, by completing the square, and by formula.",
  },
  skillIds: [
    "quad.factor-common",
    "quad.factor-trinomial",
    "quad.diff-squares",
    "quad.solve-by-factoring",
    "quad.completing-square",
    "quad.formula",
    "quad.discriminant",
    "quad.word-problems",
  ],
};

export const quadraticEquationsSkills: Skill[] = [
  {
    id: "quad.factor-common",
    topicId: "quadratic-equations",
    name: {
      th: "แยกตัวประกอบด้วยตัวประกอบร่วม",
      en: "Factoring out a common factor",
    },
    summary: {
      th: "ดึงตัวประกอบร่วมของทุกพจน์ออกมาไว้หน้าวงเล็บ",
      en: "Pull the factor shared by every term outside the bracket.",
    },
    strictForm: "factored",
    prerequisites: [],
    ruleIds: ["quad.common-factor", "arith.distribute"],
  },
  {
    id: "quad.factor-trinomial",
    topicId: "quadratic-equations",
    name: {
      th: "แยกตัวประกอบตรีนาม",
      en: "Factoring a trinomial",
    },
    summary: {
      th: "หาสองจำนวนที่คูณกันได้พจน์คงที่ และบวกกันได้สัมประสิทธิ์ของ x",
      en: "Find two numbers multiplying to the constant and adding to the middle coefficient.",
    },
    strictForm: "factored",
    prerequisites: ["quad.factor-common"],
    ruleIds: [
      "quad.trinomial-pattern",
      "quad.perfect-square-trinomial",
      "arith.distribute",
    ],
  },
  {
    id: "quad.diff-squares",
    topicId: "quadratic-equations",
    name: {
      th: "ผลต่างกำลังสอง",
      en: "Difference of squares",
    },
    summary: {
      th: "จำรูปแบบ a^2 - b^2 แล้วแยกเป็นผลต่างคูณผลบวก",
      en: "Recognise a^2 - b^2 and split it into a difference times a sum.",
    },
    strictForm: "factored",
    prerequisites: ["quad.factor-common"],
    ruleIds: ["quad.diff-squares", "quad.common-factor"],
  },
  {
    id: "quad.solve-by-factoring",
    topicId: "quadratic-equations",
    name: {
      th: "แก้สมการโดยการแยกตัวประกอบ",
      en: "Solving by factoring",
    },
    summary: {
      th: "จัดสมการให้เท่ากับศูนย์ แยกตัวประกอบ แล้วใช้สมบัติการคูณเป็นศูนย์",
      en: "Set the equation to zero, factor it, then use the zero product property.",
    },
    strictForm: null,
    prerequisites: [
      "quad.factor-trinomial",
      "quad.diff-squares",
      "quad.factor-common",
    ],
    ruleIds: [
      "eq.move-term",
      "quad.trinomial-pattern",
      "quad.common-factor",
      "quad.diff-squares",
      "quad.zero-product",
    ],
  },
  {
    id: "quad.completing-square",
    topicId: "quadratic-equations",
    name: {
      th: "การทำให้เป็นกำลังสองสมบูรณ์",
      en: "Completing the square",
    },
    summary: {
      th: "เติมกำลังสองของครึ่งหนึ่งของสัมประสิทธิ์ x แล้วถอดรากทั้งสองข้าง",
      en: "Add the square of half the middle coefficient, then take roots of both sides.",
    },
    strictForm: null,
    prerequisites: ["quad.solve-by-factoring"],
    ruleIds: [
      "quad.complete-square",
      "quad.perfect-square-trinomial",
      "quad.square-root-property",
      "eq.move-term",
      "eq.balance",
    ],
  },
  {
    id: "quad.formula",
    topicId: "quadratic-equations",
    name: {
      th: "สูตรหาคำตอบ",
      en: "The quadratic formula",
    },
    summary: {
      th: "ใช้สูตรกับสมการกำลังสองทุกแบบ รวมถึงแบบที่แยกตัวประกอบไม่ได้",
      en: "Use the formula on any quadratic, including ones that will not factor.",
    },
    strictForm: null,
    prerequisites: ["quad.completing-square"],
    ruleIds: [
      "quad.formula",
      "quad.discriminant",
      "eq.move-term",
      "rad.perfect-square-extract",
      "arith.simplify-fraction",
    ],
  },
  {
    id: "quad.discriminant",
    topicId: "quadratic-equations",
    name: {
      th: "ดิสคริมิแนนต์กับจำนวนคำตอบ",
      en: "The discriminant and the number of roots",
    },
    summary: {
      th: "ใช้ D = b^2 - 4ac บอกจำนวนคำตอบโดยไม่ต้องแก้สมการ",
      en: "Use D = b^2 - 4ac to count the roots without solving.",
    },
    strictForm: null,
    prerequisites: ["quad.formula"],
    ruleIds: ["quad.discriminant", "quad.formula"],
  },
  {
    id: "quad.word-problems",
    topicId: "quadratic-equations",
    name: {
      th: "โจทย์ปัญหาสมการกำลังสอง",
      en: "Quadratic word problems",
    },
    summary: {
      th: "ตั้งสมการจากสถานการณ์ แก้สมการ แล้วตรวจว่าคำตอบสมเหตุสมผล",
      en: "Set up the equation, solve it, then check the answer makes sense.",
    },
    strictForm: null,
    prerequisites: ["quad.solve-by-factoring"],
    ruleIds: ["eq.move-term", "quad.trinomial-pattern", "quad.zero-product"],
  },
];
