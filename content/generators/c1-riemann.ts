import { coefficient, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "c1.integral-intro";

/**
 * ผลบวกรีมันน์ · Calculus I.
 *
 * The definition, arithmetic enough to do by hand. A learner who has only seen
 * `F(b) - F(a)` has met a *shortcut* without meeting the thing it is short for,
 * and the gap shows the first time an integral will not come out in closed
 * form.
 *
 * Every sum here is computed term by term from the same rectangle widths the
 * learner would use, so the answer and the method cannot come apart - and
 * `c1-integral.test.ts` recomputes the whole sum independently.
 */

/** The sum of `f(x_i) * width` over `count` rectangles. */
function riemannSum(
  f: (x: number) => number,
  from: number,
  to: number,
  count: number,
  side: "left" | "right" | "mid",
): number {
  const width = (to - from) / count;
  let total = 0;
  for (let i = 0; i < count; i += 1) {
    const x =
      side === "left"
        ? from + i * width
        : side === "right"
          ? from + (i + 1) * width
          : from + (i + 0.5) * width;
    total += f(x) * width;
  }
  return total;
}

export const c1Riemann: Generator = {
  id: "c1.riemann",
  skillId: "c1.riemann",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    /*
     * A line at difficulties 1 and 2, where every rectangle's height is a whole
     * number and the arithmetic can be done in the head; a parabola at 3 and 4,
     * where it cannot and the sum starts to feel like the definition it is.
     */
    const quadratic = difficulty >= 3;
    const a = rng.pick([1, 2, 3]);
    const b = rng.int(0, 5);

    const f = quadratic
      ? (x: number) => a * x * x + b
      : (x: number) => a * x + b;

    const from = 0;
    const count = difficulty === 1 ? rng.int(2, 4) : rng.int(4, 6);
    const to = count; // width one, which keeps every height a tidy number
    const side = difficulty === 2 || difficulty === 4 ? "left" : "right";

    const sum = riemannSum(f, from, to, count, side);
    const exact = quadratic
      ? (a * to ** 3) / 3 + b * to
      : (a * to * to) / 2 + b * to;

    const heights = Array.from({ length: count }, (_, i) =>
      side === "left" ? f(from + i) : f(from + i + 1),
    );

    const functionKatex = sumTerms([
      coefficient(a, quadratic ? "x^2" : "x") || null,
      b === 0 ? null : String(b),
    ]);

    const steps: Step[] = [
      makeStep(
        `\\Delta x = \\frac{${to} - ${from}}{${count}} = 1`,
        "c1.riemann-sum",
        {
          th: `แบ่งช่วงเป็น ${count} ส่วนเท่า ๆ กัน แต่ละแท่งกว้าง 1`,
          en: `Cut the interval into ${count} equal pieces, each one wide.`,
        },
        { math: null },
      ),
      makeStep(
        `${heights.join(" + ")} = ${sum}`,
        "c1.riemann-sum",
        {
          th: `ความสูงของแต่ละแท่งวัดที่ปลาย${side === "left" ? "ซ้าย" : "ขวา"} แล้วบวกกัน เพราะแต่ละแท่งกว้าง 1 ผลบวกของความสูงจึงเป็นพื้นที่พอดี`,
          en: `Measure each rectangle's height at its ${side} edge and add. The widths are one, so the heights add to the area.`,
        },
        { math: null },
      ),
      makeStep(
        `\\int_{${from}}^{${to}} \\left(${functionKatex}\\right) dx = ${exact}`,
        "c1.definite-integral",
        {
          th: `ค่าจริงคือ ${exact} ซึ่ง${sum > exact ? "น้อยกว่า" : "มากกว่า"}ผลบวกนี้ ตามที่คาดไว้สำหรับฟังก์ชันเพิ่มที่วัดปลาย${side === "left" ? "ซ้าย" : "ขวา"}`,
          en: `The true value is ${exact}, which the sum ${sum > exact ? "overshoots" : "undershoots"} - as a ${side}-hand sum must for a rising function.`,
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: String(sum) };

    return {
      ...shell(c1Riemann, rng, difficulty),
      prompt: {
        th: `จงหาผลบวกรีมันน์ของฟังก์ชันนี้บนช่วง [${from}, ${to}] โดยแบ่งเป็น ${count} ช่วงเท่ากัน และวัดความสูงที่ปลาย${side === "left" ? "ซ้าย" : "ขวา"}ของแต่ละช่วง`,
        en: `Find the Riemann sum for this function on [${from}, ${to}] with ${count} equal pieces, taking each rectangle's height at its ${side} edge`,
      },
      stem: `f(x) = ${functionKatex}, \\quad [${from}, ${to}], \\quad n = ${count}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "หาความกว้างของแต่ละแท่งก่อน คือความกว้างของช่วงหารด้วยจำนวนแท่ง",
          en: "Start with each rectangle's width: the interval divided by how many.",
        },
        {
          th: `วัดความสูงที่ปลาย${side === "left" ? "ซ้าย" : "ขวา"}ของแต่ละแท่ง ไม่ใช่ที่กึ่งกลาง`,
          en: `Take each height at the ${side} edge, not in the middle.`,
        },
        {
          th: "แล้วบวกพื้นที่ของทุกแท่ง",
          en: "Then add up the rectangles.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: String(
              riemannSum(f, from, to, count, side === "left" ? "right" : "left"),
            ),
          },
          explain: {
            th: `วัดความสูงที่ปลายอีกข้างหนึ่ง โจทย์ระบุปลาย${side === "left" ? "ซ้าย" : "ขวา"}`,
            en: `Heights taken at the other edge. The question asks for the ${side} one.`,
          },
        },
        {
          answer: { kind: "exact", value: String(exact) },
          explain: {
            th: "นั่นคือค่าจริงของปริพันธ์ ไม่ใช่ผลบวกรีมันน์ที่โจทย์ถาม ซึ่งเป็นค่าประมาณ",
            en: "That is the integral itself, not the Riemann sum asked for - which only approximates it.",
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

export { riemannSum };
