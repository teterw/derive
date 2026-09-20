import { paren, quadraticExpr, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type {
  Difficulty,
  Generator,
  L,
  Question,
  RNG,
  Step,
} from "../types";

const TOPIC = "func.quadratic-graph";

/**
 * กราฟของฟังก์ชันกำลังสอง.
 *
 * Built backwards from the vertex: `a`, `h` and `k` are chosen, the function
 * is `a(x - h)^2 + k`, and the question is whatever that expands to. Every
 * answer - the completed square, the axis, the greatest value, the roots - is
 * therefore known by construction rather than found.
 *
 * `h` is always a whole number. A vertex at `x = 7/4` is not harder in any way
 * that teaches anything; it just moves the work into arithmetic, and the same
 * question with a whole `h` tests exactly the same understanding.
 */
type Parabola = {
  a: number;
  h: number;
  k: number;
  /** `ax^2 + bx + c`, the form the question is asked in. */
  b: number;
  c: number;
};

function parabola(rng: RNG, difficulty: Difficulty): Parabola {
  const a =
    difficulty === 1
      ? 1
      : difficulty === 2
        ? rng.pick([1, 1, -1] as const)
        : rng.pick([2, 3, -2, -3, 4, -4] as const);
  const h = rng.nonZeroInt(-6, 6);
  const k = rng.nonZeroInt(-12, 12);
  return { a, h, k, b: -2 * a * h, c: a * h * h + k };
}

/** `y = a(x - h)^2 + k`, written the way a book writes it. */
function vertexFormKatex(a: number, h: number, k: number): string {
  const bracket = paren(`x ${h > 0 ? "-" : "+"} ${Math.abs(h)}`);
  const lead = a === 1 ? bracket : a === -1 ? `-${bracket}` : `${a}${bracket}`;
  if (k === 0) return `${lead}^2`;
  return `${lead}^2 ${k > 0 ? "+" : "-"} ${Math.abs(k)}`;
}

/** The same thing as mathjs source. */
function vertexFormMath(a: number, h: number, k: number): string {
  const bracket = `(x ${h > 0 ? "-" : "+"} ${Math.abs(h)})`;
  const lead = a === 1 ? "" : a === -1 ? "-" : `${a}*`;
  const tail = k === 0 ? "" : ` ${k > 0 ? "+" : "-"} ${Math.abs(k)}`;
  return `${lead}${bracket}^2${tail}`;
}

// ---------------------------------------------------------------------------
// เขียนในรูปกำลังสองสมบูรณ์
// ---------------------------------------------------------------------------

export const funcQuadVertexForm: Generator = {
  id: "func.quad.vertex-form",
  skillId: "func.quad.vertex-form",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const { a, h, k, b, c } = parabola(rng, difficulty);
    const stem = quadraticExpr(a, b, c);
    const answerKatex = vertexFormKatex(a, h, k);
    const answerMath = vertexFormMath(a, h, k);

    const steps: Step[] = [];

    if (a !== 1) {
      steps.push(
        makeStep(
          sumTerms([
            `${a}${paren(quadraticExpr(1, b / a, 0))}`,
            c === 0 ? null : String(c),
          ]),
          "quad.complete-square",
          {
            th: `ดึง ${a} ออกจากสองพจน์แรกก่อน พจน์คงที่ปล่อยไว้ข้างนอก`,
            en: `Take the ${a} out of the first two terms and leave the constant outside.`,
          },
        ),
      );
    }

    steps.push(
      makeStep(
        a === 1
          ? `${paren(`x ${h > 0 ? "-" : "+"} ${Math.abs(h)}`)}^2 ${k > 0 ? "+" : "-"} ${Math.abs(k)}`
          : answerKatex,
        "quad.perfect-square-trinomial",
        {
          th: `ครึ่งหนึ่งของ ${b / a} คือ ${-h} จึงเติมกำลังสองสมบูรณ์เป็น ${paren(`x ${h > 0 ? "-" : "+"} ${Math.abs(h)}`)}^2 แล้วปรับพจน์คงที่ให้ค่าเท่าเดิม`,
          en: `Half of ${b / a} is ${-h}, so the square is ${paren(`x ${h > 0 ? "-" : "+"} ${Math.abs(h)}`)}^2, with the constant adjusted to keep the value the same.`,
        },
      ),
    );

    return {
      id: `${funcQuadVertexForm.id}:${rng.seed}:${difficulty}`,
      generatorId: funcQuadVertexForm.id,
      skillId: funcQuadVertexForm.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: {
        th: "จงเขียนให้อยู่ในรูปกำลังสองสมบูรณ์",
        en: "Write it in completed-square form",
      },
      stem,
      answer: { kind: "exact", value: answerMath },
      steps,
      misconceptions: namedMistakes({ kind: "exact", value: answerMath }, [
        {
          answer: { kind: "exact", value: vertexFormMath(a, -h, k) },
          explain: {
            th: `ครึ่งหนึ่งของสัมประสิทธิ์ x คือ ${-h} วงเล็บจึงเป็น ${paren(`x ${h > 0 ? "-" : "+"} ${Math.abs(h)}`)} ลองคูณกลับดูจะเห็นว่าอีกแบบไม่ตรงกับโจทย์`,
            en: `Half the coefficient of x is ${-h}, so the bracket is ${paren(`x ${h > 0 ? "-" : "+"} ${Math.abs(h)}`)}. Multiply the other one back out and it is not the question.`,
          },
        },
        {
          answer: { kind: "exact", value: vertexFormMath(a, h, k + a * h * h) },
          explain: {
            th: `เติมกำลังสองสมบูรณ์แล้วต้องหักส่วนที่เติมเข้าไปออก ไม่อย่างนั้นค่าจะไม่เท่าเดิม`,
            en: `Completing the square adds something in, and the same amount has to come back out, or the value changes.`,
          },
        },
      ]),
      hints: [
        {
          th: `ครึ่งหนึ่งของสัมประสิทธิ์ของ x คือเท่าใด`,
          en: `What is half the coefficient of x?`,
        },
        {
          th: `วงเล็บคือ ${paren(`x ${h > 0 ? "-" : "+"} ${Math.abs(h)}`)}`,
          en: `The bracket is ${paren(`x ${h > 0 ? "-" : "+"} ${Math.abs(h)}`)}.`,
        },
        {
          th: `แล้วปรับพจน์คงที่ให้คูณกลับออกมาได้ ${stem} เหมือนเดิม`,
          en: `Then adjust the constant so it multiplies back out to ${stem}.`,
        },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

// ---------------------------------------------------------------------------
// จุดยอด แกนสมมาตร และค่าสูงสุดต่ำสุด
// ---------------------------------------------------------------------------

export const funcQuadVertex: Generator = {
  id: "func.quad.vertex",
  skillId: "func.quad.vertex",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const { a, h, k, b, c } = parabola(rng, difficulty);
    const stem = quadraticExpr(a, b, c);
    /*
     * Half the questions ask for the axis and half for the extreme value. They
     * are the two coordinates of the same point, and a learner who has only
     * ever been asked for one of them has not met the vertex at all.
     */
    const wantsAxis = rng.bool();
    const answer = wantsAxis ? h : k;
    const opensUp = a > 0;

    const steps: Step[] = [
      makeStep(
        `x = -\\frac{${b}}{2${paren(String(a))}} = ${h}`,
        "func.axis-of-symmetry",
        {
          th: `a = ${a} และ b = ${b} แกนสมมาตรจึงเป็น x = ${h}`,
          en: `a = ${a} and b = ${b}, so the axis of symmetry is x = ${h}.`,
        },
        { math: null },
      ),
    ];

    if (!wantsAxis) {
      steps.push(
        makeStep(
          `y = ${vertexFormKatex(a, h, k)}`,
          "func.vertex-form",
          {
            th: `จัดรูปได้ ${vertexFormKatex(a, h, k)} จุดยอดจึงอยู่ที่ ${paren(`${h}, ${k}`)}`,
            en: `In completed-square form it is ${vertexFormKatex(a, h, k)}, so the vertex is ${paren(`${h}, ${k}`)}.`,
          },
          { math: null },
        ),
        makeStep(
          `y_{\\text{${opensUp ? "min" : "max"}}} = ${k}`,
          "func.parabola-direction",
          {
            th: `a = ${a} ${opensUp ? "เป็นบวก กราฟเปิดขึ้น จุดยอดจึงเป็นค่าต่ำสุด" : "เป็นลบ กราฟเปิดลง จุดยอดจึงเป็นค่าสูงสุด"} คือ ${k}`,
            en: `a = ${a} is ${opensUp ? "positive, so the graph opens upwards and the vertex is the least value" : "negative, so the graph opens downwards and the vertex is the greatest value"}: ${k}.`,
          },
          { math: null },
        ),
      );
    }

    const prompt: L = wantsAxis
      ? {
          th: "แกนสมมาตรของกราฟนี้คือเส้นตรง x เท่ากับเท่าใด",
          en: "The axis of symmetry of this graph is x equals what?",
        }
      : {
          th: `ค่า${opensUp ? "ต่ำ" : "สูง"}สุดของฟังก์ชันนี้คือเท่าใด`,
          en: `What is the ${opensUp ? "least" : "greatest"} value this function takes?`,
        };

    return {
      id: `${funcQuadVertex.id}:${rng.seed}:${difficulty}`,
      generatorId: funcQuadVertex.id,
      skillId: funcQuadVertex.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt,
      stem: `y = ${stem}`,
      // A coordinate of the vertex, not a root of the stem.
      machineStem: null,
      answer: { kind: "exact", value: String(answer) },
      steps,
      misconceptions: namedMistakes({ kind: "exact", value: String(answer) }, [
        {
          answer: { kind: "exact", value: String(wantsAxis ? -h : -k) },
          explain: wantsAxis
            ? {
                th: `สูตรคือ ลบ b ส่วน 2a ซึ่งรวมเครื่องหมายลบไว้แล้ว b = ${b} จึงได้ ${h}`,
                en: `The formula is minus b over 2a, and the minus is already in it: with b = ${b} that is ${h}.`,
              }
            : {
                th: `ค่าที่อ่านได้จากรูปกำลังสองสมบูรณ์คือ ${k} ตามเครื่องหมายที่เห็น ไม่ต้องกลับเครื่องหมาย`,
                en: `The value read off the completed square is ${k}, with the sign as written - only the number inside the bracket flips.`,
              },
        },
        {
          answer: { kind: "exact", value: String(wantsAxis ? k : h) },
          explain: {
            th: `จุดยอดอยู่ที่ ${paren(`${h}, ${k}`)} โจทย์ถาม${wantsAxis ? "แกนสมมาตร ซึ่งเป็นพิกัด x" : "ค่าของฟังก์ชัน ซึ่งเป็นพิกัด y"}`,
            en: `The vertex is ${paren(`${h}, ${k}`)}, and the question asks for the ${wantsAxis ? "axis, which is the x-coordinate" : "value of the function, which is the y-coordinate"}.`,
          },
        },
      ]),
      hints: [
        {
          th: "แกนสมมาตรหาได้จากสัมประสิทธิ์โดยตรง ไม่ต้องจัดรูป",
          en: "The axis comes straight from the coefficients; no rearranging needed.",
        },
        {
          th: `a = ${a} และ b = ${b} ลองแทนใน -\\frac{b}{2a}`,
          en: `a = ${a} and b = ${b}: put them into -\\frac{b}{2a}.`,
        },
        wantsAxis
          ? {
              th: `จะได้ x = ${h}`,
              en: `That gives x = ${h}.`,
            }
          : {
              th: `แล้วแทน x = ${h} กลับเข้าไปหาค่า y`,
              en: `Then put x = ${h} back in to get the value of y.`,
            },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

// ---------------------------------------------------------------------------
// จุดตัดแกน
// ---------------------------------------------------------------------------

export const funcQuadIntercepts: Generator = {
  id: "func.quad.intercepts",
  skillId: "func.quad.intercepts",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 1) {
      // The y-intercept, which is the constant term and nothing else.
      const { a, b, c } = parabola(rng, 2);
      const stem = quadraticExpr(a, b, c);
      const steps = [
        makeStep(
          `y = ${sumTerms([
            `${a === 1 ? "" : a}${paren("0")}^2`,
            `${b}${paren("0")}`,
            c === 0 ? null : String(c),
          ])} = ${c}`,
          "func.intercepts",
          {
            th: `แทน x ด้วย 0 พจน์ที่มี x หายไปหมด เหลือแค่พจน์คงที่ ${c}`,
            en: `Put x = 0: every term with an x in it disappears, leaving the constant ${c}.`,
          },
          { math: null },
        ),
      ];

      return {
        id: `${funcQuadIntercepts.id}:${rng.seed}:${difficulty}`,
        generatorId: funcQuadIntercepts.id,
        skillId: funcQuadIntercepts.skillId,
        topicId: TOPIC,
        difficulty,
        provenance: "generated",
        prompt: {
          th: "กราฟนี้ตัดแกน y ที่ค่า y เท่าใด",
          en: "At what value of y does this graph cross the y-axis?",
        },
        stem: `y = ${stem}`,
        machineStem: null,
        answer: { kind: "exact", value: String(c) },
        steps,
        misconceptions: namedMistakes({ kind: "exact", value: String(c) }, [
          {
            answer: { kind: "exact", value: String(b) },
            explain: {
              th: `${b} คือสัมประสิทธิ์ของ x จุดตัดแกน y คือพจน์ที่ไม่มี x อยู่เลย`,
              en: `${b} is the coefficient of x. The y-intercept is the term with no x in it at all.`,
            },
          },
        ]),
        hints: [
          {
            th: "ทุกจุดบนแกน y มีพิกัด x เป็นศูนย์",
            en: "Every point on the y-axis has x = 0.",
          },
          { th: "ลองแทน x ด้วย 0", en: "Substitute x = 0." },
          {
            th: "พจน์ที่มี x จะหายไปหมด",
            en: "Every term with an x vanishes.",
          },
        ],
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    /*
     * The x-intercepts. Built from the roots so they are always whole numbers
     * and always exist - "no real roots" is a different question, and is
     * `quad.discriminant`'s.
     */
    const a = difficulty === 4 ? rng.pick([1, -1, 2, -2] as const) : 1;
    const roots = rng
      .shuffle([-6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6])
      .slice(0, 2)
      .sort((p, q) => p - q);
    const [p, q] = roots as [number, number];
    const stem = quadraticExpr(a, -a * (p + q), a * p * q);

    const factored = `${a === 1 ? "" : a === -1 ? "-" : a}${paren(`x ${p > 0 ? "-" : "+"} ${Math.abs(p)}`)}${paren(`x ${q > 0 ? "-" : "+"} ${Math.abs(q)}`)}`;

    const steps: Step[] = [
      makeStep(`${stem} = 0`, "func.intercepts", {
        th: "ทุกจุดบนแกน x มีพิกัด y เป็นศูนย์ จึงแทน y ด้วย 0",
        en: "Every point on the x-axis has y = 0, so put y = 0.",
      }),
      makeStep(`${factored} = 0`, "quad.trinomial-pattern", {
        th: `แยกตัวประกอบได้ ${factored}`,
        en: `It factors as ${factored}.`,
      }),
      makeStep(
        `x = ${p} \\text{ หรือ } x = ${q}`,
        "quad.zero-product",
        {
          th: "ผลคูณเป็นศูนย์ แสดงว่าต้องมีวงเล็บใดวงเล็บหนึ่งเป็นศูนย์",
          en: "A product is zero only when one of the brackets is zero.",
        },
        { math: null, exprEn: `x = ${p} \\text{ or } x = ${q}` },
      ),
    ];

    return {
      id: `${funcQuadIntercepts.id}:${rng.seed}:${difficulty}`,
      generatorId: funcQuadIntercepts.id,
      skillId: funcQuadIntercepts.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: {
        th: "กราฟนี้ตัดแกน x ที่ค่า x ใดบ้าง",
        en: "At what values of x does this graph cross the x-axis?",
      },
      stem: `y = ${stem}`,
      machineStem: `(${a})*x^2 + (${-a * (p + q)})*x + (${a * p * q})`,
      answer: { kind: "set", values: [String(p), String(q)] },
      steps,
      misconceptions: namedMistakes(
        { kind: "set", values: [String(p), String(q)] },
        [
          {
            answer: { kind: "set", values: [String(-p), String(-q)] },
            explain: {
              th: `นั่นคือตัวเลขในวงเล็บ ไม่ใช่คำตอบ จาก x ${p > 0 ? "-" : "+"} ${Math.abs(p)} = 0 ต้องย้ายข้าง ได้ x = ${p}`,
              en: `Those are the numbers inside the brackets, not the roots: from x ${p > 0 ? "-" : "+"} ${Math.abs(p)} = 0 you get x = ${p}.`,
            },
          },
        ],
      ),
      hints: [
        {
          th: "ทุกจุดบนแกน x มีพิกัด y เป็นศูนย์",
          en: "Every point on the x-axis has y = 0.",
        },
        {
          th: `แทน y ด้วย 0 แล้วแก้สมการ ${stem} = 0`,
          en: `Put y = 0 and solve ${stem} = 0.`,
        },
        {
          th: `แยกตัวประกอบได้ ${factored}`,
          en: `It factors as ${factored}.`,
        },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};
