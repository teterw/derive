import type { Rule } from "../types";
import {
  asOperator,
  binary,
  constant,
  isConstant,
  rewriteFirst,
  unparen,
} from "./misapply";

/**
 * แคลคูลัสเบื้องต้น · ม.6.
 *
 * The whole subject rests on one move that nothing before it allowed: asking
 * what a quantity is doing *at* an instant, when everything up to now could
 * only compare two instants. A limit is what makes that question mean
 * anything, a derivative is what the answer is called, and an integral is the
 * same machinery run backwards.
 *
 * ลิมิต = limit, อนุพันธ์ = derivative, ปฏิยานุพันธ์ = antiderivative,
 * ปริพันธ์ = integral, ความชัน = slope.
 */
const TOPIC = ["calc.intro"];

export const calculusRules: Rule[] = [
  {
    id: "calc.limit-substitution",
    topicIds: TOPIC,
    name: {
      th: "ลิมิตโดยการแทนค่า",
      en: "Limits by substitution",
    },
    statement: "\\lim_{x \\to a} f(x) = f(a)",
    conditions: {
      th: "เมื่อ f เป็นฟังก์ชันต่อเนื่องที่ x = a ซึ่งพหุนามทุกตัวเป็นเช่นนั้น",
      en: "wherever f is continuous, which a polynomial is everywhere",
    },
    plain: {
      th: "ลิมิตถามว่าค่าของฟังก์ชันเข้าใกล้อะไรเมื่อ x เข้าใกล้ a สำหรับพหุนาม คำตอบคือค่าที่ x = a นั่นเอง เพราะกราฟไม่มีรอยขาด",
      en: "A limit asks what the function approaches as x approaches a. For a polynomial the answer is simply its value there, because the graph has no break in it.",
    },
    mnemonic: {
      th: "ถ้าแทนค่าแล้วได้จำนวนจริง นั่นคือคำตอบ",
      en: "If substituting gives a number, that is the answer.",
    },
    examples: [
      { from: "\\lim_{x \\to 3}(x^2 + 1)", to: "10" },
      {
        from: "\\lim_{x \\to 2}\\frac{x + 4}{x - 5}",
        to: "-2",
        note: {
          th: "ตัวส่วนไม่เป็นศูนย์ที่ x = 2 จึงแทนค่าได้เลย",
          en: "The denominator is not zero at 2, so substitution is allowed.",
        },
      },
    ],
    seeAlso: ["calc.limit-factor-cancel"],
  },
  {
    id: "calc.limit-factor-cancel",
    topicIds: TOPIC,
    name: {
      th: "ลิมิตรูปแบบศูนย์ส่วนศูนย์",
      en: "The zero-over-zero form",
    },
    statement: "\\frac{0}{0} \\Rightarrow \\frac{(x-a)\\,p(x)}{(x-a)\\,q(x)}",
    plain: {
      th: "ศูนย์ส่วนศูนย์ไม่ได้แปลว่าไม่มีลิมิต แต่แปลว่ายังตอบไม่ได้ ต้องจัดรูปก่อน ตัวเศษกับตัวส่วนมีตัวประกอบร่วมเสมอ ตัดทิ้งแล้วจึงแทนค่า",
      en: "Zero over zero does not mean there is no limit; it means the question has not been answered yet. Numerator and denominator always share a factor - cancel it, then substitute.",
    },
    mnemonic: {
      th: "ตัดตัวประกอบร่วมทิ้งก่อน แล้วค่อยแทนค่า",
      en: "Cancel first, substitute second.",
    },
    examples: [
      {
        from: "\\lim_{x \\to 3}\\frac{x^2 - 9}{x - 3}",
        to: "6",
        note: {
          th: "ตัดตัวประกอบ x-3 ทิ้งได้ เพราะ x เข้าใกล้ 3 แต่ไม่เท่ากับ 3 ตัวประกอบนั้นจึงไม่เป็นศูนย์",
          en: "Cancelling x minus three is legal because x approaches three without ever being three, so that factor is never actually zero.",
        },
      },
      { from: "\\lim_{x \\to 0}\\frac{x^2 + 5x}{x}", to: "5" },
    ],
    seeAlso: ["calc.limit-substitution", "quad.diff-squares"],
  },
  {
    id: "calc.derivative-power",
    topicIds: TOPIC,
    name: {
      th: "กฎกำลังของอนุพันธ์",
      en: "The power rule",
    },
    statement: "\\frac{d}{dx}x^n = nx^{n-1}",
    plain: {
      th: "นำเลขชี้กำลังลงมาคูณข้างหน้า แล้วลดเลขชี้กำลังลงหนึ่ง กฎนี้ใช้ได้กับ n ทุกจำนวน ไม่ใช่แค่จำนวนเต็มบวก",
      en: "Bring the exponent down in front, then knock one off it. It holds for every n, not only the whole positive ones.",
    },
    mnemonic: {
      th: "เอากำลังลงมาคูณ แล้วลดกำลังลงหนึ่ง",
      en: "Down in front, and one off the top.",
    },
    examples: [
      { from: "x^5", to: "5x^4" },
      {
        from: "x",
        to: "1",
        note: {
          th: "x คือ x กำลังหนึ่ง อนุพันธ์จึงเป็น 1 คูณ x กำลังศูนย์ ซึ่งเท่ากับ 1",
          en: "x is x to the one, so its derivative is one times x to the zero, which is one.",
        },
      },
    ],
    seeAlso: ["calc.derivative-sum", "calc.derivative-constant"],
    /**
     * The exponent brought down but never reduced. It is the commonest slip
     * in the whole topic and leaves an expression of the same degree, which
     * is why nothing about the answer looks wrong.
     */
    misapplications: [
      {
        id: "calc.derivative-power/kept-the-exponent",
        /*
         * These transforms take the *correct* expression and produce the
         * mistaken one, so this puts the exponent back up rather than taking
         * it down: the answer keeps the degree of the function it came from,
         * which is exactly what the slip looks like on the page.
         */
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const power = asOperator(node, "^");
            if (!power) return null;
            const exponent = Number(unparen(power.args[1]!).toString());
            if (!Number.isFinite(exponent)) return null;
            return binary("^", power.args[0]!, constant(exponent + 1));
          }),
        explain: {
          th: "เอาเลขชี้กำลังลงมาคูณแล้ว แต่ลืมลดเลขชี้กำลังลงหนึ่ง",
          en: "The exponent came down but was never reduced by one.",
        },
        example: { from: "3x^2", right: "3x^2", wrong: "3x^3" },
      },
    ],
  },
  {
    id: "calc.derivative-sum",
    topicIds: TOPIC,
    name: {
      th: "อนุพันธ์ของผลบวกและตัวคูณคงตัว",
      en: "Sums and constant multiples",
    },
    statement: "(af + bg)' = af' + bg'",
    plain: {
      th: "หาอนุพันธ์ทีละพจน์ได้เลย ตัวเลขที่คูณอยู่ข้างหน้าก็ติดไปด้วย นี่คือเหตุผลที่พหุนามหาอนุพันธ์ได้ง่าย",
      en: "Differentiate term by term, and any number in front simply comes along. That is what makes a polynomial so easy to differentiate.",
    },
    mnemonic: {
      th: "ทีละพจน์ ตัวคูณคงตัวไม่ต้องทำอะไรกับมัน",
      en: "Term by term, and leave the constants in front alone.",
    },
    examples: [
      { from: "3x^4 - 2x", to: "12x^3 - 2" },
      { from: "\\frac{x^2}{2}", to: "x" },
    ],
    seeAlso: ["calc.derivative-power", "calc.derivative-constant"],
  },
  {
    id: "calc.derivative-constant",
    topicIds: TOPIC,
    name: {
      th: "อนุพันธ์ของค่าคงตัว",
      en: "The derivative of a constant",
    },
    statement: "\\frac{d}{dx}c = 0",
    plain: {
      th: "ค่าคงตัวไม่เปลี่ยนแปลง อัตราการเปลี่ยนแปลงจึงเป็นศูนย์ กราฟของมันเป็นเส้นแนวนอน ความชันเป็นศูนย์",
      en: "A constant does not change, so its rate of change is zero. Its graph is a flat line and a flat line has no slope.",
    },
    mnemonic: {
      th: "พจน์ที่ไม่มี x หายไปทั้งพจน์",
      en: "A term with no x in it disappears entirely.",
    },
    examples: [
      { from: "x^2 + 7", to: "2x" },
      {
        from: "7",
        to: "0",
        note: {
          th: "นี่คือเหตุผลที่ปฏิยานุพันธ์ต้องมี +C ค่าคงตัวใดก็ได้ให้อนุพันธ์เดียวกัน",
          en: "This is exactly why an antiderivative needs its plus C: every constant has the same derivative.",
        },
      },
    ],
    seeAlso: ["calc.derivative-sum", "calc.antiderivative-power"],
  },
  {
    id: "calc.derivative-product",
    topicIds: TOPIC,
    name: {
      th: "กฎผลคูณ",
      en: "The product rule",
    },
    statement: "(fg)' = f'g + fg'",
    plain: {
      th: "อนุพันธ์ของผลคูณไม่ใช่ผลคูณของอนุพันธ์ ต้องหาอนุพันธ์ทีละตัวแล้วบวกกัน ตรวจได้เสมอด้วยการกระจายวงเล็บก่อนแล้วหาอนุพันธ์",
      en: "The derivative of a product is not the product of the derivatives. Differentiate each in turn and add - and you can always check by expanding the brackets first.",
    },
    mnemonic: {
      th: "ตัวหน้าดิฟ คูณตัวหลัง บวก ตัวหน้า คูณตัวหลังดิฟ",
      en: "First differentiated times second, plus first times second differentiated.",
    },
    examples: [
      { from: "(2x + 1)(x - 3)", to: "4x - 5" },
      { from: "x^2(x + 1)", to: "3x^2 + 2x" },
    ],
    seeAlso: ["calc.derivative-sum", "arith.distribute"],
  },
  {
    id: "calc.tangent-slope",
    topicIds: TOPIC,
    name: {
      th: "ความชันของเส้นสัมผัส",
      en: "The slope of a tangent",
    },
    statement: "m = f'(a)",
    plain: {
      th: "อนุพันธ์ที่จุดหนึ่งคือความชันของเส้นสัมผัสที่จุดนั้น นี่คือความหมายทางเรขาคณิตของอนุพันธ์ และเป็นเหตุผลที่คิดค้นมันขึ้นมา",
      en: "The derivative at a point is the slope of the tangent there. That is what a derivative means geometrically, and why it was invented.",
    },
    mnemonic: {
      th: "ดิฟก่อน แล้วค่อยแทนค่า x",
      en: "Differentiate first, substitute second.",
    },
    examples: [
      { from: "f(x) = x^2, \\ a = 3", to: "m = 6" },
      {
        from: "f(x) = x^2, \\ a = 3",
        to: "y = 6x - 9",
        note: {
          th: "ได้ความชันแล้วก็ใช้สมการเส้นตรงผ่านจุด (3, 9) ได้เลย",
          en: "With the slope in hand it is an ordinary straight line through the point (3, 9).",
        },
      },
    ],
    seeAlso: ["calc.derivative-power", "calc.critical-point"],
    /**
     * Substituting before differentiating. `f(3) = 9` and then differentiating
     * a constant gives zero, so the answer is confidently zero every time.
     */
    misapplications: [
      {
        id: "calc.tangent-slope/substituted-first",
        /*
         * Only where it really happens: substituting first leaves a number,
         * and the derivative of a number is zero. A transform that fired on
         * anything at all would diagnose every wrong answer as this mistake.
         */
        apply: (math) => (isConstant(math) ? "0" : null),
        explain: {
          th: "แทนค่า x ก่อนหาอนุพันธ์ ทำให้เหลือค่าคงตัว อนุพันธ์จึงเป็นศูนย์เสมอ",
          en: "Substituting before differentiating leaves a constant, and a constant always differentiates to zero.",
        },
        example: { from: "2*3", right: "6", wrong: "0" },
      },
    ],
  },
  {
    id: "calc.critical-point",
    topicIds: TOPIC,
    name: {
      th: "จุดวิกฤต",
      en: "Where the tangent is flat",
    },
    statement: "f'(x) = 0",
    plain: {
      th: "ที่จุดสูงสุดหรือต่ำสุดของกราฟ เส้นสัมผัสอยู่ในแนวนอน ความชันจึงเป็นศูนย์ การแก้สมการ f'(x) = 0 จึงเป็นการหาจุดเหล่านั้น",
      en: "At the top or the bottom of a curve the tangent is flat, so the slope is zero. Solving f'(x) = 0 is how those points are found.",
    },
    mnemonic: {
      th: "สูงสุดหรือต่ำสุด ความชันเป็นศูนย์",
      en: "At a peak or a trough, the slope is nothing.",
    },
    examples: [
      { from: "f(x) = x^2 - 6x", to: "x = 3" },
      {
        from: "f(x) = x^3 - 3x",
        to: "x = 1, -1",
        note: {
          th: "ลูกบาศก์มีได้สองจุด จุดหนึ่งเป็นสูงสุดเฉพาะที่ อีกจุดเป็นต่ำสุดเฉพาะที่",
          en: "A cubic can have two of them: one a local maximum and the other a local minimum.",
        },
      },
    ],
    seeAlso: ["calc.tangent-slope", "quad.zero-product"],
  },
  {
    id: "calc.antiderivative-power",
    topicIds: TOPIC,
    name: {
      th: "ปฏิยานุพันธ์ของกำลัง",
      en: "Antiderivatives of powers",
    },
    statement: "\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C",
    conditions: {
      th: "เมื่อ n ไม่เท่ากับ -1",
      en: "for n not equal to -1",
    },
    plain: {
      th: "ทำกลับกันกับกฎกำลัง บวกหนึ่งที่เลขชี้กำลังแล้วหารด้วยเลขชี้กำลังใหม่ ตรวจคำตอบได้เสมอด้วยการหาอนุพันธ์กลับ",
      en: "The power rule run backwards: add one to the exponent, then divide by the new exponent. You can always check by differentiating your answer.",
    },
    mnemonic: {
      th: "บวกหนึ่งแล้วหารด้วยตัวใหม่",
      en: "Up one, then divide by what you get.",
    },
    examples: [
      { from: "x^2", to: "\\frac{x^3}{3} + C" },
      {
        from: "3x^2",
        to: "x^3 + C",
        note: {
          th: "หารด้วยเลขชี้กำลังใหม่ ไม่ใช่เลขชี้กำลังเดิม",
          en: "Divide by the new exponent, not the old one.",
        },
      },
    ],
    seeAlso: ["calc.derivative-power", "calc.definite-integral"],
    /**
     * Divided by the old exponent instead of the new one, which is what
     * reading the power rule backwards too quickly produces.
     */
    misapplications: [
      {
        id: "calc.antiderivative-power/divided-by-the-old-exponent",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const quotient = asOperator(node, "/");
            if (!quotient) return null;
            const divisor = unparen(quotient.args[1]!);
            const value = Number(divisor.toString());
            if (!Number.isFinite(value) || value < 2) return null;
            return binary("/", quotient.args[0]!, constant(value - 1));
          }),
        explain: {
          th: "หารด้วยเลขชี้กำลังเดิม ต้องหารด้วยเลขชี้กำลังใหม่ที่บวกหนึ่งแล้ว",
          en: "Divided by the old exponent. It has to be the new one, after the adding.",
        },
        example: { from: "x^3/3", right: "x^3/3", wrong: "x^3/2" },
      },
    ],
  },
  {
    id: "calc.definite-integral",
    topicIds: TOPIC,
    name: {
      th: "ปริพันธ์จำกัดเขตและพื้นที่",
      en: "Definite integrals and area",
    },
    statement: "\\int_a^b f(x)\\,dx = F(b) - F(a)",
    conditions: {
      th: "เมื่อ F เป็นปฏิยานุพันธ์ใดก็ได้ของ f",
      en: "where F is any antiderivative of f",
    },
    plain: {
      th: "หาปฏิยานุพันธ์ แล้วแทนค่าขอบบนลบขอบล่าง ค่าคงตัว C ตัดกันหายไปเสมอ จึงไม่ต้องใส่ และถ้า f ไม่ติดลบบนช่วงนั้น ผลลัพธ์คือพื้นที่ใต้กราฟ",
      en: "Find an antiderivative, then take its value at the top limit minus its value at the bottom. The constant cancels itself, so there is no need to write it - and if f never dips below the axis, what you get is the area under the graph.",
    },
    mnemonic: {
      th: "ขอบบนลบขอบล่าง",
      en: "Top minus bottom.",
    },
    examples: [
      { from: "\\int_0^2 x^2 \\, dx", to: "\\frac{8}{3}" },
      {
        from: "\\int_1^3 2x \\, dx",
        to: "8",
        note: {
          th: "ตรวจได้ด้วยเรขาคณิต พื้นที่ใต้เส้นตรง y = 2x จาก 1 ถึง 3 คือสี่เหลี่ยมคางหมู",
          en: "Check it with geometry: the region under y = 2x from one to three is a trapezium.",
        },
      },
    ],
    seeAlso: ["calc.antiderivative-power", "calc.derivative-constant"],
  },
];
