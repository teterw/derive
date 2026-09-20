import { fraction } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import {
  angleKatex,

  negate,
  product,
  quadrantOf,
  referenceTwelfths,
  sum,
  valueAt,
  QUADRANT_NAME,
  RATIO_WORD,
  type Angle,
  type Exact,
  type RatioName,
} from "./exact-angles";
import type { Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "trig.functions";

/**
 * ค่าของฟังก์ชันตรีโกณมิติของมุมใด ๆ · ม.5.
 *
 * The first chapter in the app whose trigonometry is machine-readable. ม.3
 * worked in degrees, and `\sin 30^\circ` cannot be converted - mathjs works in
 * radians, and quietly reading it as `sin(30)` would give -0.988 for a half.
 * Everything here is in radians, so `lib/math/katex.ts` converts the stems and
 * the §9 gate checks the answers itself.
 *
 * Difficulty 3 is the exception: its stem states what is *known* rather than
 * what is asked, so its answer does not satisfy it and it says
 * `machineStem: null`. The chapter test checks those against the identity.
 */

/** Angles off the first quadrant, which is the point of the skill. */
const BEYOND_Q1 = [6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22];
const FIRST_QUADRANT = [2, 3, 4];

/** Pythagorean triples, so a ratio given as a fraction has an exact partner. */
const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [20, 21, 29],
  [9, 40, 41],
];

function ratioKatex(ratio: RatioName, angle: Angle): string {
  return `\\${ratio}${angleKatex(angle, { bracket: true })}`;
}

/** "sine of five sixths of pi", for a sentence rather than a formula. */
function spoken(ratio: RatioName, angle: Angle): L {
  return {
    th: `${RATIO_WORD[ratio].th}ของมุม ${angleKatex(angle)}`,
    en: `the ${RATIO_WORD[ratio].en} of ${angleKatex(angle)}`,
  };
}

