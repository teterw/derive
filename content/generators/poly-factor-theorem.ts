import { coefficient, linearExpr, paren, sumTerms } from "../format";
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

const TOPIC = "poly.factor-higher";

const PROMPT = {
  th: "จงแยกตัวประกอบ",
  en: "Factorise",
};

/**
 * ทฤษฎีบทตัวประกอบ.
 *
 * Built backwards from the roots, so the value that makes the polynomial zero
 * is chosen rather than searched for - which is the only way the derivation
 * can be trusted, and also the only way to guarantee the question has integer
 * roots to find at all.
 *
 * The first step is the substitution, written out in full rather than asserted:
 * `\left(1\right)^3 - 6\left(1\right)^2 + 11\left(1\right) - 6 = 0` is the
 * whole content of the theorem, and a step that said "1 is a root" instead
 * would be asking the learner to take it on trust. It carries its own `chain`
 * because it is an arithmetic check, not a link in the factorisation - the
 * property gate would otherwise compare a number against a polynomial.
 *
 * The ladder is about what you find, not how hard the arithmetic is: three
 * separate roots, then signs, then a repeated root, then a cubic with only one
 * rational root at all - where the answer is a linear factor times a quadratic
 * that has to be left alone.
 */
type Shape = {
  /** Linear factors as their roots: `(x - r)` for each. */
  roots: number[];
  /** Difficulty 4 only: an irreducible `x^2 + ux + v` left at the end. */
  quadratic: { u: number; v: number } | null;
};

function shapeFor(rng: RNG, difficulty: Difficulty): Shape {
  if (difficulty === 4) {
    /*
     * One rational root and a quadratic that does not factor over the
     * rationals: `v > u^2/4` makes the discriminant negative, so the answer
     * really is finished at two brackets.
     */
    const u = rng.int(-4, 4);
    const v = rng.int(Math.floor((u * u) / 4) + 1, 9);
    return { roots: [rng.nonZeroInt(-5, 5)], quadratic: { u, v } };
  }

  if (difficulty === 3) {
    // A repeated root: the quadratic left after dividing is a perfect square.
    const repeated = rng.nonZeroInt(-5, 5);
    const other = rng.pick(NON_ZERO.filter((value) => value !== repeated));
    return { roots: [repeated, repeated, other], quadratic: null };
  }

  const pool = difficulty === 1 ? [1, 2, 3, 4, 5, 6] : NON_ZERO;
  const roots = rng.shuffle(pool).slice(0, 3);
  return { roots: roots.sort((a, b) => a - b), quadratic: null };
}

const NON_ZERO = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];

/** `x^2 + ux + v` written out, with zero terms dropped. */
function quadraticExprFrom(u: number, v: number): string {
  return sumTerms(["x^2", coefficient(u, "x"), String(v)]);
}

/**
 * The linear factors, with a repeated one written squared rather than twice.
 *
 * `(x - 2)(x - 2)(x - 5)` is the same expression as `(x - 2)^2(x - 5)` and
 * the marker accepts both, but only one of them is how anybody writes it -
 * and the model answer is the one the learner copies.
 */
function factorsFrom(roots: number[]): { katex: string; math: string } {
  const counts = new Map<number, number>();
  for (const root of roots) counts.set(root, (counts.get(root) ?? 0) + 1);

  const written = [...counts].map(([root, count]) => {
    const katex = paren(linearExpr(1, -root));
    const math = `(${linearExpr(1, -root)})`;
    return count === 1
      ? { katex, math }
      : { katex: `${katex}^${count}`, math: `${math}^${count}` };
  });

  return {
    katex: written.map((part) => part.katex).join(""),
    math: written.map((part) => part.math).join("*"),
  };
}

