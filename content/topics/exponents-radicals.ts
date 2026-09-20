import type { Skill, Topic } from "../types";

export const exponentsRadicalsTopic: Topic = {
  id: "exponents-radicals",
  name: {
    th: "เลขยกกำลังและกรณฑ์",
    en: "Exponents and radicals",
  },
  grade: { th: "ม.2 พื้นฐาน", en: "Grade 8, basic" },
  summary: {
    th: "สมบัติของเลขยกกำลัง สัญกรณ์วิทยาศาสตร์ และการจัดรูปกรณฑ์ที่สอง",
    en: "The laws of exponents, scientific notation, and simplifying square roots.",
  },
  skillIds: [
    "exp.integer-laws",
    "exp.negative-zero",
    "exp.scientific",
    "exp.rational",
    "rad.simplify",
    "rad.operations",
    "rad.rationalize",
  ],
};

export const exponentsRadicalsSkills: Skill[] = [
  {
    id: "exp.integer-laws",
    topicId: "exponents-radicals",
    name: {
      th: "สมบัติของเลขยกกำลังที่มีเลขชี้กำลังเป็นจำนวนเต็ม",
      en: "Laws of exponents with integer exponents",
    },
    summary: {
      th: "คูณ หาร และยกกำลังซ้อน โดยใช้สมบัติของเลขชี้กำลัง",
      en: "Multiply, divide and nest powers using the exponent laws.",
    },
    formula: "a^m \\cdot a^n = a^{m+n}",
    strictForm: null,
    prerequisites: [],
    ruleIds: [
      "exp.product",
      "exp.quotient",
      "exp.power-of-power",
      "exp.power-of-product",
      "exp.power-of-quotient",
    ],
  },
  {
    id: "exp.negative-zero",
    topicId: "exponents-radicals",
    name: {
      th: "เลขชี้กำลังเป็นศูนย์และจำนวนเต็มลบ",
      en: "Zero and negative integer exponents",
    },
    summary: {
      th: "เขียนเลขยกกำลังที่มีเลขชี้กำลังลบให้อยู่ในรูปเลขชี้กำลังบวก",
      en: "Rewrite negative exponents as positive ones.",
    },
    // The whole point of the skill is to end up with positive exponents.
    formula: "a^{-n} = \\dfrac{1}{a^n}",
    strictForm: "positive-exponents",
    prerequisites: ["exp.integer-laws"],
    ruleIds: [
      "exp.zero",
      "exp.negative",
      "exp.quotient",
      "exp.product",
      "exp.power-of-product",
      "exp.power-of-power",
    ],
  },
  {
    id: "exp.scientific",
    topicId: "exponents-radicals",
    name: {
      th: "สัญกรณ์วิทยาศาสตร์",
      en: "Scientific notation",
    },
    summary: {
      th: "เขียนจำนวนมากหรือน้อยมากในรูป A \\times 10^n",
      en: "Write very large or very small numbers as A \\times 10^n.",
    },
    formula: "A \\times 10^n",
    strictForm: "scientific-notation",
    prerequisites: ["exp.negative-zero"],
    ruleIds: ["exp.scientific-form", "exp.product", "exp.quotient"],
  },
  {
    id: "exp.rational",
    topicId: "exponents-radicals",
    name: {
      th: "เลขชี้กำลังที่เป็นเศษส่วน",
      en: "Rational exponents",
    },
    summary: {
      th: "กรณฑ์เขียนเป็นเลขยกกำลังได้ ตัวส่วนคืออันดับราก ตัวเศษคือกำลัง",
      en: "A root is a power: the bottom of the exponent is the order of the root, the top is the power.",
    },
    formula: "a^{m/n} = \\sqrt[n]{a^m}",
    strictForm: null,
    prerequisites: ["exp.negative-zero", "rad.simplify"],
    ruleIds: [
      "exp.rational",
      "exp.rational-power",
      "exp.power-of-power",
      // Difficulty 3 puts a minus on the exponent, so the reciprocal rule is
      // genuinely used and the registry test insists a skill lists what its
      // generators reach for.
      "exp.negative",
    ],
  },
  {
    id: "rad.simplify",
    topicId: "exponents-radicals",
    name: {
      th: "การจัดรูปกรณฑ์ที่สอง",
      en: "Simplifying square roots",
    },
    summary: {
      th: "ถอดตัวประกอบกำลังสองสมบูรณ์ออกจากตัวถูกกรณฑ์",
      en: "Pull perfect-square factors out of the radicand.",
    },
    formula: "\\sqrt{k^2m} = k\\sqrt{m}",
    strictForm: "simplified-radical",
    prerequisites: [],
    ruleIds: ["rad.perfect-square-extract", "rad.product", "rad.quotient"],
  },
  {
    id: "rad.operations",
    topicId: "exponents-radicals",
    name: {
      th: "การบวก ลบ คูณ หารกรณฑ์",
      en: "Adding, subtracting, multiplying and dividing radicals",
    },
    summary: {
      th: "รวมกรณฑ์ที่เหมือนกัน และคูณหารกรณฑ์โดยใช้สมบัติของกรณฑ์",
      en: "Combine like radicals and use the product and quotient rules.",
    },
    formula: "a\\sqrt{c} + b\\sqrt{c} = (a+b)\\sqrt{c}",
    strictForm: "simplified-radical",
    prerequisites: ["rad.simplify"],
    ruleIds: [
      "rad.like-terms",
      "rad.product",
      "rad.quotient",
      "rad.perfect-square-extract",
      "arith.combine-like-terms",
      "quad.diff-squares",
    ],
  },
  {
    id: "rad.rationalize",
    topicId: "exponents-radicals",
    name: {
      th: "การทำให้ตัวส่วนไม่ติดกรณฑ์",
      en: "Rationalising the denominator",
    },
    summary: {
      th: "กำจัดกรณฑ์ออกจากตัวส่วน ทั้งแบบพจน์เดียวและแบบใช้สังยุค",
      en: "Clear roots from the denominator, with a single term or a conjugate.",
    },
    formula: "\\dfrac{a}{\\sqrt{b}} = \\dfrac{a\\sqrt{b}}{b}",
    strictForm: "rationalized-denominator",
    prerequisites: ["rad.simplify", "rad.operations"],
    ruleIds: [
      "rad.rationalize-monomial",
      "rad.conjugate",
      "rad.product",
      "arith.simplify-fraction",
      "arith.distribute",
    ],
  },
];
