import type { Rule } from "../types";
import { asOperator, binary, rewriteFirst, unparen } from "./misapply";

/**
 * การประยุกต์ของอนุพันธ์ · Calculus I.
 *
 * What a derivative is *for*. The sign of `f'` says which way the graph is
 * going; the sign of `f''` says which way it is bending; and between them they
 * locate every high point, low point and change of curvature a function has.
 *
 * ค่าสูงสุด = maximum, ค่าต่ำสุด = minimum, จุดเปลี่ยนเว้า = inflection point,
 * อัตราการเปลี่ยนแปลงเทียบกับเวลา = related rate.
 */
const TOPIC = ["c1.applications"];

export const calculusApplicationRules: Rule[] = [
  {
    id: "c1.increasing-decreasing",
    topicIds: TOPIC,
    name: {
      th: "ฟังก์ชันเพิ่มและฟังก์ชันลด",
      en: "Increasing and decreasing",
    },
    statement: "f'(x) > 0 \\Rightarrow f \\text{ เพิ่ม}",
    plain: {
      th: "อนุพันธ์คือความชัน ความชันเป็นบวกแปลว่ากราฟกำลังขึ้น เป็นลบแปลว่ากำลังลง เครื่องหมายของอนุพันธ์จึงบอกทิศทางของกราฟได้ทั้งหมด",
      en: "The derivative is the slope, so a positive derivative means the graph is climbing and a negative one means it is falling. The sign of f' is the whole story of which way the graph goes.",
    },
    mnemonic: {
      th: "ดิฟบวกขึ้น ดิฟลบลง",
      en: "Positive up, negative down.",
    },
    examples: [
      { from: "f(x) = x^2, \\ x > 0", to: "f' > 0 \\text{ จึงเพิ่ม}" },
      {
        from: "f(x) = x^2 - 6x",
        to: "\\text{ลดบน } x < 3",
        note: {
          th: "เปลี่ยนทิศตรงที่อนุพันธ์เป็นศูนย์พอดี",
          en: "It changes direction exactly where the derivative is zero.",
        },
      },
    ],
    seeAlso: ["c1.second-derivative", "calc.critical-point"],
  },
  {
    id: "c1.second-derivative",
    topicIds: TOPIC,
    name: {
      th: "การทดสอบด้วยอนุพันธ์อันดับสอง",
      en: "The second derivative test",
    },
    statement: "f'(c) = 0 \\text{ และ } f''(c) > 0 \\Rightarrow \\text{ต่ำสุด}",
    conditions: {
      th: "ถ้า f''(c) เป็นศูนย์ การทดสอบนี้บอกอะไรไม่ได้",
      en: "if f''(c) is zero the test says nothing at all",
    },
    plain: {
      th: "อนุพันธ์อันดับสองบอกว่ากราฟโค้งขึ้นหรือโค้งลง ที่จุดวิกฤต ถ้ากราฟโค้งขึ้นก็เป็นก้นแอ่ง คือต่ำสุด ถ้าโค้งลงก็เป็นยอด คือสูงสุด",
      en: "The second derivative says which way the graph is bending. At a critical point, bending upwards makes it the bottom of a valley and bending downwards makes it a peak.",
    },
    mnemonic: {
      th: "โค้งขึ้นเป็นแอ่ง โค้งลงเป็นยอด",
      en: "Bending up is a valley; bending down is a peak.",
    },
    examples: [
      { from: "f(x) = x^2, \\ f''= 2", to: "\\text{ต่ำสุดที่ } x = 0" },
      { from: "f(x) = -x^2, \\ f'' = -2", to: "\\text{สูงสุดที่ } x = 0" },
    ],
    seeAlso: ["calc.critical-point", "c1.inflection"],
    /**
     * The test read backwards - positive second derivative called a maximum.
     * It gives a confident answer that is exactly wrong, every time.
     */
    misapplications: [
      {
        id: "c1.second-derivative/read-the-test-backwards",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            if (node.type !== "OperatorNode") return null;
            const operator = node as unknown as { fn?: string; args: unknown[] };
            if (operator.fn !== "unaryMinus") return null;
            return unparen(operator.args[0] as never);
          }),
        explain: {
          th: "สลับความหมายของการทดสอบ อนุพันธ์อันดับสองเป็นบวกคือต่ำสุด ไม่ใช่สูงสุด",
          en: "The test the wrong way round: a positive second derivative means a minimum.",
        },
        example: { from: "-4", right: "-4", wrong: "4" },
      },
    ],
  },
  {
    id: "c1.inflection",
    topicIds: TOPIC,
    name: {
      th: "จุดเปลี่ยนเว้า",
      en: "Inflection points",
    },
    statement: "f''(x) = 0 \\text{ และเปลี่ยนเครื่องหมาย}",
    plain: {
      th: "จุดที่กราฟเปลี่ยนจากโค้งขึ้นเป็นโค้งลง หรือกลับกัน อนุพันธ์อันดับสองต้องเป็นศูนย์ที่นั่น แต่แค่เป็นศูนย์ยังไม่พอ ต้องเปลี่ยนเครื่องหมายด้วย",
      en: "Where the graph stops bending one way and starts bending the other. The second derivative has to be zero there - but being zero is not enough, it has to change sign.",
    },
    mnemonic: {
      th: "ดิฟสองเปลี่ยนเครื่องหมาย ไม่ใช่แค่เป็นศูนย์",
      en: "The second derivative must change sign, not merely vanish.",
    },
    examples: [
      { from: "f(x) = x^3", to: "x = 0" },
      {
        from: "f(x) = x^4",
        to: "\\text{ไม่มีจุดเปลี่ยนเว้า}",
        note: {
          th: "อนุพันธ์อันดับสองเป็นศูนย์ที่ศูนย์ แต่ไม่เปลี่ยนเครื่องหมาย กราฟจึงโค้งขึ้นตลอด",
          en: "Its second derivative is zero at the origin but never changes sign, so the graph bends upwards throughout.",
        },
      },
    ],
    seeAlso: ["c1.second-derivative", "c1.increasing-decreasing"],
  },
  {
    id: "c1.closed-interval",
    topicIds: TOPIC,
    name: {
      th: "ค่าสูงสุดและต่ำสุดบนช่วงปิด",
      en: "Extreme values on a closed interval",
    },
    statement: "\\max f \\in \\{f(a), f(b), f(c) : f'(c) = 0\\}",
    plain: {
      th: "บนช่วงปิด ค่าสูงสุดอยู่ที่จุดวิกฤตหรือที่ปลายช่วงเท่านั้น ไม่มีที่อื่น จึงคิดทุกจุดแล้วเทียบกัน",
      en: "On a closed interval the largest value is at a critical point or at an end, and nowhere else. So work out all of them and compare.",
    },
    mnemonic: {
      th: "จุดวิกฤตกับปลายช่วง แค่นั้น",
      en: "Critical points and the two ends, and that is the whole list.",
    },
    examples: [
      {
        from: "f(x) = x^2 - 4x \\text{ บน } [0, 3]",
        to: "\\min = -4, \\ \\max = 0",
        note: {
          th: "ปลายช่วงมีสิทธิ์เป็นคำตอบเสมอ แม้ความชันตรงนั้นจะไม่เป็นศูนย์",
          en: "An endpoint can win even though the slope there is nothing like zero.",
        },
      },
    ],
    seeAlso: ["calc.critical-point", "c1.second-derivative"],
  },
  {
    id: "c1.related-rates",
    topicIds: TOPIC,
    name: {
      th: "อัตราการเปลี่ยนแปลงที่สัมพันธ์กัน",
      en: "Related rates",
    },
    statement: "\\frac{dV}{dt} = \\frac{dV}{dr} \\cdot \\frac{dr}{dt}",
    plain: {
      th: "ถ้าสองปริมาณสัมพันธ์กันด้วยสมการ อัตราการเปลี่ยนแปลงของมันก็สัมพันธ์กันด้วยอนุพันธ์ของสมการนั้น นี่คือกฎลูกโซ่ที่ตัวแปรเป็นเวลา",
      en: "If two quantities are tied together by an equation, their rates are tied together by its derivative. It is the chain rule with time as the variable.",
    },
    mnemonic: {
      th: "ดิฟสมการเทียบกับเวลา ทั้งสมการ",
      en: "Differentiate the whole equation with respect to time.",
    },
    examples: [
      {
        from: "V = \\frac{4}{3}\\pi r^3, \\ \\frac{dr}{dt} = 2",
        to: "\\frac{dV}{dt} = 8\\pi r^2",
        note: {
          th: "อัตราการเปลี่ยนแปลงของปริมาตรขึ้นกับรัศมีปัจจุบันด้วย ไม่ใช่ค่าคงตัว",
          en: "The volume's rate depends on the current radius; it is not a constant.",
        },
      },
    ],
    seeAlso: ["c1.chain-rule", "c1.implicit"],
    /**
     * The rate treated as the quantity: substituting the radius before
     * differentiating, which leaves a constant and a rate of zero.
     */
    misapplications: [
      {
        id: "c1.related-rates/multiplied-instead-of-chained",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const product = asOperator(node, "*");
            if (!product) return null;
            return binary("+", product.args[0]!, product.args[1]!);
          }),
        explain: {
          th: "อัตราสองตัวคูณกันตามกฎลูกโซ่ ไม่ได้บวกกัน",
          en: "The two rates multiply, as the chain rule says. They do not add.",
        },
        example: { from: "3*4", right: "12", wrong: "7" },
      },
    ],
  },
];
