import { coefficient, fraction, reduceFraction, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "c1.ftc";

/**
 * ทฤษฎีบทหลักมูลของแคลคูลัส · Calculus I.
 *
 * Part one is the only skill in the whole app where the *right* method is to
 * do almost nothing: the integral in the stem is never evaluated, because the
 * theorem says the derivative of it is the integrand with the limit put in.
 * A learner who integrates first and differentiates afterwards gets the same
 * answer the long way round, which is worth saying in the lesson rather than
 * treating as a mistake.
 *
 * Everything here is exact: the areas are rational, and the arithmetic is done
 * with fractions rather than decimals so that `\frac{1}{6}` is the answer
 * rather than `0.1666667`.
 */

type Rational = [number, number];

function rational(numerator: number, denominator: number): Rational {
  const [top, bottom] = reduceFraction(numerator, denominator);
  return bottom < 0 ? [-top, -bottom] : [top, bottom];
}

function addRational(left: Rational, right: Rational): Rational {
  return rational(left[0] * right[1] + right[0] * left[1], left[1] * right[1]);
}

const rationalMath = ([top, bottom]: Rational) =>
  bottom === 1 ? String(top) : `${top}/${bottom}`;

/** `[c, b, a]` is `ax^2 + bx + c`. */
type Poly = number[];

function printPoly(poly: Poly, variable = "x"): string {
  return sumTerms(
    poly
      .map((value, exponent) => {
        if (value === 0) return null;
        if (exponent === 0) return String(value);
        return (
          coefficient(
            value,
            exponent === 1 ? variable : `${variable}^${exponent}`,
          ) || null
        );
      })
      .reverse(),
  );
}

function polyMath(poly: Poly, variable = "x"): string {
  return sumTerms(
    poly
      .map((value, exponent) => {
        if (value === 0) return null;
        if (exponent === 0) return String(value);
        const body = exponent === 1 ? variable : `${variable}^${exponent}`;
        return value === 1 ? body : value === -1 ? `-${body}` : `${value}${body}`;
      })
      .reverse(),
  );
}

/** The exact integral of an integer polynomial between two whole numbers. */
function integrate(poly: Poly, from: number, to: number): Rational {
  const at = (x: number) =>
    poly.reduce<Rational>(
      (total, value, exponent) =>
        addRational(total, rational(value * x ** (exponent + 1), exponent + 1)),
      [0, 1],
    );
  const top = at(to);
  const bottom = at(from);
  return addRational(top, [-bottom[0], bottom[1]]);
}

export const c1FtcFirst: Generator = {
  id: "c1.ftc-first",
  skillId: "c1.ftc-first",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const lower = rng.int(-4, 4);
    const a = rng.pick([1, 2, 3, -1, -2]);
    const b = rng.int(-6, 6);
    const power = difficulty === 1 ? 1 : 2;

    const integrand: Poly =
      power === 1 ? [b, a] : [b, 0, a];
    const integrandKatex = printPoly(integrand, "t");

    /*
     * At 3 and 4 the upper limit is not `x` but a function of it, so the chain
     * rule joins in and the answer picks up a factor. That is the whole
     * difference between knowing the theorem and being able to use it.
     */
    const limit =
      difficulty === 3 ? "x^2" : difficulty === 4 ? `${rng.int(2, 5)}x` : "x";
    const limitMultiplier = Number(/^(\d+)x$/.exec(limit)?.[1] ?? 0);

    const substituted =
      limit === "x"
        ? polyMath(integrand, "x")
        : limit === "x^2"
          ? power === 1
            ? `${a}x^2 ${b < 0 ? "-" : "+"} ${Math.abs(b)}`
            : `${a}x^4 ${b < 0 ? "-" : "+"} ${Math.abs(b)}`
          : power === 1
            ? `${a * limitMultiplier}x ${b < 0 ? "-" : "+"} ${Math.abs(b)}`
            : `${a * limitMultiplier ** 2}x^2 ${b < 0 ? "-" : "+"} ${Math.abs(b)}`;

    const chainFactor =
      limit === "x" ? 1 : limit === "x^2" ? null : limitMultiplier;

    const answerMath =
      limit === "x^2"
        ? `(${substituted})*2x`
        : chainFactor === 1
          ? substituted
          : `(${substituted})*${chainFactor}`;

    const steps: Step[] = [
      makeStep(
        `f(${limit})${limit === "x" ? "" : ` \\cdot \\frac{d}{dx}\\left(${limit}\\right)`}`,
        "c1.ftc-first",
        {
          th:
            limit === "x"
              ? "ทฤษฎีบทส่วนที่หนึ่งบอกว่าอนุพันธ์ของพื้นที่สะสมคือตัวฟังก์ชันที่ขอบบน ไม่ต้องอินทิเกรตเลย"
              : "ขอบบนไม่ใช่ x เฉย ๆ จึงต้องคูณด้วยอนุพันธ์ของขอบบนตามกฎลูกโซ่",
          en:
            limit === "x"
              ? "Part one says the derivative of the accumulated area is the function at the upper limit. Nothing is integrated."
              : "The upper limit is not plain x, so the chain rule multiplies by its derivative.",
        },
        { math: null },
      ),
      makeStep(
        answerMath.replace(/\*/g, " \\cdot "),
        "c1.ftc-first",
        {
          th: `แทน t ด้วย ${limit} ลงในตัวถูกอินทิเกรต`,
          en: `Put ${limit} in place of t in the integrand.`,
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: answerMath };

    return {
      ...shell(c1FtcFirst, rng, difficulty),
      prompt: { th: "จงหาอนุพันธ์นี้", en: "Find this derivative" },
      stem: `\\frac{d}{dx}\\int_{${lower}}^{${limit}} \\left(${integrandKatex}\\right) dt`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "อย่าเพิ่งอินทิเกรต ทฤษฎีบทส่วนที่หนึ่งตอบให้เลย",
          en: "Do not integrate. Part one answers it directly.",
        },
        {
          th: `แทน t ด้วยขอบบน ซึ่งคือ ${limit}`,
          en: `Put the upper limit, ${limit}, in place of t.`,
        },
        {
          th:
            limit === "x"
              ? "ขอบล่างเป็นค่าคงตัว จึงไม่มีผลต่ออนุพันธ์"
              : "แล้วคูณด้วยอนุพันธ์ของขอบบน",
          en:
            limit === "x"
              ? "The lower limit is a constant and has no effect on the derivative."
              : "Then multiply by the derivative of that upper limit.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: substituted },
          explain:
            limit === "x"
              ? {
                  th: "ลืมว่ายังมีอะไรให้ทำอีก ข้อนี้คำตอบถูกแล้ว",
                  en: "Nothing further was needed here.",
                }
              : {
                  th: "ลืมคูณด้วยอนุพันธ์ของขอบบน ซึ่งเป็นกฎลูกโซ่",
                  en: "The derivative of the upper limit was never multiplied in - that is the chain rule.",
                },
        },
        {
          answer: {
            kind: "exact",
            value: rationalMath(integrate(integrand, lower, 1)),
          },
          explain: {
            th: "ไปอินทิเกรตก่อนแล้วแทนค่า ซึ่งไม่ใช่สิ่งที่โจทย์ถาม โจทย์ถามอนุพันธ์ของพื้นที่สะสม",
            en: "That evaluates the integral instead of differentiating the accumulation, which is what was asked.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

export const c1FtcSecond: Generator = {
  id: "c1.ftc-second",
  skillId: "c1.ftc-second",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const degree = difficulty === 1 ? 1 : difficulty === 2 ? 2 : 3;
    const poly: Poly = [];
    for (let i = 0; i < degree; i += 1) poly.push(rng.int(-4, 5));
    poly.push(rng.pick([1, 2, 3, 4, 6]));

    const from = difficulty === 4 ? rng.int(-3, 0) : rng.int(0, 2);
    const to = from + rng.int(1, 4);
    const total = integrate(poly, from, to);

    const steps: Step[] = [
      makeStep(
        `F(x) = ${printPoly(
          [0, ...poly.map((value, exponent) => value / (exponent + 1))],
        )}`,
        "c1.ftc-second",
        {
          th: "หาปฏิยานุพันธ์ ไม่ต้องใส่ C เพราะจะตัดกันเอง",
          en: "An antiderivative, with no constant: it cancels.",
        },
        { math: null },
      ),
      makeStep(
        `F(${to}) - F(${from}) = ${fraction(total[0], total[1])}`,
        "c1.ftc-second",
        {
          th: "แทนขอบบนลบขอบล่าง",
          en: "Top minus bottom.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: rationalMath(total) };

    return {
      ...shell(c1FtcSecond, rng, difficulty),
      prompt: {
        th: "จงหาค่าของปริพันธ์จำกัดเขตนี้โดยใช้ทฤษฎีบทหลักมูล",
        en: "Evaluate this definite integral using the fundamental theorem",
      },
      stem: `\\int_{${from}}^{${to}} \\left(${printPoly(poly)}\\right) dx`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "หาปฏิยานุพันธ์ก่อน",
          en: "An antiderivative first.",
        },
        {
          th: "แล้วแทนขอบบนลบขอบล่าง",
          en: "Then top minus bottom.",
        },
        {
          th: "คำตอบเป็นเศษส่วนได้ และไม่ต้องใส่ C",
          en: "A fraction is a fine answer, and no constant is needed.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: rationalMath(integrate(poly, to, from)),
          },
          explain: {
            th: "สลับขอบบนกับขอบล่าง",
            en: "The limits are the wrong way round.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

export const c1NetChange: Generator = {
  id: "c1.net-change",
  skillId: "c1.net-change",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    /*
     * A rate integrated over an interval. The four difficulties are the four
     * situations this turns up in: a velocity, a flow, a rate of production,
     * and a velocity that changes sign - where "how far it went" and "where it
     * ended up" stop being the same number.
     */
    const kind = difficulty;
    const a = rng.pick([2, 3, 4, 6]);
    const b = rng.int(0, 6);
    const to = rng.int(2, 5);

    if (kind <= 3) {
      const rate: Poly = kind === 1 ? [b, a] : kind === 2 ? [b, 0, a] : [b, a, 0, 1];
      const total = integrate(rate, 0, to);
      const noun =
        kind === 1
          ? { th: "การกระจัด", en: "displacement" }
          : kind === 2
            ? { th: "ปริมาตรน้ำที่ไหลเข้า", en: "volume of water" }
            : { th: "จำนวนสินค้าที่ผลิตได้", en: "number of items produced" };
      const unit =
        kind === 1
          ? { th: "เมตร", en: "metres" }
          : kind === 2
            ? { th: "ลิตร", en: "litres" }
            : { th: "ชิ้น", en: "items" };

      const steps: Step[] = [
        makeStep(
          `\\int_0^{${to}} \\left(${printPoly(rate, "t")}\\right) dt`,
          "c1.net-change",
          {
            th: "ปริพันธ์ของอัตราคือการเปลี่ยนแปลงสุทธิ",
            en: "The integral of a rate is the net change.",
          },
          { math: null },
        ),
        makeStep(
          fraction(total[0], total[1]),
          "c1.ftc-second",
          {
            th: "คิดออกมาด้วยทฤษฎีบทหลักมูล",
            en: "Worked out with the fundamental theorem.",
          },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: rationalMath(total) };

      return {
        ...shell(c1NetChange, rng, difficulty),
        prompt: {
          th: `อัตราการเปลี่ยนแปลงหลังเวลา t เป็นดังนี้ จงหา${noun.th}ทั้งหมดตั้งแต่ t = 0 ถึง t = ${to} เป็น${unit.th}`,
          en: `The rate after time t is given. Find the total ${noun.en} from t = 0 to t = ${to}, in ${unit.en}`,
        },
        stem: `${kind === 1 ? "v" : "r"}(t) = ${printPoly(rate, "t")}`,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "อัตราคูณเวลาใช้ไม่ได้ เพราะอัตราไม่คงที่",
            en: "Rate times time will not do, because the rate is not constant.",
          },
          {
            th: "อินทิเกรตอัตราตั้งแต่ศูนย์ถึงเวลาที่กำหนด",
            en: "Integrate the rate from zero to the given time.",
          },
          {
            th: "นั่นคือความหมายของทฤษฎีบทหลักมูลในทางปฏิบัติ",
            en: "That is what the fundamental theorem means in practice.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: {
              kind: "exact",
              value: String(
                rate.reduce(
                  (sum, value, exponent) => sum + value * to ** exponent,
                  0,
                ) * to,
              ),
            },
            explain: {
              th: "คิดว่าอัตราคงที่แล้วคูณด้วยเวลา ซึ่งใช้ได้เฉพาะเมื่ออัตราไม่เปลี่ยน",
              en: "That treats the rate as constant and multiplies by the time, which only works when it is.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    /*
     * Difficulty 4: a velocity that changes sign partway. The integral gives
     * the displacement, which is *less* than the distance travelled - and the
     * question asks for the displacement, so the point is that they differ.
     */
    const root = rng.int(2, 5);
    const end = root + rng.int(1, 3);
    const speed = rng.int(1, 4);
    // v(t) = 2k(t - root), negative before the root and positive after.
    const rate: Poly = [-2 * speed * root, 2 * speed];
    const total = integrate(rate, 0, end);

    const steps: Step[] = [
      makeStep(
        `\\int_0^{${end}} \\left(${printPoly(rate, "t")}\\right) dt`,
        "c1.net-change",
        {
          th: "ปริพันธ์ของความเร็วคือการกระจัดสุทธิ",
          en: "The integral of a velocity is the net displacement.",
        },
        { math: null },
      ),
      makeStep(
        `${fraction(total[0], total[1])}`,
        "c1.ftc-second",
        {
          th: `ความเร็วติดลบก่อน t = ${root} จึงหักกลบกับช่วงหลังบางส่วน ระยะทางที่เดินทางจริงมากกว่าตัวเลขนี้`,
          en: `The velocity is negative before t = ${root}, so part of the motion cancels. The distance actually travelled is more than this.`,
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: rationalMath(total) };

    return {
      ...shell(c1NetChange, rng, difficulty),
      prompt: {
        th: `อนุภาคหนึ่งมีความเร็ว v(t) ดังนี้ จงหาการกระจัดสุทธิตั้งแต่ t = 0 ถึง t = ${end} เป็นเมตร`,
        en: `A particle has the velocity v(t) given. Find its net displacement from t = 0 to t = ${end}, in metres`,
      },
      stem: `v(t) = ${printPoly(rate, "t")}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: `ความเร็วเป็นลบก่อน t = ${root} แล้วเป็นบวกหลังจากนั้น`,
          en: `The velocity is negative before t = ${root} and positive after.`,
        },
        {
          th: "การกระจัดสุทธิคือปริพันธ์ตรง ๆ โดยให้ช่วงที่ติดลบหักกลบ",
          en: "Net displacement is the plain integral, letting the negative part cancel.",
        },
        {
          th: "ถ้าโจทย์ถามระยะทางที่เดินทางจริง จะต้องแยกช่วงแล้วใช้ค่าสัมบูรณ์",
          en: "Distance travelled would be a different question, needing the interval split.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: rationalMath(
              addRational(
                [-integrate(rate, 0, root)[0], integrate(rate, 0, root)[1]],
                integrate(rate, root, end),
              ),
            ),
          },
          explain: {
            th: "นั่นคือระยะทางที่เดินทางจริง ซึ่งไม่ให้ช่วงที่ติดลบหักกลบ โจทย์ถามการกระจัดสุทธิ",
            en: "That is the distance travelled, which refuses to let the negative part cancel. The question asks for the net displacement.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

export const c1AreaBetween: Generator = {
  id: "c1.area-between",
  skillId: "c1.area-between",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    /*
     * A line and a parabola that meet at two whole numbers. Between the roots
     * the line is above, and the area is the integral of the difference -
     * which factorises to `(x - p)(q - x)` times the leading coefficient, so
     * the answer is exactly `k(q - p)^3 / 6`.
     */
    const p = rng.int(-4, 1);
    const q = p + rng.int(1, 4);
    const k = difficulty === 1 ? 1 : rng.int(1, 3);

    // parabola: k(x - p)(x - q) + line, so the gap is -k(x-p)(x-q).
    const lineSlope = rng.int(-3, 3);
    const lineIntercept = rng.int(-5, 5);
    const parabola: Poly = [
      k * p * q + lineIntercept,
      -k * (p + q) + lineSlope,
      k,
    ];

    const width = q - p;
    const areaValue = rational(k * width ** 3, 6);

    const steps: Step[] = [
      makeStep(
        `${printPoly(parabola)} = ${sumTerms([
          coefficient(lineSlope, "x") || null,
          lineIntercept === 0 ? null : String(lineIntercept),
        ])} \\Rightarrow x = ${p}, ${q}`,
        "quad.zero-product",
        {
          th: "หาจุดตัดก่อน ให้สองสมการเท่ากันแล้วแก้",
          en: "Where they cross comes first: set them equal and solve.",
        },
        { math: null },
      ),
      makeStep(
        `\\int_{${p}}^{${q}} \\left(\\text{เส้นบน} - \\text{เส้นล่าง}\\right) dx`,
        "c1.area-between",
        {
          th: `ระหว่าง ${p} กับ ${q} เส้นตรงอยู่เหนือพาราโบลา`,
          en: `Between ${p} and ${q} the line is the upper curve.`,
        },
        { math: null },
      ),
      makeStep(
        fraction(areaValue[0], areaValue[1]),
        "c1.ftc-second",
        {
          th: "คิดปริพันธ์ออกมาได้พื้นที่",
          en: "Working the integral out gives the area.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: rationalMath(areaValue) };

    return {
      ...shell(c1AreaBetween, rng, difficulty),
      prompt: {
        th: "จงหาพื้นที่ที่ปิดล้อมด้วยเส้นโค้งทั้งสองนี้",
        en: "Find the area enclosed between these two curves",
      },
      stem: `y = ${printPoly(parabola)}, \\quad y = ${sumTerms([
        coefficient(lineSlope, "x") || null,
        lineIntercept === 0 ? null : String(lineIntercept),
      ])}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "หาจุดตัดก่อน ให้ y ทั้งสองเท่ากันแล้วแก้สมการกำลังสอง",
          en: "Find where they cross: set the two y's equal and solve the quadratic.",
        },
        {
          th: `ได้ x = ${p} และ x = ${q} ซึ่งเป็นขอบเขตของปริพันธ์`,
          en: `That gives x = ${p} and x = ${q}, which are the limits.`,
        },
        {
          th: "แล้วอินทิเกรตเส้นบนลบเส้นล่าง พื้นที่ต้องเป็นบวก",
          en: "Then integrate upper minus lower. An area comes out positive.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: rationalMath([-areaValue[0], areaValue[1]]),
          },
          explain: {
            th: "ลบสลับที่ พื้นที่ติดลบไม่ได้ ในช่วงนี้เส้นตรงอยู่เหนือพาราโบลา",
            en: "Subtracted the wrong way round. An area is never negative, and here the line is on top.",
          },
        },
        {
          answer: { kind: "exact", value: String(width) },
          explain: {
            th: "นั่นคือความกว้างของช่วง ไม่ใช่พื้นที่",
            en: "That is how wide the region is, not how much area it has.",
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
