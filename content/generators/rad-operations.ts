import { radical, sumTerms } from "../format";
import { makeStep } from "../step";
import type { Difficulty, Generator, Question, RNG, Step } from "../types";

const ID = "rad.operations-core";
const SKILL = "rad.operations";
const TOPIC = "exponents-radicals";

const SQUARE_FREE = [2, 3, 5, 6, 7, 10, 11, 13];

/**
 * การบวก ลบ คูณ หารกรณฑ์.
 *
 * Built backwards from a chosen square-free radicand: every term in the
 * question is `c_i\sqrt{k_i^2 m}` for the same `m`, so the generator knows the
 * combined coefficient before it writes the question.
 */
export const radOperationsCore: Generator = {
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
      prompt: {
        th: "จงหาผลลัพธ์ในรูปอย่างง่าย",
        en: "Work it out and simplify",
      },
      stem: built.stem,
      answer: { kind: "exact", value: built.answerMath },
      steps: built.steps,
      hints: built.hints,
      rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
    };
  },
};

type Built = {
  stem: string;
  answerMath: string;
  steps: Step[];
  hints: { th: string; en: string }[];
};

function mathRadical(coefficientValue: number, radicand: number): string {
  if (radicand === 1) return String(coefficientValue);
  if (coefficientValue === 1) return `sqrt(${radicand})`;
  if (coefficientValue === -1) return `-sqrt(${radicand})`;
  return `${coefficientValue}*sqrt(${radicand})`;
}

function build(rng: RNG, difficulty: Difficulty): Built {
  const m = rng.pick(SQUARE_FREE);

  if (difficulty === 1) {
    const a = rng.int(2, 9);
    const b = rng.int(1, 9);
    const plus = rng.bool(0.6);
    const total = plus ? a + b : a - b;

    return {
      stem: `${radical(a, m)} ${plus ? "+" : "-"} ${radical(b, m)}`,
      answerMath: mathRadical(total, m),
      steps: [
        makeStep(
          `\\left(${a} ${plus ? "+" : "-"} ${b}\\right)\\sqrt{${m}}`,
          "rad.like-terms",
          {
            th: `ตัวถูกกรณฑ์เป็น ${m} เหมือนกัน จึงรวมสัมประสิทธิ์ได้`,
            en: `Both radicands are ${m}, so the coefficients combine.`,
          },
        ),
        makeStep(radical(total, m), "rad.like-terms", {
          th: `${a} ${plus ? "+" : "-"} ${b} = ${total}`,
          en: `${a} ${plus ? "+" : "-"} ${b} = ${total}.`,
        }),
      ],
      hints: [
        {
          th: "ตัวถูกกรณฑ์เหมือนกันหรือไม่",
          en: "Are the radicands the same?",
        },
        {
          th: "กรณฑ์ที่เหมือนกันรวมกันได้เหมือนพจน์คล้าย",
          en: "Like radicals combine like like terms.",
        },
        {
          th: `\\sqrt{${m}} เป็นตัวร่วม`,
          en: `\\sqrt{${m}} is the common part.`,
        },
      ],
    };
  }

  if (difficulty === 2 || difficulty === 3) {
    // Terms that only become like terms after each one is simplified.
    const count = difficulty === 2 ? 2 : 3;
    const parts = Array.from({ length: count }, () => {
      const k = rng.int(1, 5);
      const sign = rng.bool(0.65) ? 1 : -1;
      const outer = rng.int(1, 3);
      return { k, sign, outer, radicand: k * k * m };
    });

    const stem = sumTerms(
      parts.map((part) => radical(part.sign * part.outer, part.radicand)),
    );

    const simplified = sumTerms(
      parts.map((part) => radical(part.sign * part.outer * part.k, m)),
    );

    const total = parts.reduce(
      (sum, part) => sum + part.sign * part.outer * part.k,
      0,
    );

    const steps: Step[] = [
      makeStep(simplified, "rad.perfect-square-extract", {
        th: "จัดรูปแต่ละกรณฑ์ก่อน จะเห็นว่าทุกพจน์มีตัวถูกกรณฑ์เดียวกัน",
        en: "Simplify each root first, and every term turns out to share a radicand.",
      }),
      makeStep(radical(total, m), "rad.like-terms", {
        th: `รวมสัมประสิทธิ์: ได้ ${total}`,
        en: `Combine the coefficients: ${total}.`,
      }),
    ];

    return {
      stem,
      answerMath: total === 0 ? "0" : mathRadical(total, m),
      steps,
      hints: [
        {
          th: "ยังบวกกันไม่ได้จนกว่าจะจัดรูปให้ตัวถูกกรณฑ์เหมือนกัน",
          en: "They cannot be added until the radicands match.",
        },
        {
          th: "ถอดกำลังสองสมบูรณ์ออกจากแต่ละกรณฑ์ก่อน",
          en: "Pull the perfect squares out of each root first.",
        },
        {
          th: `ทุกพจน์จะกลายเป็นผลคูณของ \\sqrt{${m}}`,
          en: `Every term becomes a multiple of \\sqrt{${m}}.`,
        },
      ],
    };
  }

  // Difficulty 4: a conjugate product, where the radicals vanish entirely.
  const a = rng.pick(SQUARE_FREE);
  let b = rng.pick(SQUARE_FREE);
  if (b === a) b = a === 2 ? 3 : 2;

  return {
    stem: `\\left(\\sqrt{${a}} + \\sqrt{${b}}\\right)\\left(\\sqrt{${a}} - \\sqrt{${b}}\\right)`,
    answerMath: String(a - b),
    steps: [
      makeStep(
        `\\left(\\sqrt{${a}}\\right)^2 - \\left(\\sqrt{${b}}\\right)^2`,
        "quad.diff-squares",
        {
          th: "รูปแบบผลต่างกำลังสอง พจน์กลางตัดกันหมด",
          en: "This is a difference of squares, so the middle terms cancel.",
        },
      ),
      makeStep(`${a} - ${b}`, "rad.product", {
        th: `\\left(\\sqrt{${a}}\\right)^2 = ${a} และ \\left(\\sqrt{${b}}\\right)^2 = ${b}`,
        en: `\\left(\\sqrt{${a}}\\right)^2 = ${a} and \\left(\\sqrt{${b}}\\right)^2 = ${b}.`,
      }),
      makeStep(String(a - b), "rad.product", {
        th: `${a} - ${b} = ${a - b} ซึ่งไม่ติดกรณฑ์แล้ว`,
        en: `${a} - ${b} = ${a - b}, with no root left.`,
      }),
    ],
    hints: [
      {
        th: "ไม่ต้องคูณกระจายทีละพจน์ ลองสังเกตรูปแบบ",
        en: "Do not expand term by term - look at the shape first.",
      },
      {
        th: "นี่คือ (A + B)(A - B)",
        en: "This is (A + B)(A - B).",
      },
      {
        th: `จะได้ ${a} - ${b}`,
        en: `You get ${a} - ${b}.`,
      },
    ],
  };
}
