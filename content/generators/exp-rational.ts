import { VARIABLES } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type {
  Answer,
  Difficulty,
  Generator,
  L,
  Question,
  RNG,
  Step,
} from "../types";

const ID = "exp.rational-core";
const SKILL = "exp.rational";
const TOPIC = "exponents-radicals";

/**
 * เลขชี้กำลังที่เป็นเศษส่วน · the bridge between the two halves of this chapter.
 *
 * `exp.*` taught powers and `rad.*` taught roots, and nothing said they were
 * the same thing written two ways. `\sqrt[n]{a} = a^{1/n}` is the sentence that
 * joins them, and without it a learner meets `16^{3/4}` in ม.ปลาย with no idea
 * that it is a root at all.
 *
 * ## Built backwards, and evaluated rather than converted
 *
 * Every question starts from a base and a power - `8 = 2^3` - so the root comes
 * out whole by construction. The answer is then a *number*, which matters: ask
 * a learner to "write `\sqrt{x}` as a power" and the checker cannot tell a
 * correct `x^{1/2}` from an equally correct `\sqrt{x}`, because they are the
 * same value and `areEquivalent` says so. Asking for the value sidesteps that
 * entirely, and the conversion still gets taught - it is the first line of
 * every derivation here.
 */

/** Whole numbers that are exact powers, as the base and exponent that make them. */
const EXACT: { base: number; power: number }[] = [
  { base: 2, power: 2 },
  { base: 3, power: 2 },
  { base: 5, power: 2 },
  { base: 6, power: 2 },
  { base: 7, power: 2 },
  { base: 10, power: 2 },
  { base: 2, power: 3 },
  { base: 3, power: 3 },
  { base: 4, power: 3 },
  { base: 5, power: 3 },
  { base: 6, power: 3 },
  { base: 7, power: 3 },
  { base: 10, power: 3 },
  { base: 2, power: 4 },
  { base: 3, power: 4 },
  { base: 4, power: 4 },
  { base: 5, power: 4 },
  { base: 2, power: 5 },
  { base: 3, power: 5 },
  { base: 2, power: 6 },
];

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * The numerators worth putting over `power`.
 *
 * Proper and in lowest terms, both of which matter. `27^{3/3}` is 27 with the
 * whole point removed, and `16^{2/4}` is `16^{1/2}` written badly - the first
 * draft produced both, and the second question the generator ever showed was
 * `27^{3/3}`.
 */
const numeratorsFor = (power: number): number[] =>
  Array.from({ length: power - 2 }, (_, index) => index + 2).filter(
    (numerator) => gcd(numerator, power) === 1,
  );

/** Bases that can carry a proper fraction: a square has no room above 1. */
const STACKABLE = EXACT.filter(
  (entry) => numeratorsFor(entry.power).length > 0,
);

const rootKatex = (order: number, radicand: string) =>
  order === 2 ? `\\sqrt{${radicand}}` : `\\sqrt[${order}]{${radicand}}`;

export const expRational: Generator = {
  id: ID,
  skillId: SKILL,
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const built = build(rng, difficulty);

    return {
      id: `${ID}:${rng.seed}:${difficulty}`,
      generatorId: ID,
      skillId: SKILL,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: built.prompt,
      stem: built.stem,
      answer: built.answer,
      steps: built.steps,
      hints: built.hints,
      ...(built.misconceptions.length
        ? { misconceptions: built.misconceptions }
        : {}),
      rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
    };
  },
};

type Built = {
  prompt: L;
  stem: string;
  answer: Answer;
  steps: Step[];
  hints: L[];
  misconceptions: NonNullable<Question["misconceptions"]>;
};

const EVALUATE: L = {
  th: "จงหาค่า",
  en: "Find the value",
};

