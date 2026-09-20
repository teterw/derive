import type { Rule } from "../types";
import { asOperator, binary, rewriteFirst } from "./misapply";

/**
 * ทฤษฎีบทค่าเฉลี่ย · Calculus I.
 *
 * The first theorem in the course that is not a recipe. Everything before it
 * says *how* to compute something; this says that something must exist,
 * without saying how to find it - and almost every later result leans on it.
 *
 * Its content is ordinary once said plainly: if you drove a hundred kilometres
 * in an hour, then at some instant the speedometer read exactly a hundred.
 */
const TOPIC = ["c1.mvt"];

export const calculusMvtRules: Rule[] = [
  {
    id: "c1.rolle",
    topicIds: TOPIC,
    name: {
      th: "ทฤษฎีบทของโรล",
      en: "Rolle's theorem",
    },
    statement: "f(a) = f(b) \\Rightarrow \\exists c : f'(c) = 0",
    conditions: {
      th: "เมื่อ f ต่อเนื่องบน [a, b] และหาอนุพันธ์ได้บน (a, b)",
      en: "when f is continuous on the closed interval and differentiable inside it",
    },
    plain: {
      th: "ถ้าออกเดินทางแล้วกลับมาที่ระดับความสูงเดิม ต้องมีจุดหนึ่งที่พื้นราบ ขึ้นไปแล้วต้องลง และระหว่างขึ้นกับลงมีจุดสูงสุด",
      en: "If you set out and come back to the same height, somewhere along the way the ground was level. What goes up must come down, and between the two there is a top.",
    },
    mnemonic: {
      th: "กลับมาที่เดิม แปลว่าเคยราบ",
      en: "Back where you started means flat somewhere.",
    },
    examples: [
      {
        from: "f(x) = x^2 - 4x, \\ x \\in [0, 4]",
        to: "c = 2",
        note: {
          th: "f(0) = f(4) = 0 จึงมีจุดที่ความชันเป็นศูนย์ และอยู่ตรงกลางพอดีสำหรับพาราโบลา",
          en: "Both ends are zero, so a flat point exists - and for a parabola it is exactly halfway.",
        },
      },
    ],
    seeAlso: ["c1.mean-value", "calc.critical-point"],
  },
  {
    id: "c1.mean-value",
    topicIds: TOPIC,
    name: {
      th: "ทฤษฎีบทค่าเฉลี่ย",
      en: "The mean value theorem",
    },
    statement: "f'(c) = \\frac{f(b) - f(a)}{b - a}",
    conditions: {
      th: "เมื่อ f ต่อเนื่องบน [a, b] และหาอนุพันธ์ได้บน (a, b)",
      en: "when f is continuous on the closed interval and differentiable inside it",
    },
    plain: {
      th: "อัตราเร็วเฉลี่ยตลอดการเดินทางต้องเกิดขึ้นจริงที่สักขณะหนึ่ง ถ้าขับได้เฉลี่ยชั่วโมงละร้อยกิโลเมตร ต้องมีวินาทีหนึ่งที่มาตรวัดอ่านได้ร้อยพอดี",
      en: "The average speed over a journey is actually achieved at some instant. Average a hundred kilometres an hour and at some moment the speedometer read exactly that.",
    },
    mnemonic: {
      th: "ความชันเฉลี่ยของคอร์ด ต้องเท่ากับความชันของเส้นสัมผัสที่ไหนสักแห่ง",
      en: "The chord's slope is some tangent's slope.",
    },
    examples: [
      {
        from: "f(x) = x^2, \\ x \\in [1, 3]",
        to: "c = 2",
        note: {
          th: "ความชันของคอร์ดคือ 4 และ f'(2) = 4 พอดี",
          en: "The chord's slope is four, and the derivative is four at exactly x = 2.",
        },
      },
    ],
    seeAlso: ["c1.rolle", "calc.tangent-slope"],
    /**
     * The quotient upside down - the interval's width over the rise, which is
     * the reciprocal of a slope and a number with no meaning here.
     */
    misapplications: [
      {
        id: "c1.mean-value/inverted-the-average-slope",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const quotient = asOperator(node, "/");
            if (!quotient) return null;
            return binary("/", quotient.args[1]!, quotient.args[0]!);
          }),
        explain: {
          th: "กลับเศษกับส่วน ความชันคือผลต่างของค่าฟังก์ชันหารด้วยผลต่างของ x",
          en: "Upside down: a slope is the change in the function over the change in x.",
        },
        example: { from: "8/2", right: "4", wrong: "1/4" },
      },
    ],
  },
  {
    id: "c1.mvt-consequence",
    topicIds: TOPIC,
    name: {
      th: "ผลที่ตามมาจากทฤษฎีบทค่าเฉลี่ย",
      en: "What the theorem is for",
    },
    statement: "|f(b) - f(a)| \\le M(b - a)",
    conditions: {
      th: "เมื่อ |f'(x)| ไม่เกิน M ตลอดช่วง",
      en: "when the derivative never exceeds M in size on the interval",
    },
    plain: {
      th: "ถ้ารู้ว่าอัตราการเปลี่ยนแปลงไม่เคยเกินค่าหนึ่ง ก็รู้ว่าค่าของฟังก์ชันเปลี่ยนไปได้ไม่เกินเท่าไร โดยไม่ต้องรู้ฟังก์ชันเลย นี่คือเหตุผลที่ทฤษฎีบทนี้สำคัญ",
      en: "Knowing only that a rate never exceeds some bound tells you how far the quantity can have moved - without knowing the function at all. That is what the theorem is for.",
    },
    mnemonic: {
      th: "เร็วไม่เกินเท่านี้ ไปได้ไกลไม่เกินเท่านั้น",
      en: "No faster than that means no further than this.",
    },
    examples: [
      {
        from: "|f'| \\le 3, \\ x \\in [0, 4]",
        to: "|f(4) - f(0)| \\le 12",
      },
      {
        from: "f' \\equiv 0",
        to: "f \\equiv c",
        note: {
          th: "ผลที่ตามมาที่สำคัญที่สุด และเป็นเหตุผลที่ปฏิยานุพันธ์ต่างกันได้แค่ค่าคงตัว",
          en: "The most important consequence of all, and the reason two antiderivatives can differ only by a constant.",
        },
      },
    ],
    seeAlso: ["c1.mean-value", "calc.derivative-constant"],
  },
];
