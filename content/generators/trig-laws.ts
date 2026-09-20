import { extractSquareFactor, fraction, radical, radicalMath } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import {
  angleKatex,
  angleMath,
  product,
  valueAt,
  type Angle,
} from "./exact-angles";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "trig.functions";

/**
 * กฎของไซน์และกฎของโคไซน์ · ม.5.
 *
 * The first triangles in the app with no right angle in them. Both laws are
 * ways of getting Pythagoras and the ratios to work anyway, and the choice
 * between them is the skill: a side with its opposite angle is the law of
 * sines, two sides with the angle between them is the law of cosines.
 *
 * Every angle is one of the three whose cosine is exact - `\frac{\pi}{3}`,
 * `\frac{\pi}{2}`, `\frac{2\pi}{3}` - so `a^2 + b^2 - 2ab\cos C` is a whole
 * number and the third side is an exact surd rather than a rounded decimal.
 *
 * The stem states the triangle rather than an expression to evaluate, so there
 * is nothing for §9.5 to substitute into and every question says
 * `machineStem: null`. `trig-functions.test.ts` rebuilds each triangle from
 * the stem and checks the answer with the standard library's own cosine.
 */

/** The angles whose cosine is exact and whose triangle is not right-angled. */
const ANGLES: Angle[] = [
  { twelfths: 4 },
  { twelfths: 6 },
  { twelfths: 8 },
];

/** How much `- 2ab\cos C` takes off, as a multiple of ab. */
function cosineTwice(angle: Angle): number {
  const twelfths = angle.twelfths;
  if (twelfths === 4) return 1; // 2 * 1/2
  if (twelfths === 6) return 0;
  return -1; // 2 * (-1/2)
}

export const trigLaws: Generator = {
  id: "trig.laws",
  skillId: "trig.laws",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 2) return lawOfSines(rng, difficulty);
    if (difficulty === 3) return findTheAngle(rng, difficulty);
    if (difficulty === 4) return wordProblem(rng, difficulty);
    return lawOfCosines(rng, difficulty);
  },
};

