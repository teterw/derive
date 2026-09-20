import type { Rule } from "../types";
import { add, asOperator, binary, rewriteFirst } from "./misapply";

/**
 * ฟังก์ชันเอกซ์โพเนนเชียลและลอการิทึม · ม.4.
 *
 * Five rules, and four of them are exponent laws read backwards. That is worth
 * saying out loud in the teaching: a logarithm *is* an exponent, so "multiply
 * becomes add" here is the same fact as "add the exponents" in ม.2, seen from
 * the other side.
 *
 * ลอการิทึม = logarithm, ฐาน = base, เลขชี้กำลัง = exponent.
 */
const TOPIC = ["func.exp-log"];

export const logarithmRules: Rule[] = [
  {
    id: "log.definition",
    topicIds: TOPIC,
    name: {
      th: "นิยามของลอการิทึม",
      en: "The definition of a logarithm",
    },
    statement: "\\log_b x = y \\iff b^y = x",
    conditions: {
      th: "เมื่อ b > 0, b \\neq 1 และ x > 0",
      en: "for b > 0, b \\neq 1 and x > 0",
    },
    plain: {
      th: "ลอการิทึมคือคำถามว่า ฐานยกกำลังเท่าไรจึงได้จำนวนนี้ คำตอบของลอการิทึมจึงเป็นเลขชี้กำลังเสมอ",
      en: "A logarithm asks what power the base has to be raised to. Its answer is always an exponent.",
    },
    mnemonic: {
      th: "log คือการถามหาเลขชี้กำลัง",
      en: "A log is a question about an exponent.",
    },
    examples: [
      {
        from: "\\log_2 8",
        to: "3",
        note: {
          th: "เพราะ 2^3 = 8 อ่านว่า สองยกกำลังเท่าไรได้แปด",
          en: "Because 2^3 = 8: two to what power gives eight?",
        },
      },
      {
        from: "\\log_3 \\frac{1}{9}",
        to: "-2",
        note: {
          th: "เลขชี้กำลังติดลบได้ ถ้าจำนวนที่ถามน้อยกว่าหนึ่ง",
          en: "The exponent is negative when the number asked about is less than one.",
        },
      },
    ],
    seeAlso: ["log.product", "exp.negative"],
    /**
     * Reading `\log_b x` as `x / b`, which is what the layout suggests to
     * someone who has not been told what the notation means.
     */
    misapplications: [
      {
        id: "log.definition/read-as-division",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const power = asOperator(node, "^");
            if (!power) return null;
            return binary("/", power.args[0]!, power.args[1]!);
          }),
        explain: {
          th: "ลอการิทึมไม่ใช่การหาร คำตอบคือเลขชี้กำลัง ไม่ใช่ผลหารของสองจำนวน",
          en: "A logarithm is not a division. Its answer is an exponent, not one number over another.",
        },
        example: { from: "2^3", right: "8", wrong: "2/3" },
      },
    ],
  },
  {
    id: "log.product",
    topicIds: TOPIC,
    name: {
      th: "ลอการิทึมของผลคูณ",
      en: "Log of a product",
    },
    statement: "\\log_b MN = \\log_b M + \\log_b N",
    conditions: {
      th: "เมื่อ M > 0 และ N > 0",
      en: "for M > 0 and N > 0",
    },
    plain: {
      th: "ลอการิทึมเปลี่ยนการคูณเป็นการบวก เพราะลอการิทึมคือเลขชี้กำลัง และการคูณเลขยกกำลังฐานเดียวกันคือการบวกเลขชี้กำลัง",
      en: "A logarithm turns multiplying into adding - because a logarithm is an exponent, and multiplying powers of the same base adds the exponents.",
    },
    mnemonic: {
      th: "คูณข้างใน บวกข้างนอก",
      en: "Times inside, plus outside.",
    },
    examples: [
      { from: "\\log_2 4 + \\log_2 8", to: "\\log_2 32 = 5" },
      {
        from: "\\log_{10} 2 + \\log_{10} 50",
        to: "\\log_{10} 100 = 2",
        note: {
          th: "คูณข้างในได้ 100 ซึ่งเป็นกำลังของสิบพอดี",
          en: "Multiplying inside gives 100, which is a whole power of ten.",
        },
      },
    ],
    seeAlso: ["log.quotient", "log.power", "exp.product"],
    /**
     * `\log M + \log N` read as `\log(M + N)`, which is the one thing the law
     * does not say.
     */
    misapplications: [
      {
        id: "log.product/added-inside",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const product = asOperator(node, "*");
            if (!product) return null;
            return add(product.args[0]!, product.args[1]!);
          }),
        explain: {
          th: "ผลบวกของลอการิทึมคือลอการิทึมของผลคูณ ไม่ใช่ลอการิทึมของผลบวก",
          en: "A sum of logs is the log of a product, not the log of a sum.",
        },
        example: { from: "4*8", right: "32", wrong: "12" },
      },
    ],
  },
  {
    id: "log.quotient",
    topicIds: TOPIC,
    name: {
      th: "ลอการิทึมของผลหาร",
      en: "Log of a quotient",
    },
    statement: "\\log_b \\frac{M}{N} = \\log_b M - \\log_b N",
    conditions: {
      th: "เมื่อ M > 0 และ N > 0",
      en: "for M > 0 and N > 0",
    },
    plain: {
      th: "ลอการิทึมเปลี่ยนการหารเป็นการลบ ด้วยเหตุผลเดียวกับที่เปลี่ยนการคูณเป็นการบวก",
      en: "A logarithm turns dividing into subtracting, for the same reason it turns multiplying into adding.",
    },
    mnemonic: {
      th: "หารข้างใน ลบข้างนอก",
      en: "Divide inside, minus outside.",
    },
    examples: [
      { from: "\\log_3 54 - \\log_3 2", to: "\\log_3 27 = 3" },
      { from: "\\log_2 1 - \\log_2 8", to: "-3" },
    ],
    seeAlso: ["log.product", "exp.quotient"],
  },
  {
    id: "log.power",
    topicIds: TOPIC,
    name: {
      th: "ลอการิทึมของเลขยกกำลัง",
      en: "Log of a power",
    },
    statement: "\\log_b M^k = k \\log_b M",
    plain: {
      th: "เลขชี้กำลังที่อยู่ข้างในลอการิทึม ย้ายออกมาคูณข้างหน้าได้",
      en: "An exponent inside a logarithm comes out as a multiplier in front of it.",
    },
    mnemonic: {
      th: "กำลังข้างใน ลงมาคูณข้างหน้า",
      en: "The power comes down and multiplies.",
    },
    examples: [
      { from: "\\log_2 8^2", to: "2\\log_2 8 = 6" },
      {
        from: "3\\log_5 5",
        to: "\\log_5 5^3 = 3",
        note: {
          th: "ใช้ได้ทั้งสองทาง จะย้ายออกมาหรือย้ายกลับเข้าไปก็ได้",
          en: "It works both ways: the multiplier can go back in as an exponent.",
        },
      },
    ],
    seeAlso: ["log.product", "exp.power-of-power"],
    /**
     * `k \log M` read as `(\log M)^k`. The exponent belongs to what is inside
     * the logarithm, never to the logarithm itself.
     */
    misapplications: [
      {
        id: "log.power/raised-the-log",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const product = asOperator(node, "*");
            if (!product) return null;
            return binary("^", product.args[1]!, product.args[0]!);
          }),
        explain: {
          th: "เลขชี้กำลังเป็นของจำนวนที่อยู่ข้างในลอการิทึม ไม่ใช่ของตัวลอการิทึมเอง",
          en: "The exponent belongs to the number inside the logarithm, not to the logarithm itself.",
        },
        example: { from: "2*3", right: "6", wrong: "3^2" },
      },
    ],
  },
  {
    id: "exp.same-base",
    topicIds: TOPIC,
    name: {
      th: "การเทียบเลขชี้กำลังเมื่อฐานเท่ากัน",
      en: "Equal bases, equal exponents",
    },
    statement: "b^m = b^n \\iff m = n",
    conditions: {
      th: "เมื่อ b > 0 และ b \\neq 1",
      en: "for b > 0 and b \\neq 1",
    },
    plain: {
      th: "ถ้าทำสองข้างให้เป็นฐานเดียวกันได้ ก็เทียบเลขชี้กำลังกันตรง ๆ แล้วแก้สมการที่เหลือตามปกติ",
      en: "Once both sides are the same base, the exponents can be set equal and whatever is left is an ordinary equation.",
    },
    mnemonic: {
      th: "ฐานเท่ากันเมื่อไร เทียบกำลังได้เมื่อนั้น",
      en: "Same base, same exponent.",
    },
    examples: [
      {
        from: "2^x = 32",
        to: "x = 5",
        note: {
          th: "เขียน 32 เป็น 2^5 ก่อน แล้วจึงเทียบเลขชี้กำลัง",
          en: "Write 32 as 2^5 first, then compare the exponents.",
        },
      },
      { from: "5^{x+1} = 125^{x-1}", to: "x + 1 = 3(x - 1)" },
    ],
    seeAlso: ["log.definition", "exp.power-of-power"],
  },
];
