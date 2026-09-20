import { coefficient, linearExpr } from "../format";
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

const TOPIC = "ineq.linear-one-var";

/**
 * อสมการเชิงเส้นตัวแปรเดียว.
 *
 * ## Every step carries `math: null`, deliberately
 *
 * A step's machine form is checked against its neighbour's by `areEquivalent`,
 * which evaluates both at sample points. An inequality evaluates to a boolean,
 * `asComplex` refuses booleans, and the chain check would report every line of
 * every one of these questions as a broken derivation.
 *
 * What has to hold for an inequality is not that two lines are the same
 * function but that they have the same **solution set**, which is a different
 * question and one the generic gate does not ask. This chapter's own test asks
 * it: it samples both sides of the boundary of every line of working and
 * requires the truth value to match the question's everywhere.
 */
type Relation = "lt" | "gt" | "le" | "ge";

/**
 * Each relation three ways.
 *
 * `tex` goes in a stem or a step. `plain` goes in a choice button, which is a
 * `<Button>` and not KaTeX. `prose` is the one for inside a sentence: a bare
 * `>` at the end of an explanation is read as notation by the segmenter and
 * typeset as an operator with nothing after it, so the `$...$` says which
 * character is maths and which is punctuation.
 */
const RELATIONS: Record<
  Relation,
  { tex: string; plain: string; prose: string; flipped: Relation }
> = {
  lt: { tex: "<", plain: "<", prose: "$<$", flipped: "gt" },
  gt: { tex: ">", plain: ">", prose: "$>$", flipped: "lt" },
  le: { tex: "\\leq", plain: "≤", prose: "$\\leq$", flipped: "ge" },
  ge: { tex: "\\geq", plain: "≥", prose: "$\\geq$", flipped: "le" },
};

const ALL_RELATIONS: Relation[] = ["lt", "gt", "le", "ge"];

/** Turning the sign round is what multiplying by a negative does. */
function flip(relation: Relation): Relation {
  return RELATIONS[relation].flipped;
}

/** True when `value` satisfies `x <rel> boundary`. */
function holds(relation: Relation, value: number, boundary: number): boolean {
  switch (relation) {
    case "lt":
      return value < boundary;
    case "gt":
      return value > boundary;
    case "le":
      return value <= boundary;
    case "ge":
      return value >= boundary;
  }
}

/**
 * A line of working. Always `math: null` - see the note at the top of the file.
 */
function ineqStep(expr: string, ruleId: string, explain: L): Step {
  return makeStep(expr, ruleId, explain, { math: null });
}

function relationLine(relation: Relation, boundary: number): string {
  return `x ${RELATIONS[relation].tex} ${boundary}`;
}

// ---------------------------------------------------------------------------
// แก้อสมการเชิงเส้นตัวแปรเดียว
// ---------------------------------------------------------------------------

type Solved = {
  stem: string;
  relation: Relation;
  boundary: number;
  steps: Step[];
  hints: L[];
};

