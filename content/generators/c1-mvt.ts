import { coefficient, fraction, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "c1.mvt";

/**
 * ทฤษฎีบทค่าเฉลี่ย · Calculus I.
 *
 * Both theorems say a point exists; these questions ask for it, which is what
 * an exam can ask. The functions are quadratics and cubics chosen so that the
 * point comes out exactly - not because the theorem needs that, but because a
 * learner meeting the idea should not be fighting a decimal at the same time.
 *
 * For a quadratic the mean value point is always the midpoint of the interval,
 * which is worth noticing and is *not* true in general - difficulty 3 uses a
 * cubic precisely so that the pattern breaks.
 */

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

function valueAt(poly: Poly, x: number): number {
  return poly.reduce((total, value, exponent) => total + value * x ** exponent, 0);
}

export const c1Rolle: Generator = {
  id: "c1.rolle",
  skillId: "c1.rolle",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    /*
     * A parabola through two chosen points at the same height. Its vertex -
     * the flat point Rolle's theorem promises - is halfway between them.
     */
    const a = rng.int(-6, 3);
    const b = a + rng.int(2, 7) * 2;
    const lead = rng.pick([1, 2, -1, -2]);
    const lift = difficulty >= 2 ? rng.int(-8, 8) : 0;

    // lead(x - a)(x - b) + lift, expanded.
    const poly: Poly = [lead * a * b + lift, -lead * (a + b), lead];
    const middle = (a + b) / 2;

    /*
     * At 3 and 4 the question asks for the height of that flat point rather
     * than its position, which needs the original function back - the same
     * "where" against "how much" distinction as the extrema chapter.
     */
    const asksValue = difficulty >= 3;
    const answerValue = asksValue ? valueAt(poly, middle) : middle;

    const steps: Step[] = [
      makeStep(
        `f(${a}) = f(${b}) = ${lift}`,
        "c1.rolle",
        {
          th: "ปลายทั้งสองของช่วงมีค่าเท่ากัน เงื่อนไขของทฤษฎีบทของโรลจึงครบ",
          en: "Both ends are at the same height, so Rolle's theorem applies.",
        },
        { math: null },
      ),
      makeStep(
        `f'(x) = ${printPoly([poly[1]!, 2 * poly[2]!])} = 0`,
        "calc.critical-point",
        {
          th: "ทฤษฎีบทรับประกันว่ามีจุดที่ความชันเป็นศูนย์ หาได้จากอนุพันธ์",
          en: "The theorem promises a flat point; the derivative finds it.",
        },
        { math: null },
      ),
      makeStep(
        asksValue ? `f(${middle}) = ${answerValue}` : `c = ${middle}`,
        "c1.rolle",
        {
          th: asksValue
            ? "แล้วแทนกลับลงในฟังก์ชันเดิม"
            : "ซึ่งอยู่ตรงกลางระหว่างปลายทั้งสองพอดี สำหรับพาราโบลา",
          en: asksValue
            ? "Then back into the original function."
            : "For a parabola that is exactly halfway between the ends.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: String(answerValue) };

    return {
      ...shell(c1Rolle, rng, difficulty),
      prompt: asksValue
        ? {
            th: `ฟังก์ชันนี้มี f(${a}) = f(${b}) ตามทฤษฎีบทของโรลจึงมีจุด c ในช่วง (${a}, ${b}) ที่ f'(c) = 0 จงหาค่าของ f(c)`,
            en: `This function has f(${a}) = f(${b}), so Rolle's theorem gives a c in (${a}, ${b}) with f'(c) = 0. Find f(c)`,
          }
        : {
            th: `ฟังก์ชันนี้มี f(${a}) = f(${b}) จงหาค่า c ในช่วง (${a}, ${b}) ที่ทำให้ f'(c) = 0`,
            en: `This function has f(${a}) = f(${b}). Find the c in (${a}, ${b}) with f'(c) = 0`,
          },
      stem: `f(x) = ${printPoly(poly)}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ทฤษฎีบทบอกว่ามีจุดนั้นอยู่ แต่ไม่ได้บอกว่าอยู่ตรงไหน ต้องหาเอง",
          en: "The theorem says the point is there; finding it is still your job.",
        },
        {
          th: "หาอนุพันธ์แล้วให้เท่ากับศูนย์",
          en: "Differentiate and set it equal to zero.",
        },
        {
          th: asksValue
            ? "แล้วแทนค่ากลับลงในฟังก์ชันเดิม ไม่ใช่ในอนุพันธ์"
            : "สำหรับพาราโบลา คำตอบอยู่ตรงกลางระหว่างปลายทั้งสองเสมอ",
          en: asksValue
            ? "Then put it back into the original function, not into the derivative."
            : "For a parabola the answer is always the midpoint of the interval.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: asksValue ? String(middle) : String(valueAt(poly, middle)),
          },
          explain: {
            th: asksValue
              ? "นั่นคือตำแหน่ง c โจทย์ถามค่าของ f ที่จุดนั้น"
              : "นั่นคือค่าของฟังก์ชันที่จุดนั้น โจทย์ถามตำแหน่ง",
            en: asksValue
              ? "That is where c is; the question asks what f is there."
              : "That is the height there; the question asks where.",
          },
        },
        {
          answer: { kind: "exact", value: asksValue ? String(lift) : String(a) },
          explain: {
            th: asksValue
              ? "นั่นคือค่าที่ปลายช่วง ซึ่งเป็นค่าที่ทั้งสองปลายเท่ากัน ไม่ใช่ค่าที่จุดวิกฤต"
              : "นั่นคือปลายช่วง ซึ่งความชันตรงนั้นไม่ได้เป็นศูนย์",
            en: asksValue
              ? "That is the shared value at the two ends, not the value at the flat point."
              : "That is an endpoint, where the slope is not zero at all.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

export const c1MeanValue: Generator = {
  id: "c1.mean-value",
  skillId: "c1.mean-value",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty >= 3) return cubicOrJourney(rng, difficulty);

    /*
     * A quadratic on an interval. The mean value point is the midpoint, every
     * time - which is a fact about quadratics rather than about the theorem,
     * and difficulty 3 exists to say so.
     */
    const lead = rng.pick([1, 2, 3, -1, -2]);
    const linear = rng.int(-6, 6);
    const constant = rng.int(-8, 8);
    const poly: Poly = [constant, linear, lead];

    const a = rng.int(-5, 2);
    const b = a + rng.int(2, 6) * 2;
    const middle = (a + b) / 2;
    const averageSlope = (valueAt(poly, b) - valueAt(poly, a)) / (b - a);

    const steps: Step[] = [
      makeStep(
        `\\frac{f(${b}) - f(${a})}{${b} - ${a}} = \\frac{${valueAt(poly, b)} - (${valueAt(poly, a)})}{${b - a}} = ${averageSlope}`,
        "c1.mean-value",
        {
          th: "หาความชันของคอร์ดก่อน คือผลต่างของค่าฟังก์ชันหารด้วยความกว้างของช่วง",
          en: "The chord's slope first: the change in the function over the width of the interval.",
        },
        { math: null },
      ),
      makeStep(
        `f'(x) = ${printPoly([linear, 2 * lead])} = ${averageSlope}`,
        "calc.tangent-slope",
        {
          th: "แล้วหาจุดที่ความชันของเส้นสัมผัสเท่ากับค่านั้น",
          en: "Then find where the tangent has that same slope.",
        },
        { math: null },
      ),
      makeStep(
        `c = ${middle}`,
        "c1.mean-value",
        {
          th: "สำหรับพาราโบลา จุดนี้อยู่ตรงกลางช่วงพอดีเสมอ",
          en: "For a parabola this always lands at the midpoint of the interval.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: String(middle) };

    return {
      ...shell(c1MeanValue, rng, difficulty),
      prompt: {
        th: `จงหาค่า c ในช่วง (${a}, ${b}) ที่ทฤษฎีบทค่าเฉลี่ยรับประกันไว้ สำหรับฟังก์ชันนี้`,
        en: `Find the c in (${a}, ${b}) that the mean value theorem promises for this function`,
      },
      stem: `f(x) = ${printPoly(poly)}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "หาความชันของคอร์ดที่เชื่อมปลายทั้งสองก่อน",
          en: "Start with the slope of the chord joining the two ends.",
        },
        {
          th: `ความชันนั้นคือ ${averageSlope}`,
          en: `That slope is ${averageSlope}.`,
        },
        {
          th: "แล้วแก้สมการ f'(x) เท่ากับค่านั้น",
          en: "Then solve f'(x) equals that.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: String(averageSlope) },
          explain: {
            th: "นั่นคือความชันเฉลี่ย ไม่ใช่ตำแหน่งที่ความชันนั้นเกิดขึ้น",
            en: "That is the average slope, not the place where it happens.",
          },
        },
        {
          answer: { kind: "exact", value: fraction(b - a, 1) },
          explain: {
            th: "นั่นคือความกว้างของช่วง โจทย์ถามตำแหน่ง c ในช่วงนั้น",
            en: "That is the width of the interval; the question asks for a point inside it.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/**
 * Difficulty 3: a cubic, where the mean value point is *not* the midpoint.
 * Difficulty 4: the journey the theorem is usually explained with.
 */
function cubicOrJourney(rng: RNG, difficulty: number): Question {
  if (difficulty === 4) {
    /*
     * A journey whose distance is `t^2` scaled: average speed over `[0, T]` is
     * `kT`, and the instantaneous speed `2kt` matches it at `t = T/2`. The
     * theorem's own example, with numbers.
     */
    const k = rng.int(2, 9);
    const total = rng.int(2, 8) * 2;
    const half = total / 2;
    const distance = k * total * total;
    const average = distance / total;

    const steps: Step[] = [
      makeStep(
        `\\text{average} = \\frac{${distance}}{${total}} = ${average}`,
        "c1.mean-value",
        {
          th: "อัตราเร็วเฉลี่ยคือระยะทางทั้งหมดหารด้วยเวลาทั้งหมด",
          en: "Average speed is the whole distance over the whole time.",
        },
        { math: null },
      ),
      makeStep(
        `s'(t) = ${2 * k}t = ${average}`,
        "calc.tangent-slope",
        {
          th: "อัตราเร็วขณะหนึ่งคืออนุพันธ์ของระยะทางเทียบกับเวลา",
          en: "The instantaneous speed is the derivative of distance with respect to time.",
        },
        { math: null },
      ),
      makeStep(
        `t = ${half}`,
        "c1.mean-value",
        {
          th: "ทฤษฎีบทรับประกันว่าต้องมีขณะนี้ และนี่คือขณะนั้น",
          en: "The theorem promised such an instant, and this is it.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: String(half) };

    return {
      ...shell(c1MeanValue, rng, difficulty),
      prompt: {
        th: `รถคันหนึ่งเคลื่อนที่โดยระยะทางหลังเวลา t วินาทีเป็น ${k}t^2 เมตร ในช่วง ${total} วินาทีแรก จงหาเวลา t ที่อัตราเร็วขณะนั้นเท่ากับอัตราเร็วเฉลี่ยตลอดช่วงพอดี`,
        en: `A car's distance after t seconds is ${k}t^2 metres. Over the first ${total} seconds, find the time t at which its instantaneous speed equals its average speed`,
      },
      stem: `s(t) = ${k}t^2, \\quad 0 \\le t \\le ${total}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "อัตราเร็วเฉลี่ยคือระยะทางทั้งหมดหารด้วยเวลาทั้งหมด",
          en: "Average speed is total distance over total time.",
        },
        {
          th: "อัตราเร็วขณะหนึ่งคืออนุพันธ์",
          en: "Instantaneous speed is the derivative.",
        },
        {
          th: "ทฤษฎีบทค่าเฉลี่ยบอกว่าสองอย่างนี้ต้องเท่ากันที่สักขณะหนึ่ง",
          en: "The theorem says the two must agree at some instant.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: String(average) },
          explain: {
            th: "นั่นคืออัตราเร็วเฉลี่ย โจทย์ถามเวลาที่อัตราเร็วขณะนั้นเท่ากับค่านี้",
            en: "That is the average speed; the question asks when it happens.",
          },
        },
        {
          answer: { kind: "exact", value: String(total) },
          explain: {
            th: "นั่นคือเวลาทั้งหมด ซึ่งเป็นปลายช่วง ทฤษฎีบทรับประกันจุดภายในช่วง",
            en: "That is the end of the interval; the theorem promises a point inside it.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  }

  /*
   * A cubic `x^3` shifted, on a symmetric interval `[-w, w]`. The chord's
   * slope is `w^2`, and `3c^2 = w^2` gives `c = w/sqrt(3)` - irrational, which
   * is the honest answer and the point of the difficulty. So the interval is
   * chosen to make `w^2/3` a perfect square instead: `w = 3m` gives `c = m√3`.
   */
  const m = rng.int(1, 4);
  const width = 3 * m;
  const shift = rng.int(-6, 8);
  const poly: Poly = [shift, 0, 0, 1];

  const averageSlope = width * width;
  const answerMath = `${m}*sqrt(3)`;

  const steps: Step[] = [
    makeStep(
      `\\frac{f(${width}) - f(${-width})}{${2 * width}} = \\frac{${2 * width ** 3}}{${2 * width}} = ${averageSlope}`,
      "c1.mean-value",
      {
        th: "ความชันของคอร์ด",
        en: "The chord's slope.",
      },
      { math: null },
    ),
    makeStep(
      `3c^2 = ${averageSlope}`,
      "calc.tangent-slope",
      {
        th: "ให้อนุพันธ์เท่ากับความชันนั้น",
        en: "Set the derivative equal to it.",
      },
      { math: null },
    ),
    makeStep(
      `c = ${m}\\sqrt{3}`,
      "c1.mean-value",
      {
        th: "ได้สองคำตอบ แต่ทฤษฎีบทรับประกันอย่างน้อยหนึ่งจุด และคำตอบบวกคือจุดที่มักถามถึง สังเกตว่าไม่ได้อยู่ตรงกลางช่วงเหมือนพาราโบลา",
        en: "Two solutions, and the theorem promises at least one. Notice it is nowhere near the midpoint this time, unlike a parabola.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: answerMath };

  return {
    ...shell(c1MeanValue, rng, difficulty),
    prompt: {
      th: `จงหาค่า c ที่เป็นบวกในช่วง (${-width}, ${width}) ที่ทฤษฎีบทค่าเฉลี่ยรับประกันไว้`,
      en: `Find the positive c in (${-width}, ${width}) that the mean value theorem promises`,
    },
    stem: `f(x) = ${printPoly(poly)}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "หาความชันของคอร์ดก่อน ช่วงนี้สมมาตรรอบศูนย์",
        en: "Start with the chord's slope; the interval is symmetric about zero.",
      },
      {
        th: `ได้ความชัน ${averageSlope}`,
        en: `It comes to ${averageSlope}.`,
      },
      {
        th: "แล้วแก้ 3c กำลังสอง เท่ากับค่านั้น คำตอบไม่ได้อยู่ตรงกลางช่วง",
        en: "Then solve three c squared equals that. The answer is not the midpoint.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: "0" },
        explain: {
          th: "จุดกึ่งกลางใช้ได้กับพาราโบลาเท่านั้น ลูกบาศก์ไม่เป็นแบบนั้น",
          en: "The midpoint works for a parabola and not for this.",
        },
      },
      {
        answer: { kind: "exact", value: String(averageSlope) },
        explain: {
          th: "นั่นคือความชันเฉลี่ย ไม่ใช่ตำแหน่งที่มันเกิดขึ้น",
          en: "That is the average slope, not where it occurs.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

export const c1MvtBound: Generator = {
  id: "c1.mvt-bound",
  skillId: "c1.mvt-bound",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const bound = rng.int(2, 9);
    const from = rng.int(-4, 3);
    const width = rng.int(2, 8);
    const to = from + width;
    const start = rng.int(-9, 9);

    /*
     * Difficulty 1 and 2 ask for the largest the function could be; 3 for the
     * smallest; 4 for the largest possible *change*, which is the theorem
     * stated directly. All of them are `M(b - a)` with something done to it.
     */
    const reach = bound * width;
    const asks =
      difficulty === 1 || difficulty === 2
        ? "largest"
        : difficulty === 3
          ? "smallest"
          : "change";

    const answerValue =
      asks === "largest"
        ? start + reach
        : asks === "smallest"
          ? start - reach
          : reach;

    const steps: Step[] = [
      makeStep(
        `|f(${to}) - f(${from})| \\le ${bound} \\times ${width} = ${reach}`,
        "c1.mvt-consequence",
        {
          th: `ทฤษฎีบทค่าเฉลี่ยบอกว่าผลต่างเท่ากับ f'(c) คูณความกว้างของช่วง และ f' ไม่เกิน ${bound}`,
          en: `The theorem says the change is f'(c) times the width, and f' never exceeds ${bound}.`,
        },
        { math: null },
      ),
      makeStep(
        asks === "change"
          ? `${reach}`
          : `f(${to}) ${asks === "largest" ? "\\le" : "\\ge"} ${start} ${asks === "largest" ? "+" : "-"} ${reach} = ${answerValue}`,
        "c1.mvt-consequence",
        {
          th:
            asks === "change"
              ? "ผลต่างมากที่สุดที่เป็นไปได้"
              : `เริ่มจาก ${start} แล้ว${asks === "largest" ? "บวก" : "ลบ"}ผลต่างมากที่สุด`,
          en:
            asks === "change"
              ? "The largest the change can be."
              : `Start at ${start} and ${asks === "largest" ? "add" : "subtract"} the most it can move.`,
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: String(answerValue) };

    return {
      ...shell(c1MvtBound, rng, difficulty),
      prompt:
        asks === "change"
          ? {
              th: `ฟังก์ชัน f หาอนุพันธ์ได้ทุกจุด และ |f'(x)| ไม่เกิน ${bound} เสมอ จงหาค่ามากที่สุดที่เป็นไปได้ของ |f(${to}) - f(${from})|`,
              en: `A differentiable f has |f'(x)| never exceeding ${bound}. Find the largest possible value of |f(${to}) - f(${from})|`,
            }
          : {
              th: `ฟังก์ชัน f หาอนุพันธ์ได้ทุกจุด โดย f(${from}) = ${start} และ |f'(x)| ไม่เกิน ${bound} เสมอ จงหาค่า${asks === "largest" ? "มาก" : "น้อย"}ที่สุดที่เป็นไปได้ของ f(${to})`,
              en: `A differentiable f has f(${from}) = ${start} and |f'(x)| never exceeding ${bound}. Find the ${asks === "largest" ? "largest" : "smallest"} possible value of f(${to})`,
            },
      /*
       * The interval belongs in the stem as well as in the sentence. Without
       * it the stem is a bound and nothing else - eight of them in total - and
       * the numbers being worked with are not where the eye lands.
       */
      stem:
        asks === "change"
          ? `|f'(x)| \\le ${bound} , \\ x \\in [${from}, ${to}]`
          : `f(${from}) = ${start}, \\quad |f'(x)| \\le ${bound} , \\ x \\in [${from}, ${to}]`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ทฤษฎีบทค่าเฉลี่ยบอกว่าผลต่างของค่าฟังก์ชันคือ f'(c) คูณความกว้างของช่วง",
          en: "The theorem says the change in f is f'(c) times the width of the interval.",
        },
        {
          th: `ความกว้างของช่วงคือ ${width}`,
          en: `The interval is ${width} wide.`,
        },
        {
          th: `f' ไม่เกิน ${bound} ผลต่างจึงไม่เกิน ${reach}`,
          en: `With f' no more than ${bound}, the change is no more than ${reach}.`,
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: String(bound) },
          explain: {
            th: "นั่นคือขอบเขตของอนุพันธ์ ยังไม่ได้คูณด้วยความกว้างของช่วง",
            en: "That is the bound on the derivative, not yet multiplied by the width.",
          },
        },
        {
          answer: {
            kind: "exact",
            value: asks === "change" ? String(bound + width) : String(reach),
          },
          explain: {
            th:
              asks === "change"
                ? "บวกแทนที่จะคูณ ทฤษฎีบทให้ f'(c) คูณความกว้าง"
                : "ลืมค่าเริ่มต้น ผลต่างมากที่สุดต้องบวกหรือลบจากค่าที่จุดเริ่ม",
            en:
              asks === "change"
                ? "Added instead of multiplied: the theorem gives f'(c) times the width."
                : "The starting value was left out; the change moves away from it.",
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
