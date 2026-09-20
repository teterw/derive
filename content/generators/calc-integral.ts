import { coefficient, fraction, reduceFraction, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import {
  differentiate,
  polyMath,
  printPoly,
  valueAt,
  type Poly,
} from "./calc-derivative";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "calc.intro";

/**
 * ปฏิยานุพันธ์และพื้นที่ · ม.6.
 *
 * Integration is differentiation run backwards, and that is not a slogan here
 * - it is how the questions are made. The antiderivative is written first,
 * with whole-number coefficients, and the function in the stem is what comes
 * out of differentiating it. So the answer is exact by construction, and
 * `calc-intro.test.ts` differentiates the answer numerically to prove it.
 *
 * ## The constant of integration
 *
 * An indefinite integral has no single answer, which the answer checker cannot
 * express - `x^3/3 + C` is a family, not a value. So the indefinite questions
 * here always pin the constant down with a point the curve passes through,
 * which is both checkable and the form every application uses anyway.
 */

/**
 * A polynomial with whole-number coefficients, to be used as an F.
 *
 * Its constant term is left at zero: an antiderivative's constant is the one
 * thing an indefinite integral cannot know, and these questions supply it from
 * a point instead.
 */
function tidyAntiderivative(rng: RNG, degree: number): Poly {
  const out: Poly = [0];
  for (let exponent = 1; exponent < degree; exponent += 1) {
    out.push(rng.int(-3, 4));
  }
  // The leading coefficient is never zero, or the degree is a lie.
  out.push(rng.pick([1, 2, 3, -1, -2]));
  return out;
}

/**
 * Exact rational arithmetic, for the definite integrals.
 *
 * `\int_0^2 x^2 dx` is eight thirds, and eight thirds is what a learner writes
 * down - so the coefficients of an antiderivative are kept as fractions right
 * through rather than being rounded into a decimal at the end. A fraction here
 * is a numerator and a positive denominator, always in lowest terms.
 */
type Rational = [number, number];

function rational(numerator: number, denominator: number): Rational {
  const [top, bottom] = reduceFraction(numerator, denominator);
  return bottom < 0 ? [-top, -bottom] : [top, bottom];
}

function addRational(left: Rational, right: Rational): Rational {
  return rational(
    left[0] * right[1] + right[0] * left[1],
    left[1] * right[1],
  );
}

/** The antiderivative of an integer polynomial, coefficient by coefficient. */
function integrate(poly: Poly): Rational[] {
  return [[0, 1], ...poly.map((value, exponent) => rational(value, exponent + 1))];
}

function evaluateRational(poly: Rational[], x: number): Rational {
  return poly.reduce<Rational>(
    (total, [numerator, denominator], exponent) =>
      addRational(total, rational(numerator * x ** exponent, denominator)),
    [0, 1],
  );
}

/** `\frac{x^3}{3} + 2x`, with a fraction only where one is needed. */
function printRational(poly: Rational[]): string {
  const terms = poly
    .map(([numerator, denominator], exponent) => {
      if (numerator === 0) return null;
      const body = exponent === 0 ? "" : exponent === 1 ? "x" : `x^${exponent}`;
      if (denominator === 1) {
        if (exponent === 0) return String(numerator);
        return coefficient(numerator, body) || null;
      }
      const sign = numerator < 0 ? "-" : "";
      const size = Math.abs(numerator);
      return `${sign}\\frac{${size === 1 ? body : `${size}${body}`}}{${denominator}}`;
    })
    .reverse();
  return sumTerms(terms);
}

export const calcIntegral: Generator = {
  id: "calc.integral",
  skillId: "calc.integral",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty >= 3) return definite(rng, difficulty);

    /*
     * Built from the answer: F is chosen with whole coefficients, and the
     * integrand is F'. That way `\int f` is exactly F and no rounding or
     * fraction arithmetic is involved anywhere.
     */
    const F = tidyAntiderivative(rng, difficulty === 1 ? 2 : 3);
    const f = differentiate(F);

    const through = rng.int(-4, 5);
    const constant = rng.int(-6, 8);
    // F(through) + C = value, so C is what makes the curve pass through it.
    const shift = constant - valueAt(F, through);
    const full: Poly = [...F];
    full[0] = shift;

    const steps: Step[] = [
      makeStep(
        `F(x) = ${printPoly(F)} + C`,
        "calc.antiderivative-power",
        {
          th: "บวกหนึ่งที่เลขชี้กำลังแล้วหารด้วยเลขชี้กำลังใหม่ ทีละพจน์",
          en: "Add one to each exponent and divide by the new one, term by term.",
        },
        { math: null },
      ),
      makeStep(
        `${valueAt(F, through)} + C = ${constant}`,
        "calc.derivative-constant",
        {
          th: `กราฟผ่านจุด (${through}, ${constant}) จึงหาค่า C ได้`,
          en: `The curve passes through (${through}, ${constant}), which pins C down.`,
        },
        { math: null },
      ),
      makeStep(
        `F(x) = ${printPoly(full)}`,
        "calc.antiderivative-power",
        {
          th: `ได้ C = ${shift}`,
          en: `So C is ${shift}.`,
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: polyMath(full) };

    return {
      ...shell(calcIntegral, rng, difficulty),
      prompt: {
        th: `กำหนดให้ F'(x) = ${printPoly(f)} และกราฟของ F ผ่านจุด (${through}, ${constant}) จงหา F(x)`,
        en: `Given F'(x) = ${printPoly(f)} and that the graph of F passes through (${through}, ${constant}), find F(x)`,
      },
      stem: `F'(x) = ${printPoly(f)}, \\quad F(${through}) = ${constant}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ทำกลับกันกับกฎกำลัง บวกหนึ่งที่เลขชี้กำลัง แล้วหารด้วยตัวใหม่",
          en: "The power rule backwards: up one on the exponent, then divide by what you get.",
        },
        {
          th: "อย่าลืม +C แล้วใช้จุดที่ให้มาหาค่ามัน",
          en: "Do not lose the constant of integration: the point given is what finds it.",
        },
        {
          th: `จะได้ C = ${shift}`,
          en: `It comes to ${shift}.`,
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: polyMath(F) },
          explain: {
            th: "ลืมหาค่า C กราฟที่ผ่านจุดที่กำหนดมีเพียงเส้นเดียว",
            en: "The constant was never found, and only one of that family passes through the given point.",
          },
        },
        {
          answer: { kind: "exact", value: polyMath(differentiate(f)) },
          explain: {
            th: "หาอนุพันธ์แทนที่จะหาปฏิยานุพันธ์ โจทย์ให้ F' มาแล้ว ต้องย้อนกลับ",
            en: "That is a derivative, not an antiderivative: F' was given, so the job is to go backwards.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/**
 * Difficulties 3 and 4: a definite integral, and the area under a curve.
 *
 * Both are the same calculation. The difference is that difficulty 4 says the
 * word "area", which is only the same thing while the curve stays above the
 * axis - so the curve there is built to be positive across the interval.
 */
function definite(rng: RNG, difficulty: number): Question {
  const degree = rng.pick([1, 2, 2, 3]);
  const base: Poly = [];
  for (let exponent = 0; exponent < degree; exponent += 1) {
    base.push(rng.int(-4, 5));
  }
  base.push(rng.pick([1, 2, 3, 4, 6]));

  const from = rng.int(-3, 2);
  const to = from + rng.int(1, 4);

  const asArea = difficulty === 4;

  /*
   * For an area question the integrand has to stay above the axis right across
   * the interval, or "the area under the curve" and the integral are two
   * different numbers. Lifting the whole curve does that, and changes nothing
   * a learner has to do.
   */
  const lowest = Math.min(
    ...Array.from({ length: 81 }, (_, index) => {
      const x = from + ((to - from) * index) / 80;
      return valueAt(base, x);
    }),
  );
  const lift = asArea && lowest < 1 ? Math.ceil(1 - lowest) : 0;

  const integrand: Poly = [...base];
  integrand[0] = (integrand[0] ?? 0) + lift;

  const primitive = integrate(integrand);
  const top = evaluateRational(primitive, to);
  const bottom = evaluateRational(primitive, from);
  const [numerator, denominator] = addRational(top, [-bottom[0], bottom[1]]);
  const answerMath =
    denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;

  const steps: Step[] = [
    makeStep(
      `F(x) = ${printRational(primitive)}`,
      "calc.antiderivative-power",
      {
        th: "หาปฏิยานุพันธ์ก่อน ไม่ต้องใส่ C เพราะเดี๋ยวก็ตัดกัน",
        en: "Find an antiderivative first. There is no need for C: it cancels.",
      },
      { math: null },
    ),
    makeStep(
      `F(${to}) - F(${from}) = ${fraction(top[0], top[1])} - \\left(${fraction(bottom[0], bottom[1])}\\right)`,
      "calc.definite-integral",
      {
        th: "แทนขอบบนลบขอบล่าง",
        en: "Top limit minus bottom limit.",
      },
      { math: null },
    ),
    makeStep(
      fraction(numerator, denominator),
      "calc.definite-integral",
      {
        th: asArea ? "ได้พื้นที่ใต้เส้นโค้ง" : "ได้ค่าของปริพันธ์",
        en: asArea ? "And that is the area." : "And that is the integral.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: answerMath };

  return {
    ...shell(calcIntegral, rng, difficulty),
    prompt: asArea
      ? {
          th: `จงหาพื้นที่ใต้เส้นโค้ง y = ${printPoly(integrand)} จาก x = ${from} ถึง x = ${to}`,
          en: `Find the area under y = ${printPoly(integrand)} from x = ${from} to x = ${to}`,
        }
      : { th: "จงหาค่าของปริพันธ์จำกัดเขตนี้", en: "Evaluate this definite integral" },
    stem: `\\int_{${from}}^{${to}} \\left(${printPoly(integrand)}\\right) dx`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "หาปฏิยานุพันธ์ก่อน แล้วค่อยแทนขอบเขต",
        en: "Antiderivative first, limits second.",
      },
      {
        th: `ปฏิยานุพันธ์คือ ${printRational(primitive)}`,
        en: `That antiderivative is ${printRational(primitive)}.`,
      },
      {
        th: "แล้วเอาค่าที่ขอบบนลบด้วยค่าที่ขอบล่าง ระวังเครื่องหมายเมื่อขอบล่างติดลบ",
        en: "Then top minus bottom - and mind the signs when the lower limit is negative.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: {
          kind: "exact",
          value: (() => {
            const flipped = addRational(bottom, [-top[0], top[1]]);
            return flipped[1] === 1
              ? String(flipped[0])
              : `${flipped[0]}/${flipped[1]}`;
          })(),
        },
        explain: {
          th: "สลับขอบบนกับขอบล่าง ต้องเป็นขอบบนลบขอบล่าง",
          en: "The limits are the wrong way round: it is top minus bottom.",
        },
      },
      {
        answer: { kind: "exact", value: polyMath(integrand) },
        explain: {
          th: "นั่นคือฟังก์ชันเดิม ยังไม่ได้หาปฏิยานุพันธ์และแทนขอบเขต",
          en: "That is the function itself; it has not been integrated yet.",
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
