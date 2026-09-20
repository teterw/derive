import type { Rule } from "../types";
import { asOperator, binary, rewriteFirst, unparen } from "./misapply";

/**
 * ความสัมพันธ์และฟังก์ชัน · ม.4 เพิ่มเติม.
 *
 * Three rules about what the notation *means*, which is the whole content of
 * the chapter. None of them is a formula to apply; each is a way of reading
 * something that has been on the page since ม.1 and never had to be read
 * carefully before.
 *
 * ฟังก์ชันประกอบ = composite function, ฟังก์ชันผกผัน = inverse function.
 */
const TOPIC = ["func.relations"];

export const relationRules: Rule[] = [
  {
    id: "func.notation",
    topicIds: TOPIC,
    name: {
      th: "สัญลักษณ์ของฟังก์ชัน",
      en: "Function notation",
    },
    statement: "f: a \\mapsto f(a)",
    plain: {
      th: "f(a) คือค่าที่ได้จากการแทน a ลงในทุกที่ที่มี x ไม่ใช่ f คูณกับ a วงเล็บตรงนี้ไม่ได้แปลว่าคูณ",
      en: "f(a) is what you get by putting a wherever x appears. It is not f times a: the bracket here does not mean multiply.",
    },
    mnemonic: {
      th: "เห็นวงเล็บหลังชื่อฟังก์ชัน ให้อ่านว่า ที่ ไม่ใช่ คูณ",
      en: "A bracket after a function's name is read at, not times.",
    },
    examples: [
      {
        from: "f(x) = x^2 - 3x",
        to: "f(4) = 4",
        note: {
          th: "แทน 4 ทุกที่ที่มี x จะได้ 16 ลบ 12",
          en: "Putting 4 everywhere x appears gives 16 minus 12.",
        },
      },
      { from: "f(x) = 2x + 1", to: "f(a + 1) = 2a + 3" },
    ],
    seeAlso: ["func.composite", "func.inverse-swap"],
  },
  {
    id: "func.composite",
    topicIds: TOPIC,
    name: {
      th: "ฟังก์ชันประกอบ",
      en: "Composite functions",
    },
    statement: "(f \\circ g)(x) = f(g(x))",
    plain: {
      th: "ทำ g ก่อน แล้วเอาผลที่ได้ไปใส่ใน f ลำดับสำคัญ สลับกันแล้วมักได้คนละฟังก์ชัน",
      en: "Do g first and feed the result into f. The order matters: swapping them usually gives a different function.",
    },
    mnemonic: {
      th: "อ่านจากในออกนอก ตัวที่อยู่ใกล้ x ทำก่อน",
      en: "Read from the inside out: whichever is next to the x goes first.",
    },
    examples: [
      {
        from: "f(x) = x + 3, \\ g(x) = 2x",
        to: "f(g(x)) = 2x + 3",
        note: {
          th: "ส่วน g(f(x)) จะได้ 2x + 6 ซึ่งไม่เท่ากัน",
          en: "Whereas g(f(x)) is 2x + 6, which is not the same.",
        },
      },
      { from: "f(x) = x^2, \\ g(x) = x - 1", to: "f(g(x)) = (x-1)^2" },
    ],
    seeAlso: ["func.notation"],
    /**
     * Doing the two functions in the wrong order. The arithmetic is right and
     * the answer is a different function, which is exactly why it is worth
     * naming rather than marking as simply wrong.
     */
    misapplications: [
      {
        id: "func.composite/wrong-order",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            // `2*(x + 3)` becoming `2*x + 3`: the outer operation applied to
            // only the first term of the inner one.
            const product = asOperator(node, "*");
            if (!product) return null;
            for (const op of ["+", "-"] as const) {
              const inner = asOperator(unparen(product.args[1]!), op);
              if (!inner) continue;
              return binary(
                op,
                binary("*", product.args[0]!, inner.args[0]!),
                inner.args[1]!,
              );
            }
            return null;
          }),
        explain: {
          th: "ฟังก์ชันข้างนอกทำกับผลลัพธ์ทั้งก้อนของฟังก์ชันข้างใน ไม่ใช่ทำกับพจน์แรกพจน์เดียว",
          en: "The outer function acts on the whole result of the inner one, not on its first term only.",
        },
        example: {
          from: "2*(x + 3)",
          right: "2*x + 6",
          wrong: "2*x + 3",
        },
      },
    ],
  },
  {
    id: "func.inverse-swap",
    topicIds: TOPIC,
    name: {
      th: "การหาฟังก์ชันผกผัน",
      en: "Finding an inverse",
    },
    statement: "y = f(x) \\iff x = f^{-1}(y)",
    plain: {
      th: "เขียน y เท่ากับฟังก์ชัน สลับ x กับ y แล้วแก้หา y สิ่งที่ได้คือฟังก์ชันผกผัน",
      en: "Write y equals the function, swap x and y, then solve for y. What comes out is the inverse.",
    },
    mnemonic: {
      th: "สลับแล้วแก้ ผกผันคือการเดินย้อนกลับ",
      en: "Swap then solve - an inverse walks the steps backwards.",
    },
    examples: [
      {
        from: "f(x) = 3x - 5",
        to: "f^{-1}(x) = \\frac{x + 5}{3}",
        note: {
          th: "ฟังก์ชันเดิมคูณสามแล้วลบห้า ผกผันจึงบวกห้าแล้วหารสาม โดยย้อนลำดับด้วย",
          en: "The function multiplies by three then subtracts five, so the inverse adds five then divides by three - in the reverse order.",
        },
      },
      { from: "f(x) = \\frac{x}{2} + 1", to: "f^{-1}(x) = 2x - 2" },
    ],
    seeAlso: ["func.notation", "eq.move-term"],
  },
];