/** Difficulty 1: two sides and the angle between them, find the third side. */
function lawOfCosines(rng: RNG, difficulty: number): Question {
  const angle = rng.pick(ANGLES);
  const a = rng.int(2, 10);
  const b = rng.int(2, 10);
  const squared = a * a + b * b - cosineTwice(angle) * a * b;

  const { outside, inside } = extractSquareFactor(squared);
  const answerKatex = radical(outside, inside);
  const answerMath = radicalMath(outside, inside);

  const cosine = valueAt(angle, "cos")!;
  const steps: Step[] = [
    makeStep(
      `c^2 = ${a}^2 + ${b}^2 - 2(${a})(${b})\\cos${angleKatex(angle)}`,
      "trig.law-of-cosines",
      {
        th: "แทนค่าลงในกฎของโคไซน์ มุมที่ใช้คือมุมระหว่างด้านทั้งสอง",
        en: "Put the numbers into the law of cosines; the angle is the one between the two sides.",
      },
      { math: null },
    ),
    makeStep(
      `c^2 = ${squared}`,
      "trig.law-of-cosines",
      {
        th: `\\cos${angleKatex(angle)} = ${cosine.katex} จึงได้ ${squared}`,
        en: `The cosine of that angle is ${cosine.katex}, which leaves ${squared}.`,
      },
      { math: null },
    ),
    makeStep(
      `c = ${answerKatex}`,
      "quad.square-root-property",
      {
        th: "ถอดรากที่สอง ความยาวด้านเป็นบวกเสมอ จึงเอาเฉพาะรากบวก",
        en: "Take the square root, and only the positive one: a side has a length.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: answerMath };

  return {
    ...shell(trigLaws, rng, difficulty),
    prompt: {
      th: `สามเหลี่ยม ABC มีด้าน a ยาว ${a} หน่วย ด้าน b ยาว ${b} หน่วย และมุม C ระหว่างด้านทั้งสองมีขนาด ${angleKatex(angle)} เรเดียน จงหาความยาวของด้าน c`,
      en: `In triangle ABC, side a is ${a} units, side b is ${b} units, and the angle C between them is ${angleKatex(angle)} radians. Find side c.`,
    },
    stem: `a = ${a}, \\ b = ${b}, \\ C = ${angleKatex(angle)}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "รู้สองด้านกับมุมระหว่างด้าน เป็นงานของกฎของโคไซน์",
        en: "Two sides and the angle between them is the law of cosines' job.",
      },
      {
        th: "c^2 = a^2 + b^2 - 2ab\\cos C",
        en: "c squared is a squared plus b squared minus two a b cos C.",
      },
      { th: `จะได้ c^2 = ${squared}`, en: `That gives c squared as ${squared}.` },
    ],
    ...mistakes(answer, [
      {
        answer: {
          kind: "exact",
          value: (() => {
            const wrong = a * a + b * b + cosineTwice(angle) * a * b;
            const parts = extractSquareFactor(wrong);
            return radicalMath(parts.outside, parts.inside);
          })(),
        },
        explain: {
          th: "พจน์สุดท้ายเป็นลบ ถ้าบวกจะได้ด้านที่ยาวเกินกว่าที่สามเหลี่ยมนี้จะเป็นไปได้",
          en: "The last term is subtracted. Adding it gives a side longer than this triangle allows.",
        },
      },
      {
        answer: { kind: "exact", value: String(squared) },
        explain: {
          th: "นั่นคือ c^2 ยังไม่ได้ถอดรากที่สอง",
          en: "That is c squared; the square root has not been taken yet.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/** Difficulty 2: a side and its opposite angle, plus one more angle. */
function lawOfSines(rng: RNG, difficulty: number): Question {
  /*
   * Both sines are exact and the quotient is tidy, so the answer stays a whole
   * number or a single surd. The pairs are chosen for that, not at random.
   */
  const PAIRS: [Angle, Angle][] = [
    [{ twelfths: 2 }, { twelfths: 6 }],
    [{ twelfths: 2 }, { twelfths: 4 }],
    [{ twelfths: 2 }, { twelfths: 8 }],
    [{ twelfths: 6 }, { twelfths: 2 }],
    [{ twelfths: 6 }, { twelfths: 4 }],
    [{ twelfths: 3 }, { twelfths: 6 }],
    [{ twelfths: 4 }, { twelfths: 6 }],
  ];

  const [angleA, angleB] = rng.pick(PAIRS);
  const a = rng.int(2, 12) * 2;

  const sinA = valueAt(angleA!, "sin")!;
  const sinB = valueAt(angleB!, "sin")!;
  const answerMath = over(product([String(a), sinB.math]), sinA.math);

  const steps: Step[] = [
    makeStep(
      `\\frac{${a}}{\\sin${angleKatex(angleA!)}} = \\frac{b}{\\sin${angleKatex(angleB!)}}`,
      "trig.law-of-sines",
      {
        th: "จับคู่ด้านกับมุมตรงข้ามของมันทั้งสองคู่",
        en: "Pair each side with the angle opposite it.",
      },
      { math: null },
    ),
    makeStep(
      `b = \\frac{${a}\\sin${angleKatex(angleB!)}}{\\sin${angleKatex(angleA!)}}`,
      "eq.balance",
      {
        th: "คูณไขว้เพื่อแยก b ออกมา",
        en: "Cross-multiply to get b on its own.",
      },
      { math: null },
    ),
    makeStep(
      `b = \\frac{${a}\\left(${sinB.katex}\\right)}{${sinA.katex}}`,
      "trig.quadrant-signs",
      {
        th: "แทนค่าไซน์ของทั้งสองมุม",
        en: "Put in the sine of each angle.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: answerMath };

  return {
    ...shell(trigLaws, rng, difficulty),
    prompt: {
      th: `สามเหลี่ยม ABC มีด้าน a ยาว ${a} หน่วย มุม A ขนาด ${angleKatex(angleA!)} เรเดียน และมุม B ขนาด ${angleKatex(angleB!)} เรเดียน จงหาความยาวของด้าน b`,
      en: `In triangle ABC, side a is ${a} units, angle A is ${angleKatex(angleA!)} radians and angle B is ${angleKatex(angleB!)} radians. Find side b.`,
    },
    stem: `a = ${a}, \\ A = ${angleKatex(angleA!)}, \\ B = ${angleKatex(angleB!)}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "รู้ด้านกับมุมตรงข้ามครบหนึ่งคู่ จึงใช้กฎของไซน์ได้",
        en: "One side and its opposite angle are both known, which is what the law of sines needs.",
      },
      {
        th: "\\frac{a}{\\sin A} = \\frac{b}{\\sin B}",
        en: "a over sin A equals b over sin B.",
      },
      {
        th: `\\sin${angleKatex(angleA!)} = ${sinA.katex} และ \\sin${angleKatex(angleB!)} = ${sinB.katex}`,
        en: `The two sines are ${sinA.katex} and ${sinB.katex}.`,
      },
    ],
    ...mistakes(answer, [
      {
        answer: {
          kind: "exact",
          value: over(product([String(a), sinA.math]), sinB.math),
        },
        explain: {
          th: "คู่ของด้านกับมุมสลับกัน ด้านที่หาอยู่ตรงข้ามมุม B จึงคู่กับ \\sin B",
          en: "The pairs are crossed over: the side being found faces B, so it goes with sin B.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/** A quotient with no division by one left in it. */
function over(numerator: string, denominator: string): string {
  return denominator === "1" ? numerator : `(${numerator}) / (${denominator})`;
}

/** Difficulty 3: three sides, find the angle - the law of cosines backwards. */
function findTheAngle(rng: RNG, difficulty: number): Question {
  const angle = rng.pick(ANGLES);
  const a = rng.int(2, 9);
  const b = rng.int(2, 9);
  const squared = a * a + b * b - cosineTwice(angle) * a * b;

  const { outside, inside } = extractSquareFactor(squared);
  const c = radical(outside, inside);
  const cosine = valueAt(angle, "cos")!;

  const steps: Step[] = [
    makeStep(
      `\\cos C = \\frac{${a}^2 + ${b}^2 - ${squared}}{2(${a})(${b})}`,
      "trig.law-of-cosines",
      {
        th: "จัดกฎของโคไซน์ใหม่ให้ \\cos C อยู่ตัวเดียว",
        en: "Rearrange the law of cosines so cos C stands alone.",
      },
      { math: null },
    ),
    makeStep(
      `\\cos C = ${cosine.katex}`,
      "trig.law-of-cosines",
      {
        th: `คิดเลขออกมาได้ ${cosine.katex}`,
        en: `The arithmetic comes out as ${cosine.katex}.`,
      },
      { math: null },
    ),
    makeStep(
      `C = ${angleKatex(angle)}`,
      "trig.general-solution",
      {
        th: "มุมภายในสามเหลี่ยมอยู่ระหว่าง 0 ถึง \\pi จึงมีมุมเดียวที่ให้ค่านี้",
        en: "An angle inside a triangle lies between 0 and pi, so only one angle has that cosine.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: angleMath(angle) };

  return {
    ...shell(trigLaws, rng, difficulty),
    prompt: {
      th: `สามเหลี่ยม ABC มีด้าน a ยาว ${a} หน่วย ด้าน b ยาว ${b} หน่วย และด้าน c ยาว ${c} หน่วย จงหาขนาดของมุม C เป็นเรเดียน`,
      en: `In triangle ABC the sides are a = ${a}, b = ${b} and c = ${c}. Find angle C in radians.`,
    },
    stem: `a = ${a}, \\ b = ${b}, \\ c = ${c}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "รู้ด้านครบสามด้าน ใช้กฎของโคไซน์แล้วแก้หา \\cos C",
        en: "All three sides are known, so use the law of cosines and solve for cos C.",
      },
      {
        th: "\\cos C = \\frac{a^2 + b^2 - c^2}{2ab}",
        en: "cos C is a squared plus b squared minus c squared, all over two a b.",
      },
      {
        th: `จะได้ \\cos C = ${cosine.katex}`,
        en: `That gives cos C as ${cosine.katex}.`,
      },
    ],
    ...mistakes(answer, [
      {
        answer: {
          kind: "exact",
          value: angleMath({ twelfths: 12 - angle.twelfths }),
        },
        explain: {
          th: "เครื่องหมายของ \\cos C กลับกัน คอสเป็นลบเมื่อมุมป้าน เป็นบวกเมื่อมุมแหลม",
          en: "The sign of cos C is the wrong way round: it is negative for an obtuse angle and positive for an acute one.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/** Difficulty 4: the law of cosines as it actually turns up. */
function wordProblem(rng: RNG, difficulty: number): Question {
  const angle = rng.pick(ANGLES);
  const first = rng.int(3, 12);
  const second = rng.int(3, 12);
  const squared =
    first * first + second * second - cosineTwice(angle) * first * second;
  const { outside, inside } = extractSquareFactor(squared);
  const answerKatex = radical(outside, inside);
  const answerMath = radicalMath(outside, inside);
  const cosine = valueAt(angle, "cos")!;

  const steps: Step[] = [
    makeStep(
      `d^2 = ${first}^2 + ${second}^2 - 2(${first})(${second})\\cos${angleKatex(angle)}`,
      "trig.law-of-cosines",
      {
        th: "ระยะทางที่ต้องการคือด้านตรงข้ามมุมที่ถนนสองสายทำกัน",
        en: "The distance wanted is the side opposite the angle the two roads make.",
      },
      { math: null },
    ),
    makeStep(
      `d^2 = ${squared}`,
      "trig.law-of-cosines",
      {
        th: `แทน \\cos${angleKatex(angle)} = ${cosine.katex}`,
        en: `With cos of that angle equal to ${cosine.katex}.`,
      },
      { math: null },
    ),
    makeStep(
      `d = ${answerKatex}`,
      "quad.square-root-property",
      {
        th: "ถอดรากที่สอง ได้ระยะทางเป็นค่าที่แน่นอน",
        en: "Take the square root for an exact distance.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: answerMath };

  return {
    ...shell(trigLaws, rng, difficulty),
    prompt: {
      th: `ถนนสองสายออกจากจุดเดียวกัน ทำมุมกัน ${angleKatex(angle)} เรเดียน คนหนึ่งเดินไปตามถนนสายแรก ${first} กิโลเมตร อีกคนเดินไปตามถนนสายที่สอง ${second} กิโลเมตร ขณะนี้ทั้งสองอยู่ห่างกันกี่กิโลเมตร ตอบเป็นค่าที่แน่นอน`,
      en: `Two roads leave the same point at an angle of ${angleKatex(angle)} radians. One person walks ${first} km along the first and another walks ${second} km along the second. How far apart are they now? Give an exact value.`,
    },
    stem: `${first} \\text{ กม.}, \\ ${second} \\text{ กม.}, \\ ${angleKatex(angle)}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "วาดรูป จะได้สามเหลี่ยมที่รู้สองด้านและมุมระหว่างด้าน",
        en: "Draw it: the triangle has two known sides and the angle between them.",
      },
      {
        th: "นั่นคือกฎของโคไซน์ ไม่ใช่พีทาโกรัส เพราะมุมไม่ใช่มุมฉาก",
        en: "That is the law of cosines, not Pythagoras, because the angle is not a right angle.",
      },
      { th: `จะได้ d^2 = ${squared}`, en: `That gives d squared as ${squared}.` },
    ],
    ...mistakes(answer, [
      {
        answer: {
          kind: "exact",
          value: (() => {
            const parts = extractSquareFactor(first * first + second * second);
            return radicalMath(parts.outside, parts.inside);
          })(),
        },
        explain: {
          th: "นั่นคือคำตอบเมื่อถนนสองสายตั้งฉากกัน แต่มุมที่โจทย์ให้ไม่ใช่มุมฉาก",
          en: "That would be the answer if the roads met at a right angle, and this one does not.",
        },
      },
      {
        answer: { kind: "exact", value: fraction(squared, 1) },
        explain: {
          th: "นั่นคือกำลังสองของระยะทาง ยังไม่ได้ถอดราก",
          en: "That is the square of the distance; the root has not been taken.",
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

function mistakes(
  answer: Answer,
  candidates: { answer: Answer; explain: L }[],
) {
  const named = namedMistakes(answer, candidates);
  return named.length ? { misconceptions: named } : {};
}
