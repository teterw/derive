import { coefficient, linearExpr, paren } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type {
  Difficulty,
  Generator,
  L,
  Misconception,
  Question,
  RNG,
  Step,
} from "../types";

const TOPIC = "eq.linear-one-var";

/**
 * โจทย์ปัญหาสมการเชิงเส้นตัวแปรเดียว.
 *
 * The skill ม.1 exams actually test, and the one the algebra exists for. Each
 * shape is built backwards from the answer - the child's age, the width, the
 * number - and the sentence is assembled around it, so the question always has
 * a whole-number answer that means something in the situation.
 *
 * ## The stem is a skeleton, not the equation
 *
 * `\square + 7 = 19` rather than `x + 7 = 19`. Showing the equation would do
 * the modelling for the learner, which is the whole difficulty; showing
 * nothing leaves the display with an empty box where the maths goes. The
 * box is also what ม.1 textbooks use before `x` is introduced, and unlike
 * `\text{จำนวน}` it reads the same in both languages.
 *
 * `machineStem` carries the real model, so §9.5 can still substitute the
 * stated answer back into the situation - a word problem whose stem is not
 * machine-readable is otherwise verified by nothing at all.
 */
type Shape = {
  prompt: L;
  /** Language-neutral skeleton of the relationship. */
  stem: string;
  /** Zero form of the equation the sentence sets up. */
  machineStem: string;
  answer: number;
  /** What the answer is, for the line that names it. */
  unit: L;
  steps: Step[];
  misconceptions: Misconception[];
  hints: L[];
};

/** The last line of every one of these: the value, named. */
function solvedStep(answer: number): Step {
  return makeStep(
    `x = ${answer}`,
    "eq.balance",
    {
      th: `หารทั้งสองข้างด้วยสัมประสิทธิ์ของ x ได้ x = ${answer}`,
      en: `Divide both sides by the coefficient of x: x = ${answer}.`,
    },
    { chain: "solved" },
  );
}

