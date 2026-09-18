import { linearExpr, orJoin, quadraticExpr } from "../format";
import { makeStep } from "../step";
import type { Difficulty, Generator, Question, RNG, Step } from "../types";

const TOPIC = "quadratic-equations";
const SKILL = "quad.word-problems";

/**
 * โจทย์ปัญหา, written as `adapted` generators (docs/CONTENT-PIPELINE.md §2):
 * the *shape* of a past-paper question, rebuilt backwards from its answer, with
 * our own wording and numbers.
 *
 * The question asks for a single quantity rather than a list, so the stated
 * answer can be substituted back into the model and checked - which is what
 * `machineStem` is for.
 */

// ---------------------------------------------------------------------------
// Shape: rectangle, one side given in terms of the other, area given,
// negative root rejected on physical grounds.
// ---------------------------------------------------------------------------

export const quadWordRectangle: Generator = {
  id: "quad.word-rectangle",
  skillId: SKILL,
  difficulties: [1, 2, 3],
  provenance: "adapted",
  sourceNote:
    "Shape seen in ม.3 textbook exercises and O-NET: area plus a linear relation between the sides; one root rejected because a length cannot be negative.",

  generate(rng, difficulty): Question {
    // Backwards: choose the width, and the area follows.
    const width = rng.int(difficulty === 1 ? 2 : 4, difficulty === 1 ? 9 : 18);
    const gap = rng.int(1, difficulty >= 2 ? 9 : 5);
    const length = width + gap;
    const area = width * length;
    const negativeRoot = -length;

    const factored = `\\left(x - ${width}\\right)\\left(x + ${length}\\right) = 0`;
    const alternatives = orJoin([`x = ${width}`, `x = ${negativeRoot}`]);

    const steps: Step[] = [
      makeStep(
        `x\\left(x + ${gap}\\right) = ${area}`,
        "model.equation",
        {
          th: `ให้ความกว้างเป็น x เมตร ความยาวจึงเป็น x + ${gap} เมตร และพื้นที่คือความกว้างคูณความยาว`,
          en: `Let the width be x metres; the length is then x + ${gap} metres, and the area is width times length.`,
        },
      ),
      makeStep(`${quadraticExpr(1, gap, 0)} = ${area}`, "arith.distribute", {
        th: "คูณกระจาย",
        en: "Multiply out.",
      }),
      makeStep(`${quadraticExpr(1, gap, -area)} = 0`, "eq.move-term", {
        th: "ย้ายทุกพจน์มาข้างเดียวกัน",
        en: "Move everything to one side.",
      }),
      makeStep(factored, "quad.trinomial-pattern", {
        th: `สองจำนวนที่คูณกันได้ ${-area} และบวกกันได้ ${gap} คือ ${-width} กับ ${length}`,
        en: `${-width} and ${length} multiply to ${-area} and add to ${gap}.`,
      }),
      makeStep(
        alternatives.th,
        "quad.zero-product",
        {
          th: "ใช้สมบัติการคูณเป็นศูนย์",
          en: "Use the zero product property.",
        },
        { math: null, exprEn: alternatives.en },
      ),
      makeStep(
        `x = ${width}`,
        "model.reject-root",
        {
          th: `ความกว้างเป็นลบไม่ได้ จึงตัด x = ${negativeRoot} ทิ้ง`,
          en: `A width cannot be negative, so x = ${negativeRoot} is rejected.`,
        },
        { math: null },
      ),
    ];

    return {
      id: `${quadWordRectangle.id}:${rng.seed}:${difficulty}`,
      generatorId: quadWordRectangle.id,
      skillId: SKILL,
      topicId: TOPIC,
      difficulty,
      provenance: "adapted",
      prompt: {
        th: `สี่เหลี่ยมผืนผ้ารูปหนึ่งมีความยาวมากกว่าความกว้าง ${gap} เมตร และมีพื้นที่ ${area} ตารางเมตร จงหาความกว้างเป็นเมตร`,
        en: `A rectangle is ${gap} metres longer than it is wide, and its area is ${area} square metres. Find the width, in metres.`,
      },
      stem: `\\text{กว้าง} \\times \\text{ยาว} = ${area}`,
      machineStem: `x*(x + ${gap}) - ${area}`,
      answer: { kind: "exact", value: String(width) },
      steps,
      hints: [
        {
          th: "ตั้งให้ความกว้างเป็น x แล้วเขียนความยาวในรูปของ x",
          en: "Let the width be x, then write the length in terms of x.",
        },
        {
          th: `พื้นที่ = x\\left(x + ${gap}\\right) = ${area}`,
          en: `Area = x\\left(x + ${gap}\\right) = ${area}.`,
        },
        {
          th: "สมการมีสองคำตอบ แต่ความยาวเป็นลบไม่ได้",
          en: "The equation has two roots, but a length cannot be negative.",
        },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

// ---------------------------------------------------------------------------
// Shape: two numbers a fixed distance apart with a given product.
// ---------------------------------------------------------------------------

export const quadWordConsecutive: Generator = {
  id: "quad.word-consecutive",
  skillId: SKILL,
  difficulties: [2, 3, 4],
  provenance: "adapted",
  sourceNote:
    "Shape: consecutive (or evenly spaced) integers with a given product; the negative pair is a valid root but excluded by 'positive integers'.",

  generate(rng, difficulty): Question {
    const gap = difficulty === 2 ? 1 : rng.pick([1, 2, 3, 4] as const);
    const smaller = rng.int(3, difficulty === 4 ? 24 : 18);
    const product = smaller * (smaller + gap);
    const negativeRoot = -(smaller + gap);

    const alternatives = orJoin([`x = ${smaller}`, `x = ${negativeRoot}`]);
    const description =
      gap === 1
        ? { th: "เรียงติดกัน", en: "consecutive" }
        : { th: `ต่างกัน ${gap}`, en: `${gap} apart` };

    const steps: Step[] = [
      makeStep(`x\\left(x + ${gap}\\right) = ${product}`, "model.equation", {
        th: `ให้จำนวนที่น้อยกว่าเป็น x อีกจำนวนหนึ่งจึงเป็น x + ${gap}`,
        en: `Let the smaller number be x; the other is x + ${gap}.`,
      }),
      makeStep(`${quadraticExpr(1, gap, -product)} = 0`, "eq.move-term", {
        th: "คูณกระจายแล้วย้ายทุกพจน์มาข้างเดียวกัน",
        en: "Multiply out and move everything to one side.",
      }),
      makeStep(
        `\\left(${linearExpr(1, -smaller)}\\right)\\left(${linearExpr(
          1,
          smaller + gap,
        )}\\right) = 0`,
        "quad.trinomial-pattern",
        {
          th: `สองจำนวนที่คูณกันได้ ${-product} และบวกกันได้ ${gap} คือ ${-smaller} กับ ${smaller + gap}`,
          en: `${-smaller} and ${smaller + gap} multiply to ${-product} and add to ${gap}.`,
        },
      ),
      makeStep(
        alternatives.th,
        "quad.zero-product",
        {
          th: "ใช้สมบัติการคูณเป็นศูนย์",
          en: "Use the zero product property.",
        },
        { math: null, exprEn: alternatives.en },
      ),
      makeStep(
        `x = ${smaller}`,
        "model.reject-root",
        {
          th: `โจทย์ระบุว่าเป็นจำนวนเต็มบวก จึงตัด x = ${negativeRoot} ทิ้ง`,
          en: `The problem says positive integers, so x = ${negativeRoot} is rejected.`,
        },
        { math: null },
      ),
    ];

    return {
      id: `${quadWordConsecutive.id}:${rng.seed}:${difficulty}`,
      generatorId: quadWordConsecutive.id,
      skillId: SKILL,
      topicId: TOPIC,
      difficulty,
      provenance: "adapted",
      prompt: {
        th: `จำนวนเต็มบวกสองจำนวน${description.th} มีผลคูณเท่ากับ ${product} จงหาจำนวนที่น้อยกว่า`,
        en: `Two positive integers, ${description.en}, have a product of ${product}. Find the smaller one.`,
      },
      stem: `x\\left(x + ${gap}\\right) = ${product}`,
      machineStem: `x*(x + ${gap}) - ${product}`,
      answer: { kind: "exact", value: String(smaller) },
      steps,
      hints: [
        {
          th: `ให้จำนวนที่น้อยกว่าเป็น x อีกจำนวนคือ x + ${gap}`,
          en: `Let the smaller be x; the other is x + ${gap}.`,
        },
        {
          th: `จะได้สมการ x\\left(x + ${gap}\\right) = ${product}`,
          en: `That gives x\\left(x + ${gap}\\right) = ${product}.`,
        },
        {
          th: "คำตอบที่เป็นลบใช้ไม่ได้ เพราะโจทย์บอกว่าเป็นจำนวนเต็มบวก",
          en: "The negative root is out: the problem says positive integers.",
        },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};
