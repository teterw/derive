import { coefficient, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import {
  differentiate,
  printPoly,
  valueAt,
  type Poly,
} from "./calc-derivative";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "calc.intro";

/**
 * ความชันและจุดสูงสุดต่ำสุด · ม.6.
 *
 * What a derivative *is*, rather than how to compute one. Difficulty 1 is the
 * slope of a tangent, 2 is the tangent line itself, 3 is where the tangent is
 * flat, and 4 is the value at a turning point - which is the question the
 * whole of school optimisation is made of, and the one ม.3 could only answer
 * by completing the square.
 *
 * Every curve here is built from its turning points outwards, so `f'(x) = 0`
 * has whole-number roots without anything having to be solved numerically.
 */

export const calcTangent: Generator = {
  id: "calc.tangent",
  skillId: "calc.tangent",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 3) return flatTangent(rng, difficulty);
    if (difficulty === 4) return turningValue(rng, difficulty);

    const a = rng.pick([1, 1, 2, -1, -2]);
    const b = rng.int(-6, 6);
    const c = rng.int(-8, 8);
    const poly: Poly = [c, b, a];
    const derivative = differentiate(poly);

    const at = rng.int(-4, 5);
    const slope = valueAt(derivative, at);
    const height = valueAt(poly, at);

    const shown = printPoly(poly);

    /*
     * Difficulty 2 asks for the whole tangent line, which needs the point as
     * well as the slope - and forgetting the point is how a learner ends up
     * with a line of the right gradient nowhere near the curve.
     */
    const wantsLine = difficulty === 2;
    const intercept = height - slope * at;
    const lineKatex = sumTerms([
      coefficient(slope, "x") || null,
      intercept === 0 ? null : String(intercept),
    ]);

    const answer: Answer = wantsLine
      ? {
          kind: "exact",
          value: sumTerms([
            slope === 0 ? null : slope === 1 ? "x" : slope === -1 ? "-x" : `${slope}x`,
            intercept === 0 ? null : String(intercept),
          ]),
        }
      : { kind: "exact", value: String(slope) };

    const steps: Step[] = [
      makeStep(
        `f'(x) = ${printPoly(derivative)}`,
        "calc.derivative-sum",
        {
          th: "หาอนุพันธ์ก่อน ยังไม่แทนค่า",
          en: "Differentiate first; substitute nothing yet.",
        },
        { math: null },
      ),
      makeStep(
        `m = f'(${at}) = ${slope}`,
        "calc.tangent-slope",
        {
          th: `แทน x = ${at} ได้ความชันของเส้นสัมผัส`,
          en: `Putting x = ${at} in gives the slope of the tangent.`,
        },
        { math: null },
      ),
    ];

    if (wantsLine) {
      steps.push(
        makeStep(
          `f(${at}) = ${height}`,
          "calc.tangent-slope",
          {
            th: `จุดสัมผัสคือ (${at}, ${height}) หาจากฟังก์ชันเดิม ไม่ใช่จากอนุพันธ์`,
            en: `The point of contact is (${at}, ${height}), which comes from the original function, not the derivative.`,
          },
          { math: null },
        ),
        makeStep(
          `y = ${lineKatex}`,
          "eq.balance",
          {
            th: `ใช้สมการเส้นตรงผ่านจุด y - ${height} = ${slope}(x - ${at})`,
            en: `A straight line through that point with that slope.`,
          },
          { math: null },
        ),
      );
    }

    return {
      ...shell(calcTangent, rng, difficulty),
      prompt: wantsLine
        ? {
            th: `จงหาสมการเส้นสัมผัสเส้นโค้งนี้ที่ x = ${at} ตอบในรูป $y = mx + c$`,
            en: `Find the tangent to this curve at x = ${at}, in the form $y = mx + c$`,
          }
        : {
            th: `จงหาความชันของเส้นสัมผัสเส้นโค้งนี้ที่ x = ${at}`,
            en: `Find the slope of the tangent to this curve at x = ${at}`,
          },
      stem: `y = ${shown}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ความชันของเส้นสัมผัสคืออนุพันธ์ที่จุดนั้น",
          en: "The slope of the tangent is the derivative at that point.",
        },
        {
          th: "หาอนุพันธ์ก่อน แล้วจึงแทนค่า x ไม่ใช่ทางกลับกัน",
          en: "Differentiate first and substitute second, never the other way round.",
        },
        wantsLine
          ? {
              th: `ได้ความชัน ${slope} และจุด (${at}, ${height}) แล้วเขียนสมการเส้นตรง`,
              en: `The slope is ${slope} and the point is (${at}, ${height}); now write the line.`,
            }
          : { th: `จะได้ความชัน ${slope}`, en: `That gives ${slope}.` },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: String(height) },
          explain: {
            th: "นั่นคือค่าของฟังก์ชันที่จุดนั้น ไม่ใช่ความชัน ความชันมาจากอนุพันธ์",
            en: "That is the height of the curve there, not its slope. The slope comes from the derivative.",
          },
        },
        {
          answer: { kind: "exact", value: "0" },
          explain: {
            th: "แทนค่า x ก่อนหาอนุพันธ์ จะเหลือค่าคงตัว ซึ่งมีอนุพันธ์เป็นศูนย์เสมอ",
            en: "Substituting before differentiating leaves a constant, and a constant always differentiates to zero.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/**
 * Difficulty 3: where the tangent is flat.
 *
 * The curve is assembled from the roots of its own derivative, so the answer
 * is exact and the quadratic that has to be solved is the ordinary factorising
 * kind.
 */
function flatTangent(rng: RNG, difficulty: number): Question {
  const cubic = rng.bool();
  const first = rng.int(-4, 4);
  const second = rng.pick(
    [-5, -3, -2, -1, 1, 2, 3, 5, 6].filter((root) => root !== first),
  );

  /*
   * A cubic whose derivative is 3(x - first)(x - second), or a quadratic whose
   * derivative is 2(x - first). Written from the derivative backwards.
   */
  const poly: Poly = cubic
    ? [rng.int(-5, 5), 3 * first * second, (-3 * (first + second)) / 2, 1]
    : [rng.int(-5, 5), -2 * first, 1];

  // The half-integer above would be fractional for odd sums; nudge to keep it whole.
  if (cubic && (first + second) % 2 !== 0) {
    poly[2] = -3 * (first + second);
    poly[1] = 6 * first * second;
    poly[3] = 2;
  }

  const derivative = differentiate(poly);
  const roots = cubic ? [first, second].sort((a, b) => a - b) : [first];

  const answer: Answer = cubic
    ? { kind: "set", values: roots.map(String) }
    : { kind: "exact", value: String(first) };

  const steps: Step[] = [
    makeStep(
      `f'(x) = ${printPoly(derivative)}`,
      "calc.derivative-sum",
      {
        th: "หาอนุพันธ์ก่อน",
        en: "Differentiate first.",
      },
      { math: null },
    ),
    makeStep(
      `${printPoly(derivative)} = 0`,
      "calc.critical-point",
      {
        th: "เส้นสัมผัสอยู่ในแนวนอนเมื่อความชันเป็นศูนย์",
        en: "The tangent is flat exactly where the slope is zero.",
      },
      { math: null },
    ),
    makeStep(
      cubic ? `x = ${roots.join(", ")}` : `x = ${first}`,
      "quad.zero-product",
      {
        th: "แก้สมการที่ได้",
        en: "Solve it.",
      },
      { math: null },
    ),
  ];

  return {
    ...shell(calcTangent, rng, difficulty),
    prompt: {
      th: "จงหาค่าของ x ทั้งหมดที่ทำให้เส้นสัมผัสเส้นโค้งนี้อยู่ในแนวนอน",
      en: "Find every x where the tangent to this curve is horizontal",
    },
    stem: `y = ${printPoly(poly)}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "เส้นสัมผัสแนวนอนแปลว่าความชันเป็นศูนย์",
        en: "A horizontal tangent means a slope of zero.",
      },
      {
        th: "หาอนุพันธ์ แล้วให้เท่ากับศูนย์",
        en: "Differentiate, then set it equal to zero.",
      },
      {
        th: cubic
          ? "สมการกำลังสองมีได้สองคำตอบ อย่าหยุดที่คำตอบแรก"
          : "แก้สมการเชิงเส้นก็ได้คำตอบ",
        en: cubic
          ? "A quadratic has two solutions - do not stop at the first."
          : "It is a linear equation from there.",
      },
    ],
    ...mistakes(answer, [
      cubic
        ? {
            answer: { kind: "set", values: [String(roots[0])] },
            explain: {
              th: "นั่นคือคำตอบเดียว ลูกบาศก์มีจุดที่เส้นสัมผัสแนวนอนได้สองจุด",
              en: "That is one of them. A cubic can have two flat tangents.",
            },
          }
        : {
            answer: { kind: "exact", value: String(valueAt(poly, first)) },
            explain: {
              th: "นั่นคือค่า y ที่จุดนั้น โจทย์ถามค่า x",
              en: "That is the y there; the question asks for x.",
            },
          },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/**
 * Difficulty 4: the value at a turning point.
 *
 * This is the question calculus was promised for. ม.3 could answer it for a
 * quadratic by completing the square; here it is answered the way every later
 * optimisation problem is, and the curve is a cubic so completing the square
 * is not available.
 */
function turningValue(rng: RNG, difficulty: number): Question {
  const first = rng.int(-3, 2);
  const second = first + rng.int(1, 4);
  const shift = rng.int(-6, 8);

  // f'(x) = 6(x - first)(x - second), so f is a cubic with whole coefficients.
  const poly: Poly = [
    shift,
    6 * first * second,
    -3 * (first + second),
    2,
  ];
  const derivative = differentiate(poly);

  /*
   * With a positive leading coefficient the first root is the local maximum
   * and the second the local minimum, which is what the prompt asks for.
   */
  const wantsMaximum = rng.bool();
  const at = wantsMaximum ? first : second;
  const value = valueAt(poly, at);

  const steps: Step[] = [
    makeStep(
      `f'(x) = ${printPoly(derivative)}`,
      "calc.derivative-sum",
      { th: "หาอนุพันธ์", en: "Differentiate." },
      { math: null },
    ),
    makeStep(
      `x = ${first}, ${second}`,
      "calc.critical-point",
      {
        th: "ให้อนุพันธ์เป็นศูนย์ ได้จุดวิกฤตสองจุด",
        en: "Setting the derivative to zero gives two critical points.",
      },
      { math: null },
    ),
    makeStep(
      `f(${at}) = ${value}`,
      "calc.tangent-slope",
      {
        th: `จุดที่เป็น${wantsMaximum ? "สูงสุด" : "ต่ำสุด"}เฉพาะที่คือ x = ${at} แล้วแทนกลับลงในฟังก์ชันเดิม`,
        en: `The local ${wantsMaximum ? "maximum" : "minimum"} is at x = ${at}; put that back into the original function.`,
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: String(value) };

  return {
    ...shell(calcTangent, rng, difficulty),
    prompt: {
      th: `จงหาค่า${wantsMaximum ? "สูงสุด" : "ต่ำสุด"}เฉพาะที่ของฟังก์ชันนี้`,
      en: `Find the local ${wantsMaximum ? "maximum" : "minimum"} value of this function`,
    },
    stem: `f(x) = ${printPoly(poly)}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "จุดสูงสุดและต่ำสุดเฉพาะที่อยู่ตรงที่อนุพันธ์เป็นศูนย์",
        en: "Local highs and lows sit where the derivative is zero.",
      },
      {
        th: `ได้จุดวิกฤตสองจุด ที่ x = ${first} และ x = ${second}`,
        en: `There are two critical points, at x = ${first} and x = ${second}.`,
      },
      {
        th: "โจทย์ถามค่าของฟังก์ชัน จึงต้องแทนกลับลงในฟังก์ชันเดิม ไม่ใช่ตอบค่า x",
        en: "The question asks for the value, so substitute back into the original function rather than answering with x.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: String(at) },
        explain: {
          th: "นั่นคือตำแหน่ง x ของจุดนั้น โจทย์ถามค่าของฟังก์ชันที่จุดนั้น",
          en: "That is where it happens; the question asks what the value there is.",
        },
      },
      {
        answer: {
          kind: "exact",
          value: String(valueAt(poly, wantsMaximum ? second : first)),
        },
        explain: {
          th: `นั่นคือค่า${wantsMaximum ? "ต่ำสุด" : "สูงสุด"}เฉพาะที่ ซึ่งเป็นจุดวิกฤตอีกจุดหนึ่ง`,
          en: `That is the other critical point - the local ${wantsMaximum ? "minimum" : "maximum"}.`,
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
