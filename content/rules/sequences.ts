import type { Rule } from "../types";
import { asOperator, binary, rewriteFirst, unparen } from "./misapply";

/**
 * ลำดับและอนุกรม · ม.ปลาย.
 *
 * A sequence is a function whose input is a position rather than a measurement,
 * which is why its letter is `n` and why `n` is always a counting number. That
 * single fact settles most of the chapter's mistakes: there is no term
 * two-and-a-half, the first term is term one rather than term zero, and the
 * gap between term 1 and term n is `n - 1` gaps, not `n`.
 *
 * ลำดับ = sequence, อนุกรม = series, ผลต่างร่วม = common difference,
 * อัตราส่วนร่วม = common ratio.
 */
const TOPIC = ["seq.basic"];

export const sequenceRules: Rule[] = [
  {
    id: "seq.common-difference",
    topicIds: TOPIC,
    name: {
      th: "ผลต่างร่วม",
      en: "The common difference",
    },
    statement: "d = a_{n+1} - a_n",
    plain: {
      th: "ลำดับเลขคณิตคือลำดับที่บวกด้วยจำนวนเดิมทุกครั้ง จำนวนนั้นคือผลต่างร่วม หาได้จากพจน์ใดก็ได้ลบด้วยพจน์ก่อนหน้า",
      en: "An arithmetic sequence adds the same number every time. That number is the common difference, and any term minus the one before it gives it.",
    },
    mnemonic: {
      th: "พจน์หลังลบพจน์หน้า ได้เท่ากันทุกคู่",
      en: "Later minus earlier, and every pair gives the same answer.",
    },
    examples: [
      { from: "3, 7, 11, 15", to: "d = 4" },
      {
        from: "20, 17, 14",
        to: "d = -3",
        note: {
          th: "ผลต่างร่วมเป็นลบได้ ลำดับก็จะลดลงเรื่อย ๆ",
          en: "It can be negative, and then the sequence runs downwards.",
        },
      },
    ],
    seeAlso: ["seq.arithmetic-nth", "series.arithmetic-sum"],
  },
  {
    id: "seq.arithmetic-nth",
    topicIds: TOPIC,
    name: {
      th: "พจน์ทั่วไปของลำดับเลขคณิต",
      en: "The nth term of an arithmetic sequence",
    },
    statement: "a_n = a_1 + (n - 1)d",
    plain: {
      th: "จากพจน์แรกไปถึงพจน์ที่ n ต้องบวก d ทั้งหมด n-1 ครั้ง ไม่ใช่ n ครั้ง เพราะพจน์แรกยังไม่ได้บวกอะไรเลย",
      en: "Getting from the first term to the nth means adding d exactly n minus one times, not n times: the first term has had nothing added to it yet.",
    },
    mnemonic: {
      th: "ช่องว่างมีน้อยกว่าพจน์อยู่หนึ่งเสมอ",
      en: "There is always one fewer gap than there are terms.",
    },
    examples: [
      { from: "a_1 = 3, \\ d = 4", to: "a_n = 4n - 1" },
      {
        from: "a_1 = 3, \\ d = 4",
        to: "a_{10} = 39",
        note: {
          th: "พจน์ที่สิบบวก d ไปเก้าครั้ง ไม่ใช่สิบครั้ง",
          en: "The tenth term has had d added nine times, not ten.",
        },
      },
    ],
    seeAlso: ["seq.common-difference", "series.arithmetic-sum"],
    /**
     * The off-by-one: `a_1 + nd`. It is the mistake this rule exists to
     * prevent, and it gives an answer exactly one common difference too big.
     */
    misapplications: [
      {
        id: "seq.arithmetic-nth/counted-the-terms-not-the-gaps",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const difference = asOperator(node, "-");
            if (!difference) return null;
            const right = unparen(difference.args[1]!);
            if (right.toString() !== "1") return null;
            return unparen(difference.args[0]!);
          }),
        explain: {
          th: "ใช้ n แทนที่จะเป็น n-1 จากพจน์แรกไปพจน์ที่ n มีช่องว่างเพียง n-1 ช่อง",
          en: "Using n where n minus one belongs. There are only n minus one gaps between the first term and the nth.",
        },
        example: { from: "3 + (n - 1) * 4", right: "4n - 1", wrong: "4n + 3" },
      },
    ],
  },
  {
    id: "seq.common-ratio",
    topicIds: TOPIC,
    name: {
      th: "อัตราส่วนร่วม",
      en: "The common ratio",
    },
    statement: "r = \\dfrac{a_{n+1}}{a_n}",
    conditions: {
      th: "เมื่อไม่มีพจน์ใดเป็นศูนย์",
      en: "provided no term is zero",
    },
    plain: {
      th: "ลำดับเรขาคณิตคือลำดับที่คูณด้วยจำนวนเดิมทุกครั้ง หาอัตราส่วนร่วมได้จากพจน์ใดก็ได้หารด้วยพจน์ก่อนหน้า",
      en: "A geometric sequence multiplies by the same number every time. Any term divided by the one before it gives that number.",
    },
    mnemonic: {
      th: "เลขคณิตบวก เรขาคณิตคูณ",
      en: "Arithmetic adds; geometric multiplies.",
    },
    examples: [
      { from: "2, 6, 18, 54", to: "r = 3" },
      {
        from: "80, 40, 20",
        to: "r = \\frac{1}{2}",
        note: {
          th: "อัตราส่วนร่วมเป็นเศษส่วนได้ ลำดับก็จะเล็กลงเรื่อย ๆ",
          en: "It can be a fraction, and then the terms shrink.",
        },
      },
    ],
    seeAlso: ["seq.geometric-nth", "series.geometric-sum"],
  },
  {
    id: "seq.geometric-nth",
    topicIds: TOPIC,
    name: {
      th: "พจน์ทั่วไปของลำดับเรขาคณิต",
      en: "The nth term of a geometric sequence",
    },
    statement: "a_n = a_1 r^{n-1}",
    plain: {
      th: "เลขชี้กำลังคือจำนวนครั้งที่คูณ ซึ่งน้อยกว่าลำดับที่ของพจน์อยู่หนึ่งเสมอ ด้วยเหตุผลเดียวกับลำดับเลขคณิต",
      en: "The exponent counts how many times you have multiplied, which is one less than the term's position - the same reason as in an arithmetic sequence.",
    },
    mnemonic: {
      th: "พจน์แรกยกกำลังศูนย์ เพราะยังไม่ได้คูณเลย",
      en: "The first term is the power zero: nothing has been multiplied yet.",
    },
    examples: [
      { from: "a_1 = 2, \\ r = 3", to: "a_n = 2 \\cdot 3^{n-1}" },
      { from: "a_1 = 2, \\ r = 3", to: "a_5 = 162" },
    ],
    seeAlso: ["seq.common-ratio", "series.geometric-sum", "exp.product"],
  },
  {
    id: "series.arithmetic-sum",
    topicIds: TOPIC,
    name: {
      th: "ผลบวกของอนุกรมเลขคณิต",
      en: "The sum of an arithmetic series",
    },
    statement: "S_n = \\dfrac{n}{2}(a_1 + a_n)",
    conditions: {
      th: "หรือ S_n = \\dfrac{n}{2}\\left(2a_1 + (n-1)d\\right) เมื่อยังไม่รู้พจน์สุดท้าย",
      en: "or $S_n = \\dfrac{n}{2}\\left(2a_1 + (n-1)d\\right)$ when the last term is not known yet",
    },
    plain: {
      th: "จับพจน์แรกกับพจน์สุดท้ายเข้าคู่กัน พจน์ที่สองกับพจน์รองสุดท้าย ทุกคู่บวกกันได้เท่ากันหมด และมีทั้งหมดครึ่งหนึ่งของจำนวนพจน์",
      en: "Pair the first term with the last, the second with the second-to-last, and so on. Every pair adds to the same total, and there are half as many pairs as terms.",
    },
    mnemonic: {
      th: "ค่าเฉลี่ยของหัวกับท้าย คูณด้วยจำนวนพจน์",
      en: "The average of the ends, times how many there are.",
    },
    examples: [
      { from: "1 + 2 + \\cdots + 100", to: "S_{100} = 5050" },
      {
        from: "a_1 = 3, \\ d = 4, \\ n = 10",
        to: "S_{10} = 210",
        note: {
          th: "ใช้รูปที่สองเมื่อโจทย์ให้ผลต่างร่วมมา แต่ยังไม่ได้ให้พจน์สุดท้าย",
          en: "Use the second form when the question gives d rather than the last term.",
        },
      },
    ],
    seeAlso: ["seq.arithmetic-nth", "series.geometric-sum"],
  },
  {
    id: "series.geometric-sum",
    topicIds: TOPIC,
    name: {
      th: "ผลบวกของอนุกรมเรขาคณิต",
      en: "The sum of a geometric series",
    },
    statement: "S_n = \\dfrac{a_1(r^n - 1)}{r - 1}",
    conditions: {
      th: "เมื่อ r ไม่เท่ากับ 1 ถ้า r เท่ากับ 1 ทุกพจน์เท่ากันหมด ผลบวกคือ n a_1",
      en: "for r not equal to 1; if r is 1 every term is the same and the sum is $n a_1$",
    },
    plain: {
      th: "ที่มาของสูตรคือเอา S_n ลบด้วย r คูณ S_n พจน์กลาง ๆ ตัดกันหมด เหลือแค่พจน์แรกกับพจน์ที่เกินมา",
      en: "The formula comes from subtracting r times the sum from the sum itself: everything in the middle cancels and only the ends survive.",
    },
    mnemonic: {
      th: "อัตราส่วนยกกำลังจำนวนพจน์ ลบหนึ่ง ส่วนอัตราส่วนลบหนึ่ง",
      en: "Ratio to the power of how many, less one, over the ratio less one.",
    },
    examples: [
      { from: "2 + 6 + 18 + 54", to: "S_4 = 80" },
      {
        from: "a_1 = 5, \\ r = 2, \\ n = 6",
        to: "S_6 = 315",
        note: {
          th: "เลขชี้กำลังคือจำนวนพจน์ ไม่ใช่จำนวนพจน์ลบหนึ่ง ต่างจากสูตรพจน์ทั่วไป",
          en: "The exponent here is how many terms there are, not one less - unlike the nth term formula.",
        },
      },
    ],
    seeAlso: ["seq.geometric-nth", "series.arithmetic-sum"],
    /**
     * Top and bottom flipped in sign. `(1 - r^n)/(r - 1)` is the negative of
     * the right answer, and for r greater than one it hands back a negative
     * sum for a series of positive terms.
     */
    misapplications: [
      {
        id: "series.geometric-sum/flipped-one-subtraction",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const quotient = asOperator(node, "/");
            if (!quotient) return null;
            const top = unparen(quotient.args[0]!);
            const difference = asOperator(top, "-");
            if (!difference) return null;
            return binary(
              "/",
              binary("-", difference.args[1]!, difference.args[0]!),
              quotient.args[1]!,
            );
          }),
        explain: {
          th: "สลับเครื่องหมายของตัวเศษหรือตัวส่วนอย่างใดอย่างหนึ่ง ทั้งสองต้องไปทางเดียวกัน ผลบวกของพจน์บวกจะเป็นลบไม่ได้",
          en: "One of the two subtractions has been turned round. They have to run the same way, or a series of positive terms comes out negative.",
        },
        example: {
          from: "(2^4 - 1)/(2 - 1)",
          right: "15",
          wrong: "-15",
        },
      },
    ],
  },
  {
    id: "seq.how-many-terms",
    topicIds: TOPIC,
    name: {
      th: "การหาจำนวนพจน์",
      en: "How many terms there are",
    },
    statement: "n = \\dfrac{a_n - a_1}{d} + 1",
    plain: {
      th: "หารผลต่างระหว่างพจน์สุดท้ายกับพจน์แรกด้วยผลต่างร่วม จะได้จำนวนช่องว่าง แล้วบวกหนึ่งเพื่อนับพจน์แรกเข้าไปด้วย",
      en: "Divide the distance from the first term to the last by the common difference to count the gaps, then add one to count the first term itself.",
    },
    mnemonic: {
      th: "นับช่องว่างแล้วบวกหนึ่ง เหมือนนับเสารั้ว",
      en: "Count the gaps and add one, the way you count fence posts.",
    },
    examples: [
      { from: "3, 7, 11, \\ldots, 43", to: "n = 11" },
      { from: "10, 20, \\ldots, 200", to: "n = 20" },
    ],
    seeAlso: ["seq.arithmetic-nth", "series.arithmetic-sum"],
  },
];
