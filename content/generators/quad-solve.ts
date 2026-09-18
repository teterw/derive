import {
  fraction,
  linearExpr,
  orJoin,
  quadraticExpr,
  reduceFraction,
} from "../format";
import { makeStep } from "../step";
import type { Generator, Question, Step } from "../types";

const TOPIC = "quadratic-equations";
const SKILL = "quad.solve-by-factoring";

const SOLVE_PROMPT = {
  th: "จงหาคำตอบของสมการ",
  en: "Solve the equation",
};

/** `x = 2 หรือ x = 3` - the line a solution ends on, in both languages. */
function rootsLine(roots: string[]): { th: string; en: string } {
  return orJoin(roots.map((root) => `x = ${root}`));
}

/** Two solution sets, compared as sets. */
function sameSet(a: string[], b: string[]): boolean {
  const normalise = (values: string[]) =>
    [...values].map(Number).sort((x, y) => x - y).join(",");
  return normalise(a) === normalise(b);
}

function factorKatex(a: number, constant: number): string {
  return `\\left(${linearExpr(a, constant)}\\right)`;
}

// ---------------------------------------------------------------------------
// แก้สมการโดยการแยกตัวประกอบ, a = 1
// ---------------------------------------------------------------------------

export const quadSolveFactorSimple: Generator = {
  id: "quad.solve-factor-simple",
  skillId: SKILL,
  difficulties: [1, 2, 3],
  provenance: "generated",

  generate(rng, difficulty): Question {
    /**
     * Backwards from the roots: pick `p` and `q`, and the equation is
     * `(x - p)(x - q) = 0`. Every step below is therefore known to be true,
     * including the factorisation.
     */
    const range = difficulty === 1 ? 6 : 9;
    const p = difficulty === 1 ? rng.int(1, range) : rng.nonZeroInt(-range, range);
    const q = difficulty === 1 ? rng.int(1, range) : rng.nonZeroInt(-range, range);
    const b = -(p + q);
    const c = p * q;

    const standard = `${quadraticExpr(1, b, c)} = 0`;
    const steps: Step[] = [];

    // Difficulty 3 hides the standard form: the learner has to rearrange first.
    const rearranged = difficulty === 3;
    const stem = rearranged ? `x^2 = ${quadraticExpr(0, -b, -c)}` : standard;

    if (rearranged) {
      steps.push(
        makeStep(standard, "eq.move-term", {
          th: "ย้ายทุกพจน์มาไว้ข้างเดียวกันให้เท่ากับศูนย์ก่อน",
          en: "Move every term to one side so that it equals zero.",
        }),
      );
    }

    const alternatives = orJoin([
      `${linearExpr(1, -p)} = 0`,
      `${linearExpr(1, -q)} = 0`,
    ]);
    const solution = rootsLine([String(p), String(q)]);

    steps.push(
      makeStep(
        `${factorKatex(1, -p)}${factorKatex(1, -q)} = 0`,
        "quad.trinomial-pattern",
        {
          th: `สองจำนวนที่คูณกันได้ ${c} และบวกกันได้ ${b} คือ ${-p} กับ ${-q}`,
          en: `${-p} and ${-q} multiply to ${c} and add to ${b}.`,
        },
      ),
      makeStep(
        alternatives.th,
        "quad.zero-product",
        {
          th: "ผลคูณเป็นศูนย์ แสดงว่าต้องมีตัวใดตัวหนึ่งเป็นศูนย์",
          en: "A product is zero only when one of the factors is zero.",
        },
        { math: null, exprEn: alternatives.en },
      ),
      makeStep(
        solution.th,
        "quad.zero-product",
        {
          th: "แก้สมการเชิงเส้นทั้งสอง",
          en: "Solve each linear equation.",
        },
        { math: null, exprEn: solution.en },
      ),
    );

    const values = p === q ? [String(p)] : [String(p), String(q)];
    /**
     * Reading the roots straight off the brackets without flipping the sign is
     * the commonest slip here - unless the roots happen to be symmetric, in
     * which case the "mistake" is the right answer and must not be named.
     */
    const flipped = values.map((value) => String(-Number(value)));

    return {
      id: `${quadSolveFactorSimple.id}:${rng.seed}:${difficulty}`,
      generatorId: quadSolveFactorSimple.id,
      skillId: SKILL,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: SOLVE_PROMPT,
      stem,
      answer: { kind: "set", values },
      steps,
      /**
       * Reading the roots straight off the factorisation without flipping the
       * sign is the single commonest slip on this skill.
       */
      misconceptions: sameSet(flipped, values)
        ? []
        : [
            {
              answer: { kind: "set", values: flipped },
              explain: {
                th: `นั่นคือตัวเลขที่อยู่ในวงเล็บ ไม่ใช่คำตอบ จาก ${linearExpr(1, -p)} = 0 ต้องย้ายข้าง ได้ x = ${p}`,
                en: `Those are the numbers inside the brackets, not the roots. From ${linearExpr(1, -p)} = 0 you get x = ${p}.`,
              },
            },
          ],
      hints: [
        {
          th: "ข้างหนึ่งของสมการต้องเป็นศูนย์ก่อน",
          en: "One side has to be zero first.",
        },
        {
          th: `หาสองจำนวนที่คูณกันได้ ${c} และบวกกันได้ ${b}`,
          en: `Find two numbers with product ${c} and sum ${b}.`,
        },
        {
          th: "แล้วใช้สมบัติการคูณเป็นศูนย์",
          en: "Then use the zero product property.",
        },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

// ---------------------------------------------------------------------------
// แก้สมการโดยการแยกตัวประกอบ, a > 1
// ---------------------------------------------------------------------------

export const quadSolveFactorLeading: Generator = {
  id: "quad.solve-factor-leading",
  skillId: SKILL,
  difficulties: [3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    // (a x - m)(x - n) = 0, so one root is a fraction. That is the point of
    // this shape: learners routinely give m rather than m/a.
    const a = rng.int(2, difficulty === 4 ? 6 : 4);
    let m = rng.nonZeroInt(-9, 9);
    const n = rng.nonZeroInt(-7, 7);
    // A shared factor would make the leading coefficient a red herring.
    if (m % a === 0) m += 1;
    if (m === 0) m = 1;

    const b = -(a * n + m);
    const c = m * n;
    const [num, den] = reduceFraction(m, a);

    const stem = `${quadraticExpr(a, b, c)} = 0`;
    const fractionalRoot = fraction(m, a);

    const alternatives = orJoin([
      `${linearExpr(a, -m)} = 0`,
      `${linearExpr(1, -n)} = 0`,
    ]);
    const solution = rootsLine([fractionalRoot, String(n)]);

    const steps: Step[] = [
      makeStep(
        `${factorKatex(a, -m)}${factorKatex(1, -n)} = 0`,
        "quad.trinomial-pattern",
        {
          th: `สัมประสิทธิ์หน้า x^2 คือ ${a} จึงแยกได้เป็น ${linearExpr(a, -m)} คูณกับ ${linearExpr(1, -n)}`,
          en: `The leading coefficient is ${a}, so it factors as ${linearExpr(a, -m)} times ${linearExpr(1, -n)}.`,
        },
      ),
      makeStep(
        alternatives.th,
        "quad.zero-product",
        {
          th: "ผลคูณเป็นศูนย์ ต้องมีตัวใดตัวหนึ่งเป็นศูนย์",
          en: "A product is zero only when one factor is zero.",
        },
        { math: null, exprEn: alternatives.en },
      ),
      makeStep(
        solution.th,
        "eq.balance",
        {
          th: `จาก ${linearExpr(a, -m)} = 0 หารด้วย ${a} ทั้งสองข้าง ได้ x = ${fractionalRoot}`,
          en: `From ${linearExpr(a, -m)} = 0, divide both sides by ${a} to get x = ${fractionalRoot}.`,
        },
        { math: null, exprEn: solution.en },
      ),
    ];

    const rootValue = den === 1 ? String(num) : `${num}/${den}`;
    const values =
      rootValue === String(n) ? [rootValue] : [rootValue, String(n)];

    return {
      id: `${quadSolveFactorLeading.id}:${rng.seed}:${difficulty}`,
      generatorId: quadSolveFactorLeading.id,
      skillId: SKILL,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: SOLVE_PROMPT,
      stem,
      answer: { kind: "set", values },
      steps,
      hints: [
        {
          th: `สัมประสิทธิ์หน้า x^2 ไม่ใช่ 1 วงเล็บหนึ่งต้องขึ้นต้นด้วย ${a}x`,
          en: `The leading coefficient is not 1, so one bracket starts with ${a}x.`,
        },
        {
          th: `พจน์ท้ายของทั้งสองวงเล็บคูณกันได้ ${c}`,
          en: `The last terms multiply to ${c}.`,
        },
        {
          th: "ระวัง - คำตอบหนึ่งเป็นเศษส่วน",
          en: "Careful - one of the roots is a fraction.",
        },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

// ---------------------------------------------------------------------------
// ตัวประกอบร่วม - the root that gets lost
// ---------------------------------------------------------------------------

export const quadSolveCommonFactor: Generator = {
  id: "quad.solve-common-factor",
  skillId: SKILL,
  difficulties: [2, 4],
  provenance: "generated",
  sourceNote:
    "Shape: ax^2 = bx, where dividing both sides by x silently loses x = 0.",

  generate(rng, difficulty): Question {
    const a = rng.int(1, difficulty === 4 ? 6 : 3);
    const b = rng.nonZeroInt(-9, 9);
    // a x^2 + b x = 0 has roots 0 and -b/a.
    const [num, den] = reduceFraction(-b, a);
    const otherRoot = den === 1 ? String(num) : `${num}/${den}`;
    const otherRootKatex = fraction(-b, a);

    const stem =
      difficulty === 4
        ? `${quadraticExpr(a, 0, 0)} = ${quadraticExpr(0, -b, 0)}`
        : `${quadraticExpr(a, b, 0)} = 0`;

    const alternatives = orJoin(["x = 0", `${linearExpr(a, b)} = 0`]);
    const solution = rootsLine(["0", otherRootKatex]);

    const steps: Step[] = [];
    if (difficulty === 4) {
      steps.push(
        makeStep(`${quadraticExpr(a, b, 0)} = 0`, "eq.move-term", {
          th: "ย้ายทุกพจน์มาข้างเดียวกัน อย่าหารทั้งสองข้างด้วย x เพราะจะทำให้คำตอบหายไปหนึ่งคำตอบ",
          en: "Move everything to one side. Do not divide by x - that loses a root.",
        }),
      );
    }

    steps.push(
      makeStep(`x\\left(${linearExpr(a, b)}\\right) = 0`, "quad.common-factor", {
        th: "ทั้งสองพจน์มี x เป็นตัวประกอบร่วม",
        en: "Both terms share a factor of x.",
      }),
      makeStep(
        alternatives.th,
        "quad.zero-product",
        {
          th: "ผลคูณเป็นศูนย์ ต้องมีตัวใดตัวหนึ่งเป็นศูนย์",
          en: "A product is zero only when one factor is zero.",
        },
        { math: null, exprEn: alternatives.en },
      ),
      makeStep(
        solution.th,
        "eq.balance",
        {
          th: `แก้ ${linearExpr(a, b)} = 0 ได้ x = ${otherRootKatex}`,
          en: `Solving ${linearExpr(a, b)} = 0 gives x = ${otherRootKatex}.`,
        },
        { math: null, exprEn: solution.en },
      ),
    );

    return {
      id: `${quadSolveCommonFactor.id}:${rng.seed}:${difficulty}`,
      generatorId: quadSolveCommonFactor.id,
      skillId: SKILL,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: SOLVE_PROMPT,
      stem,
      answer: { kind: "set", values: ["0", otherRoot] },
      steps,
      hints: [
        {
          th: "ห้ามหารทั้งสองข้างด้วย x - คำตอบจะหายไปหนึ่งคำตอบ",
          en: "Do not divide both sides by x - you would lose a root.",
        },
        {
          th: "ดึง x ออกมาเป็นตัวประกอบร่วมแทน",
          en: "Take x out as a common factor instead.",
        },
        {
          th: "สมการกำลังสองมีได้สองคำตอบ",
          en: "A quadratic has room for two roots.",
        },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};
