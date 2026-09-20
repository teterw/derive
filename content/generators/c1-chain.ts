import { coefficient, linearExpr, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "c1.chain";

/**
 * กฎลูกโซ่ · Calculus I.
 *
 * Every question here is a composite built from an inside and an outside, and
 * the derivative is assembled from the same two pieces - so the question and
 * its answer are the same object seen twice, and the chapter test measures the
 * slope to be sure.
 *
 * The inside is always something whose own derivative is simple, because the
 * skill being drilled is *remembering to multiply by it at all*. That is the
 * mistake: `\sin 2x` differentiated to `\cos 2x` is wrong by a factor of two,
 * and nothing about the shape of the answer gives it away.
 */

/**
 * `-4(3x + 1)^2` as mathjs source, with nothing a person would not write.
 *
 * A chain rule answer is a coefficient times a bracket times a power, and all
 * three have edge cases: a power of one is not written, a coefficient of one
 * is not written, and `2*(-2)*` is two numbers that should have been
 * multiplied before anyone saw them.
 */
function bracketPower(value: number, body: string, power: number): string {
  const base = power === 1 ? `(${body})` : `(${body})^(${power})`;
  if (value === 1) return base;
  if (value === -1) return `-${base}`;
  return `${value}*${base}`;
}

/** `3x + 1`, and its derivative, which is the factor the chain rule needs. */
type Inside = { katex: string; math: string; slope: number };

function linearInside(rng: RNG, { positive = false } = {}): Inside {
  /*
   * `positive` keeps the bracket above zero for every x a learner would try,
   * which a logarithm needs: `\ln(2x - 6)` is a perfectly good question and a
   * bad one to meet while learning the chain rule, since half of it is about
   * a domain rather than about differentiating.
   */
  const a = positive ? rng.pick([2, 3, 4, 5]) : rng.pick([2, 3, 4, 5, -2, -3]);
  const b = positive ? rng.int(1, 6) : rng.int(-6, 6);
  return {
    katex: linearExpr(a, b, "x"),
    math: `${a}x ${b < 0 ? "-" : "+"} ${Math.abs(b)}`,
    slope: a,
  };
}

export const c1ChainPower: Generator = {
  id: "c1.chain-power",
  skillId: "c1.chain-power",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const power = difficulty === 1 ? rng.int(2, 4) : rng.int(3, 6);

    /*
     * At 3 and 4 the inside is a quadratic, so its derivative is not a
     * constant and the two factors cannot be collapsed into one coefficient -
     * which is where a learner finds out whether they have understood the
     * rule or memorised a pattern.
     */
    const quadratic = difficulty >= 3;
    const a = rng.pick([1, 2, 3, -1, -2]);
    const b = rng.int(-6, 6);

    const inside: Inside = quadratic
      ? {
          katex: sumTerms([
            coefficient(a, "x^2") || null,
            b === 0 ? null : String(b),
          ]),
          math: `${a}x^2 ${b < 0 ? "-" : "+"} ${Math.abs(b)}`,
          slope: 0,
        }
      : linearInside(rng);

    const insideDerivativeKatex = quadratic
      ? coefficient(2 * a, "x")
      : String(inside.slope);
    const insideDerivativeMath = quadratic ? `${2 * a}x` : String(inside.slope);

    // Difficulty 4 also negates the power, which is where a fraction appears.
    const negative = difficulty === 4;
    const shownPower = negative ? -power : power;
    const stem = `\\left(${inside.katex}\\right)^{${shownPower}}`;

    /*
     * Where the inside is linear its derivative is a number, so it belongs in
     * front as one coefficient rather than as a second factor: `-4(...)^3`,
     * not `2 \cdot (-2)(...)^3`.
     */
    const answerMath = quadratic
      ? `${shownPower}*(${insideDerivativeMath})*${bracketPower(1, inside.math, shownPower - 1)}`
      : bracketPower(shownPower * inside.slope, inside.math, shownPower - 1);
    const answerKatex = quadratic
      ? `${shownPower}\\left(${insideDerivativeKatex}\\right)\\left(${inside.katex}\\right)^{${shownPower - 1}}`
      : `${shownPower * inside.slope}\\left(${inside.katex}\\right)${shownPower - 1 === 1 ? "" : `^{${shownPower - 1}}`}`;

    const steps: Step[] = [
      makeStep(
        `${shownPower}\\left(${inside.katex}\\right)^{${shownPower - 1}} \\cdot \\left(${insideDerivativeKatex}\\right)`,
        "c1.chain-rule",
        {
          th: "ดิฟข้างนอกก่อนโดยเก็บข้างในไว้เหมือนเดิม แล้วคูณด้วยอนุพันธ์ของข้างใน",
          en: "Outside first, leaving the inside alone, then times the derivative of the inside.",
        },
        { math: null },
      ),
      makeStep(
        answerKatex,
        "c1.chain-rule",
        {
          th: quadratic
            ? "อนุพันธ์ของข้างในไม่ใช่ค่าคงตัว จึงรวมเข้ากับสัมประสิทธิ์ไม่ได้"
            : "อนุพันธ์ของข้างในเป็นค่าคงตัว รวมกับสัมประสิทธิ์ข้างหน้าได้",
          en: quadratic
            ? "The inside derivative is not a constant, so it cannot be folded into the coefficient."
            : "The inside derivative is a constant, so it folds into the number in front.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: answerMath };

    return {
      ...shell(c1ChainPower, rng, difficulty),
      prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
      stem,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ข้างในคือวงเล็บ ข้างนอกคือการยกกำลัง",
          en: "The inside is the bracket; the outside is the power.",
        },
        {
          th: `อนุพันธ์ของข้างในคือ ${insideDerivativeKatex}`,
          en: `The inside differentiates to ${insideDerivativeKatex}.`,
        },
        {
          th: "อย่ากระจายวงเล็บออกมา ใช้กฎลูกโซ่เร็วกว่ามาก",
          en: "Do not expand the bracket. The chain rule is far quicker.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: bracketPower(shownPower, inside.math, shownPower - 1),
          },
          explain: {
            th: "ลืมคูณด้วยอนุพันธ์ของข้างใน กฎลูกโซ่มีสองตัวคูณกันเสมอ",
            en: "The derivative of the inside was never multiplied in. The chain rule always has two factors.",
          },
        },
        {
          answer: {
            kind: "exact",
            value: quadratic
              ? `${shownPower}*(${insideDerivativeMath})*${bracketPower(1, inside.math, shownPower)}`
              : bracketPower(shownPower * inside.slope, inside.math, shownPower),
          },
          explain: {
            th: "เลขชี้กำลังไม่ได้ลดลงหนึ่ง กฎกำลังยังต้องทำงานตามปกติ",
            en: "The exponent was never reduced. The power rule still has to do its half of the work.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

export const c1ChainTranscendental: Generator = {
  id: "c1.chain-transcendental",
  skillId: "c1.chain-transcendental",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    /*
     * One shape per difficulty, in the order they turn up: sine, then the
     * exponential, then the logarithm - whose chain factor lands on top of a
     * fraction and is therefore the one most often lost - then cosine, where
     * the chain factor and the rule's own minus both have to survive.
     */
    const shape = difficulty;
    const inside = linearInside(rng, { positive: shape === 3 });

    const outerKatex =
      shape === 1
        ? `\\sin\\left(${inside.katex}\\right)`
        : shape === 2
          ? `e^{${inside.katex}}`
          : shape === 3
            ? `\\ln\\left(${inside.katex}\\right)`
            : `\\cos\\left(${inside.katex}\\right)`;

    const derivativeMath =
      shape === 1
        ? `${inside.slope}*cos(${inside.math})`
        : shape === 2
          ? `${inside.slope}*e^(${inside.math})`
          : shape === 3
            ? `${inside.slope}/(${inside.math})`
            : `${-inside.slope}*sin(${inside.math})`;

    const derivativeKatex =
      shape === 1
        ? `${inside.slope}\\cos\\left(${inside.katex}\\right)`
        : shape === 2
          ? `${inside.slope}e^{${inside.katex}}`
          : shape === 3
            ? `\\frac{${inside.slope}}{${inside.katex}}`
            : `${-inside.slope}\\sin\\left(${inside.katex}\\right)`;

    const steps: Step[] = [
      makeStep(
        `${
          shape === 1
            ? `\\cos\\left(${inside.katex}\\right)`
            : shape === 2
              ? `e^{${inside.katex}}`
              : shape === 3
                ? `\\frac{1}{${inside.katex}}`
                : `-\\sin\\left(${inside.katex}\\right)`
        } \\cdot (${inside.slope})`,
        "c1.chain-rule",
        {
          th: `ดิฟข้างนอกโดยเก็บ ${inside.katex} ไว้เหมือนเดิม แล้วคูณด้วย ${inside.slope}`,
          en: `Differentiate the outside, keeping ${inside.katex} as it is, then multiply by ${inside.slope}.`,
        },
        { math: null },
      ),
      makeStep(
        derivativeKatex,
        "c1.chain-rule",
        { th: "รวมตัวเลขเข้าด้วยกัน", en: "Collect the numbers." },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: derivativeMath };

    return {
      ...shell(c1ChainTranscendental, rng, difficulty),
      prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
      stem: outerKatex,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: `ข้างในคือ ${inside.katex} ซึ่งมีอนุพันธ์เป็น ${inside.slope}`,
          en: `The inside is ${inside.katex}, whose derivative is ${inside.slope}.`,
        },
        {
          th: "ดิฟข้างนอกก่อน โดยยังไม่แตะข้างในเลย",
          en: "Differentiate the outside first, without touching the inside at all.",
        },
        {
          th: `แล้วคูณด้วย ${inside.slope}`,
          en: `Then multiply by ${inside.slope}.`,
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value:
              shape === 1
                ? `cos(${inside.math})`
                : shape === 2
                  ? `e^(${inside.math})`
                  : shape === 3
                    ? `1/(${inside.math})`
                    : `-sin(${inside.math})`,
          },
          explain: {
            th: `ลืมคูณด้วยอนุพันธ์ของข้างใน ซึ่งคือ ${inside.slope}`,
            en: `The inside derivative, ${inside.slope}, was never multiplied in.`,
          },
        },
        ...(shape === 4
          ? [
              {
                answer: {
                  kind: "exact" as const,
                  value: `${inside.slope}*sin(${inside.math})`,
                },
                explain: {
                  th: "เครื่องหมายลบของอนุพันธ์ของคอสหายไป",
                  en: "The cosine's minus has gone missing.",
                },
              },
            ]
          : []),
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

export { linearInside, bracketPower, type Inside };
