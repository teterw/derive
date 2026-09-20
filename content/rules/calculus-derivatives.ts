import type { Rule } from "../types";
import { asCall, asOperator, binary, call, rewriteFirst, unparen } from "./misapply";

/**
 * อนุพันธ์และกฎการหาอนุพันธ์ · Calculus I.
 *
 * ม.6 could differentiate a polynomial. This chapter is everything else: the
 * definition the power rule came from, the two rules for combining functions,
 * and the derivatives of the functions that are not polynomials at all.
 *
 * The trigonometric derivatives are the reason radians exist. `\sin' = \cos`
 * is true only when the angle is measured in radians; in degrees there is a
 * factor of pi over 180 in front of every single derivative, for ever.
 */
const TOPIC = ["c1.derivative"];

export const calculusDerivativeRules: Rule[] = [
  {
    id: "c1.first-principles",
    topicIds: TOPIC,
    name: {
      th: "อนุพันธ์จากนิยาม",
      en: "The derivative from the definition",
    },
    statement: "f'(x) = \\lim_{h \\to 0}\\frac{f(x + h) - f(x)}{h}",
    plain: {
      th: "ความชันระหว่างสองจุดที่ห่างกัน h แล้วให้ h เล็กลงจนเข้าใกล้ศูนย์ กฎกำลังทั้งหมดมาจากที่นี่ ไม่ได้มาจากไหนเลย",
      en: "The slope between two points h apart, with h shrinking to nothing. Every rule in the chapter comes from here and nowhere else.",
    },
    mnemonic: {
      th: "ความชันของคอร์ด เมื่อคอร์ดสั้นลงจนเป็นจุดเดียว",
      en: "The slope of a chord, as the chord shrinks to a point.",
    },
    examples: [
      {
        from: "f(x) = x^2",
        to: "f'(x) = 2x",
        note: {
          th: "กระจายได้ 2xh + h^2 หารด้วย h เหลือ 2x + h แล้วให้ h เป็นศูนย์",
          en: "Expanding gives 2xh + h squared; over h that is 2x + h, and then h goes.",
        },
      },
      { from: "f(x) = 3x + 1", to: "f'(x) = 3" },
    ],
    seeAlso: ["calc.derivative-power", "calc.limit-factor-cancel"],
  },
  {
    id: "c1.product-rule",
    topicIds: TOPIC,
    name: {
      th: "กฎผลคูณ",
      en: "The product rule",
    },
    statement: "(fg)' = f'g + fg'",
    plain: {
      th: "เมื่อสองสิ่งเปลี่ยนแปลงพร้อมกัน ผลรวมของการเปลี่ยนแปลงมาจากสองทาง ตัวหนึ่งเปลี่ยนโดยอีกตัวอยู่นิ่ง แล้วสลับกัน",
      en: "When two things change at once, the change comes from two places: one moving while the other holds still, and then the other way round.",
    },
    mnemonic: {
      th: "ตัวหน้าดิฟ คูณตัวหลัง บวก ตัวหน้า คูณตัวหลังดิฟ",
      en: "First differentiated times second, plus first times second differentiated.",
    },
    examples: [
      { from: "x^2\\sin x", to: "2x\\sin x + x^2\\cos x" },
      { from: "(x + 1)(x - 3)", to: "2x - 2" },
    ],
    seeAlso: ["c1.quotient-rule", "calc.derivative-product"],
  },
  {
    id: "c1.quotient-rule",
    topicIds: TOPIC,
    name: {
      th: "กฎผลหาร",
      en: "The quotient rule",
    },
    statement: "\\left(\\frac{f}{g}\\right)' = \\frac{f'g - fg'}{g^2}",
    conditions: {
      th: "เมื่อ g ไม่เป็นศูนย์",
      en: "wherever g is not zero",
    },
    plain: {
      th: "เหมือนกฎผลคูณแต่เป็นลบ และลำดับสำคัญมาก เพราะการลบสลับที่ไม่ได้ ตัวส่วนยกกำลังสองเสมอ",
      en: "The product rule with a minus, and here the order matters because subtraction does not commute. The denominator is always squared.",
    },
    mnemonic: {
      th: "บนดิฟคูณล่าง ลบ บนคูณล่างดิฟ ทั้งหมดส่วนล่างกำลังสอง",
      en: "Top differentiated times bottom, minus top times bottom differentiated, all over bottom squared.",
    },
    examples: [
      { from: "\\frac{x}{x + 1}", to: "\\frac{1}{(x + 1)^2}" },
      {
        from: "\\frac{\\sin x}{x}",
        to: "\\frac{x\\cos x - \\sin x}{x^2}",
        note: {
          th: "สลับลำดับในตัวเศษจะได้เครื่องหมายตรงข้ามทั้งหมด",
          en: "Swapping the order in the numerator flips the sign of the whole thing.",
        },
      },
    ],
    seeAlso: ["c1.product-rule"],
    /**
     * The subtraction the wrong way round, which negates the whole derivative
     * and is invisible unless a value is checked.
     */
    misapplications: [
      {
        id: "c1.quotient-rule/subtracted-backwards",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const quotient = asOperator(node, "/");
            if (!quotient) return null;
            const difference = asOperator(unparen(quotient.args[0]!), "-");
            if (!difference) return null;
            return binary(
              "/",
              binary("-", difference.args[1]!, difference.args[0]!),
              quotient.args[1]!,
            );
          }),
        explain: {
          th: "ตัวเศษสลับที่กัน กฎผลหารคือ บนดิฟคูณล่าง ลบ บนคูณล่างดิฟ ตามลำดับนี้เท่านั้น",
          en: "The numerator is the wrong way round. It is top-differentiated first, and only then the subtraction.",
        },
        example: {
          from: "(1 * (x + 1) - x * 1)/(x + 1)^2",
          right: "1/(x + 1)^2",
          wrong: "-1/(x + 1)^2",
        },
      },
    ],
  },
  {
    id: "c1.trig-derivative",
    topicIds: TOPIC,
    name: {
      th: "อนุพันธ์ของฟังก์ชันตรีโกณมิติ",
      en: "Derivatives of the trigonometric functions",
    },
    statement:
      "\\frac{d}{dx}\\sin x = \\cos x, \\quad \\frac{d}{dx}\\cos x = -\\sin x",
    conditions: {
      th: "เมื่อ x เป็นเรเดียน",
      en: "with x in radians",
    },
    plain: {
      th: "ความชันของกราฟไซน์ที่จุดใดก็ตาม เท่ากับค่าของคอสที่จุดนั้นพอดี ที่ยอดของไซน์ ความชันเป็นศูนย์ และคอสก็เป็นศูนย์ที่นั่นเช่นกัน",
      en: "The slope of the sine graph at any point is the value of the cosine there. At the crest of the sine the slope is zero - and the cosine is zero there too.",
    },
    mnemonic: {
      th: "ซินไปคอส คอสไปลบซิน วนสี่ครั้งกลับที่เดิม",
      en: "Sine to cosine, cosine to minus sine: four steps and you are back where you began.",
    },
    examples: [
      { from: "\\sin x", to: "\\cos x" },
      {
        from: "\\cos x",
        to: "-\\sin x",
        note: {
          th: "เครื่องหมายลบมาจากกราฟคอสที่กำลังลดลงในช่วงแรก",
          en: "The minus is there because the cosine graph starts by falling.",
        },
      },
    ],
    seeAlso: ["c1.trig-limit", "trig.unit-circle"],
    /**
     * The minus dropped from the cosine's derivative - the one sign in the
     * chapter that has to be memorised rather than derived.
     */
    misapplications: [
      {
        id: "c1.trig-derivative/lost-the-minus",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            if (node.type !== "OperatorNode") return null;
            const operator = node as unknown as { fn?: string; args: unknown[] };
            if (operator.fn !== "unaryMinus") return null;
            const inner = operator.args[0];
            const sine = asCall(unparen(inner as never), ["sin"]);
            return sine ? call("sin", sine.args[0]!) : null;
          }),
        explain: {
          th: "อนุพันธ์ของคอสเป็นลบซิน เครื่องหมายลบนั้นหายไป",
          en: "The derivative of cosine is *minus* sine, and that minus has gone missing.",
        },
        example: { from: "-sin(x)", right: "-sin(x)", wrong: "sin(x)" },
      },
    ],
  },
  {
    id: "c1.exp-log-derivative",
    topicIds: TOPIC,
    name: {
      th: "อนุพันธ์ของ e ยกกำลัง x และ ln x",
      en: "Derivatives of the exponential and the logarithm",
    },
    statement:
      "\\frac{d}{dx}e^x = e^x, \\quad \\frac{d}{dx}\\ln x = \\frac{1}{x}",
    conditions: {
      th: "สำหรับ \\ln x ต้องมี x มากกว่าศูนย์",
      en: "the logarithm needs x above zero",
    },
    plain: {
      th: "e ยกกำลัง x เป็นฟังก์ชันเดียวที่อนุพันธ์เท่ากับตัวมันเอง นั่นคือนิยามของ e และเป็นเหตุผลที่จำนวนนี้มีอยู่",
      en: "The exponential is the one function that is its own derivative. That is what e is for, and why the number exists at all.",
    },
    mnemonic: {
      th: "อียกกำลังเอกซ์ ดิฟแล้วได้ตัวเอง",
      en: "e to the x differentiates to itself.",
    },
    examples: [
      { from: "e^x", to: "e^x" },
      {
        from: "\\ln x",
        to: "\\frac{1}{x}",
        note: {
          th: "อนุพันธ์ของลอการิทึมไม่มีลอการิทึมอยู่เลย ซึ่งเป็นเรื่องน่าประหลาดใจ",
          en: "The derivative of a logarithm contains no logarithm at all, which is a surprise worth noticing.",
        },
      },
    ],
    seeAlso: ["log.definition", "c1.trig-derivative"],
  },
];
