import type { Rule } from "../types";
import { asOperator, rewriteFirst, unparen } from "./misapply";

/**
 * กฎลูกโซ่ และการหาอนุพันธ์โดยปริยาย · Calculus I.
 *
 * The chain rule is the one differentiation rule that is not about combining
 * two functions side by side, but about one happening *inside* another. It is
 * also the one that gets left out: `\sin 2x` differentiated to `\cos 2x` is
 * wrong by a factor of two, and nothing about the answer looks wrong.
 *
 * Implicit differentiation is the chain rule applied to a `y` that is secretly
 * a function of x. There is no new rule to learn - only the willingness to
 * write `\frac{dy}{dx}` every time a y is differentiated.
 */
const TOPIC = ["c1.chain"];

export const calculusChainRules: Rule[] = [
  {
    id: "c1.chain-rule",
    topicIds: TOPIC,
    name: {
      th: "กฎลูกโซ่",
      en: "The chain rule",
    },
    statement: "\\frac{d}{dx}f(g(x)) = f'(g(x)) \\cdot g'(x)",
    plain: {
      th: "ดิฟข้างนอกโดยเก็บข้างในไว้เหมือนเดิม แล้วคูณด้วยอนุพันธ์ของข้างใน ตัวคูณตัวหลังนี่แหละที่ลืมกันบ่อยที่สุด",
      en: "Differentiate the outside, leaving the inside exactly as it was, then multiply by the derivative of the inside. That last factor is the one everybody forgets.",
    },
    mnemonic: {
      th: "ดิฟนอก คูณ ดิฟใน",
      en: "Outside derivative, times inside derivative.",
    },
    examples: [
      {
        from: "(3x + 1)^5",
        to: "15(3x + 1)^4",
        note: {
          th: "ห้าคูณสาม ได้สิบห้า สามนั้นคืออนุพันธ์ของข้างใน",
          en: "Five times three: the three is the derivative of what is inside.",
        },
      },
      { from: "\\sin 2x", to: "2\\cos 2x" },
    ],
    seeAlso: ["c1.product-rule", "c1.implicit"],
    /**
     * The inside derivative left out entirely - the single commonest mistake
     * in differentiation, and one that leaves a perfectly plausible answer.
     */
    misapplications: [
      {
        id: "c1.chain-rule/forgot-the-inside",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const product = asOperator(node, "*");
            if (!product) return null;
            const left = unparen(product.args[0]!);
            const value = Number(left.toString());
            if (!Number.isFinite(value) || value === 1) return null;
            // The outer derivative alone, without the inner factor.
            return product.args[1]!;
          }),
        explain: {
          th: "ลืมคูณด้วยอนุพันธ์ของข้างใน กฎลูกโซ่มีสองตัวคูณกันเสมอ",
          en: "The derivative of the inside was never multiplied in. The chain rule always has two factors.",
        },
        example: {
          from: "15*(3x + 1)^4",
          right: "15*(3x + 1)^4",
          wrong: "(3x + 1)^4",
        },
      },
    ],
  },
  {
    id: "c1.chain-depth",
    topicIds: TOPIC,
    name: {
      th: "กฎลูกโซ่ซ้อนกัน",
      en: "The chain rule, twice",
    },
    statement: "\\frac{d}{dx}f(g(h(x))) = f'(g(h)) \\cdot g'(h) \\cdot h'(x)",
    plain: {
      th: "ถ้ามีสามชั้นก็คูณสามตัว ทำจากชั้นนอกสุดเข้าไปทีละชั้น และอย่าหยุดจนกว่าจะถึงตัว x จริง ๆ",
      en: "Three layers means three factors. Work from the outside in, one layer at a time, and do not stop until you reach the x itself.",
    },
    mnemonic: {
      th: "ปอกทีละชั้นจนถึงแกน",
      en: "Peel one layer at a time until you reach the core.",
    },
    examples: [
      { from: "\\sin^2 3x", to: "6\\sin 3x\\cos 3x" },
      { from: "e^{x^2}", to: "2xe^{x^2}" },
    ],
    seeAlso: ["c1.chain-rule", "c1.product-rule"],
  },
  {
    id: "c1.implicit",
    topicIds: TOPIC,
    name: {
      th: "การหาอนุพันธ์โดยปริยาย",
      en: "Implicit differentiation",
    },
    statement: "\\frac{d}{dx}y^n = ny^{n-1}\\frac{dy}{dx}",
    plain: {
      th: "ถ้า y เป็นฟังก์ชันของ x โดยที่ไม่ได้เขียนออกมาตรง ๆ การดิฟ y ก็ต้องใช้กฎลูกโซ่ ทุกครั้งที่ดิฟ y จะมี dy/dx ติดออกมาด้วยเสมอ",
      en: "If y is a function of x without being written as one, differentiating it needs the chain rule - so every y that gets differentiated leaves a dy/dx behind.",
    },
    mnemonic: {
      th: "ดิฟ y เมื่อไร มี dy/dx ติดมาเมื่อนั้น",
      en: "Every y you differentiate hands you a dy/dx.",
    },
    examples: [
      {
        from: "x^2 + y^2 = 25",
        to: "\\frac{dy}{dx} = -\\frac{x}{y}",
        note: {
          th: "ดิฟทั้งสองข้าง ได้ 2x + 2y dy/dx = 0 แล้วจึงแก้หา dy/dx",
          en: "Differentiate both sides to get 2x + 2y dy/dx = 0, then solve.",
        },
      },
      { from: "xy = 6", to: "\\frac{dy}{dx} = -\\frac{y}{x}" },
    ],
    seeAlso: ["c1.chain-rule", "c1.product-rule"],
    /**
     * The term never actually moved across. Everything else is right and the
     * whole answer has the wrong sign - which on a circle means a tangent
     * sloping the wrong way at every single point.
     */
    misapplications: [
      {
        id: "c1.implicit/never-moved-the-term-across",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            if (node.type !== "OperatorNode") return null;
            const operator = node as unknown as { fn?: string; args: unknown[] };
            if (operator.fn !== "unaryMinus") return null;
            return unparen(operator.args[0] as never);
          }),
        explain: {
          th: "ลืมย้ายพจน์ข้าม เครื่องหมายจึงกลับกันทั้งคำตอบ",
          en: "The term was never moved to the other side, so the whole answer has the wrong sign.",
        },
        example: { from: "-x/y", right: "-x/y", wrong: "x/y" },
      },
    ],
  },
];
