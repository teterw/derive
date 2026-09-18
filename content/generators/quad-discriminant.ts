import { quadraticExpr } from "../format";
import { solveQuadratic } from "../quad-roots";
import { makeStep } from "../step";
import type { Difficulty, Generator, Question, RNG, Step } from "../types";

const ID = "quad.discriminant-count";
const SKILL = "quad.discriminant";
const TOPIC = "quadratic-equations";

/**
 * ดิสคริมิแนนต์กับจำนวนคำตอบ.
 *
 * A multiple-choice question on purpose: the skill is reading `D` and drawing
 * the conclusion, not grinding out the roots. The choices are fixed strings so
 * the answer key is an id, never a number that could be mistyped.
 */
const CHOICES = [
  { id: "two", label: { th: "มีสองคำตอบ", en: "Two real roots" } },
  { id: "one", label: { th: "มีคำตอบเดียว", en: "One repeated root" } },
  {
    id: "none",
    label: { th: "ไม่มีคำตอบที่เป็นจำนวนจริง", en: "No real roots" },
  },
] as const;

export const quadDiscriminantCount: Generator = {
  id: ID,
  skillId: SKILL,
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const { a, b, c } = coefficients(rng, difficulty);
    const discriminant = b * b - 4 * a * c;
    const correct =
      discriminant > 0 ? "two" : discriminant === 0 ? "one" : "none";
    const roots = solveQuadratic(a, b, c);

    const stem = `${quadraticExpr(a, b, c)} = 0`;

    const verdict = {
      two: {
        th: `D = ${discriminant} > 0 จึงมีคำตอบที่เป็นจำนวนจริงสองคำตอบ`,
        en: `D = ${discriminant} > 0, so there are two real roots.`,
      },
      one: {
        th: `D = 0 พอดี จึงมีคำตอบเดียว (รากซ้ำ)`,
        en: `D = 0 exactly, so there is one repeated root.`,
      },
      none: {
        th: `D = ${discriminant} < 0 รากที่สองของจำนวนลบไม่เป็นจำนวนจริง จึงไม่มีคำตอบ`,
        en: `D = ${discriminant} < 0; the square root of a negative number is not real, so there are no real roots.`,
      },
    }[correct];

    const steps: Step[] = [
      makeStep(
        `a = ${a}, \\ b = ${b}, \\ c = ${c}`,
        "quad.discriminant",
        {
          th: "อ่านค่า a, b, c จากรูปมาตรฐาน",
          en: "Read a, b and c off the standard form.",
        },
        { math: null },
      ),
      makeStep(
        `D = \\left(${b}\\right)^2 - 4\\left(${a}\\right)\\left(${c}\\right) = ${discriminant}`,
        "quad.discriminant",
        {
          th: "แทนค่าในสูตรดิสคริมิแนนต์",
          en: "Substitute into the discriminant.",
        },
        { math: null },
      ),
      makeStep(`D = ${discriminant}`, "quad.discriminant", verdict, {
        math: null,
      }),
    ];

    return {
      id: `${ID}:${rng.seed}:${difficulty}`,
      generatorId: ID,
      skillId: SKILL,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: {
        th: "สมการนี้มีคำตอบที่เป็นจำนวนจริงกี่คำตอบ",
        en: "How many real roots does this equation have?",
      },
      stem,
      // Not machine-derivable from the stem: the answer is a count, not a value.
      machineStem: null,
      answer: { kind: "choice", correct },
      choices: CHOICES.map((choice) => ({
        id: choice.id,
        label: choice.label.th,
      })),
      steps,
      hints: [
        {
          th: "ไม่ต้องแก้สมการ ใช้ดิสคริมิแนนต์พอ",
          en: "You do not have to solve it - the discriminant is enough.",
        },
        { th: "D = b^2 - 4ac", en: "D = b^2 - 4ac." },
        {
          th: `D = ${discriminant}`,
          en: `D = ${discriminant}.`,
        },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      // Kept so the Learn view can show what the roots actually are.
      ...(roots.count > 0 ? {} : {}),
    };
  },
};

/** The choice labels, for the UI in whichever language is active. */
export const discriminantChoices = CHOICES;

function coefficients(
  rng: RNG,
  difficulty: Difficulty,
): { a: number; b: number; c: number } {
  // Every difficulty gets all three outcomes; what changes is how hard the
  // arithmetic is and how close D sits to zero.
  const outcome = rng.pick(["two", "one", "none"] as const);
  const a = difficulty <= 2 ? 1 : rng.int(2, difficulty === 4 ? 5 : 3);

  if (outcome === "one") {
    const h = rng.nonZeroInt(-6, 6);
    return { a, b: -2 * a * h, c: a * h * h };
  }

  const b = rng.nonZeroInt(-9, difficulty >= 3 ? 11 : 9);
  const exact = (b * b) / (4 * a);

  if (outcome === "two") {
    // c strictly below b^2/4a gives D > 0.
    const c = Math.ceil(exact) - rng.int(1, difficulty === 1 ? 6 : 2);
    return { a, b, c: c === 0 ? -1 : c };
  }

  // c strictly above b^2/4a gives D < 0.
  const c = Math.floor(exact) + rng.int(1, difficulty === 1 ? 6 : 2);
  return { a, b, c: c === 0 ? 1 : c };
}
