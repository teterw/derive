import { coefficient, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import {
  angleKatex,
  angleMath,
  anglesWhere,
  negate,
  valueAt,
  QUADRANT_NAME,
  quadrantOf,
  RATIO_WORD,
  type Angle,
  type Exact,
  type RatioName,
} from "./exact-angles";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "trig.functions";

/**
 * สมการตรีโกณมิติ · ม.5.
 *
 * The skill is not "find an angle whose sine is a half" - that is one lookup.
 * It is "find *every* angle in the turn whose sine is a half", and the second
 * one is the one that gets left out. So the solution set here is built by
 * asking all twenty-four standard angles rather than by inverting the
 * function, and the chapter test sweeps the interval on a fine grid to prove
 * nothing was missed.
 *
 * The answer is a `set`, so the marker recognises the roots in any order and
 * says "incomplete" - not "wrong" - to a learner who gives one of two. That
 * distinction is most of the feedback this skill has to offer.
 */

/** Exact values a sine or cosine can take at a standard angle. */
const SINE_VALUES: Exact[] = [
  valueAt({ twelfths: 0 }, "sin")!,
  valueAt({ twelfths: 2 }, "sin")!,
  valueAt({ twelfths: 3 }, "sin")!,
  valueAt({ twelfths: 4 }, "sin")!,
  valueAt({ twelfths: 6 }, "sin")!,
];

/** And the tangents, which have their own list. */
const TANGENT_VALUES: Exact[] = [
  valueAt({ twelfths: 0 }, "tan")!,
  valueAt({ twelfths: 2 }, "tan")!,
  valueAt({ twelfths: 3 }, "tan")!,
  valueAt({ twelfths: 4 }, "tan")!,
];

function valuesFor(ratio: RatioName): Exact[] {
  const positives = ratio === "tan" ? TANGENT_VALUES : SINE_VALUES;
  return [...positives, ...positives.filter((v) => v.math !== "0").map(negate)];
}

/** The value written on the right of the equals sign. */
function rightHandSide(value: Exact): string {
  return value.katex;
}

export const trigEquations: Generator = {
  id: "trig.equations",
  skillId: "trig.equations",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 3) return quadraticInRatio(rng, difficulty);
    if (difficulty === 4) return shiftedArgument(rng, difficulty);

    const ratio = rng.pick(["sin", "cos", "tan"] as const);
    const candidates = valuesFor(ratio).filter(
      (value) => anglesWhere(ratio, value).length > 0,
    );
    const value = rng.pick(candidates);
    const roots = anglesWhere(ratio, value);

    /*
     * At 2 the equation is linear in the ratio rather than solved for it -
     * `2\sin\theta + 1 = 2` - so the trigonometry starts only after ordinary
     * equation solving has finished. That is how it always appears in an exam.
     */
    const coefficient = difficulty === 2 ? rng.int(2, 4) : 1;
    const constant = difficulty === 2 ? rng.int(1, 4) : 0;

    const left =
      coefficient === 1
        ? `\\${ratio}\\theta`
        : `${coefficient}\\${ratio}\\theta`;
    const stem =
      constant === 0
        ? `${left} = ${rightHandSide(value)}`
        : `${left} + ${constant} = ${constant} ${value.katex.startsWith("-") ? "-" : "+"} ${scaled(coefficient, value)}`;

    const steps: Step[] = [];

    if (constant !== 0 || coefficient !== 1) {
      steps.push(
        makeStep(
          `\\${ratio}\\theta = ${rightHandSide(value)}`,
          "eq.balance",
          {
            th: `แก้สมการอย่างที่เคยทำ จนเหลือ \\${ratio}\\theta อยู่ตัวเดียว`,
            en: `Solve it the ordinary way until the ${RATIO_WORD[ratio].en} stands alone.`,
          },
        ),
      );
    }

    const reference = referenceOf(roots);
    steps.push(
      makeStep(
        `\\theta = ${roots.map((root) => angleKatex(root)).join(", \\ ")}`,
        "trig.general-solution",
        {
          th: `มุมอ้างอิงคือ ${angleKatex(reference)} และ${describeQuadrants(roots)}`,
          en: `The reference angle is ${angleKatex(reference)}, and ${describeQuadrantsEn(roots)}`,
        },
        { math: null },
      ),
    );

    const answer: Answer = {
      kind: "set",
      values: roots.map((root) => angleMath(root)),
    };

    return {
      ...shell(trigEquations, rng, difficulty),
      prompt: {
        th: "จงหาคำตอบทั้งหมดของสมการในช่วง [0, 2\\pi)",
        en: "Find every solution of the equation in [0, 2pi)",
      },
      stem,
      answer,
      steps,
      hints: [
        {
          th: `หามุมอ้างอิงก่อน มุมที่ ${RATIO_WORD[ratio].th} มีค่าเท่ากับ ${value.katex.replace("-", "")}`,
          en: `Start with the reference angle: where the ${RATIO_WORD[ratio].en} has size ${value.katex.replace("-", "")}.`,
        },
        {
          th: `ค่าที่ได้เป็น${value.katex.startsWith("-") ? "ลบ" : "บวก"} จึงต้องดูว่าจตุภาคใดให้เครื่องหมายนี้`,
          en: `The value is ${value.katex.startsWith("-") ? "negative" : "positive"}, so ask which quadrants carry that sign.`,
        },
        {
          th: `ในหนึ่งรอบมีคำตอบ ${roots.length} คำตอบ`,
          en: `There ${roots.length === 1 ? "is one solution" : `are ${roots.length} solutions`} in one turn.`,
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "set", values: [angleMath(roots[0]!)] },
          explain: {
            th: "นี่เป็นคำตอบแรกเท่านั้น วงกลมยังมีอีกจุดหนึ่งที่ให้ค่าเดียวกัน",
            en: "That is only the first one. Another point on the circle gives the same value.",
          },
        },
        {
          answer: { kind: "set", values: [angleMath(reference)] },
          explain: {
            th: "นั่นคือมุมอ้างอิง ยังไม่ได้นำเครื่องหมายและจตุภาคมาใช้",
            en: "That is the reference angle; the sign and the quadrant have not been used yet.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/** `2 \times \frac{1}{2}` written as the number it is. */
function scaled(coefficient: number, value: Exact): string {
  const size = value.katex.replace("-", "");
  if (coefficient === 1) return size;
  const halves = /^\\frac\{(.+)\}\{2\}$/.exec(size);
  if (halves && coefficient === 2) return halves[1]!;
  return `${coefficient}\\left(${size}\\right)`;
}

/** The acute angle all the roots share. */
function referenceOf(roots: Angle[]): Angle {
  const sizes = roots.map((root) => {
    const u = ((root.twelfths % 24) + 24) % 24;
    return u <= 6 ? u : u <= 12 ? 12 - u : u <= 18 ? u - 12 : 24 - u;
  });
  return { twelfths: Math.min(...sizes) };
}

function describeQuadrants(roots: Angle[]): L["th"] {
  const named = roots
    .map((root) => quadrantOf(root))
    .filter((q): q is 1 | 2 | 3 | 4 => q !== 0)
    .map((q) => QUADRANT_NAME[q].th);
  if (named.length === 0) return "คำตอบอยู่บนแกนพอดี";
  return `คำตอบอยู่ใน${[...new Set(named)].join("และ")}`;
}

function describeQuadrantsEn(roots: Angle[]): string {
  const named = roots
    .map((root) => quadrantOf(root))
    .filter((q): q is 1 | 2 | 3 | 4 => q !== 0)
    .map((q) => QUADRANT_NAME[q].en);
  if (named.length === 0) return "the solutions land on the axes.";
  return `the solutions are in ${[...new Set(named)].join(" and ")}.`;
}

/**
 * Difficulty 3: a quadratic in the ratio.
 *
 * `2\sin^2\theta - \sin\theta = 0` is two equations in a coat: factorise it,
 * and each factor is a difficulty-1 question. The roots of the quadratic are
 * kept rational so the factorising is the ordinary kind.
 */
function quadraticInRatio(rng: RNG, difficulty: number): Question {
  const RATIONAL: Exact[] = [
    valueAt({ twelfths: 0 }, "sin")!,
    valueAt({ twelfths: 2 }, "sin")!,
    negate(valueAt({ twelfths: 2 }, "sin")!),
    valueAt({ twelfths: 6 }, "sin")!,
    negate(valueAt({ twelfths: 6 }, "sin")!),
  ];

  const ratio = rng.pick(["sin", "cos"] as const);
  const first = rng.pick(RATIONAL);
  const second = rng.pick(RATIONAL.filter((v) => v.math !== first.math));

  // (2s - 1)(s - 0) and friends: clear the halves so the coefficients are whole.
  const asFraction = (value: Exact): [number, number] =>
    value.math === "0"
      ? [0, 1]
      : value.math === "1"
        ? [1, 1]
        : value.math === "-(1)"
          ? [-1, 1]
          : value.math === "1/2"
            ? [1, 2]
            : [-1, 2];

  const [p, q] = asFraction(first);
  const [r, s] = asFraction(second);
  // (qs - p)(ss - r) expanded.
  const a = q * s;
  const b = -(q * r + s * p);
  const c = p * r;

  /*
   * `sumTerms` rather than assembling the signs here. A hand-rolled version of
   * this dropped the `+` from the middle term, so the learner was shown
   * `2\cos^2\theta \cos\theta = 0` while the answer belonged to the equation
   * with the sign in it - caught by the chapter test, invisible to the gate,
   * and exactly the kind of thing the shared helper exists to prevent.
   */
  const stem = `${sumTerms([
    coefficient(a, `\\${ratio}^2\\theta`) || null,
    coefficient(b, `\\${ratio}\\theta`) || null,
    c === 0 ? null : String(c),
  ])} = 0`;

  const roots = [
    ...anglesWhere(ratio, first),
    ...anglesWhere(ratio, second),
  ].sort((left, right) => left.twelfths - right.twelfths);

  const steps: Step[] = [
    makeStep(
      `\\left(${q === 1 ? "" : q}\\${ratio}\\theta ${p < 0 ? "+" : "-"} ${Math.abs(p)}\\right)\\left(${s === 1 ? "" : s}\\${ratio}\\theta ${r < 0 ? "+" : "-"} ${Math.abs(r)}\\right) = 0`,
      "quad.trinomial-pattern",
      {
        th: `มองว่า \\${ratio}\\theta เป็นตัวแปรตัวหนึ่ง แล้วแยกตัวประกอบตามปกติ`,
        en: `Treat ${RATIO_WORD[ratio].en} theta as the unknown and factorise as usual.`,
      },
      { math: null },
    ),
    makeStep(
      `\\${ratio}\\theta = ${first.katex} \\quad \\text{หรือ} \\quad \\${ratio}\\theta = ${second.katex}`,
      "quad.zero-product",
      {
        th: "ผลคูณเป็นศูนย์ เมื่อตัวประกอบตัวใดตัวหนึ่งเป็นศูนย์",
        en: "A product is zero when one of its factors is.",
      },
      { math: null },
    ),
    makeStep(
      `\\theta = ${roots.map((root) => angleKatex(root)).join(", \\ ")}`,
      "trig.general-solution",
      {
        th: "แล้วหามุมทั้งหมดในหนึ่งรอบของแต่ละค่า",
        en: "Then find every angle in the turn for each of those values.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = {
    kind: "set",
    values: roots.map((root) => angleMath(root)),
  };

  return {
    ...shell(trigEquations, rng, difficulty),
    prompt: {
      th: "จงหาคำตอบทั้งหมดของสมการในช่วง [0, 2\\pi)",
      en: "Find every solution of the equation in [0, 2pi)",
    },
    stem,
    /*
     * The zero form is a quadratic in the ratio, and every root satisfies it -
     * but `\sin^2\theta` written as a power of a call is beyond what the
     * derivation check reads back, so the chapter test verifies these.
     */
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: `แทน \\${ratio}\\theta ด้วยตัวแปรตัวเดียว จะเห็นว่าเป็นสมการกำลังสองธรรมดา`,
        en: `Put a single letter in place of ${RATIO_WORD[ratio].en} theta and it is an ordinary quadratic.`,
      },
      {
        th: `แยกตัวประกอบได้ ${first.katex} และ ${second.katex}`,
        en: `It factorises to give ${first.katex} and ${second.katex}.`,
      },
      {
        th: "แต่ละค่ายังให้มุมได้มากกว่าหนึ่งมุม อย่าหยุดที่มุมแรก",
        en: "Each of those still gives more than one angle. Do not stop at the first.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: {
          kind: "set",
          values: anglesWhere(ratio, first).map((root) => angleMath(root)),
        },
        explain: {
          th: "นี่คือคำตอบจากตัวประกอบตัวเดียว อีกตัวประกอบหนึ่งก็ให้คำตอบเช่นกัน",
          en: "Those come from one factor only; the other factor has solutions too.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/**
 * Difficulty 4: the argument is not the unknown.
 *
 * `\sin\left(\theta + \frac{\pi}{6}\right) = \frac{1}{2}` is solved for the
 * whole bracket first and only then for theta, and the shift moves a solution
 * out of the interval and another in - which is the point of asking.
 */
function shiftedArgument(rng: RNG, difficulty: number): Question {
  const ratio = rng.pick(["sin", "cos"] as const);
  const shift: Angle = { twelfths: rng.pick([2, 3, 4, 6]) };
  const direction = rng.bool() ? 1 : -1;

  const candidates = valuesFor(ratio).filter(
    (value) => anglesWhere(ratio, value).length > 0,
  );
  const value = rng.pick(candidates);
  const inner = anglesWhere(ratio, value);

  const roots = inner
    .map((angle) => ({
      twelfths: ((angle.twelfths - direction * shift.twelfths) % 24 + 24) % 24,
    }))
    .sort((left, right) => left.twelfths - right.twelfths);

  const argument = `\\theta ${direction > 0 ? "+" : "-"} ${angleKatex(shift)}`;
  const stem = `\\${ratio}\\left(${argument}\\right) = ${value.katex}`;

  const steps: Step[] = [
    makeStep(
      `${argument} = ${inner.map((angle) => angleKatex(angle)).join(", \\ ")}`,
      "trig.general-solution",
      {
        th: "แก้หาค่าของทั้งวงเล็บก่อน เหมือนว่าวงเล็บคือมุมหนึ่งมุม",
        en: "Solve for the whole bracket first, as though it were the angle.",
      },
      { math: null },
    ),
    makeStep(
      `\\theta = ${roots.map((root) => angleKatex(root)).join(", \\ ")}`,
      "eq.balance",
      {
        th: `แล้ว${direction > 0 ? "ลบ" : "บวก"} ${angleKatex(shift)} ทั้งสองข้าง และปรับให้อยู่ในช่วง [0, 2\\pi)`,
        en: `Then ${direction > 0 ? "subtract" : "add"} ${angleKatex(shift)} and bring each answer back into [0, 2pi).`,
      },
      { math: null },
    ),
  ];

  const answer: Answer = {
    kind: "set",
    values: roots.map((root) => angleMath(root)),
  };

  return {
    ...shell(trigEquations, rng, difficulty),
    prompt: {
      th: "จงหาคำตอบทั้งหมดของสมการในช่วง [0, 2\\pi)",
      en: "Find every solution of the equation in [0, 2pi)",
    },
    stem,
    answer,
    steps,
    hints: [
      {
        th: "อย่าเพิ่งแยกวงเล็บ ให้มองว่าทั้งวงเล็บคือมุมที่กำลังหา",
        en: "Do not break the bracket up; treat the whole of it as the angle.",
      },
      {
        th: `ได้ ${argument} = ${inner.map((angle) => angleKatex(angle)).join(" หรือ ")}`,
        en: `That gives ${argument} equal to ${inner.map((angle) => angleKatex(angle)).join(" or ")}.`,
      },
      {
        th: `จากนั้นแก้หา \\theta และตรวจว่าคำตอบยังอยู่ในช่วงที่โจทย์กำหนด`,
        en: `Then solve for theta, and check each answer is still inside the interval asked for.`,
      },
    ],
    ...mistakes(answer, [
      {
        answer: {
          kind: "set",
          values: inner.map((angle) => angleMath(angle)),
        },
        explain: {
          th: "นั่นคือค่าของทั้งวงเล็บ ยังไม่ได้แก้ต่อเพื่อหา \\theta",
          en: "Those are the values of the bracket; theta has not been solved for yet.",
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