function build(rng: RNG, difficulty: Difficulty): Built {
  if (difficulty === 4) return withVariable(rng);

  /*
   * Difficulty 1 only needs `1/n`, so any exact power will do. Two and three
   * put a numerator above one, which a square cannot carry without the
   * fraction reducing to a whole number.
   */
  const { base, power } = rng.pick(difficulty === 1 ? EXACT : STACKABLE);
  const value = base ** power;

  /*
   * Difficulty 1 is the rule on its own: one over the order, so the answer is
   * the base. Half the questions are written as a root and half as a power,
   * because recognising the two as the same notation is the point.
   */
  if (difficulty === 1) {
    const asRoot = rng.bool();
    const stem = asRoot
      ? rootKatex(power, String(value))
      : `${value}^{1/${power}}`;

    const steps: Step[] = [
      makeStep(
        asRoot ? `${value}^{1/${power}}` : rootKatex(power, String(value)),
        "exp.rational",
        asRoot
          ? {
              th: `กรณฑ์อันดับ ${power} คือเลขชี้กำลัง \\frac{1}{${power}}`,
              en: `A root of order ${power} is the exponent \\frac{1}{${power}}.`,
            }
          : {
              th: `ตัวส่วน ${power} คืออันดับของกรณฑ์`,
              en: `The ${power} on the bottom is the order of the root.`,
            },
        { math: null },
      ),
      makeStep(
        `${base}`,
        "exp.rational",
        {
          th: `${base}^{${power}} = ${value} ดังนั้นรากอันดับ ${power} ของ ${value} คือ ${base}`,
          en: `${base}^{${power}} = ${value}, so the ${power}th root of ${value} is ${base}.`,
        },
        { math: null },
      ),
    ];

    return {
      prompt: EVALUATE,
      stem,
      answer: { kind: "exact", value: String(base) },
      steps,
      hints: [
        {
          th: `ถามว่าอะไรยกกำลัง ${power} แล้วได้ ${value}`,
          en: `Ask what number to the power ${power} gives ${value}.`,
        },
        {
          th: "ตัวส่วนของเลขชี้กำลังคืออันดับของราก",
          en: "The bottom of the exponent is the order of the root.",
        },
        {
          th: `ลอง ${base}`,
          en: `Try ${base}.`,
        },
      ],
      misconceptions: namedMistakes(
        { kind: "exact", value: String(base) },
        [
          {
            answer: { kind: "exact", value: String(value / power) },
            explain: {
              th: "นั่นคือการหารด้วยอันดับของราก ไม่ใช่การถอดราก",
              en: "That divides by the order of the root rather than taking the root.",
            },
          },
        ],
      ),
    };
  }

  /*
   * Difficulties 2 and 3 put a numerator on the exponent, and 3 makes it
   * negative. Root first, then power - `16^{3/4}` is 8 by way of 2, and 4096
   * if you insist on the power first, which is the mistake worth naming.
   */
  const numerator = rng.pick(numeratorsFor(power));
  const negative = difficulty === 3;
  const whole = base ** numerator;
  const answerMath = negative ? `1/${whole}` : String(whole);
  const exponent = `${negative ? "-" : ""}${numerator}/${power}`;

  const steps: Step[] = [
    makeStep(
      /*
       * The reciprocal is a fraction, not a second superscript: appending
       * `^{-1}` after `^{2}` is `^{2}^{-1}`, which KaTeX rejects as a double
       * superscript and the §9 gate caught on the first run.
       */
      negative
        ? `\\frac{1}{\\left(${rootKatex(power, String(value))}\\right)^{${numerator}}}`
        : `\\left(${rootKatex(power, String(value))}\\right)^{${numerator}}`,
      "exp.rational-power",
      {
        th: `ตัวส่วน ${power} คืออันดับของราก ตัวเศษ ${numerator} คือกำลัง`,
        en: `The ${power} is the order of the root; the ${numerator} is the power.`,
      },
      { math: null },
    ),
    makeStep(
      negative ? `\\frac{1}{${base}^{${numerator}}}` : `${base}^{${numerator}}`,
      "exp.rational-power",
      {
        th: `ถอดรากก่อน: รากอันดับ ${power} ของ ${value} คือ ${base}`,
        en: `Take the root first: the ${power}th root of ${value} is ${base}.`,
      },
      { math: null },
    ),
    makeStep(
      negative ? `\\frac{1}{${whole}}` : String(whole),
      negative ? "exp.negative" : "exp.rational-power",
      negative
        ? {
            th: "เลขชี้กำลังติดลบ จึงเป็นส่วนกลับ",
            en: "The exponent is negative, so take the reciprocal.",
          }
        : {
            th: `${base}^{${numerator}} = ${whole}`,
            en: `${base}^{${numerator}} = ${whole}.`,
          },
      { math: null },
    ),
  ];

  return {
    prompt: EVALUATE,
    stem: `${value}^{${exponent}}`,
    answer: { kind: "exact", value: answerMath },
    steps,
    hints: [
      {
        th: "ตัวส่วนคืออันดับราก ตัวเศษคือกำลัง",
        en: "Bottom is the root, top is the power.",
      },
      {
        th: "ถอดรากก่อนแล้วค่อยยกกำลัง ตัวเลขจะเล็กกว่ามาก",
        en: "Take the root first and the numbers stay much smaller.",
      },
      ...(negative
        ? [
            {
              th: "เครื่องหมายลบทำให้กลับเศษเป็นส่วน",
              en: "The minus sign turns the answer upside down.",
            },
          ]
        : [
            {
              th: `รากอันดับ ${power} ของ ${value} คือ ${base}`,
              en: `The ${power}th root of ${value} is ${base}.`,
            },
          ]),
    ],
    misconceptions: namedMistakes({ kind: "exact", value: answerMath }, [
      {
        answer: { kind: "exact" as const, value: String(value ** numerator) },
        explain: {
          th: "นั่นคือยกกำลังแล้วลืมถอดราก",
          en: "That takes the power and forgets the root.",
        },
      },
      /*
       * Only when the exponent is negative: dropping the minus sign gives the
       * reciprocal of the right answer, and on a positive exponent that
       * "mistake" would be the right answer.
       */
      ...(negative
        ? [
            {
              answer: { kind: "exact" as const, value: String(whole) },
              explain: {
                th: "ลืมเครื่องหมายลบ คำตอบต้องเป็นส่วนกลับ",
                en: "The minus sign was dropped; the answer is the reciprocal.",
              },
            },
          ]
        : []),
    ]),
  };
}

