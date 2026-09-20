import { fraction, sumTerms, coefficient } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "calc.intro";

/**
 * ลิมิตของฟังก์ชัน · ม.6.
 *
 * Every question is built from a function whose limit is known because the
 * function was built to have it - a polynomial evaluated at the point, or a
 * quotient assembled from a factor that cancels. Nothing is "simplified" by
 * this file; the simplified form comes first and the question is written
 * backwards from it, which is the rule the whole `content/` directory follows.
 *
 * `\lim_{x \to 3}` is a subscript and `lib/math/katex.ts` refuses subscripts,
 * so the stems carry `machineStem: null`. `calc-intro.test.ts` checks each
 * answer by evaluating the function very close to the point instead - which is
 * what a limit means, and a better check than re-deriving the algebra.
 */

/** `x - 3`, `x + 4`, written the way a factor is written. */
function factor(root: number): string {
  return root === 0 ? "x" : root > 0 ? `x - ${root}` : `x + ${-root}`;
}

export const calcLimit: Generator = {
  id: "calc.limit",
  skillId: "calc.limit",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 3) return cancelling(rng, difficulty);
    if (difficulty === 4) return cancellingQuadratic(rng, difficulty);

    const point = rng.int(-4, 5);

    if (difficulty === 1) {
      // A polynomial, where the limit is just the value.
      const a = rng.int(1, 4);
      const b = rng.int(-6, 6);
      const c = rng.int(-8, 8);
      const body = sumTerms([
        coefficient(a, "x^2") || null,
        coefficient(b, "x") || null,
        c === 0 ? null : String(c),
      ]);
      const value = a * point * point + b * point + c;

      const steps: Step[] = [
        makeStep(
          `${a}(${point})^2 + ${b}(${point}) + ${c}`,
          "calc.limit-substitution",
          {
            th: `พหุนามต่อเนื่องทุกจุด แทน x = ${point} ได้เลย`,
            en: `A polynomial is continuous everywhere, so x = ${point} goes straight in.`,
          },
          { math: null },
        ),
        makeStep(
          String(value),
          "calc.limit-substitution",
          {
            th: "คิดเลขออกมาได้ค่าลิมิต",
            en: "Working it out gives the limit.",
          },
          { math: null },
        ),
      ];

      const answer: Answer = { kind: "exact", value: String(value) };

      return {
        ...shell(calcLimit, rng, difficulty),
        prompt: { th: "จงหาค่าของลิมิตนี้", en: "Find the limit" },
        stem: `\\lim_{x \\to ${point}}\\left(${body}\\right)`,
        machineStem: null,
        answer,
        steps,
        hints: [
          {
            th: "ลองแทนค่าดูก่อน ถ้าได้จำนวนจริงก็จบแล้ว",
            en: "Try substituting first: if a number comes out, that is the answer.",
          },
          {
            th: `แทน x = ${point} ลงไปในทุกพจน์`,
            en: `Put x = ${point} into every term.`,
          },
          {
            th: "พหุนามไม่มีรอยขาด ลิมิตจึงเท่ากับค่าของฟังก์ชันที่จุดนั้น",
            en: "A polynomial has no break in it, so its limit is simply its value there.",
          },
        ],
        ...mistakes(answer, [
          {
            answer: { kind: "exact", value: String(a * point + b * point + c) },
            explain: {
              th: "ยกกำลังสองไม่ครบ ต้องยกกำลังสองที่ค่าของ x ก่อนแล้วจึงคูณ",
              en: "The squaring was skipped: square the value of x first, then multiply.",
            },
          },
        ]),
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    // Difficulty 2: a quotient whose denominator survives substitution.
    const top = rng.int(-6, 8);
    const bottomRoot = rng.pick(
      [-5, -4, -3, -2, 2, 3, 4, 5, 6].filter((root) => root !== point),
    );
    const numerator = point + top;
    const denominator = point - bottomRoot;
    const value = fraction(numerator, denominator);
    const valueMath = `${numerator}/${denominator}`;

    const steps: Step[] = [
      makeStep(
        `\\frac{${point} ${top < 0 ? "-" : "+"} ${Math.abs(top)}}{${point} ${bottomRoot < 0 ? "+" : "-"} ${Math.abs(bottomRoot)}}`,
        "calc.limit-substitution",
        {
          th: `ตัวส่วนที่ x = ${point} เท่ากับ ${denominator} ซึ่งไม่เป็นศูนย์ จึงแทนค่าได้`,
          en: `At x = ${point} the denominator is ${denominator}, which is not zero, so substitution is allowed.`,
        },
        { math: null },
      ),
      makeStep(
        value,
        "calc.limit-substitution",
        { th: "ได้ค่าลิมิต", en: "And that is the limit." },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: valueMath };

    return {
      ...shell(calcLimit, rng, difficulty),
      prompt: { th: "จงหาค่าของลิมิตนี้", en: "Find the limit" },
      stem: `\\lim_{x \\to ${point}}\\frac{${factor(-top)}}{${factor(bottomRoot)}}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ตรวจตัวส่วนก่อนเสมอ ว่าเป็นศูนย์ที่จุดนั้นหรือไม่",
          en: "Always check the denominator first: is it zero there?",
        },
        {
          th: `ตัวส่วนได้ ${denominator} ไม่เป็นศูนย์ จึงแทนค่าได้เลย`,
          en: `It comes to ${denominator}, which is not zero, so substitute.`,
        },
        {
          th: "ไม่ต้องจัดรูปอะไรเลยในข้อนี้",
          en: "Nothing needs simplifying in this one.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: `${denominator}/${numerator}` },
          explain: {
            th: "กลับเศษกับส่วน ตัวเศษคือค่าของนิพจน์ข้างบน",
            en: "Numerator and denominator are the wrong way round.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/**
 * Difficulty 3: zero over zero, cleared by cancelling a linear factor.
 *
 * Built from the factors outwards, so the cancellation is exact rather than
 * something this file has to perform.
 */
function cancelling(rng: RNG, difficulty: number): Question {
  const point = rng.int(-5, 6);
  const other = rng.pick(
    [-6, -4, -3, -2, -1, 1, 2, 3, 4, 5, 7].filter((root) => root !== point),
  );
  const scale = rng.pick([1, 1, 2, 3]);

  /*
   * (x - point)(x - other) over (x - point). Expanded, the numerator is a
   * quadratic whose zero-over-zero form is genuinely not obvious to look at.
   */
  const sum = point + other;
  const productTerm = point * other;
  const numerator = sumTerms([
    coefficient(scale, "x^2") || null,
    coefficient(-scale * sum, "x") || null,
    scale * productTerm === 0 ? null : String(scale * productTerm),
  ]);

  const value = scale * (point - other);

  const steps: Step[] = [
    makeStep(
      `\\frac{${scale === 1 ? "" : scale}(${factor(point)})(${factor(other)})}{${factor(point)}}`,
      "calc.limit-factor-cancel",
      {
        th: "แทนค่าแล้วได้ศูนย์ส่วนศูนย์ จึงต้องแยกตัวประกอบก่อน",
        en: "Substituting gives zero over zero, so factorise first.",
      },
      { math: null },
    ),
    makeStep(
      `${scale === 1 ? "" : scale}(${factor(other)})`,
      "calc.limit-factor-cancel",
      {
        th: `ตัด ${factor(point)} ทิ้งได้ เพราะ x เข้าใกล้ ${point} แต่ไม่เท่ากับ ${point}`,
        en: `The ${factor(point)} cancels: x approaches ${point} without ever being ${point}.`,
      },
      { math: null },
    ),
    makeStep(
      String(value),
      "calc.limit-substitution",
      {
        th: `แล้วแทน x = ${point} ลงในสิ่งที่เหลือ`,
        en: `Now x = ${point} goes into what is left.`,
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: String(value) };

  return {
    ...shell(calcLimit, rng, difficulty),
    prompt: { th: "จงหาค่าของลิมิตนี้", en: "Find the limit" },
    stem: `\\lim_{x \\to ${point}}\\frac{${numerator}}{${factor(point)}}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "แทนค่าดูก่อน จะได้ศูนย์ส่วนศูนย์ ซึ่งแปลว่ายังตอบไม่ได้",
        en: "Substituting gives zero over zero, which means the question is not answered yet.",
      },
      {
        th: "แยกตัวประกอบตัวเศษ จะมีตัวประกอบร่วมกับตัวส่วนเสมอ",
        en: "Factorise the top: it always shares a factor with the bottom.",
      },
      {
        th: `ตัดทิ้งแล้วเหลือ ${scale === 1 ? "" : scale}(${factor(other)}) จึงแทนค่าได้`,
        en: `After cancelling, what is left can be substituted into directly.`,
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: "0" },
        explain: {
          th: "ศูนย์ส่วนศูนย์ไม่เท่ากับศูนย์ เป็นรูปแบบที่ยังไม่กำหนดค่า ต้องจัดรูปก่อน",
          en: "Zero over zero is not zero. It is an unfinished question, not an answer.",
        },
      },
      {
        answer: { kind: "exact", value: String(scale * (other - point)) },
        explain: {
          th: "เครื่องหมายของตัวประกอบสลับกัน ลองกระจายกลับดูว่าได้ตัวเศษเดิมหรือไม่",
          en: "A factor has the wrong sign - multiply back out and see whether the numerator returns.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/**
 * Difficulty 4: zero over zero where *both* parts factorise.
 *
 * The cancelling factor is not visible in either expression until both have
 * been factored, which is the version that turns up in an exam.
 */
function cancellingQuadratic(rng: RNG, difficulty: number): Question {
  const point = rng.int(-4, 5);
  const pool = [-6, -5, -3, -2, -1, 1, 2, 3, 4, 6].filter(
    (root) => root !== point,
  );
  const topOther = rng.pick(pool);
  const bottomOther = rng.pick(pool.filter((root) => root !== topOther));

  const numerator = sumTerms([
    "x^2",
    coefficient(-(point + topOther), "x") || null,
    point * topOther === 0 ? null : String(point * topOther),
  ]);
  const denominator = sumTerms([
    "x^2",
    coefficient(-(point + bottomOther), "x") || null,
    point * bottomOther === 0 ? null : String(point * bottomOther),
  ]);

  const top = point - topOther;
  const bottom = point - bottomOther;
  const answerMath = `${top}/${bottom}`;

  const steps: Step[] = [
    makeStep(
      `\\frac{(${factor(point)})(${factor(topOther)})}{(${factor(point)})(${factor(bottomOther)})}`,
      "calc.limit-factor-cancel",
      {
        th: "ทั้งตัวเศษและตัวส่วนเป็นศูนย์ที่จุดนี้ จึงมีตัวประกอบร่วมกันแน่นอน",
        en: "Both parts are zero there, so they certainly share a factor.",
      },
      { math: null },
    ),
    makeStep(
      `\\frac{${factor(topOther)}}{${factor(bottomOther)}}`,
      "calc.limit-factor-cancel",
      {
        th: `ตัดตัวประกอบร่วม ${factor(point)} ทิ้ง`,
        en: `Cancel the shared ${factor(point)}.`,
      },
      { math: null },
    ),
    makeStep(
      fraction(top, bottom),
      "calc.limit-substitution",
      {
        th: `แล้วแทน x = ${point}`,
        en: `Then substitute x = ${point}.`,
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: answerMath };

  return {
    ...shell(calcLimit, rng, difficulty),
    prompt: { th: "จงหาค่าของลิมิตนี้", en: "Find the limit" },
    stem: `\\lim_{x \\to ${point}}\\frac{${numerator}}{${denominator}}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "ทั้งเศษและส่วนเป็นศูนย์ที่จุดนี้ แยกตัวประกอบทั้งคู่",
        en: "Both are zero there, so factorise both.",
      },
      {
        th: `ทั้งคู่มีตัวประกอบ ${factor(point)} อยู่`,
        en: `Each of them contains ${factor(point)}.`,
      },
      {
        th: "ตัดทิ้งแล้วแทนค่าลงในสิ่งที่เหลือ",
        en: "Cancel it and substitute into what is left.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: "1" },
        explain: {
          th: "ศูนย์ส่วนศูนย์ไม่เท่ากับหนึ่ง ตัวเศษกับตัวส่วนเข้าใกล้ศูนย์คนละอัตรา",
          en: "Zero over zero is not one: the two approach zero at different rates.",
        },
      },
      {
        answer: { kind: "exact", value: `${bottom}/${top}` },
        explain: {
          th: "กลับเศษกับส่วนหลังตัดทอน",
          en: "The two are the wrong way round after cancelling.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

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