function solved(rng: RNG, difficulty: Difficulty): Solved {
  const given = rng.pick(ALL_RELATIONS);
  const boundary = rng.nonZeroInt(-9, 9);

  if (difficulty === 1) {
    // `x + c <rel> k`: one move, and the sign never turns.
    const c = rng.nonZeroInt(-12, 12);
    return {
      stem: `${linearExpr(1, c)} ${RELATIONS[given].tex} ${boundary + c}`,
      relation: given,
      boundary,
      steps: [
        ineqStep(relationLine(given, boundary), "ineq.balance", {
          th: `ลบ ${c} ออกจากทั้งสองข้าง การบวกลบไม่ทำให้เครื่องหมายกลับด้าน`,
          en: `Subtract ${c} from both sides. Adding and subtracting never turn the sign round.`,
        }),
      ],
      hints: [
        {
          th: "ทำเหมือนสมการทุกอย่าง ย้ายตัวเลขไปอีกข้างก่อน",
          en: "Treat it exactly like an equation: move the number across first.",
        },
        {
          th: `ลบ ${c} ออกจากทั้งสองข้าง`,
          en: `Subtract ${c} from both sides.`,
        },
        {
          th: "การบวกลบไม่ทำให้เครื่องหมายกลับด้าน",
          en: "Adding and subtracting leave the sign alone.",
        },
      ],
    };
  }

  if (difficulty === 2) {
    // `ax + c <rel> k` with a positive: dividing by a positive does not flip.
    const a = rng.int(2, 9);
    const c = rng.nonZeroInt(-12, 12);
    const k = a * boundary + c;
    return {
      stem: `${linearExpr(a, c)} ${RELATIONS[given].tex} ${k}`,
      relation: given,
      boundary,
      steps: [
        ineqStep(
          `${coefficient(a, "x")} ${RELATIONS[given].tex} ${k - c}`,
          "ineq.balance",
          {
            th: `ย้าย ${c} ไปอีกข้างก่อน เครื่องหมายยังคงเดิม`,
            en: `Move the ${c} across first; the sign is unchanged.`,
          },
        ),
        ineqStep(relationLine(given, boundary), "ineq.balance", {
          th: `หารทั้งสองข้างด้วย ${a} ซึ่งเป็นจำนวนบวก เครื่องหมายจึงไม่กลับด้าน`,
          en: `Divide both sides by ${a}. It is positive, so the sign stays as it is.`,
        }),
      ],
      hints: [
        {
          th: "ย้ายตัวเลขก่อน แล้วค่อยหารด้วยสัมประสิทธิ์",
          en: "Move the number first, then divide by the coefficient.",
        },
        {
          th: `จะเหลือ ${coefficient(a, "x")} ${RELATIONS[given].prose} ${k - c}`,
          en: `That leaves ${coefficient(a, "x")} ${RELATIONS[given].prose} ${k - c}.`,
        },
        {
          th: `${a} เป็นจำนวนบวก เครื่องหมายจึงไม่กลับ`,
          en: `${a} is positive, so the sign does not turn.`,
        },
      ],
    };
  }

  if (difficulty === 3) {
    /*
     * A negative coefficient. The whole chapter is this line: the division is
     * by a negative, so the answer's sign is the opposite of the question's.
     */
    const a = -rng.int(2, 9);
    const c = rng.nonZeroInt(-12, 12);
    const k = a * boundary + c;
    const answer = flip(given);
    return {
      stem: `${linearExpr(a, c)} ${RELATIONS[given].tex} ${k}`,
      relation: answer,
      boundary,
      steps: [
        ineqStep(
          `${coefficient(a, "x")} ${RELATIONS[given].tex} ${k - c}`,
          "ineq.balance",
          {
            th: `ย้าย ${c} ไปอีกข้าง เครื่องหมายยังไม่กลับเพราะเป็นการบวกลบ`,
            en: `Move the ${c} across. This is an addition, so the sign does not turn yet.`,
          },
        ),
        ineqStep(relationLine(answer, boundary), "ineq.flip-on-negative", {
          th: `หารด้วย ${a} ซึ่งเป็นจำนวนลบ เครื่องหมายจึงกลับจาก ${RELATIONS[given].prose} เป็น ${RELATIONS[answer].prose}`,
          en: `Divide by ${a}, which is negative, so the sign turns from ${RELATIONS[given].prose} to ${RELATIONS[answer].prose}.`,
        }),
      ],
      hints: [
        {
          th: `สัมประสิทธิ์ของ x เป็นลบ ให้ระวังตอนหาร`,
          en: `The coefficient of x is negative - watch what happens when you divide.`,
        },
        {
          th: `จะเหลือ ${coefficient(a, "x")} ${RELATIONS[given].prose} ${k - c}`,
          en: `That leaves ${coefficient(a, "x")} ${RELATIONS[given].prose} ${k - c}.`,
        },
        {
          th: "หารด้วยจำนวนลบ เครื่องหมายต้องกลับด้าน",
          en: "Dividing by a negative turns the sign round.",
        },
      ],
    };
  }

  /*
   * The variable on both sides, arranged so the coefficient left over is
   * negative. Collecting on the other side instead would avoid the flip
   * entirely - which is a real strategy and worth meeting, but only once the
   * flip itself is secure.
   */
  const a = rng.int(1, 4);
  const b = rng.int(a + 1, 9);
  const c = rng.nonZeroInt(-9, 9);
  const gap = a - b;
  const d = gap * boundary + c;
  const answer = flip(given);

  return {
    stem: `${linearExpr(a, c)} ${RELATIONS[given].tex} ${linearExpr(b, d)}`,
    relation: answer,
    boundary,
    steps: [
      ineqStep(
        `${linearExpr(gap, c)} ${RELATIONS[given].tex} ${d}`,
        "eq.collect-variable",
        {
          th: `ย้าย ${coefficient(b, "x")} มาทางซ้าย เหลือ ${coefficient(gap, "x")} ซึ่งเป็นลบ`,
          en: `Move ${coefficient(b, "x")} to the left, leaving ${coefficient(gap, "x")} - a negative coefficient.`,
        },
      ),
      ineqStep(
        `${coefficient(gap, "x")} ${RELATIONS[given].tex} ${d - c}`,
        "ineq.balance",
        {
          th: `ย้าย ${c} ไปทางขวา ได้ ${d - c}`,
          en: `Move the ${c} to the right: ${d - c}.`,
        },
      ),
      ineqStep(relationLine(answer, boundary), "ineq.flip-on-negative", {
        th: `หารด้วย ${gap} ซึ่งเป็นลบ เครื่องหมายกลับเป็น ${RELATIONS[answer].prose}`,
        en: `Divide by ${gap}, which is negative, so the sign turns to ${RELATIONS[answer].prose}.`,
      }),
    ],
    hints: [
      {
        th: "มีตัวแปรทั้งสองข้าง รวมไว้ข้างเดียวก่อน",
        en: "The variable is on both sides: gather it first.",
      },
      {
        th: `ย้าย ${coefficient(b, "x")} มาทางซ้าย จะได้สัมประสิทธิ์ ${gap}`,
        en: `Moving ${coefficient(b, "x")} left gives a coefficient of ${gap}.`,
      },
      {
        th: "สัมประสิทธิ์เป็นลบ ตอนหารต้องกลับเครื่องหมาย",
        en: "The coefficient is negative, so dividing turns the sign round.",
      },
    ],
  };
}