export const trigUnitCircle: Generator = {
  id: "trig.unit-circle",
  skillId: "trig.unit-circle",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 3) return knownRatio(rng, difficulty);
    if (difficulty === 4) return twoTerms(rng, difficulty);

    const pool =
      difficulty === 1 ? BEYOND_Q1 : [...FIRST_QUADRANT, ...BEYOND_Q1];
    const ratios: RatioName[] =
      difficulty === 1 ? ["sin", "cos"] : ["sin", "cos", "tan"];

    let angle: Angle = { twelfths: rng.pick(pool) };
    let ratio = rng.pick(ratios);
    // `\tan\frac{\pi}{2}` has no value; ask for its sine instead.
    if (valueAt(angle, ratio) === null) ratio = "sin";
    const value = valueAt(angle, ratio)!;

    /*
     * Past one turn at difficulty 2. A coterminal angle is the same point on
     * the circle, which is the fact worth having: an angle is a position, not
     * a distance travelled.
     */
    if (difficulty === 2 && rng.bool()) {
      angle = { twelfths: angle.twelfths + (rng.bool() ? 24 : -24) };
    }

    const reference: Angle = { twelfths: referenceTwelfths(angle) };
    const quadrant = quadrantOf(angle);
    const referenceValue = valueAt(reference, ratio)!;

    const steps: Step[] = [];

    if (Math.abs(angle.twelfths) >= 24) {
      steps.push(
        makeStep(
          `${ratioKatex(ratio, { twelfths: ((angle.twelfths % 24) + 24) % 24 })}`,
          "trig.unit-circle",
          {
            th: `มุมนี้ต่างจาก ${angleKatex({ twelfths: ((angle.twelfths % 24) + 24) % 24 })} อยู่หนึ่งรอบพอดี จึงเป็นจุดเดียวกันบนวงกลม`,
            en: `That angle is one whole turn from ${angleKatex({ twelfths: ((angle.twelfths % 24) + 24) % 24 })}, so it is the same point on the circle.`,
          },
          { math: null },
        ),
      );
    }

    if (quadrant !== 0) {
      steps.push(
        makeStep(
          `${ratioKatex(ratio, reference)} = ${referenceValue.katex}`,
          "trig.reference-angle",
          {
            th: `มุมอ้างอิงคือ ${angleKatex(reference)} ซึ่งให้ค่า ${referenceValue.katex}`,
            en: `The reference angle is ${angleKatex(reference)}, which gives ${referenceValue.katex}.`,
          },
          { math: null },
        ),
      );
      steps.push(
        makeStep(
          `${ratioKatex(ratio, angle)} = ${value.katex}`,
          "trig.quadrant-signs",
          {
            th: `มุมอยู่${QUADRANT_NAME[quadrant].th} ${RATIO_WORD[ratio].th}จึงเป็น${value.katex.startsWith("-") ? "ลบ" : "บวก"}`,
            en: `The angle is in ${QUADRANT_NAME[quadrant].en}, where ${RATIO_WORD[ratio].en} is ${value.katex.startsWith("-") ? "negative" : "positive"}.`,
          },
          { math: null },
        ),
      );
    } else {
      steps.push(
        makeStep(
          `${ratioKatex(ratio, angle)} = ${value.katex}`,
          "trig.unit-circle",
          {
            th: `มุมนี้อยู่บนแกนพอดี อ่านค่าจากพิกัดของจุดได้เลย`,
            en: `That angle lands on an axis, so the value is read straight off the point's coordinates.`,
          },
          { math: null },
        ),
      );
    }

    return {
      ...shell(trigUnitCircle, rng, difficulty),
      prompt: {
        th: `จงหาค่าที่แน่นอนของ ${spoken(ratio, angle).th}`,
        en: `Find the exact value of ${spoken(ratio, angle).en}`,
      },
      stem: ratioKatex(ratio, angle),
      answer: { kind: "exact", value: value.math },
      steps,
      hints: [
        {
          th: `มุมนี้อยู่${quadrant === 0 ? "บนแกน" : QUADRANT_NAME[quadrant].th}`,
          en: `That angle is ${quadrant === 0 ? "on an axis" : `in ${QUADRANT_NAME[quadrant].en}`}.`,
        },
        {
          th: `มุมอ้างอิงคือ ${angleKatex(reference)} ซึ่งให้ขนาด ${referenceValue.katex}`,
          en: `Its reference angle is ${angleKatex(reference)}, of size ${referenceValue.katex}.`,
        },
        {
          th: "เหลือแค่ใส่เครื่องหมายให้ตรงกับจตุภาค",
          en: "All that is left is the sign the quadrant gives it.",
        },
      ],
      ...mistakes({ kind: "exact", value: value.math }, [
        /*
         * The size right and the sign gone, which is the mistake this whole
         * skill exists to drill. Where the value is zero there is no sign to
         * drop, and `namedMistakes` removes the duplicate.
         */
        {
          answer: { kind: "exact", value: negate(value).math },
          explain: {
            th: "ขนาดถูกแล้ว แต่เครื่องหมายกลับกัน ให้ดูจตุภาคของมุมก่อนตอบ",
            en: "The size is right and the sign is the wrong way round. Check which quadrant the angle is in.",
          },
        },
        {
          answer: {
            kind: "exact",
            value: valueAt(angle, ratio === "cos" ? "sin" : "cos")?.math ?? "0",
          },
          explain: {
            th: "นี่คือค่าของอีกฟังก์ชันหนึ่งที่มุมเดียวกัน ซินคือพิกัด y คอสคือพิกัด x",
            en: "That is the other function at the same angle. Sine is the y-coordinate and cosine the x.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/**
 * Difficulty 3: one ratio and a quadrant are given, another ratio is wanted.
 *
 * This is where the identity earns its place. The quadrant is not decoration -
 * `\sin\theta = \frac{3}{5}` has two possible cosines and only the quadrant
 * says which, so a learner who ignores it gets the sign wrong half the time.
 */
function knownRatio(rng: RNG, difficulty: number): Question {
  const [legA, legB, hypotenuse] = rng.pick(TRIPLES);
  const [opposite, adjacent] = rng.bool() ? [legA, legB] : [legB, legA];
  const given = rng.pick(["sin", "cos"] as const);
  const quadrant = rng.pick([1, 2, 3, 4] as const);

  const sineNegative = quadrant === 3 || quadrant === 4;
  const cosineNegative = quadrant === 2 || quadrant === 3;

  const signed = (value: string, negative: boolean) =>
    negative ? `-${value}` : value;

  const sine = signed(fraction(opposite, hypotenuse), sineNegative);
  const cosine = signed(fraction(adjacent, hypotenuse), cosineNegative);
  const sineMath = `${sineNegative ? "-" : ""}${opposite}/${hypotenuse}`;
  const cosineMath = `${cosineNegative ? "-" : ""}${adjacent}/${hypotenuse}`;

  const wanted: RatioName = given === "sin" ? rng.pick(["cos", "tan"] as const) : "sin";
  const answerMath =
    wanted === "sin"
      ? sineMath
      : wanted === "cos"
        ? cosineMath
        : `${sineNegative === cosineNegative ? "" : "-"}${opposite}/${adjacent}`;

  const givenKatex = given === "sin" ? sine : cosine;
  const stem = `\\${given}\\theta = ${givenKatex}`;

  const steps: Step[] = [
    makeStep(
      `\\sin^2\\theta + \\cos^2\\theta = 1`,
      "trig.pythagorean-identity",
      {
        th: "ใช้เอกลักษณ์พีทาโกรัสหาขนาดของอีกฟังก์ชันหนึ่ง",
        en: "The Pythagorean identity gives the size of the other one.",
      },
      { math: null },
    ),
    makeStep(
      `\\${given === "sin" ? "cos" : "sin"}\\theta = \\pm\\frac{${given === "sin" ? adjacent : opposite}}{${hypotenuse}}`,
      "trig.pythagorean-identity",
      {
        th: `ได้ขนาด \\frac{${given === "sin" ? adjacent : opposite}}{${hypotenuse}} แต่ยังไม่รู้เครื่องหมาย`,
        en: `The size is ${fraction(given === "sin" ? adjacent : opposite, hypotenuse)}, with the sign still open.`,
      },
      { math: null },
    ),
    makeStep(
      `\\${wanted}\\theta = ${wanted === "sin" ? sine : wanted === "cos" ? cosine : signed(fraction(opposite, adjacent), sineNegative !== cosineNegative)}`,
      "trig.quadrant-signs",
      {
        th: `มุมอยู่${QUADRANT_NAME[quadrant].th} จึงเลือกเครื่องหมายได้`,
        en: `The angle is in ${QUADRANT_NAME[quadrant].en}, which settles the sign.`,
      },
      { math: null },
    ),
  ];

  return {
    ...shell(trigUnitCircle, rng, difficulty),
    prompt: {
      th: `กำหนดให้ \\${given}\\theta = ${givenKatex} และ \\theta อยู่ใน${QUADRANT_NAME[quadrant].th} จงหาค่าของ \\${wanted}\\theta`,
      en: `Given that ${stem} with theta in ${QUADRANT_NAME[quadrant].en}, find ${RATIO_WORD[wanted].en} theta.`,
    },
    stem,
    /*
     * The stem says what is known, not what is asked, so the answer does not
     * satisfy it and §9.5 would be checking a different question. The chapter
     * test checks these against the identity instead.
     */
    machineStem: null,
    answer: { kind: "exact", value: answerMath },
    steps,
    hints: [
      {
        th: "เริ่มจากเอกลักษณ์ \\sin^2\\theta + \\cos^2\\theta = 1",
        en: "Start from sin squared plus cos squared equals one.",
      },
      {
        th: `ขนาดของคำตอบคือ ${fraction(wanted === "tan" ? opposite : given === "sin" ? adjacent : opposite, wanted === "tan" ? adjacent : hypotenuse)}`,
        en: `The size of the answer is ${fraction(wanted === "tan" ? opposite : given === "sin" ? adjacent : opposite, wanted === "tan" ? adjacent : hypotenuse)}.`,
      },
      {
        th: `\\theta อยู่ใน${QUADRANT_NAME[quadrant].th} เครื่องหมายจึงถูกกำหนดแล้ว`,
        en: `Theta is in ${QUADRANT_NAME[quadrant].en}, so the sign is not a free choice.`,
      },
    ],
    ...mistakes({ kind: "exact", value: answerMath }, [
      {
        answer: { kind: "exact", value: `-(${answerMath})` },
        explain: {
          th: "ขนาดถูก แต่เครื่องหมายไม่ตรงกับจตุภาคที่โจทย์บอก",
          en: "The size is right, but the sign does not match the quadrant the question gave.",
        },
      },
      {
        answer: {
          kind: "exact",
          value: `${hypotenuse}/${given === "sin" ? opposite : adjacent}`,
        },
        explain: {
          th: "กลับเศษกับส่วน ด้านตรงข้ามมุมฉากยาวที่สุด ซินและคอสจึงมีขนาดไม่เกินหนึ่ง",
          en: "Numerator and denominator are swapped. The hypotenuse is the longest side, so sine and cosine never exceed one.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/** Difficulty 4: two angles in one expression, at least one past a turn. */
function twoTerms(rng: RNG, difficulty: number): Question {
  const pick = (): [Angle, RatioName, Exact] => {
    for (;;) {
      const angle: Angle = { twelfths: rng.pick([...FIRST_QUADRANT, ...BEYOND_Q1]) };
      const ratio = rng.pick(["sin", "cos"] as const);
      const value = valueAt(angle, ratio);
      if (value) return [angle, ratio, value];
    }
  };

  const [firstAngle, firstRatio, firstValue] = pick();
  const [secondAngleBase, secondRatio, secondValue] = pick();
  // One term written outside a single turn, forwards or back.
  const secondAngle: Angle = {
    twelfths: secondAngleBase.twelfths + (rng.bool() ? 24 : -24),
  };
  const coefficient = rng.int(1, 3);

  const answerMath = sum([
    product([String(coefficient), firstValue.math]),
    secondValue.math,
  ]);

  const shownCoefficient = coefficient === 1 ? "" : String(coefficient);
  const stem = `${shownCoefficient}${ratioKatex(firstRatio, firstAngle)} + ${ratioKatex(secondRatio, secondAngle)}`;

  const steps: Step[] = [
    makeStep(
      `${ratioKatex(secondRatio, secondAngle)} = ${ratioKatex(secondRatio, secondAngleBase)}`,
      "trig.unit-circle",
      {
        th: `${angleKatex(secondAngle)} กับ ${angleKatex(secondAngleBase)} ต่างกันหนึ่งรอบ จึงเป็นจุดเดียวกัน`,
        en: `${angleKatex(secondAngle)} and ${angleKatex(secondAngleBase)} differ by a whole turn, so they are the same point.`,
      },
      { math: null },
    ),
    makeStep(
      `${shownCoefficient}\\left(${firstValue.katex}\\right) + \\left(${secondValue.katex}\\right)`,
      "trig.quadrant-signs",
      {
        th: "แทนค่าที่แน่นอนของทั้งสองพจน์",
        en: "Put in the exact value of each term.",
      },
      { math: null },
    ),
  ];

  return {
    ...shell(trigUnitCircle, rng, difficulty),
    prompt: { th: "จงหาค่าที่แน่นอนของนิพจน์นี้", en: "Find the exact value" },
    stem,
    answer: { kind: "exact", value: answerMath },
    steps,
    hints: [
      {
        th: "พจน์ที่สองเกินหนึ่งรอบ ลดรูปให้อยู่ในช่วงหนึ่งรอบก่อน",
        en: "The second term is outside one turn; bring it back into one first.",
      },
      {
        th: `${spoken(firstRatio, firstAngle).th} เท่ากับ ${firstValue.katex}`,
        en: `${spoken(firstRatio, firstAngle).en} is ${firstValue.katex}.`,
      },
      {
        th: `${spoken(secondRatio, secondAngleBase).th} เท่ากับ ${secondValue.katex}`,
        en: `${spoken(secondRatio, secondAngleBase).en} is ${secondValue.katex}.`,
      },
    ],
    ...mistakes({ kind: "exact", value: answerMath }, [
      {
        answer: {
          kind: "exact",
          value: sum([
            product([String(coefficient), negate(firstValue).math]),
            secondValue.math,
          ]),
        },
        explain: {
          th: "เครื่องหมายของพจน์แรกกลับกัน ให้ดูจตุภาคของมุมนั้นอีกครั้ง",
          en: "The first term's sign is the wrong way round; look at that angle's quadrant again.",
        },
      },
      {
        answer: {
          kind: "exact",
          value: sum([firstValue.math, secondValue.math]),
        },
        explain: {
          th: "ลืมคูณตัวเลขข้างหน้าเข้ากับค่าของพจน์แรก",
          en: "The number in front of the first term has not been multiplied in.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/** The fields every question in this generator shares. */
function shell(
  generator: { id: string; skillId: string },
  rng: RNG,
  difficulty: number,
) {
  return {
    id: `${generator.id}:${rng.seed}:${difficulty}`,
    generatorId: generator.id,
    skillId: generator.skillId,
    topicId: TOPIC,
    difficulty: difficulty as 1 | 2 | 3 | 4,
    provenance: "generated" as const,
  };
}

/** Wrong answers, with any that are accidentally right removed. */
function mistakes(
  answer: { kind: "exact"; value: string },
  candidates: { answer: { kind: "exact"; value: string }; explain: L }[],
) {
  const named = namedMistakes(answer, candidates);
  return named.length ? { misconceptions: named } : {};
}
