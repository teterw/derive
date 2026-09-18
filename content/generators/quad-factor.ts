import { coefficient, gcd, linearExpr, quadraticExpr, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type {
  Difficulty,
  Generator,
  Misconception,
  Question,
  RNG,
  Step,
} from "../types";

const TOPIC = "quadratic-equations";

const FACTOR_PROMPT = {
  th: "จงแยกตัวประกอบ",
  en: "Factorise",
};

type Built = {
  stem: string;
  answerKatex: string;
  answerMath: string;
  steps: Step[];
  hints: { th: string; en: string }[];
  misconceptions?: Misconception[];
};

function question(
  generator: { id: string; skillId: string },
  rng: RNG,
  difficulty: Difficulty,
  built: Built,
): Question {
  return {
    id: `${generator.id}:${rng.seed}:${difficulty}`,
    generatorId: generator.id,
    skillId: generator.skillId,
    topicId: TOPIC,
    difficulty,
    provenance: "generated",
    prompt: FACTOR_PROMPT,
    stem: built.stem,
    answer: { kind: "exact", value: built.answerMath },
    steps: built.steps,
    hints: built.hints,
    ...(built.misconceptions ? { misconceptions: built.misconceptions } : {}),
    rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
  };
}

/** `(x - 2)` written the way a factor is written, with the sign inside. */
function factorKatex(root: number, leading = 1): string {
  return `\\left(${linearExpr(leading, -root)}\\right)`;
}

function factorMath(root: number, leading = 1): string {
  const left = leading === 1 ? "x" : `${leading}*x`;
  return root === 0 ? `(${left})` : `(${left} ${root < 0 ? "+" : "-"} ${Math.abs(root)})`;
}

// ---------------------------------------------------------------------------
// แยกตัวประกอบด้วยตัวประกอบร่วม
// ---------------------------------------------------------------------------

export const quadFactorCommon: Generator = {
  id: "quad.factor-common",
  skillId: "quad.factor-common",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    /**
     * Backwards: choose the factored form `g x^p (terms)` first, then expand it
     * to get the question. The factorisation is therefore known, not searched
     * for.
     */
    const g = difficulty === 1 ? 1 : rng.int(2, difficulty >= 3 ? 6 : 4);
    const negative = difficulty === 4 && rng.bool(0.5);
    const outer = negative ? -g : g;
    const inner: number[] =
      difficulty >= 3
        ? [rng.int(1, 4), rng.nonZeroInt(-6, 6), rng.nonZeroInt(-9, 9)]
        : [rng.int(1, 5), rng.nonZeroInt(-9, 9)];

    // Make sure the inner bracket has no further common factor, or the
    // "fully factorised" answer would not be what we claim it is.
    const innerGcd = inner.reduce((acc, value) => gcd(acc, value), 0);
    if (innerGcd > 1) inner[0] = inner[0]! + 1;

    const degrees = inner.length === 3 ? [2, 1, 0] : [1, 0];
    const innerKatex = sumTerms(
      inner.map((value, index) =>
        degrees[index] === 0
          ? String(value)
          : coefficient(value, degrees[index] === 2 ? "x^2" : "x"),
      ),
    );
    const innerMath = inner
      .map((value, index) =>
        degrees[index] === 0
          ? `(${value})`
          : `(${value})*x^${degrees[index]}`,
      )
      .join(" + ");

    // Expanding: multiply each inner term by outer * x.
    const expandedTerms = inner.map((value, index) => ({
      coefficient: outer * value,
      degree: degrees[index]! + 1,
    }));

    const stem = sumTerms(
      expandedTerms.map((term) =>
        coefficient(
          term.coefficient,
          term.degree === 1 ? "x" : `x^${term.degree}`,
        ),
      ),
    );

    const answerKatex = `${coefficient(outer, "x")}\\left(${innerKatex}\\right)`;
    const answerMath = `(${outer})*x*(${innerMath})`;

    const splitKatex = sumTerms(
      expandedTerms.map((term, index) => {
        const rest =
          degrees[index] === 0
            ? String(inner[index])
            : coefficient(inner[index]!, degrees[index] === 2 ? "x^2" : "x");
        const restText = rest.startsWith("-")
          ? `\\left(${rest}\\right)`
          : rest;
        return `${coefficient(outer, "x")} \\cdot ${restText}`;
      }),
    );

    const steps: Step[] = [
      makeStep(splitKatex, "quad.common-factor", {
        th: `ทุกพจน์หารด้วย ${coefficient(outer, "x")} ลงตัว`,
        en: `Every term is divisible by ${coefficient(outer, "x")}.`,
      }),
      makeStep(answerKatex, "quad.common-factor", {
        th: `ดึง ${coefficient(outer, "x")} ออกมาไว้หน้าวงเล็บ`,
        en: `Pull ${coefficient(outer, "x")} outside the bracket.`,
      }),
    ];

    return question(quadFactorCommon, rng, difficulty, {
      stem,
      answerKatex,
      answerMath,
      steps,
      hints: [
        {
          th: "ทุกพจน์มีอะไรร่วมกันบ้าง ทั้งตัวเลขและตัวแปร",
          en: "What do all the terms share - a number, a variable, or both?",
        },
        {
          th: "ดึงตัวประกอบร่วมที่มากที่สุดออกมา",
          en: "Take out the greatest common factor.",
        },
        {
          th: `ตัวประกอบร่วมคือ ${coefficient(outer, "x")}`,
          en: `The common factor is ${coefficient(outer, "x")}.`,
        },
      ],
    });
  },
};

