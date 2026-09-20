import { coefficient, fraction, linearExpr, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "c1.limits";

/**
 * ลิมิตและความต่อเนื่อง · Calculus I.
 *
 * Four generators, and between them the three things a school limit never has
 * to face: two sides that disagree, a limit taken at infinity, and continuity
 * as a condition rather than a convenience.
 *
 * Piecewise functions are written with `\begin{cases}`, which
 * `lib/math/katex.ts` refuses - as it should, since a piecewise function is
 * not one expression. Every question carries `machineStem: null`, and
 * `c1-limits.test.ts` evaluates each branch on its own side of the join.
 */

/** `\begin{cases} 2x + 1 & x < 3 \\ 5 - x & x \ge 3 \end{cases}`. */
function piecewise(left: string, right: string, join: number): string {
  return `\\begin{cases} ${left} & x < ${join} \\\\ ${right} & x \\ge ${join} \\end{cases}`;
}

export const c1OneSided: Generator = {
  id: "c1.one-sided",
  skillId: "c1.one-sided",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const join = rng.int(-3, 4);
    const leftSlope = rng.pick([1, 2, 3, -1, -2, 4]);
    const leftConstant = rng.int(-6, 6);
    const rightSlope = rng.pick([1, 2, 3, -1, -3, 5]);
    const rightConstant = rng.int(-6, 6);

    const leftValue = leftSlope * join + leftConstant;
    const rightValue = rightSlope * join + rightConstant;

    const left = linearExpr(leftSlope, leftConstant, "x");
    const right = linearExpr(rightSlope, rightConstant, "x");

    /*
     * Difficulty 3 asks for the jump, which is the number that says whether
     * the limit exists at all - zero if it does. Difficulty 4 is quadratic on
     * one side, where the two sides can agree at the join and still look
     * nothing like each other.
     */
    const quadratic = difficulty === 4;
    const leftBranch = quadratic
      ? sumTerms([
          coefficient(leftSlope, "x^2") || null,
          leftConstant === 0 ? null : String(leftConstant),
        ])
      : left;
    const leftAt = quadratic ? leftSlope * join * join + leftConstant : leftValue;

    const side = difficulty === 2 ? "+" : "-";
    const wanted =
      difficulty === 3
        ? rightValue - leftAt
        : side === "-"
          ? leftAt
          : rightValue;

    const steps: Step[] = [
      makeStep(
        difficulty === 3
          ? `\\lim_{x \\to ${join}^-} f(x) = ${leftAt}`
          : `f(x) = ${side === "-" ? leftBranch : right} \\quad x \\to ${join}^{${side}}`,
        "c1.one-sided",
        {
          th:
            difficulty === 3
              ? `ทางซ้ายใช้สูตรแรก แทน x = ${join} ได้ ${leftAt}`
              : `ทาง${side === "-" ? "ซ้าย" : "ขวา"}ของ ${join} ใช้สูตร${side === "-" ? "แรก" : "ที่สอง"}เท่านั้น`,
          en:
            difficulty === 3
              ? `On the left the first piece applies, and at ${join} it gives ${leftAt}.`
              : `Only the ${side === "-" ? "first" : "second"} piece lives on that side of ${join}.`,
        },
        { math: null },
      ),
      makeStep(
        difficulty === 3
          ? `\\lim_{x \\to ${join}^+} f(x) = ${rightValue}`
          : `\\lim_{x \\to ${join}^{${side}}} f(x) = ${wanted}`,
        difficulty === 3 ? "c1.one-sided" : "calc.limit-substitution",
        {
          th:
            difficulty === 3
              ? `ทางขวาใช้สูตรที่สอง ได้ ${rightValue}`
              : `พหุนามต่อเนื่อง จึงแทนค่าลงในสูตรของข้างนั้นได้เลย`,
          en:
            difficulty === 3
              ? `On the right the second piece gives ${rightValue}.`
              : `That piece is a polynomial, so substitution is all it takes.`,
        },
        { math: null },
      ),
    ];

    if (difficulty === 3) {
      steps.push(
        makeStep(
          `${rightValue} - (${leftAt}) = ${wanted}`,
          "c1.one-sided",
          {
            th:
              wanted === 0
                ? "สองข้างเท่ากัน ไม่มีการกระโดด ลิมิตจึงมีค่า"
                : "สองข้างไม่เท่ากัน กราฟกระโดดที่จุดนี้ ลิมิตจึงไม่มีค่า",
            en:
              wanted === 0
                ? "The two sides agree: no jump, so the limit exists."
                : "The two sides disagree, so the graph jumps and there is no limit.",
          },
          { math: null },
        ),
      );
    }

    const answer: Answer = { kind: "exact", value: String(wanted) };

    return {
      ...shell(c1OneSided, rng, difficulty),
      prompt:
        difficulty === 3
          ? {
              th: `จงหาขนาดของการกระโดดของ f ที่ x = ${join} นั่นคือลิมิตขวาลบลิมิตซ้าย`,
              en: `Find the size of the jump in f at x = ${join}: the right-hand limit minus the left-hand one`,
            }
          : {
              th: `จงหาลิมิต${side === "-" ? "ซ้าย" : "ขวา"}ของ f ที่ x = ${join}`,
              en: `Find the ${side === "-" ? "left" : "right"}-hand limit of f at x = ${join}`,
            },
      stem: `f(x) = ${piecewise(leftBranch, right, join)}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ลิมิตซ้ายใช้สูตรของช่วงที่อยู่ทางซ้าย ลิมิตขวาใช้สูตรของช่วงทางขวา",
          en: "A left-hand limit uses the piece on the left; a right-hand limit uses the piece on the right.",
        },
        {
          th: `รอยต่ออยู่ที่ x = ${join}`,
          en: `The join is at x = ${join}.`,
        },
        {
          th: "แต่ละช่วงเป็นพหุนาม จึงแทนค่าได้ตรง ๆ",
          en: "Each piece is a polynomial, so substitution works inside it.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: String(
              difficulty === 3
                ? leftAt - rightValue
                : side === "-"
                  ? rightValue
                  : leftAt,
            ),
          },
          explain:
            difficulty === 3
              ? {
                  th: "สลับที่กัน ขนาดการกระโดดคือลิมิตขวาลบลิมิตซ้าย",
                  en: "The wrong way round: it is right minus left.",
                }
              : {
                  th: "อ่านจากสูตรของอีกข้างหนึ่ง",
                  en: "That is the other side's piece.",
                },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/** Limits at infinity, and where the asymptotes are. */
export const c1Infinity: Generator = {
  id: "c1.infinity",
  skillId: "c1.infinity",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 4) return verticalAsymptote(rng, difficulty);

    const topLead = rng.pick([1, 2, 3, 4, 6, -2, -3]);
    const bottomLead = rng.pick([1, 2, 3, 4, 5, -2]);
    const topRest = rng.int(-8, 8);
    const bottomRest = rng.int(-8, 8);

    /*
     * Difficulty 1: equal degrees, so the answer is the ratio of the leading
     * coefficients. Difficulty 2: the bottom wins and the answer is zero.
     * Difficulty 3: equal degrees again but quadratic, where the lower terms
     * are more tempting to keep.
     */
    const shape = difficulty === 1 ? "equal" : difficulty === 2 ? "bottom" : "square";

    const numerator =
      shape === "square"
        ? sumTerms([
            coefficient(topLead, "x^2") || null,
            coefficient(topRest, "x") || null,
          ])
        : linearExpr(topLead, topRest, "x");
    const denominator =
      shape === "equal"
        ? linearExpr(bottomLead, bottomRest, "x")
        : shape === "bottom"
          ? sumTerms([
              coefficient(bottomLead, "x^2") || null,
              bottomRest === 0 ? null : String(bottomRest),
            ])
          : sumTerms([
              coefficient(bottomLead, "x^2") || null,
              coefficient(bottomRest, "x") || null,
            ]);

    const answerMath =
      shape === "bottom" ? "0" : `${topLead}/${bottomLead}`;
    const answerKatex =
      shape === "bottom" ? "0" : fraction(topLead, bottomLead);

    const steps: Step[] = [
      makeStep(
        shape === "bottom"
          ? `\\frac{\\frac{${topLead}}{x} + \\frac{${topRest}}{x^2}}{${bottomLead} + \\frac{${bottomRest}}{x^2}}`
          : `\\frac{${topLead} + \\frac{\\cdots}{x}}{${bottomLead} + \\frac{\\cdots}{x}}`,
        "c1.limit-at-infinity",
        {
          th: `หารทุกพจน์ด้วย ${shape === "equal" ? "x" : "x^2"} ซึ่งเป็นกำลังสูงสุดของตัวส่วน`,
          en: `Divide every term by ${shape === "equal" ? "x" : "x squared"}, the highest power below the line.`,
        },
        { math: null },
      ),
      makeStep(
        answerKatex,
        "c1.limit-at-infinity",
        {
          th: "ทุกพจน์ที่ยังมี x อยู่ในตัวส่วนกลายเป็นศูนย์",
          en: "Everything still holding an x underneath goes to zero.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: answerMath };

    return {
      ...shell(c1Infinity, rng, difficulty),
      prompt: { th: "จงหาค่าของลิมิตนี้", en: "Find the limit" },
      stem: `\\lim_{x \\to \\infty}\\frac{${numerator}}{${denominator}}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ดูดีกรีของตัวเศษกับตัวส่วนก่อน",
          en: "Compare the degree on top with the degree below.",
        },
        {
          th:
            shape === "bottom"
              ? "ตัวส่วนดีกรีสูงกว่า ตัวส่วนจึงโตเร็วกว่ามาก"
              : "ดีกรีเท่ากัน คำตอบคืออัตราส่วนของสัมประสิทธิ์นำ",
          en:
            shape === "bottom"
              ? "The bottom has the higher degree, so it grows far faster."
              : "Equal degrees: the answer is the ratio of the leading coefficients.",
        },
        {
          th: "พจน์ที่ดีกรีต่ำกว่าไม่มีผลเลยเมื่อ x ใหญ่มาก",
          en: "The lower-degree terms stop mattering entirely once x is large.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: shape === "bottom" ? `${topLead}/${bottomLead}` : "1",
          },
          explain:
            shape === "bottom"
              ? {
                  th: "อัตราส่วนของสัมประสิทธิ์นำใช้ได้เมื่อดีกรีเท่ากันเท่านั้น",
                  en: "The ratio of leading coefficients only applies when the degrees match.",
                }
              : {
                  th: "ไม่ใช่หนึ่งเสมอไป ต้องดูสัมประสิทธิ์นำของทั้งสองข้าง",
                  en: "Not always one - the leading coefficients decide it.",
                },
        },
        {
          answer: { kind: "exact", value: `${bottomLead}/${topLead}` },
          explain: {
            th: "กลับเศษกับส่วน สัมประสิทธิ์นำของตัวเศษอยู่ข้างบน",
            en: "Upside down: the numerator's leading coefficient stays on top.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/** Difficulty 4: where the graph runs off to infinity, and where it merely has a hole. */
function verticalAsymptote(rng: RNG, difficulty: number): Question {
  const pole = rng.int(-5, 5);
  const other = rng.pick(
    [-6, -4, -3, -2, -1, 1, 2, 3, 4, 6].filter((root) => root !== pole),
  );
  const hole = rng.bool();

  /*
   * Either the numerator shares the factor - a hole, and no asymptote - or it
   * does not, and the graph runs off at that x. Telling those apart is the
   * whole question.
   */
  const numerator = hole
    ? sumTerms([
        "x^2",
        coefficient(-(pole + other), "x") || null,
        pole * other === 0 ? null : String(pole * other),
      ])
    : `x - ${other}`.replace("- -", "+ ");
  const denominator = pole === 0 ? "x" : pole > 0 ? `x - ${pole}` : `x + ${-pole}`;

  /*
   * The hole's *height* is the limit there. After cancelling, the function is
   * `x - other`, so at the pole it sits at `pole - other` - not at `other`,
   * which is merely where the surviving factor is zero.
   */
  const answer: Answer = {
    kind: "exact",
    value: hole ? String(pole - other) : String(pole),
  };

  const steps: Step[] = [
    makeStep(
      `${denominator} = 0 \\Rightarrow x = ${pole}`,
      "c1.asymptote",
      {
        th: `ตัวส่วนเป็นศูนย์ที่ x = ${pole}`,
        en: `The denominator is zero at x = ${pole}.`,
      },
      { math: null },
    ),
    makeStep(
      hole
        ? `\\frac{(x - ${pole})(x - ${other})}{x - ${pole}} = x - ${other}`
        : `x = ${pole}`,
      "c1.asymptote",
      {
        th: hole
          ? `แต่ตัวเศษก็เป็นศูนย์ที่นั่นด้วย ตัดกันได้ จึงเป็นรูโหว่ ไม่ใช่เส้นกำกับ`
          : `ตัวเศษไม่เป็นศูนย์ที่นั่น จึงเป็นเส้นกำกับแนวตั้ง`,
        en: hole
          ? `But the numerator is zero there too, so it cancels: a hole, not an asymptote.`
          : `The numerator is not zero there, so that is a vertical asymptote.`,
      },
      { math: null },
    ),
  ];

  return {
    ...shell(c1Infinity, rng, difficulty),
    prompt: hole
      ? {
          th: `กราฟนี้ไม่มีเส้นกำกับแนวตั้ง แต่มีรูโหว่ที่ x = ${pole} จงหาค่า y ของรูโหว่นั้น`,
          en: `This graph has no vertical asymptote, only a hole at x = ${pole}. Find the y of that hole`,
        }
      : {
          th: "จงหาค่า x ของเส้นกำกับแนวตั้งของกราฟนี้",
          en: "Find the x of this graph's vertical asymptote",
        },
    stem: `y = \\frac{${numerator}}{${denominator}}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "เริ่มจากหาว่าตัวส่วนเป็นศูนย์ที่ไหน",
        en: "Start with where the denominator is zero.",
      },
      {
        th: "แล้วดูว่าตัวเศษเป็นศูนย์ที่จุดเดียวกันหรือไม่",
        en: "Then ask whether the numerator is zero at the same place.",
      },
      {
        th: "เป็นศูนย์ทั้งคู่คือรูโหว่ เป็นศูนย์แค่ตัวส่วนคือเส้นกำกับ",
        en: "Both zero is a hole; only the bottom is an asymptote.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: hole ? String(pole) : String(other) },
        explain: hole
          ? {
              th: `นั่นคือตำแหน่ง x ของรูโหว่ โจทย์ถามค่า y ที่รูโหว่นั้น`,
              en: `That is where the hole is; the question asks how high it is.`,
            }
          : {
              th: "นั่นคือจุดที่ตัวเศษเป็นศูนย์ ซึ่งเป็นจุดตัดแกน x ไม่ใช่เส้นกำกับ",
              en: "That is where the numerator is zero - an x-intercept, not an asymptote.",
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
