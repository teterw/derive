import { coefficient, gcd, paren, sumTerms } from "../format";
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

const TOPIC = "poly.factor-degree-2";

const PROMPT = {
  th: "จงแยกตัวประกอบ",
  en: "Factorise",
};

/**
 * แยกตัวประกอบพหุนามสองตัวแปร.
 *
 * Nothing new is being taught here - the patterns are the ones the learner
 * already has. What is new is that the last term is `y^2` rather than a
 * number, and the thing that goes wrong is dropping the `y` on the way into
 * the brackets: `x^2 + 5xy + 6y^2` answered `(x + 2)(x + 3)`. That is the
 * named wrong answer on every trinomial this generator makes.
 *
 * **`xy` is two variables.** mathjs reads a bare `xy` as a single symbol of
 * that name, so an answer written `(x + 2y)(x + 3y)` and a stem written
 * `x^2 + 5xy + 6y^2` would be expressions in different alphabets and would
 * never be found equivalent. `insertImplicitMultiplication` splits the run
 * (see `lib/math/katex.ts`); the answer strings here also keep the `*`
 * explicit, because an `Answer.value` is mathjs source and is never
 * normalised on its way to the checker.
 */

/** `3x - 4y`, written the way a book writes it. */
function binomial(a: number, b: number): string {
  return sumTerms([coefficient(a, "x"), coefficient(b, "y")]);
}

/** The same thing as mathjs source, with nothing left implicit. */
function binomialMath(a: number, b: number): string {
  return sumTerms([coefficient(a, "x"), coefficient(b, "y")]).replace(
    /(\d)([xy])/g,
    "$1*$2",
  );
}

type Built = {
  stem: string;
  answerKatex: string;
  answerMath: string;
  steps: Step[];
  hints: { th: string; en: string }[];
  misconceptions: Misconception[];
};

/** `a^2x^2 - b^2y^2`, possibly with a common factor in front. */
function differenceOfSquares(rng: RNG, g: number): Built {
  const a = rng.int(1, 5);
  /*
   * `b` starts at 2 so the second square is never a bare `y`: with a = b = 1
   * the question is `x^2 - y^2`, and the step that names the two squares comes
   * out character-for-character identical to the question it is explaining.
   */
  let b = rng.int(2, 7);
  while (gcd(a, b) !== 1) b += 1;

  const stem = sumTerms([
    coefficient(g * a * a, "x^2"),
    coefficient(-g * b * b, "y^2"),
  ]);
  const inner = `${paren(binomial(a, -b))}${paren(binomial(a, b))}`;
  const answerKatex = g === 1 ? inner : `${g}${inner}`;
  const answerMath = `${g === 1 ? "" : `${g}*`}(${binomialMath(a, -b)})*(${binomialMath(a, b)})`;

  const steps: Step[] = [];
  if (g > 1) {
    steps.push(
      makeStep(
        `${g}${paren(sumTerms([coefficient(a * a, "x^2"), coefficient(-b * b, "y^2")]))}`,
        "quad.common-factor",
        {
          th: `ทุกพจน์หารด้วย ${g} ลงตัว ดึงออกมาก่อน`,
          en: `Every term is divisible by ${g}, so take it out first.`,
        },
      ),
    );
  }

  const squares = sumTerms([
    `${paren(coefficient(a, "x"))}^2`,
    `-${paren(coefficient(b, "y"))}^2`,
  ]);

  steps.push(
    makeStep(g === 1 ? squares : `${g}${paren(squares)}`, "quad.diff-squares", {
      th: `${coefficient(a * a, "x^2")} คือ ${paren(coefficient(a, "x"))}^2 และ ${coefficient(b * b, "y^2")} คือ ${paren(coefficient(b, "y"))}^2`,
      en: `${coefficient(a * a, "x^2")} is ${paren(coefficient(a, "x"))}^2, and ${coefficient(b * b, "y^2")} is ${paren(coefficient(b, "y"))}^2.`,
    }),
    makeStep(answerKatex, "quad.diff-squares", {
      th: "ผลต่างกำลังสอง แยกเป็นผลต่างคูณผลบวก",
      en: "A difference of squares: a difference times a sum.",
    }),
  );

  return {
    stem,
    answerKatex,
    answerMath,
    steps,
    misconceptions: namedMistakes({ kind: "exact", value: answerMath }, [
      {
        answer: {
          kind: "exact",
          value: `${g === 1 ? "" : `${g}*`}(${binomialMath(a, -b)})^2`,
        },
        explain: {
          th: `${paren(binomial(a, -b))}^2 คูณกลับได้พจน์ ${coefficient(-2 * a * b, "xy")} โผล่มา ผลต่างกำลังสองต้องเป็นผลต่างคูณผลบวก`,
          en: `${paren(binomial(a, -b))}^2 multiplies back with an ${coefficient(-2 * a * b, "xy")} term in it. A difference of squares is a difference times a sum.`,
        },
      },
    ]),
    hints: [
      {
        // `$...$`: a bare `xy` is two letters, which the segmenter reads as an
        // English word rather than as notation.
        th: "ไม่มีพจน์ $xy$ เลย และเป็นการลบ",
        en: "There is no $xy$ term, and it is a subtraction.",
      },
      {
        th: `พจน์ทั้งสองเป็นกำลังสองของอะไร - ${coefficient(g * a * a, "x^2")} และ ${coefficient(g * b * b, "y^2")}`,
        en: `What are the two terms squares of - ${coefficient(g * a * a, "x^2")} and ${coefficient(g * b * b, "y^2")}?`,
      },
      {
        th: "ใช้สูตรผลต่างกำลังสองเหมือนตัวแปรเดียว แต่พจน์หลังมี y",
        en: "The same difference of squares as ever; the second term just carries a y.",
      },
    ],
  };
}

