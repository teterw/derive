import { coefficient, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "calc.intro";

/**
 * อนุพันธ์ · ม.6.
 *
 * A polynomial is stored here as its list of coefficients, and differentiating
 * it is one line of arithmetic on that list. Everything the learner sees -
 * the function, the working, the answer - is printed from the same list, so
 * the question and its answer cannot drift apart.
 *
 * The stem is the function and the answer is its derivative, which are not
 * equal, so §9.5 would be checking the wrong claim: every question carries
 * `machineStem: null` and `calc-intro.test.ts` differentiates numerically
 * instead.
 */

/** A polynomial as coefficients, lowest power first: `[c, b, a]` is `ax^2+bx+c`. */
type Poly = number[];

function printPoly(poly: Poly): string {
  const terms = poly
    .map((value, exponent) => {
      if (value === 0) return null;
      if (exponent === 0) return String(value);
      if (exponent === 1) return coefficient(value, "x") || null;
      return coefficient(value, `x^${exponent}`) || null;
    })
    .reverse();
  return sumTerms(terms);
}

/** As mathjs source, for the answer. */
function polyMath(poly: Poly): string {
  const terms = poly
    .map((value, exponent) => {
      if (value === 0) return null;
      if (exponent === 0) return String(value);
      if (exponent === 1) return value === 1 ? "x" : value === -1 ? "-x" : `${value}x`;
      const body = `x^${exponent}`;
      return value === 1 ? body : value === -1 ? `-${body}` : `${value}${body}`;
    })
    .reverse();
  return sumTerms(terms);
}

/** The derivative, which for a coefficient list is one line. */
function differentiate(poly: Poly): Poly {
  const out = poly.slice(1).map((value, index) => value * (index + 1));
  return out.length ? out : [0];
}

function valueAt(poly: Poly, x: number): number {
  return poly.reduce((total, value, exponent) => total + value * x ** exponent, 0);
}

/** A polynomial of this degree with no zero leading coefficient. */
function randomPoly(rng: RNG, degree: number, spread = 6): Poly {
  const poly: Poly = [];
  for (let exponent = 0; exponent < degree; exponent += 1) {
    poly.push(rng.int(-spread, spread));
  }
  poly.push(rng.pick([1, 2, 3, 4, 5, -1, -2, -3]));
  return poly;
}

export const calcDerivative: Generator = {
  id: "calc.derivative",
  skillId: "calc.derivative",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 4) return productRule(rng, difficulty);

    const degree = difficulty === 1 ? 2 : 3;
    const poly = randomPoly(rng, degree);
    const derivative = differentiate(poly);

    const shown = printPoly(poly);
    const answerPoly = printPoly(derivative);

    /*
     * Difficulty 3 asks for the derivative *at a point*, which is the form
     * every later question needs - a slope, a velocity, a rate - and the one
     * that catches substituting before differentiating.
     */
    const at = difficulty === 3 ? rng.int(-3, 4) : null;
    const answer: Answer =
      at === null
        ? { kind: "exact", value: polyMath(derivative) }
        : { kind: "exact", value: String(valueAt(derivative, at)) };

    const termByTerm = poly
      .map((value, exponent) => {
        if (value === 0 || exponent === 0) return null;
        return exponent === 1
          ? `${value}`
          : `${value * exponent}x^{${exponent - 1}}`;
      })
      .reverse()
      .filter((term): term is string => term !== null)
      .join(" + ");

    const steps: Step[] = [
      makeStep(
        `f'(x) = ${termByTerm}`,
        "calc.derivative-power",
        {
          th: "หาอนุพันธ์ทีละพจน์ เอาเลขชี้กำลังลงมาคูณแล้วลดกำลังลงหนึ่ง",
          en: "Term by term: bring each exponent down and knock one off it.",
        },
        { math: null },
      ),
      makeStep(
        `f'(x) = ${answerPoly}`,
        "calc.derivative-sum",
        {
          th:
            poly[0] === 0
              ? "รวมพจน์ให้เรียบร้อย"
              : `พจน์คงตัว ${poly[0]} หายไป เพราะอนุพันธ์ของค่าคงตัวเป็นศูนย์`,
          en:
            poly[0] === 0
              ? "Tidied up."
              : `The constant ${poly[0]} disappears: a constant has no rate of change.`,
        },
        { math: null },
      ),
    ];

    if (at !== null) {
      steps.push(
        makeStep(
          `f'(${at}) = ${valueAt(derivative, at)}`,
          "calc.tangent-slope",
          {
            th: `แทน x = ${at} หลังหาอนุพันธ์แล้วเท่านั้น`,
            en: `Now - and only now - put x = ${at} in.`,
          },
          { math: null },
        ),
      );
    }

    return {
      ...shell(calcDerivative, rng, difficulty),
      prompt:
        at === null
          ? { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" }
          : {
              th: `กำหนดให้ f(x) = ${shown} จงหาค่าของ f'(${at})`,
              en: `Given f(x) = ${shown}, find f'(${at})`,
            },
      /*
       * The stem is the function, at every difficulty. `f'(3)` on its own is a
       * stem with eight possible values in it; the function and the point
       * together overflow the panel and have to be scrolled. The function is
       * what is being worked on, and which point is wanted is what the prompt
       * band is for - it sits directly above and is the loudest thing on the
       * page since `question-display.tsx` was rebuilt.
       */
      stem: shown,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ใช้กฎกำลังทีละพจน์ เอาเลขชี้กำลังลงมาคูณ แล้วลดกำลังลงหนึ่ง",
          en: "Power rule, term by term: down in front, one off the top.",
        },
        {
          th: "พจน์ที่ไม่มี x หายไปทั้งพจน์",
          en: "Any term without an x in it vanishes.",
        },
        at === null
          ? {
              th: `จะได้ f'(x) = ${answerPoly}`,
              en: `That gives ${answerPoly}.`,
            }
          : {
              th: `ได้ f'(x) = ${answerPoly} แล้วจึงแทน x = ${at}`,
              en: `That gives ${answerPoly}; now put x = ${at} in.`,
            },
      ],
      ...mistakes(answer, [
        {
          answer:
            at === null
              ? { kind: "exact", value: polyMath(keptExponent(poly)) }
              : { kind: "exact", value: String(valueAt(keptExponent(poly), at)) },
          explain: {
            th: "เอาเลขชี้กำลังลงมาคูณแล้ว แต่ลืมลดเลขชี้กำลังลงหนึ่ง",
            en: "The exponent came down but was never reduced.",
          },
        },
        {
          answer:
            at === null
              ? { kind: "exact", value: polyMath([poly[0]!, ...differentiate(poly)]) }
              : { kind: "exact", value: String(valueAt(derivative, at) + poly[0]!) },
          explain: {
            th: "พจน์คงตัวยังอยู่ อนุพันธ์ของค่าคงตัวเป็นศูนย์ พจน์นั้นต้องหายไป",
            en: "The constant term survived. A constant differentiates to zero, so it goes.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/** The same polynomial with the exponents left alone - the classic slip. */
function keptExponent(poly: Poly): Poly {
  const out = poly.map((value, exponent) => value * exponent);
  return out;
}

/**
 * Difficulty 4: a product, where expanding first is always available.
 *
 * That is deliberate. The product rule is worth knowing and worth checking,
 * and at this level the check is free: multiply the brackets out, differentiate
 * term by term, and the two answers have to agree.
 */
function productRule(rng: RNG, difficulty: number): Question {
  const a = rng.pick([1, 2, 3, -1, -2]);
  const b = rng.int(-6, 6);
  const c = rng.pick([1, 2, 3, -1]);
  const d = rng.int(-6, 6);

  // (ax + b)(cx + d) expanded.
  const product: Poly = [b * d, a * d + b * c, a * c];
  const derivative = differentiate(product);

  const left = sumTerms([coefficient(a, "x") || null, b === 0 ? null : String(b)]);
  const right = sumTerms([coefficient(c, "x") || null, d === 0 ? null : String(d)]);

  const steps: Step[] = [
    makeStep(
      `f(x) = ${printPoly(product)}`,
      "arith.distribute",
      {
        th: "กระจายวงเล็บก่อน แล้วค่อยหาอนุพันธ์ทีละพจน์",
        en: "Multiply the brackets out, then differentiate term by term.",
      },
      { math: null },
    ),
    makeStep(
      `f'(x) = ${printPoly(derivative)}`,
      "calc.derivative-sum",
      {
        th: "หาอนุพันธ์ของพหุนามที่ได้",
        en: "Differentiate what that gave.",
      },
      { math: null },
    ),
    makeStep(
      `f'(x) = ${a}(${right}) + (${left})(${c})`,
      "calc.derivative-product",
      {
        th: "ใช้กฎผลคูณก็ได้ผลเดียวกัน ตัวหน้าดิฟคูณตัวหลัง บวก ตัวหน้าคูณตัวหลังดิฟ",
        en: "The product rule gives the same thing: first differentiated times second, plus first times second differentiated.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: polyMath(derivative) };

  return {
    ...shell(calcDerivative, rng, difficulty),
    prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
    stem: `(${left})(${right})`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "ทำได้สองทาง กระจายวงเล็บก่อน หรือใช้กฎผลคูณ ผลลัพธ์ต้องตรงกัน",
        en: "Two ways: expand first, or use the product rule. They have to agree.",
      },
      {
        th: `กระจายแล้วได้ ${printPoly(product)}`,
        en: `Expanding gives ${printPoly(product)}.`,
      },
      {
        th: "แล้วหาอนุพันธ์ทีละพจน์ตามปกติ",
        en: "Then differentiate that term by term as usual.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: polyMath([a * c]) },
        explain: {
          th: "อนุพันธ์ของผลคูณไม่ใช่ผลคูณของอนุพันธ์ ลองกระจายวงเล็บก่อนแล้วเทียบดู",
          en: "The derivative of a product is not the product of the derivatives - expand it and compare.",
        },
      },
      {
        answer: { kind: "exact", value: polyMath(product) },
        explain: {
          th: "นั่นคือฟังก์ชันที่กระจายวงเล็บแล้ว ยังไม่ได้หาอนุพันธ์",
          en: "That is the function with its brackets opened, not its derivative.",
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

export { differentiate, printPoly, polyMath, valueAt, randomPoly, type Poly };
