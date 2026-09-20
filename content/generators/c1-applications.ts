import { coefficient, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "c1.applications";

/**
 * การประยุกต์ของอนุพันธ์ · Calculus I.
 *
 * Every curve in this file is built from the roots of its own derivative, so
 * the turning points are whole numbers and the answers are exact - and the
 * chapter test finds those turning points again by measuring the slope, which
 * is a different route to the same place.
 */

/** `[c, b, a]` is `ax^2 + bx + c`, lowest power first. */
type Poly = number[];

function printPoly(poly: Poly): string {
  return sumTerms(
    poly
      .map((value, exponent) => {
        if (value === 0) return null;
        if (exponent === 0) return String(value);
        return coefficient(value, exponent === 1 ? "x" : `x^${exponent}`) || null;
      })
      .reverse(),
  );
}

function differentiate(poly: Poly): Poly {
  const out = poly.slice(1).map((value, index) => value * (index + 1));
  return out.length ? out : [0];
}

function valueAt(poly: Poly, x: number): number {
  return poly.reduce((total, value, exponent) => total + value * x ** exponent, 0);
}

/**
 * A cubic whose derivative has the two roots given, with whole coefficients.
 *
 * `f'(x) = 6(x - p)(x - q)` integrates to `2x^3 - 3(p+q)x^2 + 6pq x + c`, so
 * the six keeps every coefficient a whole number whatever p and q are.
 */
function cubicWithTurningPoints(p: number, q: number, shift: number): Poly {
  return [shift, 6 * p * q, -3 * (p + q), 2];
}

export const c1Monotonic: Generator = {
  id: "c1.monotonic",
  skillId: "c1.monotonic",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const first = rng.int(-4, 2);
    const second = first + rng.int(1, 5);
    const shift = rng.int(-6, 8);
    const poly = cubicWithTurningPoints(first, second, shift);
    const derivative = differentiate(poly);
    const second_ = differentiate(derivative);

    /*
     * Four questions about the same cubic, in the order a curve sketch asks
     * them: where does it stop rising, where does it start rising again,
     * where does it change the way it bends, and what does that bend point
     * sit at.
     */
    const inflection = (first + second) / 2;
    const asks =
      difficulty === 1
        ? "rises-until"
        : difficulty === 2
          ? "falls-between"
          : difficulty === 3
            ? "inflection"
            : "inflection-value";

    const answerValue =
      asks === "rises-until"
        ? first
        : asks === "falls-between"
          ? second
          : asks === "inflection"
            ? inflection
            : valueAt(poly, inflection);

    const answerMath = Number.isInteger(answerValue)
      ? String(answerValue)
      : `${answerValue * 2}/2`;

    const prompt =
      asks === "rises-until"
        ? {
            th: "ฟังก์ชันนี้เพิ่มขึ้นจนถึงค่า x ค่าหนึ่งแล้วจึงเริ่มลดลง จงหาค่า x นั้น",
            en: "This function rises until one value of x and then starts to fall. Find that x",
          }
        : asks === "falls-between"
          ? {
              th: "ฟังก์ชันนี้ลดลงในช่วงหนึ่งแล้วจึงกลับมาเพิ่มขึ้น จงหาค่า x ที่มันเริ่มเพิ่มขึ้นอีกครั้ง",
              en: "This function falls for a while and then rises again. Find the x where it starts rising again",
            }
          : asks === "inflection"
            ? {
                th: "จงหาค่า x ของจุดเปลี่ยนเว้าของกราฟนี้",
                en: "Find the x of this graph's inflection point",
              }
            : {
                th: "จงหาค่า y ของจุดเปลี่ยนเว้าของกราฟนี้",
                en: "Find the y of this graph's inflection point",
              };

    const steps: Step[] = [
      makeStep(
        `f'(x) = ${printPoly(derivative)}`,
        "calc.derivative-sum",
        { th: "หาอนุพันธ์ก่อน", en: "Differentiate first." },
        { math: null },
      ),
      asks === "inflection" || asks === "inflection-value"
        ? makeStep(
            `f''(x) = ${printPoly(second_)}`,
            "c1.inflection",
            {
              th: "จุดเปลี่ยนเว้าอยู่ตรงที่อนุพันธ์อันดับสองเป็นศูนย์และเปลี่ยนเครื่องหมาย",
              en: "An inflection sits where the second derivative is zero and changes sign.",
            },
            { math: null },
          )
        : makeStep(
            `x = ${first}, ${second}`,
            "calc.critical-point",
            {
              th: "ให้อนุพันธ์เป็นศูนย์ ได้จุดที่กราฟเปลี่ยนทิศ",
              en: "Setting the derivative to zero gives where the graph turns.",
            },
            { math: null },
          ),
      makeStep(
        asks === "inflection-value"
          ? `f\\left(${inflection}\\right) = ${valueAt(poly, inflection)}`
          : `x = ${answerValue}`,
        asks === "rises-until" || asks === "falls-between"
          ? "c1.increasing-decreasing"
          : "c1.inflection",
        {
          th:
            asks === "rises-until"
              ? "ก่อนจุดวิกฤตแรก อนุพันธ์เป็นบวก กราฟจึงกำลังเพิ่ม"
              : asks === "falls-between"
                ? "หลังจุดวิกฤตที่สอง อนุพันธ์กลับมาเป็นบวก"
                : "แล้วแทนกลับเพื่อหาค่าที่ต้องการ",
          en:
            asks === "rises-until"
              ? "Before the first critical point the derivative is positive, so the graph is climbing."
              : asks === "falls-between"
                ? "After the second critical point the derivative is positive again."
                : "Then substitute back for what was asked.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: answerMath };

    return {
      ...shell(c1Monotonic, rng, difficulty),
      prompt,
      stem: `f(x) = ${printPoly(poly)}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th:
            asks === "inflection" || asks === "inflection-value"
              ? "ความเว้าดูจากอนุพันธ์อันดับสอง"
              : "ทิศทางของกราฟดูจากเครื่องหมายของอนุพันธ์อันดับหนึ่ง",
          en:
            asks === "inflection" || asks === "inflection-value"
              ? "Curvature comes from the second derivative."
              : "The direction of the graph comes from the sign of the first derivative.",
        },
        {
          th:
            asks === "inflection" || asks === "inflection-value"
              ? "ให้อนุพันธ์อันดับสองเป็นศูนย์"
              : "ให้อนุพันธ์อันดับหนึ่งเป็นศูนย์ จะได้จุดที่เปลี่ยนทิศ",
          en:
            asks === "inflection" || asks === "inflection-value"
              ? "Set the second derivative to zero."
              : "Set the first derivative to zero to find where it turns.",
        },
        {
          th:
            asks === "inflection-value"
              ? "แล้วแทนค่ากลับลงในฟังก์ชันเดิม ไม่ใช่ในอนุพันธ์"
              : `จุดวิกฤตอยู่ที่ x = ${first} และ x = ${second}`,
          en:
            asks === "inflection-value"
              ? "Then put it back into the original function, not into a derivative."
              : `The critical points are at x = ${first} and x = ${second}.`,
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value:
              asks === "rises-until"
                ? String(second)
                : asks === "falls-between"
                  ? String(first)
                  : asks === "inflection"
                    ? String(first)
                    : String(valueAt(poly, first)),
          },
          explain: {
            th:
              asks === "inflection" || asks === "inflection-value"
                ? "นั่นคือจุดวิกฤต ไม่ใช่จุดเปลี่ยนเว้า จุดเปลี่ยนเว้าอยู่ตรงกลางระหว่างจุดวิกฤตทั้งสองพอดี"
                : "เป็นจุดวิกฤตอีกจุดหนึ่ง ลองดูว่ากราฟกำลังขึ้นหรือลงก่อนและหลังแต่ละจุด",
            en:
              asks === "inflection" || asks === "inflection-value"
                ? "That is a critical point, not the inflection - which sits exactly between the two."
                : "That is the other critical point. Look at whether the graph climbs or falls on each side.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

export const c1Extrema: Generator = {
  id: "c1.extrema",
  skillId: "c1.extrema",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty >= 3) return onAnInterval(rng, difficulty);

    const first = rng.int(-4, 2);
    const second = first + rng.int(1, 5);
    const shift = rng.int(-6, 8);
    const poly = cubicWithTurningPoints(first, second, shift);
    const derivative = differentiate(poly);
    const secondDerivative = differentiate(derivative);

    /*
     * With a positive leading coefficient the first root is the maximum and
     * the second the minimum. Difficulty 1 asks which is which; difficulty 2
     * asks for the value there, which needs the original function back.
     */
    const wantsMaximum = rng.bool();
    const at = wantsMaximum ? first : second;
    const answerValue = difficulty === 1 ? at : valueAt(poly, at);

    const steps: Step[] = [
      makeStep(
        `f'(x) = ${printPoly(derivative)} = 0 \\Rightarrow x = ${first}, ${second}`,
        "calc.critical-point",
        {
          th: "หาจุดวิกฤตก่อน",
          en: "Find the critical points first.",
        },
        { math: null },
      ),
      makeStep(
        `f''(x) = ${printPoly(secondDerivative)}, \\quad f''(${at}) = ${valueAt(secondDerivative, at)}`,
        "c1.second-derivative",
        {
          th: `ที่ x = ${at} อนุพันธ์อันดับสองเป็น${valueAt(secondDerivative, at) > 0 ? "บวก กราฟโค้งขึ้น จึงเป็นต่ำสุด" : "ลบ กราฟโค้งลง จึงเป็นสูงสุด"}`,
          en: `At x = ${at} the second derivative is ${valueAt(secondDerivative, at) > 0 ? "positive, so the graph bends upwards: a minimum" : "negative, so the graph bends downwards: a maximum"}.`,
        },
        { math: null },
      ),
      makeStep(
        difficulty === 1 ? `x = ${at}` : `f(${at}) = ${valueAt(poly, at)}`,
        difficulty === 1 ? "c1.second-derivative" : "calc.tangent-slope",
        {
          th:
            difficulty === 1
              ? "จึงได้ตำแหน่งที่ต้องการ"
              : "แล้วแทนกลับลงในฟังก์ชันเดิมเพื่อหาค่า",
          en:
            difficulty === 1
              ? "Which is the position asked for."
              : "Then back into the original function for the value.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: String(answerValue) };

    return {
      ...shell(c1Extrema, rng, difficulty),
      prompt:
        difficulty === 1
          ? {
              th: `จงหาค่า x ที่ทำให้ฟังก์ชันนี้มีค่า${wantsMaximum ? "สูงสุด" : "ต่ำสุด"}เฉพาะที่`,
              en: `Find the x at which this function has a local ${wantsMaximum ? "maximum" : "minimum"}`,
            }
          : {
              th: `จงหาค่า${wantsMaximum ? "สูงสุด" : "ต่ำสุด"}เฉพาะที่ของฟังก์ชันนี้`,
              en: `Find the local ${wantsMaximum ? "maximum" : "minimum"} value of this function`,
            },
      stem: `f(x) = ${printPoly(poly)}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "หาจุดวิกฤตจาก f'(x) = 0 ก่อน",
          en: "Find the critical points from f'(x) = 0 first.",
        },
        {
          th: "แล้วใช้อนุพันธ์อันดับสองบอกว่าจุดไหนเป็นสูงสุดจุดไหนเป็นต่ำสุด",
          en: "Then the second derivative says which is which.",
        },
        {
          th:
            difficulty === 1
              ? "โจทย์ถามตำแหน่ง x ไม่ใช่ค่าของฟังก์ชัน"
              : "โจทย์ถามค่าของฟังก์ชัน จึงต้องแทนกลับ",
          en:
            difficulty === 1
              ? "The question asks where, not how much."
              : "The question asks how much, so substitute back.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value:
              difficulty === 1
                ? String(wantsMaximum ? second : first)
                : String(valueAt(poly, wantsMaximum ? second : first)),
          },
          explain: {
            th: "สลับสูงสุดกับต่ำสุด อนุพันธ์อันดับสองเป็นบวกคือต่ำสุด เป็นลบคือสูงสุด",
            en: "Maximum and minimum are the wrong way round: a positive second derivative is a minimum.",
          },
        },
        {
          answer: {
            kind: "exact",
            value:
              difficulty === 1 ? String(valueAt(poly, at)) : String(at),
          },
          explain: {
            th:
              difficulty === 1
                ? "นั่นคือค่าของฟังก์ชันที่จุดนั้น โจทย์ถามตำแหน่ง x"
                : "นั่นคือตำแหน่ง x โจทย์ถามค่าของฟังก์ชัน",
            en:
              difficulty === 1
                ? "That is the value there; the question asks where."
                : "That is where it happens; the question asks how much.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/**
 * Difficulties 3 and 4: the largest or smallest value on a closed interval.
 *
 * The interval is chosen so that exactly one critical point is inside it, and
 * the answer is sometimes at an endpoint - because "check the ends too" is the
 * entire content of the skill.
 */
function onAnInterval(rng: RNG, difficulty: number): Question {
  const first = rng.int(-3, 1);
  const second = first + rng.int(2, 4);
  const shift = rng.int(-6, 8);
  const poly = cubicWithTurningPoints(first, second, shift);
  const derivative = differentiate(poly);

  // An interval that contains the first critical point but not the second.
  const from = first - rng.int(1, 3);
  const to = rng.int(first + 1, second - 1);

  const candidates = [from, first, to];
  const values = candidates.map((x) => valueAt(poly, x));
  const wantsMaximum = difficulty === 3;
  const best = wantsMaximum ? Math.max(...values) : Math.min(...values);
  const where = candidates[values.indexOf(best)]!;

  const steps: Step[] = [
    makeStep(
      `f'(x) = ${printPoly(derivative)} = 0 \\Rightarrow x = ${first}`,
      "calc.critical-point",
      {
        th: `ในช่วงนี้มีจุดวิกฤตจุดเดียวคือ x = ${first}`,
        en: `Only one critical point falls inside the interval: x = ${first}.`,
      },
      { math: null },
    ),
    makeStep(
      `f(${from}) = ${values[0]}, \\quad f(${first}) = ${values[1]}, \\quad f(${to}) = ${values[2]}`,
      "c1.closed-interval",
      {
        th: "คิดค่าที่จุดวิกฤตและที่ปลายช่วงทั้งสอง",
        en: "Work out the value at the critical point and at both ends.",
      },
      { math: null },
    ),
    makeStep(
      `${wantsMaximum ? "\\max" : "\\min"} = ${best}`,
      "c1.closed-interval",
      {
        th: `ค่าที่${wantsMaximum ? "มาก" : "น้อย"}ที่สุดในสามค่านี้คือคำตอบ${where === from || where === to ? " ซึ่งอยู่ที่ปลายช่วง" : ""}`,
        en: `The ${wantsMaximum ? "largest" : "smallest"} of the three is the answer${where === from || where === to ? ", and it is at an end" : ""}.`,
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: String(best) };

  return {
    ...shell(c1Extrema, rng, difficulty),
    prompt: {
      th: `จงหาค่า${wantsMaximum ? "สูงสุด" : "ต่ำสุด"}สัมบูรณ์ของฟังก์ชันนี้บนช่วง [${from}, ${to}]`,
      en: `Find the absolute ${wantsMaximum ? "maximum" : "minimum"} of this function on [${from}, ${to}]`,
    },
    stem: `f(x) = ${printPoly(poly)}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "บนช่วงปิด คำตอบอยู่ที่จุดวิกฤตหรือที่ปลายช่วงเท่านั้น",
        en: "On a closed interval the answer is at a critical point or at an end.",
      },
      {
        th: `จุดวิกฤตในช่วงนี้คือ x = ${first}`,
        en: `The critical point inside the interval is x = ${first}.`,
      },
      {
        th: "อย่าลืมคิดค่าที่ปลายช่วงทั้งสองด้วย",
        en: "Do not forget to work out both ends as well.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: String(values[1]) },
        explain: {
          th: "นั่นคือค่าที่จุดวิกฤต ซึ่งไม่ได้เป็นคำตอบเสมอไปบนช่วงปิด ปลายช่วงก็มีสิทธิ์",
          en: "That is the value at the critical point, which does not always win on a closed interval.",
        },
      },
      {
        answer: { kind: "exact", value: String(where) },
        explain: {
          th: "นั่นคือตำแหน่ง x โจทย์ถามค่าของฟังก์ชัน",
          en: "That is where it happens; the question asks for the value.",
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

export { printPoly, differentiate, valueAt, cubicWithTurningPoints, type Poly };