export const ineqLinearSolve: Generator = {
  id: "ineq.linear.solve",
  skillId: "ineq.linear.solve",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const built = solved(rng, difficulty);
    return {
      id: `${ineqLinearSolve.id}:${rng.seed}:${difficulty}`,
      generatorId: ineqLinearSolve.id,
      skillId: ineqLinearSolve.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: {
        th: "คำตอบของอสมการนี้คือข้อใด",
        en: "Which of these is the solution?",
      },
      stem: built.stem,
      // The answer is a relation, not a value: see the topic's header.
      machineStem: null,
      answer: { kind: "choice", correct: built.relation },
      choices: ALL_RELATIONS.map((relation) => ({
        id: relation,
        label: `x ${RELATIONS[relation].plain} ${built.boundary}`,
      })),
      steps: built.steps,
      hints: built.hints,
      rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
    };
  },
};

// ---------------------------------------------------------------------------
// จำนวนเต็มที่สอดคล้องกับอสมการ
// ---------------------------------------------------------------------------

/**
 * The largest (or smallest) whole number in a solution set.
 *
 * The boundary is deliberately not a whole number at difficulties 3 and 4: a
 * learner who has only met whole boundaries reads "x < 7, so 7" without ever
 * having to think about whether the boundary is included.
 */
function integerAnswer(relation: Relation, boundary: number): number {
  switch (relation) {
    case "lt":
      return Number.isInteger(boundary) ? boundary - 1 : Math.floor(boundary);
    case "le":
      return Math.floor(boundary);
    case "gt":
      return Number.isInteger(boundary) ? boundary + 1 : Math.ceil(boundary);
    case "ge":
      return Math.ceil(boundary);
  }
}

