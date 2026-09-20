import type { Skill, Topic } from "../types";

/**
 * ลำดับและอนุกรม · ม.ปลาย.
 *
 * Build-order item 5 (docs/CURRICULUM.md), and the last topic before calculus.
 * That placing is not an accident: a sequence is the first function in the
 * course whose input is a whole number rather than a measurement, and a series
 * is the first time a *sum of infinitely many things* is even discussable.
 * Both ideas are what a limit is built out of.
 *
 * ## Why the stems carry `machineStem: null`
 *
 * `a_n` is a subscript, and `lib/math/katex.ts` refuses subscripts rather than
 * guessing at them - so a stem stating a sequence cannot be converted. The
 * answers still can: a term is a number and a general term is an expression in
 * `n`, both of which the marker checks the ordinary way. What the gate cannot
 * do is confirm that the working describes the sequence in the stem, so
 * `seq-basic.test.ts` rebuilds every sequence term by term and checks it.
 */
export const seqBasicTopic: Topic = {
  id: "seq.basic",
  name: {
    th: "ลำดับและอนุกรม",
    en: "Sequences and series",
  },
  grade: { th: "ม.ปลาย พื้นฐาน", en: "Upper secondary, basic" },
  summary: {
    th: "ลำดับเลขคณิตและเรขาคณิต พจน์ทั่วไป และผลบวกของอนุกรมทั้งสองชนิด",
    en: "Arithmetic and geometric sequences, their general terms, and the sum of each kind of series.",
  },
  skillIds: [
    "seq.arithmetic",
    "seq.geometric",
    "series.arithmetic",
    "series.geometric",
  ],
};

export const seqBasicSkills: Skill[] = [
  {
    id: "seq.arithmetic",
    topicId: "seq.basic",
    name: {
      th: "ลำดับเลขคณิต",
      en: "Arithmetic sequences",
    },
    summary: {
      th: "ลำดับที่บวกด้วยจำนวนเดิมทุกครั้ง หาผลต่างร่วม พจน์ทั่วไป และพจน์ที่ต้องการ",
      en: "Sequences that add the same number each time: the common difference, the general term, and any term you like.",
    },
    formula: "a_n = a_1 + (n - 1)d",
    strictForm: null,
    prerequisites: ["eq.linear.solve"],
    ruleIds: [
      "seq.common-difference",
      "seq.arithmetic-nth",
      "seq.how-many-terms",
    ],
  },
  {
    id: "seq.geometric",
    topicId: "seq.basic",
    name: {
      th: "ลำดับเรขาคณิต",
      en: "Geometric sequences",
    },
    summary: {
      th: "ลำดับที่คูณด้วยจำนวนเดิมทุกครั้ง หาอัตราส่วนร่วมและพจน์ทั่วไป",
      en: "Sequences that multiply by the same number each time: the common ratio and the general term.",
    },
    formula: "a_n = a_1 r^{n-1}",
    strictForm: null,
    prerequisites: ["seq.arithmetic", "exp.integer-laws"],
    ruleIds: ["seq.common-ratio", "seq.geometric-nth"],
  },
  {
    id: "series.arithmetic",
    topicId: "seq.basic",
    name: {
      th: "อนุกรมเลขคณิต",
      en: "Arithmetic series",
    },
    summary: {
      th: "ผลบวกของลำดับเลขคณิต จากการจับพจน์หัวกับท้ายเข้าคู่กัน",
      en: "The sum of an arithmetic sequence, from pairing the ends together.",
    },
    formula: "S_n = \\dfrac{n}{2}(a_1 + a_n)",
    strictForm: null,
    prerequisites: ["seq.arithmetic"],
    ruleIds: [
      "series.arithmetic-sum",
      "seq.arithmetic-nth",
      "seq.how-many-terms",
      "quad.zero-product",
    ],
  },
  {
    id: "series.geometric",
    topicId: "seq.basic",
    name: {
      th: "อนุกรมเรขาคณิต",
      en: "Geometric series",
    },
    summary: {
      th: "ผลบวกของลำดับเรขาคณิต และการหาจำนวนพจน์จากผลบวกที่กำหนด",
      en: "The sum of a geometric sequence, and working backwards from a sum to how many terms it took.",
    },
    formula: "S_n = \\dfrac{a_1(r^n - 1)}{r - 1}",
    strictForm: null,
    prerequisites: ["seq.geometric", "series.arithmetic"],
    ruleIds: ["series.geometric-sum", "seq.geometric-nth", "seq.common-ratio"],
  },
];