/** `Ax^2 + (Aq + p)xy + pq\\,y^2` from `(Ax + py)(x + qy)`. */
function trinomial(rng: RNG, difficulty: Difficulty): Built {
  const a = difficulty >= 3 ? rng.int(2, 4) : 1;
  let p = rng.nonZeroInt(-6, 6);
  let q = rng.nonZeroInt(-6, 6);
  while (gcd(a, p) !== 1) p += p < 0 ? -1 : 1;
  /*
   * With a = 1 the two brackets are `(x + py)` and `(x + qy)`, and equal p and
   * q make them the same bracket - an answer nobody writes as a product when
   * they could write it squared. With a >= 2 they differ anyway.
   */
  if (a === 1 && p === q) q = q >= 6 ? q - 1 : q + 1;

  const middle = a * q + p;
  const last = p * q;

  const stem = sumTerms([
    coefficient(a, "x^2"),
    coefficient(middle, "xy"),
    coefficient(last, "y^2"),
  ]);
  const answerKatex = `${paren(binomial(a, p))}${paren(binomial(1, q))}`;
  const answerMath = `(${binomialMath(a, p)})*(${binomialMath(1, q)})`;

  const steps: Step[] = [
    makeStep(answerKatex, "poly.two-variable-pattern", {
      th:
        a === 1
          ? `หาสองจำนวนที่คูณกันได้ ${last} และบวกกันได้ ${middle}: ได้ ${p} กับ ${q} แล้วติด y ไปด้วยทั้งคู่`
          : `สัมประสิทธิ์หน้า x^2 คือ ${a} จึงแยกเป็น ${paren(binomial(a, p))} คูณกับ ${paren(binomial(1, q))}`,
      en:
        a === 1
          ? `Two numbers multiplying to ${last} and adding to ${middle}: ${p} and ${q}, each carrying a y.`
          : `The coefficient of x^2 is ${a}, so the factors are ${paren(binomial(a, p))} and ${paren(binomial(1, q))}.`,
    }),
    makeStep(stem, "arith.distribute", {
      th: "ตรวจคำตอบด้วยการคูณกระจายกลับ",
      en: "Check by multiplying back out.",
    }),
  ];

  return {
    stem,
    answerKatex,
    answerMath,
    steps,
    misconceptions: namedMistakes({ kind: "exact", value: answerMath }, [
      /*
       * The whole skill in one wrong answer: the numbers worked out correctly
       * and then written against nothing.
       */
      {
        answer: {
          kind: "exact",
          value: `(${sumTerms([coefficient(a, "x"), String(p)])})*(${sumTerms([
            "x",
            String(q),
          ])})`,
        },
        explain: {
          th: `ตัวเลขถูกแล้ว แต่ลืม $y$ ถ้าคูณกลับจะได้พจน์ท้ายเป็น ${last} เฉย ๆ ไม่ใช่ ${coefficient(last, "y^2")}`,
          en: `The numbers are right, but the y is missing: multiplied back out the last term is a bare ${last}, not ${coefficient(last, "y^2")}.`,
        },
      },
    ]),
    hints: [
      {
        th: "ทำเหมือนตรีนามตัวแปรเดียว มอง y เป็นหน่วยที่ติดไปกับพจน์ท้าย",
        en: "Treat it as an ordinary trinomial; the y just rides along in the last term.",
      },
      {
        th: `มองหาสองจำนวนที่คูณกันได้ ${last} และเข้ากับพจน์กลาง ${coefficient(middle, "xy")}`,
        en: `Look for two numbers multiplying to ${last} that fit the middle term ${coefficient(middle, "xy")}.`,
      },
      {
        th: `พจน์ท้ายของวงเล็บคือ ${coefficient(p, "y")} และ ${coefficient(q, "y")} คือต้องมี $y$ ติดอยู่ทั้งคู่`,
        en: `The last terms are ${coefficient(p, "y")} and ${coefficient(q, "y")}, and both carry a y.`,
      },
    ],
  };
}

export const polyTwoVariables: Generator = {
  id: "poly.two-variables",
  skillId: "poly.two-variables",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const built =
      difficulty === 1
        ? differenceOfSquares(rng, 1)
        : difficulty === 4
          ? differenceOfSquares(rng, rng.int(2, 5))
          : trinomial(rng, difficulty);

    return {
      id: `${polyTwoVariables.id}:${rng.seed}:${difficulty}`,
      generatorId: polyTwoVariables.id,
      skillId: polyTwoVariables.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: PROMPT,
      stem: built.stem,
      answer: { kind: "exact", value: built.answerMath },
      steps: built.steps,
      hints: built.hints,
      ...(built.misconceptions.length
        ? { misconceptions: built.misconceptions }
        : {}),
      rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
    };
  },
};
