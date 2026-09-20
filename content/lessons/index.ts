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
    skillId: "eq.linear.solve",
    title: {
      th: "แก้สมการเชิงเส้นตัวแปรเดียว",
      en: "Solving a linear equation",
    },
    intro: {
      th: "สมการคือคำบอกว่าสองข้างเท่ากัน การแก้สมการจึงไม่ใช่การเดา แต่คือการทำสิ่งเดียวกันกับทั้งสองข้างไปเรื่อย ๆ จนเหลือ x อยู่ข้างเดียวโดด ๆ ความเท่ากันไม่เคยหายไประหว่างทาง",
      en: "An equation says two sides are equal. Solving one is not guessing: it is doing the same thing to both sides until x is alone, and the equality never breaks along the way.",
    },
    bigIdea: {
      th: "ทำอะไรกับข้างหนึ่ง ต้องทำกับอีกข้างเสมอ และพจน์ที่ข้ามเครื่องหมายเท่ากับต้องเปลี่ยนเครื่องหมาย",
      en: "Whatever you do to one side you do to the other - and a term that crosses the equals sign changes its sign.",
    },
    ruleIds: [
      "eq.balance",
      "eq.move-term",
      "eq.collect-variable",
      "arith.distribute",
      "eq.check-solution",
    ],
    examples: [
      {
        generatorId: "eq.linear.solve",
        seed: 3,
        difficulty: 1,
        note: {
          th: "ตรวจได้เสมอ แทนคำตอบกลับเข้าสมการเดิม ถ้าสองข้างเท่ากันจริงก็ถูก",
          en: "You can always check: put the answer back into the original and see whether the two sides match.",
        },
      },
      { generatorId: "eq.linear.solve", seed: 12, difficulty: 3 },
      { generatorId: "eq.linear.solve", seed: 25, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "ย้ายข้างแล้วลืมเปลี่ยนเครื่องหมาย จาก x + 5 = 12 ต้องได้ x = 7 ไม่ใช่ x = 17",
        en: "Moving a term without flipping its sign: x + 5 = 12 gives x = 7, not x = 17.",
      },
      {
        th: "3x หมายถึง 3 คูณ x จึงแก้ด้วยการหาร 3 ไม่ใช่ลบ 3",
        en: "3x means 3 times x, so it is undone by dividing by 3, not by subtracting 3.",
      },
      {
        th: "มีวงเล็บต้องคูณกระจายให้ครบทุกพจน์ 3(x + 4) คือ 3x + 12 ไม่ใช่ 3x + 4",
        en: "Expand the whole bracket: 3(x + 4) is 3x + 12, not 3x + 4.",
      },
    ],
    practice: [
      { generatorId: "eq.linear.solve", seed: 1001, difficulty: 1 },
      { generatorId: "eq.linear.solve", seed: 1002, difficulty: 2 },
      { generatorId: "eq.linear.solve", seed: 1003, difficulty: 3 },
    ],
  },

  {
    skillId: "eq.linear.fractions",
    title: {
      th: "สมการที่มีเศษส่วน",
      en: "Equations with fractions",
    },
    intro: {
      th: "เศษส่วนในสมการไม่ได้ทำให้สมการยากขึ้น แค่ทำให้ยาวขึ้น ถ้าคูณทั้งสองข้างด้วยตัวส่วนร่วมตั้งแต่ก้าวแรก เศษส่วนจะหายไปหมด แล้วที่เหลือก็คือสมการที่แก้เป็นอยู่แล้ว",
      en: "Fractions do not make an equation harder, only longer. Multiply both sides by a common denominator at the first step and every fraction disappears, leaving an equation you already know how to solve.",
    },
    bigIdea: {
      th: "คูณทุกพจน์ด้วยตัวส่วนร่วม ไม่ใช่เฉพาะพจน์ที่เป็นเศษส่วน พจน์ที่เป็นจำนวนเต็มก็ต้องถูกคูณด้วย",
      en: "Multiply every term by the common denominator - the whole numbers as well as the fractions.",
    },
    ruleIds: [
      "eq.clear-fractions",
      "eq.balance",
      "eq.move-term",
      "eq.collect-variable",
      "arith.distribute",
    ],
    examples: [
      {
        generatorId: "eq.linear.fractions",
        seed: 5,
        difficulty: 1,
        note: {
          th: "จัดการพจน์ที่บวกลบอยู่ก่อน แล้วค่อยคูณตัวส่วนกลับเข้าไป",
          en: "Deal with the term being added first, then multiply the denominator back in.",
        },
      },
      { generatorId: "eq.linear.fractions", seed: 14, difficulty: 3 },
      {
        generatorId: "eq.linear.fractions",
        seed: 28,
        difficulty: 4,
        note: {
          th: "มีเศษส่วนข้างละตัวพอดี จึงคูณไขว้ได้ แต่อย่าลืมคูณกระจายหลังจากนั้น",
          en: "One fraction on each side, so cross-multiplying works - but the brackets still have to be expanded.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ตัวส่วนบวกกันไม่ได้ x/2 + x/3 ไม่ใช่ 2x/5 ต้องใช้ ค.ร.น. ซึ่งคือ 6",
        en: "Denominators do not add: x/2 + x/3 is not 2x/5. Use the lowest common multiple, 6.",
      },
      {
        th: "เศษทั้งก้อนอยู่บนตัวส่วน (x + 1)/3 ต้องคูณ 3 ทั้งก้อน ไม่ใช่คูณเฉพาะ x",
        en: "The whole numerator is over the denominator: (x + 1)/3 times 3 is x + 1, not x + 3.",
      },
      {
        th: "คูณแล้วต้องคูณทุกพจน์ ถ้าเหลือพจน์ไหนไม่ถูกคูณ สมการจะไม่เท่ากันอีกต่อไป",
        en: "Every term gets multiplied. Miss one and the two sides are no longer equal.",
      },
    ],
    practice: [
      { generatorId: "eq.linear.fractions", seed: 1011, difficulty: 1 },
      { generatorId: "eq.linear.fractions", seed: 1012, difficulty: 2 },
      { generatorId: "eq.linear.fractions", seed: 1013, difficulty: 3 },
    ],
  },

  {
    skillId: "eq.linear.word",
    title: {
      th: "โจทย์ปัญหาสมการเชิงเส้น",
      en: "Linear word problems",
    },
    intro: {
      th: "ส่วนที่ยากของโจทย์ปัญหาไม่ใช่การแก้สมการ แต่คือการเขียนสมการขึ้นมา สามขั้นเสมอ ตั้งตัวแปรแทนสิ่งที่โจทย์ถาม เขียนสิ่งอื่นในรูปของตัวแปรนั้น แล้วหาประโยคในโจทย์ที่บอกว่าอะไรเท่ากับอะไร",
      en: "The hard part of a word problem is not the solving, it is the writing. Three steps every time: name the thing being asked for, write everything else in terms of it, and find the sentence that says what equals what.",
    },
    bigIdea: {
      th: "ตั้ง x เป็นสิ่งที่โจทย์ถาม แล้วตอบสิ่งที่โจทย์ถาม ไม่ใช่ค่าที่เจอระหว่างทาง",
      en: "Let x be what the question asks for, and answer what the question asked - not the value you met on the way.",
    },
    ruleIds: [
      "model.equation",
      "eq.move-term",
      "eq.collect-variable",
      "arith.distribute",
      "eq.check-solution",
    ],
    examples: [
      {
        generatorId: "eq.linear.word",
        seed: 7,
        difficulty: 1,
        note: {
          th: "ประโยคที่มีคำว่า ได้ผลลัพธ์เท่ากับ คือประโยคที่กลายเป็นเครื่องหมายเท่ากับ",
          en: "The sentence containing the word comes to is the one that becomes the equals sign.",
        },
      },
      { generatorId: "eq.linear.word", seed: 16, difficulty: 3 },
      {
        generatorId: "eq.linear.word",
        seed: 27,
        difficulty: 4,
        note: {
          th: "ข้อนี้คำตอบที่เจอก่อนคือความกว้าง ซึ่งบังเอิญเป็นสิ่งที่โจทย์ถามพอดี ลองอ่านซ้ำทุกครั้งว่าถามอะไร",
          en: "Here the value you reach first happens to be the one asked for - but read the question again every time to be sure.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ตอบผิดคำถาม โจทย์ถามความกว้าง แต่ตอบความยาว หรือถามอายุปัจจุบัน แต่ตอบอายุในอนาคต",
        en: "Answering a different question: giving the length when the width was asked, or the future age when the present one was.",
      },
      {
        th: "ไม่ได้เขียนว่า x แทนอะไร พอทำไปหลายบรรทัดก็ลืมว่ากำลังหาอะไรอยู่",
        en: "Not writing down what x stands for, then losing track of it several lines later.",
      },
      {
        th: "อ่านข้ามเงื่อนไข อีก 5 ปี ทั้งพ่อและลูกแก่ขึ้น 5 ปีเท่ากัน ไม่ใช่แค่คนเดียว",
        en: "Skipping a condition: in 5 years both people are 5 years older, not just one of them.",
      },
    ],
    practice: [
      { generatorId: "eq.linear.word", seed: 1021, difficulty: 1 },
      { generatorId: "eq.linear.word", seed: 1022, difficulty: 2 },
      { generatorId: "eq.linear.word", seed: 1023, difficulty: 3 },
    ],
  },

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
        th: "x^3 \\cdot x^4 ไม่ใช่ x^{12} เพราะการคูณเลขยกกำลังคือการบวกเลขชี้กำลัง ไม่ใช่คูณ",
        en: "x^3 \\cdot x^4 is not x^{12}: multiplying powers adds the exponents.",
      },
      {
        th: "\\left(2x\\right)^3 ไม่ใช่ 2x^3 เพราะเลขสัมประสิทธิ์ก็ต้องถูกยกกำลังด้วย",
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
        th: "2\\sqrt{3} + 5\\sqrt{3} ได้ 7\\sqrt{3} ไม่ใช่ 7\\sqrt{6} เพราะตัวถูกกรณฑ์ไม่ได้บวกกัน",
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
    skillId: "poly.perfect-square",
    title: {
      th: "แยกตัวประกอบกำลังสองสมบูรณ์",
      en: "Factoring a perfect square",
    },
    intro: {
      th: "ตรีนามบางตัวเป็นกำลังสองพอดีอยู่แล้ว ถ้ามองออกก็ไม่ต้องหาสองจำนวนที่คูณกันได้ท้ายบวกกันได้กลาง เขียนเป็นวงเล็บกำลังสองได้ทันที",
      en: "Some trinomials are already a square. Spot it and there is no pair of numbers to hunt for - the answer is one bracket squared.",
    },
    bigIdea: {
      th: "พจน์หน้าและพจน์ท้ายต้องเป็นกำลังสอง และพจน์กลางต้องเป็นสองเท่าของผลคูณของรากทั้งสอง ถ้าครบสามข้อจึงเป็นกำลังสองสมบูรณ์",
      en: "First term a square, last term a square, middle term twice their roots multiplied. All three, or it is not a perfect square.",
    },
    ruleIds: [
      "quad.perfect-square-trinomial",
      "quad.common-factor",
      "arith.distribute",
    ],
    examples: [
      {
        generatorId: "poly.perfect-square",
        seed: 4,
        difficulty: 1,
        note: {
          th: "ตรวจพจน์กลางเสมอ - ถ้าหน้าและท้ายเป็นกำลังสองแต่พจน์กลางไม่ใช่สองเท่าของผลคูณราก ก็ไม่ใช่กำลังสองสมบูรณ์",
          en: "Always check the middle: squares at both ends are not enough on their own.",
        },
      },
      { generatorId: "poly.perfect-square", seed: 12, difficulty: 3 },
      { generatorId: "poly.perfect-square", seed: 27, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "x^2 + 6x + 9 คือ (x + 3)^2 ไม่ใช่ (x + 6)^2 เพราะตัวเลขในวงเล็บคือครึ่งหนึ่งของสัมประสิทธิ์ x",
        en: "x^2 + 6x + 9 is (x + 3)^2, not (x + 6)^2: the number in the bracket is half the coefficient of x.",
      },
      {
        th: "เครื่องหมายในวงเล็บตามพจน์กลาง ไม่ใช่พจน์ท้าย - พจน์ท้ายเป็นบวกเสมอเพราะมาจากการยกกำลังสอง",
        en: "The sign follows the middle term. The last term is positive either way, because it is a square.",
      },
      {
        th: "x^2 + 5x + 9 ไม่ใช่กำลังสองสมบูรณ์ ถึงแม้ 9 จะเป็นกำลังสอง เพราะ 5 ไม่ใช่สองเท่าของ 3",
        en: "x^2 + 5x + 9 is not a perfect square even though 9 is: 5 is not twice 3.",
      },
    ],
    practice: [
      { generatorId: "poly.perfect-square", seed: 801, difficulty: 1 },
      { generatorId: "poly.perfect-square", seed: 802, difficulty: 2 },
      { generatorId: "poly.perfect-square", seed: 803, difficulty: 3 },
    ],
  },

  {
    skillId: "poly.grouping",
    title: {
      th: "แยกตัวประกอบโดยการจัดหมู่",
      en: "Factoring by grouping",
    },
    intro: {
      th: "เมื่อโจทย์มีสี่พจน์ วิธีหาสองจำนวนใช้ไม่ได้ตรง ๆ แต่ถ้าจับพจน์เข้าคู่แล้วดึงตัวประกอบร่วมของแต่ละคู่ออกมา วงเล็บที่เหลือจะเหมือนกัน แล้วดึงวงเล็บนั้นออกมาได้อีกชั้น",
      en: "With four terms the two-numbers method does not apply directly. Pair them, take a common factor out of each pair, and the brackets left behind match - so that bracket comes out too.",
    },
    bigIdea: {
      th: "ถ้าจับคู่ถูก วงเล็บที่เหลือจากทั้งสองคู่จะเหมือนกันเป๊ะ ถ้าไม่เหมือน แปลว่าจับคู่ผิดหรือเครื่องหมายผิด",
      en: "Pair it right and the two brackets are identical. If they are not, either the pairing or a sign is wrong.",
    },
    ruleIds: ["poly.grouping", "quad.common-factor", "arith.distribute"],
    examples: [
      {
        generatorId: "poly.grouping",
        seed: 5,
        difficulty: 1,
        note: {
          th: "สังเกตว่าวงเล็บที่เหลือจากคู่หน้าและคู่หลังเหมือนกัน นั่นคือสัญญาณว่าจับคู่ถูก",
          en: "Notice that both pairs leave the same bracket. That is the signal the pairing was right.",
        },
      },
      { generatorId: "poly.grouping", seed: 14, difficulty: 2 },
      { generatorId: "poly.grouping", seed: 31, difficulty: 3 },
    ],
    pitfalls: [
      {
        th: "ถ้าคู่หลังเป็นลบ ต้องดึงตัวลบออกมาด้วย เช่น -4x - 6 ดึงได้ -2(2x + 3) ไม่ใช่ 2(2x + 3)",
        en: "A negative second pair takes its minus with it: -4x - 6 gives -2(2x + 3), not 2(2x + 3).",
      },
      {
        th: "คู่หน้าอาจดึงได้มากกว่า x เช่น 6x^2 + 9x ดึงได้ 3x ไม่ใช่แค่ x",
        en: "The first pair may have more than x in common: 6x^2 + 9x gives 3x, not just x.",
      },
      {
        th: "หยุดที่ x(x + 3) + 2(x + 3) ยังไม่ใช่คำตอบ - ยังต้องดึงวงเล็บร่วมออกมาอีกชั้น",
        en: "Stopping at x(x + 3) + 2(x + 3) is not the answer: the shared bracket still has to come out.",
      },
    ],
    practice: [
      { generatorId: "poly.grouping", seed: 811, difficulty: 1 },
      { generatorId: "poly.grouping", seed: 812, difficulty: 2 },
      { generatorId: "poly.grouping", seed: 813, difficulty: 3 },
    ],
  },

  {
    skillId: "poly.two-variables",
    title: {
      th: "แยกตัวประกอบพหุนามสองตัวแปร",
      en: "Factoring in two variables",
    },
    intro: {
      th: "ไม่มีสูตรใหม่ในบทนี้เลย ผลต่างกำลังสองและตรีนามใช้ได้เหมือนเดิมทุกอย่าง ต่างกันแค่พจน์ท้ายเป็น y^2 แทนที่จะเป็นตัวเลข",
      en: "There is no new formula here. The difference of squares and the trinomial patterns work exactly as before; the last term is y^2 instead of a number.",
    },
    bigIdea: {
      th: "มอง y เป็นหน่วย แล้วมันก็คือโจทย์ตัวแปรเดียวที่ทำเป็นอยู่แล้ว - แต่พจน์ท้ายของทุกวงเล็บต้องมี y ติดไปด้วย",
      en: "Treat y as the unit and it is the one-variable question again - but every bracket's last term carries a y.",
    },
    ruleIds: [
      "poly.two-variable-pattern",
      "quad.diff-squares",
      "quad.common-factor",
    ],
    examples: [
      {
        generatorId: "poly.two-variables",
        seed: 6,
        difficulty: 1,
        note: {
          th: "9x^2 - 16y^2 คือ (3x)^2 - (4y)^2 ผลต่างกำลังสองเหมือนเดิมทุกอย่าง",
          en: "9x^2 - 16y^2 is (3x)^2 - (4y)^2 - the same difference of squares as ever.",
        },
      },
      { generatorId: "poly.two-variables", seed: 17, difficulty: 2 },
      { generatorId: "poly.two-variables", seed: 23, difficulty: 3 },
    ],
    pitfalls: [
      {
        th: "ลืม y ในวงเล็บ - x^2 + 5xy + 6y^2 คือ (x + 2y)(x + 3y) ไม่ใช่ (x + 2)(x + 3)",
        en: "Dropping the y: x^2 + 5xy + 6y^2 is (x + 2y)(x + 3y), not (x + 2)(x + 3).",
      },
      {
        th: "x^2 + y^2 แยกตัวประกอบไม่ได้ในจำนวนจริง มีแต่ผล *ต่าง* กำลังสองเท่านั้นที่แยกได้",
        en: "x^2 + y^2 does not factor over the reals. Only a difference of squares does.",
      },
      {
        th: "พจน์กลางเป็น xy ไม่ใช่ x หรือ y เดี่ยว ๆ - ถ้าคูณกลับแล้วได้พจน์กลางผิดชนิด แสดงว่าวงเล็บผิด",
        en: "The middle term is xy, not a lone x or y. If multiplying back gives the wrong kind of middle term, the brackets are wrong.",
      },
    ],
    practice: [
      { generatorId: "poly.two-variables", seed: 821, difficulty: 1 },
      { generatorId: "poly.two-variables", seed: 822, difficulty: 2 },
      { generatorId: "poly.two-variables", seed: 823, difficulty: 3 },
    ],
  },

  {
    skillId: "poly.substitution",
    title: {
      th: "แยกตัวประกอบโดยใช้ตัวแปรแทน",
      en: "Factoring by substitution",
    },
    intro: {
      th: "x^4 - 5x^2 + 6 ไม่ใช่ตรีนามดีกรีสอง แต่ถ้ามอง x^2 เป็นก้อนเดียว มันก็คือตรีนามดีกรีสองเป๊ะ ๆ เทคนิคนี้ใช้ได้ทุกครั้งที่ก้อนเดิมโผล่มาทั้งแบบยกกำลังสองและแบบตัวเปล่า",
      en: "x^4 - 5x^2 + 6 is not a quadratic - but with x^2 as a single chunk it is exactly one. The trick works whenever the same chunk appears both squared and on its own.",
    },
    bigIdea: {
      th: "แยกตัวประกอบในรูปของก้อน แล้วอย่าลืมว่าก้อนคืออะไร - ที่แยกได้คือค่าของก้อน ไม่ใช่ค่าของ x",
      en: "Factor in terms of the chunk, then remember what the chunk was: what came out is the chunk's value, not x's.",
    },
    ruleIds: ["poly.substitute", "quad.trinomial-pattern", "quad.diff-squares"],
    examples: [
      {
        generatorId: "poly.substitution",
        seed: 8,
        difficulty: 1,
        note: {
          th: "วงเล็บที่ได้คือ x^2 ลบอะไรบางอย่าง ไม่ใช่ x ลบอะไรบางอย่าง",
          en: "The brackets are x^2 minus something, not x minus something.",
        },
      },
      {
        generatorId: "poly.substitution",
        seed: 19,
        difficulty: 2,
        note: {
          th: "ข้อนี้ยังไม่จบที่สองวงเล็บ - ทั้งสองวงเล็บยังเป็นผลต่างกำลังสองที่แยกต่อได้อีก",
          en: "This one does not stop at two brackets: both are still differences of squares.",
        },
      },
      { generatorId: "poly.substitution", seed: 33, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "ลืมใส่ก้อนกลับ - แยก x^4 - 5x^2 + 6 ได้ (x^2 - 2)(x^2 - 3) ไม่ใช่ (x - 2)(x - 3)",
        en: "Forgetting to put the chunk back: x^4 - 5x^2 + 6 is (x^2 - 2)(x^2 - 3), not (x - 2)(x - 3).",
      },
      {
        th: "หยุดเร็วเกินไป - ถ้าในวงเล็บเป็นผลต่างของกำลังสองสมบูรณ์ เช่น x^2 - 4 ยังแยกต่อได้อีก",
        en: "Stopping too early: a bracket like x^2 - 4 is still a difference of squares.",
      },
      {
        th: "ก้อนไม่จำเป็นต้องเป็น x^2 เสมอไป อาจเป็นวงเล็บทั้งก้อนอย่าง (x + 3) ก็ได้",
        en: "The chunk need not be x^2; it can be a whole bracket such as (x + 3).",
      },
    ],
    practice: [
      { generatorId: "poly.substitution", seed: 831, difficulty: 1 },
      { generatorId: "poly.substitution", seed: 832, difficulty: 2 },
      { generatorId: "poly.substitution", seed: 833, difficulty: 3 },
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
      th: "ตรีนาม $x^2 + bx + c$ มาจากการคูณ (x + p)(x + q) ดังนั้นการแยกตัวประกอบคือการเดินย้อนกลับ หาสองจำนวนที่คูณกันได้ c และบวกกันได้ b",
      en: "A trinomial $x^2 + bx + c$ comes from multiplying (x + p)(x + q), so factoring is walking backwards: find two numbers with product c and sum b.",
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
      th: "สูตรนี้คือผลของการทำให้เป็นกำลังสองสมบูรณ์กับ $ax^2 + bx + c = 0$ แบบทั่วไป ทำครั้งเดียวแล้วใช้ได้ทุกสมการ",
      en: "The formula is what you get from completing the square on $ax^2 + bx + c = 0$ in general: do it once, use it for ever.",
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
  {
    skillId: "poly.cubes",
    title: {
      th: "ผลบวกและผลต่างของกำลังสาม",
      en: "Sums and differences of cubes",
    },
    intro: {
      th: "ผลบวกของกำลังสองแยกตัวประกอบไม่ได้ แต่ผลบวกของกำลังสามแยกได้เสมอ และผลต่างก็แยกได้เสมอเช่นกัน สองสูตรนี้จำได้แล้วใช้ได้ทันที ไม่ต้องหารอะไรเลย",
      en: "A sum of squares does not factor, but a sum of cubes always does - and so does a difference. Two patterns to know, and no division needed.",
    },
    bigIdea: {
      th: "เครื่องหมายกลางของตรีนามตรงข้ามกับเครื่องหมายระหว่างสองกำลังสามเสมอ และตรีนามที่เหลือแยกต่อไม่ได้อีก",
      en: "The trinomial's middle sign is always the opposite of the sign between the cubes, and the trinomial never factors again.",
    },
    ruleIds: ["poly.sum-cubes", "poly.diff-cubes", "quad.common-factor"],
    examples: [
      {
        generatorId: "poly.cubes",
        seed: 4,
        difficulty: 1,
        note: {
          th: "สังเกตว่าตรีนามที่เหลือมีดิสคริมิแนนต์เป็นลบเสมอ จึงไม่ต้องเสียเวลาลองแยกต่อ",
          en: "The trinomial left behind always has a negative discriminant, so there is no point trying to factor it.",
        },
      },
      { generatorId: "poly.cubes", seed: 15, difficulty: 2 },
      { generatorId: "poly.cubes", seed: 26, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "x^3 + 27 ไม่ใช่ (x + 3)^3 กำลังสามของผลบวกกับผลบวกของกำลังสามเป็นคนละเรื่องกัน",
        en: "x^3 + 27 is not (x + 3)^3: the cube of a sum and a sum of cubes are different things.",
      },
      {
        th: "เครื่องหมายกลางของตรีนามต้องกลับด้าน ผลบวกของกำลังสามให้ตรีนามที่มีพจน์กลางเป็นลบ",
        en: "The trinomial's middle sign flips: a sum of cubes gives a trinomial with a negative middle term.",
      },
      {
        th: "ถ้าสองพจน์ยังไม่เป็นกำลังสามพอดี ให้ดึงตัวประกอบร่วมออกมาก่อน เช่น 4x^3 + 256 ต้องดึง 4 ออกก่อน",
        en: "If the two terms are not yet perfect cubes, take a common factor out first: 4x^3 + 256 needs the 4 out of the way.",
      },
    ],
    practice: [
      { generatorId: "poly.cubes", seed: 901, difficulty: 1 },
      { generatorId: "poly.cubes", seed: 902, difficulty: 2 },
      { generatorId: "poly.cubes", seed: 903, difficulty: 3 },
    ],
  },

  {
    skillId: "poly.higher-grouping",
    title: {
      th: "จัดหมู่พหุนามดีกรีสาม",
      en: "Grouping a cubic",
    },
    intro: {
      th: "วิธีเดียวกับการจัดหมู่ที่เคยทำมาแล้ว แต่ขึ้นมาอีกหนึ่งดีกรี สิ่งเดียวที่ต่างคือคู่หน้าดึง x^2 ออกมาได้ ไม่ใช่แค่ x และสิ่งที่เหลือเป็นวงเล็บดีกรีสอง",
      en: "The same grouping as before, one degree up. The only difference is that the first pair gives up an x^2 rather than an x, and what is left is a quadratic.",
    },
    bigIdea: {
      th: "จับคู่ ดึงร่วม แล้ววงเล็บที่เหลือต้องเหมือนกันเป๊ะ ถ้าไม่เหมือน แปลว่าดึงผิดหรือเครื่องหมายผิด",
      en: "Pair, pull, and the two brackets must match exactly. If they do not, something was pulled wrong or a sign was lost.",
    },
    ruleIds: [
      "poly.grouping",
      "quad.common-factor",
      "quad.diff-squares",
      "arith.distribute",
    ],
    examples: [
      {
        generatorId: "poly.higher-grouping",
        seed: 6,
        difficulty: 1,
        note: {
          th: "คู่หน้าเป็น x^3 กับ x^2 จึงดึง x^2 ออกมาได้ทั้งคู่",
          en: "The first pair is an x^3 and an x^2, so x^2 comes out of both.",
        },
      },
      { generatorId: "poly.higher-grouping", seed: 13, difficulty: 3 },
      {
        generatorId: "poly.higher-grouping",
        seed: 22,
        difficulty: 4,
        note: {
          th: "ข้อนี้ยังไม่จบที่สองวงเล็บ - วงเล็บดีกรีสองที่เหลือเป็นผลต่างกำลังสอง",
          en: "This one does not stop at two brackets: the quadratic left behind is a difference of squares.",
        },
      },
    ],
    pitfalls: [
      {
        th: "คู่หน้าดึงได้ถึง x^2 ถ้าดึงแค่ x วงเล็บที่เหลือจะไม่ตรงกับคู่หลัง",
        en: "The first pair has an x^2 in common. Take out only an x and the brackets will not match.",
      },
      {
        th: "ถ้าคู่หลังเป็นลบ ต้องดึงตัวลบออกมาด้วย เช่น -16x - 16 ดึงได้ -16(x + 1)",
        en: "A negative second pair takes its minus with it: -16x - 16 gives -16(x + 1).",
      },
      {
        th: "แยกได้สองวงเล็บแล้วยังต้องดูอีกที วงเล็บดีกรีสองอาจเป็นผลต่างกำลังสองที่แยกต่อได้",
        en: "Two brackets is not always the end: the quadratic may be a difference of squares.",
      },
    ],
    practice: [
      { generatorId: "poly.higher-grouping", seed: 911, difficulty: 1 },
      { generatorId: "poly.higher-grouping", seed: 912, difficulty: 2 },
      { generatorId: "poly.higher-grouping", seed: 913, difficulty: 3 },
    ],
  },

  {
    skillId: "poly.factor-theorem",
    title: {
      th: "ทฤษฎีบทตัวประกอบ",
      en: "The factor theorem",
    },
    intro: {
      th: "เมื่อไม่มีรูปแบบให้จำและจัดหมู่ก็ไม่ได้ ยังเหลืออีกทางเสมอ คือหาค่าที่แทนแล้วพหุนามเป็นศูนย์ ค่านั้นบอกตัวประกอบหนึ่งตัว หารออกไปแล้วที่เหลือเป็นดีกรีสอง ซึ่งแยกเป็นอยู่แล้ว",
      en: "When there is no pattern to spot and grouping will not work, there is still a way: find a value that makes the polynomial zero. That value gives you one factor; divide it out and what is left is a quadratic you already know how to handle.",
    },
    bigIdea: {
      th: "แทนแล้วได้ศูนย์ แปลว่าหารลงตัว และเครื่องหมายในตัวประกอบกลับด้านกับค่าที่แทน แทน 2 ได้ศูนย์ ตัวประกอบคือ x ลบ 2",
      en: "Substitute and get zero means it divides exactly - and the sign in the factor is the opposite of the value you put in: x = 2 gives the factor x minus 2.",
    },
    ruleIds: [
      "poly.factor-theorem",
      "poly.divide-by-factor",
      "quad.trinomial-pattern",
      "quad.common-factor",
    ],
    examples: [
      {
        generatorId: "poly.factor-theorem",
        seed: 9,
        difficulty: 1,
        note: {
          th: "ค่าที่ควรลองคือตัวประกอบของพจน์คงที่ ไม่ต้องลองทุกจำนวน",
          en: "The values worth trying are the factors of the constant term - there is no need to try every number.",
        },
      },
      { generatorId: "poly.factor-theorem", seed: 18, difficulty: 2 },
      {
        generatorId: "poly.factor-theorem",
        seed: 29,
        difficulty: 4,
        note: {
          th: "ข้อนี้มีคำตอบตรรกยะแค่ตัวเดียว วงเล็บดีกรีสองที่เหลือแยกต่อไม่ได้ และนั่นคือคำตอบสุดท้าย",
          en: "This one has only one rational root. The quadratic left behind does not factor, and that is the final answer.",
        },
      },
    ],
    pitfalls: [
      {
        th: "แทน 2 แล้วได้ศูนย์ ตัวประกอบคือ x ลบ 2 ไม่ใช่ x บวก 2 เครื่องหมายกลับด้านเสมอ",
        en: "x = 2 giving zero means the factor is x minus 2, not x plus 2. The sign always flips.",
      },
      {
        th: "อย่าลองค่ามั่ว ลองเฉพาะตัวประกอบของพจน์คงที่ รวมทั้งค่าลบด้วย",
        en: "Do not guess at random: try the factors of the constant term, negatives included.",
      },
      {
        th: "ถ้าหารแล้วมีเศษ แสดงว่าหาตัวประกอบผิด ไม่ใช่หารผิด",
        en: "A remainder means the factor was wrong, not that the division was.",
      },
    ],
    practice: [
      { generatorId: "poly.factor-theorem", seed: 921, difficulty: 1 },
      { generatorId: "poly.factor-theorem", seed: 922, difficulty: 2 },
      { generatorId: "poly.factor-theorem", seed: 923, difficulty: 3 },
    ],
  },

  {
    skillId: "ineq.linear.solve",
    title: {
      th: "แก้อสมการเชิงเส้นตัวแปรเดียว",
      en: "Solving a linear inequality",
    },
    intro: {
      th: "อสมการทำเหมือนสมการเกือบทุกอย่าง ย้ายข้างได้ บวกลบทั้งสองข้างได้ หารด้วยจำนวนบวกได้ มีอยู่ข้อเดียวที่ต่าง คือเมื่อคูณหรือหารด้วยจำนวนลบ เครื่องหมายต้องกลับด้าน",
      en: "An inequality behaves almost exactly like an equation: you can move terms, add to both sides, divide by a positive. One thing is different - multiplying or dividing by a negative turns the sign round.",
    },
    bigIdea: {
      th: "ลบเมื่อไร กลับเมื่อนั้น แต่เฉพาะตอนคูณหรือหาร การบวกลบไม่เคยทำให้เครื่องหมายกลับ",
      en: "Negative means flip - but only when multiplying or dividing. Adding and subtracting never turn the sign.",
    },
    ruleIds: [
      "ineq.flip-on-negative",
      "ineq.balance",
      "eq.move-term",
      "eq.collect-variable",
    ],
    examples: [
      {
        generatorId: "ineq.linear.solve",
        seed: 4,
        difficulty: 1,
        note: {
          th: "ลองแทนค่าที่อยู่ในคำตอบกลับเข้าอสมการเดิมดู ถ้าเป็นจริงก็ถูก การตรวจแบบนี้จับการกลับเครื่องหมายผิดได้ทันที",
          en: "Substitute any value from the answer back into the original: if it holds, the direction is right. This catches a wrongly-flipped sign immediately.",
        },
      },
      {
        generatorId: "ineq.linear.solve",
        seed: 11,
        difficulty: 3,
        note: {
          th: "ข้อนี้สัมประสิทธิ์เป็นลบ ตอนหารจึงต้องกลับเครื่องหมาย",
          en: "Here the coefficient is negative, so dividing turns the sign round.",
        },
      },
      { generatorId: "ineq.linear.solve", seed: 23, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "กลับเครื่องหมายตอนบวกลบ จาก x + 5 < 12 ได้ x < 7 ไม่ใช่ x > 7",
        en: "Flipping when adding: x + 5 < 12 gives x < 7, not x > 7.",
      },
      {
        th: "ลืมกลับเครื่องหมายตอนหารด้วยจำนวนลบ จาก -2x < 6 ได้ x > -3 ไม่ใช่ x < -3",
        en: "Forgetting to flip when dividing by a negative: -2x < 6 gives x > -3, not x < -3.",
      },
      {
        th: "เครื่องหมายที่มีขีดใต้กับไม่มีขีดใต้ให้คำตอบคนละชุด ขีดใต้แปลว่าขอบเขตนับด้วย",
        en: "A sign with a bar under it and one without give different answers: the bar means the boundary counts.",
      },
    ],
    practice: [
      { generatorId: "ineq.linear.solve", seed: 1101, difficulty: 1 },
      { generatorId: "ineq.linear.solve", seed: 1102, difficulty: 2 },
      { generatorId: "ineq.linear.solve", seed: 1103, difficulty: 3 },
    ],
  },

  {
    skillId: "ineq.linear.integers",
    title: {
      th: "จำนวนเต็มที่สอดคล้องกับอสมการ",
      en: "The integers that satisfy an inequality",
    },
    intro: {
      th: "แก้อสมการเสร็จแล้วยังไม่จบ คำตอบเป็นช่วง ไม่ใช่ตัวเลขตัวเดียว คำถามที่ตามมาเสมอคือ แล้วจำนวนเต็มตัวไหนบ้างที่อยู่ในช่วงนั้น และตัวที่มากที่สุดหรือน้อยที่สุดคือตัวใด",
      en: "Solving it is not the end. The answer is a range, not a number, and the question that follows is always which whole numbers lie in it - and which is the largest or the smallest.",
    },
    bigIdea: {
      th: "ดูที่เครื่องหมาย ถ้ามีขีดใต้ ขอบเขตเป็นคำตอบได้เอง ถ้าไม่มี ต้องถอยมาหนึ่งจำนวนเต็ม",
      en: "Look at the sign: with the bar, the boundary itself counts; without it, step back one whole number.",
    },
    ruleIds: ["ineq.integer-solutions", "ineq.balance", "ineq.flip-on-negative"],
    examples: [
      { generatorId: "ineq.linear.integers", seed: 6, difficulty: 1 },
      {
        generatorId: "ineq.linear.integers",
        seed: 17,
        difficulty: 3,
        note: {
          th: "ขอบเขตไม่เป็นจำนวนเต็ม กรณีแบบนี้ไม่ต้องสนใจว่ามีขีดใต้หรือไม่ ปัดเข้าหาช่วงคำตอบได้เลย",
          en: "When the boundary is not a whole number, the bar makes no difference: round into the range.",
        },
      },
      { generatorId: "ineq.linear.integers", seed: 30, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "ตอบขอบเขตทั้งที่เครื่องหมายไม่มีขีดใต้ จาก x < 7 จำนวนเต็มที่มากที่สุดคือ 6 ไม่ใช่ 7",
        en: "Giving the boundary when the sign excludes it: from x < 7 the largest whole number is 6, not 7.",
      },
      {
        th: "ปัดผิดทาง ถ้าคำตอบเป็น x น้อยกว่า ให้ปัดลง ถ้าเป็นมากกว่า ให้ปัดขึ้น",
        en: "Rounding the wrong way: a less-than answer rounds down, a greater-than answer rounds up.",
      },
      {
        th: "ลืมว่าจำนวนลบก็เป็นจำนวนเต็ม ถ้าคำตอบเป็น x น้อยกว่า -2 จำนวนเต็มที่มากที่สุดคือ -3",
        en: "Forgetting that negatives are whole numbers too: below -2 the largest one is -3.",
      },
    ],
    practice: [
      { generatorId: "ineq.linear.integers", seed: 1111, difficulty: 1 },
      { generatorId: "ineq.linear.integers", seed: 1112, difficulty: 2 },
      { generatorId: "ineq.linear.integers", seed: 1113, difficulty: 3 },
    ],
  },

  {
    skillId: "ineq.linear.word",
    title: {
      th: "โจทย์ปัญหาอสมการ",
      en: "Inequality word problems",
    },
    intro: {
      th: "คำไม่กี่คำในโจทย์เป็นตัวตัดสินว่าจะได้สมการหรืออสมการ ไม่เกิน อย่างมาก มากที่สุด คือน้อยกว่าหรือเท่ากับ ส่วน อย่างน้อย ไม่ต่ำกว่า คือมากกว่าหรือเท่ากับ อ่านคำพวกนี้ให้ออกแล้วที่เหลือคือพีชคณิตเดิม",
      en: "A few words decide whether a problem is an equation or an inequality. At most and no more than are less-than-or-equal; at least and no less than are greater-than-or-equal. Read those correctly and the rest is the algebra you already have.",
    },
    bigIdea: {
      th: "แปลคำเป็นเครื่องหมายก่อน แล้วอย่าลืมว่าคำตอบสุดท้ายต้องเป็นสิ่งที่นับได้จริง เช่น ซื้อของ 3.7 ชิ้นไม่ได้",
      en: "Turn the words into a sign first, then remember the answer has to be something you can actually have: you cannot buy 3.7 notebooks.",
    },
    ruleIds: [
      "model.equation",
      "ineq.integer-solutions",
      "ineq.balance",
      "arith.distribute",
    ],
    examples: [
      {
        generatorId: "ineq.linear.word",
        seed: 8,
        difficulty: 1,
        note: {
          th: "ราคารวมต้องไม่เกินเงินที่มี นั่นคือเครื่องหมายน้อยกว่าหรือเท่ากับ",
          en: "The total must not exceed the money available - that is the less-than-or-equal sign.",
        },
      },
      { generatorId: "ineq.linear.word", seed: 19, difficulty: 2 },
      {
        generatorId: "ineq.linear.word",
        seed: 26,
        difficulty: 3,
        note: {
          th: "ข้อนี้เป็นอย่างน้อย คำตอบจึงเป็นค่าที่น้อยที่สุดที่ยังใช้ได้ ไม่ใช่มากที่สุด",
          en: "This one is at least, so the answer is the smallest value that still works, not the largest.",
        },
      },
    ],
    pitfalls: [
      {
        th: "อ่านว่าเท่ากับ ทั้งที่โจทย์บอกว่าไม่เกิน แล้วได้คำตอบที่ใช้เงินพอดีเป๊ะ ซึ่งมักไม่ใช่คำตอบ",
        en: "Reading at most as exactly, and landing on the value that spends the money precisely - usually not the answer.",
      },
      {
        th: "ปัดเศษผิดทาง ซื้อของได้ 7.8 ชิ้น แปลว่าซื้อได้ 7 ชิ้น ไม่ใช่ 8",
        en: "Rounding the wrong way: 7.8 notebooks means 7 notebooks, not 8.",
      },
      {
        th: "ตอบผิดคำถาม โจทย์ถามความกว้าง แต่ตอบความยาว หรือถามคะแนนครั้งที่สาม แต่ตอบค่าเฉลี่ย",
        en: "Answering a different question: the length instead of the width, or the average instead of the third mark.",
      },
    ],
    practice: [
      { generatorId: "ineq.linear.word", seed: 1121, difficulty: 1 },
      { generatorId: "ineq.linear.word", seed: 1122, difficulty: 2 },
      { generatorId: "ineq.linear.word", seed: 1123, difficulty: 4 },
    ],
  },

  {
    skillId: "func.quad.vertex-form",
    title: {
      th: "เขียนในรูปกำลังสองสมบูรณ์",
      en: "Writing it in completed-square form",
    },
    intro: {
      th: "$ax^2 + bx + c$ กับ $a(x - h)^2 + k$ เป็นฟังก์ชันเดียวกัน แต่รูปหลังบอกได้ทันทีว่ากราฟหน้าตาเป็นอย่างไร จุดยอดอยู่ที่ไหน และค่าต่ำสุดหรือสูงสุดเป็นเท่าใด รูปแรกไม่บอกอะไรเลยนอกจากค่าเมื่อแทน x",
      en: "$ax^2 + bx + c$ and $a(x - h)^2 + k$ are the same function, but the second one says what the graph looks like: where it turns and what its least or greatest value is. The first says nothing except what you get when you put a number in.",
    },
    bigIdea: {
      th: "ครึ่งหนึ่งของสัมประสิทธิ์ x คือตัวเลขในวงเล็บ แล้วต้องหักส่วนที่เติมเข้าไปออกเสมอ ไม่อย่างนั้นค่าจะเปลี่ยน",
      en: "Half the coefficient of x is the number in the bracket - and whatever completing the square added has to come back out, or the value changes.",
    },
    ruleIds: [
      "func.vertex-form",
      "quad.complete-square",
      "quad.perfect-square-trinomial",
    ],
    examples: [
      {
        generatorId: "func.quad.vertex-form",
        seed: 3,
        difficulty: 1,
        note: {
          th: "ตรวจได้ทุกครั้งด้วยการคูณกลับ ถ้าได้โจทย์เดิมก็ถูก",
          en: "You can always check by multiplying it back out: if you get the question, it is right.",
        },
      },
      { generatorId: "func.quad.vertex-form", seed: 12, difficulty: 2 },
      {
        generatorId: "func.quad.vertex-form",
        seed: 24,
        difficulty: 3,
        note: {
          th: "สัมประสิทธิ์หน้า x กำลังสองไม่ใช่ 1 ต้องดึงออกจากสองพจน์แรกก่อน",
          en: "The coefficient of x squared is not 1, so it has to come out of the first two terms first.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ลืมหักส่วนที่เติมเข้าไปออก x^2 + 6x + 5 คือ (x + 3)^2 - 4 ไม่ใช่ (x + 3)^2 + 5",
        en: "Forgetting to take back out what was added: x^2 + 6x + 5 is (x + 3)^2 - 4, not (x + 3)^2 + 5.",
      },
      {
        th: "เครื่องหมายในวงเล็บตามครึ่งหนึ่งของสัมประสิทธิ์ x ไม่ใช่ตรงข้ามกับมัน",
        en: "The sign in the bracket follows half the coefficient of x, not the opposite of it.",
      },
      {
        th: "ถ้าสัมประสิทธิ์หน้า x กำลังสองไม่ใช่ 1 ต้องดึงออกก่อน ไม่ใช่ทำกำลังสองสมบูรณ์ทั้งอย่างนั้น",
        en: "With a coefficient other than 1 in front, take it out first rather than completing the square around it.",
      },
    ],
    practice: [
      { generatorId: "func.quad.vertex-form", seed: 1201, difficulty: 1 },
      { generatorId: "func.quad.vertex-form", seed: 1202, difficulty: 2 },
      { generatorId: "func.quad.vertex-form", seed: 1203, difficulty: 3 },
    ],
  },

  {
    skillId: "func.quad.vertex",
    title: {
      th: "จุดยอด แกนสมมาตร และค่าสูงสุดต่ำสุด",
      en: "Vertex, axis of symmetry, and the greatest or least value",
    },
    intro: {
      th: "พาราโบลาสมมาตรรอบเส้นตรงแนวตั้งเส้นหนึ่งเสมอ และจุดที่กราฟตัดเส้นนั้นคือจุดยอด ซึ่งเป็นจุดที่สูงที่สุดหรือต่ำที่สุดของทั้งกราฟ คำถามสามข้อนี้จึงเป็นคำถามเดียวกัน",
      en: "A parabola is always symmetric about one vertical line, and where it meets that line is the vertex - the highest or lowest point on the whole curve. So these three questions are one question.",
    },
    bigIdea: {
      th: "แกนสมมาตรคือพิกัด x ของจุดยอด ค่าสูงสุดหรือต่ำสุดคือพิกัด y และสัมประสิทธิ์หน้า x กำลังสองบอกว่าเป็นอย่างไหน",
      en: "The axis is the vertex's x; the greatest or least value is its y; and the sign of the coefficient of x squared says which of the two it is.",
    },
    ruleIds: [
      "func.axis-of-symmetry",
      "func.vertex-form",
      "func.parabola-direction",
    ],
    examples: [
      {
        generatorId: "func.quad.vertex",
        seed: 5,
        difficulty: 1,
        note: {
          th: "แกนสมมาตรหาได้จากสัมประสิทธิ์โดยตรง ไม่ต้องจัดรูปอะไรเลย",
          en: "The axis comes straight from the coefficients, with no rearranging at all.",
        },
      },
      { generatorId: "func.quad.vertex", seed: 14, difficulty: 2 },
      {
        generatorId: "func.quad.vertex",
        seed: 29,
        difficulty: 4,
        note: {
          th: "สัมประสิทธิ์เป็นลบ กราฟเปิดลง จุดยอดจึงเป็นค่าสูงสุด ไม่ใช่ต่ำสุด",
          en: "A negative coefficient opens the graph downwards, so the vertex is a maximum rather than a minimum.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ลืมเครื่องหมายลบในสูตร แกนสมมาตรคือ ลบ b ส่วน 2a ไม่ใช่ b ส่วน 2a",
        en: "Dropping the minus: the axis is minus b over 2a, not b over 2a.",
      },
      {
        th: "ตอบพิกัดผิดตัว โจทย์ถามแกนสมมาตรแต่ตอบค่า y หรือกลับกัน",
        en: "Giving the wrong coordinate: the axis when the value was asked for, or the other way round.",
      },
      {
        th: "สมมติว่าจุดยอดเป็นค่าต่ำสุดเสมอ ถ้าสัมประสิทธิ์เป็นลบ จุดยอดคือค่าสูงสุด",
        en: "Assuming the vertex is always a minimum. With a negative coefficient it is a maximum.",
      },
    ],
    practice: [
      { generatorId: "func.quad.vertex", seed: 1211, difficulty: 1 },
      { generatorId: "func.quad.vertex", seed: 1212, difficulty: 2 },
      { generatorId: "func.quad.vertex", seed: 1213, difficulty: 3 },
    ],
  },

  {
    skillId: "func.quad.intercepts",
    title: {
      th: "จุดตัดแกน x และแกน y",
      en: "Where the curve meets the axes",
    },
    intro: {
      th: "จุดบนแกน y ทุกจุดมีพิกัด x เป็นศูนย์ และจุดบนแกน x ทุกจุดมีพิกัด y เป็นศูนย์ การหาจุดตัดแกนจึงไม่ใช่เรื่องใหม่เลย แค่แทนศูนย์ลงไปแล้วแก้สมการที่เหลือ",
      en: "Every point on the y-axis has x = 0, and every point on the x-axis has y = 0. Finding the intercepts is nothing new: put zero in and solve whatever is left.",
    },
    bigIdea: {
      th: "ตัดแกนไหน ให้อีกพิกัดเป็นศูนย์ จุดตัดแกน y มีเสมอหนึ่งจุด ส่วนจุดตัดแกน x อาจมีสอง หนึ่ง หรือไม่มีเลย",
      en: "To cross an axis, the other coordinate is zero. There is always exactly one y-intercept; there may be two x-intercepts, one, or none.",
    },
    ruleIds: [
      "func.intercepts",
      "quad.zero-product",
      "quad.trinomial-pattern",
      "quad.discriminant",
    ],
    examples: [
      {
        generatorId: "func.quad.intercepts",
        seed: 7,
        difficulty: 1,
        note: {
          th: "จุดตัดแกน y คือพจน์คงที่เสมอ ไม่ต้องคำนวณอะไรเลย",
          en: "The y-intercept is always the constant term - nothing to work out.",
        },
      },
      { generatorId: "func.quad.intercepts", seed: 16, difficulty: 2 },
      { generatorId: "func.quad.intercepts", seed: 31, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "อ่านรากจากวงเล็บโดยไม่กลับเครื่องหมาย จาก (x - 2)(x + 5) รากคือ 2 และ -5",
        en: "Reading the roots off the brackets without flipping: (x - 2)(x + 5) has roots 2 and -5.",
      },
      {
        th: "สลับกันระหว่างสองแกน จุดตัดแกน y ได้จากการแทน x ด้วยศูนย์ ไม่ใช่ y",
        en: "Swapping the two: the y-intercept comes from putting x = 0, not y = 0.",
      },
      {
        th: "คิดว่ากราฟต้องตัดแกน x เสมอ ถ้าดิสคริมิแนนต์เป็นลบ กราฟไม่ตัดแกน x เลย",
        en: "Assuming there are always x-intercepts. With a negative discriminant the curve never meets the x-axis.",
      },
    ],
    practice: [
      { generatorId: "func.quad.intercepts", seed: 1221, difficulty: 1 },
      { generatorId: "func.quad.intercepts", seed: 1222, difficulty: 2 },
      { generatorId: "func.quad.intercepts", seed: 1223, difficulty: 3 },
    ],
  },

  {
    skillId: "func.evaluate",
    title: {
      th: "การหาค่าของฟังก์ชัน",
      en: "Evaluating a function",
    },
    intro: {
      th: "ตั้งแต่ ม.1 มา x คือจำนวนที่ยังไม่รู้ว่าเท่าไร ตั้งแต่บทนี้ไป x คือสิ่งที่เราใส่เข้าไป และ f คือสิ่งที่ทำกับมัน f(3) จึงไม่ได้แปลว่า f คูณ 3 แต่แปลว่าค่าที่ได้เมื่อใส่ 3 เข้าไป",
      en: "Until now x has been a number waiting to be found. From here it is an input, and f is a thing you do to it - so f(3) does not mean f times 3, it means what comes out when 3 goes in.",
    },
    bigIdea: {
      th: "แทนทุกที่ที่มี x ไม่ใช่แค่ที่แรก และถ้าสิ่งที่แทนเป็นก้อน ต้องใส่วงเล็บไว้เสมอ",
      en: "Substitute everywhere x appears, not just the first one - and if what goes in is an expression, it goes in inside a bracket.",
    },
    ruleIds: ["func.notation", "arith.distribute"],
    examples: [
      {
        generatorId: "func.evaluate",
        seed: 4,
        difficulty: 1,
        note: {
          th: "วงเล็บหลังชื่อฟังก์ชันไม่ได้แปลว่าคูณ ให้อ่านว่า ที่",
          en: "The bracket after a function's name is not multiplication - read it as at.",
        },
      },
      { generatorId: "func.evaluate", seed: 13, difficulty: 3 },
      {
        generatorId: "func.evaluate",
        seed: 27,
        difficulty: 4,
        note: {
          th: "ใส่ก้อนทั้งก้อนเข้าไป นี่คือสิ่งเดียวกับที่กฎลูกโซ่ในแคลคูลัสจะขอในอีกไม่กี่บท",
          en: "A whole expression goes in. This is the same move the chain rule will ask for a few chapters from now.",
        },
      },
    ],
    pitfalls: [
      {
        th: "อ่าน f(3) ว่า f คูณ 3 วงเล็บตรงนี้เป็นสัญลักษณ์ของฟังก์ชัน ไม่ใช่การคูณ",
        en: "Reading f(3) as f times 3. That bracket is function notation, not multiplication.",
      },
      {
        th: "แทนแค่ที่แรก ถ้าฟังก์ชันมี x สองที่ ต้องแทนทั้งสองที่",
        en: "Substituting into only the first x. If the function has two, both get replaced.",
      },
      {
        th: "ลืมวงเล็บตอนแทนจำนวนลบ แทน -3 ใน x^2 ได้ 9 ไม่ใช่ -9",
        en: "Losing the bracket on a negative: -3 into x^2 gives 9, not -9.",
      },
    ],
    practice: [
      { generatorId: "func.evaluate", seed: 1301, difficulty: 1 },
      { generatorId: "func.evaluate", seed: 1302, difficulty: 2 },
      { generatorId: "func.evaluate", seed: 1303, difficulty: 3 },
    ],
  },

  {
    skillId: "func.composite",
    title: {
      th: "ฟังก์ชันประกอบ",
      en: "Composite functions",
    },
    intro: {
      th: "ถ้า g เปลี่ยนตัวเลขหนึ่งเป็นอีกตัวเลขหนึ่ง แล้ว f เปลี่ยนต่ออีกที ผลรวมของสองขั้นนั้นก็เป็นฟังก์ชันหนึ่งเหมือนกัน เรียกว่าฟังก์ชันประกอบ สิ่งที่ต้องระวังมีอย่างเดียวคือลำดับ",
      en: "If g turns one number into another and f then turns that into something else, the two steps together are a function of their own. The only thing to be careful about is the order.",
    },
    bigIdea: {
      th: "อ่านจากในออกนอก ตัวที่อยู่ติดกับ x ทำงานก่อน และสลับลำดับแล้วมักได้คนละฟังก์ชัน",
      en: "Read from the inside out: whichever is next to the x goes first, and swapping them usually gives a different function.",
    },
    ruleIds: ["func.composite", "func.notation", "arith.distribute"],
    examples: [
      {
        generatorId: "func.composite",
        seed: 6,
        difficulty: 1,
        note: {
          th: "ลองคิด g(f(x)) ดูด้วย จะเห็นว่าได้คนละคำตอบ",
          en: "Work out g(f(x)) as well and you will see it is a different answer.",
        },
      },
      { generatorId: "func.composite", seed: 15, difficulty: 3 },
      { generatorId: "func.composite", seed: 22, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "ทำผิดลำดับ f(g(x)) คือ g ก่อน ไม่ใช่ f ก่อน",
        en: "Getting the order backwards: f(g(x)) is g first, not f first.",
      },
      {
        th: "ลืมวงเล็บ ถ้า f(x) = 2x + 1 แล้ว f(g(x)) คือ 2 คูณทั้งก้อนของ g บวก 1",
        en: "Dropping the bracket: if f(x) = 2x + 1 then f(g(x)) is 2 times all of g, plus 1.",
      },
      {
        th: "คิดว่า f(g(x)) เท่ากับ g(f(x)) เสมอ ซึ่งจริงเฉพาะบางกรณีเท่านั้น",
        en: "Assuming f(g(x)) equals g(f(x)). That is true only in special cases.",
      },
    ],
    practice: [
      { generatorId: "func.composite", seed: 1311, difficulty: 1 },
      { generatorId: "func.composite", seed: 1312, difficulty: 2 },
      { generatorId: "func.composite", seed: 1313, difficulty: 3 },
    ],
  },

  {
    skillId: "func.inverse",
    title: {
      th: "ฟังก์ชันผกผัน",
      en: "Inverse functions",
    },
    intro: {
      th: "ถ้าฟังก์ชันหนึ่งคูณสามแล้วลบห้า ฟังก์ชันที่เดินย้อนกลับก็ต้องบวกห้าแล้วหารสาม ทั้งย้อนการกระทำและย้อนลำดับด้วย วิธีหาที่ใช้ได้เสมอคือ เขียน y สลับ x กับ y แล้วแก้หา y",
      en: "If a function multiplies by three then subtracts five, the one that walks it backwards adds five then divides by three - both the operations and their order reversed. The method that always works is: write y, swap x and y, solve for y.",
    },
    bigIdea: {
      th: "f ยกกำลังลบหนึ่ง ไม่ได้แปลว่าหนึ่งส่วน f แม้เลขชี้กำลังลบที่อื่นจะแปลแบบนั้น",
      en: "f to the power minus one does not mean one over f, even though a negative exponent means exactly that everywhere else.",
    },
    ruleIds: ["func.inverse-swap", "func.notation", "eq.move-term"],
    examples: [
      {
        generatorId: "func.inverse",
        seed: 9,
        difficulty: 1,
        note: {
          th: "ตรวจได้ด้วยการใส่ต่อกัน ถ้าใส่ค่าหนึ่งเข้า f แล้วเอาผลไปใส่ผกผัน ต้องได้ค่าเดิมกลับมา",
          en: "You can check by composing: put a number into f, feed the result into the inverse, and the original number should come back.",
        },
      },
      { generatorId: "func.inverse", seed: 18, difficulty: 2 },
      { generatorId: "func.inverse", seed: 25, difficulty: 3 },
    ],
    pitfalls: [
      {
        th: "อ่าน f ยกกำลังลบหนึ่ง ว่าหนึ่งส่วน f ซึ่งเป็นคนละสิ่งกันโดยสิ้นเชิง",
        en: "Reading f to the minus one as one over f, which is something else entirely.",
      },
      {
        th: "ลืมย้อนลำดับ ผกผันของ คูณสามแล้วลบห้า คือ บวกห้าแล้วหารสาม ไม่ใช่ หารสามแล้วบวกห้า",
        en: "Forgetting to reverse the order: the inverse of times three then minus five is plus five then divide by three, not divide then add.",
      },
      {
        th: "สลับ x กับ y แล้วลืมแก้หา y ต่อ ยังไม่จบแค่สลับ",
        en: "Swapping x and y and stopping there. Swapping is only the first half.",
      },
    ],
    practice: [
      { generatorId: "func.inverse", seed: 1321, difficulty: 1 },
      { generatorId: "func.inverse", seed: 1322, difficulty: 2 },
      { generatorId: "func.inverse", seed: 1323, difficulty: 3 },
    ],
  },

  {
    skillId: "log.definition",
    title: {
      th: "นิยามของลอการิทึม",
      en: "What a logarithm is",
    },
    intro: {
      th: "ลอการิทึมไม่ใช่การดำเนินการใหม่ แต่เป็นคำถามเก่าที่ถามกลับด้าน เลขยกกำลังถามว่า สองยกกำลังสามได้เท่าไร ลอการิทึมถามว่า สองยกกำลังเท่าไรจึงได้แปด คำตอบของลอการิทึมจึงเป็นเลขชี้กำลังเสมอ",
      en: "A logarithm is not a new operation, it is an old question asked backwards. A power asks what two cubed is; a logarithm asks two to what power gives eight. So the answer to a logarithm is always an exponent.",
    },
    bigIdea: {
      th: "log ฐาน b ของ x เท่ากับ y ก็ต่อเมื่อ b ยกกำลัง y ได้ x สองบรรทัดนี้พูดเรื่องเดียวกัน",
      en: "Log base b of x equals y exactly when b to the power y is x. Those two lines say the same thing.",
    },
    ruleIds: ["log.definition", "exp.negative", "exp.zero"],
    examples: [
      {
        generatorId: "log.definition",
        seed: 3,
        difficulty: 1,
        note: {
          th: "อ่านออกเสียงว่า สองยกกำลังเท่าไรจึงได้แปด แล้วคำตอบจะมาเอง",
          en: "Say it out loud - two to what power gives eight - and the answer arrives on its own.",
        },
      },
      {
        generatorId: "log.definition",
        seed: 11,
        difficulty: 2,
        note: {
          th: "ถ้าจำนวนที่ถามน้อยกว่าหนึ่ง เลขชี้กำลังต้องติดลบ",
          en: "When the number asked about is less than one, the exponent has to be negative.",
        },
      },
      { generatorId: "log.definition", seed: 26, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "อ่าน log ฐานสองของแปด ว่า แปดหารสอง ลอการิทึมไม่ใช่การหาร",
        en: "Reading log base two of eight as eight over two. A logarithm is not a division.",
      },
      {
        th: "ลืมว่าคำตอบเป็นลบได้ ถ้าจำนวนข้างในน้อยกว่าหนึ่ง",
        en: "Forgetting the answer can be negative, when the number inside is less than one.",
      },
      {
        th: "สลับฐานกับจำนวน log ฐานสองของแปด ได้สาม ส่วน log ฐานแปดของสอง ได้หนึ่งส่วนสาม",
        en: "Swapping the base and the number: log base two of eight is three, log base eight of two is a third.",
      },
    ],
    practice: [
      { generatorId: "log.definition", seed: 1401, difficulty: 1 },
      { generatorId: "log.definition", seed: 1402, difficulty: 2 },
      { generatorId: "log.definition", seed: 1403, difficulty: 3 },
    ],
  },

  {
    skillId: "log.laws",
    title: {
      th: "สมบัติของลอการิทึม",
      en: "The laws of logarithms",
    },
    intro: {
      th: "สมบัติทั้งสามข้อในบทนี้ไม่ใช่ของใหม่เลย มันคือสมบัติของเลขยกกำลังจาก ม.2 อ่านกลับด้าน คูณเลขยกกำลังฐานเดียวกันคือบวกเลขชี้กำลัง และลอการิทึมคือเลขชี้กำลัง ดังนั้นคูณข้างในจึงกลายเป็นบวกข้างนอก",
      en: "The three laws here are not new. They are the ม.2 exponent laws read backwards: multiplying powers of the same base adds the exponents, and a logarithm is an exponent - so multiplying inside becomes adding outside.",
    },
    bigIdea: {
      th: "คูณข้างในเป็นบวกข้างนอก หารข้างในเป็นลบข้างนอก กำลังข้างในลงมาคูณข้างหน้า",
      en: "Times inside becomes plus outside, divide inside becomes minus outside, and a power inside comes down to multiply.",
    },
    ruleIds: ["log.product", "log.quotient", "log.power", "log.definition"],
    examples: [
      {
        generatorId: "log.laws",
        seed: 5,
        difficulty: 1,
        note: {
          th: "จะรวมเป็นลอการิทึมเดียวก่อนก็ได้ หรือหาค่าแต่ละตัวแล้วบวกก็ได้ ได้คำตอบเดียวกัน",
          en: "You can gather them into one logarithm first, or work each one out and add - the same answer either way.",
        },
      },
      { generatorId: "log.laws", seed: 14, difficulty: 3 },
      { generatorId: "log.laws", seed: 23, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "คิดว่า log ของผลบวกเท่ากับผลบวกของ log ซึ่งไม่จริง ผลบวกของ log คือ log ของผลคูณ",
        en: "Thinking the log of a sum is the sum of the logs. It is not: a sum of logs is the log of a product.",
      },
      {
        th: "ใช้สมบัติกับลอการิทึมที่ฐานไม่เท่ากัน สมบัติทั้งสามข้อต้องการฐานเดียวกัน",
        en: "Using the laws across different bases. All three of them need the same base.",
      },
      {
        th: "ยกกำลังตัวลอการิทึมแทนที่จะยกกำลังจำนวนข้างใน สองเท่าของ log คือ log ของกำลังสอง ไม่ใช่ log กำลังสอง",
        en: "Raising the logarithm instead of what is inside it: twice a log is the log of a square, not the square of a log.",
      },
    ],
    practice: [
      { generatorId: "log.laws", seed: 1411, difficulty: 1 },
      { generatorId: "log.laws", seed: 1412, difficulty: 2 },
      { generatorId: "log.laws", seed: 1413, difficulty: 3 },
    ],
  },

  {
    skillId: "exp.log.equations",
    title: {
      th: "สมการเอกซ์โพเนนเชียลและลอการิทึม",
      en: "Exponential and logarithmic equations",
    },
    intro: {
      th: "เมื่อตัวแปรไปอยู่บนเลขชี้กำลัง การย้ายข้างและการหารเข้าไม่ถึงมัน มีสองทางเท่านั้น ทำสองข้างให้ฐานเดียวกันแล้วเทียบเลขชี้กำลัง หรือถ้าโจทย์เป็นลอการิทึม ก็เปลี่ยนกลับเป็นรูปเลขยกกำลัง ทั้งสองทางจบลงที่สมการเชิงเส้นธรรมดา",
      en: "When the unknown is up in the exponent, moving terms and dividing cannot reach it. There are two ways in: make both sides the same base and compare the exponents, or, if the question is a logarithm, turn it back into a power. Both end at an ordinary linear equation.",
    },
    bigIdea: {
      th: "ฐานเท่ากันเมื่อไร เทียบเลขชี้กำลังได้เมื่อนั้น และลอการิทึมเปลี่ยนกลับเป็นเลขยกกำลังได้เสมอ",
      en: "Same base means same exponent - and a logarithm can always be turned back into a power.",
    },
    ruleIds: [
      "exp.same-base",
      "log.definition",
      "exp.power-of-power",
      "eq.collect-variable",
    ],
    examples: [
      {
        generatorId: "exp.log.equations",
        seed: 8,
        difficulty: 1,
        note: {
          th: "ขั้นแรกคือมองให้ออกว่าข้างขวาเป็นกำลังของฐานเดียวกันหรือไม่",
          en: "The first move is spotting that the right-hand side is a power of the same base.",
        },
      },
      {
        generatorId: "exp.log.equations",
        seed: 17,
        difficulty: 3,
        note: {
          th: "ข้อนี้สองข้างฐานไม่เท่ากัน ต้องเขียนข้างขวาใหม่ก่อน",
          en: "Here the two sides have different bases, so the right one has to be rewritten first.",
        },
      },
      { generatorId: "exp.log.equations", seed: 30, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "หารทั้งสองข้างเพื่อกำจัดฐาน ซึ่งเข้าไม่ถึงตัวแปรที่อยู่บนเลขชี้กำลัง",
        en: "Dividing both sides to get rid of the base. That never reaches an unknown in the exponent.",
      },
      {
        th: "หยุดที่ค่าของเลขชี้กำลัง ทั้งที่เลขชี้กำลังยังเป็นนิพจน์ที่ต้องแก้ต่อ",
        en: "Stopping at the value of the exponent when the exponent is itself an expression still to be solved.",
      },
      {
        th: "เทียบเลขชี้กำลังทั้งที่ฐานยังไม่เท่ากัน ต้องทำให้ฐานเท่ากันก่อนเสมอ",
        en: "Comparing exponents before the bases match. They have to match first.",
      },
    ],
    practice: [
      { generatorId: "exp.log.equations", seed: 1421, difficulty: 1 },
      { generatorId: "exp.log.equations", seed: 1422, difficulty: 2 },
      { generatorId: "exp.log.equations", seed: 1423, difficulty: 3 },
    ],
  },

  {
    skillId: "trig.definition",
    title: {
      th: "นิยามอัตราส่วนตรีโกณมิติ",
      en: "What the ratios mean",
    },
    intro: {
      th: "สามเหลี่ยมมุมฉากสองรูปที่มีมุมเท่ากัน จะมีอัตราส่วนของด้านเท่ากันเสมอ ไม่ว่ารูปจะใหญ่หรือเล็กแค่ไหน อัตราส่วนนั้นจึงเป็นสมบัติของมุม ไม่ใช่ของรูป และนั่นคือสิ่งที่ sin cos tan เก็บไว้",
      en: "Two right-angled triangles with the same angle always have the same ratios between their sides, however large or small they are. The ratio belongs to the angle, not to the triangle - and that is what sine, cosine and tangent record.",
    },
    bigIdea: {
      th: "ด้านตรงข้ามกับด้านประชิดขึ้นอยู่กับว่ากำลังพูดถึงมุมไหน ส่วนด้านตรงข้ามมุมฉากเป็นด้านเดิมเสมอ",
      en: "Which side is opposite and which is adjacent depends on the angle being asked about. The hypotenuse is always the same side.",
    },
    ruleIds: ["trig.sohcahtoa", "trig.pythagoras"],
    examples: [
      {
        generatorId: "trig.definition",
        seed: 4,
        difficulty: 1,
        note: {
          th: "ลองถามอีกมุมหนึ่งของสามเหลี่ยมเดียวกันดู จะเห็นว่าข้ามกับชิดสลับที่กัน",
          en: "Ask about the other angle in the same triangle and you will see opposite and adjacent swap over.",
        },
      },
      { generatorId: "trig.definition", seed: 12, difficulty: 2 },
      {
        generatorId: "trig.definition",
        seed: 27,
        difficulty: 3,
        note: {
          th: "ข้อนี้ยังไม่รู้ด้านครบ ต้องหาด้วยพีทาโกรัสก่อนจึงจะเขียนอัตราส่วนได้",
          en: "Here a side is missing, so Pythagoras has to come first before the ratio can be written.",
        },
      },
    ],
    pitfalls: [
      {
        th: "สลับด้านตรงข้ามกับด้านประชิด ทั้งสองอย่างขึ้นอยู่กับมุมที่โจทย์ถาม ไม่ใช่ตำแหน่งบนกระดาษ",
        en: "Swapping opposite and adjacent. Both are decided by the angle asked about, not by where they sit on the page.",
      },
      {
        th: "เอาด้านตรงข้ามมุมฉากไปเป็นตัวเศษ ด้านตรงข้ามมุมฉากยาวที่สุดเสมอ อัตราส่วน sin และ cos จึงไม่เกินหนึ่ง",
        en: "Putting the hypotenuse on top. It is always the longest side, so sine and cosine never exceed one.",
      },
      {
        th: "ตอบเป็นความยาวด้าน อัตราส่วนตรีโกณมิติเป็นอัตราส่วน ไม่มีหน่วย",
        en: "Answering with a length. A trigonometric ratio is a ratio, and has no units.",
      },
    ],
    practice: [
      { generatorId: "trig.definition", seed: 1501, difficulty: 1 },
      { generatorId: "trig.definition", seed: 1502, difficulty: 2 },
      { generatorId: "trig.definition", seed: 1503, difficulty: 3 },
    ],
  },

  {
    skillId: "trig.special",
    title: {
      th: "อัตราส่วนตรีโกณมิติของมุมพิเศษ",
      en: "The special angles",
    },
    intro: {
      th: "มุมส่วนใหญ่ให้ค่าที่เป็นทศนิยมไม่รู้จบ แต่มีสามมุมที่ให้ค่าที่แน่นอน คือ 30 45 และ 60 องศา ทั้งสามมาจากสามเหลี่ยมสองรูปเท่านั้น สามเหลี่ยมด้านเท่าที่ผ่าครึ่ง และสามเหลี่ยมมุมฉากหน้าจั่ว",
      en: "Most angles give values that run on for ever as decimals. Three do not: thirty, forty-five and sixty degrees. All three come from just two triangles - an equilateral one cut in half, and a right-angled isosceles one.",
    },
    bigIdea: {
      th: "ตอบเป็นค่าที่แน่นอน ไม่ใช่ทศนิยม เพราะค่าที่แน่นอนยังเอาไปคูณต่อได้โดยไม่คลาดเคลื่อน",
      en: "Give the exact value, not a decimal: an exact value can be multiplied on without losing anything.",
    },
    ruleIds: ["trig.special-angles", "trig.sohcahtoa", "rad.rationalize-monomial"],
    examples: [
      {
        generatorId: "trig.special",
        seed: 6,
        difficulty: 1,
        note: {
          th: "ถ้าจำไม่ได้ ให้วาดสามเหลี่ยมด้านเท่าด้านละสอง ผ่าครึ่ง แล้วอ่านค่าออกมา",
          en: "If you cannot remember it, draw an equilateral triangle of side two, cut it in half, and read the values off.",
        },
      },
      { generatorId: "trig.special", seed: 15, difficulty: 3 },
      { generatorId: "trig.special", seed: 28, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "สลับ sin กับ cos ค่าของทั้งสองไล่กันคนละทาง ยกเว้นที่ 45 องศาที่เท่ากันพอดี",
        en: "Swapping sine and cosine. They run in opposite directions, and meet only at forty-five degrees.",
      },
      {
        th: "ตอบเป็นทศนิยม ค่าที่แน่นอนกับค่าประมาณเป็นคนละจำนวน และโจทย์ขอค่าที่แน่นอน",
        en: "Answering with a decimal. An exact value and a rounded one are different numbers, and the question asks for the exact one.",
      },
      {
        th: "ลืมว่า tan 90 องศา ไม่มีค่า เพราะด้านประชิดกลายเป็นศูนย์",
        en: "Forgetting that tan of ninety degrees has no value, because the adjacent side becomes zero.",
      },
    ],
    practice: [
      { generatorId: "trig.special", seed: 1511, difficulty: 1 },
      { generatorId: "trig.special", seed: 1512, difficulty: 2 },
      { generatorId: "trig.special", seed: 1513, difficulty: 3 },
    ],
  },

  {
    skillId: "trig.solve",
    title: {
      th: "หาด้านหรือมุมที่ขาดหาย",
      en: "Finding a missing side or angle",
    },
    intro: {
      th: "นี่คือเหตุผลที่อัตราส่วนตรีโกณมิติมีอยู่ ถ้ารู้มุมหนึ่งกับด้านหนึ่งของสามเหลี่ยมมุมฉาก ก็หาด้านที่เหลือได้ทั้งหมด โดยไม่ต้องวัด ความสูงของตึกจึงหาได้จากพื้นดิน",
      en: "This is what the ratios are for. One angle and one side of a right-angled triangle give all the rest of it without measuring - which is how the height of a building is found from the ground.",
    },
    bigIdea: {
      th: "เลือกอัตราส่วนจากสิ่งที่รู้และสิ่งที่ถาม ถ้าด้านตรงข้ามมุมฉากไม่เกี่ยวข้องเลย แสดงว่าเป็นงานของ tan",
      en: "Pick the ratio from what you know and what you want. If the hypotenuse is not involved at all, it is tan's job.",
    },
    ruleIds: ["trig.sohcahtoa", "trig.special-angles", "trig.pythagoras"],
    examples: [
      {
        generatorId: "trig.solve",
        seed: 9,
        difficulty: 1,
        note: {
          th: "ด้านที่ถามอยู่บนเศษของอัตราส่วน จึงคูณกลับ ไม่ใช่หาร",
          en: "The side asked for is on top of the ratio, so it is a multiplication back, not a division.",
        },
      },
      { generatorId: "trig.solve", seed: 18, difficulty: 3 },
      {
        generatorId: "trig.solve",
        seed: 24,
        difficulty: 4,
        note: {
          th: "มุมเงยวัดจากระดับสายตา ความสูงของตึกจึงเป็นความสูงเหนือสายตาบวกความสูงของสายตาเอง",
          en: "An angle of elevation is measured from eye level, so the building's height is the height above eye level plus the eye height itself.",
        },
      },
    ],
    pitfalls: [
      {
        th: "เลือกอัตราส่วนผิด ดูว่ารู้ด้านไหนและถามด้านไหน แล้วจึงเลือก sin cos หรือ tan",
        en: "Picking the wrong ratio. Look at which side is known and which is wanted, then choose.",
      },
      {
        th: "หารทั้งที่ควรคูณ ถ้าตัวที่ไม่รู้อยู่บนเศษ ให้คูณกลับ ถ้าอยู่ตัวส่วนจึงหาร",
        en: "Dividing when it should be multiplying. If the unknown is on top, multiply back; only if it is underneath do you divide.",
      },
      {
        th: "ลืมบวกความสูงระดับสายตาในโจทย์มุมเงย ตรีโกณมิติให้ความสูงเหนือสายตาเท่านั้น",
        en: "Forgetting the eye height in an elevation problem. The trigonometry only gives the height above eye level.",
      },
    ],
    practice: [
      { generatorId: "trig.solve", seed: 1521, difficulty: 1 },
      { generatorId: "trig.solve", seed: 1522, difficulty: 2 },
      { generatorId: "trig.solve", seed: 1523, difficulty: 3 },
    ],
  },

  {
    skillId: "trig.unit-circle",
    title: {
      th: "ค่าของฟังก์ชันตรีโกณมิติของมุมใด ๆ",
      en: "Values at any angle",
    },
    intro: {
      th: "ในสามเหลี่ยมมุมฉาก มุมโตได้มากที่สุดไม่ถึง 90 องศา คำถามว่า \\sin 150^\\circ เท่ากับเท่าใดจึงไม่มีคำตอบ จนกว่าจะย้ายจากสามเหลี่ยมมาอยู่บนวงกลม จุดที่วิ่งรอบวงกลมรัศมีหนึ่งมีพิกัดเป็น \\cos\\theta กับ \\sin\\theta และวิ่งได้ไม่มีที่สิ้นสุด",
      en: "Inside a right-angled triangle an angle cannot reach ninety degrees, so asking for the sine of a hundred and fifty has no answer there. Move to a circle and it does: a point going round a circle of radius one has coordinates cos theta and sin theta, and it can go round for ever.",
    },
    bigIdea: {
      th: "ขนาดมาจากมุมอ้างอิง เครื่องหมายมาจากจตุภาค สองอย่างนี้แยกกันคิดได้เสมอ",
      en: "Size comes from the reference angle and sign comes from the quadrant. They are always two separate questions.",
    },
    ruleIds: [
      "trig.unit-circle",
      "trig.quadrant-signs",
      "trig.reference-angle",
      "trig.radian-measure",
    ],
    examples: [
      {
        generatorId: "trig.unit-circle",
        seed: 4,
        difficulty: 1,
        note: {
          th: "มุมอ้างอิงให้ขนาดเท่ากับมุมในจตุภาคแรก เหลือแค่ถามว่าจตุภาคนี้ให้เครื่องหมายอะไร",
          en: "The reference angle gives the same size as a first-quadrant angle; all that is left is what sign this quadrant carries.",
        },
      },
      { generatorId: "trig.unit-circle", seed: 11, difficulty: 2 },
      {
        generatorId: "trig.unit-circle",
        seed: 23,
        difficulty: 3,
        note: {
          th: "เอกลักษณ์ให้ขนาดมาสองค่า จตุภาคเป็นสิ่งเดียวที่บอกได้ว่าค่าไหนคือคำตอบ",
          en: "The identity offers two sizes, and only the quadrant says which of them is the answer.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ลืมเครื่องหมาย หาขนาดจากมุมอ้างอิงได้ถูกแล้วตอบทันที ทั้งที่มุมอยู่ในจตุภาคที่ค่าเป็นลบ",
        en: "Dropping the sign: the reference angle gives the size, and the answer goes down before anyone asks which quadrant it was in.",
      },
      {
        th: "คิดว่ามุมติดลบหรือมุมเกินหนึ่งรอบไม่มีค่า ทั้งที่เป็นจุดเดิมบนวงกลม",
        en: "Thinking a negative angle or one past a full turn has no value. Each is an ordinary point on the circle.",
      },
      {
        th: "สลับแกน ซินคือพิกัด y ไม่ใช่ x",
        en: "Swapping the axes. Sine is the y-coordinate, not the x.",
      },
    ],
    practice: [
      { generatorId: "trig.unit-circle", seed: 1531, difficulty: 1 },
      { generatorId: "trig.unit-circle", seed: 1532, difficulty: 2 },
      { generatorId: "trig.unit-circle", seed: 1533, difficulty: 3 },
    ],
  },

  {
    skillId: "trig.identities",
    title: {
      th: "เอกลักษณ์ตรีโกณมิติ",
      en: "Trigonometric identities",
    },
    intro: {
      th: "สมการเป็นจริงที่บางค่า เอกลักษณ์เป็นจริงที่ทุกค่า \\sin^2\\theta + \\cos^2\\theta = 1 ไม่ใช่สิ่งที่ต้องแก้หา \\theta แต่เป็นเครื่องมือที่ใช้เปลี่ยนหน้าตาของนิพจน์ได้โดยไม่เปลี่ยนค่า",
      en: "An equation is true at some values; an identity is true at all of them. Sin squared plus cos squared equals one is not something to solve for theta - it is a tool for changing how an expression looks without changing what it is.",
    },
    bigIdea: {
      th: "ติดขัดเมื่อไร ให้เปลี่ยนทุกอย่างเป็นซินกับคอส แล้วมองหาเอกลักษณ์พีทาโกรัส",
      en: "When it will not move, write everything in sine and cosine and look for the Pythagorean identity.",
    },
    ruleIds: [
      "trig.pythagorean-identity",
      "trig.quotient-identity",
      "trig.compound-angle",
      "trig.double-angle",
    ],
    examples: [
      {
        generatorId: "trig.identities",
        seed: 3,
        difficulty: 1,
        note: {
          th: "ในวงเล็บเป็นเอกลักษณ์ที่คุ้นเคย จัดรูปให้เหลือตัวเลขก่อน แล้วค่อยคูณกลับ",
          en: "The bracket is an identity you know. Turn it into a number first, then multiply back.",
        },
      },
      { generatorId: "trig.identities", seed: 9, difficulty: 2 },
      {
        generatorId: "trig.identities",
        seed: 17,
        difficulty: 4,
        note: {
          th: "มุม 75 องศาไม่มีในตาราง แต่เป็นผลบวกของสองมุมที่มีอยู่ นี่คือสิ่งที่สูตรผลบวกของมุมมีไว้ทำ",
          en: "Seventy-five degrees is in no table, but it is the sum of two angles that are. That is what the compound angle formula is for.",
        },
      },
    ],
    pitfalls: [
      {
        th: "กระจายฟังก์ชันเข้าไปในวงเล็บ \\sin(A+B) ไม่เท่ากับ \\sin A + \\sin B เด็ดขาด",
        en: "Sharing the function out over a bracket. Sin of a sum is never the sum of the sines.",
      },
      {
        th: "สลับเครื่องหมายกลางสูตร สูตรของ \\cos ใช้เครื่องหมายตรงข้ามกับโจทย์ ส่วนของ \\sin ใช้เครื่องหมายเดียวกัน",
        en: "The sign in the middle: the cosine formula flips it, the sine formula keeps it.",
      },
      {
        th: "ลืมว่า \\sin^2\\theta หมายถึง (\\sin\\theta)^2 ไม่ใช่ \\sin(\\theta^2)",
        en: "Forgetting that sin squared theta means the sine squared, not the sine of theta squared.",
      },
    ],
    practice: [
      { generatorId: "trig.identities", seed: 1541, difficulty: 1 },
      { generatorId: "trig.identities", seed: 1542, difficulty: 2 },
      { generatorId: "trig.identities", seed: 1543, difficulty: 3 },
    ],
  },

  {
    skillId: "trig.equations",
    title: {
      th: "สมการตรีโกณมิติ",
      en: "Trigonometric equations",
    },
    intro: {
      th: "สมการพหุนามมีคำตอบจำกัด แต่สมการตรีโกณมิติมีคำตอบไม่รู้จบ เพราะวงกลมวนกลับมาที่เดิมเรื่อย ๆ โจทย์จึงต้องกำหนดช่วงมาให้ และคำถามที่แท้จริงคือ ในหนึ่งรอบมีกี่จุดที่ให้ค่านี้",
      en: "A polynomial equation has finitely many solutions. A trigonometric one has infinitely many, because the circle keeps coming back round - so the question always names an interval, and what it really asks is how many points in one turn give this value.",
    },
    bigIdea: {
      th: "หามุมอ้างอิงก่อน แล้วถามว่าจตุภาคใดบ้างที่ให้เครื่องหมายนี้ ปกติจะได้สองคำตอบ ไม่ใช่หนึ่ง",
      en: "Find the reference angle, then ask which quadrants carry that sign. The usual answer is two solutions, not one.",
    },
    ruleIds: [
      "trig.general-solution",
      "trig.quadrant-signs",
      "trig.reference-angle",
    ],
    examples: [
      {
        generatorId: "trig.equations",
        seed: 6,
        difficulty: 1,
        note: {
          th: "ค่าเดียวให้สองมุม เพราะวงกลมมีสองจุดที่สูงเท่ากัน",
          en: "One value gives two angles, because two points on the circle sit at the same height.",
        },
      },
      { generatorId: "trig.equations", seed: 14, difficulty: 2 },
      {
        generatorId: "trig.equations",
        seed: 22,
        difficulty: 3,
        note: {
          th: "แยกตัวประกอบก่อน แล้วแต่ละตัวประกอบจะให้คำตอบของมันเอง รวมกันได้สี่คำตอบ",
          en: "Factorise first, and each factor brings its own solutions - four of them between them.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ตอบแค่คำตอบเดียว มุมแรกที่นึกออกมักเป็นมุมอ้างอิง ซึ่งเป็นเพียงหนึ่งในสองคำตอบ",
        en: "Giving one solution. The first angle that comes to mind is the reference angle, which is one of the two.",
      },
      {
        th: "ตอบมุมที่อยู่นอกช่วงที่โจทย์กำหนด หรือลืมปรับมุมที่ติดลบให้กลับเข้าช่วง",
        en: "Answering outside the interval asked for, or leaving a negative angle where it fell.",
      },
      {
        th: "หารทั้งสองข้างด้วย \\sin\\theta ซึ่งทำให้คำตอบที่ \\sin\\theta เป็นศูนย์หายไป ให้แยกตัวประกอบแทน",
        en: "Dividing both sides by sin theta, which throws away every solution where it is zero. Factorise instead.",
      },
    ],
    practice: [
      { generatorId: "trig.equations", seed: 1551, difficulty: 1 },
      { generatorId: "trig.equations", seed: 1552, difficulty: 2 },
      { generatorId: "trig.equations", seed: 1553, difficulty: 3 },
    ],
  },

  {
    skillId: "trig.laws",
    title: {
      th: "กฎของไซน์และกฎของโคไซน์",
      en: "The laws of sines and cosines",
    },
    intro: {
      th: "ทุกอย่างที่ผ่านมาต้องมีมุมฉากก่อนจึงจะใช้ได้ แต่สามเหลี่ยมส่วนใหญ่ในโลกไม่มีมุมฉาก กฎสองข้อนี้คือสิ่งที่ทำให้แก้สามเหลี่ยมใดก็ได้ และกฎของโคไซน์ก็คือพีทาโกรัสที่แก้ให้ใช้ได้ทั่วไปนั่นเอง",
      en: "Everything so far needed a right angle first, and most triangles in the world have none. These two laws solve any triangle at all - and the law of cosines is just Pythagoras, mended to work everywhere.",
    },
    bigIdea: {
      th: "รู้ด้านคู่กับมุมตรงข้ามของมัน ใช้กฎของไซน์ รู้สองด้านกับมุมระหว่างด้าน ใช้กฎของโคไซน์",
      en: "A side with the angle facing it means the law of sines. Two sides with the angle between them means the law of cosines.",
    },
    ruleIds: ["trig.law-of-cosines", "trig.law-of-sines", "trig.pythagoras"],
    examples: [
      {
        generatorId: "trig.laws",
        seed: 5,
        difficulty: 1,
        note: {
          th: "ถ้ามุม C เป็นมุมฉาก \\cos C เป็นศูนย์ พจน์สุดท้ายหายไป เหลือพีทาโกรัสพอดี",
          en: "If C were a right angle its cosine would be zero, the last term would vanish, and this would be Pythagoras.",
        },
      },
      { generatorId: "trig.laws", seed: 13, difficulty: 2 },
      {
        generatorId: "trig.laws",
        seed: 21,
        difficulty: 3,
        note: {
          th: "รู้ด้านครบสามด้านก็หามุมได้ ไม่ต้องวัด และมุมภายในสามเหลี่ยมมีคำตอบเดียวเสมอ",
          en: "Three sides are enough to find an angle without measuring, and an angle inside a triangle has only one answer.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ใช้มุมผิดตัวในกฎของโคไซน์ มุมที่ใช้ต้องเป็นมุมระหว่างด้านสองด้านที่รู้เท่านั้น",
        en: "Using the wrong angle in the law of cosines. It has to be the one between the two known sides.",
      },
      {
        th: "บวกพจน์สุดท้ายแทนที่จะลบ จะได้ด้านที่ยาวเกินกว่าสามเหลี่ยมนั้นจะเป็นไปได้",
        en: "Adding the last term instead of subtracting it, which gives a side longer than the triangle allows.",
      },
      {
        th: "ตอบ c^2 แทนที่จะตอบ c ลืมถอดรากที่สองในบรรทัดสุดท้าย",
        en: "Answering with c squared. The square root is the last line and it is easy to stop one line early.",
      },
    ],
    practice: [
      { generatorId: "trig.laws", seed: 1561, difficulty: 1 },
      { generatorId: "trig.laws", seed: 1562, difficulty: 2 },
      { generatorId: "trig.laws", seed: 1563, difficulty: 3 },
    ],
  },

  {
    skillId: "seq.arithmetic",
    title: {
      th: "ลำดับเลขคณิต",
      en: "Arithmetic sequences",
    },
    intro: {
      th: "ลำดับคือฟังก์ชันที่รับลำดับที่ของพจน์เป็นอินพุต ไม่ใช่ปริมาณที่วัดได้ ตัวแปรจึงเป็น n และเป็นจำนวนนับเสมอ ไม่มีพจน์ที่สองจุดห้า ลำดับเลขคณิตคือลำดับที่บวกด้วยจำนวนเดิมทุกครั้ง",
      en: "A sequence is a function whose input is a position rather than a measurement, which is why its letter is n and why n counts. There is no term two-and-a-half. An arithmetic sequence adds the same number every time.",
    },
    bigIdea: {
      th: "จากพจน์แรกถึงพจน์ที่ n มีช่องว่าง n-1 ช่อง ไม่ใช่ n ช่อง นี่คือที่มาของ n-1 ในสูตร",
      en: "There are n minus one gaps between the first term and the nth, not n. That is where the n minus one in the formula comes from.",
    },
    ruleIds: [
      "seq.common-difference",
      "seq.arithmetic-nth",
      "seq.how-many-terms",
    ],
    examples: [
      {
        generatorId: "seq.arithmetic",
        seed: 3,
        difficulty: 1,
        note: {
          th: "หาผลต่างร่วมได้จากคู่ใดก็ได้ ถ้าได้ไม่เท่ากันแสดงว่าไม่ใช่ลำดับเลขคณิต",
          en: "Any pair gives the common difference. If two pairs disagree, it is not an arithmetic sequence at all.",
        },
      },
      { generatorId: "seq.arithmetic", seed: 11, difficulty: 2 },
      {
        generatorId: "seq.arithmetic",
        seed: 19,
        difficulty: 4,
        note: {
          th: "รู้สองพจน์ก็พอ ไม่ต้องรู้พจน์แรก ระยะห่างระหว่างสองพจน์บอกผลต่างร่วมได้เลย",
          en: "Two terms are enough, and neither needs to be the first: the distance between them gives the common difference.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ใช้ n แทน n-1 ในสูตร ทำให้คำตอบเกินไปหนึ่งผลต่างร่วมเสมอ",
        en: "Using n where n minus one belongs, which overshoots by exactly one common difference every time.",
      },
      {
        th: "ลืมว่าผลต่างร่วมเป็นลบได้ ลำดับที่ลดลงก็เป็นลำดับเลขคณิตเหมือนกัน",
        en: "Forgetting that the common difference can be negative. A sequence that runs downwards is still arithmetic.",
      },
      {
        th: "นับจำนวนพจน์ด้วยการหารเฉย ๆ ต้องบวกหนึ่งเพื่อนับพจน์แรกเข้าไปด้วย เหมือนนับเสารั้ว",
        en: "Counting terms by dividing alone. Add one for the first term, the way you count fence posts.",
      },
    ],
    practice: [
      { generatorId: "seq.arithmetic", seed: 1571, difficulty: 1 },
      { generatorId: "seq.arithmetic", seed: 1572, difficulty: 2 },
      { generatorId: "seq.arithmetic", seed: 1573, difficulty: 3 },
    ],
  },

  {
    skillId: "seq.geometric",
    title: {
      th: "ลำดับเรขาคณิต",
      en: "Geometric sequences",
    },
    intro: {
      th: "เปลี่ยนจากบวกเป็นคูณ แล้วทุกอย่างในบทก่อนก็ตามมาเอง ผลต่างร่วมกลายเป็นอัตราส่วนร่วม การบวกซ้ำกลายเป็นการยกกำลัง และลำดับก็โตเร็วกว่าเดิมมาก",
      en: "Change the adding to multiplying and everything else follows. The common difference becomes a common ratio, repeated addition becomes a power, and the sequence grows far faster than before.",
    },
    bigIdea: {
      th: "เลขชี้กำลังคือจำนวนครั้งที่คูณ ซึ่งน้อยกว่าลำดับที่ของพจน์อยู่หนึ่ง เพราะพจน์แรกยังไม่ได้คูณเลย",
      en: "The exponent counts the multiplications, and it is one less than the position because the first term has not been multiplied at all.",
    },
    ruleIds: ["seq.common-ratio", "seq.geometric-nth", "exp.product"],
    examples: [
      {
        generatorId: "seq.geometric",
        seed: 4,
        difficulty: 1,
        note: {
          th: "อัตราส่วนร่วมหาได้จากพจน์หลังหารพจน์หน้า ไม่ใช่ลบ",
          en: "The ratio comes from dividing, not subtracting.",
        },
      },
      { generatorId: "seq.geometric", seed: 12, difficulty: 2 },
      {
        generatorId: "seq.geometric",
        seed: 20,
        difficulty: 4,
        note: {
          th: "สองพจน์ที่ห่างกันสองช่องให้ r กำลังสอง เครื่องหมายจึงต้องดูจากโจทย์",
          en: "Two terms two gaps apart give r squared, so the sign has to come from the question.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ใช้ r^n แทน r^{n-1} ทำให้คำตอบใหญ่เกินไป r เท่า",
        en: "Using r to the n instead of n minus one, which is r times too big.",
      },
      {
        th: "ลืมว่าอัตราส่วนร่วมเป็นลบได้ แล้วพจน์จะสลับเครื่องหมายไปมา",
        en: "Forgetting the ratio can be negative, which makes the terms alternate in sign.",
      },
      {
        th: "เอาสูตรของลำดับเลขคณิตมาใช้ เรขาคณิตคูณ ไม่ได้บวก",
        en: "Reaching for the arithmetic formula. Geometric multiplies; it does not add.",
      },
    ],
    practice: [
      { generatorId: "seq.geometric", seed: 1581, difficulty: 1 },
      { generatorId: "seq.geometric", seed: 1582, difficulty: 2 },
      { generatorId: "seq.geometric", seed: 1583, difficulty: 3 },
    ],
  },

  {
    skillId: "series.arithmetic",
    title: {
      th: "อนุกรมเลขคณิต",
      en: "Arithmetic series",
    },
    intro: {
      th: "เล่ากันว่าเกาส์ตอนเด็กถูกสั่งให้บวก 1 ถึง 100 แล้วตอบได้ในไม่กี่วินาที เขาจับ 1 กับ 100 เข้าคู่กัน 2 กับ 99 ทุกคู่ได้ 101 เท่ากันหมด และมีทั้งหมด 50 คู่ นั่นคือสูตรทั้งสูตร",
      en: "Gauss, the story goes, was told as a boy to add the numbers to a hundred and answered in seconds. He paired one with a hundred, two with ninety-nine: every pair makes a hundred and one, and there are fifty pairs. That is the whole formula.",
    },
    bigIdea: {
      th: "ผลบวกคือค่าเฉลี่ยของพจน์หัวกับท้าย คูณด้วยจำนวนพจน์",
      en: "The sum is the average of the two ends, times how many terms there are.",
    },
    ruleIds: [
      "series.arithmetic-sum",
      "seq.arithmetic-nth",
      "seq.how-many-terms",
    ],
    examples: [
      {
        generatorId: "series.arithmetic",
        seed: 7,
        difficulty: 1,
        note: {
          th: "ยังไม่รู้พจน์สุดท้าย จึงใช้สูตรรูปที่เขียนด้วยผลต่างร่วม",
          en: "The last term is not known here, so the form written with d is the one to use.",
        },
      },
      { generatorId: "series.arithmetic", seed: 15, difficulty: 2 },
      {
        generatorId: "series.arithmetic",
        seed: 23,
        difficulty: 4,
        note: {
          th: "โจทย์ให้ผลบวกมาแล้วถามจำนวนพจน์ จะได้สมการกำลังสอง และรากที่เป็นลบต้องทิ้งไป",
          en: "Given the sum and asked for the count, a quadratic appears - and its negative root has to be thrown away.",
        },
      },
    ],
    pitfalls: [
      {
        th: "นับจำนวนพจน์ผิดไปหนึ่ง โดยเฉพาะเมื่อโจทย์เขียนอนุกรมออกมาถึงพจน์สุดท้าย",
        en: "Counting the terms wrong by one, especially when the series is written out to its last term.",
      },
      {
        th: "ลืมหารสอง ผลคูณของจำนวนพจน์กับผลบวกหัวท้ายนับทุกคู่สองครั้ง",
        en: "Forgetting the halving: that product counts every pair twice.",
      },
      {
        th: "ตอบจำนวนพจน์ที่เป็นเศษส่วนหรือเป็นลบ จำนวนพจน์ต้องเป็นจำนวนนับ",
        en: "Answering with a fractional or negative number of terms. It has to be a counting number.",
      },
    ],
    practice: [
      { generatorId: "series.arithmetic", seed: 1591, difficulty: 1 },
      { generatorId: "series.arithmetic", seed: 1592, difficulty: 2 },
      { generatorId: "series.arithmetic", seed: 1593, difficulty: 3 },
    ],
  },

  {
    skillId: "series.geometric",
    title: {
      th: "อนุกรมเรขาคณิต",
      en: "Geometric series",
    },
    intro: {
      th: "สูตรผลบวกของอนุกรมเรขาคณิตมีที่มาที่สวยงาม เอาผลบวกตั้ง แล้วลบด้วย r เท่าของผลบวกนั้น พจน์ตรงกลางตัดกันหมดเหลือแค่หัวกับท้าย จัดรูปนิดเดียวก็ได้สูตร",
      en: "The formula has a pretty derivation: take the sum, subtract r times the sum, and everything in the middle cancels. Only the two ends survive, and rearranging what is left gives the formula.",
    },
    bigIdea: {
      th: "เลขชี้กำลังในสูตรผลบวกคือจำนวนพจน์ ต่างจากสูตรพจน์ทั่วไปที่เป็นจำนวนพจน์ลบหนึ่ง",
      en: "The exponent in the sum formula is how many terms there are - unlike the nth term formula, where it is one less.",
    },
    ruleIds: ["series.geometric-sum", "seq.geometric-nth", "seq.common-ratio"],
    examples: [
      {
        generatorId: "series.geometric",
        seed: 6,
        difficulty: 1,
        note: {
          th: "ตัวส่วนคือ r ลบหนึ่ง ไม่ใช่ r ถ้า r เท่ากับหนึ่งสูตรนี้ใช้ไม่ได้ เพราะตัวส่วนเป็นศูนย์",
          en: "The denominator is r minus one. If r were one the formula would divide by zero, which is why that case is excluded.",
        },
      },
      { generatorId: "series.geometric", seed: 14, difficulty: 2 },
      {
        generatorId: "series.geometric",
        seed: 22,
        difficulty: 4,
        note: {
          th: "อนุกรมเขียนออกมาถึงพจน์สุดท้าย จึงต้องหาจำนวนพจน์จากสูตรพจน์ทั่วไปก่อน",
          en: "The series is written out to its last term, so the nth term formula has to come first.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ใช้เลขชี้กำลัง n-1 ในสูตรผลบวก นั่นคือเลขชี้กำลังของสูตรพจน์ทั่วไป",
        en: "Using the nth term's exponent in the sum formula.",
      },
      {
        th: "สลับเครื่องหมายของตัวเศษหรือตัวส่วนอย่างใดอย่างหนึ่ง ผลบวกของพจน์บวกจะกลายเป็นลบ",
        en: "Turning one of the two subtractions round, which makes a sum of positive terms come out negative.",
      },
      {
        th: "ลืมวงเล็บรอบ r^n - 1 ทำให้คูณกับพจน์แรกผิด",
        en: "Losing the bracket around r to the n minus one, so the first term multiplies the wrong thing.",
      },
    ],
    practice: [
      { generatorId: "series.geometric", seed: 1601, difficulty: 1 },
      { generatorId: "series.geometric", seed: 1602, difficulty: 2 },
      { generatorId: "series.geometric", seed: 1603, difficulty: 3 },
    ],
  },

  {
    skillId: "calc.limit",
    title: {
      th: "ลิมิตของฟังก์ชัน",
      en: "Limits",
    },
    intro: {
      th: "ลิมิตไม่ได้ถามว่าฟังก์ชันมีค่าเท่าใดที่จุดนั้น แต่ถามว่ามันกำลังจะไปทางไหน สองคำถามนี้มักได้คำตอบเดียวกัน แต่ไม่เสมอไป และกรณีที่ไม่เหมือนกันนั่นแหละคือหัวใจของแคลคูลัสทั้งวิชา",
      en: "A limit does not ask what a function equals at a point; it asks where it is heading. Usually those have the same answer - but not always, and the cases where they differ are what the whole of calculus is built on.",
    },
    bigIdea: {
      th: "ลองแทนค่าก่อนเสมอ ถ้าได้จำนวนจริงก็จบ ถ้าได้ศูนย์ส่วนศูนย์แปลว่ายังตอบไม่ได้ ต้องจัดรูปก่อน",
      en: "Always substitute first. A number means you are done; zero over zero means the question has not been answered yet.",
    },
    ruleIds: ["calc.limit-substitution", "calc.limit-factor-cancel"],
    examples: [
      {
        generatorId: "calc.limit",
        seed: 5,
        difficulty: 1,
        note: {
          th: "พหุนามไม่มีรอยขาด ลิมิตจึงเท่ากับค่าที่จุดนั้นพอดี",
          en: "A polynomial has no break in it, so its limit is exactly its value there.",
        },
      },
      { generatorId: "calc.limit", seed: 13, difficulty: 2 },
      {
        generatorId: "calc.limit",
        seed: 21,
        difficulty: 3,
        note: {
          th: "ตัดตัวประกอบ x - a ทิ้งได้ เพราะ x เข้าใกล้ a แต่ไม่เคยเท่ากับ a ตัวประกอบนั้นจึงไม่เคยเป็นศูนย์จริง ๆ",
          en: "Cancelling is legal because x approaches a without ever reaching it, so that factor is never actually zero.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ตอบว่าศูนย์ส่วนศูนย์เท่ากับศูนย์ หรือเท่ากับหนึ่ง มันไม่ใช่ทั้งสองอย่าง เป็นรูปแบบที่ยังไม่กำหนดค่า",
        en: "Reading zero over zero as zero, or as one. It is neither: it is an unfinished question.",
      },
      {
        th: "ตัดตัวประกอบทั้งที่ตัวส่วนไม่ได้เป็นศูนย์ ถ้าแทนค่าได้ก็แทนเลย",
        en: "Factorising when there was no need. If substitution works, use it.",
      },
      {
        th: "คิดว่าลิมิตคือค่าของฟังก์ชันที่จุดนั้นเสมอ ฟังก์ชันอาจไม่มีค่าที่จุดนั้นเลยก็ได้ แต่ลิมิตยังมีอยู่",
        en: "Thinking the limit is always the value there. A function can be undefined at a point and still have a limit at it.",
      },
    ],
    practice: [
      { generatorId: "calc.limit", seed: 1611, difficulty: 1 },
      { generatorId: "calc.limit", seed: 1612, difficulty: 2 },
      { generatorId: "calc.limit", seed: 1613, difficulty: 3 },
    ],
  },

  {
    skillId: "calc.derivative",
    title: {
      th: "อนุพันธ์",
      en: "Derivatives",
    },
    intro: {
      th: "ความชันของเส้นตรงหาได้จากสองจุด แต่เส้นโค้งมีความชันไม่เท่ากันทุกจุด อนุพันธ์คือความชันที่จุดเดียว ซึ่งเป็นไปได้ก็เพราะลิมิต และกฎกำลังคือทางลัดที่ทำให้ไม่ต้องคิดลิมิตใหม่ทุกครั้ง",
      en: "Two points give the slope of a line, but a curve has a different slope everywhere. A derivative is the slope at a single point, which only makes sense because of limits - and the power rule is the shortcut that saves taking a limit every time.",
    },
    bigIdea: {
      th: "เอาเลขชี้กำลังลงมาคูณ แล้วลดกำลังลงหนึ่ง ทำทีละพจน์ และพจน์ที่ไม่มี x ก็หายไป",
      en: "Down in front, one off the top, term by term - and anything without an x in it disappears.",
    },
    ruleIds: [
      "calc.derivative-power",
      "calc.derivative-sum",
      "calc.derivative-constant",
      "calc.derivative-product",
    ],
    examples: [
      {
        generatorId: "calc.derivative",
        seed: 7,
        difficulty: 1,
        note: {
          th: "ทำทีละพจน์ ไม่ต้องสนใจพจน์อื่นเลยระหว่างที่ทำพจน์หนึ่ง",
          en: "One term at a time; the others can be ignored entirely while you do it.",
        },
      },
      {
        generatorId: "calc.derivative",
        seed: 15,
        difficulty: 3,
        note: {
          th: "หาอนุพันธ์ให้เสร็จก่อน แล้วจึงแทนค่า x ถ้าแทนก่อนจะเหลือแต่ค่าคงตัว ซึ่งมีอนุพันธ์เป็นศูนย์",
          en: "Differentiate completely first, then substitute. The other order leaves a constant, whose derivative is zero.",
        },
      },
      { generatorId: "calc.derivative", seed: 23, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "เอาเลขชี้กำลังลงมาคูณแล้วลืมลดกำลัง ผลลัพธ์จะยังมีดีกรีเท่าเดิม ซึ่งเป็นสัญญาณว่าผิด",
        en: "Bringing the exponent down but not reducing it. The answer keeps the same degree, which is the tell.",
      },
      {
        th: "พจน์คงตัวยังอยู่ อนุพันธ์ของค่าคงตัวเป็นศูนย์เสมอ",
        en: "Letting the constant survive. A constant always differentiates to zero.",
      },
      {
        th: "คิดว่าอนุพันธ์ของผลคูณคือผลคูณของอนุพันธ์ ลองกระจายวงเล็บแล้วเทียบดูจะเห็นว่าไม่ใช่",
        en: "Thinking the derivative of a product is the product of the derivatives. Expand the brackets and compare.",
      },
    ],
    practice: [
      { generatorId: "calc.derivative", seed: 1621, difficulty: 1 },
      { generatorId: "calc.derivative", seed: 1622, difficulty: 2 },
      { generatorId: "calc.derivative", seed: 1623, difficulty: 3 },
    ],
  },

  {
    skillId: "calc.tangent",
    title: {
      th: "ความชันและจุดสูงสุดต่ำสุด",
      en: "Slopes and turning points",
    },
    intro: {
      th: "อนุพันธ์ที่จุดหนึ่งคือความชันของเส้นสัมผัสที่จุดนั้น และที่จุดสูงสุดหรือต่ำสุดของกราฟ เส้นสัมผัสอยู่ในแนวนอนพอดี ความชันเป็นศูนย์ การหาจุดสูงสุดต่ำสุดจึงกลายเป็นการแก้สมการ f'(x) = 0",
      en: "The derivative at a point is the slope of the tangent there. At the top or the bottom of a curve that tangent is flat, so finding highs and lows becomes solving f'(x) = 0.",
    },
    bigIdea: {
      th: "ดิฟก่อน แทนค่าทีหลัง และถ้าโจทย์ถามค่าของฟังก์ชัน อย่าลืมแทนกลับลงในฟังก์ชันเดิม",
      en: "Differentiate first, substitute second - and if the question asks for a value, remember to put x back into the original function.",
    },
    ruleIds: ["calc.tangent-slope", "calc.critical-point", "calc.derivative-sum"],
    examples: [
      {
        generatorId: "calc.tangent",
        seed: 4,
        difficulty: 1,
        note: {
          th: "ความชันมาจากอนุพันธ์ ส่วนความสูงของกราฟมาจากฟังก์ชันเดิม อย่าสลับกัน",
          en: "The slope comes from the derivative and the height from the original function. They are not interchangeable.",
        },
      },
      { generatorId: "calc.tangent", seed: 12, difficulty: 2 },
      {
        generatorId: "calc.tangent",
        seed: 20,
        difficulty: 4,
        note: {
          th: "นี่คือคำถามที่แคลคูลัสถูกคิดค้นมาเพื่อตอบ ม.3 ตอบได้เฉพาะกรณีพาราโบลา ด้วยการทำเป็นกำลังสองสมบูรณ์",
          en: "This is the question calculus was invented to answer. Before it, only a parabola could be handled, by completing the square.",
        },
      },
    ],
    pitfalls: [
      {
        th: "แทนค่า x ก่อนหาอนุพันธ์ จะเหลือค่าคงตัว คำตอบจะเป็นศูนย์ทุกครั้ง",
        en: "Substituting before differentiating, which leaves a constant and gives zero every time.",
      },
      {
        th: "ตอบค่า x ทั้งที่โจทย์ถามค่าสูงสุด ค่าสูงสุดคือค่าของฟังก์ชัน ไม่ใช่ตำแหน่ง",
        en: "Answering with x when the question asked for the maximum value. The value is the height, not the place.",
      },
      {
        th: "หยุดที่จุดวิกฤตจุดแรก ลูกบาศก์มีจุดวิกฤตได้สองจุด",
        en: "Stopping at the first critical point. A cubic has two.",
      },
    ],
    practice: [
      { generatorId: "calc.tangent", seed: 1631, difficulty: 1 },
      { generatorId: "calc.tangent", seed: 1632, difficulty: 2 },
      { generatorId: "calc.tangent", seed: 1633, difficulty: 3 },
    ],
  },

  {
    skillId: "calc.integral",
    title: {
      th: "ปฏิยานุพันธ์และพื้นที่",
      en: "Antiderivatives and area",
    },
    intro: {
      th: "ถ้ารู้อนุพันธ์แล้วอยากได้ฟังก์ชันเดิมคืน ต้องทำกฎกำลังกลับทาง บวกหนึ่งที่เลขชี้กำลังแล้วหารด้วยตัวใหม่ และสิ่งที่น่าประหลาดใจที่สุดในวิชานี้คือ การทำแบบนั้นให้พื้นที่ใต้กราฟออกมาด้วย",
      en: "To get back from a derivative to the function it came from, run the power rule backwards: add one to the exponent and divide by what you get. The astonishing part - and it is astonishing - is that doing so also gives the area under the graph.",
    },
    bigIdea: {
      th: "ตรวจคำตอบได้เสมอด้วยการหาอนุพันธ์กลับ ถ้าได้ฟังก์ชันเดิมก็แปลว่าถูก",
      en: "You can always check: differentiate your answer, and if the original function comes back, it was right.",
    },
    ruleIds: [
      "calc.antiderivative-power",
      "calc.definite-integral",
      "calc.derivative-constant",
    ],
    examples: [
      {
        generatorId: "calc.integral",
        seed: 6,
        difficulty: 1,
        note: {
          th: "ค่าคงตัว C หาได้จากจุดที่กราฟผ่าน ถ้าไม่มีจุดนั้นก็มีคำตอบเป็นอนันต์",
          en: "The point given is what finds C. Without it there are infinitely many answers.",
        },
      },
      { generatorId: "calc.integral", seed: 14, difficulty: 3 },
      {
        generatorId: "calc.integral",
        seed: 22,
        difficulty: 4,
        note: {
          th: "พื้นที่กับปริพันธ์เป็นคนละอย่างกันเมื่อกราฟลงไปใต้แกน ในข้อนี้กราฟอยู่เหนือแกนตลอดช่วง",
          en: "Area and integral part company as soon as the curve dips below the axis. Here it never does.",
        },
      },
    ],
    pitfalls: [
      {
        th: "หารด้วยเลขชี้กำลังเดิมแทนที่จะเป็นตัวใหม่ ตรวจได้ด้วยการดิฟกลับ",
        en: "Dividing by the old exponent instead of the new one - which differentiating back would have caught.",
      },
      {
        th: "ลืม +C ในปริพันธ์ไม่จำกัดเขต แต่ในปริพันธ์จำกัดเขตไม่ต้องใส่ เพราะมันตัดกันเอง",
        en: "Losing the plus C in an indefinite integral - though in a definite one it cancels itself and is not needed.",
      },
      {
        th: "สลับขอบบนกับขอบล่าง จะได้คำตอบที่ถูกต้องแต่ติดลบ",
        en: "Swapping the limits, which gives the right number with the wrong sign.",
      },
    ],
    practice: [
      { generatorId: "calc.integral", seed: 1641, difficulty: 1 },
      { generatorId: "calc.integral", seed: 1642, difficulty: 2 },
      { generatorId: "calc.integral", seed: 1643, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.one-sided",
    title: {
      th: "ลิมิตซ้ายและลิมิตขวา",
      en: "One-sided limits",
    },
    intro: {
      th: "ที่ผ่านมาลิมิตมีค่าเดียวเสมอ เพราะฟังก์ชันที่เจอยังไม่ขาดตอน แต่ถ้าฟังก์ชันนิยามเป็นช่วง ๆ การเดินเข้าหาจุดหนึ่งจากทางซ้ายกับทางขวาอาจพาไปคนละที่ ลิมิตจะมีค่าก็ต่อเมื่อสองทางนั้นไปบรรจบกัน",
      en: "So far every limit has had one answer, because nothing has been torn. Define a function in pieces and walking towards a point from the left and from the right can arrive somewhere different - and the limit exists only if the two meet.",
    },
    bigIdea: {
      th: "ดูว่าจุดที่สนใจอยู่ทางไหนของรอยต่อ แล้วใช้สูตรของช่วงนั้นเท่านั้น",
      en: "Ask which side of the join you are on, and use only that side's piece.",
    },
    ruleIds: ["c1.one-sided", "c1.continuity"],
    examples: [
      {
        generatorId: "c1.one-sided",
        seed: 5,
        difficulty: 1,
        note: {
          th: "เครื่องหมายลบยกกำลังหมายถึงเข้าใกล้จากทางซ้าย คือจาก x ที่น้อยกว่า",
          en: "The little minus sign means approaching from the left - from x below the join.",
        },
      },
      { generatorId: "c1.one-sided", seed: 13, difficulty: 2 },
      {
        generatorId: "c1.one-sided",
        seed: 21,
        difficulty: 3,
        note: {
          th: "ถ้าการกระโดดเป็นศูนย์ แปลว่าสองข้างบรรจบกันพอดี ลิมิตจึงมีค่า",
          en: "A jump of zero means the two sides meet, and then the limit does exist.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ใช้สูตรผิดช่วง เครื่องหมายบวกลบเล็ก ๆ บนตัวเลขคือสิ่งเดียวที่บอกว่าใช้ช่วงไหน",
        en: "Using the wrong piece. That small plus or minus is the only thing saying which one.",
      },
      {
        th: "คิดว่าฟังก์ชันมีค่าที่จุดนั้นแปลว่าลิมิตมีค่าด้วย สองอย่างนี้ไม่เกี่ยวกัน",
        en: "Assuming that because the function has a value there, the limit exists. They are unrelated.",
      },
      {
        th: "ลืมว่าลิมิตไม่สนใจค่าที่จุดนั้นเลย สนใจแค่ว่ากำลังจะไปทางไหน",
        en: "Forgetting that a limit ignores the point itself entirely and only watches where things are heading.",
      },
    ],
    practice: [
      { generatorId: "c1.one-sided", seed: 1651, difficulty: 1 },
      { generatorId: "c1.one-sided", seed: 1652, difficulty: 2 },
      { generatorId: "c1.one-sided", seed: 1653, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.infinity",
    title: {
      th: "ลิมิตที่อนันต์และเส้นกำกับ",
      en: "Limits at infinity and asymptotes",
    },
    intro: {
      th: "อนันต์ไม่ใช่จำนวน จึงแทนค่าลงไปไม่ได้ คำถามคือกราฟเข้าใกล้อะไรเมื่อ x ใหญ่ขึ้นไม่มีที่สิ้นสุด วิธีตอบคือหารทุกพจน์ด้วยกำลังสูงสุดของตัวส่วน แล้วดูว่าอะไรเหลืออยู่",
      en: "Infinity is not a number, so it cannot be substituted. The question is what the graph approaches as x grows without end, and the way to answer it is to divide everything by the highest power below the line and see what survives.",
    },
    bigIdea: {
      th: "เมื่อ x ใหญ่มาก มีแต่พจน์ที่ดีกรีสูงสุดเท่านั้นที่สำคัญ",
      en: "Once x is large enough, only the highest-degree terms matter at all.",
    },
    ruleIds: ["c1.limit-at-infinity", "c1.asymptote"],
    examples: [
      {
        generatorId: "c1.infinity",
        seed: 3,
        difficulty: 1,
        note: {
          th: "ดีกรีเท่ากัน คำตอบจึงเป็นอัตราส่วนของสัมประสิทธิ์นำ ส่วนพจน์อื่นหายไปหมด",
          en: "Equal degrees, so the answer is the ratio of the leading coefficients and everything else vanishes.",
        },
      },
      { generatorId: "c1.infinity", seed: 11, difficulty: 2 },
      {
        generatorId: "c1.infinity",
        seed: 19,
        difficulty: 4,
        note: {
          th: "ตัวส่วนเป็นศูนย์ที่ไหน ไปดูตรงนั้นก่อน แล้วค่อยถามว่าตัวเศษเป็นศูนย์ด้วยหรือไม่",
          en: "Look where the denominator is zero first, then ask whether the numerator is zero there too.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ใช้อัตราส่วนของสัมประสิทธิ์นำทั้งที่ดีกรีไม่เท่ากัน กฎนั้นใช้ได้เฉพาะเมื่อดีกรีเท่ากัน",
        en: "Using the ratio of leading coefficients when the degrees differ. That rule needs them equal.",
      },
      {
        th: "นึกว่าตัวส่วนเป็นศูนย์แปลว่ามีเส้นกำกับเสมอ ถ้าตัวเศษเป็นศูนย์ด้วยก็เป็นแค่รูโหว่",
        en: "Assuming a zero denominator always means an asymptote. If the numerator is zero too it is only a hole.",
      },
      {
        th: "แทนค่าอนันต์ลงไปตรง ๆ อนันต์ไม่ใช่จำนวนที่แทนค่าได้",
        en: "Substituting infinity. It is not a number and cannot be put anywhere.",
      },
    ],
    practice: [
      { generatorId: "c1.infinity", seed: 1661, difficulty: 1 },
      { generatorId: "c1.infinity", seed: 1662, difficulty: 2 },
      { generatorId: "c1.infinity", seed: 1663, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.continuity",
    title: {
      th: "ความต่อเนื่อง",
      en: "Continuity",
    },
    intro: {
      th: "ต่อเนื่องที่จุดหนึ่งต้องครบสามข้อ ฟังก์ชันมีค่าที่จุดนั้น ลิมิตที่จุดนั้นมีค่า และสองอย่างนั้นเท่ากัน ข้อสามคือข้อที่มักถูกลืม เพราะกราฟอาจมีจุดโดดเดี่ยวลอยอยู่เหนือรูโหว่ก็ได้",
      en: "Three conditions, all needed: the function has a value there, the limit exists there, and the two agree. The third is the one people forget, because a graph can have a lone point floating above its own hole.",
    },
    bigIdea: {
      th: "คำถามที่พบบ่อยที่สุดคือ เลือกค่าคงตัวอย่างไรให้ต่อเนื่อง ซึ่งกลายเป็นการแก้สมการธรรมดา",
      en: "The usual form of the question is which constant makes it continuous - which turns straight back into solving an equation.",
    },
    ruleIds: ["c1.continuity", "c1.one-sided", "calc.limit-factor-cancel"],
    examples: [
      {
        generatorId: "c1.continuity",
        seed: 6,
        difficulty: 1,
        note: {
          th: "ให้ค่าของสองข้างที่รอยต่อเท่ากัน แล้วแก้หา k",
          en: "Set the two sides equal at the join and solve for k.",
        },
      },
      { generatorId: "c1.continuity", seed: 14, difficulty: 2 },
      {
        generatorId: "c1.continuity",
        seed: 22,
        difficulty: 4,
        note: {
          th: "รูโหว่แบบนี้เรียกว่าไม่ต่อเนื่องแบบถอดถอนได้ เพราะเติมค่าเดียวก็ปิดได้",
          en: "A gap like this is called removable, because one well-chosen value closes it.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ตรวจแค่ว่าฟังก์ชันมีค่าที่จุดนั้น ยังต้องตรวจว่าลิมิตมีค่าและเท่ากันด้วย",
        en: "Checking only that the function has a value there. The limit has to exist and match as well.",
      },
      {
        th: "ตอบค่าของฟังก์ชันที่รอยต่อแทนที่จะตอบค่า k",
        en: "Answering with the function's value at the join instead of with k.",
      },
      {
        th: "คิดว่าศูนย์ส่วนศูนย์แปลว่าปิดรูโหว่ไม่ได้ ตรงกันข้าม นั่นคือสัญญาณว่าปิดได้",
        en: "Reading zero over zero as unfixable. It is the opposite: it is the sign that it can be fixed.",
      },
    ],
    practice: [
      { generatorId: "c1.continuity", seed: 1671, difficulty: 1 },
      { generatorId: "c1.continuity", seed: 1672, difficulty: 2 },
      { generatorId: "c1.continuity", seed: 1673, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.trig-limit",
    title: {
      th: "ลิมิตตรีโกณมิติ",
      en: "Trigonometric limits",
    },
    intro: {
      th: "ที่มุมเล็ก ๆ ไซน์ของมุมกับตัวมุมเองแทบจะเป็นจำนวนเดียวกัน อัตราส่วนของทั้งสองจึงเข้าใกล้หนึ่ง ข้อเท็จจริงข้อนี้เป็นจริงเฉพาะเมื่อวัดมุมเป็นเรเดียน และเป็นเหตุผลที่แคลคูลัสไม่เคยใช้องศาเลย",
      en: "For a small angle, the sine of it and the angle itself are nearly the same number, so their ratio approaches one. This is only true in radians - and it is the reason calculus never uses degrees.",
    },
    bigIdea: {
      th: "ทำให้ตัวหารเป็นมุมเดียวกับที่อยู่ในไซน์ ด้วยการคูณและหารด้วยจำนวนเดียวกัน",
      en: "Make the denominator match the angle inside the sine, by multiplying and dividing by the same thing.",
    },
    ruleIds: ["c1.trig-limit", "calc.limit-substitution"],
    examples: [
      {
        generatorId: "c1.trig-limit",
        seed: 8,
        difficulty: 1,
        note: {
          th: "มุมข้างในคือ 3x ตัวหารจึงต้องเป็น 3x ด้วย ไม่ใช่ x",
          en: "The angle inside is three x, so the denominator has to become three x as well.",
        },
      },
      { generatorId: "c1.trig-limit", seed: 16, difficulty: 2 },
      {
        generatorId: "c1.trig-limit",
        seed: 24,
        difficulty: 3,
        note: {
          th: "มีไซน์สองตัว จับแต่ละตัวเข้าคู่กับมุมของมันเอง แล้วทั้งสองคู่กลายเป็นหนึ่ง",
          en: "Two sines, so pair each with its own angle and both pairs become one.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ตอบหนึ่งทันทีที่เห็นไซน์ส่วนอะไรสักอย่าง ลิมิตเป็นหนึ่งเฉพาะเมื่อมุมกับตัวหารเหมือนกันทุกประการ",
        en: "Answering one on sight. It is one only when the angle and the denominator are identical.",
      },
      {
        th: "ตอบศูนย์เพราะเห็นว่าทั้งเศษและส่วนเข้าใกล้ศูนย์ อัตราส่วนของสองสิ่งที่เข้าใกล้ศูนย์ไม่จำเป็นต้องเป็นศูนย์",
        en: "Answering zero because both parts approach zero. The ratio of two shrinking things need not shrink.",
      },
      {
        th: "ใช้สูตรนี้กับมุมที่เป็นองศา สูตรนี้ใช้ได้เฉพาะเรเดียน",
        en: "Using it in degrees. The fact is false there.",
      },
    ],
    practice: [
      { generatorId: "c1.trig-limit", seed: 1681, difficulty: 1 },
      { generatorId: "c1.trig-limit", seed: 1682, difficulty: 2 },
      { generatorId: "c1.trig-limit", seed: 1683, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.first-principles",
    title: {
      th: "อนุพันธ์จากนิยาม",
      en: "First principles",
    },
    intro: {
      th: "กฎกำลังไม่ได้มาจากไหน มาจากนิยามนี้ที่เดียว ความชันระหว่างสองจุดที่ห่างกัน h แล้วให้ h เล็กลงเรื่อย ๆ จนเข้าใกล้ศูนย์ ข้อสำคัญคือต้องหารด้วย h ก่อน แล้วจึงให้ h เป็นศูนย์ ถ้าทำกลับกันจะได้ศูนย์ส่วนศูนย์",
      en: "The power rule came from here and nowhere else: the slope between two points h apart, with h shrinking towards zero. The order matters - divide by h first, then let it go. The other way round gives zero over zero.",
    },
    bigIdea: {
      th: "พจน์ที่ไม่มี h ตัดกันหมด เหลือแต่พจน์ที่มี h เป็นตัวประกอบ ซึ่งหารด้วย h ได้",
      en: "Everything without an h in it cancels, and what is left has h as a factor - which is what makes the division legal.",
    },
    ruleIds: ["c1.first-principles", "calc.limit-factor-cancel"],
    examples: [
      {
        generatorId: "c1.first-principles",
        seed: 9,
        difficulty: 2,
        note: {
          th: "กระจาย (x + h) ยกกำลังสองแล้วลบ จะเห็นว่า x ยกกำลังสองหายไปพอดี",
          en: "Expand the square and subtract, and the x squared cancels exactly.",
        },
      },
      { generatorId: "c1.first-principles", seed: 17, difficulty: 3 },
      {
        generatorId: "c1.first-principles",
        seed: 25,
        difficulty: 4,
        note: {
          th: "ฟังก์ชันที่ไม่ใช่พหุนาม ต้องรวมเศษส่วนก่อน แล้ว h จะโผล่มาเป็นตัวประกอบเอง",
          en: "Not a polynomial: combine the fractions first and the h appears as a factor on its own.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ให้ h เป็นศูนย์ก่อนหาร จะได้ศูนย์ส่วนศูนย์ซึ่งยังตอบไม่ได้",
        en: "Letting h be zero before dividing, which gives zero over zero and answers nothing.",
      },
      {
        th: "ลืมกระจาย (x + h) ยกกำลังสองให้ครบ พจน์ 2xh คือพจน์ที่ให้คำตอบ",
        en: "Not expanding the square fully. The cross term is the one that survives to become the answer.",
      },
      {
        th: "ลืมว่าทั้งก้อนต้องหารด้วย h ไม่ใช่แค่พจน์แรก",
        en: "Dividing only the first term by h instead of the whole thing.",
      },
    ],
    practice: [
      { generatorId: "c1.first-principles", seed: 1691, difficulty: 1 },
      { generatorId: "c1.first-principles", seed: 1692, difficulty: 2 },
      { generatorId: "c1.first-principles", seed: 1693, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.product-quotient",
    title: {
      th: "กฎผลคูณและกฎผลหาร",
      en: "The product and quotient rules",
    },
    intro: {
      th: "อนุพันธ์ของผลบวกคือผลบวกของอนุพันธ์ ซึ่งง่ายมาก แต่อนุพันธ์ของผลคูณไม่ใช่ผลคูณของอนุพันธ์ เพราะเมื่อสองสิ่งเปลี่ยนแปลงพร้อมกัน การเปลี่ยนแปลงมาจากสองทาง",
      en: "The derivative of a sum is the sum of the derivatives, which is as easy as it looks. The derivative of a product is not the product of the derivatives, because when two things change at once the change comes from two places.",
    },
    bigIdea: {
      th: "กฎผลหารคือกฎผลคูณที่เปลี่ยนบวกเป็นลบ และลำดับสำคัญ เพราะการลบสลับที่ไม่ได้",
      en: "The quotient rule is the product rule with a minus - and there the order matters, because subtraction does not commute.",
    },
    ruleIds: ["c1.product-rule", "c1.quotient-rule", "calc.derivative-power"],
    examples: [
      {
        generatorId: "c1.product-quotient",
        seed: 4,
        difficulty: 1,
        note: {
          th: "ข้อนี้กระจายวงเล็บก่อนก็ได้คำตอบเดียวกัน เป็นวิธีตรวจที่ใช้ได้ฟรี",
          en: "This one can be multiplied out first, which is a free check on the rule.",
        },
      },
      { generatorId: "c1.product-quotient", seed: 12, difficulty: 2 },
      {
        generatorId: "c1.product-quotient",
        seed: 20,
        difficulty: 3,
        note: {
          th: "ตัวเศษของคำตอบกลายเป็นค่าคงตัว เพราะพจน์ที่มี x ตัดกันหมดพอดี",
          en: "The numerator collapses to a constant here: the x terms cancel each other exactly.",
        },
      },
    ],
    pitfalls: [
      {
        th: "คูณอนุพันธ์ของสองตัวเข้าด้วยกัน ลองกระจายวงเล็บแล้วเทียบดูจะเห็นทันทีว่าไม่ใช่",
        en: "Multiplying the two derivatives together. Expand the brackets and compare, and it is immediately obvious that it is not that.",
      },
      {
        th: "ลบสลับที่ในกฎผลหาร ได้คำตอบที่ถูกต้องแต่ติดลบทั้งก้อน",
        en: "Subtracting backwards in the quotient rule, which gives the right answer with the wrong sign.",
      },
      {
        th: "ลืมยกกำลังสองที่ตัวส่วน",
        en: "Forgetting to square the denominator.",
      },
    ],
    practice: [
      { generatorId: "c1.product-quotient", seed: 1701, difficulty: 1 },
      { generatorId: "c1.product-quotient", seed: 1702, difficulty: 2 },
      { generatorId: "c1.product-quotient", seed: 1703, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.trig-derivative",
    title: {
      th: "อนุพันธ์ของฟังก์ชันตรีโกณมิติ",
      en: "Trigonometric derivatives",
    },
    intro: {
      th: "ความชันของกราฟไซน์ที่จุดใดก็ตาม เท่ากับค่าของคอสที่จุดนั้นพอดี ที่ยอดคลื่นของไซน์ ความชันเป็นศูนย์ และคอสก็เป็นศูนย์ที่นั่นเช่นกัน ข้อนี้เป็นจริงเฉพาะเมื่อวัดมุมเป็นเรเดียน",
      en: "The slope of the sine graph at any point is exactly the cosine there. At the crest of the wave the slope is zero, and the cosine is zero there too. All of this is true only in radians.",
    },
    bigIdea: {
      th: "ซินไปคอส คอสไปลบซิน วนสี่ครั้งกลับมาที่เดิม เครื่องหมายลบตัวเดียวนั้นคือสิ่งเดียวที่ต้องจำ",
      en: "Sine to cosine, cosine to minus sine; four steps and you are back. That one minus is the only thing to remember.",
    },
    ruleIds: ["c1.trig-derivative", "c1.product-rule", "calc.derivative-sum"],
    examples: [
      {
        generatorId: "c1.trig-derivative",
        seed: 6,
        difficulty: 1,
        note: {
          th: "เครื่องหมายลบมาที่พจน์ของคอสเท่านั้น ไม่ใช่ทั้งสองพจน์",
          en: "The minus lands on the cosine's term only, not on both.",
        },
      },
      { generatorId: "c1.trig-derivative", seed: 14, difficulty: 2 },
      {
        generatorId: "c1.trig-derivative",
        seed: 22,
        difficulty: 3,
        note: {
          th: "ถ้าจำอนุพันธ์ของ \\tan ไม่ได้ ก็หาเองได้จากกฎผลหารกับเอกลักษณ์พีทาโกรัส",
          en: "If the derivative of tan will not come, it can be rebuilt from the quotient rule and the Pythagorean identity.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ลืมเครื่องหมายลบของอนุพันธ์ของคอส",
        en: "Losing the minus on the cosine's derivative.",
      },
      {
        th: "ใช้กฎกำลังกับ \\sin x ราวกับว่าเป็น x ยกกำลังอะไรสักอย่าง",
        en: "Treating sine as though it were a power of x.",
      },
      {
        th: "ใช้สูตรเหล่านี้กับมุมที่วัดเป็นองศา ซึ่งใช้ไม่ได้",
        en: "Using these in degrees, where they are simply false.",
      },
    ],
    practice: [
      { generatorId: "c1.trig-derivative", seed: 1711, difficulty: 1 },
      { generatorId: "c1.trig-derivative", seed: 1712, difficulty: 2 },
      { generatorId: "c1.trig-derivative", seed: 1713, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.exp-log-derivative",
    title: {
      th: "อนุพันธ์ของเอกซ์โพเนนเชียลและลอการิทึม",
      en: "Exponential and logarithmic derivatives",
    },
    intro: {
      th: "e ยกกำลัง x เป็นฟังก์ชันเดียวที่อนุพันธ์เท่ากับตัวมันเอง นั่นไม่ใช่เรื่องบังเอิญ แต่เป็นนิยามของจำนวน e เลยทีเดียว และอนุพันธ์ของ \\ln x กลายเป็นหนึ่งส่วน x ซึ่งไม่มีลอการิทึมเหลืออยู่เลย",
      en: "The exponential is the one function that is its own derivative - not a coincidence but the definition of the number e. And the logarithm differentiates to one over x, with no logarithm left in it at all.",
    },
    bigIdea: {
      th: "กฎกำลังใช้เมื่อตัวแปรอยู่ที่ฐาน ไม่ใช่เมื่อตัวแปรอยู่ที่เลขชี้กำลัง",
      en: "The power rule is for when the variable is the base. When the variable is the exponent, it does not apply at all.",
    },
    ruleIds: ["c1.exp-log-derivative", "c1.product-rule", "calc.derivative-sum"],
    examples: [
      {
        generatorId: "c1.exp-log-derivative",
        seed: 5,
        difficulty: 1,
        note: {
          th: "พจน์เอกซ์โพเนนเชียลไม่เปลี่ยนเลย ส่วนพจน์อื่นทำตามปกติ",
          en: "The exponential term comes through untouched; everything else is as usual.",
        },
      },
      { generatorId: "c1.exp-log-derivative", seed: 13, difficulty: 3 },
      {
        generatorId: "c1.exp-log-derivative",
        seed: 21,
        difficulty: 4,
        note: {
          th: "ทั้งสองพจน์มี e ยกกำลัง x ร่วมกัน ดึงออกมาแล้วได้รูปที่หาจุดวิกฤตต่อได้เลย",
          en: "Both terms share the exponential; taking it out gives the form a critical point is read straight off.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ใช้กฎกำลังกับ e ยกกำลัง x ได้เป็น x คูณ e ยกกำลัง x ลบหนึ่ง ซึ่งไม่ใช่",
        en: "Applying the power rule to the exponential, which is not what it is for.",
      },
      {
        th: "คิดว่าอนุพันธ์ของ \\ln x ยังมี \\ln อยู่",
        en: "Expecting a logarithm to survive in its own derivative.",
      },
      {
        th: "ใช้กฎผลคูณแล้วเขียนแค่พจน์เดียว กฎผลคูณมีสองพจน์เสมอ",
        en: "Writing only one term of the product rule. There are always two.",
      },
    ],
    practice: [
      { generatorId: "c1.exp-log-derivative", seed: 1721, difficulty: 1 },
      { generatorId: "c1.exp-log-derivative", seed: 1722, difficulty: 2 },
      { generatorId: "c1.exp-log-derivative", seed: 1723, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.chain-power",
    title: {
      th: "กฎลูกโซ่กับกำลัง",
      en: "The chain rule on a power",
    },
    intro: {
      th: "(3x+1) ยกกำลังห้า กระจายออกมาก็ได้ แต่จะได้พหุนามหกพจน์ กฎลูกโซ่ทำให้ตอบได้ในบรรทัดเดียว ดิฟข้างนอกโดยเก็บข้างในไว้เหมือนเดิม แล้วคูณด้วยอนุพันธ์ของข้างใน",
      en: "A bracket to the fifth could be expanded, and it would give six terms. The chain rule answers it in one line: differentiate the outside, leave the inside alone, then multiply by the derivative of the inside.",
    },
    bigIdea: {
      th: "ตัวคูณตัวหลังคือสิ่งที่ลืมกันบ่อยที่สุดในวิชานี้ และคำตอบที่ลืมมันไปก็ยังดูสมเหตุสมผลทุกอย่าง",
      en: "That last factor is the most-forgotten thing in the subject, and an answer missing it looks entirely reasonable.",
    },
    ruleIds: ["c1.chain-rule", "calc.derivative-power"],
    examples: [
      {
        generatorId: "c1.chain-power",
        seed: 3,
        difficulty: 1,
        note: {
          th: "ตัวเลขข้างหน้าคือเลขชี้กำลังคูณกับอนุพันธ์ของข้างใน",
          en: "The number in front is the exponent times the inside's derivative.",
        },
      },
      { generatorId: "c1.chain-power", seed: 11, difficulty: 2 },
      {
        generatorId: "c1.chain-power",
        seed: 19,
        difficulty: 3,
        note: {
          th: "ข้างในเป็นกำลังสอง อนุพันธ์จึงไม่ใช่ค่าคงตัว รวมเข้ากับสัมประสิทธิ์ไม่ได้",
          en: "The inside is quadratic here, so its derivative is not a constant and cannot be folded into the coefficient.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ลืมคูณด้วยอนุพันธ์ของข้างใน",
        en: "Forgetting to multiply by the derivative of the inside.",
      },
      {
        th: "ลดเลขชี้กำลังของข้างในแทนที่จะเป็นข้างนอก ข้างในไม่เปลี่ยนเลย",
        en: "Reducing the inside's power instead of the outside's. The inside does not change at all.",
      },
      {
        th: "กระจายวงเล็บออกมาก่อน ซึ่งได้คำตอบเหมือนกันแต่ช้ากว่ามาก และพลาดง่ายกว่า",
        en: "Expanding the bracket first. It gives the same answer far more slowly, with more places to slip.",
      },
    ],
    practice: [
      { generatorId: "c1.chain-power", seed: 1731, difficulty: 1 },
      { generatorId: "c1.chain-power", seed: 1732, difficulty: 2 },
      { generatorId: "c1.chain-power", seed: 1733, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.chain-transcendental",
    title: {
      th: "กฎลูกโซ่กับฟังก์ชันอดิศัย",
      en: "The chain rule on sines and exponentials",
    },
    intro: {
      th: "กฎเดิมทุกอย่าง เพียงแต่ข้างนอกเป็นไซน์ เอกซ์โพเนนเชียล หรือลอการิทึม อนุพันธ์ของ sin 2x ไม่ใช่ cos 2x แต่เป็น 2cos 2x และความต่างนั้นคือทั้งหมดของบทนี้",
      en: "The same rule, with a sine or an exponential or a logarithm on the outside. The derivative of sin 2x is not cos 2x but twice it, and that difference is the whole lesson.",
    },
    bigIdea: {
      th: "ข้างในไม่เปลี่ยนเลยตลอดทั้งกระบวนการ มันแค่ถูกคัดลอกลงมาในคำตอบ แล้วคูณด้วยอนุพันธ์ของมันเอง",
      en: "The inside never changes. It is copied down into the answer as it was, and multiplied by its own derivative.",
    },
    ruleIds: ["c1.chain-rule", "c1.trig-derivative", "c1.exp-log-derivative"],
    examples: [
      {
        generatorId: "c1.chain-transcendental",
        seed: 7,
        difficulty: 1,
        note: {
          th: "คอสยังคงมีวงเล็บเดิมอยู่ข้างใน ไม่ได้เปลี่ยนเป็นอย่างอื่น",
          en: "The cosine keeps exactly the same bracket inside it.",
        },
      },
      { generatorId: "c1.chain-transcendental", seed: 15, difficulty: 2 },
      {
        generatorId: "c1.chain-transcendental",
        seed: 23,
        difficulty: 3,
        note: {
          th: "ลอการิทึมให้หนึ่งส่วนข้างใน แล้วตัวคูณจากข้างในไปอยู่บนเศษ",
          en: "The logarithm gives one over the inside, and the chain factor lands on top.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ลืมตัวคูณจากข้างใน โดยเฉพาะกับลอการิทึมที่มันไปอยู่บนเศษของเศษส่วน",
        en: "Losing the chain factor, especially with a logarithm where it hides on top of a fraction.",
      },
      {
        th: "เปลี่ยนข้างในไปด้วย เช่น ดิฟ sin 2x ได้ cos 2 ข้างในต้องเหมือนเดิมเสมอ",
        en: "Changing the inside as well. It stays exactly as it was.",
      },
      {
        th: "ลืมเครื่องหมายลบเมื่อข้างนอกเป็นคอส",
        en: "Losing the minus when the outside is a cosine.",
      },
    ],
    practice: [
      { generatorId: "c1.chain-transcendental", seed: 1741, difficulty: 1 },
      { generatorId: "c1.chain-transcendental", seed: 1742, difficulty: 2 },
      { generatorId: "c1.chain-transcendental", seed: 1743, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.chain-combined",
    title: {
      th: "กฎลูกโซ่ร่วมกับกฎอื่น",
      en: "The chain rule with the others",
    },
    intro: {
      th: "ของจริงไม่ได้มาทีละกฎ ผลคูณที่มีวงเล็บยกกำลังอยู่ข้างใน ต้องใช้ทั้งกฎผลคูณและกฎลูกโซ่ และถ้าซ้อนกันสามชั้นก็คูณสามตัว วิธีที่ไม่พลาดคือถามว่าอะไรอยู่ข้างนอกสุด แล้วปอกเข้าไปทีละชั้น",
      en: "Real questions do not arrive one rule at a time. A product with a bracket-to-a-power inside needs both rules, and three layers need three factors. The way not to slip is to ask what is outermost and peel inwards.",
    },
    bigIdea: {
      th: "มีกี่ชั้นก็คูณกันกี่ตัว และอย่าหยุดจนกว่าจะถึงตัว x จริง ๆ",
      en: "As many layers as there are, that many factors - and do not stop until you reach the x itself.",
    },
    ruleIds: ["c1.chain-depth", "c1.chain-rule", "c1.product-rule"],
    examples: [
      {
        generatorId: "c1.chain-combined",
        seed: 5,
        difficulty: 1,
        note: {
          th: "กฎผลคูณก่อน แล้วพจน์ที่สองของมันต้องใช้กฎลูกโซ่",
          en: "Product rule first, and its second term is where the chain rule comes in.",
        },
      },
      { generatorId: "c1.chain-combined", seed: 13, difficulty: 2 },
      {
        generatorId: "c1.chain-combined",
        seed: 21,
        difficulty: 3,
        note: {
          th: "สามชั้น กำลังสอง ไซน์ และวงเล็บ จึงมีสามตัวคูณกัน",
          en: "Three layers - the square, the sine and the bracket - so three factors.",
        },
      },
    ],
    pitfalls: [
      {
        th: "หยุดที่สองชั้นทั้งที่มีสามชั้น",
        en: "Stopping after two layers when there are three.",
      },
      {
        th: "ใช้กฎลูกโซ่แล้วลืมว่ายังต้องใช้กฎผลคูณอยู่ หรือกลับกัน",
        en: "Using one rule and forgetting the other is still needed.",
      },
      {
        th: "สับสนว่าอะไรคือข้างนอก ให้ถามว่าถ้าคิดเลขจริง ๆ จะทำอะไรเป็นอย่างสุดท้าย นั่นคือชั้นนอกสุด",
        en: "Losing track of what is outermost. Ask what you would do last of all if you were putting a number in, because that is the outside.",
      },
    ],
    practice: [
      { generatorId: "c1.chain-combined", seed: 1751, difficulty: 1 },
      { generatorId: "c1.chain-combined", seed: 1752, difficulty: 2 },
      { generatorId: "c1.chain-combined", seed: 1753, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.implicit",
    title: {
      th: "อนุพันธ์โดยปริยาย",
      en: "Implicit differentiation",
    },
    intro: {
      th: "วงกลม x กำลังสอง บวก y กำลังสอง เท่ากับ 25 ไม่ใช่ฟังก์ชัน เพราะ x หนึ่งค่าให้ y สองค่า แต่ความชันที่จุดหนึ่ง ๆ ยังมีอยู่จริง วิธีหาคือดิฟทั้งสองข้างโดยถือว่า y เป็นฟังก์ชันของ x ซึ่งมันเป็นจริงในละแวกใกล้ ๆ จุดนั้นเสมอ",
      en: "A circle is not a function - one x gives two y values - but the slope at a point is perfectly real. Differentiate both sides treating y as a function of x, which near any one point it is.",
    },
    bigIdea: {
      th: "ทุกครั้งที่ดิฟ y จะมี dy/dx ติดออกมา นั่นคือกฎลูกโซ่ทำงาน ไม่ใช่กฎใหม่",
      en: "Every y you differentiate hands back a dy/dx. That is the chain rule at work, not a new rule.",
    },
    ruleIds: ["c1.implicit", "c1.chain-rule", "c1.product-rule"],
    examples: [
      {
        generatorId: "c1.implicit",
        seed: 4,
        difficulty: 1,
        note: {
          th: "คำตอบมีทั้ง x และ y ซึ่งถูกต้อง เพราะความชันขึ้นกับว่าอยู่จุดไหนของวงกลม",
          en: "The answer contains both letters, which is correct: the slope depends on where you are on the circle.",
        },
      },
      { generatorId: "c1.implicit", seed: 12, difficulty: 2 },
      {
        generatorId: "c1.implicit",
        seed: 20,
        difficulty: 3,
        note: {
          th: "พจน์ xy ต้องใช้กฎผลคูณ และ y ในนั้นก็ให้ dy/dx ออกมาด้วย",
          en: "The xy term needs the product rule, and the y in it hands back a dy/dx as well.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ดิฟ y กำลังสองได้ 2y โดยลืม dy/dx นั่นคือการดิฟเทียบกับ y ไม่ใช่เทียบกับ x",
        en: "Differentiating y squared to 2y. That is with respect to y, and the question is with respect to x.",
      },
      {
        th: "ลืมกฎผลคูณที่พจน์ซึ่งมีทั้ง x และ y",
        en: "Forgetting the product rule on a term containing both letters.",
      },
      {
        th: "คิดว่าคำตอบที่มี y อยู่ด้วยเป็นคำตอบที่ยังทำไม่เสร็จ ซึ่งไม่ใช่ นั่นคือรูปปกติของคำตอบ",
        en: "Treating an answer with a y in it as unfinished. That is simply what these answers look like.",
      },
    ],
    practice: [
      { generatorId: "c1.implicit", seed: 1761, difficulty: 1 },
      { generatorId: "c1.implicit", seed: 1762, difficulty: 2 },
      { generatorId: "c1.implicit", seed: 1763, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.monotonic",
    title: {
      th: "ช่วงที่เพิ่ม ลด และความเว้า",
      en: "Rising, falling and bending",
    },
    intro: {
      th: "อนุพันธ์อันดับหนึ่งบอกว่ากราฟกำลังไปทางไหน อนุพันธ์อันดับสองบอกว่ามันกำลังโค้งไปทางไหน สองอย่างนี้รวมกันวาดกราฟได้โดยไม่ต้องจุดแม้แต่จุดเดียว",
      en: "The first derivative says which way the graph is going. The second says which way it is bending. Between them a graph can be drawn without plotting a single point.",
    },
    bigIdea: {
      th: "จุดเปลี่ยนเว้าต้องให้อนุพันธ์อันดับสองเปลี่ยนเครื่องหมาย ไม่ใช่แค่เป็นศูนย์",
      en: "An inflection needs the second derivative to change sign, not merely to vanish.",
    },
    ruleIds: [
      "c1.increasing-decreasing",
      "c1.inflection",
      "calc.critical-point",
    ],
    examples: [
      {
        generatorId: "c1.monotonic",
        seed: 6,
        difficulty: 1,
        note: {
          th: "ก่อนจุดวิกฤตแรก ความชันเป็นบวก กราฟจึงกำลังขึ้น",
          en: "Before the first critical point the slope is positive, so the graph is climbing.",
        },
      },
      { generatorId: "c1.monotonic", seed: 14, difficulty: 2 },
      {
        generatorId: "c1.monotonic",
        seed: 22,
        difficulty: 3,
        note: {
          th: "จุดเปลี่ยนเว้าของลูกบาศก์อยู่ตรงกลางระหว่างจุดวิกฤตสองจุดพอดีเสมอ",
          en: "A cubic's inflection always sits exactly halfway between its two critical points.",
        },
      },
    ],
    pitfalls: [
      {
        th: "สับสนระหว่างจุดวิกฤตกับจุดเปลี่ยนเว้า อย่างแรกความชันเป็นศูนย์ อย่างหลังความโค้งเปลี่ยนทิศ",
        en: "Mixing up a critical point with an inflection. One has zero slope; the other changes curvature.",
      },
      {
        th: "คิดว่าอนุพันธ์อันดับสองเป็นศูนย์แปลว่ามีจุดเปลี่ยนเว้าเสมอ x ยกกำลังสี่เป็นตัวอย่างค้าน",
        en: "Assuming a zero second derivative always means an inflection. x to the fourth is the counterexample.",
      },
      {
        th: "ตอบค่า y ทั้งที่โจทย์ถามค่า x หรือกลับกัน",
        en: "Answering with y when the question asked for x, or the other way round.",
      },
    ],
    practice: [
      { generatorId: "c1.monotonic", seed: 1771, difficulty: 1 },
      { generatorId: "c1.monotonic", seed: 1772, difficulty: 2 },
      { generatorId: "c1.monotonic", seed: 1773, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.extrema",
    title: {
      th: "ค่าสูงสุดและค่าต่ำสุด",
      en: "Maxima and minima",
    },
    intro: {
      th: "ที่ยอดเขาและที่ก้นหุบเขา พื้นราบเหมือนกัน ความชันเป็นศูนย์ทั้งคู่ สิ่งที่แยกสองอย่างนี้ออกจากกันคือความโค้ง ถ้าโค้งขึ้นก็เป็นก้นหุบเขา ถ้าโค้งลงก็เป็นยอดเขา",
      en: "The top of a hill and the bottom of a valley are both flat. What tells them apart is the bending: curving upwards makes a valley floor, curving downwards makes a summit.",
    },
    bigIdea: {
      th: "บนช่วงปิด ค่าสูงสุดอาจอยู่ที่ปลายช่วงก็ได้ ซึ่งความชันตรงนั้นไม่จำเป็นต้องเป็นศูนย์เลย",
      en: "On a closed interval the winner can be an endpoint, where the slope is nothing like zero.",
    },
    ruleIds: [
      "c1.second-derivative",
      "c1.closed-interval",
      "calc.critical-point",
    ],
    examples: [
      {
        generatorId: "c1.extrema",
        seed: 3,
        difficulty: 1,
        note: {
          th: "อนุพันธ์อันดับสองเป็นลบที่จุดนี้ กราฟจึงโค้งลง เป็นยอด",
          en: "The second derivative is negative here, so the graph bends downwards: a summit.",
        },
      },
      { generatorId: "c1.extrema", seed: 11, difficulty: 2 },
      {
        generatorId: "c1.extrema",
        seed: 19,
        difficulty: 3,
        note: {
          th: "คิดค่าที่จุดวิกฤตและที่ปลายช่วงทั้งสอง แล้วเทียบกัน ไม่มีทางลัด",
          en: "Work out the critical point and both ends, then compare. There is no shortcut.",
        },
      },
    ],
    pitfalls: [
      {
        th: "อ่านการทดสอบอนุพันธ์อันดับสองกลับด้าน บวกคือต่ำสุด ลบคือสูงสุด",
        en: "Reading the second derivative test backwards. Positive is a minimum.",
      },
      {
        th: "ลืมคิดค่าที่ปลายช่วงเมื่อโจทย์ให้ช่วงปิดมา",
        en: "Forgetting the endpoints when the question gives a closed interval.",
      },
      {
        th: "ตอบตำแหน่งแทนค่า อ่านโจทย์ให้ชัดว่าถามว่าที่ไหนหรือถามว่าเท่าไร",
        en: "Answering with the place instead of the value. Read which one is being asked for.",
      },
    ],
    practice: [
      { generatorId: "c1.extrema", seed: 1781, difficulty: 1 },
      { generatorId: "c1.extrema", seed: 1782, difficulty: 2 },
      { generatorId: "c1.extrema", seed: 1783, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.optimisation",
    title: {
      th: "โจทย์หาค่าเหมาะที่สุด",
      en: "Optimisation",
    },
    intro: {
      th: "รั้วยาวเท่านี้ ล้อมพื้นที่ได้มากที่สุดเท่าไร เป็นคำถามที่ถามกันมานานก่อนจะมีแคลคูลัส ม.3 ตอบได้เฉพาะรูปสี่เหลี่ยม ด้วยการทำเป็นกำลังสองสมบูรณ์ แคลคูลัสตอบได้ทุกรูป ด้วยวิธีเดียวกันหมด",
      en: "How much can this much fence enclose? People asked long before calculus existed. Completing the square answered it for a rectangle; calculus answers it for anything, the same way every time.",
    },
    bigIdea: {
      th: "งานหลักไม่ใช่การดิฟ แต่คือการเขียนสิ่งที่ต้องการให้เป็นฟังก์ชันของตัวแปรตัวเดียว",
      en: "The work is not the differentiating. It is getting the thing you want written as a function of one variable.",
    },
    ruleIds: ["calc.critical-point", "c1.second-derivative", "model.equation"],
    examples: [
      {
        generatorId: "c1.optimisation",
        seed: 8,
        difficulty: 1,
        note: {
          th: "คำตอบคือรูปจัตุรัส ซึ่งเป็นคำตอบของโจทย์เส้นรอบรูปคงที่เสมอ",
          en: "The answer is a square, which it always is when only the perimeter is fixed.",
        },
      },
      {
        generatorId: "c1.optimisation",
        seed: 16,
        difficulty: 2,
        note: {
          th: "มีกำแพงช่วยด้านหนึ่ง คำตอบจึงไม่ใช่จัตุรัสอีกต่อไป ด้านที่ขนานกำแพงยาวเป็นสองเท่า",
          en: "With a wall doing one side, the answer is no longer a square: the side along the wall is twice the other.",
        },
      },
      { generatorId: "c1.optimisation", seed: 24, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "ดิฟทั้งที่ยังมีสองตัวแปร ต้องกำจัดตัวหนึ่งด้วยเงื่อนไขก่อนเสมอ",
        en: "Differentiating while two variables are still there. One has to go first, using the constraint.",
      },
      {
        th: "ตอบความยาวด้านทั้งที่โจทย์ถามพื้นที่",
        en: "Answering with a side length when the question asked for an area.",
      },
      {
        th: "ลืมตรวจว่าเป็นสูงสุดจริงหรือต่ำสุดจริง ด้วยอนุพันธ์อันดับสองหรือด้วยเหตุผลของโจทย์",
        en: "Not checking that it really is the maximum, either with the second derivative or with the sense of the problem.",
      },
    ],
    practice: [
      { generatorId: "c1.optimisation", seed: 1791, difficulty: 1 },
      { generatorId: "c1.optimisation", seed: 1792, difficulty: 2 },
      { generatorId: "c1.optimisation", seed: 1793, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.related-rates",
    title: {
      th: "อัตราการเปลี่ยนแปลงที่สัมพันธ์กัน",
      en: "Related rates",
    },
    intro: {
      th: "ลูกโป่งถูกเป่าด้วยอัตราคงที่ รัศมีโตขึ้นเรื่อย ๆ แต่ปริมาตรโตเร็วกว่ามาก และยิ่งลูกโป่งใหญ่ ปริมาตรยิ่งโตเร็วขึ้นอีก ความสัมพันธ์ระหว่างอัตราสองอย่างนี้คือกฎลูกโซ่ที่มีเวลาเป็นตัวแปร",
      en: "A balloon is inflated steadily. Its radius grows, but its volume grows much faster - and the bigger the balloon, the faster still. The link between those two rates is the chain rule with time as the variable.",
    },
    bigIdea: {
      th: "ดิฟสมการทั้งสมการเทียบกับเวลา แล้วค่อยแทนค่าที่ขณะนั้น ห้ามแทนค่าก่อนดิฟ",
      en: "Differentiate the whole equation with respect to time, and only then put in the values for that instant. Never the other way round.",
    },
    ruleIds: ["c1.related-rates", "c1.chain-rule", "c1.implicit"],
    examples: [
      {
        generatorId: "c1.related-rates",
        seed: 5,
        difficulty: 1,
        note: {
          th: "คำตอบขึ้นกับขนาดปัจจุบันด้วย ไม่ใช่ค่าคงตัว สี่เหลี่ยมใหญ่โตเร็วกว่าสี่เหลี่ยมเล็ก",
          en: "The answer depends on the current size: a big square gains area faster than a small one, at the same growth of side.",
        },
      },
      { generatorId: "c1.related-rates", seed: 13, difficulty: 3 },
      {
        generatorId: "c1.related-rates",
        seed: 21,
        difficulty: 4,
        note: {
          th: "คำตอบติดลบ เพราะปลายบันไดกำลังเลื่อนลง เครื่องหมายมีความหมายจริง ๆ",
          en: "The answer is negative because the top of the ladder is descending. The sign is carrying real information.",
        },
      },
    ],
    pitfalls: [
      {
        th: "แทนค่าก่อนดิฟ จะเหลือค่าคงตัว อัตราการเปลี่ยนแปลงกลายเป็นศูนย์",
        en: "Substituting before differentiating, which leaves a constant and a rate of zero.",
      },
      {
        th: "ลืม dr/dt ตอนดิฟ ซึ่งคือลืมว่ารัศมีก็เปลี่ยนตามเวลา",
        en: "Losing the dr/dt, which is forgetting that the radius depends on time as well.",
      },
      {
        th: "ทิ้งเครื่องหมายลบ ทั้งที่มันบอกว่าปริมาณนั้นกำลังลดลง",
        en: "Dropping a minus sign that is telling you the quantity is shrinking.",
      },
    ],
    practice: [
      { generatorId: "c1.related-rates", seed: 1801, difficulty: 1 },
      { generatorId: "c1.related-rates", seed: 1802, difficulty: 2 },
      { generatorId: "c1.related-rates", seed: 1803, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.rolle",
    title: {
      th: "ทฤษฎีบทของโรล",
      en: "Rolle's theorem",
    },
    intro: {
      th: "ถ้าเดินขึ้นเขาแล้วกลับลงมาที่ระดับความสูงเดิม ต้องมีจุดหนึ่งที่พื้นราบ เพราะขึ้นไปแล้วต้องลง และระหว่างนั้นต้องมียอด ทฤษฎีบทนี้พูดแค่นั้น แต่พูดอย่างแม่นยำพอที่จะใช้พิสูจน์อย่างอื่นได้อีกมาก",
      en: "Walk up a hill and come back to the height you started at, and somewhere the ground was level - what goes up must come down, and between them is a top. That is all the theorem says, said precisely enough to prove a great deal else.",
    },
    bigIdea: {
      th: "ทฤษฎีบทรับประกันว่าจุดนั้นมีอยู่ แต่ไม่ได้บอกว่าอยู่ตรงไหน การหาตำแหน่งยังเป็นงานของเรา",
      en: "The theorem promises the point exists. Finding it is still your job.",
    },
    ruleIds: ["c1.rolle", "calc.critical-point"],
    examples: [
      {
        generatorId: "c1.rolle",
        seed: 4,
        difficulty: 1,
        note: {
          th: "พาราโบลาสมมาตร จุดที่ความชันเป็นศูนย์จึงอยู่ตรงกลางระหว่างสองปลายพอดี",
          en: "A parabola is symmetric, so its flat point is exactly halfway between the two ends.",
        },
      },
      { generatorId: "c1.rolle", seed: 12, difficulty: 2 },
      {
        generatorId: "c1.rolle",
        seed: 20,
        difficulty: 3,
        note: {
          th: "โจทย์ถามค่าของฟังก์ชันที่จุดนั้น จึงต้องแทนกลับลงในฟังก์ชันเดิม",
          en: "Here the question asks how high that point is, so the original function is needed again.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ตอบปลายช่วง ทฤษฎีบทรับประกันจุดที่อยู่ภายในช่วงเท่านั้น",
        en: "Answering with an endpoint. The theorem promises a point strictly inside.",
      },
      {
        th: "ลืมตรวจว่าปลายทั้งสองมีค่าเท่ากันจริง ถ้าไม่เท่า ทฤษฎีบทของโรลใช้ไม่ได้",
        en: "Not checking that the two ends really are level. If they are not, Rolle's theorem does not apply.",
      },
      {
        th: "สับสนระหว่างตำแหน่ง c กับค่า f(c)",
        en: "Confusing where the point is with how high it is.",
      },
    ],
    practice: [
      { generatorId: "c1.rolle", seed: 1811, difficulty: 1 },
      { generatorId: "c1.rolle", seed: 1812, difficulty: 2 },
      { generatorId: "c1.rolle", seed: 1813, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.mean-value",
    title: {
      th: "ทฤษฎีบทค่าเฉลี่ย",
      en: "The mean value theorem",
    },
    intro: {
      th: "ถ้าขับรถได้เฉลี่ยชั่วโมงละร้อยกิโลเมตร ต้องมีวินาทีหนึ่งที่มาตรวัดอ่านได้ร้อยพอดี ไม่ใช่เรื่องบังเอิญ แต่เป็นสิ่งที่ต้องเกิดขึ้น และนั่นคือทฤษฎีบทค่าเฉลี่ยทั้งข้อ",
      en: "Average a hundred kilometres an hour and at some instant the speedometer read exactly a hundred. Not by luck - it has to happen, and that is the whole theorem.",
    },
    bigIdea: {
      th: "ความชันของคอร์ดที่เชื่อมปลายทั้งสอง ต้องเท่ากับความชันของเส้นสัมผัสที่จุดใดจุดหนึ่งภายในช่วง",
      en: "The slope of the chord joining the ends is the slope of the tangent somewhere inside.",
    },
    ruleIds: ["c1.mean-value", "c1.rolle", "calc.tangent-slope"],
    examples: [
      {
        generatorId: "c1.mean-value",
        seed: 7,
        difficulty: 1,
        note: {
          th: "สำหรับพาราโบลา จุดนี้อยู่ตรงกลางช่วงเสมอ ซึ่งเป็นเรื่องของพาราโบลา ไม่ใช่ของทฤษฎีบท",
          en: "For a parabola it is always the midpoint - a fact about parabolas, not about the theorem.",
        },
      },
      {
        generatorId: "c1.mean-value",
        seed: 15,
        difficulty: 3,
        note: {
          th: "ลูกบาศก์ไม่เป็นแบบนั้น คำตอบไม่ใช่จุดกึ่งกลาง และเป็นจำนวนอตรรกยะเสียด้วย",
          en: "A cubic is not like that: the point is nowhere near the midpoint, and it is irrational into the bargain.",
        },
      },
      { generatorId: "c1.mean-value", seed: 23, difficulty: 4 },
    ],
    pitfalls: [
      {
        th: "ตอบความชันเฉลี่ยแทนที่จะตอบตำแหน่งที่มันเกิดขึ้น",
        en: "Answering with the average slope instead of where it happens.",
      },
      {
        th: "คำนวณความชันของคอร์ดกลับหัว ต้องเป็นผลต่างของ f หารด้วยผลต่างของ x",
        en: "Getting the chord's slope upside down. It is the change in f over the change in x.",
      },
      {
        th: "คิดว่าคำตอบอยู่ตรงกลางช่วงเสมอ ซึ่งจริงเฉพาะพาราโบลา",
        en: "Assuming the midpoint always works. That is a parabola's habit, not a rule.",
      },
    ],
    practice: [
      { generatorId: "c1.mean-value", seed: 1821, difficulty: 1 },
      { generatorId: "c1.mean-value", seed: 1822, difficulty: 2 },
      { generatorId: "c1.mean-value", seed: 1823, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.mvt-bound",
    title: {
      th: "การประมาณค่าด้วยทฤษฎีบทค่าเฉลี่ย",
      en: "Bounding a change",
    },
    intro: {
      th: "นี่คือเหตุผลที่ทฤษฎีบทค่าเฉลี่ยสำคัญจริง ๆ ถ้ารู้แค่ว่าอัตราการเปลี่ยนแปลงไม่เคยเกินค่าหนึ่ง ก็บอกได้ทันทีว่าปริมาณนั้นเปลี่ยนไปได้มากที่สุดเท่าใด โดยไม่ต้องรู้เลยว่าฟังก์ชันหน้าตาเป็นอย่างไร",
      en: "This is why the theorem earns its keep. Knowing only that a rate never exceeds some number tells you at once how far the quantity can have moved - without knowing anything else about it.",
    },
    bigIdea: {
      th: "ผลที่ตามมาที่สำคัญที่สุดคือ ถ้าอนุพันธ์เป็นศูนย์ทุกจุด ฟังก์ชันต้องเป็นค่าคงตัว ซึ่งเป็นเหตุผลที่ปฏิยานุพันธ์ต่างกันได้แค่ค่าคงตัว",
      en: "Its most important consequence: a function whose derivative is zero everywhere is constant - which is why two antiderivatives can differ only by a constant.",
    },
    ruleIds: ["c1.mvt-consequence", "c1.mean-value"],
    examples: [
      {
        generatorId: "c1.mvt-bound",
        seed: 9,
        difficulty: 1,
        note: {
          th: "ไม่รู้ฟังก์ชันเลย แต่ตอบได้ เพราะทฤษฎีบทบอกว่าผลต่างคือ f'(c) คูณความกว้างของช่วง",
          en: "The function is never named, and the question is still answerable: the change is f'(c) times the width.",
        },
      },
      { generatorId: "c1.mvt-bound", seed: 17, difficulty: 3 },
      {
        generatorId: "c1.mvt-bound",
        seed: 25,
        difficulty: 4,
        note: {
          th: "ข้อนี้ถามผลต่างมากที่สุดโดยตรง ซึ่งคือรูปที่ตรงที่สุดของทฤษฎีบท",
          en: "This asks for the largest change directly, which is the theorem in its barest form.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ตอบขอบเขตของอนุพันธ์ ยังไม่ได้คูณด้วยความกว้างของช่วง",
        en: "Answering with the bound on the derivative, without multiplying by the width.",
      },
      {
        th: "บวกแทนที่จะคูณ ทฤษฎีบทให้ f'(c) คูณความกว้าง",
        en: "Adding instead of multiplying. The theorem gives a product.",
      },
      {
        th: "ลืมค่าเริ่มต้น การเปลี่ยนแปลงต้องนับจากจุดเริ่ม",
        en: "Leaving out the starting value. The change moves away from somewhere.",
      },
    ],
    practice: [
      { generatorId: "c1.mvt-bound", seed: 1831, difficulty: 1 },
      { generatorId: "c1.mvt-bound", seed: 1832, difficulty: 2 },
      { generatorId: "c1.mvt-bound", seed: 1833, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.integral-power",
    title: {
      th: "ปริพันธ์ของกำลังและฟังก์ชันพื้นฐาน",
      en: "Integrating powers and standard functions",
    },
    intro: {
      th: "การอินทิเกรตคือการถามว่าอะไรดิฟแล้วได้สิ่งนี้ ซึ่งแปลว่าตรวจคำตอบเองได้เสมอ ดิฟกลับแล้วถ้าได้ของเดิมก็ถูก ไม่มีหัวข้ออื่นในวิชานี้ที่ตรวจคำตอบได้ง่ายขนาดนี้",
      en: "Integrating is asking what differentiates to this - which means you can always check yourself. Differentiate your answer, and if the question comes back, it was right. No other topic in the subject is so easy to check.",
    },
    bigIdea: {
      th: "บวกหนึ่งที่เลขชี้กำลังแล้วหารด้วยตัวใหม่ ยกเว้นกรณีเดียวคือ x ยกกำลังลบหนึ่ง ซึ่งให้ลอการิทึม",
      en: "Up one on the exponent and divide by what you get - with one exception, the reciprocal, which gives a logarithm instead.",
    },
    ruleIds: ["c1.integral-power", "calc.antiderivative-power"],
    examples: [
      {
        generatorId: "c1.integral-power",
        seed: 3,
        difficulty: 1,
        note: {
          th: "จุดที่กราฟผ่านคือสิ่งที่ทำให้ C มีค่าเดียว ถ้าไม่มีจุดนั้นก็มีคำตอบเป็นอนันต์",
          en: "The point given is what makes C a single number; without it there are infinitely many answers.",
        },
      },
      { generatorId: "c1.integral-power", seed: 11, difficulty: 3 },
      {
        generatorId: "c1.integral-power",
        seed: 19,
        difficulty: 4,
        note: {
          th: "กฎกำลังพังที่นี่จริง ๆ บวกหนึ่งแล้วได้ศูนย์ แล้วต้องหารด้วยศูนย์",
          en: "The power rule genuinely breaks here: adding one gives zero, and then you would divide by it.",
        },
      },
    ],
    pitfalls: [
      {
        th: "หารด้วยเลขชี้กำลังเดิมแทนที่จะเป็นตัวใหม่",
        en: "Dividing by the old exponent instead of the new one.",
      },
      {
        th: "ลืม +C ในปริพันธ์ไม่จำกัดเขต",
        en: "Losing the constant in an indefinite integral.",
      },
      {
        th: "ใช้กฎกำลังกับหนึ่งส่วน x ซึ่งเป็นกรณีเดียวที่ใช้ไม่ได้",
        en: "Using the power rule on one over x, the single case where it does not apply.",
      },
    ],
    practice: [
      { generatorId: "c1.integral-power", seed: 1841, difficulty: 1 },
      { generatorId: "c1.integral-power", seed: 1842, difficulty: 2 },
      { generatorId: "c1.integral-power", seed: 1843, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.substitution",
    title: {
      th: "การหาปริพันธ์โดยการแทนค่า",
      en: "Substitution",
    },
    intro: {
      th: "กฎลูกโซ่ทิ้งร่องรอยไว้เสมอ เมื่อดิฟฟังก์ชันประกอบ จะมีอนุพันธ์ของข้างในคูณติดออกมา ถ้าเห็นร่องรอยนั้นในสิ่งที่กำลังจะอินทิเกรต ก็รู้ทันทีว่าฟังก์ชันเดิมหน้าตาเป็นอย่างไร",
      en: "The chain rule always leaves a trace: differentiating a composite leaves the inside's derivative multiplied on. Spot that trace in what you are integrating and you know what it came from.",
    },
    bigIdea: {
      th: "มองหาส่วนที่เป็นอนุพันธ์ของอีกส่วนหนึ่ง ตั้งส่วนนั้นเป็น u แล้วปัญหาจะกลายเป็นปริพันธ์ง่าย ๆ",
      en: "Look for the part that is another part's derivative. Call that other part u and the problem collapses.",
    },
    ruleIds: ["c1.substitution", "c1.integral-power", "c1.chain-rule"],
    examples: [
      {
        generatorId: "c1.substitution",
        seed: 6,
        difficulty: 1,
        note: {
          th: "ข้างในเป็นเชิงเส้น อนุพันธ์จึงเป็นค่าคงตัว และหารออกไปได้เลย",
          en: "The inside is linear, so its derivative is a constant and simply divides out.",
        },
      },
      { generatorId: "c1.substitution", seed: 14, difficulty: 3 },
      {
        generatorId: "c1.substitution",
        seed: 22,
        difficulty: 4,
        note: {
          th: "ข้อนี้ต้องสังเกตเอง ตัว x ที่อยู่ข้างนอกคือครึ่งหนึ่งของอนุพันธ์ของวงเล็บพอดี",
          en: "This one has to be spotted: the x outside is exactly half the bracket's derivative.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ลืมหารด้วยอนุพันธ์ของข้างใน ซึ่งเป็นความผิดพลาดเดียวกับลืมคูณในกฎลูกโซ่",
        en: "Forgetting to divide by the inside's derivative - the same slip as forgetting to multiply by it.",
      },
      {
        th: "คูณแทนที่จะหาร การอินทิเกรตทำกลับทางกับการดิฟ",
        en: "Multiplying instead of dividing. Integration undoes differentiation, so the factor goes the other way.",
      },
      {
        th: "ลืมแทน u กลับเป็น x ในคำตอบสุดท้าย",
        en: "Leaving u in the final answer instead of putting x back.",
      },
    ],
    practice: [
      { generatorId: "c1.substitution", seed: 1851, difficulty: 1 },
      { generatorId: "c1.substitution", seed: 1852, difficulty: 2 },
      { generatorId: "c1.substitution", seed: 1853, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.definite",
    title: {
      th: "ปริพันธ์จำกัดเขต",
      en: "Definite integrals",
    },
    intro: {
      th: "ใส่ขอบเขตเข้าไป แล้วปริพันธ์กลายเป็นจำนวน ไม่ใช่ฟังก์ชันอีกต่อไป ค่าคงตัว C ตัดกันเองพอดี จึงไม่ต้องเขียนเลย และนี่คือเหตุผลที่ไม่ต้องเขียน",
      en: "Add limits and an integral stops being a function and becomes a number. The constant cancels itself exactly - which is the reason, rather than an excuse, for not writing it.",
    },
    bigIdea: {
      th: "ขอบบนลบขอบล่าง เสมอในลำดับนี้ สลับกันแล้วคำตอบจะติดลบทั้งก้อน",
      en: "Top minus bottom, always in that order. Swap them and the whole answer changes sign.",
    },
    ruleIds: ["c1.definite-integral", "c1.integral-power", "c1.substitution"],
    examples: [
      {
        generatorId: "c1.definite",
        seed: 4,
        difficulty: 1,
        note: {
          th: "คำตอบเป็นเศษส่วน ซึ่งเป็นเรื่องปกติ ไม่ต้องแปลงเป็นทศนิยม",
          en: "The answer is a fraction, which is normal and needs no decimal.",
        },
      },
      { generatorId: "c1.definite", seed: 12, difficulty: 2 },
      {
        generatorId: "c1.definite",
        seed: 20,
        difficulty: 3,
        note: {
          th: "ขอบบนเป็นมุมพิเศษ ค่าไซน์ตรงนั้นจึงเป็นจำนวนเต็ม",
          en: "The upper limit is a special angle, so the sine there is a whole number.",
        },
      },
    ],
    pitfalls: [
      {
        th: "สลับขอบบนกับขอบล่าง",
        en: "Swapping the limits.",
      },
      {
        th: "ใส่ +C ในปริพันธ์จำกัดเขต ซึ่งไม่ผิดแต่ไม่มีความหมาย เพราะมันตัดกันเอง",
        en: "Adding a constant to a definite integral. It is not wrong so much as pointless: it cancels.",
      },
      {
        th: "ลืมเครื่องหมายเมื่อขอบล่างติดลบ การลบค่าติดลบคือการบวก",
        en: "Mishandling a negative lower limit. Subtracting a negative value adds.",
      },
    ],
    practice: [
      { generatorId: "c1.definite", seed: 1861, difficulty: 1 },
      { generatorId: "c1.definite", seed: 1862, difficulty: 2 },
      { generatorId: "c1.definite", seed: 1863, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.riemann",
    title: {
      th: "ผลบวกรีมันน์",
      en: "Riemann sums",
    },
    intro: {
      th: "ก่อนจะมีสูตร F(b) ลบ F(a) พื้นที่ใต้กราฟถูกหาด้วยการแบ่งเป็นแท่งสี่เหลี่ยมแล้วบวกกัน ยิ่งแท่งแคบยิ่งใกล้ความจริง และปริพันธ์คือลิมิตของผลบวกนั้น นี่ไม่ใช่การประมาณปริพันธ์ แต่เป็นนิยามของมัน",
      en: "Before the shortcut, area was found by chopping it into rectangles and adding them up. Narrower rectangles get closer, and the integral is the limit of those sums. That is not an approximation to the integral - it is what the integral is.",
    },
    bigIdea: {
      th: "ถ้าฟังก์ชันกำลังเพิ่ม ผลบวกแบบปลายซ้ายจะน้อยกว่าความจริง และแบบปลายขวาจะมากกว่า ความจริงอยู่ระหว่างนั้นเสมอ",
      en: "For a rising function a left-hand sum falls short and a right-hand sum overshoots. The truth is always between them.",
    },
    ruleIds: ["c1.riemann-sum", "c1.definite-integral"],
    examples: [
      {
        generatorId: "c1.riemann",
        seed: 7,
        difficulty: 1,
        note: {
          th: "แต่ละแท่งกว้างหนึ่ง ผลบวกของความสูงจึงเป็นพื้นที่พอดี",
          en: "Each rectangle is one wide, so the heights add straight to the area.",
        },
      },
      { generatorId: "c1.riemann", seed: 15, difficulty: 2 },
      {
        generatorId: "c1.riemann",
        seed: 23,
        difficulty: 3,
        note: {
          th: "พาราโบลาทำให้เห็นชัดว่าผลบวกกับค่าจริงต่างกันแค่ไหน และต่างไปทางไหน",
          en: "With a parabola the gap between the sum and the true value becomes visible, and so does which way it leans.",
        },
      },
    ],
    pitfalls: [
      {
        th: "วัดความสูงผิดปลาย ปลายซ้ายกับปลายขวาให้คนละคำตอบ",
        en: "Measuring heights at the wrong edge. Left and right give different answers.",
      },
      {
        th: "ลืมคูณด้วยความกว้างของแท่ง ซึ่งมองข้ามได้ง่ายเมื่อความกว้างเป็นหนึ่ง",
        en: "Forgetting to multiply by the width, which is easy to miss when the width is one.",
      },
      {
        th: "ตอบค่าจริงของปริพันธ์แทนที่จะตอบผลบวกที่โจทย์ถาม",
        en: "Answering with the true integral instead of the sum that was asked for.",
      },
    ],
    practice: [
      { generatorId: "c1.riemann", seed: 1871, difficulty: 1 },
      { generatorId: "c1.riemann", seed: 1872, difficulty: 2 },
      { generatorId: "c1.riemann", seed: 1873, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.ftc-first",
    title: {
      th: "ทฤษฎีบทหลักมูล ส่วนที่หนึ่ง",
      en: "The fundamental theorem, part one",
    },
    intro: {
      th: "นึกภาพว่ากำลังระบายสีพื้นที่ใต้กราฟจากซ้ายไปขวา อัตราที่พื้นที่เพิ่มขึ้นในแต่ละขณะ ขึ้นกับอะไร ขึ้นกับความสูงของกราฟตรงขอบที่กำลังเคลื่อนที่เท่านั้น นั่นคือทั้งหมดของทฤษฎีบทส่วนนี้ และมันแปลว่าการดิฟกับการอินทิเกรตหักล้างกันจริง ๆ",
      en: "Picture shading the area under a graph from left to right. How fast is the shaded area growing? Only on the height of the graph at the moving edge - and that is the whole of this half of the theorem. Differentiating really does undo integrating.",
    },
    bigIdea: {
      th: "ไม่ต้องอินทิเกรตเลย แค่แทนขอบบนลงในตัวถูกอินทิเกรต แล้วคูณด้วยอนุพันธ์ของขอบบนถ้ามันไม่ใช่ x เฉย ๆ",
      en: "Nothing is integrated. Put the upper limit into the integrand, and multiply by that limit's derivative if it is anything other than plain x.",
    },
    ruleIds: ["c1.ftc-first", "c1.chain-rule"],
    examples: [
      {
        generatorId: "c1.ftc-first",
        seed: 5,
        difficulty: 1,
        note: {
          th: "ขอบล่างไม่มีผลเลย เพราะมันเป็นค่าคงตัว ไม่ว่าจะเป็นเลขอะไรก็ได้คำตอบเดิม",
          en: "The lower limit makes no difference at all: it is a constant, and any number there gives the same answer.",
        },
      },
      { generatorId: "c1.ftc-first", seed: 13, difficulty: 2 },
      {
        generatorId: "c1.ftc-first",
        seed: 21,
        difficulty: 3,
        note: {
          th: "ขอบบนเป็น x กำลังสอง จึงต้องคูณด้วย 2x ตามกฎลูกโซ่",
          en: "The upper limit is x squared, so the chain rule brings in a factor of 2x.",
        },
      },
    ],
    pitfalls: [
      {
        th: "อินทิเกรตก่อนแล้วค่อยดิฟ ได้คำตอบเดียวกันแต่เสียเวลา และพลาดโอกาสเห็นว่าทฤษฎีบทบอกอะไร",
        en: "Integrating first and differentiating afterwards. It gives the same answer the long way, and misses what the theorem is saying.",
      },
      {
        th: "ลืมกฎลูกโซ่เมื่อขอบบนไม่ใช่ x เฉย ๆ",
        en: "Forgetting the chain rule when the upper limit is not plain x.",
      },
      {
        th: "เอาขอบล่างมาแทนค่าลบด้วย ทั้งที่มันไม่มีผลต่ออัตราการเปลี่ยนแปลง",
        en: "Substituting the lower limit as well, when it has no bearing on the rate.",
      },
    ],
    practice: [
      { generatorId: "c1.ftc-first", seed: 1881, difficulty: 1 },
      { generatorId: "c1.ftc-first", seed: 1882, difficulty: 2 },
      { generatorId: "c1.ftc-first", seed: 1883, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.ftc-second",
    title: {
      th: "ทฤษฎีบทหลักมูล ส่วนที่สอง",
      en: "The fundamental theorem, part two",
    },
    intro: {
      th: "ผลบวกรีมันน์บอกว่าพื้นที่คือลิมิตของผลบวกของแท่งสี่เหลี่ยมนับไม่ถ้วน ซึ่งฟังดูเหมือนคำนวณไม่ได้ ส่วนที่สองของทฤษฎีบทบอกว่าหาได้ในสองบรรทัด แค่หาฟังก์ชันที่ดิฟแล้วได้ f แล้วแทนค่าปลายทั้งสอง นี่คือสิ่งที่ทำให้แคลคูลัสกลายเป็นเครื่องมือ",
      en: "A Riemann sum says the area is a limit of infinitely many rectangles, which sounds uncomputable. Part two says it takes two lines: find something that differentiates to f and take its values at the ends. This is what turned calculus into a tool.",
    },
    bigIdea: {
      th: "ปฏิยานุพันธ์ตัวไหนก็ได้ เพราะค่าคงตัวตัดกันเองเสมอ",
      en: "Any antiderivative will do, because the constant always cancels itself.",
    },
    ruleIds: ["c1.ftc-second", "c1.definite-integral", "c1.integral-power"],
    examples: [
      {
        generatorId: "c1.ftc-second",
        seed: 4,
        difficulty: 1,
        note: {
          th: "สองบรรทัด แทนที่จะบวกแท่งสี่เหลี่ยมนับไม่ถ้วน",
          en: "Two lines, instead of infinitely many rectangles.",
        },
      },
      { generatorId: "c1.ftc-second", seed: 12, difficulty: 2 },
      {
        generatorId: "c1.ftc-second",
        seed: 20,
        difficulty: 4,
        note: {
          th: "ขอบล่างติดลบ การลบค่าติดลบคือการบวก จึงต้องระวังเครื่องหมาย",
          en: "A negative lower limit: subtracting a negative value adds, so the signs need care.",
        },
      },
    ],
    pitfalls: [
      {
        th: "สลับขอบบนกับขอบล่าง",
        en: "Swapping the limits.",
      },
      {
        th: "ดิฟแทนที่จะอินทิเกรต โดยเฉพาะเมื่อทำโจทย์อนุพันธ์มาก่อนหน้านี้ทั้งบท",
        en: "Differentiating instead of integrating, especially after a chapter of derivatives.",
      },
      {
        th: "ใส่ +C ทั้งที่เป็นปริพันธ์จำกัดเขต ซึ่งไม่มีความหมายเพราะมันตัดกันเอง",
        en: "Adding a constant to a definite integral, where it cancels and means nothing.",
      },
    ],
    practice: [
      { generatorId: "c1.ftc-second", seed: 1891, difficulty: 1 },
      { generatorId: "c1.ftc-second", seed: 1892, difficulty: 2 },
      { generatorId: "c1.ftc-second", seed: 1893, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.net-change",
    title: {
      th: "การเปลี่ยนแปลงสุทธิจากอัตรา",
      en: "Net change from a rate",
    },
    intro: {
      th: "ถ้ารถวิ่งด้วยความเร็วคงที่ ระยะทางคือความเร็วคูณเวลา แต่ถ้าความเร็วเปลี่ยนตลอด การคูณใช้ไม่ได้ ต้องอินทิเกรต ปริพันธ์ของอัตราคือการเปลี่ยนแปลงสุทธิเสมอ ไม่ว่าอัตรานั้นจะเป็นความเร็ว อัตราการไหล หรืออัตราการผลิต",
      en: "At a constant speed, distance is speed times time. When the speed keeps changing, multiplying will not do and integrating will. The integral of a rate is always the net change - whether the rate is a speed, a flow, or a production line.",
    },
    bigIdea: {
      th: "ทุกครั้งที่โจทย์ให้อัตรามาแล้วถามยอดรวม คำตอบคือปริพันธ์",
      en: "Whenever a question gives a rate and asks for a total, the answer is an integral.",
    },
    ruleIds: ["c1.net-change", "c1.ftc-second"],
    examples: [
      {
        generatorId: "c1.net-change",
        seed: 6,
        difficulty: 1,
        note: {
          th: "ความเร็วไม่คงที่ จึงคูณด้วยเวลาไม่ได้",
          en: "The speed is not constant, so multiplying by the time is not available.",
        },
      },
      { generatorId: "c1.net-change", seed: 14, difficulty: 2 },
      {
        generatorId: "c1.net-change",
        seed: 22,
        difficulty: 4,
        note: {
          th: "ความเร็วติดลบช่วงแรก การกระจัดสุทธิจึงน้อยกว่าระยะทางที่เดินทางจริง สองอย่างนี้เป็นคนละคำถาม",
          en: "The velocity starts negative, so the net displacement is less than the distance travelled. They are different questions.",
        },
      },
    ],
    pitfalls: [
      {
        th: "คูณอัตราด้วยเวลา ซึ่งใช้ได้เฉพาะเมื่ออัตราคงที่",
        en: "Multiplying the rate by the time, which only works when the rate is constant.",
      },
      {
        th: "สับสนระหว่างการกระจัดสุทธิกับระยะทางที่เดินทางจริง เมื่อความเร็วเปลี่ยนเครื่องหมาย",
        en: "Confusing net displacement with distance travelled when the velocity changes sign.",
      },
      {
        th: "ลืมว่าขอบล่างมักเป็นศูนย์ แต่ไม่เสมอไป",
        en: "Assuming the lower limit is zero. It usually is, and not always.",
      },
    ],
    practice: [
      { generatorId: "c1.net-change", seed: 1901, difficulty: 1 },
      { generatorId: "c1.net-change", seed: 1902, difficulty: 2 },
      { generatorId: "c1.net-change", seed: 1903, difficulty: 3 },
    ],
  },

  {
    skillId: "c1.area-between",
    title: {
      th: "พื้นที่ระหว่างเส้นโค้ง",
      en: "The area between curves",
    },
    intro: {
      th: "พื้นที่ระหว่างสองเส้นคือพื้นที่ใต้เส้นบนลบพื้นที่ใต้เส้นล่าง ซึ่งรวมกันเป็นปริพันธ์เดียวของผลต่าง งานที่แท้จริงอยู่ก่อนหน้านั้น คือหาว่าสองเส้นตัดกันที่ไหน และเส้นไหนอยู่บน",
      en: "The area between two curves is the area under the upper one minus the area under the lower, which is a single integral of their difference. The real work happens before that: finding where they cross, and which one is on top.",
    },
    bigIdea: {
      th: "พื้นที่เป็นลบไม่ได้ ถ้าได้คำตอบติดลบ แสดงว่าลบสลับข้าง",
      en: "An area is never negative. A negative answer means the subtraction was the wrong way round.",
    },
    ruleIds: ["c1.area-between", "c1.ftc-second", "quad.zero-product"],
    examples: [
      {
        generatorId: "c1.area-between",
        seed: 8,
        difficulty: 1,
        note: {
          th: "จุดตัดหาได้จากการให้ y ทั้งสองเท่ากัน ซึ่งกลายเป็นสมการกำลังสองธรรมดา",
          en: "The crossings come from setting the two y's equal, which is an ordinary quadratic.",
        },
      },
      { generatorId: "c1.area-between", seed: 16, difficulty: 2 },
      {
        generatorId: "c1.area-between",
        seed: 24,
        difficulty: 4,
        note: {
          th: "ระหว่างจุดตัดสองจุด เส้นตรงอยู่เหนือพาราโบลาเสมอ เพราะพาราโบลาเปิดขึ้น",
          en: "Between the two crossings the line is always above, because the parabola opens upwards.",
        },
      },
    ],
    pitfalls: [
      {
        th: "ลบสลับข้าง แล้วได้พื้นที่ติดลบ",
        en: "Subtracting the wrong way round and getting a negative area.",
      },
      {
        th: "ลืมหาจุดตัดก่อน แล้วเดาขอบเขตของปริพันธ์",
        en: "Guessing the limits instead of finding where the curves cross.",
      },
      {
        th: "อินทิเกรตทีละเส้นแล้วลบกันทีหลัง ซึ่งได้คำตอบเดียวกันแต่ยาวกว่า และพลาดง่ายกว่า",
        en: "Integrating each curve separately and subtracting afterwards. Same answer, more steps, more places to slip.",
      },
    ],
    practice: [
      { generatorId: "c1.area-between", seed: 1911, difficulty: 1 },
      { generatorId: "c1.area-between", seed: 1912, difficulty: 2 },
      { generatorId: "c1.area-between", seed: 1913, difficulty: 3 },
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
