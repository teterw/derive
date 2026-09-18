import type { Difficulty, GeneratorId, L, RuleId, SkillId } from "../types";

/**
 * Teaching content for Learn mode.
 *
 * A lesson does **not** hand-write its worked examples. It points at
 * `(generatorId, seed, difficulty)` triples, so every example on a lesson page
 * is a real generated question whose steps have already been through the §9
 * property gate. A lesson can therefore never quietly teach a wrong rule.
 */
export type WorkedExample = {
  generatorId: GeneratorId;
  seed: number;
  difficulty: Difficulty;
  /** Optional line framing why this example is here. */
  note?: L;
};

export type Lesson = {
  skillId: SkillId;
  title: L;
  /** Two or three sentences: what this is and why it matters. */
  intro: L;
  /** The one thing to remember. */
  bigIdea: L;
  ruleIds: RuleId[];
  examples: WorkedExample[];
  /** Mistakes that actually happen, in the learner's own terms. */
  pitfalls: L[];
  /** A few questions to try straight after reading. */
  practice: WorkedExample[];
};

const lessonList: Lesson[] = [
  {
    skillId: "exp.integer-laws",
    title: {
      th: "สมบัติของเลขยกกำลัง",
      en: "The laws of exponents",
    },
    intro: {
      th: "เลขยกกำลังคือการเขียนการคูณซ้ำ ๆ ให้สั้นลง สมบัติทั้งสี่ข้อในบทนี้ไม่ใช่กฎที่ต้องท่อง แต่เป็นผลที่ตามมาจากความหมายนั้นโดยตรง",
      en: "A power is shorthand for repeated multiplication. The four laws here are not rules to memorise - they follow directly from what a power means.",
    },
    bigIdea: {
      th: "ฐานเดียวกันเท่านั้นจึงจะรวมกันได้ คูณให้บวกเลขชี้กำลัง หารให้ลบ ยกกำลังซ้อนให้คูณ",
      en: "Only the same base combines: multiplying adds exponents, dividing subtracts, nesting multiplies.",
    },
    ruleIds: [
      "exp.product",
      "exp.quotient",
      "exp.power-of-power",
      "exp.power-of-product",
    ],
    examples: [
      {
        generatorId: "exp.laws-core",
        seed: 3,
        difficulty: 1,
        note: {
          th: "เขียน x^4 \\cdot x^2 ออกเป็นการคูณเต็ม ๆ แล้วนับจำนวน x ดูก็ได้คำตอบเดียวกัน",
          en: "Write it out in full and count the x's - you get the same answer.",
        },
      },
      { generatorId: "exp.laws-core", seed: 11, difficulty: 2 },
      { generatorId: "exp.laws-core", seed: 21, difficulty: 3 },
    ],
    pitfalls: [
      {
        th: "x^3 \\cdot x^4 ไม่ใช่ x^{12} - การคูณเลขยกกำลังคือการบวกเลขชี้กำลัง ไม่ใช่คูณ",
        en: "x^3 \\cdot x^4 is not x^{12}: multiplying powers adds the exponents.",
      },
      {
        th: "\\left(2x\\right)^3 ไม่ใช่ 2x^3 - เลขสัมประสิทธิ์ก็ต้องถูกยกกำลังด้วย",
        en: "\\left(2x\\right)^3 is not 2x^3: the coefficient gets raised too.",
      },
      {
        th: "x^2 + x^3 รวมกันไม่ได้ สมบัติเหล่านี้ใช้กับการคูณและการหารเท่านั้น",
        en: "x^2 + x^3 does not combine: these laws are about multiplying and dividing, not adding.",
      },
    ],
    practice: [
      { generatorId: "exp.laws-core", seed: 101, difficulty: 1 },
      { generatorId: "exp.laws-core", seed: 102, difficulty: 2 },
      { generatorId: "exp.laws-core", seed: 103, difficulty: 2 },
    ],
  },

  {
    skillId: "exp.negative-zero",
    title: {
      th: "เลขชี้กำลังเป็นศูนย์และจำนวนเต็มลบ",
      en: "Zero and negative exponents",
    },
    intro: {
      th: "ทำไม a^0 ถึงเท่ากับ 1 และทำไมเลขชี้กำลังลบถึงกลายเป็นเศษส่วน คำตอบมาจากสมบัติการหารที่เพิ่งเรียนไป ไม่ใช่ข้อตกลงลอย ๆ",
      en: "Why is a^0 equal to 1, and why does a negative exponent become a fraction? Both follow from the quotient rule, not from an arbitrary convention.",
    },
    bigIdea: {
      th: "เลขชี้กำลังลบบอกตำแหน่ง ไม่ได้บอกเครื่องหมาย - a^{-n} คือ \\frac{1}{a^n} ไม่ใช่จำนวนลบ",
      en: "A negative exponent means position, not sign: a^{-n} is \\frac{1}{a^n}, never a negative number.",
    },
    ruleIds: ["exp.zero", "exp.negative", "exp.quotient"],
    examples: [
      {
        generatorId: "exp.zero-negative",
        seed: 2,
        difficulty: 1,
        note: {
          th: "\\frac{a^3}{a^3} เท่ากับ 1 อยู่แล้ว และตามสมบัติการหารก็ได้ a^0 ทั้งสองทางต้องตรงกัน",
          en: "\\frac{a^3}{a^3} is 1, and the quotient rule makes it a^0. Both have to agree.",
        },
      },
      { generatorId: "exp.zero-negative", seed: 7, difficulty: 2 },
      { generatorId: "exp.zero-negative", seed: 13, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "2^{-3} ไม่ใช่ -8 แต่เป็น \\frac{1}{8}",
        en: "2^{-3} is not -8; it is \\frac{1}{8}.",
      },
      {
        th: "ใน 3x^{-2} เลขชี้กำลังลบอยู่กับ x เท่านั้น เลข 3 ไม่ได้ลงไปอยู่ตัวส่วน",
        en: "In 3x^{-2} only the x moves down; the 3 stays on top.",
      },
      {
        th: "0^0 ไม่นิยาม สมบัติ a^0 = 1 ใช้เมื่อ a \\neq 0",
        en: "0^0 is undefined: a^0 = 1 needs a \\neq 0.",
      },
    ],
    practice: [
      { generatorId: "exp.zero-negative", seed: 201, difficulty: 1 },
      { generatorId: "exp.zero-negative", seed: 202, difficulty: 2 },
      { generatorId: "exp.zero-negative", seed: 203, difficulty: 3 },
    ],
  },

  {
    skillId: "exp.scientific",
    title: { th: "สัญกรณ์วิทยาศาสตร์", en: "Scientific notation" },
    intro: {
      th: "ระยะทางจากโลกถึงดวงอาทิตย์ประมาณ 150,000,000 กิโลเมตร และขนาดของไวรัสประมาณ 0.0000001 เมตร สัญกรณ์วิทยาศาสตร์ทำให้เขียนและเปรียบเทียบจำนวนแบบนี้ได้ง่ายขึ้นมาก",
      en: "The Earth is about 150,000,000 km from the Sun; a virus is about 0.0000001 m across. Scientific notation makes numbers like these writable and comparable.",
    },
    bigIdea: {
      th: "เขียนเป็น A \\times 10^n โดย A มีหลักเดียวหน้าจุดทศนิยม และ 1 \\leq |A| < 10 เสมอ",
      en: "Write it as A \\times 10^n with exactly one non-zero digit before the point, so 1 \\leq |A| < 10.",
    },
    ruleIds: ["exp.scientific-form", "exp.product", "exp.quotient"],
    examples: [
      { generatorId: "exp.scientific-notation", seed: 5, difficulty: 1 },
      {
        generatorId: "exp.scientific-notation",
        seed: 9,
        difficulty: 2,
        note: {
          th: "จำนวนที่น้อยกว่า 1 จะได้เลขชี้กำลังติดลบเสมอ",
          en: "A number smaller than 1 always gets a negative exponent.",
        },
      },
      { generatorId: "exp.scientific-notation", seed: 17, difficulty: 3 },
    ],
    pitfalls: [
      {
        th: "43 \\times 10^{3} ยังไม่ใช่สัญกรณ์วิทยาศาสตร์ เพราะ 43 ไม่ได้อยู่ระหว่าง 1 ถึง 10",
        en: "43 \\times 10^{3} is not scientific notation: 43 is not between 1 and 10.",
      },
      {
        th: "จำนวนลบยังเขียนได้ เช่น -2.5 \\times 10^{4} เงื่อนไขคุมเฉพาะขนาดของ A",
        en: "Negative numbers are fine: -2.5 \\times 10^{4}. The condition is on the size of A.",
      },
      {
        th: "เวลาคูณกัน อย่าลืมตรวจว่าตัวเลขหน้ายังอยู่ระหว่าง 1 ถึง 10 หรือไม่",
        en: "After multiplying, check whether the mantissa is still between 1 and 10.",
      },
    ],
    practice: [
      { generatorId: "exp.scientific-notation", seed: 301, difficulty: 1 },
      { generatorId: "exp.scientific-notation", seed: 302, difficulty: 2 },
      { generatorId: "exp.scientific-notation", seed: 303, difficulty: 3 },
    ],
  },

  {
    skillId: "rad.simplify",
    title: { th: "การจัดรูปกรณฑ์ที่สอง", en: "Simplifying square roots" },
    intro: {
      th: "\\sqrt{72} กับ 6\\sqrt{2} เป็นจำนวนเดียวกัน แต่รูปหลังบอกขนาดได้ทันที และนำไปบวกลบกับกรณฑ์อื่นได้ การจัดรูปจึงไม่ใช่พิธีกรรม แต่ทำให้ทำงานต่อได้",
      en: "\\sqrt{72} and 6\\sqrt{2} are the same number, but the second one tells you its size at a glance and can be combined with other radicals. Simplifying is not a ritual - it is what lets you carry on.",
    },
    bigIdea: {
      th: "มองหาตัวประกอบที่เป็นกำลังสองสมบูรณ์ในตัวถูกกรณฑ์ แล้วถอดรากของตัวนั้นออกมานอกเครื่องหมาย",
      en: "Find a perfect-square factor inside the root and take its root outside.",
    },
    ruleIds: ["rad.perfect-square-extract", "rad.product", "rad.quotient"],
    examples: [
      { generatorId: "rad.simplify-sqrt", seed: 4, difficulty: 1 },
      { generatorId: "rad.simplify-sqrt", seed: 8, difficulty: 2 },
      {
        generatorId: "rad.simplify-sqrt",
        seed: 16,
        difficulty: 3,
        note: {
          th: "คูณตัวถูกกรณฑ์เข้าด้วยกันก่อน มักจะเห็นกำลังสองสมบูรณ์ที่แยกกันมองไม่เห็น",
          en: "Multiply the radicands first - a perfect square often appears that neither factor showed on its own.",
        },
      },
    ],
    pitfalls: [
      {
        th: "\\sqrt{a + b} ไม่เท่ากับ \\sqrt{a} + \\sqrt{b} ลองแทน a = 9, b = 16 ดู",
        en: "\\sqrt{a + b} is not \\sqrt{a} + \\sqrt{b}. Try a = 9 and b = 16.",
      },
      {
        th: "ถอดออกมาแล้วต้องตรวจว่าตัวที่เหลือยังหารด้วยกำลังสองสมบูรณ์ได้อีกหรือไม่",
        en: "After taking one square out, check whether another one is still hiding.",
      },
    ],
    practice: [
      { generatorId: "rad.simplify-sqrt", seed: 401, difficulty: 1 },
      { generatorId: "rad.simplify-sqrt", seed: 402, difficulty: 2 },
      { generatorId: "rad.simplify-sqrt", seed: 403, difficulty: 3 },
    ],
  },

  {
    skillId: "rad.operations",
    title: {
      th: "การบวก ลบ คูณ หารกรณฑ์",
      en: "Arithmetic with radicals",
    },
    intro: {
      th: "กรณฑ์บวกลบกันได้เหมือนพจน์คล้าย คือต้องมีตัวถูกกรณฑ์เหมือนกันก่อน ส่วนการคูณและการหารทำได้เสมอ เพราะกรณฑ์คูณกันก็คือคูณตัวถูกกรณฑ์",
      en: "Radicals add like like terms: the radicands have to match first. Multiplying and dividing always work, because the radicands just multiply or divide.",
    },
    bigIdea: {
      th: "จัดรูปให้เรียบร้อยก่อนเสมอ แล้วค่อยดูว่าตัวถูกกรณฑ์เหมือนกันหรือไม่",
      en: "Simplify everything first, then check whether the radicands match.",
    },
    ruleIds: ["rad.like-terms", "rad.product", "rad.perfect-square-extract"],
    examples: [
      { generatorId: "rad.operations-core", seed: 6, difficulty: 1 },
      {
        generatorId: "rad.operations-core",
        seed: 12,
        difficulty: 2,
        note: {
          th: "ตอนแรกดูเหมือนบวกกันไม่ได้ แต่พอจัดรูปแล้วตัวถูกกรณฑ์ตรงกันพอดี",
          en: "They look incompatible until each one is simplified.",
        },
      },
      { generatorId: "rad.operations-core", seed: 20, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "3\\sqrt{2} + 4\\sqrt{3} รวมกันไม่ได้ ตัวถูกกรณฑ์ไม่เหมือนกัน",
        en: "3\\sqrt{2} + 4\\sqrt{3} does not combine: different radicands.",
      },
      {
        th: "2\\sqrt{3} + 5\\sqrt{3} ได้ 7\\sqrt{3} ไม่ใช่ 7\\sqrt{6} - ตัวถูกกรณฑ์ไม่ได้บวกกัน",
        en: "2\\sqrt{3} + 5\\sqrt{3} is 7\\sqrt{3}, not 7\\sqrt{6}: the radicand does not change.",
      },
    ],
    practice: [
      { generatorId: "rad.operations-core", seed: 501, difficulty: 1 },
      { generatorId: "rad.operations-core", seed: 502, difficulty: 2 },
      { generatorId: "rad.operations-core", seed: 503, difficulty: 3 },
    ],
  },

  {
    skillId: "rad.rationalize",
    title: {
      th: "การทำให้ตัวส่วนไม่ติดกรณฑ์",
      en: "Rationalising the denominator",
    },
    intro: {
      th: "\\frac{1}{\\sqrt{2}} กับ \\frac{\\sqrt{2}}{2} เท่ากัน แต่รูปหลังคำนวณค่าประมาณได้ง่ายกว่ามาก และเป็นรูปมาตรฐานที่ใช้ตอบ",
      en: "\\frac{1}{\\sqrt{2}} and \\frac{\\sqrt{2}}{2} are equal, but the second is far easier to estimate and is the standard form for an answer.",
    },
    bigIdea: {
      th: "คูณทั้งเศษและส่วนด้วยสิ่งเดียวกัน ค่าไม่เปลี่ยน ตัวส่วนพจน์เดียวใช้กรณฑ์ตัวเดิม ตัวส่วนสองพจน์ใช้สังยุค",
      en: "Multiply top and bottom by the same thing. One term on the bottom: use that root. Two terms: use the conjugate.",
    },
    ruleIds: ["rad.rationalize-monomial", "rad.conjugate", "rad.product"],
    examples: [
      { generatorId: "rad.rationalize-core", seed: 5, difficulty: 1 },
      {
        generatorId: "rad.rationalize-core",
        seed: 15,
        difficulty: 3,
        note: {
          th: "สังยุคทำให้ตัวส่วนกลายเป็นผลต่างกำลังสอง กรณฑ์จึงหายไป",
          en: "The conjugate turns the denominator into a difference of squares, and the root disappears.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ตัวส่วนสองพจน์ คูณด้วยกรณฑ์เฉย ๆ ไม่พอ ต้องใช้สังยุค",
        en: "With two terms on the bottom, multiplying by the root alone is not enough - use the conjugate.",
      },
      {
        th: "อย่าลืมคูณตัวเศษด้วย มิฉะนั้นค่าจะเปลี่ยน",
        en: "Multiply the top as well, or the value changes.",
      },
      {
        th: "จบแล้วตรวจว่าเศษกับส่วนยังตัดกันได้อีกหรือไม่",
        en: "At the end, check whether the fraction still reduces.",
      },
    ],
    practice: [
      { generatorId: "rad.rationalize-core", seed: 601, difficulty: 1 },
      { generatorId: "rad.rationalize-core", seed: 602, difficulty: 2 },
      { generatorId: "rad.rationalize-core", seed: 603, difficulty: 3 },
    ],
  },

  {
    skillId: "quad.factor-common",
    title: {
      th: "แยกตัวประกอบด้วยตัวประกอบร่วม",
      en: "Factoring out a common factor",
    },
    intro: {
      th: "นี่คือขั้นแรกของการแยกตัวประกอบทุกครั้ง ก่อนจะมองหารูปแบบอื่นใด ให้ดูก่อนว่าทุกพจน์มีอะไรร่วมกัน",
      en: "This is the first move in every factorisation. Before looking for any pattern, check what all the terms share.",
    },
    bigIdea: {
      th: "ดึงตัวประกอบร่วมที่มากที่สุดออกมา แล้วตรวจคำตอบด้วยการคูณกระจายกลับ",
      en: "Take out the greatest common factor, then check by multiplying back out.",
    },
    ruleIds: ["quad.common-factor", "arith.distribute"],
    examples: [
      { generatorId: "quad.factor-common", seed: 3, difficulty: 1 },
      { generatorId: "quad.factor-common", seed: 9, difficulty: 2 },
      { generatorId: "quad.factor-common", seed: 18, difficulty: 3 },
    ],
    pitfalls: [
      {
        th: "ดึงออกมาแล้วต้องเหลือพจน์ครบเท่าเดิม 6x^2 + 9x = 3x(2x + 3) ไม่ใช่ 3x(2x)",
        en: "Every term must survive: 6x^2 + 9x = 3x(2x + 3), not 3x(2x).",
      },
      {
        th: "ถ้าดึงแค่บางส่วนออก ยังแยกไม่สุด - ต้องเป็นตัวประกอบร่วมที่มากที่สุด",
        en: "Taking out only part of the common factor leaves the job half done.",
      },
    ],
    practice: [
      { generatorId: "quad.factor-common", seed: 701, difficulty: 1 },
      { generatorId: "quad.factor-common", seed: 702, difficulty: 2 },
      { generatorId: "quad.factor-common", seed: 703, difficulty: 3 },
    ],
  },

  {
    skillId: "quad.factor-trinomial",
    title: { th: "แยกตัวประกอบตรีนาม", en: "Factoring a trinomial" },
    intro: {
      th: "ตรีนาม x^2 + bx + c มาจากการคูณ (x + p)(x + q) ดังนั้นการแยกตัวประกอบคือการเดินย้อนกลับ หาสองจำนวนที่คูณกันได้ c และบวกกันได้ b",
      en: "A trinomial x^2 + bx + c comes from multiplying (x + p)(x + q), so factoring is walking backwards: find two numbers with product c and sum b.",
    },
    bigIdea: {
      th: "คูณกันได้พจน์คงที่ บวกกันได้สัมประสิทธิ์ของ x",
      en: "Product gives the constant, sum gives the middle coefficient.",
    },
    ruleIds: ["quad.trinomial-pattern", "quad.perfect-square-trinomial"],
    examples: [
      { generatorId: "quad.factor-trinomial", seed: 2, difficulty: 1 },
      {
        generatorId: "quad.factor-trinomial",
        seed: 10,
        difficulty: 2,
        note: {
          th: "พจน์คงที่ติดลบ แสดงว่าสองจำนวนนั้นมีเครื่องหมายต่างกัน",
          en: "A negative constant means the two numbers have opposite signs.",
        },
      },
      { generatorId: "quad.factor-trinomial", seed: 22, difficulty: 3 },
    ],
    pitfalls: [
      {
        th: "ถ้าพจน์คงที่เป็นบวกและพจน์กลางเป็นลบ ทั้งสองจำนวนต้องติดลบทั้งคู่",
        en: "Positive constant with a negative middle term means both numbers are negative.",
      },
      {
        th: "ก่อนแยกตรีนาม ตรวจตัวประกอบร่วมก่อนเสมอ",
        en: "Always check for a common factor before trying the trinomial pattern.",
      },
    ],
    practice: [
      { generatorId: "quad.factor-trinomial", seed: 801, difficulty: 1 },
      { generatorId: "quad.factor-trinomial", seed: 802, difficulty: 2 },
      { generatorId: "quad.factor-trinomial", seed: 803, difficulty: 3 },
    ],
  },

  {
    skillId: "quad.diff-squares",
    title: { th: "ผลต่างกำลังสอง", en: "Difference of squares" },
    intro: {
      th: "เมื่อคูณ (a - b)(a + b) พจน์กลางจะตัดกันหมด เหลือเพียง a^2 - b^2 รูปแบบนี้จึงแยกตัวประกอบย้อนกลับได้ทันทีเมื่อเห็น",
      en: "When you multiply (a - b)(a + b) the middle terms cancel, leaving a^2 - b^2. Spotting that shape lets you factor instantly.",
    },
    bigIdea: {
      th: "กำลังสองลบกำลังสองเท่านั้น - ผลบวกของกำลังสองแยกไม่ได้ในจำนวนจริง",
      en: "A square minus a square only. A sum of squares does not factor over the reals.",
    },
    ruleIds: ["quad.diff-squares", "quad.common-factor"],
    examples: [
      { generatorId: "quad.diff-squares", seed: 4, difficulty: 1 },
      { generatorId: "quad.diff-squares", seed: 14, difficulty: 2 },
      {
        generatorId: "quad.diff-squares",
        seed: 24,
        difficulty: 4,
        note: {
          th: "แยกครั้งเดียวไม่พอ ต้องดูว่าวงเล็บที่ได้ยังแยกต่อได้อีกหรือไม่",
          en: "One pass is not always enough - check whether a bracket factors again.",
        },
      },
    ],
    pitfalls: [
      {
        th: "x^2 + 25 แยกไม่ได้ในจำนวนจริง ต้องเป็นการลบเท่านั้น",
        en: "x^2 + 25 does not factor over the reals - it has to be a subtraction.",
      },
      {
        th: "3x^2 - 27 ต้องดึง 3 ออกก่อน จึงจะเห็นผลต่างกำลังสอง",
        en: "3x^2 - 27 needs the 3 taken out first before the pattern appears.",
      },
    ],
    practice: [
      { generatorId: "quad.diff-squares", seed: 901, difficulty: 1 },
      { generatorId: "quad.diff-squares", seed: 902, difficulty: 2 },
      { generatorId: "quad.diff-squares", seed: 903, difficulty: 3 },
    ],
  },

  {
    skillId: "quad.solve-by-factoring",
    title: {
      th: "แก้สมการโดยการแยกตัวประกอบ",
      en: "Solving by factoring",
    },
    intro: {
      th: "การแยกตัวประกอบกลายเป็นวิธีแก้สมการได้ เพราะสมบัติข้อเดียว คือถ้าผลคูณของสองจำนวนเป็นศูนย์ ต้องมีตัวใดตัวหนึ่งเป็นศูนย์",
      en: "Factoring becomes a way of solving because of one property: if a product is zero, one of the factors is zero.",
    },
    bigIdea: {
      th: "ต้องจัดให้ข้างหนึ่งเป็นศูนย์ก่อนเสมอ แล้วจึงแยกตัวประกอบ",
      en: "Get one side to zero first, then factor.",
    },
    ruleIds: ["eq.move-term", "quad.trinomial-pattern", "quad.zero-product"],
    examples: [
      { generatorId: "quad.solve-factor-simple", seed: 5, difficulty: 1 },
      {
        generatorId: "quad.solve-factor-simple",
        seed: 15,
        difficulty: 3,
        note: {
          th: "สมการยังไม่อยู่ในรูปมาตรฐาน ต้องย้ายข้างก่อน",
          en: "Not in standard form yet - rearrange first.",
        },
      },
      {
        generatorId: "quad.solve-common-factor",
        seed: 7,
        difficulty: 4,
        note: {
          th: "ถ้าหารทั้งสองข้างด้วย x คำตอบ x = 0 จะหายไปเงียบ ๆ",
          en: "Dividing both sides by x silently throws away the root x = 0.",
        },
      },
    ],
    pitfalls: [
      {
        th: "(x - 2)(x - 3) = 6 ใช้สมบัติการคูณเป็นศูนย์ไม่ได้ ต้องกระจายและจัดให้เท่ากับศูนย์ก่อน",
        en: "(x - 2)(x - 3) = 6 cannot use the zero product property - expand and set it to zero first.",
      },
      {
        th: "ห้ามหารทั้งสองข้างด้วยตัวแปร เพราะจะทำให้คำตอบหายไป",
        en: "Never divide both sides by a variable: you lose a root.",
      },
    ],
    practice: [
      { generatorId: "quad.solve-factor-simple", seed: 1001, difficulty: 1 },
      { generatorId: "quad.solve-factor-simple", seed: 1002, difficulty: 2 },
      { generatorId: "quad.solve-factor-leading", seed: 1003, difficulty: 3 },
    ],
  },

  {
    skillId: "quad.completing-square",
    title: {
      th: "การทำให้เป็นกำลังสองสมบูรณ์",
      en: "Completing the square",
    },
    intro: {
      th: "ไม่ใช่ทุกสมการจะแยกตัวประกอบได้สวย ๆ วิธีนี้ใช้ได้เสมอ และยังเป็นที่มาของสูตรหาคำตอบที่จะเรียนต่อไป",
      en: "Not every equation factors nicely. This method always works - and it is where the quadratic formula comes from.",
    },
    bigIdea: {
      th: "เติมกำลังสองของครึ่งหนึ่งของสัมประสิทธิ์ x ทั้งสองข้าง แล้วถอดรากทั้งสองข้าง อย่าลืมเครื่องหมายลบ",
      en: "Add the square of half the middle coefficient to both sides, then take roots of both sides - and keep the minus.",
    },
    ruleIds: [
      "quad.complete-square",
      "quad.perfect-square-trinomial",
      "quad.square-root-property",
    ],
    examples: [
      { generatorId: "quad.completing-square", seed: 3, difficulty: 1 },
      {
        generatorId: "quad.completing-square",
        seed: 11,
        difficulty: 2,
        note: {
          th: "ข้างขวาไม่ใช่กำลังสองสมบูรณ์ คำตอบจึงติดกรณฑ์",
          en: "The right side is not a perfect square, so the roots are surds.",
        },
      },
      { generatorId: "quad.completing-square", seed: 19, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "เติมข้างเดียวไม่ได้ ต้องเติมทั้งสองข้างให้สมการยังเป็นจริง",
        en: "Add to both sides, or the equation stops being true.",
      },
      {
        th: "ถอดรากแล้วได้สองค่า คือบวกและลบ ไม่ใช่ค่าบวกอย่างเดียว",
        en: "Taking the root gives two values, plus and minus - not just the positive one.",
      },
      {
        th: "ถ้าสัมประสิทธิ์หน้า x^2 ไม่ใช่ 1 ต้องหารออกก่อน",
        en: "If the coefficient of x^2 is not 1, divide it out first.",
      },
    ],
    practice: [
      { generatorId: "quad.completing-square", seed: 1101, difficulty: 1 },
      { generatorId: "quad.completing-square", seed: 1102, difficulty: 2 },
      { generatorId: "quad.completing-square", seed: 1103, difficulty: 3 },
    ],
  },

  {
    skillId: "quad.formula",
    title: { th: "สูตรหาคำตอบ", en: "The quadratic formula" },
    intro: {
      th: "สูตรนี้คือผลของการทำให้เป็นกำลังสองสมบูรณ์กับ ax^2 + bx + c = 0 แบบทั่วไป ทำครั้งเดียวแล้วใช้ได้ทุกสมการ",
      en: "The formula is what you get from completing the square on ax^2 + bx + c = 0 in general: do it once, use it for ever.",
    },
    bigIdea: {
      th: "เขียน a, b, c ออกมาให้ชัดก่อน แล้วคิดดิสคริมิแนนต์ b^2 - 4ac ก่อนแทนในสูตร",
      en: "Write down a, b and c clearly, then work out b^2 - 4ac before anything else.",
    },
    ruleIds: ["quad.formula", "quad.discriminant"],
    examples: [
      { generatorId: "quad.formula-core", seed: 6, difficulty: 1 },
      {
        generatorId: "quad.formula-core",
        seed: 16,
        difficulty: 2,
        note: {
          th: "สมการนี้แยกตัวประกอบไม่ได้ในจำนวนเต็ม แต่สูตรยังใช้ได้",
          en: "This one will not factor over the integers, but the formula still works.",
        },
      },
      { generatorId: "quad.formula-core", seed: 26, difficulty: 3 },
    ],
    pitfalls: [
      {
        th: "เครื่องหมายของ b ต้องใส่ให้ครบ ถ้า b = -5 แล้ว -b คือ 5",
        en: "Keep the sign of b: if b = -5 then -b is 5.",
      },
      {
        th: "ตัวส่วนคือ 2a ไม่ใช่ 2 เท่านั้น",
        en: "The denominator is 2a, not just 2.",
      },
      {
        th: "เส้นกรณฑ์ครอบคลุม b^2 - 4ac ทั้งก้อน",
        en: "The root sign covers all of b^2 - 4ac.",
      },
    ],
    practice: [
      { generatorId: "quad.formula-core", seed: 1201, difficulty: 1 },
      { generatorId: "quad.formula-core", seed: 1202, difficulty: 2 },
      { generatorId: "quad.formula-core", seed: 1203, difficulty: 3 },
    ],
  },

  {
    skillId: "quad.discriminant",
    title: {
      th: "ดิสคริมิแนนต์กับจำนวนคำตอบ",
      en: "The discriminant",
    },
    intro: {
      th: "ส่วนที่อยู่ใต้เครื่องหมายกรณฑ์ในสูตร คือ b^2 - 4ac บอกได้ทันทีว่าสมการมีคำตอบกี่คำตอบ โดยไม่ต้องแก้สมการเลย",
      en: "The part under the root sign, b^2 - 4ac, tells you how many roots there are without solving anything.",
    },
    bigIdea: {
      th: "D > 0 มีสองคำตอบ, D = 0 มีคำตอบเดียว, D < 0 ไม่มีคำตอบที่เป็นจำนวนจริง",
      en: "D > 0: two roots. D = 0: one. D < 0: none in the real numbers.",
    },
    ruleIds: ["quad.discriminant", "quad.formula"],
    examples: [
      { generatorId: "quad.discriminant-count", seed: 2, difficulty: 1 },
      { generatorId: "quad.discriminant-count", seed: 12, difficulty: 2 },
      { generatorId: "quad.discriminant-count", seed: 32, difficulty: 3 },
    ],
    pitfalls: [
      {
        th: "อย่าลืมเครื่องหมายของ c ถ้า c ติดลบ แล้ว -4ac จะกลายเป็นบวก",
        en: "Watch the sign of c: a negative c makes -4ac positive.",
      },
      {
        th: "D = 0 ไม่ได้แปลว่าไม่มีคำตอบ แต่แปลว่ามีคำตอบเดียว",
        en: "D = 0 does not mean no roots - it means one repeated root.",
      },
    ],
    practice: [
      { generatorId: "quad.discriminant-count", seed: 1301, difficulty: 1 },
      { generatorId: "quad.discriminant-count", seed: 1302, difficulty: 2 },
      { generatorId: "quad.discriminant-count", seed: 1303, difficulty: 3 },
    ],
  },

  {
    skillId: "quad.word-problems",
    title: { th: "โจทย์ปัญหา", en: "Word problems" },
    intro: {
      th: "ส่วนที่ยากของโจทย์ปัญหาไม่ใช่การแก้สมการ แต่คือการตั้งสมการ และการตรวจว่าคำตอบที่ได้ใช้ได้จริงในสถานการณ์นั้น",
      en: "The hard part of a word problem is not the algebra: it is setting up the equation, and then checking that the answer makes sense in the situation.",
    },
    bigIdea: {
      th: "ตั้งตัวแปรให้ชัดว่าแทนอะไร เขียนสมการ แก้ แล้วย้อนกลับไปดูโจทย์ว่าคำตอบไหนใช้ได้จริง",
      en: "Say clearly what the variable stands for, write the equation, solve it, then go back to the problem and see which root is allowed.",
    },
    ruleIds: ["model.equation", "quad.zero-product", "model.reject-root"],
    examples: [
      { generatorId: "quad.word-rectangle", seed: 5, difficulty: 1 },
      {
        generatorId: "quad.word-consecutive",
        seed: 9,
        difficulty: 2,
        note: {
          th: "สมการให้สองคำตอบเสมอ แต่โจทย์บอกว่าเป็นจำนวนเต็มบวก",
          en: "The equation always gives two roots, but the problem says positive integers.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ลืมตัดคำตอบที่เป็นลบทิ้ง ทั้งที่โจทย์ถามความยาวหรือจำนวนคน",
        en: "Forgetting to reject the negative root when the problem asks for a length or a count.",
      },
      {
        th: "ไม่ได้เขียนว่า x แทนอะไร ทำให้ตอบผิดคำถาม",
        en: "Not writing down what x stands for, and answering a different question.",
      },
      {
        th: "ตอบเฉพาะค่าของ x ทั้งที่โจทย์ถามความยาวทั้งสองด้าน",
        en: "Answering with x when the problem asked for both sides.",
      },
    ],
    practice: [
      { generatorId: "quad.word-rectangle", seed: 1401, difficulty: 1 },
      { generatorId: "quad.word-consecutive", seed: 1402, difficulty: 2 },
      { generatorId: "quad.word-rectangle", seed: 1403, difficulty: 3 },
    ],
  },
];

const bySkill = new Map(lessonList.map((lesson) => [lesson.skillId, lesson]));

export const lessons = lessonList;

export function getLesson(skillId: SkillId): Lesson {
  const lesson = bySkill.get(skillId);
  if (!lesson) throw new Error(`No lesson for skill ${skillId}`);
  return lesson;
}

export function hasLesson(skillId: SkillId): boolean {
  return bySkill.has(skillId);
}