function build(rng: RNG, difficulty: Difficulty) {
  const { roots, quadratic } = shapeFor(rng, difficulty);

  /** The cubic's coefficients, from the factors it was built out of. */
  const tail = quadratic
    ? { u: quadratic.u, v: quadratic.v }
    : {
        u: -(roots[1]! + roots[2]!),
        v: roots[1]! * roots[2]!,
      };
  const first = roots[0]!;
  const b = tail.u - first;
  const c = tail.v - first * tail.u;
  const d = -first * tail.v;

  const stem = sumTerms([
    "x^3",
    coefficient(b, "x^2"),
    coefficient(c, "x"),
    String(d),
  ]);

  const substituted = `${sumTerms([
    `${paren(String(first))}^3`,
    coefficient(b, `${paren(String(first))}^2`),
    coefficient(c, paren(String(first))),
    String(d),
  ])} = 0`;

  const quotient = quadraticExprFrom(tail.u, tail.v);
  const divided = `${paren(linearExpr(1, -first))}${paren(quotient)}`;

  const factored = factorsFrom(roots);
  const answerKatex = quadratic ? divided : factored.katex;
  const answerMath = quadratic
    ? `(${linearExpr(1, -first)})*(${quotient})`
    : factored.math;

  const steps: Step[] = [
    makeStep(
      substituted,
      "poly.factor-theorem",
      {
        th: `ลองค่าที่หาร ${d} ลงตัวก่อน แทน x ด้วย ${first} แล้วได้ศูนย์ ดังนั้น ${paren(linearExpr(1, -first))} เป็นตัวประกอบ`,
        en: `Try the values that divide ${d}. Putting ${first} in for x gives zero, so ${paren(linearExpr(1, -first))} is a factor.`,
      },
      // An arithmetic check, not a link in the factorisation.
      { chain: "root" },
    ),
    /*
     * When the quotient does not factor, the division *is* the answer - so
     * "and it stops here" goes in this step's explanation rather than in a
     * step of its own. A step whose expression is identical to the one above
     * it reads as a mistake in the working, and a learner who has been told
     * "keep factoring" needs to be told what finished looks like, not shown
     * the same line twice.
     */
    makeStep(divided, "poly.divide-by-factor", {
      th: quadratic
        ? `หารด้วย ${paren(linearExpr(1, -first))} เหลือ ${paren(quotient)} และไม่มีเศษ ส่วน ${quotient} มีดิสคริมิแนนต์ ${tail.u * tail.u - 4 * tail.v} ซึ่งเป็นลบ จึงแยกต่อไม่ได้ในจำนวนจริง แยกได้แค่นี้`
        : `หารด้วย ${paren(linearExpr(1, -first))} เหลือ ${paren(quotient)} และไม่มีเศษ`,
      en: quadratic
        ? `Divide by ${paren(linearExpr(1, -first))}: the quotient is ${paren(quotient)}, with no remainder. Its discriminant is ${tail.u * tail.u - 4 * tail.v}, which is negative, so it does not factor over the reals. This is as far as it goes.`
        : `Divide by ${paren(linearExpr(1, -first))}: the quotient is ${paren(quotient)}, with no remainder.`,
    }),
  ];

  if (!quadratic) {
    steps.push(
      makeStep(answerKatex, "quad.trinomial-pattern", {
        th: `แยก ${quotient} ต่อ: สองจำนวนที่คูณกันได้ ${tail.v} และบวกกันได้ ${tail.u} คือ ${-roots[1]!} กับ ${-roots[2]!}`,
        en: `Factor ${quotient}: two numbers multiplying to ${tail.v} and adding to ${tail.u} are ${-roots[1]!} and ${-roots[2]!}.`,
      }),
    );
  }

  const misconceptions: Misconception[] = namedMistakes(
    { kind: "exact", value: answerMath },
    [
      /*
       * The direction of the theorem. `P(2) = 0` means `(x - 2)` is a factor,
       * not `(x + 2)`, and reading it the other way round is the mistake this
       * skill exists to name.
       */
      {
        answer: {
          kind: "exact",
          value: quadratic
            ? `(${linearExpr(1, first)})*(${quotient})`
            : factorsFrom(roots.map((root) => -root)).math,
        },
        explain: {
          th: `แทน x ด้วย ${first} แล้วได้ศูนย์ แปลว่าตัวประกอบคือ ${paren(linearExpr(1, -first))} ไม่ใช่ ${paren(linearExpr(1, first))} เพราะเครื่องหมายกลับด้านกับค่าที่แทน`,
          en: `x = ${first} giving zero means the factor is ${paren(linearExpr(1, -first))}, not ${paren(linearExpr(1, first))}: the sign is the opposite of the value you substituted.`,
        },
      },
    ],
  );

  return {
    stem,
    answerKatex,
    answerMath,
    steps,
    misconceptions,
    hints: [
      {
        th: `ดีกรีสาม แยกตรง ๆ ไม่ได้ ลองหาค่าที่แทนแล้ว P(x) เป็นศูนย์ก่อน`,
        en: `A cubic will not factor by pattern. Start by finding a value that makes it zero.`,
      },
      {
        th: `ค่าที่ควรลองคือตัวประกอบของพจน์คงที่ ${d}`,
        en: `The values worth trying are the factors of the constant term, ${d}.`,
      },
      {
        th: `แทน x ด้วย ${first} แล้วได้ศูนย์ จึงหารด้วย ${paren(linearExpr(1, -first))} ได้ลงตัว`,
        en: `x = ${first} gives zero, so it divides exactly by ${paren(linearExpr(1, -first))}.`,
      },
    ],
  };
}

export const polyFactorTheorem: Generator = {
  id: "poly.factor-theorem",
  skillId: "poly.factor-theorem",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const built = build(rng, difficulty);
    return {
      id: `${polyFactorTheorem.id}:${rng.seed}:${difficulty}`,
      generatorId: polyFactorTheorem.id,
      skillId: polyFactorTheorem.skillId,
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