/**
 * Difficulty 4: the laws of exponents, now with fractions in them.
 *
 * The exponents are chosen so the result is a whole power of the variable -
 * `\left(x^6\right)^{2/3} = x^4` - because an answer of `x^{7/6}` is checkable
 * but tells a learner nothing about whether they did it right.
 */
function withVariable(rng: RNG): Built {
  const v = rng.pick(VARIABLES);
  const denominator = rng.pick([2, 3, 4]);
  /*
   * Coprime, or the exponent reduces and the question goes with it: the first
   * draft picked the numerator independently and produced
   * `\left(y^{9}\right)^{3/3}`, which is `y^9` with the lesson removed. An
   * improper fraction is welcome here - `(x^8)^{3/2}` is a good question - so
   * the only bar is that it not cancel.
   */
  const numerator = rng.pick(
    [2, 3].filter((candidate) => gcd(candidate, denominator) === 1),
  );
  const inner = denominator * rng.int(2, 4);
  const result = (inner / denominator) * numerator;

  const steps: Step[] = [
    makeStep(
      `${v}^{${inner} \\cdot \\frac{${numerator}}{${denominator}}}`,
      "exp.power-of-power",
      {
        th: "กำลังซ้อนกำลัง ให้คูณเลขชี้กำลัง",
        en: "A power of a power multiplies the exponents.",
      },
      { math: null },
    ),
    makeStep(
      `${v}^{${result}}`,
      "exp.rational",
      {
        th: `${inner} \\times \\frac{${numerator}}{${denominator}} = ${result}`,
        en: `${inner} \\times \\frac{${numerator}}{${denominator}} = ${result}.`,
      },
      { math: null },
    ),
  ];

  return {
    prompt: {
      th: "จงทำให้อยู่ในรูปอย่างง่าย",
      en: "Simplify",
    },
    stem: `\\left(${v}^{${inner}}\\right)^{${numerator}/${denominator}}`,
    answer: { kind: "exact", value: `${v}^${result}` },
    steps,
    hints: [
      {
        th: "กำลังซ้อนกำลัง ให้คูณเลขชี้กำลังกัน",
        en: "A power raised to a power: multiply the exponents.",
      },
      {
        th: `${inner} คูณกับ \\frac{${numerator}}{${denominator}}`,
        en: `Multiply ${inner} by \\frac{${numerator}}{${denominator}}.`,
      },
      {
        th: "ผลลัพธ์เป็นจำนวนเต็มพอดี",
        en: "The result comes out a whole number.",
      },
    ],
    misconceptions: namedMistakes({ kind: "exact", value: `${v}^${result}` }, [
      {
        answer: { kind: "exact", value: `${v}^${inner + numerator / denominator}` },
        explain: {
          th: "กำลังซ้อนกำลังต้องคูณ ไม่ใช่บวก",
          en: "A power of a power multiplies the exponents, it does not add them.",
        },
      },
    ]),
  };
}
