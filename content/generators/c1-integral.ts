import { coefficient, fraction, reduceFraction, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "c1.integral-intro";

/**
 * ปริพันธ์ · Calculus I.
 *
 * Every question is built from its own answer: the antiderivative is chosen
 * first and the integrand is what comes out of differentiating it. So the
 * integral in the stem is exactly integrable by construction, and
 * `c1-integral.test.ts` differentiates the answer back to prove it.
 *
 * ## The constant of integration
 *
 * An indefinite integral is a family of functions, and the answer checker
 * compares one expression with another. So the indefinite questions here pin
 * the constant down with a point the curve passes through - which is both
 * checkable and the form every application uses anyway.
 */

/** A rational number, kept exact so a definite integral is exact. */
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

export const c1IntegralPower: Generator = {
  id: "c1.integral-power",
  skillId: "c1.integral-power",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    /*
     * Difficulty 1 and 2 are polynomials, where the power rule does all the
     * work. Difficulty 3 is a standard function - a sine, a cosine or an
     * exponential - and 4 is the reciprocal, which is the one case the power
     * rule cannot touch and where a logarithm appears instead.
     */
    const through = rng.int(1, 5);
    const value = rng.int(-6, 8);

    if (difficulty <= 2) {
      const a = rng.pick([1, 2, 3, 4, 6, -2, -3]);
      const power = difficulty === 1 ? rng.int(1, 3) : rng.int(3, 5);
      const b = rng.int(-6, 6);

      // F(x) = a x^(n+1)/(n+1) + b x + C, and f is its derivative.
      const integrandKatex = sumTerms([
        coefficient(a * (power + 1), `x^${power}`) || null,
        b === 0 ? null : String(b),
      ]);
      const primitiveKatex = sumTerms([
        coefficient(a, `x^${power + 1}`) || null,
        b === 0 ? null : coefficient(b, "x") || null,
      ]);
      const primitiveAt = a * through ** (power + 1) + b * through;
      const shift = value - primitiveAt;

      const answerMath = sumTerms([
        `${a}x^${power + 1}`,
        b === 0 ? null : `${b}x`,
        shift === 0 ? null : String(shift),
      ]);

      const steps: Step[] = [
        makeStep(
          `F(x) = ${primitiveKatex} + C`,
          "c1.integral-power",
          {
            th: "บวกหนึ่งที่เลขชี้กำลังแล้วหารด้วยเลขชี้กำลังใหม่ ทีละพจน์",
            en: "Up one on each exponent, then divide by the new one, term by term.",
          },
          { math: null },
        ),
        makeStep(
          `${primitiveAt} + C = ${value} \\Rightarrow C = ${shift}`,
          "calc.derivative-constant",
          {
            th: `กราฟผ่านจุด (${through}, ${value}) จึงหาค่า C ได้`,
            en: `The curve passes through (${through}, ${value}), which pins C down.`,
          },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: answerMath };

      return {
        ...shell(c1IntegralPower, rng, difficulty),
        prompt: {
          th: `จงหา F(x) เมื่อ F'(x) เป็นฟังก์ชันนี้ และกราฟของ F ผ่านจุด (${through}, ${value})`,
          en: `Find F(x) when F'(x) is this function and the graph of F passes through (${through}, ${value})`,
        },
        stem: `\\int \\left(${integrandKatex}\\right) dx`,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "ทำกฎกำลังกลับทาง บวกหนึ่งแล้วหารด้วยตัวใหม่",
            en: "The power rule backwards: up one, then divide by that.",
          },
          {
            th: "อย่าลืม +C แล้วใช้จุดที่ให้มาหาค่ามัน",
            en: "Keep the constant, and use the given point to find it.",
          },
          {
            th: "ตรวจคำตอบได้ด้วยการหาอนุพันธ์กลับ",
            en: "Differentiate your answer to check it.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: {
              kind: "exact",
              value: sumTerms([
                `${a}x^${power + 1}`,
                b === 0 ? null : `${b}x`,
              ]),
            },
            explain: {
              th: "ลืมหาค่า C กราฟที่ผ่านจุดที่กำหนดมีเพียงเส้นเดียว",
              en: "The constant was never found, and only one curve of that family passes through the point.",
            },
          },
          {
            answer: {
              kind: "exact",
              value: sumTerms([
                `${a * (power + 1)}x^${power + 1}`,
                b === 0 ? null : `${b}x`,
                shift === 0 ? null : String(shift),
              ]),
            },
            explain: {
              th: "ลืมหารด้วยเลขชี้กำลังใหม่ ตรวจได้ด้วยการดิฟกลับ",
              en: "The new exponent was never divided by. Differentiating back would have shown it.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    if (difficulty === 3) {
      // A standard function, whose antiderivative has to be remembered.
      const kind = rng.pick(["sin", "cos", "exp"] as const);
      const a = rng.pick([1, 2, 3, 4, 5]);

      const integrandKatex =
        kind === "sin"
          ? `${a === 1 ? "" : a}\\sin x`
          : kind === "cos"
            ? `${a === 1 ? "" : a}\\cos x`
            : `${a === 1 ? "" : a}e^x`;
      const primitiveMath =
        kind === "sin"
          ? `${-a}*cos(x)`
          : kind === "cos"
            ? `${a}*sin(x)`
            : `${a}*e^x`;
      const primitiveKatex =
        kind === "sin"
          ? `-${a === 1 ? "" : a}\\cos x`
          : kind === "cos"
            ? `${a === 1 ? "" : a}\\sin x`
            : `${a === 1 ? "" : a}e^x`;

      const steps: Step[] = [
        makeStep(
          `${primitiveKatex} + C`,
          "c1.integral-power",
          {
            th:
              kind === "sin"
                ? "อนุพันธ์ของคอสคือลบซิน ปริพันธ์ของซินจึงเป็นลบคอส"
                : kind === "cos"
                  ? "อนุพันธ์ของซินคือคอส ปริพันธ์ของคอสจึงเป็นซิน"
                  : "e ยกกำลัง x เป็นอนุพันธ์ของตัวเอง ปริพันธ์ก็เป็นตัวเอง",
            en:
              kind === "sin"
                ? "Cosine differentiates to minus sine, so sine integrates to minus cosine."
                : kind === "cos"
                  ? "Sine differentiates to cosine, so cosine integrates to sine."
                  : "The exponential is its own derivative, and so its own integral.",
          },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: primitiveMath };

      return {
        ...shell(c1IntegralPower, rng, difficulty),
        prompt: {
          th: "จงหาปริพันธ์ไม่จำกัดเขตนี้ โดยไม่ต้องเขียน +C",
          en: "Find this indefinite integral, without writing the constant",
        },
        stem: `\\int ${integrandKatex}\\,dx`,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "ถามตัวเองว่าอะไรดิฟแล้วได้สิ่งนี้",
            en: "Ask what differentiates to this.",
          },
          {
            th:
              kind === "sin"
                ? "ระวังเครื่องหมาย ซินกับคอสสลับกันไปมาและมีลบอยู่ตัวหนึ่ง"
                : "ตัวเลขข้างหน้าติดไปด้วยเหมือนเดิม",
            en:
              kind === "sin"
                ? "Mind the sign: sine and cosine swap back and forth with one minus between them."
                : "The number in front comes along unchanged.",
          },
          {
            th: "ตรวจได้ด้วยการหาอนุพันธ์กลับ",
            en: "Differentiate it back to check.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: {
              kind: "exact",
              value:
                kind === "sin"
                  ? `${a}*cos(x)`
                  : kind === "cos"
                    ? `${-a}*sin(x)`
                    : `${a}*x*e^x`,
            },
            explain: {
              th:
                kind === "exp"
                  ? "ใช้กฎกำลังกับ e ยกกำลัง x ซึ่งใช้ไม่ได้"
                  : "เครื่องหมายผิด ลองดิฟคำตอบกลับแล้วเทียบ",
              en:
                kind === "exp"
                  ? "That is the power rule, which does not apply to an exponential."
                  : "Wrong sign - differentiate it back and compare.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    // Difficulty 4: the reciprocal, where the power rule breaks down.
    const a = rng.pick([1, 2, 3, 4, 5, 6]);
    const tail = rng.int(-5, 5);
    const tailKatex = tail === 0 ? "" : ` ${tail < 0 ? "-" : "+"} ${Math.abs(tail)}`;
    const steps: Step[] = [
      makeStep(
        `${a}\\ln|x|${tailKatex === "" ? "" : ` ${coefficient(tail, "x")}`} + C`,
        "c1.integral-power",
        {
          th: "กฎกำลังใช้ไม่ได้ เพราะบวกหนึ่งแล้วจะได้หารด้วยศูนย์ ปริพันธ์ของหนึ่งส่วน x คือลอการิทึม",
          en: "The power rule fails here - adding one would divide by zero - and one over x integrates to a logarithm.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = {
      kind: "exact",
      value: sumTerms([`${a}*log(x)`, tail === 0 ? null : `${tail}x`]),
    };

    return {
      ...shell(c1IntegralPower, rng, difficulty),
      prompt: {
        th: "จงหาปริพันธ์ไม่จำกัดเขตนี้ สำหรับ x มากกว่าศูนย์ โดยไม่ต้องเขียน +C",
        en: "Find this indefinite integral for x above zero, without writing the constant",
      },
      stem: `\\int \\left(\\frac{${a}}{x}${tailKatex}\\right) dx`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ลองใช้กฎกำลังดู จะเห็นว่ามันพัง",
          en: "Try the power rule and watch it break.",
        },
        {
          th: "เลขชี้กำลังคือ -1 บวกหนึ่งได้ศูนย์ แล้วต้องหารด้วยศูนย์",
          en: "The exponent is minus one; adding one gives zero, and then you would divide by it.",
        },
        {
          th: "อะไรดิฟแล้วได้หนึ่งส่วน x",
          en: "What differentiates to one over x?",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: sumTerms([
              `${a}*x^0/0`,
              tail === 0 ? null : `${tail}x`,
            ]),
          },
          explain: {
            th: "ใช้กฎกำลังกับเลขชี้กำลัง -1 ซึ่งทำให้ต้องหารด้วยศูนย์",
            en: "That is the power rule at the one exponent it cannot handle, and it divides by zero.",
          },
        },
        {
          answer: {
            kind: "exact",
            value: sumTerms([`${a}/x^2`, tail === 0 ? null : `${tail}x`]),
          },
          explain: {
            th: "นั่นคือการดิฟ ไม่ใช่การอินทิเกรต และเครื่องหมายก็ผิดด้วย",
            en: "That is differentiating rather than integrating, and the sign is wrong as well.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

export const c1Substitution: Generator = {
  id: "c1.substitution",
  skillId: "c1.substitution",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const a = rng.pick([2, 3, 4, 5]);
    const b = rng.int(-6, 6);
    const inner = `${a}x ${b < 0 ? "-" : "+"} ${Math.abs(b)}`;
    const innerKatex = `${a}x ${b < 0 ? "-" : "+"} ${Math.abs(b)}`;

    /*
     * The four shapes a first course meets, in order: a linear inside a power,
     * a linear inside a sine, a linear inside an exponential, and the one that
     * needs spotting - `x` beside `x^2`, where the factor outside is the
     * inside's derivative up to a constant.
     */
    if (difficulty === 4) {
      const power = rng.int(2, 4);
      const shift = rng.int(1, 6);
      // \int x(x^2 + s)^n dx = (x^2 + s)^(n+1) / (2(n+1))
      const answerMath = `(x^2 + ${shift})^${power + 1}/${2 * (power + 1)}`;

      const steps: Step[] = [
        makeStep(
          `u = x^2 + ${shift}, \\quad du = 2x\\,dx`,
          "c1.substitution",
          {
            th: `ตัวคูณ x ที่อยู่ข้างนอกคือครึ่งหนึ่งของอนุพันธ์ของข้างใน จึงแทนค่าได้`,
            en: `The x outside is half the inside's derivative, which is what makes the substitution work.`,
          },
          { math: null },
        ),
        makeStep(
          `\\frac{1}{2}\\int u^{${power}}\\,du = \\frac{u^{${power + 1}}}{${2 * (power + 1)}}`,
          "c1.integral-power",
          {
            th: "ครึ่งหนึ่งออกมาข้างนอก แล้วใช้กฎกำลังตามปกติ",
            en: "The half comes outside, and then it is the ordinary power rule.",
          },
          { math: null },
        ),
        makeStep(
          `\\frac{\\left(x^2 + ${shift}\\right)^{${power + 1}}}{${2 * (power + 1)}} + C`,
          "c1.substitution",
          {
            th: "แล้วแทน u กลับเป็น x",
            en: "Then put x back in place of u.",
          },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: answerMath };

      return {
        ...shell(c1Substitution, rng, difficulty),
        prompt: {
          th: "จงหาปริพันธ์ไม่จำกัดเขตนี้ โดยไม่ต้องเขียน +C",
          en: "Find this indefinite integral, without writing the constant",
        },
        stem: `\\int x\\left(x^2 + ${shift}\\right)^{${power}}\\,dx`,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "มองหาส่วนที่เป็นอนุพันธ์ของอีกส่วนหนึ่ง",
            en: "Look for the part that is the derivative of another part.",
          },
          {
            th: `อนุพันธ์ของ x กำลังสองบวก ${shift} คือ 2x และข้างนอกมี x อยู่`,
            en: `The bracket differentiates to 2x, and there is an x outside.`,
          },
          {
            th: "ตั้ง u เป็นวงเล็บ แล้วอย่าลืมครึ่งหนึ่งที่ต้องคูณ",
            en: "Let u be the bracket, and do not lose the half.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: {
              kind: "exact",
              value: `(x^2 + ${shift})^${power + 1}/${power + 1}`,
            },
            explain: {
              th: "ลืมครึ่งหนึ่ง อนุพันธ์ของข้างในคือ 2x แต่ข้างนอกมีแค่ x",
              en: "The half is missing: the inside differentiates to 2x and only an x is there.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    const power = difficulty === 1 ? rng.int(2, 5) : 0;
    const integrandKatex =
      difficulty === 1
        ? `\\left(${innerKatex}\\right)^{${power}}`
        : difficulty === 2
          ? `\\cos\\left(${innerKatex}\\right)`
          : `e^{${innerKatex}}`;

    const answerMath =
      difficulty === 1
        ? `(${inner})^${power + 1}/${a * (power + 1)}`
        : difficulty === 2
          ? `sin(${inner})/${a}`
          : `e^(${inner})/${a}`;

    const answerKatex =
      difficulty === 1
        ? `\\frac{\\left(${innerKatex}\\right)^{${power + 1}}}{${a * (power + 1)}}`
        : difficulty === 2
          ? `\\frac{\\sin\\left(${innerKatex}\\right)}{${a}}`
          : `\\frac{e^{${innerKatex}}}{${a}}`;

    const steps: Step[] = [
      makeStep(
        `u = ${innerKatex}, \\quad du = ${a}\\,dx`,
        "c1.substitution",
        {
          th: `ตั้ง u เป็นข้างใน อนุพันธ์ของมันคือ ${a} ซึ่งเป็นค่าคงตัว`,
          en: `Let u be the inside; its derivative is the constant ${a}.`,
        },
        { math: null },
      ),
      makeStep(
        answerKatex,
        "c1.substitution",
        {
          th: `หารด้วย ${a} เพราะ dx เท่ากับ du ส่วน ${a}`,
          en: `Divide by ${a}, because dx is du over ${a}.`,
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: answerMath };

    return {
      ...shell(c1Substitution, rng, difficulty),
      prompt: {
        th: "จงหาปริพันธ์ไม่จำกัดเขตนี้ โดยไม่ต้องเขียน +C",
        en: "Find this indefinite integral, without writing the constant",
      },
      stem: `\\int ${integrandKatex}\\,dx`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ข้างในเป็นเชิงเส้น อนุพันธ์ของมันจึงเป็นค่าคงตัว",
          en: "The inside is linear, so its derivative is a constant.",
        },
        {
          th: `อินทิเกรตข้างนอกตามปกติ แล้วหารด้วย ${a}`,
          en: `Integrate the outside as usual, then divide by ${a}.`,
        },
        {
          th: "ตรวจด้วยการดิฟกลับ ตัวคูณจากกฎลูกโซ่จะตัดกับตัวหารพอดี",
          en: "Differentiate back: the chain rule's factor cancels the division exactly.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value:
              difficulty === 1
                ? `(${inner})^${power + 1}/${power + 1}`
                : difficulty === 2
                  ? `sin(${inner})`
                  : `e^(${inner})`,
          },
          explain: {
            th: `ลืมหารด้วย ${a} ซึ่งมาจากอนุพันธ์ของข้างใน`,
            en: `The division by ${a} is missing, and it comes from the inside's derivative.`,
          },
        },
        {
          answer: {
            kind: "exact",
            value:
              difficulty === 1
                ? `${a}*(${inner})^${power + 1}/${power + 1}`
                : difficulty === 2
                  ? `${a}*sin(${inner})`
                  : `${a}*e^(${inner})`,
          },
          explain: {
            th: `คูณด้วย ${a} แทนที่จะหาร การอินทิเกรตทำกลับทางกับการดิฟ`,
            en: `Multiplied by ${a} instead of divided. Integration undoes differentiation, so the factor goes the other way.`,
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

export const c1Definite: Generator = {
  id: "c1.definite",
  skillId: "c1.definite",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const from = rng.int(-3, 1);
    const to = from + rng.int(1, 4);

    if (difficulty <= 2) {
      /*
       * A polynomial with integer coefficients, integrated exactly with
       * rational arithmetic - so the answer is `7/3` rather than `2.333`.
       */
      const degree = difficulty === 1 ? 1 : rng.pick([2, 3]);
      const poly: number[] = [];
      for (let i = 0; i < degree; i += 1) poly.push(rng.int(-4, 5));
      poly.push(rng.pick([1, 2, 3, 4, 6]));

      const primitive: Rational[] = [
        [0, 1],
        ...poly.map((value, exponent) => rational(value, exponent + 1)),
      ];
      const at = (x: number) =>
        primitive.reduce<Rational>(
          (total, [top, bottom], exponent) =>
            addRational(total, rational(top * x ** exponent, bottom)),
          [0, 1],
        );
      const top = at(to);
      const bottom = at(from);
      const total = addRational(top, [-bottom[0], bottom[1]]);

      const integrandKatex = sumTerms(
        poly
          .map((value, exponent) => {
            if (value === 0) return null;
            if (exponent === 0) return String(value);
            return coefficient(value, exponent === 1 ? "x" : `x^${exponent}`) || null;
          })
          .reverse(),
      );

      const steps: Step[] = [
        makeStep(
          `F(${to}) - F(${from}) = ${fraction(top[0], top[1])} - \\left(${fraction(bottom[0], bottom[1])}\\right)`,
          "c1.definite-integral",
          {
            th: "หาปฏิยานุพันธ์แล้วแทนขอบบนลบขอบล่าง",
            en: "Antiderivative, then top limit minus bottom.",
          },
          { math: null },
        ),
        makeStep(
          fraction(total[0], total[1]),
          "c1.definite-integral",
          { th: "ได้ค่าของปริพันธ์", en: "And that is the integral." },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: rationalMath(total) };

      return {
        ...shell(c1Definite, rng, difficulty),
        prompt: { th: "จงหาค่าของปริพันธ์จำกัดเขตนี้", en: "Evaluate this definite integral" },
        stem: `\\int_{${from}}^{${to}} \\left(${integrandKatex}\\right) dx`,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "หาปฏิยานุพันธ์ก่อน ไม่ต้องใส่ C เพราะจะตัดกันเอง",
            en: "Antiderivative first, and no constant: it cancels itself.",
          },
          {
            th: "แล้วแทนขอบบนลบขอบล่าง ระวังเครื่องหมายเมื่อขอบล่างติดลบ",
            en: "Then top minus bottom, minding the signs when the lower limit is negative.",
          },
          {
            th: "คำตอบเป็นเศษส่วนได้",
            en: "The answer may well be a fraction.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: {
              kind: "exact",
              value: rationalMath(addRational(bottom, [-top[0], top[1]])),
            },
            explain: {
              th: "สลับขอบบนกับขอบล่าง",
              en: "The limits are the wrong way round.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    /*
     * Difficulties 3 and 4: a definite integral that needs the substitution
     * from the previous skill, with limits chosen so the answer stays exact.
     */
    const a = rng.pick([1, 2, 3]);
    const outer = rng.int(1, 4);
    const isTrig = difficulty === 3;

    if (isTrig) {
      // \int_0^{k} cos(ax) dx = sin(ak)/a, with ak a multiple of pi/2.
      const multiple = rng.pick([1, 2, 3]);
      const upper = multiple; // in units of pi/(2a)
      const sineValue = [0, 1, 0, -1][multiple % 4]!;
      const scaled = outer * sineValue;
      const answerMath = scaled === 0 ? "0" : `${scaled}/${a}`;

      const steps: Step[] = [
        makeStep(
          `\\left[\\frac{${outer === 1 ? "" : outer}\\sin ${a}x}{${a}}\\right]`,
          "c1.substitution",
          {
            th: `ปริพันธ์ของ \\cos ${a}x คือ \\sin ${a}x ส่วน ${a} และตัวคูณข้างหน้าติดไปด้วย`,
            en: `The integral of cos ${a}x is sin ${a}x over ${a}, and the coefficient comes along.`,
          },
          { math: null },
        ),
        makeStep(
          `\\frac{${scaled}}{${a}} - 0 = ${answerMath === "0" ? "0" : fraction(scaled, a)}`,
          "c1.definite-integral",
          {
            th: "แทนขอบเขต ขอบล่างเป็นศูนย์จึงหายไป",
            en: "Put the limits in; the lower one is zero and vanishes.",
          },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: answerMath };

      return {
        ...shell(c1Definite, rng, difficulty),
        prompt: { th: "จงหาค่าของปริพันธ์จำกัดเขตนี้", en: "Evaluate this definite integral" },
        stem: `\\int_{0}^{\\frac{${upper}\\pi}{${2 * a}}} ${outer === 1 ? "" : outer}\\cos ${a}x\\,dx`,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: `อินทิเกรต \\cos ${a}x ได้ \\sin ${a}x ส่วน ${a}`,
            en: `Integrating cos ${a}x gives sin ${a}x over ${a}.`,
          },
          {
            th: "แล้วแทนขอบเขตทั้งสอง",
            en: "Then put both limits in.",
          },
          {
            th: `ที่ขอบบน มุมคือ ${multiple} ส่วนสองของ \\pi`,
            en: `At the top limit the angle is ${multiple} halves of pi.`,
          },
        ],
        ...mistakes(answer, [
          {
            answer: {
              kind: "exact",
              value: scaled === 0 ? String(outer) : String(scaled),
            },
            explain: {
              th: `ลืมหารด้วย ${a} ซึ่งมาจากกฎลูกโซ่กลับทาง`,
              en: `The division by ${a} is missing, and it comes from the chain rule in reverse.`,
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    // Difficulty 4: a substitution with a power, evaluated between limits.
    const shift = rng.int(1, 5);
    const power = rng.int(1, 3);
    const upper = rng.int(1, 3);
    const valueAtTop = (upper * upper + shift) ** (power + 1);
    const valueAtBottom = shift ** (power + 1);
    const denominator = 2 * (power + 1);
    const total = rational(valueAtTop - valueAtBottom, denominator);

    const steps: Step[] = [
      makeStep(
        `\\left[\\frac{\\left(x^2 + ${shift}\\right)^{${power + 1}}}{${denominator}}\\right]_{0}^{${upper}}`,
        "c1.substitution",
        {
          th: "แทนค่าด้วย u เหมือนเดิม แล้วค่อยแทนขอบเขตของ x",
          en: "The same substitution as before, and then the limits in x.",
        },
        { math: null },
      ),
      makeStep(
        `\\frac{${valueAtTop} - ${valueAtBottom}}{${denominator}} = ${fraction(total[0], total[1])}`,
        "c1.definite-integral",
        {
          th: "แทนขอบบนลบขอบล่าง",
          en: "Top minus bottom.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: rationalMath(total) };

    return {
      ...shell(c1Definite, rng, difficulty),
      prompt: { th: "จงหาค่าของปริพันธ์จำกัดเขตนี้", en: "Evaluate this definite integral" },
      stem: `\\int_{0}^{${upper}} x\\left(x^2 + ${shift}\\right)^{${power}}\\,dx`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ต้องแทนค่าก่อน มองหาอนุพันธ์ของข้างในที่คูณอยู่ข้างนอก",
          en: "A substitution first: look for the inside's derivative outside.",
        },
        {
          th: "อย่าลืมครึ่งหนึ่ง เพราะข้างนอกมีแค่ x ไม่ใช่ 2x",
          en: "Keep the half: there is an x outside and the bracket needs 2x.",
        },
        {
          th: "แล้วแทนขอบเขตของ x ลงในคำตอบที่แทน u กลับแล้ว",
          en: "Then put the x limits into the answer with u substituted back.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: rationalMath(
              rational(valueAtTop - valueAtBottom, power + 1),
            ),
          },
          explain: {
            th: "ลืมครึ่งหนึ่งจากการแทนค่า",
            en: "The half from the substitution is missing.",
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

export { rational, addRational, rationalMath, type Rational };
