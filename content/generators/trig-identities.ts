import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import {
  angleKatex,
  product,
  sum,
  valueAt,
  type Angle,
  type RatioName,
} from "./exact-angles";
import type { Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "trig.functions";

/**
 * เอกลักษณ์ตรีโกณมิติ · ม.5.
 *
 * An identity is a statement about *every* angle, which is exactly what
 * `areEquivalent` tests: it samples twelve awkward values and asks whether the
 * two expressions agree at all of them. So this is the one chapter in the app
 * where the gate's method and the mathematics are the same thing, and every
 * question here is fully machine-checked - stem, answer and every line of the
 * derivation.
 *
 * The angle is written `x` rather than `\theta` only because the maths field
 * puts `x` under the learner's thumb; both convert to the same thing.
 */

/** Simplifications that follow from the Pythagorean identity. */
const PYTHAGOREAN: {
  from: string;
  to: string;
  math: string;
  answer: string;
  why: L;
}[] = [
  {
    from: "\\sin^2 x + \\cos^2 x",
    to: "1",
    math: "sin(x)^2 + cos(x)^2",
    answer: "1",
    why: {
      th: "เอกลักษณ์พีทาโกรัสโดยตรง ผลบวกนี้เท่ากับหนึ่งที่ทุกมุม",
      en: "The Pythagorean identity itself: that sum is one at every angle.",
    },
  },
  {
    from: "1 - \\sin^2 x",
    to: "\\cos^2 x",
    math: "1 - sin(x)^2",
    answer: "cos(x)^2",
    why: {
      th: "ย้าย \\sin^2 x ไปอีกข้างของเอกลักษณ์",
      en: "The identity with sin squared moved across.",
    },
  },
  {
    from: "1 - \\cos^2 x",
    to: "\\sin^2 x",
    math: "1 - cos(x)^2",
    answer: "sin(x)^2",
    why: {
      th: "ย้าย \\cos^2 x ไปอีกข้างของเอกลักษณ์",
      en: "The identity with cos squared moved across.",
    },
  },
  {
    from: "\\sec^2 x - \\tan^2 x",
    to: "1",
    math: "sec(x)^2 - tan(x)^2",
    answer: "1",
    why: {
      th: "มาจากการหารเอกลักษณ์พีทาโกรัสด้วย \\cos^2 x ตลอดทั้งสมการ",
      en: "The Pythagorean identity divided through by cos squared.",
    },
  },
  {
    from: "1 + \\tan^2 x",
    to: "\\sec^2 x",
    math: "1 + tan(x)^2",
    answer: "sec(x)^2",
    why: {
      th: "เอกลักษณ์พีทาโกรัสรูปที่หารด้วย \\cos^2 x แล้ว",
      en: "The same identity, divided through by cos squared.",
    },
  },
];

/** Simplifications that come from writing everything in sine and cosine. */
const QUOTIENT: { from: string; to: string; math: string; answer: string; why: L }[] =
  [
    {
      from: "\\frac{\\sin x}{\\cos x}",
      to: "\\tan x",
      math: "sin(x)/cos(x)",
      answer: "tan(x)",
      why: {
        th: "นิยามของ \\tan x",
        en: "That is what tan means.",
      },
    },
    {
      from: "\\tan x\\cos x",
      to: "\\sin x",
      math: "tan(x) * cos(x)",
      answer: "sin(x)",
      why: {
        th: "เขียน \\tan x เป็น \\frac{\\sin x}{\\cos x} แล้ว \\cos x ตัดกัน",
        en: "Write tan as sine over cosine and the cosines cancel.",
      },
    },
    {
      from: "\\frac{1 - \\cos^2 x}{\\sin x}",
      to: "\\sin x",
      math: "(1 - cos(x)^2)/sin(x)",
      answer: "sin(x)",
      why: {
        th: "ตัวเศษคือ \\sin^2 x จึงเหลือ \\sin x หลังตัดกัน",
        en: "The top is sin squared, so one sine survives the cancelling.",
      },
    },
    {
      from: "\\frac{\\sin x\\cos x}{\\cos^2 x}",
      to: "\\tan x",
      math: "(sin(x) * cos(x))/cos(x)^2",
      answer: "tan(x)",
      why: {
        th: "ตัด \\cos x ทั้งเศษและส่วน เหลือ \\frac{\\sin x}{\\cos x}",
        en: "Cancel one cosine from each, leaving sine over cosine.",
      },
    },
    {
      from: "\\sec x\\cos x",
      to: "1",
      math: "sec(x) * cos(x)",
      answer: "1",
      why: {
        th: "\\sec x คือส่วนกลับของ \\cos x ผลคูณจึงเป็นหนึ่ง",
        en: "Secant is one over cosine, so the product is one.",
      },
    },
  ];

/** Double angle work, at difficulty 3. */
const DOUBLE: { from: string; to: string; math: string; answer: string; why: L }[] =
  [
    {
      from: "2\\sin x\\cos x",
      to: "\\sin 2x",
      math: "2 * sin(x) * cos(x)",
      answer: "sin(2x)",
      why: {
        th: "สูตรมุมสองเท่าของไซน์ อ่านจากขวาไปซ้าย",
        en: "The sine double angle formula, read right to left.",
      },
    },
    {
      from: "\\cos^2 x - \\sin^2 x",
      to: "\\cos 2x",
      math: "cos(x)^2 - sin(x)^2",
      answer: "cos(2x)",
      why: {
        th: "สูตรมุมสองเท่าของโคไซน์",
        en: "The cosine double angle formula.",
      },
    },
    {
      from: "1 - 2\\sin^2 x",
      to: "\\cos 2x",
      math: "1 - 2 * sin(x)^2",
      answer: "cos(2x)",
      why: {
        th: "สูตรมุมสองเท่าของโคไซน์ในรูปที่ใช้ \\sin เพียงอย่างเดียว",
        en: "The cosine double angle formula in its sine-only form.",
      },
    },
    {
      from: "\\frac{\\sin 2x}{2\\cos x}",
      to: "\\sin x",
      math: "sin(2x)/(2 * cos(x))",
      answer: "sin(x)",
      why: {
        th: "กระจาย \\sin 2x เป็น 2\\sin x\\cos x ก่อน แล้วตัดกัน",
        en: "Open out sin 2x into two sine cos, then cancel.",
      },
    },
    {
      from: "\\frac{1 - \\cos 2x}{2}",
      to: "\\sin^2 x",
      math: "(1 - cos(2x))/2",
      answer: "sin(x)^2",
      why: {
        th: "จากสูตร \\cos 2x = 1 - 2\\sin^2 x จัดรูปใหม่",
        en: "Rearranged from cos 2x = 1 - 2 sin squared x.",
      },
    },
  ];

/** Angles whose exact sine and cosine the compound formula can build from. */
const COMPOUND_PAIRS: [number, number][] = [
  [3, 2],
  [3, 4],
  [4, 2],
  [4, 3],
  [2, 3],
  [6, 2],
  [6, 4],
  [8, 3],
];

export const trigIdentities: Generator = {
  id: "trig.identities",
  skillId: "trig.identities",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 4) return compound(rng, difficulty);

    const table =
      difficulty === 1 ? PYTHAGOREAN : difficulty === 2 ? QUOTIENT : DOUBLE;
    const chosen = rng.pick(table);
    const rule =
      difficulty === 1
        ? "trig.pythagorean-identity"
        : difficulty === 2
          ? "trig.quotient-identity"
          : "trig.double-angle";

    /*
     * A coefficient and a constant in front, so the table of five does not
     * become five questions. They also make the simplification worth doing:
     * `3(1 - \sin^2 x) + 2` cannot be answered by recognising a line.
     */
    const coefficient = rng.int(1, 4);
    const constant = rng.int(0, 5);

    const shown =
      coefficient === 1
        ? `\\left(${chosen.from}\\right)`
        : `${coefficient}\\left(${chosen.from}\\right)`;
    const stem = constant === 0 ? shown : `${shown} + ${constant}`;

    const answerMath = sum([
      product([String(coefficient), chosen.answer]),
      String(constant),
    ]);

    const steps: Step[] = [
      makeStep(
        constant === 0
          ? coefficient === 1
            ? chosen.to
            : `${coefficient}\\left(${chosen.to}\\right)`
          : `${coefficient === 1 ? "" : coefficient}\\left(${chosen.to}\\right) + ${constant}`,
        rule,
        chosen.why,
      ),
    ];

    return {
      ...shell(trigIdentities, rng, difficulty),
      prompt: {
        th: "จงจัดรูปนิพจน์ต่อไปนี้ให้อยู่ในรูปอย่างง่าย",
        en: "Simplify the expression",
      },
      stem,
      answer: { kind: "exact", value: answerMath },
      steps,
      hints: [
        {
          th: "มองหาเอกลักษณ์ที่ซ่อนอยู่ในวงเล็บก่อน",
          en: "Look for the identity hiding inside the bracket first.",
        },
        { th: `ในวงเล็บคือ ${chosen.to}`, en: `The bracket is ${chosen.to}.` },
        chosen.why,
      ],
      ...mistakes({ kind: "exact", value: answerMath }, [
        {
          answer: {
            kind: "exact",
            value: sum([chosen.answer, String(constant)]),
          },
          explain: {
            th: "จัดรูปในวงเล็บถูกแล้ว แต่ลืมคูณตัวเลขข้างหน้ากลับเข้าไป",
            en: "The bracket is simplified correctly, but the number in front has not been multiplied back in.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/**
 * Difficulty 4: an exact value no table lists.
 *
 * `\sin\frac{5\pi}{12}` is seventy-five degrees, which is not a special angle
 * and has an exact value all the same, because it is the sum of two that are.
 * This is the question the compound angle formula was invented for.
 */
function compound(rng: RNG, difficulty: number): Question {
  const [first, second] = rng.pick(COMPOUND_PAIRS);
  const operation = rng.bool() ? "+" : "-";
  const ratio: RatioName = rng.bool() ? "sin" : "cos";

  const a: Angle = { twelfths: first! };
  const b: Angle = { twelfths: second! };
  const total: Angle = {
    twelfths: operation === "+" ? first! + second! : first! - second!,
  };

  const sinA = valueAt(a, "sin")!;
  const cosA = valueAt(a, "cos")!;
  const sinB = valueAt(b, "sin")!;
  const cosB = valueAt(b, "cos")!;

  /*
   * sin(A+B) = sinA cosB + cosA sinB, and cos(A+B) = cosA cosB - sinA sinB.
   * The signs run opposite ways in the two formulae and opposite again for a
   * difference, which is the whole difficulty of the thing.
   */
  const sign = operation === "+" ? 1 : -1;
  const answerMath =
    ratio === "sin"
      ? `(${sinA.math}) * (${cosB.math}) ${sign > 0 ? "+" : "-"} (${cosA.math}) * (${sinB.math})`
      : `(${cosA.math}) * (${cosB.math}) ${sign > 0 ? "-" : "+"} (${sinA.math}) * (${sinB.math})`;

  const expansion =
    ratio === "sin"
      ? `\\sin${angleKatex(a)}\\cos${angleKatex(b)} ${sign > 0 ? "+" : "-"} \\cos${angleKatex(a)}\\sin${angleKatex(b)}`
      : `\\cos${angleKatex(a)}\\cos${angleKatex(b)} ${sign > 0 ? "-" : "+"} \\sin${angleKatex(a)}\\sin${angleKatex(b)}`;

  const substituted =
    ratio === "sin"
      ? `\\left(${sinA.katex}\\right)\\left(${cosB.katex}\\right) ${sign > 0 ? "+" : "-"} \\left(${cosA.katex}\\right)\\left(${sinB.katex}\\right)`
      : `\\left(${cosA.katex}\\right)\\left(${cosB.katex}\\right) ${sign > 0 ? "-" : "+"} \\left(${sinA.katex}\\right)\\left(${sinB.katex}\\right)`;

  const steps: Step[] = [
    makeStep(
      `\\${ratio}\\left(${angleKatex(a)} ${operation} ${angleKatex(b)}\\right)`,
      "trig.compound-angle",
      {
        th: `เขียน ${angleKatex(total)} เป็นผล${operation === "+" ? "บวก" : "ต่าง"}ของสองมุมพิเศษ`,
        en: `Write ${angleKatex(total)} as the ${operation === "+" ? "sum" : "difference"} of two angles whose values are known.`,
      },
    ),
    makeStep(expansion, "trig.compound-angle", {
      th: "กางสูตรผลบวกของมุมออกมา",
      en: "Open out the compound angle formula.",
    }),
    makeStep(substituted, "trig.quadrant-signs", {
      th: "แทนค่าที่แน่นอนของมุมพิเศษทั้งสี่ตัว",
      en: "Put in the four exact values.",
    }),
  ];

  return {
    ...shell(trigIdentities, rng, difficulty),
    prompt: {
      th: `จงหาค่าที่แน่นอนของ \\${ratio}${angleKatex(total)}`,
      en: `Find the exact value of ${ratio} ${angleKatex(total)}`,
    },
    stem: `\\${ratio}${angleKatex(total, { bracket: true })}`,
    answer: { kind: "exact", value: answerMath },
    steps,
    hints: [
      {
        th: `${angleKatex(total)} ไม่ใช่มุมพิเศษ แต่เขียนเป็นผล${operation === "+" ? "บวก" : "ต่าง"}ของมุมพิเศษสองมุมได้`,
        en: `${angleKatex(total)} is not a special angle, but it is the ${operation === "+" ? "sum" : "difference"} of two that are.`,
      },
      {
        th: `ลองเขียนเป็น ${angleKatex(a)} ${operation} ${angleKatex(b)}`,
        en: `Try writing it as ${angleKatex(a)} ${operation} ${angleKatex(b)}.`,
      },
      {
        th: ratio === "sin" ? "\\sin(A+B) = \\sin A\\cos B + \\cos A\\sin B" : "\\cos(A+B) = \\cos A\\cos B - \\sin A\\sin B",
        en:
          ratio === "sin"
            ? "$\\sin(A+B) = \\sin A\\cos B + \\cos A\\sin B$"
            : "$\\cos(A+B) = \\cos A\\cos B - \\sin A\\sin B$",
      },
    ],
    ...mistakes({ kind: "exact", value: answerMath }, [
      {
        answer: {
          kind: "exact",
          value: sum([
            valueAt(a, ratio)!.math,
            valueAt(b, ratio)!.math,
          ]),
        },
        explain: {
          th: "ฟังก์ชันตรีโกณมิติกระจายเข้าไปในวงเล็บไม่ได้ \\sin(A+B) ไม่เท่ากับ \\sin A + \\sin B",
          en: "A trigonometric function does not share out over a bracket: $\\sin(A+B)$ is not $\\sin A + \\sin B$.",
        },
      },
      {
        answer: {
          kind: "exact",
          value:
            ratio === "sin"
              ? `(${sinA.math}) * (${cosB.math}) ${sign > 0 ? "-" : "+"} (${cosA.math}) * (${sinB.math})`
              : `(${cosA.math}) * (${cosB.math}) ${sign > 0 ? "+" : "-"} (${sinA.math}) * (${sinB.math})`,
        },
        explain: {
          th: "เครื่องหมายกลางสูตรกลับกัน สูตรของ \\cos ใช้ลบเมื่อโจทย์เป็นบวก ส่วนของ \\sin ใช้เครื่องหมายเดียวกับโจทย์",
          en: "The sign in the middle is the wrong way round: the cosine formula flips it, the sine formula keeps it.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/** The fields every question in this generator shares. */
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
  answer: { kind: "exact"; value: string },
  candidates: { answer: { kind: "exact"; value: string }; explain: L }[],
) {
  const named = namedMistakes(answer, candidates);
  return named.length ? { misconceptions: named } : {};
}
