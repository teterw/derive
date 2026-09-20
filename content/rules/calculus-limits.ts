import type { Rule } from "../types";
import { asOperator, binary, rewriteFirst, unparen } from "./misapply";

/**
 * ลิมิตและความต่อเนื่อง · Calculus I.
 *
 * ม.6 met limits as a way of getting an answer when substitution failed. Here
 * they become the subject itself: a limit that depends on which side you
 * approach from, a limit taken at infinity rather than at a number, and
 * continuity - which is a statement *about* a limit rather than a way of
 * computing one.
 *
 * ลิมิตซ้าย = left-hand limit, ลิมิตขวา = right-hand limit,
 * ความต่อเนื่อง = continuity, เส้นกำกับ = asymptote.
 */
const TOPIC = ["c1.limits"];

export const calculusLimitRules: Rule[] = [
  {
    id: "c1.one-sided",
    topicIds: TOPIC,
    name: {
      th: "ลิมิตซ้ายและลิมิตขวา",
      en: "One-sided limits",
    },
    statement:
      "\\lim_{x \\to a} f(x) = L \\iff \\lim_{x \\to a^-} f(x) = \\lim_{x \\to a^+} f(x) = L",
    plain: {
      th: "ลิมิตมีค่าก็ต่อเมื่อเข้าใกล้จากทางซ้ายและทางขวาแล้วได้ค่าเดียวกัน ถ้าสองข้างไม่เท่ากัน ลิมิตไม่มีค่า ถึงแม้ฟังก์ชันจะมีค่าที่จุดนั้นก็ตาม",
      en: "A limit exists only when coming from the left and from the right give the same answer. If the two sides disagree there is no limit, even if the function has a perfectly good value there.",
    },
    mnemonic: {
      th: "สองข้างต้องตรงกัน ไม่งั้นไม่มีลิมิต",
      en: "Both sides must agree, or there is no limit.",
    },
    examples: [
      {
        from: "f(x) = \\begin{cases} x + 1 & x < 2 \\\\ 5 - x & x \\ge 2\\end{cases}",
        to: "\\lim_{x \\to 2^-} f(x) = 3",
        note: {
          th: "ใช้สูตรของช่วงที่อยู่ทางซ้ายของ 2 เท่านั้น",
          en: "Only the piece that lives to the left of 2 is used.",
        },
      },
      {
        from: "\\lim_{x \\to 2^+} f(x)",
        to: "3",
        note: {
          th: "สองข้างเท่ากันพอดี ลิมิตจึงมีค่าและเท่ากับ 3",
          en: "Here the two sides agree, so the limit exists and is 3.",
        },
      },
    ],
    seeAlso: ["c1.continuity", "calc.limit-substitution"],
    /**
     * The wrong branch used - the value read off the side the question is not
     * about, which gives a confident answer to the other question.
     */
    misapplications: [
      {
        id: "c1.one-sided/read-the-other-side",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const difference = asOperator(node, "-");
            if (!difference) return null;
            return binary("-", difference.args[1]!, difference.args[0]!);
          }),
        explain: {
          th: "อ่านจากสูตรของอีกข้างหนึ่ง ให้ดูว่าโจทย์ถามลิมิตซ้ายหรือลิมิตขวา",
          en: "That is the other side's piece. Check whether the question asks for the left or the right.",
        },
        example: { from: "5 - 2", right: "3", wrong: "-3" },
      },
    ],
  },
  {
    id: "c1.limit-at-infinity",
    topicIds: TOPIC,
    name: {
      th: "ลิมิตที่อนันต์",
      en: "Limits at infinity",
    },
    statement: "\\lim_{x \\to \\infty} \\frac{1}{x^n} = 0",
    conditions: {
      th: "เมื่อ n เป็นจำนวนบวก",
      en: "for any positive n",
    },
    plain: {
      th: "หารทุกพจน์ด้วยกำลังสูงสุดของตัวส่วน แล้วทุกพจน์ที่ยังมี x อยู่ในตัวส่วนจะกลายเป็นศูนย์ เหลือเพียงอัตราส่วนของสัมประสิทธิ์นำ",
      en: "Divide every term by the highest power in the denominator: everything still holding an x underneath goes to zero, and what is left is the ratio of the leading coefficients.",
    },
    mnemonic: {
      th: "ดีกรีเท่ากัน ดูสัมประสิทธิ์นำ ดีกรีบนน้อยกว่า ได้ศูนย์",
      en: "Same degree, take the leading coefficients; smaller on top, it is zero.",
    },
    examples: [
      { from: "\\lim_{x \\to \\infty} \\frac{3x^2 + 1}{2x^2 - x}", to: "\\frac{3}{2}" },
      {
        from: "\\lim_{x \\to \\infty} \\frac{x + 4}{x^2}",
        to: "0",
        note: {
          th: "ตัวส่วนโตเร็วกว่ามาก อัตราส่วนจึงเข้าใกล้ศูนย์",
          en: "The bottom grows far faster, so the ratio shrinks to nothing.",
        },
      },
    ],
    seeAlso: ["c1.asymptote", "calc.limit-substitution"],
  },
  {
    id: "c1.asymptote",
    topicIds: TOPIC,
    name: {
      th: "เส้นกำกับ",
      en: "Asymptotes",
    },
    statement: "y = L \\text{ และ } x = a",
    plain: {
      th: "เส้นกำกับแนวนอนคือค่าที่กราฟเข้าใกล้เมื่อ x ใหญ่ขึ้นเรื่อย ๆ เส้นกำกับแนวตั้งอยู่ตรงที่ตัวส่วนเป็นศูนย์แต่ตัวเศษไม่เป็น ถ้าเป็นศูนย์ทั้งคู่ นั่นคือรูโหว่ ไม่ใช่เส้นกำกับ",
      en: "A horizontal asymptote is what the graph approaches far out. A vertical one sits where the denominator is zero and the numerator is not - if both are zero it is a hole, not an asymptote.",
    },
    mnemonic: {
      th: "ตัวส่วนเป็นศูนย์ตัวเดียว คือเส้นกำกับ เป็นศูนย์ทั้งคู่ คือรูโหว่",
      en: "Bottom alone is an asymptote; both together is a hole.",
    },
    examples: [
      { from: "\\frac{x + 1}{x - 3}", to: "x = 3" },
      {
        from: "\\frac{x^2 - 9}{x - 3}",
        to: "\\text{ไม่มีเส้นกำกับแนวตั้ง}",
        note: {
          th: "ตัวเศษเป็นศูนย์ที่ x = 3 ด้วย จึงตัดกันได้ เหลือเป็นรูโหว่",
          en: "The numerator is zero there too, so it cancels and leaves a hole.",
        },
      },
    ],
    seeAlso: ["c1.limit-at-infinity", "calc.limit-factor-cancel"],
  },
  {
    id: "c1.continuity",
    topicIds: TOPIC,
    name: {
      th: "ความต่อเนื่องที่จุดหนึ่ง",
      en: "Continuity at a point",
    },
    statement: "\\lim_{x \\to a} f(x) = f(a)",
    conditions: {
      th: "และทั้งสองข้างต้องมีค่าจริง",
      en: "and both sides have to exist in the first place",
    },
    plain: {
      th: "ต่อเนื่องที่จุดหนึ่งต้องครบสามข้อ ฟังก์ชันมีค่าที่จุดนั้น ลิมิตมีค่า และสองอย่างนั้นเท่ากัน ขาดข้อใดข้อหนึ่งก็ไม่ต่อเนื่อง",
      en: "Three things, all required: the function has a value there, the limit exists, and the two are equal. Miss any one and it is not continuous.",
    },
    mnemonic: {
      th: "วาดได้โดยไม่ยกปากกา",
      en: "You could draw it without lifting the pen.",
    },
    examples: [
      {
        from: "f(x) = \\begin{cases} x + k & x < 1 \\\\ 3x & x \\ge 1\\end{cases}",
        to: "k = 2",
        note: {
          th: "ให้ลิมิตซ้ายเท่ากับลิมิตขวา จะได้สมการหาค่า k",
          en: "Setting the two sides equal turns into an equation for k.",
        },
      },
    ],
    seeAlso: ["c1.one-sided", "calc.limit-substitution"],
  },
  {
    id: "c1.trig-limit",
    topicIds: TOPIC,
    name: {
      th: "ลิมิตตรีโกณมิติพื้นฐาน",
      en: "The fundamental trigonometric limit",
    },
    statement: "\\lim_{x \\to 0}\\frac{\\sin x}{x} = 1",
    conditions: {
      th: "เมื่อ x เป็นเรเดียน",
      en: "with x in radians",
    },
    plain: {
      th: "ที่มุมเล็ก ๆ ค่าของไซน์กับตัวมุมเองแทบจะเท่ากัน อัตราส่วนจึงเข้าใกล้หนึ่ง ข้อนี้เป็นจริงเฉพาะเมื่อวัดมุมเป็นเรเดียน และเป็นเหตุผลที่แคลคูลัสไม่ใช้องศา",
      en: "For a small angle the sine and the angle itself are almost the same number, so the ratio approaches one. It is only true in radians - which is why calculus never uses degrees.",
    },
    mnemonic: {
      th: "ไซน์ของมุมเล็ก ๆ ก็คือมุมนั้นเอง",
      en: "For small angles, the sine is the angle.",
    },
    examples: [
      { from: "\\lim_{x \\to 0}\\frac{\\sin 3x}{x}", to: "3" },
      {
        from: "\\lim_{x \\to 0}\\frac{\\sin 3x}{\\sin 5x}",
        to: "\\frac{3}{5}",
        note: {
          th: "คูณและหารให้ตัวประกอบเข้าคู่กับมุมของมันเอง แล้วแต่ละคู่จะกลายเป็นหนึ่ง",
          en: "Match each sine with its own angle and every pair turns into one.",
        },
      },
    ],
    seeAlso: ["trig.unit-circle", "calc.limit-factor-cancel"],
    /**
     * The coefficients crossed over: `\sin 3x / \sin 5x` read as five thirds.
     */
    misapplications: [
      {
        id: "c1.trig-limit/inverted-the-ratio",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const quotient = asOperator(node, "/");
            if (!quotient) return null;
            return binary(
              "/",
              unparen(quotient.args[1]!),
              unparen(quotient.args[0]!),
            );
          }),
        explain: {
          th: "กลับเศษกับส่วน สัมประสิทธิ์ของมุมข้างบนอยู่ข้างบน",
          en: "The two are the wrong way round: the top angle's coefficient stays on top.",
        },
        example: { from: "3/5", right: "3/5", wrong: "5/3" },
      },
    ],
  },
];