export const ineqLinearIntegers: Generator = {
  id: "ineq.linear.integers",
  skillId: "ineq.linear.integers",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const given = rng.pick(ALL_RELATIONS);
    const a = difficulty === 1 ? 1 : rng.int(2, 9);
    const c = rng.nonZeroInt(-12, 12);
    /*
     * At 1 and 2 the division comes out whole; from 3 it does not, which is
     * where "is the boundary itself allowed?" starts to matter.
     */
    const whole = difficulty <= 2;
    const target = rng.nonZeroInt(-8, 8);
    const k = whole ? a * target + c : a * target + c + rng.int(1, a - 1 || 1);

    const boundary = (k - c) / a;
    const answer = integerAnswer(given, boundary);
    const wanted = given === "lt" || given === "le";

    const solutionLine = `x ${RELATIONS[given].tex} ${
      Number.isInteger(boundary) ? boundary : `\\frac{${k - c}}{${a}}`
    }`;

    const steps: Step[] = [
      ineqStep(
        `${coefficient(a, "x")} ${RELATIONS[given].tex} ${k - c}`,
        "ineq.balance",
        {
          th: `ย้าย ${c} ไปอีกข้างก่อน`,
          en: `Move the ${c} across first.`,
        },
      ),
      ineqStep(solutionLine, "ineq.balance", {
        th: `หารด้วย ${a} ซึ่งเป็นจำนวนบวก เครื่องหมายไม่กลับ`,
        en: `Divide by ${a}; it is positive, so the sign stays.`,
      }),
      ineqStep(`x = ${answer}`, "ineq.integer-solutions", {
        th: Number.isInteger(boundary)
          ? `เครื่องหมาย ${RELATIONS[given].prose} ${given === "lt" || given === "gt" ? "ไม่รวมขอบเขต จึงต้องถอยมาหนึ่งจำนวนเต็ม" : "รวมขอบเขต ขอบเขตจึงเป็นคำตอบได้เอง"} ได้ ${answer}`
          : `${(k - c) / a} ไม่ใช่จำนวนเต็ม จำนวนเต็มที่${wanted ? "มาก" : "น้อย"}ที่สุดที่ใช้ได้คือ ${answer}`,
        en: Number.isInteger(boundary)
          ? `The sign ${RELATIONS[given].prose} ${given === "lt" || given === "gt" ? "excludes the boundary, so step back one whole number" : "includes the boundary, so it counts itself"}: ${answer}.`
          : `${(k - c) / a} is not a whole number, so the ${wanted ? "largest" : "smallest"} one that works is ${answer}.`,
      }),
    ];

    return {
      id: `${ineqLinearIntegers.id}:${rng.seed}:${difficulty}`,
      generatorId: ineqLinearIntegers.id,
      skillId: ineqLinearIntegers.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: {
        th: `จำนวนเต็มที่${wanted ? "มาก" : "น้อย"}ที่สุดที่สอดคล้องกับอสมการนี้คือจำนวนใด`,
        en: `What is the ${wanted ? "largest" : "smallest"} whole number that satisfies this inequality?`,
      },
      stem: `${linearExpr(a, c)} ${RELATIONS[given].tex} ${k}`,
      // The answer is an extreme value of a solution set, not a root.
      machineStem: null,
      answer: { kind: "exact", value: String(answer) },
      steps,
      misconceptions: namedMistakes({ kind: "exact", value: String(answer) }, [
        {
          answer: {
            kind: "exact",
            value: String(wanted ? answer + 1 : answer - 1),
          },
          explain: {
            th: Number.isInteger(boundary)
              ? `${boundary} เองใช้ไม่ได้ เพราะเครื่องหมายเป็น ${RELATIONS[given].prose} ซึ่งไม่รวมขอบเขต`
              : `${wanted ? answer + 1 : answer - 1} เกินขอบเขต ${(k - c) / a} ไปแล้ว ลองแทนกลับดูจะเห็นว่าไม่จริง`,
            en: Number.isInteger(boundary)
              ? `${boundary} itself does not work: the sign is ${RELATIONS[given].prose}, which excludes the boundary.`
              : `${wanted ? answer + 1 : answer - 1} is past the boundary ${(k - c) / a}. Substitute it back and the inequality is false.`,
          },
        },
      ]),
      hints: [
        {
          th: "แก้อสมการให้เหลือ x อยู่ข้างเดียวก่อน",
          en: "Solve it down to x on its own first.",
        },
        {
          th: `จะได้ ${RELATIONS[given].prose} ${(k - c) / a}`,
          en: `That gives ${RELATIONS[given].prose} ${(k - c) / a}.`,
        },
        {
          th: "แล้วดูว่าขอบเขตนั้นนับเป็นคำตอบได้หรือไม่",
          en: "Then check whether the boundary itself counts.",
        },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/** Exported for the chapter's own test, which checks the solution sets. */
export const inequalityHelpers = { RELATIONS, holds, integerAnswer };
