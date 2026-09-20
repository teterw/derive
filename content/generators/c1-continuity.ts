import { coefficient, fraction, linearExpr, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "c1.limits";

/**
 * ความต่อเนื่อง และลิมิตตรีโกณมิติ · Calculus I.
 *
 * Continuity is the first thing in the course that is a *condition* rather
 * than a calculation: the question is not "what is the limit" but "is this
 * allowed", and the way it is asked in practice is "choose the constant that
 * makes it allowed" - which turns it back into an equation.
 *
 * The trigonometric limit is the one piece of calculus the app could not have
 * carried before this round: `\sin` only became machine-readable when
 * `lib/math/katex.ts` learnt the function commands.
 */

function piecewise(left: string, right: string, join: number): string {
  return `\\begin{cases} ${left} & x < ${join} \\\\ ${right} & x \\ge ${join} \\end{cases}`;
}

export const c1Continuity: Generator = {
  id: "c1.continuity",
  skillId: "c1.continuity",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 4) return removable(rng, difficulty);

    /*
     * The answer is chosen first and the question built around it, so `k` is
     * always whole - rather than rolling a question and re-rolling when the
     * arithmetic comes out fractional, which would cost determinism as well
     * as being slower.
     *
     * At difficulty 2 the right piece is quadratic, so the two sides look
     * nothing alike and only their values at the join can be compared. At 3
     * the unknown is the *coefficient* of x, which needs a non-zero join to be
     * solvable at all.
     */
    const k = rng.int(-6, 7);
    const unknownIsSlope = difficulty === 3;
    const join = unknownIsSlope
      ? rng.pick([-3, -2, -1, 1, 2, 3, 4])
      : rng.int(-3, 4);

    const leftSlope = rng.pick([1, 2, 3, -1, -2]);
    const tail = rng.int(-6, 6);

    // What the left piece comes to at the join, with k in place.
    const meeting = unknownIsSlope
      ? k * join + tail
      : leftSlope * join + k;

    const quadratic = difficulty === 2;
    const rightSlope = rng.pick([1, 2, 3, -1, -3]);
    // The right piece is then built to arrive at the same height.
    const rightConstant = quadratic
      ? meeting - rightSlope * join * join
      : meeting - rightSlope * join;

    const rightBranch = quadratic
      ? sumTerms([
          coefficient(rightSlope, "x^2") || null,
          rightConstant === 0 ? null : String(rightConstant),
        ])
      : linearExpr(rightSlope, rightConstant, "x");
    const rightValue = meeting;

    const leftBranch = unknownIsSlope
      ? `kx ${tail >= 0 ? "+" : "-"} ${Math.abs(tail)}`
      : `${coefficient(leftSlope, "x")} + k`;

    const steps: Step[] = [
      makeStep(
        `\\lim_{x \\to ${join}^+} f(x) = ${rightValue}`,
        "c1.one-sided",
        {
          th: `ทางขวาใช้สูตรที่สอง แทน x = ${join} ได้ ${rightValue}`,
          en: `The right-hand piece at x = ${join} gives ${rightValue}.`,
        },
        { math: null },
      ),
      makeStep(
        unknownIsSlope
          ? `${join}k ${tail >= 0 ? "+" : "-"} ${Math.abs(tail)} = ${rightValue}`
          : `${leftSlope * join} + k = ${rightValue}`,
        "c1.continuity",
        {
          th: "ต่อเนื่องเมื่อสองข้างเท่ากันที่รอยต่อ ตั้งสมการได้เลย",
          en: "Continuity means the two sides agree at the join, which is an equation.",
        },
        { math: null },
      ),
      makeStep(
        `k = ${k}`,
        "eq.balance",
        { th: "แก้สมการหา k", en: "Solve it for k." },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: String(k) };

    return {
      ...shell(c1Continuity, rng, difficulty),
      prompt: {
        th: `จงหาค่า k ที่ทำให้ f ต่อเนื่องที่ x = ${join}`,
        en: `Find the k that makes f continuous at x = ${join}`,
      },
      stem: `f(x) = ${piecewise(leftBranch, rightBranch, join)}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ต่อเนื่องแปลว่าลิมิตซ้ายเท่ากับลิมิตขวา และเท่ากับค่าของฟังก์ชันที่จุดนั้น",
          en: "Continuous means both one-sided limits agree, and agree with the value there.",
        },
        {
          th: `หาค่าของแต่ละข้างที่ x = ${join} แล้วให้เท่ากัน`,
          en: `Work out each side at x = ${join} and set them equal.`,
        },
        {
          th: `ข้างขวาได้ ${rightValue}`,
          en: `The right-hand side comes to ${rightValue}.`,
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: String(-k) },
          explain: {
            th: "ย้ายข้างแล้วเครื่องหมายผิด ลองแทน k กลับเข้าไปแล้วดูว่าสองข้างเท่ากันหรือไม่",
            en: "A sign went the wrong way when moving a term across. Put k back in and see whether the sides really match.",
          },
        },
        {
          answer: { kind: "exact", value: String(rightValue) },
          explain: {
            th: "นั่นคือค่าของฟังก์ชันที่รอยต่อ ไม่ใช่ค่าของ k",
            en: "That is the function's value at the join, not the value of k.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/**
 * Difficulty 4: a removable discontinuity.
 *
 * The function is undefined at a point but has a perfectly good limit there,
 * so a single well-chosen value makes it continuous. That is what "removable"
 * means, and it is the cleanest illustration that a limit and a value are two
 * different things.
 */
function removable(rng: RNG, difficulty: number): Question {
  const point = rng.int(-4, 5);
  const other = rng.pick(
    [-6, -5, -3, -2, -1, 1, 2, 3, 4, 6].filter((root) => root !== point),
  );
  const scale = rng.pick([1, 1, 2, 3]);

  const numerator = sumTerms([
    coefficient(scale, "x^2") || null,
    coefficient(-scale * (point + other), "x") || null,
    scale * point * other === 0 ? null : String(scale * point * other),
  ]);
  const denominator = point === 0 ? "x" : point > 0 ? `x - ${point}` : `x + ${-point}`;
  const value = scale * (point - other);

  const steps: Step[] = [
    makeStep(
      `\\frac{${scale === 1 ? "" : scale}(${denominator})(x ${other > 0 ? "-" : "+"} ${Math.abs(other)})}{${denominator}}`,
      "calc.limit-factor-cancel",
      {
        th: "ตัวเศษกับตัวส่วนมีตัวประกอบร่วม",
        en: "Top and bottom share a factor.",
      },
      { math: null },
    ),
    makeStep(
      `\\lim_{x \\to ${point}} f(x) = ${value}`,
      "calc.limit-substitution",
      {
        th: `ตัดแล้วแทนค่า ได้ลิมิตเท่ากับ ${value}`,
        en: `Cancel, substitute, and the limit is ${value}.`,
      },
      { math: null },
    ),
    makeStep(
      `f(${point}) = ${value}`,
      "c1.continuity",
      {
        th: "กำหนดค่าที่จุดนั้นให้เท่ากับลิมิต รูโหว่ก็ถูกปิด",
        en: "Define the value there to be the limit, and the hole is filled.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: String(value) };

  return {
    ...shell(c1Continuity, rng, difficulty),
    prompt: {
      th: `ฟังก์ชันนี้ไม่มีค่าที่ x = ${point} จงหาค่าที่ควรกำหนดให้ f(${point}) เพื่อให้ f ต่อเนื่อง`,
      en: `This function is undefined at x = ${point}. What value of f(${point}) would make it continuous?`,
    },
    stem: `f(x) = \\frac{${numerator}}{${denominator}}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "ค่าที่ควรกำหนดคือค่าของลิมิตที่จุดนั้น ไม่มีค่าอื่นที่ใช้ได้",
        en: "The value to use is the limit there, and no other value will do.",
      },
      {
        th: "แทนค่าตรง ๆ จะได้ศูนย์ส่วนศูนย์ ต้องแยกตัวประกอบก่อน",
        en: "Substituting gives zero over zero, so factorise first.",
      },
      {
        th: `ตัดตัวประกอบร่วมแล้วแทนค่า x = ${point}`,
        en: `Cancel the shared factor, then put x = ${point} in.`,
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: "0" },
        explain: {
          th: "ศูนย์ส่วนศูนย์ไม่ได้แปลว่าศูนย์ ต้องจัดรูปก่อนจึงจะรู้ว่าลิมิตเป็นเท่าใด",
          en: "Zero over zero is not zero. Tidy it up first and the limit appears.",
        },
      },
      {
        answer: { kind: "exact", value: String(point) },
        explain: {
          th: "นั่นคือตำแหน่งของรูโหว่ โจทย์ถามค่าที่ควรกำหนดให้ตรงนั้น",
          en: "That is where the hole is, not how high it needs to be filled to.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/** The angles a trigonometric limit is built from. */
const COEFFICIENTS = [1, 2, 3, 4, 5, 6, 7, 8];

export const c1TrigLimit: Generator = {
  id: "c1.trig-limit",
  skillId: "c1.trig-limit",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const a = rng.pick(COEFFICIENTS);
    const b = rng.pick(COEFFICIENTS.filter((value) => value !== a));
    const outer = rng.int(1, 6);

    /*
     * Four shapes, each one step further from `\sin x / x`:
     *   1  sin(ax)/x           -> a
     *   2  sin(ax)/(bx)        -> a/b
     *   3  sin(ax)/sin(bx)     -> a/b, two limits at once
     *   4  tan(ax)/(bx)        -> a/b, since tan is sin over cos and cos -> 1
     */
    const shape = difficulty;
    const numeratorKatex =
      shape === 4 ? `\\tan ${a}x` : `\\sin ${a}x`;
    const denominatorKatex =
      shape === 1
        ? "x"
        : shape === 3
          ? `\\sin ${b}x`
          : `${b}x`;

    const scale = outer;

    const stem = `\\lim_{x \\to 0}${scale === 1 ? "" : scale}\\frac{${numeratorKatex}}{${denominatorKatex}}`;

    const answerMath =
      shape === 1 ? String(a * scale) : `${a * scale}/${b}`;

    const steps: Step[] = [
      makeStep(
        shape === 3
          ? `\\frac{\\frac{\\sin ${a}x}{${a}x} \\cdot ${a}x}{\\frac{\\sin ${b}x}{${b}x} \\cdot ${b}x}`
          : `\\frac{\\sin ${a}x}{${a}x} \\cdot \\frac{${a}x}{${denominatorKatex}}`,
        "c1.trig-limit",
        {
          th: `จัดให้แต่ละไซน์เข้าคู่กับมุมของตัวเอง โดยคูณและหารด้วย ${a}x`,
          en: `Pair each sine with its own angle by multiplying and dividing by ${a}x.`,
        },
        { math: null },
      ),
      makeStep(
        shape === 4
          ? `\\frac{\\sin ${a}x}{${a}x} \\cdot \\frac{1}{\\cos ${a}x} \\cdot \\frac{${a}}{${b}}`
          : `1 \\cdot \\frac{${a * scale}}{${shape === 1 ? 1 : b}}`,
        "c1.trig-limit",
        {
          th:
            shape === 4
              ? "เขียน \\tan เป็นไซน์ส่วนคอส แล้ว \\cos 0 = 1"
              : "แต่ละคู่ที่เข้าคู่กันเข้าใกล้หนึ่ง",
          en:
            shape === 4
              ? "Write tan as sine over cosine, and the cosine goes to one."
              : "Each matched pair approaches one.",
        },
        { math: null },
      ),
      makeStep(
        shape === 1 ? String(a * scale) : fraction(a * scale, b),
        "calc.limit-substitution",
        {
          th: "เหลือแต่อัตราส่วนของสัมประสิทธิ์",
          en: "What is left is the ratio of the coefficients.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: answerMath };

    return {
      ...shell(c1TrigLimit, rng, difficulty),
      prompt: { th: "จงหาค่าของลิมิตนี้", en: "Find the limit" },
      stem,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ลิมิตพื้นฐานคือ \\sin x ส่วน x เข้าใกล้หนึ่ง เมื่อมุมกับตัวหารตรงกัน",
          en: "The basic limit is sine over its own angle, which approaches one.",
        },
        {
          th: `ที่นี่มุมคือ ${a}x จึงต้องทำให้ตัวหารเป็น ${a}x ด้วย`,
          en: `Here the angle is ${a}x, so the denominator has to be made into ${a}x too.`,
        },
        {
          th: "คูณและหารด้วยจำนวนเดียวกัน ค่าไม่เปลี่ยน",
          en: "Multiplying and dividing by the same thing changes nothing.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: shape === 1 ? "1" : `${b}/${a * scale}`,
          },
          explain:
            shape === 1
              ? {
                  th: "ลิมิตเป็นหนึ่งเฉพาะเมื่อมุมกับตัวหารเหมือนกันทุกประการ ที่นี่ไม่เหมือน",
                  en: "It is one only when the angle and the denominator are identical, and here they are not.",
                }
              : {
                  th: "กลับเศษกับส่วน สัมประสิทธิ์ของมุมข้างบนอยู่ข้างบน",
                  en: "Upside down: the top angle's coefficient stays on top.",
                },
        },
        {
          answer: { kind: "exact", value: "0" },
          explain: {
            th: "ทั้งเศษและส่วนเข้าใกล้ศูนย์ แต่เข้าใกล้ด้วยอัตราที่ต่างกัน อัตราส่วนจึงไม่ใช่ศูนย์",
            en: "Both go to zero, but at different rates - and the ratio of those rates is the answer.",
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
