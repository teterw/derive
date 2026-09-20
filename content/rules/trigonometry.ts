import type { Rule } from "../types";
import { asOperator, binary, rewriteFirst } from "./misapply";

/**
 * อัตราส่วนตรีโกณมิติ · ม.3.
 *
 * Three rules, and the first of them is the whole chapter. The other two are
 * the facts that make an exact answer possible: Pythagoras for the third side,
 * and the two triangles that give the special angles their values.
 *
 * ด้านตรงข้ามมุมฉาก = hypotenuse, ด้านตรงข้าม = opposite, ด้านประชิด = adjacent.
 */
const TOPIC = ["trig.ratios"];

export const trigonometryRules: Rule[] = [
  {
    id: "trig.sohcahtoa",
    topicIds: TOPIC,
    name: {
      th: "นิยามของ sin cos tan",
      en: "What sine, cosine and tangent are",
    },
    statement:
      "\\sin A = \\frac{a}{c}, \\quad \\cos A = \\frac{b}{c}, \\quad \\tan A = \\frac{a}{b}",
    conditions: {
      th: "เมื่อ a คือด้านตรงข้ามมุม A, b คือด้านประชิด และ c คือด้านตรงข้ามมุมฉาก",
      en: "where a is opposite A, b is adjacent to it, and c is the hypotenuse",
    },
    plain: {
      th: "อัตราส่วนตรีโกณมิติคืออัตราส่วนของความยาวด้านสองด้านในสามเหลี่ยมมุมฉาก ไม่ใช่ความยาวด้าน จึงไม่มีหน่วย",
      en: "A trigonometric ratio is a ratio of two side lengths in a right-angled triangle. It is not a length, so it has no units.",
    },
    mnemonic: {
      th: "ซิน ข้ามส่วนฉาก คอส ชิดส่วนฉาก แทน ข้ามส่วนชิด",
      en: "Sine is opposite over hypotenuse, cosine adjacent over hypotenuse, tangent opposite over adjacent.",
    },
    examples: [
      {
        from: "a = 3, \\ b = 4, \\ c = 5",
        to: "\\sin A = \\frac{3}{5}",
        note: {
          th: "ด้านตรงข้ามมุมฉากคือด้านที่ยาวที่สุดเสมอ และอยู่ตรงข้ามมุมฉาก",
          en: "The hypotenuse is always the longest side, and always opposite the right angle.",
        },
      },
      { from: "a = 3, \\ b = 4", to: "\\tan A = \\frac{3}{4}" },
    ],
    seeAlso: ["trig.pythagoras", "trig.special-angles"],
    /**
     * Sine and cosine swapped. The ratios are right and the triangle is read
     * from the wrong corner, which is the single commonest slip in the topic.
     */
    misapplications: [
      {
        id: "trig.sohcahtoa/swapped-sin-cos",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const quotient = asOperator(node, "/");
            if (!quotient) return null;
            return binary("/", quotient.args[1]!, quotient.args[0]!);
          }),
        explain: {
          th: "สลับตัวเศษกับตัวส่วน หรือสลับด้านตรงข้ามกับด้านประชิด ให้ดูจากมุมที่โจทย์ถามเสมอ",
          en: "The two sides are the wrong way round. Which side is opposite and which adjacent is decided by the angle being asked about.",
        },
        example: { from: "3/5", right: "3/5", wrong: "5/3" },
      },
    ],
  },
  {
    id: "trig.pythagoras",
    topicIds: TOPIC,
    name: {
      th: "ทฤษฎีบทพีทาโกรัส",
      en: "Pythagoras' theorem",
    },
    statement: "a^2 + b^2 = c^2",
    conditions: {
      th: "เมื่อ c คือด้านตรงข้ามมุมฉาก",
      en: "where c is the hypotenuse",
    },
    plain: {
      th: "รู้ด้านสองด้านของสามเหลี่ยมมุมฉาก ก็หาด้านที่สามได้เสมอ โดยไม่ต้องรู้มุมเลย",
      en: "Two sides of a right-angled triangle always give the third, with no angle needed.",
    },
    mnemonic: {
      th: "ฉากกำลังสอง เท่ากับ ผลบวกของอีกสองด้านกำลังสอง",
      en: "The hypotenuse squared is the sum of the other two squared.",
    },
    examples: [
      { from: "a = 3, \\ b = 4", to: "c = 5" },
      {
        from: "a = 5, \\ c = 13",
        to: "b = 12",
        note: {
          th: "หาด้านประชิดต้องลบ ไม่ใช่บวก เพราะด้านที่รู้ตัวหนึ่งเป็นด้านตรงข้ามมุมฉาก",
          en: "Finding a shorter side is a subtraction, because one of the sides you know is the hypotenuse.",
        },
      },
    ],
    seeAlso: ["trig.sohcahtoa"],
  },
  {
    id: "trig.special-angles",
    topicIds: TOPIC,
    name: {
      th: "อัตราส่วนตรีโกณมิติของมุมพิเศษ",
      en: "The special angles",
    },
    statement:
      "\\sin 30^\\circ = \\frac{1}{2}, \\quad \\sin 45^\\circ = \\frac{\\sqrt{2}}{2}, \\quad \\sin 60^\\circ = \\frac{\\sqrt{3}}{2}",
    plain: {
      th: "ค่าของมุม 30 45 และ 60 องศา มาจากสามเหลี่ยมสองรูป คือสามเหลี่ยมด้านเท่าที่ถูกผ่าครึ่ง และสามเหลี่ยมมุมฉากหน้าจั่ว",
      en: "The values at thirty, forty-five and sixty degrees come from two triangles: an equilateral one cut in half, and a right-angled isosceles one.",
    },
    mnemonic: {
      th: "ซินของ 30 45 60 คือ ราก1 ราก2 ราก3 ส่วนสอง ส่วนคอสไล่กลับทาง",
      en: "The sines of 30, 45 and 60 are root one, root two and root three, each over two - and the cosines run the other way.",
    },
    examples: [
      {
        from: "\\sin 30^\\circ",
        to: "\\frac{1}{2}",
        note: {
          th: "มาจากสามเหลี่ยมด้านเท่าที่ผ่าครึ่ง ด้านตรงข้ามมุม 30 จึงเป็นครึ่งหนึ่งของด้านตรงข้ามมุมฉากพอดี",
          en: "From an equilateral triangle cut in half: the side opposite the thirty is exactly half the hypotenuse.",
        },
      },
      { from: "\\tan 45^\\circ", to: "1" },
    ],
    seeAlso: ["trig.sohcahtoa", "rad.rationalize-monomial"],
  },
];
