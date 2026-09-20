import type { Rule } from "../types";
import { asOperator, binary, constant, rewriteFirst } from "./misapply";

/**
 * ทฤษฎีบทหลักมูลของแคลคูลัส · Calculus I.
 *
 * The result the whole course is built towards. Two ideas that arrived
 * separately - the slope of a curve and the area under one - turn out to be
 * inverse operations, and the theorem is the proof of it.
 *
 * It is worth not flattening this into "the rule for definite integrals". The
 * rule is a consequence; the theorem is the statement that area and slope undo
 * each other, which nobody would guess.
 */
const TOPIC = ["c1.ftc"];

export const calculusFtcRules: Rule[] = [
  {
    id: "c1.ftc-first",
    topicIds: TOPIC,
    name: {
      th: "ทฤษฎีบทหลักมูล ส่วนที่หนึ่ง",
      en: "The fundamental theorem, part one",
    },
    statement: "\\frac{d}{dx}\\int_a^x f(t)\\,dt = f(x)",
    conditions: {
      th: "เมื่อ f ต่อเนื่อง",
      en: "for a continuous f",
    },
    plain: {
      th: "ถ้าสะสมพื้นที่ไปเรื่อย ๆ อัตราที่พื้นที่เพิ่มขึ้นคือความสูงของกราฟตรงขอบที่กำลังเคลื่อนที่ ไม่ต้องคิดปริพันธ์เลย แค่แทน x ลงในฟังก์ชัน",
      en: "If you accumulate area as you go, the rate it grows at is the height of the graph at the moving edge. No integration is needed at all - just put x into the function.",
    },
    mnemonic: {
      th: "ดิฟกับอินทิเกรตหักล้างกัน",
      en: "The derivative undoes the integral.",
    },
    examples: [
      { from: "\\frac{d}{dx}\\int_1^x t^2\\,dt", to: "x^2" },
      {
        from: "\\frac{d}{dx}\\int_0^{x^2} t\\,dt",
        to: "2x^3",
        note: {
          th: "ขอบบนไม่ใช่ x เฉย ๆ จึงต้องใช้กฎลูกโซ่ด้วย คูณด้วยอนุพันธ์ของขอบบน",
          en: "The upper limit is not plain x, so the chain rule joins in: multiply by the limit's derivative.",
        },
      },
    ],
    seeAlso: ["c1.ftc-second", "c1.chain-rule"],
    /**
     * The lower limit substituted as well, as though the theorem said
     * `f(x) - f(a)`. It does not: the lower limit is a constant and
     * contributes nothing to the rate.
     */
    misapplications: [
      {
        id: "c1.ftc-first/subtracted-the-lower-limit",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const power = asOperator(node, "^");
            if (!power) return null;
            return binary("-", node, power.args[1]!);
          }),
        explain: {
          th: "เอาขอบล่างมาลบด้วย ส่วนที่หนึ่งของทฤษฎีบทให้แค่ f ที่ขอบบน ขอบล่างเป็นค่าคงตัวจึงไม่มีผลต่ออัตรา",
          en: "The lower limit was subtracted as well. Part one gives only f at the upper limit; the lower one is a constant and contributes nothing.",
        },
        example: { from: "x^2", right: "x^2", wrong: "x^2 - 2" },
      },
    ],
  },
  {
    id: "c1.ftc-second",
    topicIds: TOPIC,
    name: {
      th: "ทฤษฎีบทหลักมูล ส่วนที่สอง",
      en: "The fundamental theorem, part two",
    },
    statement: "\\int_a^b f(x)\\,dx = F(b) - F(a)",
    conditions: {
      th: "เมื่อ F เป็นปฏิยานุพันธ์ใดก็ได้ของ f",
      en: "for any antiderivative F of f",
    },
    plain: {
      th: "พื้นที่ใต้กราฟหาได้โดยไม่ต้องบวกแท่งสี่เหลี่ยมเลย แค่หาฟังก์ชันที่ดิฟแล้วได้ f แล้วแทนค่าปลายทั้งสอง นี่คือสิ่งที่ทำให้แคลคูลัสใช้งานได้จริง",
      en: "The area under a graph can be found without adding a single rectangle: find something that differentiates to f and take its values at the ends. This is what makes calculus usable.",
    },
    mnemonic: {
      th: "หาปฏิยานุพันธ์ แล้วขอบบนลบขอบล่าง",
      en: "Antiderivative, then top minus bottom.",
    },
    examples: [
      { from: "\\int_0^2 3x^2\\,dx", to: "8" },
      {
        from: "\\int_0^{\\pi} \\sin x\\,dx",
        to: "2",
        note: {
          th: "คำตอบไม่มี พาย เลย ทั้งที่ขอบเขตมี ซึ่งเป็นเรื่องที่น่าสนใจ",
          en: "No pi survives into the answer, even though the limit had one - which is worth noticing.",
        },
      },
    ],
    seeAlso: ["c1.ftc-first", "c1.definite-integral"],
  },
  {
    id: "c1.net-change",
    topicIds: TOPIC,
    name: {
      th: "ปริพันธ์ของอัตราคือการเปลี่ยนแปลงสุทธิ",
      en: "The integral of a rate is the net change",
    },
    statement: "\\int_a^b f'(x)\\,dx = f(b) - f(a)",
    plain: {
      th: "ถ้ารู้ว่าอะไรเปลี่ยนแปลงเร็วแค่ไหนตลอดช่วงเวลาหนึ่ง ก็รู้ว่ามันเปลี่ยนไปทั้งหมดเท่าไร ปริพันธ์ของความเร็วคือระยะทางสุทธิ ปริพันธ์ของอัตราการไหลคือปริมาตรที่ไหลไป",
      en: "Know how fast something is changing throughout an interval and you know how much it changed in total. The integral of a speed is a displacement; the integral of a flow rate is a volume.",
    },
    mnemonic: {
      th: "อัตรารวมกันได้การเปลี่ยนแปลง",
      en: "Rates add up to change.",
    },
    examples: [
      {
        from: "v(t) = 3t^2, \\ 0 \\le t \\le 2",
        to: "s = 8",
        note: {
          th: "เป็นการกระจัดสุทธิ ถ้าความเร็วติดลบบางช่วง ระยะทางจริงจะมากกว่านี้",
          en: "That is the net displacement. If the velocity ever went negative, the distance travelled would be more.",
        },
      },
    ],
    seeAlso: ["c1.ftc-second", "calc.definite-integral"],
  },
  {
    id: "c1.area-between",
    topicIds: TOPIC,
    name: {
      th: "พื้นที่ระหว่างเส้นโค้งสองเส้น",
      en: "The area between two curves",
    },
    statement: "A = \\int_a^b (f - g)\\,dx",
    conditions: {
      th: "เมื่อ f อยู่เหนือ g ตลอดช่วงนั้น",
      en: "where f is the upper curve throughout",
    },
    plain: {
      th: "พื้นที่ระหว่างสองเส้นคือพื้นที่ใต้เส้นบนลบพื้นที่ใต้เส้นล่าง ซึ่งรวมเป็นปริพันธ์เดียวของผลต่าง ต้องรู้ก่อนว่าเส้นไหนอยู่บน",
      en: "The area between two curves is the area under the upper one minus the area under the lower, which is one integral of the difference. Knowing which is which comes first.",
    },
    mnemonic: {
      th: "บนลบล่าง แล้วอินทิเกรต",
      en: "Upper minus lower, then integrate.",
    },
    examples: [
      {
        from: "y = x, \\ y = x^2",
        to: "A = \\frac{1}{6}",
        note: {
          th: "ระหว่างศูนย์กับหนึ่ง เส้นตรงอยู่เหนือพาราโบลา นอกช่วงนั้นสลับกัน",
          en: "Between zero and one the line is above the parabola; outside that interval they swap.",
        },
      },
    ],
    seeAlso: ["c1.ftc-second", "quad.zero-product"],
    /**
     * The curves subtracted the wrong way round, which gives the right
     * magnitude with a minus in front - and an area is never negative.
     */
    misapplications: [
      {
        id: "c1.area-between/subtracted-the-wrong-way",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const quotient = asOperator(node, "/");
            if (!quotient) return null;
            return binary(
              "/",
              binary("-", constant(0), quotient.args[0]!),
              quotient.args[1]!,
            );
          }),
        explain: {
          th: "ลบสลับที่ พื้นที่ติดลบไม่ได้ ให้ดูว่าเส้นไหนอยู่เหนือกว่าในช่วงนั้น",
          en: "Subtracted the wrong way round. An area cannot be negative - check which curve is on top.",
        },
        example: { from: "1/6", right: "1/6", wrong: "-1/6" },
      },
    ],
  },
];
