import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "c1.applications";

/**
 * โจทย์หาค่าเหมาะที่สุด และอัตราการเปลี่ยนแปลงที่สัมพันธ์กัน · Calculus I.
 *
 * The two chapters of applied calculus that are word problems all the way
 * down. Both are built backwards from an answer that is a whole number, so a
 * learner is never fighting the arithmetic while learning the method.
 *
 * ## Why these say `machineStem: null` and mean it
 *
 * A word problem's stem is a situation, and the model it sets up is what the
 * working is about. `c1-applications.test.ts` rebuilds the model from the
 * numbers in the prompt and checks the answer against it - so the check is on
 * the modelling, which is the part that can actually be wrong.
 */

export const c1Optimisation: Generator = {
  id: "c1.optimisation",
  skillId: "c1.optimisation",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty >= 3) return boxOrSum(rng, difficulty);

    /*
     * A rectangle with a fixed perimeter, or one against a wall. Both are the
     * same quadratic in disguise, and both have a whole-number answer because
     * the perimeter is chosen to make one.
     */
    const againstWall = difficulty === 2;
    const half = rng.int(4, 20);
    const perimeter = againstWall ? 4 * half : 4 * half;

    /*
     * Free-standing: `2x + 2y = P`, area `x(P/2 - x)`, largest at `x = P/4`.
     * Against a wall: `2x + y = P`, area `x(P - 2x)`, largest at `x = P/4`
     * with the other side twice that.
     */
    const width = againstWall ? perimeter / 4 : perimeter / 4;
    const other = againstWall ? perimeter - 2 * width : perimeter / 2 - width;
    const area = width * other;

    const model = againstWall
      ? `A(x) = x(${perimeter} - 2x)`
      : `A(x) = x\\left(${perimeter / 2} - x\\right)`;
    const derivative = againstWall
      ? `A'(x) = ${perimeter} - 4x`
      : `A'(x) = ${perimeter / 2} - 2x`;

    const steps: Step[] = [
      makeStep(
        model,
        "model.equation",
        {
          th: againstWall
            ? `ด้านที่ขนานกำแพงคือ ${perimeter} - 2x เมื่อ x คือด้านที่ตั้งฉากกับกำแพง`
            : `ถ้าด้านหนึ่งยาว x อีกด้านยาว ${perimeter / 2} - x เพราะครึ่งหนึ่งของเส้นรอบรูปคือผลบวกของสองด้าน`,
          en: againstWall
            ? `With x the side perpendicular to the wall, the parallel side is ${perimeter} - 2x.`
            : `If one side is x the other is ${perimeter / 2} - x, since half the perimeter is the two of them together.`,
        },
        { math: null },
      ),
      makeStep(
        `${derivative} = 0 \\Rightarrow x = ${width}`,
        "calc.critical-point",
        {
          th: "พื้นที่มากที่สุดเมื่ออนุพันธ์เป็นศูนย์",
          en: "The area is largest where its derivative is zero.",
        },
        { math: null },
      ),
      makeStep(
        `A = ${width} \\times ${other} = ${area}`,
        "c1.second-derivative",
        {
          th: "อนุพันธ์อันดับสองเป็นลบ จึงเป็นค่าสูงสุดจริง แล้วคิดพื้นที่ออกมา",
          en: "The second derivative is negative, so it really is a maximum. Then work the area out.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: String(area) };

    return {
      ...shell(c1Optimisation, rng, difficulty),
      prompt: againstWall
        ? {
            th: `ต้องการล้อมคอกสี่เหลี่ยมผืนผ้าโดยใช้กำแพงเป็นด้านหนึ่ง และมีรั้วยาว ${perimeter} เมตรสำหรับอีกสามด้าน จงหาพื้นที่มากที่สุดที่ล้อมได้ เป็นตารางเมตร`,
            en: `A rectangular pen uses a wall as one side, with ${perimeter} metres of fence for the other three. Find the largest area it can enclose, in square metres`,
          }
        : {
            th: `สี่เหลี่ยมผืนผ้ารูปหนึ่งมีเส้นรอบรูป ${perimeter} เมตร จงหาพื้นที่มากที่สุดที่เป็นไปได้ เป็นตารางเมตร`,
            en: `A rectangle has a perimeter of ${perimeter} metres. Find the largest possible area, in square metres`,
          },
      stem: againstWall
        ? `2x + y = ${perimeter}, \\quad A = xy`
        : `2x + 2y = ${perimeter}, \\quad A = xy`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "เขียนพื้นที่ให้เป็นฟังก์ชันของตัวแปรตัวเดียวก่อน",
          en: "Write the area as a function of one variable first.",
        },
        {
          th: "ใช้เงื่อนไขเรื่องรั้วเพื่อกำจัดตัวแปรอีกตัว",
          en: "Use the fencing condition to get rid of the other variable.",
        },
        {
          th: "แล้วหาจุดที่อนุพันธ์เป็นศูนย์",
          en: "Then find where the derivative is zero.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: String(width) },
          explain: {
            th: "นั่นคือความยาวด้าน โจทย์ถามพื้นที่",
            en: "That is a side length; the question asks for the area.",
          },
        },
        {
          answer: {
            kind: "exact",
            value: String((perimeter / 4) * (perimeter / 4)),
          },
          explain: {
            th: againstWall
              ? "สมมติว่าเป็นสี่เหลี่ยมจัตุรัส ซึ่งไม่ใช่รูปที่ให้พื้นที่มากที่สุดเมื่อมีกำแพงช่วยด้านหนึ่ง"
              : "คิดด้านทั้งสองยาวเท่ากับหนึ่งในสี่ของเส้นรอบรูป ซึ่งถูกเฉพาะรูปจัตุรัส",
            en: againstWall
              ? "That assumes a square, which is not the best shape when a wall is doing one side for free."
              : "That uses a quarter of the perimeter for both sides, which is only the square case.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/** Difficulties 3 and 4: an open box, and two numbers with a fixed sum. */
function boxOrSum(rng: RNG, difficulty: number): Question {
  if (difficulty === 4) {
    /*
     * Two positive numbers adding to S, with the smallest possible sum of
     * squares. The answer is at S/2 for both - which is worth meeting,
     * because the intuition that "spread them out" is exactly backwards.
     */
    const total = rng.int(4, 30) * 2;
    const half = total / 2;
    const best = 2 * half * half;

    const steps: Step[] = [
      makeStep(
        `S(x) = x^2 + \\left(${total} - x\\right)^2`,
        "model.equation",
        {
          th: `ถ้าจำนวนหนึ่งเป็น x อีกจำนวนคือ ${total} - x`,
          en: `If one number is x the other is ${total} - x.`,
        },
        { math: null },
      ),
      makeStep(
        `S'(x) = 2x - 2\\left(${total} - x\\right) = 0`,
        "calc.critical-point",
        {
          th: "ให้อนุพันธ์เป็นศูนย์",
          en: "Set the derivative to zero.",
        },
        { math: null },
      ),
      makeStep(
        `x = ${half}, \\quad S = ${best}`,
        "c1.second-derivative",
        {
          th: "อนุพันธ์อันดับสองเป็นบวก จึงเป็นค่าต่ำสุดจริง",
          en: "The second derivative is positive, so it really is a minimum.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: String(best) };

    return {
      ...shell(c1Optimisation, rng, difficulty),
      prompt: {
        th: `จำนวนจริงบวกสองจำนวนบวกกันได้ ${total} จงหาค่าที่น้อยที่สุดที่เป็นไปได้ของผลบวกของกำลังสองของทั้งสองจำนวน`,
        en: `Two positive numbers add to ${total}. Find the smallest possible value of the sum of their squares`,
      },
      stem: `x + y = ${total}, \\quad S = x^2 + y^2`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "เขียนผลบวกของกำลังสองให้เป็นฟังก์ชันของตัวแปรตัวเดียว",
          en: "Write the sum of squares as a function of one variable.",
        },
        {
          th: "แล้วหาจุดที่อนุพันธ์เป็นศูนย์",
          en: "Then find where its derivative is zero.",
        },
        {
          th: "คำตอบอยู่ที่ทั้งสองจำนวนเท่ากันพอดี ซึ่งอาจจะขัดกับความรู้สึกแรก",
          en: "The answer has the two numbers equal, which is not most people's first guess.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: String(half) },
          explain: {
            th: "นั่นคือค่าของจำนวนแต่ละตัว โจทย์ถามผลบวกของกำลังสอง",
            en: "That is each number; the question asks for the sum of their squares.",
          },
        },
        {
          answer: { kind: "exact", value: String(total * total) },
          explain: {
            th: "นั่นคือกำลังสองของผลบวก ไม่ใช่ผลบวกของกำลังสอง สองอย่างนี้ต่างกัน",
            en: "That is the square of the sum, not the sum of the squares - a different thing.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  }

  /*
   * Difficulty 3: a box with a square base and a fixed volume, using as little
   * material as possible. Both variants are built backwards from a whole-number
   * answer:
   *
   *   open  A = x^2 + 4V/x, so A' = 0 at x^3 = 2V. Take V = 4c^3 and x = 2c.
   *   closed A = 2x^2 + 4V/x, so A' = 0 at x^3 = V. Take V = c^3 and x = c -
   *          a cube, which is the answer everyone guesses and is right here.
   */
  const open = rng.bool();
  const c = rng.int(1, 9);
  const volume = open ? 4 * c ** 3 : c ** 3;
  const base = open ? 2 * c : c;
  const height = volume / (base * base);
  const material = (open ? 1 : 2) * base * base + 4 * base * height;
  const faces = open ? "x^2" : "2x^2";
  const outerCoefficient = open ? 2 : 4;

  const steps: Step[] = [
    makeStep(
      `A(x) = ${faces} + \\frac{${4 * volume}}{x}`,
      "model.equation",
      {
        th: `ความสูงคือ ${volume} หารด้วย x กำลังสอง พื้นที่ผิวจึงเป็นฟังก์ชันของ x ตัวเดียว`,
        en: `The height is ${volume} over x squared, which makes the surface area a function of x alone.`,
      },
      { math: null },
    ),
    makeStep(
      `A'(x) = ${outerCoefficient}x - \\frac{${4 * volume}}{x^2} = 0`,
      "calc.critical-point",
      {
        th: "ให้อนุพันธ์เป็นศูนย์ แล้วแก้สมการ",
        en: "Set the derivative to zero and solve.",
      },
      { math: null },
    ),
    makeStep(
      `x = ${base}, \\quad A = ${material}`,
      "c1.second-derivative",
      {
        th: `ฐานกว้าง ${base} สูง ${height} ใช้วัสดุน้อยที่สุด`,
        en: `A base of ${base} and a height of ${height} uses the least material.`,
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: String(material) };

  return {
    ...shell(c1Optimisation, rng, difficulty),
    prompt: {
      th: `กล่อง${open ? "เปิดฝา" : "ปิดฝา"}ทรงฐานสี่เหลี่ยมจัตุรัสมีปริมาตร ${volume} ลูกบาศก์หน่วย จงหาพื้นที่ผิวที่น้อยที่สุด เป็นตารางหน่วย`,
      en: `${open ? "An open-topped" : "A closed"} box with a square base has volume ${volume} cubic units. Find its smallest possible surface area, in square units`,
    },
    stem: `x^2h = ${volume}, \\quad A = ${faces} + 4xh`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "ใช้ปริมาตรเพื่อเขียนความสูงในรูปของ x",
        en: "Use the volume to write the height in terms of x.",
      },
      {
        th: open
          ? "กล่องเปิดฝา จึงมีฐานหนึ่งหน้ากับด้านข้างสี่หน้า"
          : "กล่องปิดฝา จึงมีฐานกับฝาอย่างละหน้า และด้านข้างสี่หน้า",
        en: open
          ? "The box is open on top, so it is one base and four sides."
          : "The box is closed, so it is a base, a lid and four sides.",
      },
      {
        th: "แล้วหาจุดที่อนุพันธ์ของพื้นที่ผิวเป็นศูนย์",
        en: "Then find where the surface area's derivative is zero.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: String(base) },
        explain: {
          th: "นั่นคือความกว้างของฐาน โจทย์ถามพื้นที่ผิว",
          en: "That is the base width; the question asks for the surface area.",
        },
      },
      {
        answer: {
          kind: "exact",
          value: String((open ? 2 : 1) * base * base + 4 * base * height),
        },
        explain: {
          th: open
            ? "นับฝาบนด้วย แต่กล่องนี้เปิดฝา"
            : "ลืมนับฝาบน กล่องนี้ปิดฝา จึงมีหน้าสี่เหลี่ยมจัตุรัสสองหน้า",
          en: open
            ? "That counts a lid, and this box has none."
            : "That leaves the lid out, and this box has one - two square faces, not one.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

export const c1RelatedRates: Generator = {
  id: "c1.related-rates",
  skillId: "c1.related-rates",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const rate = rng.int(2, 9);

    if (difficulty === 1) {
      /*
       * A square whose side grows: `A = x^2`, so `dA/dt = 2x dx/dt`. The
       * simplest possible related rate, and the one that shows the answer
       * depends on the *current size* rather than being a constant.
       */
      const side = rng.int(3, 20);
      const answerValue = 2 * side * rate;

      const steps: Step[] = [
        makeStep(
          `A = x^2 \\Rightarrow \\frac{dA}{dt} = 2x\\frac{dx}{dt}`,
          "c1.related-rates",
          {
            th: "ดิฟสมการพื้นที่เทียบกับเวลา ได้กฎลูกโซ่ออกมา",
            en: "Differentiate the area equation with respect to time, which is the chain rule.",
          },
          { math: null },
        ),
        makeStep(
          `\\frac{dA}{dt} = 2(${side})(${rate}) = ${answerValue}`,
          "c1.related-rates",
          {
            th: `แทนค่าที่ขณะนั้น ด้านยาว ${side} และขยายด้วยอัตรา ${rate}`,
            en: `Put in the values at that instant: a side of ${side} growing at ${rate}.`,
          },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: String(answerValue) };

      return {
        ...shell(c1RelatedRates, rng, difficulty),
        prompt: {
          th: `ด้านของรูปสี่เหลี่ยมจัตุรัสยาวขึ้นด้วยอัตรา ${rate} เซนติเมตรต่อวินาที ขณะที่ด้านยาว ${side} เซนติเมตร พื้นที่กำลังเพิ่มขึ้นด้วยอัตราเท่าใด เป็นตารางเซนติเมตรต่อวินาที`,
          en: `A square's side grows at ${rate} cm per second. When the side is ${side} cm, how fast is the area growing, in square cm per second?`,
        },
        stem: `A = x^2, \\quad \\frac{dx}{dt} = ${rate}, \\quad x = ${side}`,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "ดิฟสมการที่เชื่อมสองปริมาณเข้าด้วยกัน เทียบกับเวลา",
            en: "Differentiate the equation linking the two quantities with respect to time.",
          },
          {
            th: "อนุพันธ์ของ x กำลังสองเทียบกับเวลาคือ 2x คูณ dx/dt",
            en: "x squared differentiates with respect to time to 2x times dx/dt.",
          },
          {
            th: "แล้วจึงแทนค่าที่ขณะนั้น",
            en: "Only then put in the values for that instant.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: { kind: "exact", value: String(rate * rate) },
            explain: {
              th: "ยกกำลังสองอัตราการเปลี่ยนแปลง ซึ่งไม่ใช่สิ่งที่กฎลูกโซ่บอก",
              en: "That squares the rate, which is not what the chain rule says.",
            },
          },
          {
            answer: { kind: "exact", value: String(2 * side) },
            explain: {
              th: "ลืมคูณด้วยอัตราการเปลี่ยนแปลงของด้าน",
              en: "The side's own rate was never multiplied in.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    if (difficulty === 2) {
      // A circle's area from its radius.
      const radius = rng.int(2, 15);
      const answerValue = 2 * radius * rate;

      const steps: Step[] = [
        makeStep(
          `A = \\pi r^2 \\Rightarrow \\frac{dA}{dt} = 2\\pi r\\frac{dr}{dt}`,
          "c1.related-rates",
          {
            th: "ดิฟเทียบกับเวลา พาย เป็นค่าคงตัวจึงติดไปด้วย",
            en: "Differentiate with respect to time; pi is a constant and comes along.",
          },
          { math: null },
        ),
        makeStep(
          `\\frac{dA}{dt} = 2\\pi(${radius})(${rate}) = ${answerValue}\\pi`,
          "c1.related-rates",
          {
            th: "แทนค่าที่ขณะนั้น ตอบเป็นจำนวนเท่าของ พาย",
            en: "Put in that instant's values, and leave the answer as a multiple of pi.",
          },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: `${answerValue}*pi` };

      return {
        ...shell(c1RelatedRates, rng, difficulty),
        prompt: {
          th: `รัศมีของวงกลมยาวขึ้นด้วยอัตรา ${rate} เซนติเมตรต่อวินาที ขณะที่รัศมียาว ${radius} เซนติเมตร พื้นที่กำลังเพิ่มขึ้นด้วยอัตราเท่าใด ตอบในรูปที่มี \\pi`,
          en: `A circle's radius grows at ${rate} cm per second. When the radius is ${radius} cm, how fast is the area growing? Leave pi in the answer`,
        },
        stem: `A = \\pi r^2, \\quad \\frac{dr}{dt} = ${rate}, \\quad r = ${radius}`,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "สูตรพื้นที่วงกลมคือ พาย r กำลังสอง",
            en: "The area of a circle is pi r squared.",
          },
          {
            th: "ดิฟเทียบกับเวลา จะได้ 2 พาย r คูณ dr/dt",
            en: "Differentiating with respect to time gives two pi r times dr/dt.",
          },
          {
            th: "อย่าคูณ พาย ออกเป็นทศนิยม ตอบเป็นจำนวนเท่าของ พาย",
            en: "Do not turn pi into a decimal; leave the answer as a multiple of it.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: { kind: "exact", value: `${radius * radius}*pi` },
            explain: {
              th: "นั่นคือพื้นที่ ไม่ใช่อัตราการเปลี่ยนแปลงของพื้นที่",
              en: "That is the area itself, not the rate at which it is changing.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    if (difficulty === 3) {
      // A sphere's volume from its radius.
      const radius = rng.int(2, 10);
      const answerValue = 4 * radius * radius * rate;

      const steps: Step[] = [
        makeStep(
          `V = \\frac{4}{3}\\pi r^3 \\Rightarrow \\frac{dV}{dt} = 4\\pi r^2\\frac{dr}{dt}`,
          "c1.related-rates",
          {
            th: "ดิฟเทียบกับเวลา เศษสี่ส่วนสามคูณสามได้สี่",
            en: "Differentiate with respect to time: the four thirds times three is four.",
          },
          { math: null },
        ),
        makeStep(
          `\\frac{dV}{dt} = 4\\pi(${radius})^2(${rate}) = ${answerValue}\\pi`,
          "c1.related-rates",
          {
            th: "แทนค่าที่ขณะนั้น",
            en: "Put in that instant's values.",
          },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: `${answerValue}*pi` };

      return {
        ...shell(c1RelatedRates, rng, difficulty),
        prompt: {
          th: `ลูกโป่งทรงกลมถูกเป่าจนรัศมียาวขึ้นด้วยอัตรา ${rate} เซนติเมตรต่อวินาที ขณะที่รัศมียาว ${radius} เซนติเมตร ปริมาตรกำลังเพิ่มขึ้นด้วยอัตราเท่าใด ตอบในรูปที่มี \\pi`,
          en: `A spherical balloon is inflated so its radius grows at ${rate} cm per second. When the radius is ${radius} cm, how fast is the volume growing? Leave pi in the answer`,
        },
        stem: `V = \\frac{4}{3}\\pi r^3, \\quad \\frac{dr}{dt} = ${rate}, \\quad r = ${radius}`,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "ดิฟสูตรปริมาตรทรงกลมเทียบกับเวลา",
            en: "Differentiate the sphere's volume with respect to time.",
          },
          {
            th: "จะได้ 4 พาย r กำลังสอง คูณ dr/dt ซึ่งคือพื้นที่ผิวคูณอัตรา",
            en: "That gives four pi r squared times dr/dt, which is the surface area times the rate.",
          },
          {
            th: "แล้วแทนค่าที่ขณะนั้น",
            en: "Then put in that instant's values.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: {
              kind: "exact",
              value: `${(4 * radius ** 3) / 3}*pi`,
            },
            explain: {
              th: "นั่นคือปริมาตร ไม่ใช่อัตราการเปลี่ยนแปลงของปริมาตร",
              en: "That is the volume, not how fast it is changing.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    /*
     * Difficulty 4: a ladder sliding down a wall - the related rate everybody
     * meets, and the one where the answer is negative because one length is
     * shrinking while the other grows.
     */
    const [a, b, hypotenuse] = rng.pick([
      [3, 4, 5],
      [6, 8, 10],
      [5, 12, 13],
      [9, 12, 15],
      [8, 15, 17],
    ]) as [number, number, number];

    /*
     * Its own rate, slower than the one the other three difficulties share.
     * Those are balloons and spreading circles, where 2-9 units a second is
     * ordinary; this one is a physical ladder, and "pulled away from the wall
     * at 9 metres per second" is thirty kilometres an hour. The mathematics
     * did not care and the gate could not see it, but a learner reading the
     * sentence does. Five triangles times three rates clears the variety
     * floor on its own.
     */
    const ladderRate = rng.int(1, 3);

    const answerValue = -(a * ladderRate) / b;
    const answerMath = Number.isInteger(answerValue)
      ? String(answerValue)
      : `${-a * ladderRate}/${b}`;

    const steps: Step[] = [
      makeStep(
        `x^2 + y^2 = ${hypotenuse}^2 \\Rightarrow 2x\\frac{dx}{dt} + 2y\\frac{dy}{dt} = 0`,
        "c1.implicit",
        {
          th: "ความยาวบันไดคงที่ ดิฟทั้งสมการเทียบกับเวลาจึงได้ศูนย์ทางขวา",
          en: "The ladder's length never changes, so differentiating the whole equation gives zero on the right.",
        },
        { math: null },
      ),
      makeStep(
        `\\frac{dy}{dt} = -\\frac{x}{y}\\frac{dx}{dt} = -\\frac{${a}}{${b}}(${ladderRate})`,
        "c1.related-rates",
        {
          th: "แก้หา dy/dt แล้วแทนค่าที่ขณะนั้น",
          en: "Solve for dy/dt and put in that instant's values.",
        },
        { math: null },
      ),
      makeStep(
        `\\frac{dy}{dt} = ${answerValue}`,
        "c1.related-rates",
        {
          th: "ค่าติดลบ เพราะปลายบันไดกำลังเลื่อนลง",
          en: "Negative, because the top of the ladder is sliding down.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: answerMath };

    return {
      ...shell(c1RelatedRates, rng, difficulty),
      prompt: {
        th: `บันไดยาว ${hypotenuse} เมตรพิงกำแพงอยู่ ปลายล่างถูกดึงออกจากกำแพงด้วยอัตรา ${ladderRate} เมตรต่อวินาที ขณะที่ปลายล่างห่างกำแพง ${a} เมตร ปลายบนกำลังเลื่อนด้วยอัตราเท่าใด ตอบเป็นเมตรต่อวินาที`,
        en: `A ${hypotenuse} metre ladder leans against a wall. Its foot is pulled away at ${ladderRate} metres per second. When the foot is ${a} metres from the wall, how fast is the top moving, in metres per second?`,
      },
      stem: `x^2 + y^2 = ${hypotenuse}^2, \\quad \\frac{dx}{dt} = ${ladderRate}, \\quad x = ${a}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "บันไดกับกำแพงและพื้นเป็นสามเหลี่ยมมุมฉาก ความยาวบันไดคงที่",
          en: "The ladder, wall and floor make a right-angled triangle, and the ladder never changes length.",
        },
        {
          th: `ที่ขณะนั้นปลายบนสูง ${b} เมตร จากพีทาโกรัส`,
          en: `At that instant the top is ${b} metres up, by Pythagoras.`,
        },
        {
          th: "คำตอบต้องติดลบ เพราะปลายบนกำลังลดระดับลง",
          en: "The answer has to be negative: the top is going down.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: String(-answerValue) },
          explain: {
            th: "ขนาดถูก แต่เครื่องหมายผิด ปลายบนเลื่อนลง อัตราจึงติดลบ",
            en: "Right size, wrong sign: the top is sliding down, so the rate is negative.",
          },
        },
        {
          answer: { kind: "exact", value: String(rate) },
          explain: {
            th: "สองปลายไม่ได้เคลื่อนที่ด้วยอัตราเดียวกัน ยกเว้นตอนที่มันสูงเท่ากันพอดี",
            en: "The two ends do not move at the same rate, except at the one instant when the two sides are equal.",
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

