import { coefficient, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import { bracketPower, linearInside } from "./c1-chain";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "c1.chain";

/**
 * กฎลูกโซ่ร่วมกับกฎอื่น และอนุพันธ์โดยปริยาย · Calculus I.
 *
 * Two generators. The first stacks the chain rule on top of the product rule
 * and on top of itself; the second differentiates a relation that never writes
 * y as a function of x at all.
 *
 * ## How an implicit derivative is checked
 *
 * The answer is `\frac{dy}{dx}` in terms of both x and y, so there is nothing
 * to substitute and nothing to sample in the usual way. What holds instead is
 * the relation that produced it: for `F(x, y) = 0`, the implicit derivative is
 * `-F_x / F_y`, and `c1-chain.test.ts` computes both partial derivatives
 * numerically from the *stem* and compares. That never looks at how the answer
 * was derived, which is the point.
 */

export const c1ChainCombined: Generator = {
  id: "c1.chain-combined",
  skillId: "c1.chain-combined",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty >= 3) return twoLayers(rng, difficulty);

    /*
     * The chain rule inside the product rule: `x^n (ax + b)^m`. Both rules are
     * needed, and the order they are applied in does not matter - which is
     * worth meeting once, because it will not always be true later.
     */
    const inside = linearInside(rng);
    const outerPower = rng.int(2, 4);
    const frontPower = difficulty === 1 ? 1 : rng.int(2, 3);

    const front = frontPower === 1 ? "x" : `x^${frontPower}`;
    const stem = `${front}\\left(${inside.katex}\\right)^{${outerPower}}`;

    /*
     * d/dx = n x^(n-1) (ax+b)^m + x^n · m(ax+b)^(m-1) · a
     */
    // `2x`, not `2x^1`: the front factor after one differentiation.
    const frontDerivative =
      frontPower === 2 ? "2x" : `${frontPower}x^${frontPower - 1}`;
    const firstTerm =
      frontPower === 1
        ? bracketPower(1, inside.math, outerPower)
        : `${frontDerivative}*${bracketPower(1, inside.math, outerPower)}`;
    const answerMath = sumTerms([
      firstTerm,
      `${outerPower * inside.slope}*${front}*${bracketPower(1, inside.math, outerPower - 1)}`,
    ]);

    const answerKatex = sumTerms([
      `${frontPower === 1 ? "" : coefficient(frontPower, frontPower - 1 === 1 ? "x" : `x^${frontPower - 1}`)}\\left(${inside.katex}\\right)^{${outerPower}}`,
      `${outerPower * inside.slope}${front}\\left(${inside.katex}\\right)^{${outerPower - 1}}`,
    ]);

    const steps: Step[] = [
      makeStep(
        `${frontPower === 1 ? "1" : coefficient(frontPower, `x^${frontPower - 1}`)} \\cdot \\left(${inside.katex}\\right)^{${outerPower}} + ${front} \\cdot ${outerPower}\\left(${inside.katex}\\right)^{${outerPower - 1}} \\cdot (${inside.slope})`,
        "c1.product-rule",
        {
          th: "กฎผลคูณก่อน แล้วพจน์ที่สองต้องใช้กฎลูกโซ่ข้างใน",
          en: "Product rule first, and its second term needs the chain rule inside it.",
        },
        { math: null },
      ),
      makeStep(
        answerKatex,
        "c1.chain-rule",
        { th: "รวมตัวเลขให้เรียบร้อย", en: "Tidy the numbers." },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: answerMath };

    return {
      ...shell(c1ChainCombined, rng, difficulty),
      prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
      stem,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "เป็นผลคูณ จึงเริ่มจากกฎผลคูณ",
          en: "It is a product, so the product rule comes first.",
        },
        {
          th: "พจน์ที่สองมีวงเล็บยกกำลัง ซึ่งต้องใช้กฎลูกโซ่",
          en: "Its second term contains a bracket raised to a power, which needs the chain rule.",
        },
        {
          th: `อนุพันธ์ของข้างในคือ ${inside.slope}`,
          en: `The inside differentiates to ${inside.slope}.`,
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: sumTerms([
              `${frontPower === 1 ? "" : `${frontDerivative}*`}${bracketPower(1, inside.math, outerPower)}`,
              `${outerPower}*${front}*${bracketPower(1, inside.math, outerPower - 1)}`,
            ]),
          },
          explain: {
            th: `ลืมคูณด้วยอนุพันธ์ของข้างใน ซึ่งคือ ${inside.slope}`,
            en: `The chain factor ${inside.slope} was left out of the second term.`,
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/** Difficulties 3 and 4: three layers, peeled one at a time. */
function twoLayers(rng: RNG, difficulty: number): Question {
  const squared = difficulty === 3;
  // The logarithm layer needs its bracket above zero everywhere it is tried.
  const inside = linearInside(rng, { positive: !squared });

  /*
   * `\sin^2(ax+b)` or `\ln\left((ax+b)^2\right)`: three layers either way, and
   * both stay the size of an ordinary number.
   *
   * `e^{(ax+b)^2}` was the first choice and is a trap. By the time x is three
   * it is past 10^200, and at that size adding one to the answer is invisible
   * to a relative comparison - so the §9 gate could not tell the right answer
   * from a deliberately wrong one, and said so.
   */
  const stem = squared
    ? `\\sin^{2}\\left(${inside.katex}\\right)`
    : `\\ln\\left(\\left(${inside.katex}\\right)^{2}\\right)`;

  const answerMath = squared
    ? `${2 * inside.slope}*sin(${inside.math})*cos(${inside.math})`
    : `${2 * inside.slope}/(${inside.math})`;

  const answerKatex = squared
    ? `${2 * inside.slope}\\sin\\left(${inside.katex}\\right)\\cos\\left(${inside.katex}\\right)`
    : `\\frac{${2 * inside.slope}}{${inside.katex}}`;

  const steps: Step[] = [
    makeStep(
      squared
        ? `2\\sin\\left(${inside.katex}\\right) \\cdot \\cos\\left(${inside.katex}\\right) \\cdot (${inside.slope})`
        : `\\frac{1}{\\left(${inside.katex}\\right)^{2}} \\cdot 2\\left(${inside.katex}\\right) \\cdot (${inside.slope})`,
      "c1.chain-depth",
      {
        th: "สามชั้นจึงมีสามตัวคูณกัน ปอกจากชั้นนอกสุดเข้าไป",
        en: "Three layers, so three factors. Peel from the outside in.",
      },
      { math: null },
    ),
    makeStep(
      answerKatex,
      "c1.chain-depth",
      { th: "รวมตัวเลข", en: "Collect the numbers." },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: answerMath };

  return {
    ...shell(c1ChainCombined, rng, difficulty),
    prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
    stem,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: squared
          ? "ชั้นนอกสุดคือการยกกำลังสอง ชั้นกลางคือไซน์ ชั้นในคือวงเล็บ"
          : "ชั้นนอกสุดคือลอการิทึม ชั้นกลางคือการยกกำลังสอง ชั้นในคือวงเล็บ",
        en: squared
          ? "Outermost is the square, then the sine, then the bracket."
          : "Outermost is the logarithm, then the square, then the bracket.",
      },
      {
        th: "มีสามชั้นก็คูณสามตัว",
        en: "Three layers means three factors multiplied together.",
      },
      {
        th: `อย่าลืมชั้นในสุด ซึ่งให้ตัวคูณ ${inside.slope}`,
        en: `Do not stop before the innermost layer, which contributes ${inside.slope}.`,
      },
    ],
    ...mistakes(answer, [
      {
        answer: {
          kind: "exact",
          value: squared
            ? `2*sin(${inside.math})*cos(${inside.math})`
            : `2/(${inside.math})`,
        },
        explain: {
          th: `หยุดที่สองชั้น ลืมชั้นในสุดซึ่งให้ตัวคูณ ${inside.slope}`,
          en: `Stopped after two layers: the innermost contributes ${inside.slope}.`,
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

export const c1Implicit: Generator = {
  id: "c1.implicit",
  skillId: "c1.implicit",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 4) return cubicRelation(rng, difficulty);

    const a = difficulty === 1 ? 1 : rng.pick([2, 3, 4, 5, 9]);
    const b = difficulty === 1 ? 1 : rng.pick([1, 2, 3, 4, 16]);
    const c = rng.int(2, 12) * (difficulty === 1 ? rng.int(1, 6) : 1);

    /*
     * `ax^2 + bxy + cy^2 = k`. At difficulty 3 the cross term is present, and
     * it is the whole difficulty: differentiating `xy` needs the product rule
     * *and* leaves a dy/dx behind, so the two halves of the chapter meet.
     */
    const cross = difficulty === 3 ? rng.pick([1, 2, 3, -1, -2]) : 0;

    const stem = `${sumTerms([
      coefficient(a, "x^2") || null,
      cross === 0 ? null : coefficient(cross, "xy") || null,
      coefficient(b, "y^2") || null,
    ])} = ${c}`;

    /*
     * Differentiating gives `2ax + cross(y + x y') + 2b y y' = 0`, so
     * `y' = -(2ax + cross·y) / (cross·x + 2b y)`.
     */
    const topMath = sumTerms([
      `${2 * a}x`,
      cross === 0 ? null : `${cross}y`,
    ]);
    const bottomMath = sumTerms([
      cross === 0 ? null : `${cross}x`,
      `${2 * b}y`,
    ]);
    const answerMath = `-(${topMath})/(${bottomMath})`;

    const steps: Step[] = [
      makeStep(
        `${sumTerms([
          coefficient(2 * a, "x") || null,
          cross === 0 ? null : `${cross}\\left(y + x\\frac{dy}{dx}\\right)`,
          `${2 * b}y\\frac{dy}{dx}`,
        ])} = 0`,
        "c1.implicit",
        {
          th: "ดิฟทั้งสองข้างเทียบกับ x ทุกครั้งที่ดิฟ y จะมี dy/dx ติดออกมา",
          en: "Differentiate both sides with respect to x; every y that gets differentiated leaves a dy/dx.",
        },
        { math: null },
      ),
      makeStep(
        `\\frac{dy}{dx}\\left(${sumTerms([
          cross === 0 ? null : coefficient(cross, "x") || null,
          coefficient(2 * b, "y") || null,
        ])}\\right) = ${sumTerms([
          coefficient(-2 * a, "x") || null,
          cross === 0 ? null : coefficient(-cross, "y") || null,
        ])}`,
        "eq.collect-variable",
        {
          th: "ย้ายพจน์ที่มี dy/dx ไปข้างหนึ่ง แล้วดึงออกมาเป็นตัวประกอบร่วม",
          en: "Gather the dy/dx terms on one side and take it out as a common factor.",
        },
        { math: null },
      ),
      makeStep(
        `\\frac{dy}{dx} = -\\frac{${sumTerms([
          coefficient(2 * a, "x") || null,
          cross === 0 ? null : coefficient(cross, "y") || null,
        ])}}{${sumTerms([
          cross === 0 ? null : coefficient(cross, "x") || null,
          coefficient(2 * b, "y") || null,
        ])}}`,
        "eq.balance",
        { th: "แล้วหารออก", en: "Then divide." },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: answerMath };

    return {
      ...shell(c1Implicit, rng, difficulty),
      prompt: {
        th: "จงหา dy/dx โดยการหาอนุพันธ์โดยปริยาย",
        en: "Find dy/dx by implicit differentiation",
      },
      stem,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ดิฟทั้งสองข้างเทียบกับ x โดยถือว่า y เป็นฟังก์ชันของ x",
          en: "Differentiate both sides with respect to x, treating y as a function of x.",
        },
        {
          th: "ทุกครั้งที่ดิฟ y ต้องมี dy/dx ติดออกมาด้วย",
          en: "Every y that gets differentiated leaves a dy/dx behind.",
        },
        {
          th: "แล้วรวมพจน์ที่มี dy/dx เข้าด้วยกันและแก้หา",
          en: "Then gather the dy/dx terms and solve for it.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: `(${topMath})/(${bottomMath})` },
          explain: {
            th: "ลืมย้ายข้าง เครื่องหมายจึงกลับกันทั้งคำตอบ",
            en: "The term was never moved across, so the whole answer has the wrong sign.",
          },
        },
        {
          answer: { kind: "exact", value: `-(${bottomMath})/(${topMath})` },
          explain: {
            th: "กลับเศษกับส่วน ตัวส่วนคือพจน์ที่มี dy/dx เป็นตัวประกอบ",
            en: "Upside down: the denominator is what dy/dx was a factor of.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/** Difficulty 4: a relation where both sides need work. */
function cubicRelation(rng: RNG, difficulty: number): Question {
  const k = rng.pick([2, 3, 4, 5, 6, 9]);
  const lead = rng.int(1, 4);
  const front = lead === 1 ? "" : String(lead);

  /*
   * `ax^3 + y^3 = kxy` - a folium. Differentiating gives
   * `3ax^2 + 3y^2 y' = k(y + x y')`, so `y' = (ky - 3ax^2)/(3y^2 - kx)`.
   */
  const stem = `${front}x^3 + y^3 = ${k}xy`;
  const answerMath = `(${k}y - ${3 * lead}x^2)/(3y^2 - ${k}x)`;

  const steps: Step[] = [
    makeStep(
      `${3 * lead}x^2 + 3y^2\\frac{dy}{dx} = ${k}\\left(y + x\\frac{dy}{dx}\\right)`,
      "c1.implicit",
      {
        th: "ดิฟทั้งสองข้าง ข้างขวาต้องใช้กฎผลคูณด้วย",
        en: "Differentiate both sides; the right-hand side needs the product rule as well.",
      },
      { math: null },
    ),
    makeStep(
      `\\frac{dy}{dx}\\left(3y^2 - ${k}x\\right) = ${k}y - ${3 * lead}x^2`,
      "eq.collect-variable",
      {
        th: "รวมพจน์ที่มี dy/dx ไว้ข้างเดียวกัน",
        en: "Gather every dy/dx term on one side.",
      },
      { math: null },
    ),
    makeStep(
      `\\frac{dy}{dx} = \\frac{${k}y - ${3 * lead}x^2}{3y^2 - ${k}x}`,
      "eq.balance",
      { th: "แล้วหารออก", en: "Then divide." },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: answerMath };

  return {
    ...shell(c1Implicit, rng, difficulty),
    prompt: {
      th: "จงหา dy/dx โดยการหาอนุพันธ์โดยปริยาย",
      en: "Find dy/dx by implicit differentiation",
    },
    stem,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "ข้างขวาเป็นผลคูณของ x กับ y ต้องใช้กฎผลคูณ",
        en: "The right-hand side is x times y, so the product rule applies there.",
      },
      {
        th: "ดิฟ y ได้ dy/dx ติดมาทุกครั้ง",
        en: "Every y differentiated leaves a dy/dx.",
      },
      {
        th: "รวมพจน์ที่มี dy/dx แล้วดึงออกเป็นตัวประกอบร่วม",
        en: "Collect the dy/dx terms and take it out as a factor.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: `(${3 * lead}x^2 - ${k}y)/(3y^2 - ${k}x)` },
        explain: {
          th: "เครื่องหมายของตัวเศษกลับกัน เกิดจากย้ายข้างผิด",
          en: "The numerator's signs are reversed, from moving the terms the wrong way.",
        },
      },
      {
        answer: { kind: "exact", value: `(${3 * lead}x^2)/(3y^2)` },
        explain: {
          th: "ลืมดิฟข้างขวา ซึ่งมีทั้ง x และ y อยู่",
          en: "The right-hand side was never differentiated, and it contains both letters.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/** The fields every question in this file shares. */
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