function build(rng: RNG, difficulty: Difficulty): Shape {
  if (difficulty === 1) {
    const answer = rng.int(4, 40);
    const a = rng.int(3, 30);
    const total = answer + a;

    return {
      prompt: {
        th: `จำนวนจำนวนหนึ่ง เมื่อนำไปบวกกับ ${a} แล้วได้ผลลัพธ์เท่ากับ ${total} จงหาจำนวนนั้น`,
        en: `A number, added to ${a}, comes to ${total}. What is the number?`,
      },
      stem: `\\square + ${a} = ${total}`,
      machineStem: `(x + ${a}) - ${total}`,
      answer,
      unit: { th: "จำนวนนั้น", en: "the number" },
      steps: [
        makeStep(`${linearExpr(1, a)} = ${total}`, "model.equation", {
          th: `ให้จำนวนนั้นเป็น x เงื่อนไขในโจทย์เขียนได้เป็น ${linearExpr(1, a)} = ${total}`,
          en: `Let the number be x. The condition in the problem is ${linearExpr(1, a)} = ${total}.`,
        }),
        makeStep(`x = ${answer}`, "eq.move-term", {
          th: `ย้าย ${a} ไปอีกข้าง ได้ x = ${answer}`,
          en: `Move the ${a} across: x = ${answer}.`,
        }),
      ],
      misconceptions: namedMistakes({ kind: "exact", value: String(answer) }, [
        {
          answer: { kind: "exact", value: String(total + a) },
          explain: {
            th: `โจทย์บอกว่าบวกแล้วได้ ${total} จึงต้องลบ ${a} ออกจาก ${total} ไม่ใช่บวกเข้าไปอีก`,
            en: `Adding gave ${total}, so undoing it subtracts ${a} from ${total} rather than adding it again.`,
          },
        },
      ]),
      hints: [
        {
          th: "ตั้งจำนวนที่โจทย์ถามเป็น x ก่อน",
          en: "Start by letting the number the problem asks for be x.",
        },
        {
          th: `เงื่อนไขคือ ${linearExpr(1, a)} = ${total}`,
          en: `The condition is ${linearExpr(1, a)} = ${total}.`,
        },
        { th: `ย้าย ${a} ไปอีกข้าง`, en: `Move the ${a} across.` },
      ],
    };
  }

  if (difficulty === 2) {
    const answer = rng.int(3, 25);
    const a = rng.int(2, 9);
    const b = rng.int(2, 30);
    const result = a * answer - b;

    return {
      prompt: {
        th: `${a} เท่าของจำนวนจำนวนหนึ่ง เมื่อลบด้วย ${b} แล้วได้ผลลัพธ์เท่ากับ ${result} จงหาจำนวนนั้น`,
        en: `${a} times a number, minus ${b}, comes to ${result}. What is the number?`,
      },
      stem: `${a}\\square - ${b} = ${result}`,
      machineStem: `(${a}*x - ${b}) - ${result}`,
      answer,
      unit: { th: "จำนวนนั้น", en: "the number" },
      steps: [
        makeStep(`${linearExpr(a, -b)} = ${result}`, "model.equation", {
          th: `ให้จำนวนนั้นเป็น x จะได้ ${linearExpr(a, -b)} = ${result}`,
          en: `Let the number be x, giving ${linearExpr(a, -b)} = ${result}.`,
        }),
        makeStep(`${coefficient(a, "x")} = ${result + b}`, "eq.move-term", {
          th: `ย้าย ${b} ไปอีกข้าง ได้ ${result} + ${b} = ${result + b}`,
          en: `Move the ${b} across: ${result} + ${b} = ${result + b}.`,
        }),
        solvedStep(answer),
      ],
      misconceptions: namedMistakes({ kind: "exact", value: String(answer) }, [
        {
          answer: { kind: "exact", value: `(${result} - ${b})/${a}` },
          explain: {
            th: `โจทย์ลบ ${b} ออกไปแล้ว การแก้จึงต้องบวก ${b} กลับเข้าไป ไม่ใช่ลบอีก`,
            en: `The problem subtracted ${b}, so solving adds it back rather than subtracting again.`,
          },
        },
      ]),
      hints: [
        {
          th: `"${a} เท่าของจำนวนหนึ่ง" เขียนเป็น ${coefficient(a, "x")}`,
          en: `"${a} times a number" is written ${coefficient(a, "x")}.`,
        },
        {
          th: `เงื่อนไขคือ ${linearExpr(a, -b)} = ${result}`,
          en: `The condition is ${linearExpr(a, -b)} = ${result}.`,
        },
        {
          th: `ย้าย ${b} ก่อน แล้วค่อยหารด้วย ${a}`,
          en: `Move the ${b} first, then divide by ${a}.`,
        },
      ],
    };
  }

  if (difficulty === 3) {
    /*
     * Ages. Built from the child's age now, so the father's age is whatever it
     * has to be - the alternative, choosing both ages and solving for the
     * number of years, does not always come out whole.
     */
    const child = rng.int(4, 14);
    const years = rng.int(2, 12);
    const times = rng.int(2, 4);
    const father = times * (child + years) - years;

    return {
      prompt: {
        th: `ปัจจุบันพ่ออายุ ${father} ปี อีก ${years} ปีข้างหน้า พ่อจะมีอายุเป็น ${times} เท่าของอายุลูกในตอนนั้น จงหาอายุของลูกในปัจจุบัน`,
        en: `A father is ${father} years old today. In ${years} years he will be ${times} times as old as his child will be then. How old is the child now?`,
      },
      stem: `${father} + ${years} = ${times}\\left(\\square + ${years}\\right)`,
      machineStem: `(${father} + ${years}) - ${times}*(x + ${years})`,
      answer: child,
      unit: { th: "อายุลูกในปัจจุบัน", en: "the child's age now" },
      steps: [
        makeStep(
          `${father} + ${years} = ${times}${paren(linearExpr(1, years))}`,
          "model.equation",
          {
            th: `ให้อายุลูกปัจจุบันเป็น x อีก ${years} ปี ลูกจะอายุ ${linearExpr(1, years)} และพ่อจะอายุ ${father + years}`,
            en: `Let the child's age now be x. In ${years} years the child is ${linearExpr(1, years)} and the father is ${father + years}.`,
          },
        ),
        makeStep(
          `${father + years} = ${linearExpr(times, times * years)}`,
          "arith.distribute",
          {
            th: `คูณกระจาย ${times} เข้าไปในวงเล็บ`,
            en: `Multiply the ${times} into the bracket.`,
          },
        ),
        /*
         * The variable stays on the right. Swapping the sides of an equation
         * negates its zero form, which is the one thing the property gate's
         * chain check reads as a broken derivation.
         */
        makeStep(
          `${father + years - times * years} = ${coefficient(times, "x")}`,
          "eq.move-term",
          {
            th: `ย้าย ${times * years} ไปทางซ้าย ได้ ${father + years - times * years}`,
            en: `Move the ${times * years} to the left: ${father + years - times * years}.`,
          },
        ),
        solvedStep(child),
      ],
      misconceptions: namedMistakes({ kind: "exact", value: String(child) }, [
        {
          answer: { kind: "exact", value: String(child + years) },
          explain: {
            th: `${child + years} คืออายุลูกในอีก ${years} ปี โจทย์ถามอายุปัจจุบัน ต้องลบ ${years} ออก`,
            en: `${child + years} is the child's age in ${years} years. The question asks for the age now, which is ${years} less.`,
          },
        },
        {
          answer: { kind: "exact", value: `${father}/${times}` },
          explain: {
            th: `พ่อจะอายุเป็น ${times} เท่าของลูก ในอีก ${years} ปี ไม่ใช่ตอนนี้`,
            en: `The father is ${times} times as old ${years} years from now, not today.`,
          },
        },
      ]),
      hints: [
        {
          th: "ตั้งอายุลูกปัจจุบันเป็น x แล้วเขียนอายุของทั้งคู่ในอีกกี่ปีข้างหน้า",
          en: "Let the child's age now be x, then write both ages as they will be later.",
        },
        {
          th: `อีก ${years} ปี ลูกอายุ ${linearExpr(1, years)} และพ่ออายุ ${father + years}`,
          en: `In ${years} years the child is ${linearExpr(1, years)} and the father is ${father + years}.`,
        },
        {
          th: `เงื่อนไขคือ ${father + years} = ${times}${paren(linearExpr(1, years))}`,
          en: `The condition is ${father + years} = ${times}${paren(linearExpr(1, years))}.`,
        },
      ],
    };
  }

  /*
   * A rectangle from its perimeter. The one shape where the answer a learner
   * reaches first - the length - is not the one that was asked for.
   */
  const width = rng.int(3, 24);
  const gap = rng.int(2, 15);
  const perimeter = 4 * width + 2 * gap;

  return {
    prompt: {
      th: `สี่เหลี่ยมผืนผ้ารูปหนึ่งมีความยาวมากกว่าความกว้างอยู่ ${gap} เมตร และมีความยาวรอบรูป ${perimeter} เมตร จงหาความกว้างเป็นเมตร`,
      en: `A rectangle is ${gap} metres longer than it is wide, and its perimeter is ${perimeter} metres. Find the width, in metres.`,
    },
    stem: `2\\left(\\square + \\square + ${gap}\\right) = ${perimeter}`,
    machineStem: `(4*x + ${2 * gap}) - ${perimeter}`,
    answer: width,
    unit: { th: "ความกว้าง", en: "the width" },
    steps: [
      makeStep(
        `2${paren(`x + ${linearExpr(1, gap)}`)} = ${perimeter}`,
        "model.equation",
        {
          th: `ให้ความกว้างเป็น x ความยาวจึงเป็น ${linearExpr(1, gap)} และความยาวรอบรูปคือสองเท่าของผลบวกทั้งสอง`,
          en: `Let the width be x, so the length is ${linearExpr(1, gap)} and the perimeter is twice their sum.`,
        },
      ),
      makeStep(`${linearExpr(4, 2 * gap)} = ${perimeter}`, "arith.distribute", {
        th: `รวมในวงเล็บได้ ${linearExpr(2, gap)} แล้วคูณ 2 ได้ ${linearExpr(4, 2 * gap)}`,
        en: `Inside the bracket that is ${linearExpr(2, gap)}; doubled it is ${linearExpr(4, 2 * gap)}.`,
      }),
      makeStep(`${coefficient(4, "x")} = ${perimeter - 2 * gap}`, "eq.move-term", {
        th: `ย้าย ${2 * gap} ไปอีกข้าง ได้ ${perimeter - 2 * gap}`,
        en: `Move the ${2 * gap} across: ${perimeter - 2 * gap}.`,
      }),
      solvedStep(width),
    ],
    misconceptions: namedMistakes({ kind: "exact", value: String(width) }, [
      {
        answer: { kind: "exact", value: String(width + gap) },
        explain: {
          th: `${width + gap} คือความยาว โจทย์ถามความกว้าง ซึ่งน้อยกว่าอยู่ ${gap} เมตร`,
          en: `${width + gap} is the length. The question asks for the width, which is ${gap} metres less.`,
        },
      },
      {
        answer: { kind: "exact", value: `(${perimeter} - ${gap})/2` },
        explain: {
          th: `ความยาวรอบรูปคือสองเท่าของ กว้างบวกยาว ไม่ใช่ กว้างบวกยาว เฉย ๆ`,
          en: `The perimeter is twice the width plus the length, not the width plus the length.`,
        },
      },
    ]),
    hints: [
      {
        th: "ตั้งความกว้างเป็น x แล้วเขียนความยาวในรูปของ x",
        en: "Let the width be x, then write the length in terms of x.",
      },
      {
        th: `ความยาวรอบรูป = 2 \\times \\left(x + ${linearExpr(1, gap)}\\right) = ${perimeter}`,
        en: `Perimeter = 2 \\times \\left(x + ${linearExpr(1, gap)}\\right) = ${perimeter}.`,
      },
      {
        th: "ระวังว่าโจทย์ถามความกว้าง ไม่ใช่ความยาว",
        en: "Careful: the question asks for the width, not the length.",
      },
    ],
  };
}

export const eqLinearWord: Generator = {
  id: "eq.linear.word",
  skillId: "eq.linear.word",
  difficulties: [1, 2, 3, 4],
  provenance: "adapted",
  sourceNote:
    "Shapes: a number puzzle, a multiple-then-subtract puzzle, an ages problem, and a rectangle from its perimeter - the four ม.1 textbook archetypes.",

  generate(rng, difficulty): Question {
    const shape = build(rng, difficulty);
    return {
      id: `${eqLinearWord.id}:${rng.seed}:${difficulty}`,
      generatorId: eqLinearWord.id,
      skillId: eqLinearWord.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "adapted",
      prompt: shape.prompt,
      stem: shape.stem,
      machineStem: shape.machineStem,
      answer: { kind: "exact", value: String(shape.answer) },
      steps: shape.steps,
      hints: shape.hints,
      ...(shape.misconceptions.length
        ? { misconceptions: shape.misconceptions }
        : {}),
      rulesUsed: [...new Set(shape.steps.map((step) => step.ruleId))],
    };
  },
};
