import type { Rule } from "../types";

/**
 * อสมการเชิงเส้นตัวแปรเดียว · ม.3.
 *
 * Three rules, and the first of them is the chapter. The other two say what
 * *does* carry over from equations, because a learner who has just been told
 * "inequalities are different" will start flipping the sign everywhere.
 *
 * อสมการ = inequality, กลับเครื่องหมาย = turn the sign round.
 */
const TOPIC = ["ineq.linear-one-var"];

export const inequalityRules: Rule[] = [
  {
    id: "ineq.flip-on-negative",
    topicIds: TOPIC,
    name: {
      th: "คูณหรือหารด้วยจำนวนลบ ต้องกลับเครื่องหมาย",
      en: "Multiplying or dividing by a negative turns the sign round",
    },
    statement: "a < b, \\ c < 0 \\implies ac > bc",
    conditions: { th: "เมื่อ c < 0", en: "for c < 0" },
    plain: {
      th: "คูณหรือหารอสมการทั้งสองข้างด้วยจำนวนลบ เครื่องหมายมากกว่าน้อยกว่าต้องกลับด้าน การบวกและการลบไม่ต้องกลับ",
      en: "Multiply or divide both sides of an inequality by a negative and the sign turns round. Adding and subtracting leave it alone.",
    },
    mnemonic: {
      th: "ลบเมื่อไร กลับเมื่อนั้น แต่เฉพาะคูณกับหาร",
      en: "Negative means flip - but only when multiplying or dividing.",
    },
    examples: [
      {
        from: "-2x < 6",
        to: "x > -3",
        note: {
          th: "ลองแทน x = 0 ดู: -2(0) = 0 ซึ่งน้อยกว่า 6 จริง และ 0 > -3 ก็จริง เครื่องหมายต้องกลับจึงจะเข้ากัน",
          en: "Check with x = 0: -2(0) = 0 is indeed less than 6, and 0 > -3 is true. The sign has to turn for the two to agree.",
        },
      },
      { from: "3 - x \\geq 5", to: "x \\leq -2" },
    ],
    seeAlso: ["ineq.balance", "eq.balance"],
  },
  {
    id: "ineq.balance",
    topicIds: TOPIC,
    name: {
      th: "สมบัติการบวกและการคูณของอสมการ",
      en: "Balancing an inequality",
    },
    statement: "a < b \\implies a + c < b + c",
    plain: {
      th: "บวกหรือลบจำนวนเดียวกันทั้งสองข้าง เครื่องหมายไม่เปลี่ยน คูณหรือหารด้วยจำนวนบวกก็ไม่เปลี่ยนเช่นกัน",
      en: "Adding or subtracting the same number leaves the sign as it was, and so does multiplying or dividing by a positive.",
    },
    mnemonic: {
      th: "บวกลบไม่กลับ คูณหารด้วยบวกก็ไม่กลับ",
      en: "Adding never flips; multiplying by a positive never flips either.",
    },
    examples: [
      { from: "x + 4 > 9", to: "x > 5" },
      { from: "2x \\leq 14", to: "x \\leq 7" },
    ],
    seeAlso: ["ineq.flip-on-negative", "eq.move-term"],
  },
  {
    id: "ineq.integer-solutions",
    topicIds: TOPIC,
    name: {
      th: "จำนวนเต็มที่สอดคล้องกับอสมการ",
      en: "Reading whole numbers out of a solution",
    },
    statement: "x < 6\\tfrac{1}{2} \\implies x_{\\max} = 6",
    plain: {
      th: "เมื่อแก้อสมการเสร็จ ให้ดูว่าขอบเขตรวมตัวมันเองหรือไม่ ถ้าเป็นน้อยกว่าเฉย ๆ ขอบเขตนั้นใช้ไม่ได้ ต้องถอยมาหนึ่งจำนวนเต็ม",
      en: "Once it is solved, look at whether the boundary is included. A strict sign excludes it, so the answer steps back by one whole number.",
    },
    mnemonic: {
      th: "มีขีดใต้ เอาขอบได้ ไม่มีขีด ต้องถอยหนึ่ง",
      en: "With the bar, take the boundary; without it, step back one.",
    },
    examples: [
      {
        from: "x \\leq 7",
        to: "x_{\\max} = 7",
        note: {
          th: "เครื่องหมายมีขีดใต้ ขอบเขตจึงเป็นคำตอบได้เอง",
          en: "The sign includes equality, so the boundary itself counts.",
        },
      },
      {
        from: "x < 7",
        to: "x_{\\max} = 6",
        note: {
          th: "7 ใช้ไม่ได้เพราะไม่ได้น้อยกว่าตัวมันเอง จำนวนเต็มที่มากที่สุดจึงเป็น 6",
          en: "7 is not less than itself, so the largest whole number that works is 6.",
        },
      },
    ],
    seeAlso: ["ineq.balance"],
  },
];