// ---------------------------------------------------------------------------
// แยกตัวประกอบตรีนาม
// ---------------------------------------------------------------------------

export const quadFactorTrinomial: Generator = {
  id: "quad.factor-trinomial",
  skillId: "quad.factor-trinomial",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty <= 2) {
      // (x - p)(x - q), chosen first, then expanded.
      const range = difficulty === 1 ? 6 : 9;
      const p = difficulty === 1 ? rng.int(1, range) : rng.nonZeroInt(-range, range);
      const q = difficulty === 1 ? rng.int(1, range) : rng.nonZeroInt(-range, range);
      const b = -(p + q);
      const c = p * q;

      const stem = quadraticExpr(1, b, c);
      const answerKatex = `${factorKatex(p)}${factorKatex(q)}`;
      const answerMath = `${factorMath(p)}*${factorMath(q)}`;

      return question(quadFactorTrinomial, rng, difficulty, {
        stem,
        answerKatex,
        answerMath,
        /**
         * Copying the signs of the middle and constant terms straight into
         * the brackets, without working out what multiplies to what.
         */
        misconceptions: namedMistakes(
          { kind: "exact", value: answerMath },
          [
            {
              answer: {
                kind: "exact",
                value: `${factorMath(-p)}*${factorMath(-q)}`,
              },
              explain: {
                th: `ลองคูณกลับดู จะได้ ${quadraticExpr(1, -b, c)} ซึ่งไม่ตรงกับโจทย์ - เครื่องหมายในวงเล็บกลับด้าน`,
                en: `Multiply that back out and you get ${quadraticExpr(1, -b, c)}, which is not the question - the signs in the brackets are the wrong way round.`,
              },
            },
          ],
        ),
        steps: [
          makeStep(
            `${factorKatex(p)}${factorKatex(q)}`,
            "quad.trinomial-pattern",
            {
              th: `หาสองจำนวนที่คูณกันได้ ${c} และบวกกันได้ ${b}: ได้ ${-p} กับ ${-q}`,
              en: `Find two numbers multiplying to ${c} and adding to ${b}: ${-p} and ${-q}.`,
            },
          ),
        ],
        hints: [
          {
            th: `มองหาสองจำนวนที่คูณกันได้ ${c}`,
            en: `Look for two numbers whose product is ${c}.`,
          },
          {
            th: `และสองจำนวนนั้นต้องบวกกันได้ ${b}`,
            en: `Those two numbers must also add to ${b}.`,
          },
          {
            th: `ลอง ${-p} กับ ${-q}`,
            en: `Try ${-p} and ${-q}.`,
          },
        ],
      });
    }

    if (difficulty === 3) {
      // (ax - m)(x - n): a leading coefficient, so the middle term is no
      // longer just the sum.
      const a = rng.int(2, 5);
      const m = rng.nonZeroInt(-6, 6);
      const n = rng.nonZeroInt(-6, 6);
      const b = -(a * n + m);
      const c = m * n;

      const stem = quadraticExpr(a, b, c);
      const answerKatex = `${factorKatex(m, a)}${factorKatex(n)}`;
      const answerMath = `${factorMath(m, a)}*${factorMath(n)}`;

      return question(quadFactorTrinomial, rng, difficulty, {
        stem,
        answerKatex,
        answerMath,
        steps: [
          makeStep(
            `${factorKatex(m, a)}${factorKatex(n)}`,
            "quad.trinomial-pattern",
            {
              th: `สัมประสิทธิ์หน้า x^2 คือ ${a} จึงต้องแยกเป็น ${linearExpr(a, -m)} คูณกับ ${linearExpr(1, -n)}`,
              en: `The leading coefficient is ${a}, so the factors are ${linearExpr(a, -m)} and ${linearExpr(1, -n)}.`,
            },
          ),
          makeStep(stem, "arith.distribute", {
            th: "ตรวจคำตอบด้วยการคูณกระจายกลับ",
            en: "Check by multiplying back out.",
          }),
        ],
        hints: [
          {
            th: `สัมประสิทธิ์หน้า x^2 ไม่ใช่ 1 แล้ว`,
            en: `The coefficient of x^2 is no longer 1.`,
          },
          {
            th: `พจน์หน้าของวงเล็บหนึ่งต้องเป็น ${a}x`,
            en: `One bracket has to start with ${a}x.`,
          },
          {
            th: `ผลคูณของพจน์ท้ายคือ ${c}`,
            en: `The last terms multiply to ${c}.`,
          },
        ],
      });
    }

    // Difficulty 4: a common factor hiding in front of a trinomial. Taking it
    // out first is the whole trap.
    const g = rng.int(2, 5);
    const p = rng.nonZeroInt(-6, 6);
    const q = rng.nonZeroInt(-6, 6);
    const b = -(p + q);
    const c = p * q;

    const inner = quadraticExpr(1, b, c);
    const stem = quadraticExpr(g, g * b, g * c);
    const answerKatex = `${g}${factorKatex(p)}${factorKatex(q)}`;
    const answerMath = `${g}*${factorMath(p)}*${factorMath(q)}`;

    return question(quadFactorTrinomial, rng, difficulty, {
      stem,
      answerKatex,
      answerMath,
      steps: [
        makeStep(`${g}\\left(${inner}\\right)`, "quad.common-factor", {
          th: `ทุกพจน์หารด้วย ${g} ลงตัว ดึงออกมาก่อน`,
          en: `Every term is divisible by ${g}, so take it out first.`,
        }),
        makeStep(answerKatex, "quad.trinomial-pattern", {
          th: `แยกตรีนามข้างในต่อ: สองจำนวนที่คูณกันได้ ${c} และบวกกันได้ ${b} คือ ${-p} กับ ${-q}`,
          en: `Now factor the trinomial: ${-p} and ${-q} multiply to ${c} and add to ${b}.`,
        }),
      ],
      hints: [
        {
          th: "ก่อนจะแยกตรีนาม ลองดูว่ามีตัวประกอบร่วมหรือไม่",
          en: "Before factoring the trinomial, check for a common factor.",
        },
        {
          th: `ทุกพจน์หารด้วย ${g} ลงตัว`,
          en: `Every term is divisible by ${g}.`,
        },
        {
          th: `เหลือ ${inner} ให้แยกต่อ`,
          en: `That leaves ${inner} to factor.`,
        },
      ],
    });
  },
};

