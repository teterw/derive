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

const TOPIC = "ineq.linear-one-var";

/**
 * โจทย์ปัญหาอสมการ.
 *
 * The words are the skill. ไม่เกิน, อย่างน้อย, มากที่สุด - each one decides
 * which way the sign goes, and a learner who reads them as "equals" writes a
 * perfectly correct equation for the wrong question.
 *
 * Every shape ends with a whole number, because every one of them is about a
 * thing you cannot have a fraction of: notebooks, kilometres charged for, a
 * mark out of a hundred, a width in whole metres. That is also what makes the
 * answer markable - a solution set is not a value (see the topic header).
 */
type Shape = {
  prompt: L;
  stem: string;
  answer: number;
  steps: Step[];
  misconceptions: Misconception[];
  hints: L[];
};

/** A line of working. Inequalities are not expressions; see `ineq-linear.ts`. */
function ineqStep(expr: string, ruleId: string, explain: L): Step {
  return makeStep(expr, ruleId, explain, { math: null });
}

function build(rng: RNG, difficulty: Difficulty): Shape {
  if (difficulty === 1) {
    const price = rng.int(12, 45);
    const answer = rng.int(3, 15);
    // Leave a remainder, so the boundary is not a whole number and the
    // question is about reading the solution rather than dividing exactly.
    const money = price * answer + rng.int(1, price - 1);

    return {
      prompt: {
        th: `มีเงิน ${money} บาท ต้องการซื้อสมุดราคาเล่มละ ${price} บาท จะซื้อสมุดได้มากที่สุดกี่เล่ม`,
        en: `With ${money} baht and notebooks costing ${price} baht each, what is the greatest number of notebooks that can be bought?`,
      },
      stem: `${price}\\square \\leq ${money}`,
      answer,
      steps: [
        ineqStep(
          `${coefficient(price, "x")} \\leq ${money}`,
          "model.equation",
          {
            th: `ให้ซื้อได้ x เล่ม ราคารวมคือ ${coefficient(price, "x")} ซึ่งต้องไม่เกิน ${money}`,
            en: `Let x be the number bought. The cost is ${coefficient(price, "x")}, which must not exceed ${money}.`,
          },
        ),
        ineqStep(`x \\leq \\frac{${money}}{${price}}`, "ineq.balance", {
          th: `หารทั้งสองข้างด้วย ${price} ซึ่งเป็นจำนวนบวก เครื่องหมายไม่กลับ`,
          en: `Divide both sides by ${price}; it is positive, so the sign stays.`,
        }),
        ineqStep(`x = ${answer}`, "ineq.integer-solutions", {
          th: `${money} หารด้วย ${price} ได้ ${answer} เศษ ${money - price * answer} ซื้อได้มากที่สุด ${answer} เล่ม`,
          en: `${money} divided by ${price} is ${answer} remainder ${money - price * answer}, so ${answer} is the most that can be bought.`,
        }),
      ],
      misconceptions: namedMistakes({ kind: "exact", value: String(answer) }, [
        {
          answer: { kind: "exact", value: String(answer + 1) },
          explain: {
            th: `${answer + 1} เล่มราคา ${price * (answer + 1)} บาท ซึ่งเกิน ${money} บาทที่มีอยู่`,
            en: `${answer + 1} notebooks cost ${price * (answer + 1)} baht, which is more than the ${money} available.`,
          },
        },
      ]),
      hints: [
        {
          th: "ตั้งจำนวนเล่มที่ซื้อเป็น x แล้วเขียนราคารวม",
          en: "Let x be the number bought, then write the total cost.",
        },
        {
          th: `ราคารวมต้องไม่เกิน ${money} จึงได้ ${coefficient(price, "x")} \\leq ${money}`,
          en: `The total must not exceed ${money}: ${coefficient(price, "x")} \\leq ${money}.`,
        },
        {
          th: "หารแล้วปัดลง เพราะซื้อเศษเล่มไม่ได้",
          en: "Divide and round down - you cannot buy part of a notebook.",
        },
      ],
    };
  }

  if (difficulty === 2) {
    const start = rng.int(20, 45);
    const perKm = rng.int(6, 14);
    const answer = rng.int(4, 20);
    const money = start + perKm * answer + rng.int(1, perKm - 1);

    return {
      prompt: {
        th: `ค่าโดยสารรถแท็กซี่คิดค่าเริ่มต้น ${start} บาท จากนั้นคิดกิโลเมตรละ ${perKm} บาท ถ้ามีเงิน ${money} บาท จะนั่งได้ไกลที่สุดกี่กิโลเมตร`,
        en: `A taxi charges ${start} baht to start and ${perKm} baht for each kilometre after that. With ${money} baht, what is the greatest whole number of kilometres that can be travelled?`,
      },
      stem: `${start} + ${perKm}\\square \\leq ${money}`,
      answer,
      steps: [
        ineqStep(
          `${linearExpr(perKm, start)} \\leq ${money}`,
          "model.equation",
          {
            th: `ให้ระยะทางเป็น x กิโลเมตร ค่าโดยสารคือ ${linearExpr(perKm, start)}`,
            en: `Let the distance be x kilometres; the fare is ${linearExpr(perKm, start)}.`,
          },
        ),
        ineqStep(
          `${coefficient(perKm, "x")} \\leq ${money - start}`,
          "ineq.balance",
          {
            th: `ย้าย ${start} ไปอีกข้าง เหลือ ${money - start} บาทสำหรับระยะทาง`,
            en: `Move the ${start} across: ${money - start} baht is left for the distance.`,
          },
        ),
        ineqStep(`x = ${answer}`, "ineq.integer-solutions", {
          th: `${money - start} หารด้วย ${perKm} ได้ ${answer} เศษ ${money - start - perKm * answer} จึงไปได้ไกลที่สุด ${answer} กิโลเมตร`,
          en: `${money - start} divided by ${perKm} is ${answer} remainder ${money - start - perKm * answer}, so ${answer} kilometres is the furthest.`,
        }),
      ],
      misconceptions: namedMistakes({ kind: "exact", value: String(answer) }, [
        {
          answer: { kind: "exact", value: String(Math.floor(money / perKm)) },
          explain: {
            th: `ค่าเริ่มต้น ${start} บาทถูกคิดก่อนเสมอ ต้องหักออกก่อนแล้วจึงหารด้วย ${perKm}`,
            en: `The ${start} baht starting charge comes off first; only what is left is divided by ${perKm}.`,
          },
        },
      ]),
      hints: [
        {
          th: "ค่าเริ่มต้นคิดครั้งเดียว ส่วนค่ากิโลเมตรคิดตามระยะทาง",
          en: "The starting charge is once; the per-kilometre charge depends on the distance.",
        },
        {
          th: `ค่าโดยสารคือ ${linearExpr(perKm, start)} และต้องไม่เกิน ${money}`,
          en: `The fare is ${linearExpr(perKm, start)}, and it must not exceed ${money}.`,
        },
        {
          th: `หัก ${start} ออกก่อน เหลือ ${money - start} แล้วค่อยหารด้วย ${perKm}`,
          en: `Take off the ${start} first, leaving ${money - start}, then divide by ${perKm}.`,
        },
      ],
    };
  }

  if (difficulty === 3) {
    /*
     * An average, and the sign goes the other way: "not below" is at least,
     * which is the one shape in this chapter whose answer is a minimum.
     */
    /*
     * Built backwards from the mark needed, not from the target average: the
     * average has to be a whole number for the question to read cleanly, and
     * choosing it first leaves the required mark anywhere from 25 to 154 -
     * outside what a test is marked out of about half the time.
     */
    const first = rng.int(55, 85);
    const answer = rng.int(62, 95);
    const roughSecond = rng.int(55, 83);
    const second =
      roughSecond + ((3 - ((first + roughSecond + answer) % 3)) % 3);
    const target = (first + second + answer) / 3;

    return {
      prompt: {
        th: `สอบสองครั้งแรกได้ ${first} และ ${second} คะแนน ถ้าต้องการให้คะแนนเฉลี่ยของทั้งสามครั้งไม่ต่ำกว่า ${target} คะแนน ครั้งที่สามต้องได้อย่างน้อยกี่คะแนน`,
        en: `Two tests scored ${first} and ${second}. To average at least ${target} over three tests, what is the lowest mark the third test can be?`,
      },
      stem: `\\frac{${first} + ${second} + \\square}{3} \\geq ${target}`,
      answer,
      steps: [
        ineqStep(
          `\\frac{${first + second} + x}{3} \\geq ${target}`,
          "model.equation",
          {
            th: `ให้คะแนนครั้งที่สามเป็น x คะแนนเฉลี่ยคือผลรวมหารสาม`,
            en: `Let the third mark be x; the average is the total over three.`,
          },
        ),
        ineqStep(
          `${first + second} + x \\geq ${3 * target}`,
          "ineq.balance",
          {
            th: `คูณทั้งสองข้างด้วย 3 ซึ่งเป็นจำนวนบวก เครื่องหมายไม่กลับ`,
            en: `Multiply both sides by 3; it is positive, so the sign stays.`,
          },
        ),
        ineqStep(`x \\geq ${answer}`, "ineq.balance", {
          th: `ย้าย ${first + second} ไปอีกข้าง ได้ ${3 * target} - ${first + second} = ${answer}`,
          en: `Move the ${first + second} across: ${3 * target} - ${first + second} = ${answer}.`,
        }),
        ineqStep(`x = ${answer}`, "ineq.integer-solutions", {
          th: `เครื่องหมายมีขีดใต้ ${answer} เองจึงใช้ได้ และเป็นคะแนนที่น้อยที่สุดที่เป็นไปได้`,
          en: `The sign includes equality, so ${answer} itself works, and it is the lowest mark that does.`,
        }),
      ],
      misconceptions: namedMistakes({ kind: "exact", value: String(answer) }, [
        {
          answer: { kind: "exact", value: String(target) },
          explain: {
            th: `${target} คือคะแนน เฉลี่ย ที่ต้องการ ไม่ใช่คะแนนที่ต้องได้ในครั้งที่สาม`,
            en: `${target} is the average being aimed at, not the mark needed in the third test.`,
          },
        },
        {
          answer: {
            kind: "exact",
            value: String(2 * target - first - second),
          },
          explain: {
            th: `คะแนนเฉลี่ยของสามครั้งคือผลรวมหารด้วย 3 ไม่ใช่หารด้วย 2`,
            en: `An average over three tests divides the total by 3, not by 2.`,
          },
        },
      ]),
      hints: [
        {
          th: "คะแนนเฉลี่ยของสามครั้งคือผลรวมของทั้งสามหารด้วย 3",
          en: "The average of three marks is their total divided by 3.",
        },
        {
          th: `ไม่ต่ำกว่า แปลว่า $\\geq$ ไม่ใช่ $>$`,
          en: `Not below means $\\geq$, not $>$.`,
        },
        {
          th: `คูณ 3 ทั้งสองข้าง จะได้ ${first + second} + x \\geq ${3 * target}`,
          en: `Multiplying by 3 gives ${first + second} + x \\geq ${3 * target}.`,
        },
      ],
    };
  }

  const gap = rng.int(2, 12);
  const answer = rng.int(4, 25);
  const perimeter = 4 * answer + 2 * gap + rng.int(1, 3);

  return {
    prompt: {
      th: `สี่เหลี่ยมผืนผ้ารูปหนึ่งมีความยาวมากกว่าความกว้างอยู่ ${gap} เมตร และมีความยาวรอบรูปไม่เกิน ${perimeter} เมตร ความกว้างที่มากที่สุดที่เป็นจำนวนเต็มคือกี่เมตร`,
      en: `A rectangle is ${gap} metres longer than it is wide, and its perimeter is at most ${perimeter} metres. What is the greatest whole-number width?`,
    },
    stem: `2\\left(\\square + \\square + ${gap}\\right) \\leq ${perimeter}`,
    answer,
    steps: [
      ineqStep(
        `2${paren(`x + ${linearExpr(1, gap)}`)} \\leq ${perimeter}`,
        "model.equation",
        {
          th: `ให้ความกว้างเป็น x ความยาวจึงเป็น ${linearExpr(1, gap)}`,
          en: `Let the width be x, so the length is ${linearExpr(1, gap)}.`,
        },
      ),
      ineqStep(
        `${linearExpr(4, 2 * gap)} \\leq ${perimeter}`,
        "arith.distribute",
        {
          th: `รวมในวงเล็บแล้วคูณ 2 ได้ ${linearExpr(4, 2 * gap)}`,
          en: `Adding inside the bracket and doubling gives ${linearExpr(4, 2 * gap)}.`,
        },
      ),
      ineqStep(
        `${coefficient(4, "x")} \\leq ${perimeter - 2 * gap}`,
        "ineq.balance",
        {
          th: `ย้าย ${2 * gap} ไปอีกข้าง ได้ ${perimeter - 2 * gap}`,
          en: `Move the ${2 * gap} across: ${perimeter - 2 * gap}.`,
        },
      ),
      ineqStep(`x = ${answer}`, "ineq.integer-solutions", {
        th: `หารด้วย 4 ได้ ${(perimeter - 2 * gap) / 4} ความกว้างที่เป็นจำนวนเต็มมากที่สุดจึงเป็น ${answer}`,
        en: `Dividing by 4 gives ${(perimeter - 2 * gap) / 4}, so the greatest whole-number width is ${answer}.`,
      }),
    ],
    misconceptions: namedMistakes({ kind: "exact", value: String(answer) }, [
      {
        answer: { kind: "exact", value: String(answer + gap) },
        explain: {
          th: `${answer + gap} คือความยาว โจทย์ถามความกว้าง ซึ่งน้อยกว่าอยู่ ${gap} เมตร`,
          en: `${answer + gap} is the length; the question asks for the width, which is ${gap} metres less.`,
        },
      },
    ]),
    hints: [
      {
        th: "ตั้งความกว้างเป็น x แล้วเขียนความยาวรอบรูปในรูปของ x",
        en: "Let the width be x and write the perimeter in terms of x.",
      },
      {
        th: `ไม่เกิน แปลว่า \\leq จึงได้ ${linearExpr(4, 2 * gap)} \\leq ${perimeter}`,
        en: `At most means \\leq, giving ${linearExpr(4, 2 * gap)} \\leq ${perimeter}.`,
      },
      {
        th: "หารด้วย 4 แล้วปัดลง เพราะโจทย์ขอจำนวนเต็ม",
        en: "Divide by 4 and round down, because the answer has to be whole.",
      },
    ],
  };
}

export const ineqLinearWord: Generator = {
  id: "ineq.linear.word",
  skillId: "ineq.linear.word",
  difficulties: [1, 2, 3, 4],
  provenance: "adapted",
  sourceNote:
    "Shapes: a budget, a fare with a fixed start, an average with a floor, and a perimeter with a ceiling - the four ม.3 textbook archetypes.",

  generate(rng, difficulty): Question {
    const shape = build(rng, difficulty);
    return {
      id: `${ineqLinearWord.id}:${rng.seed}:${difficulty}`,
      generatorId: ineqLinearWord.id,
      skillId: ineqLinearWord.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "adapted",
      prompt: shape.prompt,
      stem: shape.stem,
      // An extreme value of a solution set, not a root.
      machineStem: null,
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
