import { coefficient, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "c1.derivative";

/**
 * อนุพันธ์ของฟังก์ชันอดิศัย · Calculus I.
 *
 * The derivatives of sine, cosine, the exponential and the logarithm - the
 * first functions in the app whose derivatives are not polynomials, and the
 * first content that could not have existed before `lib/math/katex.ts` learnt
 * to read `\sin` and `\ln`. Both the stems and the answers here are ordinary
 * machine-readable expressions, and the answer checker samples them like any
 * other.
 *
 * Radians, throughout. `\frac{d}{dx}\sin x = \cos x` is false in degrees - the
 * true statement there carries a factor of pi over 180 - which is why every
 * angle in this app has been in radians since the ม.5 chapter.
 */

/**
 * `3x^2sin(x)` as mathjs source, with nothing a person would not write.
 *
 * `1x^2` and `x^1` both parse and both look like a machine wrote them, and
 * `answer-accepted.test.ts` refuses either - rightly, since the model answer
 * is what a learner copies down.
 */
function termMath(value: number, power: number, tail: string): string {
  const body =
    power === 0 ? "" : power === 1 ? "x" : `x^${power}`;
  const factors = [body, tail].filter(Boolean).join("*");
  if (!factors) return String(value);
  if (value === 1) return factors;
  if (value === -1) return `-${factors}`;
  return `${value}${body ? factors : `*${factors}`}`;
}

/** `3\sin x` and `3sin(x)`, kept together so they cannot drift apart. */
type Term = { katex: string; math: string };

function scaled(value: number, katex: string, math: string): Term | null {
  if (value === 0) return null;
  if (value === 1) return { katex, math };
  if (value === -1) return { katex: `-${katex}`, math: `-${math}` };
  return { katex: `${value}${katex}`, math: `${value}*${math}` };
}

function join(terms: (Term | null)[]): Term {
  const kept = terms.filter((term): term is Term => term !== null);
  return {
    katex: sumTerms(kept.map((term) => term.katex)),
    math: sumTerms(kept.map((term) => term.math)),
  };
}

export const c1TrigDerivative: Generator = {
  id: "c1.trig-derivative",
  skillId: "c1.trig-derivative",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 3) return tangent(rng, difficulty);
    if (difficulty === 4) return trigQuotient(rng, difficulty);

    const a = rng.pick([1, 2, 3, 4, 5, -1, -2, -3]);
    const b = rng.pick([1, 2, 3, 4, -1, -2]);

    if (difficulty === 1) {
      /*
       * A combination of a sine and a cosine. Differentiating sends each to
       * the other, and exactly one of them picks up a minus - which is the
       * only thing in the chapter that has to be remembered rather than
       * worked out.
       */
      const c = rng.int(-6, 6);
      const shown = join([
        scaled(a, "\\sin x", "sin(x)"),
        scaled(b, "\\cos x", "cos(x)"),
        c === 0 ? null : { katex: String(c), math: String(c) },
      ]);
      const derivative = join([
        scaled(a, "\\cos x", "cos(x)"),
        scaled(-b, "\\sin x", "sin(x)"),
      ]);

      const steps: Step[] = [
        makeStep(
          `f'(x) = ${derivative.katex}`,
          "c1.trig-derivative",
          {
            th: "ซินไปคอส คอสไปลบซิน ส่วนค่าคงตัวหายไป",
            en: "Sine to cosine, cosine to minus sine, and the constant goes.",
          },
        ),
      ];

      const answer: Answer = { kind: "exact", value: derivative.math };

      return {
        ...shell(c1TrigDerivative, rng, difficulty),
        prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
        stem: shown.katex,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "อนุพันธ์ของ \\sin x คือ \\cos x และอนุพันธ์ของ \\cos x คือ -\\sin x",
            en: "Sine differentiates to cosine, and cosine to minus sine.",
          },
          {
            th: "ตัวเลขที่คูณอยู่ข้างหน้าติดไปด้วยเหมือนเดิม",
            en: "The numbers in front come along unchanged.",
          },
          {
            th: "พจน์ค่าคงตัวหายไปทั้งพจน์",
            en: "A constant term disappears entirely.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: {
              kind: "exact",
              value: join([
                scaled(a, "\\cos x", "cos(x)"),
                scaled(b, "\\sin x", "sin(x)"),
              ]).math,
            },
            explain: {
              th: "เครื่องหมายลบของอนุพันธ์ของคอสหายไป",
              en: "The minus on the cosine's derivative has gone missing.",
            },
          },
          {
            answer: { kind: "exact", value: shown.math },
            explain: {
              th: "นั่นคือฟังก์ชันเดิม ยังไม่ได้หาอนุพันธ์",
              en: "That is the function itself, not its derivative.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    // Difficulty 2: a power times a trigonometric function - the product rule.
    const power = rng.int(2, 4);
    const useSine = rng.bool();
    const trigKatex = useSine ? "\\sin x" : "\\cos x";
    const trigMath = useSine ? "sin(x)" : "cos(x)";
    const otherKatex = useSine ? "\\cos x" : "\\sin x";
    const otherMath = useSine ? "cos(x)" : "sin(x)";

    const shownKatex = `${a === 1 ? "" : a === -1 ? "-" : a}x^${power}${trigKatex}`;

    const derivativeMath = sumTerms([
      termMath(a * power, power - 1, trigMath),
      termMath(useSine ? a : -a, power, otherMath),
    ]);
    const derivativeKatex = sumTerms([
      `${coefficient(a * power, power - 1 === 1 ? "x" : `x^${power - 1}`)}${trigKatex}`,
      `${coefficient(useSine ? a : -a, `x^${power}`)}${otherKatex}`,
    ]);

    const steps: Step[] = [
      makeStep(
        `f'(x) = ${derivativeKatex}`,
        "c1.product-rule",
        {
          th: `ตัวหน้าดิฟคูณตัวหลัง บวก ตัวหน้าคูณตัวหลังดิฟ โดยอนุพันธ์ของ ${trigKatex} คือ ${useSine ? otherKatex : `-${otherKatex}`}`,
          en: `Product rule, with ${trigKatex} differentiating to ${useSine ? otherKatex : `minus ${otherKatex}`}.`,
        },
      ),
    ];

    const answer: Answer = { kind: "exact", value: derivativeMath };

    return {
      ...shell(c1TrigDerivative, rng, difficulty),
      prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
      stem: shownKatex,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "เป็นผลคูณของสองฟังก์ชัน ต้องใช้กฎผลคูณ",
          en: "It is a product of two functions, so the product rule applies.",
        },
        {
          th: `อนุพันธ์ของ ${trigKatex} คือ ${useSine ? otherKatex : `-${otherKatex}`}`,
          en: `${trigKatex} differentiates to ${useSine ? otherKatex : `minus ${otherKatex}`}.`,
        },
        {
          th: "ผลลัพธ์มีสองพจน์เสมอ",
          en: "The answer always has two terms.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: termMath(a * power, power - 1, otherMath),
          },
          explain: {
            th: "คูณอนุพันธ์ของสองตัวเข้าด้วยกัน ซึ่งไม่ใช่กฎผลคูณ",
            en: "That is the two derivatives multiplied together, which is not the rule.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/** Difficulty 3: the tangent, whose derivative is worth deriving once. */
function tangent(rng: RNG, difficulty: number): Question {
  const a = rng.pick([1, 2, 3, 4, 5, -1, -2]);
  const b = rng.int(-6, 6);

  const shownKatex = sumTerms([
    `${a === 1 ? "" : a === -1 ? "-" : a}\\tan x`,
    b === 0 ? null : coefficient(b, "x") || null,
  ]);
  const derivativeMath = sumTerms([
    `${a}*sec(x)^2`,
    b === 0 ? null : String(b),
  ]);

  const steps: Step[] = [
    makeStep(
      `\\frac{d}{dx}\\tan x = \\frac{\\cos x\\cos x - \\sin x(-\\sin x)}{\\cos^2 x}`,
      "c1.quotient-rule",
      {
        th: "เขียน \\tan เป็น \\sin ส่วน \\cos แล้วใช้กฎผลหาร",
        en: "Write tan as sine over cosine and use the quotient rule.",
      },
      { math: null },
    ),
    makeStep(
      `= \\frac{1}{\\cos^2 x} = \\sec^2 x`,
      "trig.pythagorean-identity",
      {
        th: "ตัวเศษคือ \\cos^2 x + \\sin^2 x ซึ่งเท่ากับหนึ่ง",
        en: "The numerator is cos squared plus sin squared, which is one.",
      },
      { math: null },
    ),
    makeStep(
      `f'(x) = ${sumTerms([`${a === 1 ? "" : a === -1 ? "-" : a}\\sec^2 x`, b === 0 ? null : String(b)])}`,
      "calc.derivative-sum",
      {
        th: "แล้วรวมกับอนุพันธ์ของพจน์ที่เหลือ",
        en: "Then add on the rest of the function's derivative.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: derivativeMath };

  return {
    ...shell(c1TrigDerivative, rng, difficulty),
    prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
    stem: shownKatex,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "ถ้าจำอนุพันธ์ของ \\tan ไม่ได้ ให้เขียนเป็น \\sin ส่วน \\cos แล้วใช้กฎผลหาร",
        en: "If the derivative of tan will not come, write it as sine over cosine and use the quotient rule.",
      },
      {
        th: "ตัวเศษจะกลายเป็นหนึ่งด้วยเอกลักษณ์พีทาโกรัส",
        en: "The Pythagorean identity turns the numerator into one.",
      },
      {
        th: "ได้ \\sec^2 x ซึ่งก็คือหนึ่งส่วน \\cos^2 x",
        en: "The result is sec squared, which is one over cos squared.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: {
          kind: "exact",
          value: sumTerms([`${a}*sec(x)`, b === 0 ? null : String(b)]),
        },
        explain: {
          th: "อนุพันธ์ของ \\tan คือ \\sec ยกกำลังสอง ไม่ใช่ \\sec เฉย ๆ",
          en: "The derivative of tan is secant squared, not secant on its own.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/** Difficulty 4: a trigonometric quotient, where both rules meet. */
function trigQuotient(rng: RNG, difficulty: number): Question {
  const useSine = rng.bool();
  const trigKatex = useSine ? "\\sin x" : "\\cos x";
  const otherKatex = useSine ? "\\cos x" : "\\sin x";
  const power = rng.int(1, 3);
  const below = power === 1 ? "x" : `x^${power}`;
  const scale = rng.pick([1, 2, 3, 4]);
  const front = scale === 1 ? "" : String(scale);

  /*
   * d/dx of `a trig / x^n` is `a(x trig' - n trig) / x^(n+1)`.
   *
   * The cosine's minus is folded into the term rather than left as
   * `x * (-sin x)`: a product with a negative factor inside it is an answer
   * nobody writes, and it reads as a subtraction the moment the brackets slip.
   */
  const numeratorMath = useSine
    ? `x*cos(x) - ${power}*sin(x)`
    : `-x*sin(x) - ${power}*cos(x)`;
  const numeratorKatex = useSine
    ? `x\\cos x - ${power === 1 ? "" : power}\\sin x`
    : `-x\\sin x - ${power === 1 ? "" : power}\\cos x`;

  const derivativeMath = `${scale === 1 ? "" : `${scale}*`}(${numeratorMath})/x^${power + 1}`;
  const derivativeKatex = `\\frac{${front}\\left(${numeratorKatex}\\right)}{x^${power + 1}}`;

  const steps: Step[] = [
    makeStep(
      `\\frac{${below}\\cdot\\frac{d}{dx}${trigKatex} - ${trigKatex}\\cdot\\frac{d}{dx}${below}}{(${below})^2}`,
      "c1.quotient-rule",
      {
        th: "ใส่ลงในกฎผลหารก่อน ยังไม่ต้องคิดอนุพันธ์",
        en: "Into the quotient rule first, without working anything out yet.",
      },
      { math: null },
    ),
    makeStep(
      derivativeKatex,
      "c1.trig-derivative",
      {
        th: `แทนอนุพันธ์ลงไป แล้วตัดตัวประกอบ x ร่วมออก`,
        en: `Put the derivatives in, then cancel the shared power of x.`,
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: derivativeMath };

  return {
    ...shell(c1TrigDerivative, rng, difficulty),
    prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
    stem: `\\frac{${front}${trigKatex}}{${below}}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "กฎผลหาร บนดิฟคูณล่าง ลบ บนคูณล่างดิฟ",
        en: "Quotient rule: top differentiated times bottom, minus top times bottom differentiated.",
      },
      {
        th: `อนุพันธ์ของ ${trigKatex} คือ ${useSine ? otherKatex : `-${otherKatex}`}`,
        en: `${trigKatex} differentiates to ${useSine ? otherKatex : `minus ${otherKatex}`}.`,
      },
      {
        th: "ตัวเศษกับตัวส่วนมีตัวประกอบ x ร่วมกัน ตัดได้",
        en: "Top and bottom share a power of x, which cancels.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: {
          kind: "exact",
          value: `${scale === 1 ? "" : `${scale}*`}(${
            useSine
              ? `${power}*sin(x) - x*cos(x)`
              : `${power}*cos(x) + x*sin(x)`
          })/x^${power + 1}`,
        },
        explain: {
          th: "ตัวเศษสลับที่ ผลที่ได้จะติดลบทั้งก้อน",
          en: "The numerator is backwards, which negates the whole answer.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

export const c1ExpLogDerivative: Generator = {
  id: "c1.exp-log-derivative",
  skillId: "c1.exp-log-derivative",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const a = rng.pick([1, 2, 3, 4, 5, -1, -2]);
    const b = rng.int(-6, 6);

    if (difficulty === 1) {
      // `ae^x + bx + c`, where the exponential is untouched by differentiating.
      const c = rng.int(-6, 6);
      const shownKatex = sumTerms([
        `${a === 1 ? "" : a === -1 ? "-" : a}e^x`,
        b === 0 ? null : coefficient(b, "x") || null,
        c === 0 ? null : String(c),
      ]);
      const derivativeMath = sumTerms([
        `${a}*e^x`,
        b === 0 ? null : String(b),
      ]);

      const steps: Step[] = [
        makeStep(
          `f'(x) = ${sumTerms([`${a === 1 ? "" : a === -1 ? "-" : a}e^x`, b === 0 ? null : String(b)])}`,
          "c1.exp-log-derivative",
          {
            th: "e ยกกำลัง x ดิฟแล้วได้ตัวเอง ส่วนพจน์อื่นทำตามปกติ",
            en: "The exponential differentiates to itself; the rest is as usual.",
          },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: derivativeMath };

      return {
        ...shell(c1ExpLogDerivative, rng, difficulty),
        prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
        stem: shownKatex,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "e ยกกำลัง x เป็นฟังก์ชันเดียวที่อนุพันธ์เท่ากับตัวมันเอง",
            en: "The exponential is the one function that is its own derivative.",
          },
          {
            th: "ตัวเลขที่คูณอยู่ข้างหน้าไม่หายไปไหน",
            en: "Whatever multiplies it stays where it is.",
          },
          {
            th: "พจน์คงตัวหายไป",
            en: "The constant term goes.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: {
              kind: "exact",
              value: sumTerms([`${a}*x*e^(x - 1)`, b === 0 ? null : String(b)]),
            },
            explain: {
              th: "ใช้กฎกำลังกับ e ยกกำลัง x กฎกำลังใช้ได้เมื่อตัวแปรอยู่ที่ฐาน ไม่ใช่ที่เลขชี้กำลัง",
              en: "That is the power rule, which applies when the variable is the base - not when it is the exponent.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    if (difficulty === 2) {
      // `a ln x + bx`: the logarithm's derivative has no logarithm in it.
      const shownKatex = sumTerms([
        `${a === 1 ? "" : a === -1 ? "-" : a}\\ln x`,
        b === 0 ? null : coefficient(b, "x") || null,
      ]);
      const derivativeMath = sumTerms([
        `${a}/x`,
        b === 0 ? null : String(b),
      ]);

      const steps: Step[] = [
        makeStep(
          `f'(x) = ${sumTerms([`\\frac{${a}}{x}`, b === 0 ? null : String(b)])}`,
          "c1.exp-log-derivative",
          {
            th: "อนุพันธ์ของ \\ln x คือ หนึ่งส่วน x",
            en: "The logarithm differentiates to one over x.",
          },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: derivativeMath };

      return {
        ...shell(c1ExpLogDerivative, rng, difficulty),
        prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
        stem: shownKatex,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "อนุพันธ์ของ \\ln x คือ หนึ่งส่วน x ซึ่งไม่มีลอการิทึมเหลืออยู่เลย",
            en: "The derivative of the logarithm is one over x, with no logarithm left in it.",
          },
          {
            th: "ตัวเลขข้างหน้ายังอยู่",
            en: "The number in front stays.",
          },
          {
            th: "พจน์เชิงเส้นดิฟได้ค่าคงตัว",
            en: "A linear term differentiates to a constant.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: {
              kind: "exact",
              value: sumTerms([`${a}*log(x)/x`, b === 0 ? null : String(b)]),
            },
            explain: {
              th: "ลอการิทึมไม่เหลืออยู่ในอนุพันธ์ อนุพันธ์ของ \\ln x คือ หนึ่งส่วน x เท่านั้น",
              en: "No logarithm survives: the derivative is simply one over x.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    if (difficulty === 3) {
      // `x ln x`, the product rule's tidiest example.
      const scale = rng.pick([1, 2, 3, -1]);
      const derivativeMath = sumTerms([
        `${scale}*log(x)`,
        String(scale + b),
      ]);

      const steps: Step[] = [
        makeStep(
          `f'(x) = ${scale === 1 ? "" : scale === -1 ? "-" : scale}\\ln x + ${scale === 1 ? "x\\cdot\\frac{1}{x}" : `${scale}x\\cdot\\frac{1}{x}`}`,
          "c1.product-rule",
          {
            th: "กฎผลคูณ โดยอนุพันธ์ของ \\ln x คือหนึ่งส่วน x",
            en: "Product rule, with the logarithm going to one over x.",
          },
          { math: null },
        ),
        makeStep(
          `f'(x) = ${sumTerms([`${scale === 1 ? "" : scale === -1 ? "-" : scale}\\ln x`, String(scale + b)])}`,
          "arith.simplify-fraction",
          {
            th: "x คูณหนึ่งส่วน x ได้หนึ่ง แล้วรวมกับพจน์เชิงเส้น",
            en: "x times one over x is one, which joins the linear term's derivative.",
          },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: derivativeMath };

      return {
        ...shell(c1ExpLogDerivative, rng, difficulty),
        prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
        stem: sumTerms([
          `${scale === 1 ? "" : scale === -1 ? "-" : scale}x\\ln x`,
          b === 0 ? null : coefficient(b, "x") || null,
        ]),
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "เป็นผลคูณของ x กับ \\ln x",
            en: "It is x times the logarithm, so the product rule applies.",
          },
          {
            th: "พจน์ที่สองจะกลายเป็น x คูณหนึ่งส่วน x",
            en: "The second term becomes x times one over x.",
          },
          {
            th: "ซึ่งเท่ากับหนึ่งพอดี",
            en: "Which is exactly one.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: { kind: "exact", value: sumTerms([`${scale}*log(x)`, b === 0 ? null : String(b)]) },
            explain: {
              th: "ได้พจน์แรกแล้ว แต่พจน์ที่สองของกฎผลคูณหายไป",
              en: "The first term is right and the product rule's second term has gone.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    // Difficulty 4: `ax^n e^x`, where the answer factorises.
    const power = rng.int(2, 4);
    const front = a === 1 ? "" : a === -1 ? "-" : String(a);
    const derivativeMath = sumTerms([
      termMath(a * power, power - 1, "e^x"),
      termMath(a, power, "e^x"),
    ]);

    const steps: Step[] = [
      makeStep(
        `f'(x) = ${coefficient(a * power, power - 1 === 1 ? "x" : `x^${power - 1}`)}e^x + ${coefficient(a, `x^${power}`)}e^x`,
        "c1.product-rule",
        {
          th: "กฎผลคูณ โดย e ยกกำลัง x ดิฟแล้วได้ตัวเอง",
          en: "Product rule, and the exponential differentiates to itself.",
        },
        { math: null },
      ),
      makeStep(
        `f'(x) = ${front}x^${power - 1}e^x(${power} + x)`,
        "quad.common-factor",
        {
          th: "ดึงตัวประกอบร่วมออกมาได้ ซึ่งเป็นรูปที่ใช้หาจุดวิกฤตต่อได้ทันที",
          en: "Taking the common factor out gives the form a critical point is read off.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: derivativeMath };

    return {
      ...shell(c1ExpLogDerivative, rng, difficulty),
      prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
      stem: `${front}x^${power}e^x`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ผลคูณของกำลังกับเอกซ์โพเนนเชียล ใช้กฎผลคูณ",
          en: "A power times an exponential: the product rule.",
        },
        {
          th: "อนุพันธ์ของ e ยกกำลัง x คือตัวมันเอง",
          en: "The exponential is its own derivative.",
        },
        {
          th: "ทั้งสองพจน์มี e ยกกำลัง x เป็นตัวประกอบร่วม",
          en: "Both terms share the exponential as a factor.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: termMath(a * power, power - 1, "e^x"),
          },
          explain: {
            th: "ดิฟแต่ตัวหน้า ปล่อยให้ e ยกกำลัง x อยู่เฉย ๆ กฎผลคูณมีสองพจน์",
            en: "Only the first factor was differentiated. The product rule has two terms.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

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