// ---------------------------------------------------------------------------
// ผลต่างกำลังสอง
// ---------------------------------------------------------------------------

export const quadDiffSquares: Generator = {
  id: "quad.diff-squares",
  skillId: "quad.diff-squares",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 1) {
      const k = rng.int(2, 20);
      const stem = `x^2 - ${k * k}`;
      const answerKatex = `\\left(x - ${k}\\right)\\left(x + ${k}\\right)`;
      return question(quadDiffSquares, rng, difficulty, {
        stem,
        answerKatex,
        answerMath: `(x - ${k})*(x + ${k})`,
        steps: [
          makeStep(`x^2 - ${k}^2`, "quad.diff-squares", {
            th: `${k * k} = ${k}^2 จึงเป็นผลต่างกำลังสอง`,
            en: `${k * k} = ${k}^2, so this is a difference of squares.`,
          }),
          makeStep(answerKatex, "quad.diff-squares", {
            th: "แยกเป็นผลต่างคูณผลบวก",
            en: "Split into a difference times a sum.",
          }),
        ],
        hints: [
          {
            th: "ไม่มีพจน์ x เลย และเป็นการลบ",
            en: "There is no x term, and it is a subtraction.",
          },
          { th: `${k * k} เป็นกำลังสองของอะไร`, en: `${k * k} is the square of what?` },
          { th: "ใช้สูตรผลต่างกำลังสอง", en: "Use the difference of squares." },
        ],
      });
    }

    if (difficulty === 2) {
      const a = rng.int(2, 7);
      const k = rng.int(2, 9);
      const stem = `${a * a}x^2 - ${k * k}`;
      const answerKatex = `\\left(${a}x - ${k}\\right)\\left(${a}x + ${k}\\right)`;
      return question(quadDiffSquares, rng, difficulty, {
        stem,
        answerKatex,
        answerMath: `(${a}*x - ${k})*(${a}*x + ${k})`,
        steps: [
          makeStep(`\\left(${a}x\\right)^2 - ${k}^2`, "quad.diff-squares", {
            th: `${a * a}x^2 = \\left(${a}x\\right)^2 และ ${k * k} = ${k}^2`,
            en: `${a * a}x^2 = \\left(${a}x\\right)^2 and ${k * k} = ${k}^2.`,
          }),
          makeStep(answerKatex, "quad.diff-squares", {
            th: "แยกเป็นผลต่างคูณผลบวก",
            en: "Split into a difference times a sum.",
          }),
        ],
        hints: [
          {
            th: "พจน์หน้าก็เป็นกำลังสองเหมือนกัน",
            en: "The first term is a square as well.",
          },
          { th: `${a * a}x^2 = \\left(${a}x\\right)^2`, en: `${a * a}x^2 = \\left(${a}x\\right)^2.` },
          { th: "ใช้สูตรผลต่างกำลังสอง", en: "Use the difference of squares." },
        ],
      });
    }

    if (difficulty === 3) {
      // A common factor first, then the difference of squares.
      const g = rng.int(2, 6);
      const k = rng.int(2, 8);
      const stem = `${g}x^2 - ${g * k * k}`;
      const answerKatex = `${g}\\left(x - ${k}\\right)\\left(x + ${k}\\right)`;
      return question(quadDiffSquares, rng, difficulty, {
        stem,
        answerKatex,
        answerMath: `${g}*(x - ${k})*(x + ${k})`,
        steps: [
          makeStep(`${g}\\left(x^2 - ${k * k}\\right)`, "quad.common-factor", {
            th: `ดึงตัวประกอบร่วม ${g} ออกมาก่อน`,
            en: `Take out the common factor ${g} first.`,
          }),
          makeStep(answerKatex, "quad.diff-squares", {
            th: `x^2 - ${k * k} เป็นผลต่างกำลังสอง`,
            en: `x^2 - ${k * k} is a difference of squares.`,
          }),
        ],
        hints: [
          {
            th: `${g}x^2 ไม่ใช่กำลังสองสมบูรณ์ ลองดูตัวประกอบร่วมก่อน`,
            en: `${g}x^2 is not a perfect square - look for a common factor first.`,
          },
          { th: `ดึง ${g} ออกมา`, en: `Take out the ${g}.` },
          {
            th: `เหลือ x^2 - ${k * k}`,
            en: `That leaves x^2 - ${k * k}.`,
          },
        ],
      });
    }

    // Difficulty 4: a fourth power, which factors twice - and the sum of
    // squares that comes out of it does not factor at all.
    const k = rng.int(2, 7);
    const a = rng.int(1, 3);
    const ax = coefficient(a, "x");
    const axSquared = coefficient(a * a, "x^2");
    const stem = `${coefficient(a ** 4, "x^4")} - ${k ** 4}`;
    const answerKatex = `\\left(${ax} - ${k}\\right)\\left(${ax} + ${k}\\right)\\left(${axSquared} + ${k * k}\\right)`;
    const axMath = a === 1 ? "x" : `${a}*x`;
    return question(quadDiffSquares, rng, difficulty, {
      stem,
      answerKatex,
      answerMath: `(${axMath} - ${k})*(${axMath} + ${k})*(${a * a}*x^2 + ${k * k})`,
      steps: [
        makeStep(
          `\\left(${axSquared}\\right)^2 - \\left(${k * k}\\right)^2`,
          "quad.diff-squares",
          {
            th: `${coefficient(a ** 4, "x^4")} = \\left(${axSquared}\\right)^2 และ ${k ** 4} = ${k * k}^2`,
            en: `${coefficient(a ** 4, "x^4")} = \\left(${axSquared}\\right)^2 and ${k ** 4} = ${k * k}^2.`,
          },
        ),
        makeStep(
          `\\left(${axSquared} - ${k * k}\\right)\\left(${axSquared} + ${k * k}\\right)`,
          "quad.diff-squares",
          {
            th: "แยกครั้งแรก",
            en: "Factor once.",
          },
        ),
        makeStep(answerKatex, "quad.diff-squares", {
          th: `${axSquared} - ${k * k} ยังแยกได้อีก ส่วน ${axSquared} + ${k * k} แยกต่อไม่ได้ในจำนวนจริง`,
          en: `${axSquared} - ${k * k} factors again; ${axSquared} + ${k * k} does not, over the reals.`,
        }),
      ],
      hints: [
        {
          th: `${coefficient(a ** 4, "x^4")} ก็เป็นกำลังสองของ ${axSquared}`,
          en: `${coefficient(a ** 4, "x^4")} is the square of ${axSquared}.`,
        },
        { th: "แยกแล้วดูว่าแยกต่อได้อีกหรือไม่", en: "Factor, then check whether you can factor again." },
        {
          th: `ผลบวกของกำลังสอง ${axSquared} + ${k * k} แยกต่อไม่ได้`,
          en: `A sum of squares, ${axSquared} + ${k * k}, does not factor.`,
        },
      ],
    });
  },
};
