import { linearExpr, power } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "seq.basic";

/**
 * ลำดับเลขคณิตและลำดับเรขาคณิต · ม.ปลาย.
 *
 * Both generators here build the sequence forwards from `a_1` and the step,
 * and then ask about it - so the sequence in the stem and the answer cannot
 * disagree, because there is only one sequence and it was made first.
 *
 * `a_n` is a subscript and `lib/math/katex.ts` refuses subscripts, so the
 * stems say `machineStem: null` and `seq-basic.test.ts` rebuilds each sequence
 * term by term instead. The answers are ordinary numbers and expressions in
 * `n`, which the marker checks as it checks anything else.
 */

/**
 * `a_1 r^{n-1}` as mathjs source, without a coefficient of one in front of it.
 *
 * `-1 * (4)^(n - 1)` renders as `-1 \cdot 4^{n-1}`, which nobody writes and
 * `answer-accepted.test.ts` refuses.
 */
function timesPower(coefficient: number, base: number, exponent: string): string {
  const body = `(${base})^(${exponent})`;
  if (coefficient === 1) return body;
  if (coefficient === -1) return `-${body}`;
  return `${coefficient} * ${body}`;
}

/** `3, 7, 11, 15, \ldots` - the run of terms a question shows. */
function listed(terms: number[], { open = true } = {}): string {
  return `${terms.join(", ")}${open ? ", \\ldots" : ""}`;
}

const nth = (n: number) => ({
  th: `พจน์ที่ ${n}`,
  en: `term ${n}`,
});

export const seqArithmetic: Generator = {
  id: "seq.arithmetic",
  skillId: "seq.arithmetic",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 4) return fromTwoTerms(rng, difficulty);

    const first = rng.int(-9, 12);
    // Never zero: a sequence that never moves is not an example of anything.
    const difference = rng.pick([
      ...Array.from({ length: 9 }, (_, i) => i + 2),
      ...Array.from({ length: 9 }, (_, i) => -(i + 2)),
    ]);

    const shown = 4;
    const terms = Array.from(
      { length: shown },
      (_, index) => first + index * difference,
    );
    const stem = listed(terms);

    /*
     * Difficulty 1 asks for the next term, 2 for the general term and 3 for a
     * term far enough away that counting on is not an option - which is the
     * whole reason the formula is worth having.
     */
    const wanted = difficulty === 3 ? rng.int(20, 60) : shown + 1;
    const value = first + (wanted - 1) * difference;
    const general = linearExpr(difference, first - difference, "n");

    const asksGeneral = difficulty === 2;
    /*
     * `linearExpr` rather than a template: `4n + -7` parses and reads like a
     * typo, and the model answer is what a learner copies down.
     */
    const answer: Answer = {
      kind: "exact",
      value: asksGeneral ? general : String(value),
    };

    const steps: Step[] = [
      makeStep(
        `d = ${terms[1]} - ${terms[0]} = ${difference}`,
        "seq.common-difference",
        {
          th: `พจน์ที่สองลบพจน์แรก ได้ผลต่างร่วม ${difference}`,
          en: `The second term minus the first gives a common difference of ${difference}.`,
        },
        { math: null },
      ),
      makeStep(
        `a_n = ${first} + (n - 1)(${difference})`,
        "seq.arithmetic-nth",
        {
          th: `แทน a_1 = ${first} และ d = ${difference} ลงในสูตรพจน์ทั่วไป`,
          en: `Put a_1 = ${first} and d = ${difference} into the nth term formula.`,
        },
        { math: null },
      ),
      makeStep(
        asksGeneral ? `a_n = ${general}` : `a_{${wanted}} = ${value}`,
        "seq.arithmetic-nth",
        asksGeneral
          ? {
              th: "กระจายวงเล็บแล้วรวมพจน์คล้าย",
              en: "Open the bracket and collect the like terms.",
            }
          : {
              th: `แทน n = ${wanted} ลงไป`,
              en: `Putting n = ${wanted} in gives the answer.`,
            },
        { math: null },
      ),
    ];

    return {
      ...shell(seqArithmetic, rng, difficulty),
      prompt: asksGeneral
        ? {
            th: "ลำดับต่อไปนี้เป็นลำดับเลขคณิต จงหาพจน์ทั่วไป a_n",
            en: "This is an arithmetic sequence. Find its general term, a_n",
          }
        : {
            th: `ลำดับต่อไปนี้เป็นลำดับเลขคณิต จงหา${nth(wanted).th}`,
            en: `This is an arithmetic sequence. Find ${nth(wanted).en}`,
          },
      stem,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "หาผลต่างร่วมก่อน โดยเอาพจน์หนึ่งลบด้วยพจน์ก่อนหน้า",
          en: "Find the common difference first: any term minus the one before it.",
        },
        {
          th: `ผลต่างร่วมคือ ${difference}`,
          en: `The common difference is ${difference}.`,
        },
        {
          th: "ใช้สูตร a_n = a_1 + (n-1)d และระวังว่าเป็น n-1 ไม่ใช่ n",
          en: "Use a_n = a_1 + (n-1)d, and mind that it is n minus one, not n.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: asksGeneral
              ? linearExpr(difference, first, "n")
              : String(first + wanted * difference),
          },
          explain: {
            th: "บวกผลต่างร่วมไปหนึ่งครั้งมากเกินไป จากพจน์แรกถึงพจน์ที่ n มีช่องว่าง n-1 ช่อง",
            en: "One common difference too many: there are n minus one gaps between the first term and the nth.",
          },
        },
        {
          answer: {
            kind: "exact",
            value: asksGeneral
              ? linearExpr(first, difference, "n")
              : String(difference + (wanted - 1) * first),
          },
          explain: {
            th: "สลับที่ระหว่างพจน์แรกกับผลต่างร่วม ตัวที่คูณกับ n คือผลต่างร่วม",
            en: "The first term and the common difference have swapped places; it is the difference that multiplies n.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/**
 * Difficulty 4: two terms given, neither of them the first.
 *
 * Two facts and two unknowns, which makes it the first question in the chapter
 * that has to be *solved* rather than read off. The gap between the two given
 * terms divides exactly, so `d` stays whole.
 */
function fromTwoTerms(rng: RNG, difficulty: number): Question {
  const first = rng.int(-6, 10);
  const difference = rng.pick([2, 3, 4, 5, 6, -2, -3, -4, -5]);
  const lower = rng.int(3, 7);
  const upper = lower + rng.int(3, 8);

  const lowerValue = first + (lower - 1) * difference;
  const upperValue = first + (upper - 1) * difference;
  const wanted = upper + rng.int(2, 10);
  const value = first + (wanted - 1) * difference;

  const steps: Step[] = [
    makeStep(
      `(${upper} - ${lower})d = ${upperValue} - ${lowerValue}`,
      "seq.common-difference",
      {
        th: `ระหว่างพจน์ที่ ${lower} กับพจน์ที่ ${upper} มีช่องว่าง ${upper - lower} ช่อง`,
        en: `There are ${upper - lower} gaps between term ${lower} and term ${upper}.`,
      },
      { math: null },
    ),
    makeStep(
      `d = ${difference}`,
      "seq.common-difference",
      {
        th: `หารด้วย ${upper - lower} ได้ผลต่างร่วม`,
        en: `Dividing by ${upper - lower} gives the common difference.`,
      },
      { math: null },
    ),
    makeStep(
      `a_1 = ${lowerValue} - ${lower - 1}(${difference}) = ${first}`,
      "seq.arithmetic-nth",
      {
        th: `ถอยกลับจากพจน์ที่ ${lower} ไป ${lower - 1} ช่อง ได้พจน์แรก`,
        en: `Stepping back ${lower - 1} gaps from term ${lower} gives the first term.`,
      },
      { math: null },
    ),
    makeStep(
      `a_{${wanted}} = ${value}`,
      "seq.arithmetic-nth",
      {
        th: `แล้วเดินหน้าไปถึงพจน์ที่ ${wanted}`,
        en: `Then forward to term ${wanted}.`,
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: String(value) };

  return {
    ...shell(seqArithmetic, rng, difficulty),
    prompt: {
      th: `ลำดับเลขคณิตลำดับหนึ่งมีพจน์ที่ ${lower} เท่ากับ ${lowerValue} และพจน์ที่ ${upper} เท่ากับ ${upperValue} จงหาพจน์ที่ ${wanted}`,
      en: `An arithmetic sequence has term ${lower} equal to ${lowerValue} and term ${upper} equal to ${upperValue}. Find term ${wanted}.`,
    },
    stem: `a_{${lower}} = ${lowerValue}, \\quad a_{${upper}} = ${upperValue}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: `จากพจน์ที่ ${lower} ไปพจน์ที่ ${upper} บวก d ไปกี่ครั้ง`,
        en: `How many times has d been added between term ${lower} and term ${upper}?`,
      },
      {
        th: `${upper - lower} ครั้ง จึงหาผลต่างร่วมได้`,
        en: `${upper - lower} times, which gives the common difference.`,
      },
      {
        th: `ผลต่างร่วมคือ ${difference} แล้วเดินหน้าไปถึงพจน์ที่ ${wanted}`,
        en: `It is ${difference}; now walk forward to term ${wanted}.`,
      },
    ],
    ...mistakes(answer, [
      {
        answer: {
          kind: "exact",
          value: String(
            lowerValue +
              Math.round((upperValue - lowerValue) / (upper - lower + 1)) *
                (wanted - lower),
          ),
        },
        explain: {
          th: `หารด้วยจำนวนพจน์แทนที่จะเป็นจำนวนช่องว่าง ระหว่างพจน์ที่ ${lower} กับ ${upper} มีช่องว่าง ${upper - lower} ช่อง`,
          en: `Dividing by how many terms rather than how many gaps: there are ${upper - lower} gaps between them.`,
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/**
 * How far a geometric sequence can run before the numbers stop being numbers
 * a person would write. Five to the fourteenth is six thousand million.
 */
const LAST_TIDY_TERM: Record<number, number> = { 2: 12, 3: 9, 4: 7, 5: 7 };

export const seqGeometric: Generator = {
  id: "seq.geometric",
  skillId: "seq.geometric",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 4) return fromTwoGeometricTerms(rng, difficulty);

    const ratio = rng.pick(
      difficulty === 1 ? [2, 3, 2, 5] : [2, 3, -2, 4, -3, 5],
    );
    const first = rng.int(1, 9) * (rng.bool() ? 1 : -1);

    const shown = 4;
    const terms = Array.from(
      { length: shown },
      (_, index) => first * ratio ** index,
    );
    const stem = listed(terms);

    const asksGeneral = difficulty === 2;
    const wanted =
      difficulty === 3
        ? rng.int(6, LAST_TIDY_TERM[Math.abs(ratio)] ?? 8)
        : shown + 1;
    const value = first * ratio ** (wanted - 1);
    const generalMath = timesPower(first, ratio, "n - 1");

    const answer: Answer = {
      kind: "exact",
      value: asksGeneral ? generalMath : String(value),
    };

    const steps: Step[] = [];

    {
      steps.push(
        makeStep(
          `r = \\frac{${terms[1]}}{${terms[0]}} = ${ratio}`,
          "seq.common-ratio",
          {
            th: `พจน์ที่สองหารพจน์แรก ได้อัตราส่วนร่วม ${ratio}`,
            en: `The second term over the first gives a common ratio of ${ratio}.`,
          },
          { math: null },
        ),
        makeStep(
          `a_n = ${first} \\cdot ${power(String(ratio), "n-1")}`,
          "seq.geometric-nth",
          {
            th: `แทน a_1 = ${first} และ r = ${ratio} ลงในสูตรพจน์ทั่วไป`,
            en: `Put a_1 = ${first} and r = ${ratio} into the nth term formula.`,
          },
          { math: null },
        ),
      );
      if (!asksGeneral) {
        steps.push(
          makeStep(
            `a_{${wanted}} = ${first} \\cdot ${power(String(ratio), String(wanted - 1))} = ${value}`,
            "seq.geometric-nth",
            {
              th: `แทน n = ${wanted} เลขชี้กำลังจึงเป็น ${wanted - 1}`,
              en: `With n = ${wanted} the exponent is ${wanted - 1}.`,
            },
            { math: null },
          ),
        );
      }
    }

    return {
      ...shell(seqGeometric, rng, difficulty),
      prompt: asksGeneral
        ? {
            th: "ลำดับต่อไปนี้เป็นลำดับเรขาคณิต จงหาพจน์ทั่วไป a_n",
            en: "This is a geometric sequence. Find its general term, a_n",
          }
        : {
            th: `ลำดับต่อไปนี้เป็นลำดับเรขาคณิต จงหา${nth(wanted).th}`,
            en: `This is a geometric sequence. Find ${nth(wanted).en}`,
          },
      stem,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "หาอัตราส่วนร่วมก่อน โดยเอาพจน์หนึ่งหารด้วยพจน์ก่อนหน้า",
          en: "Find the common ratio first: any term divided by the one before it.",
        },
        {
          th: `อัตราส่วนร่วมคือ ${ratio}`,
          en: `The common ratio is ${ratio}.`,
        },
        {
          th: "ใช้สูตร a_n = a_1 r^{n-1} เลขชี้กำลังน้อยกว่าลำดับที่ของพจน์อยู่หนึ่ง",
          en: "Use a_n = a_1 r^(n-1): the exponent is one less than the term's position.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: asksGeneral
              ? timesPower(first, ratio, "n")
              : String(first * ratio ** wanted),
          },
          explain: {
            th: "เลขชี้กำลังเกินไปหนึ่ง พจน์แรกคูณด้วย r ศูนย์ครั้ง เลขชี้กำลังจึงเป็น n-1",
            en: "The exponent is one too big: the first term has been multiplied by r no times at all, so the exponent is n minus one.",
          },
        },
        {
          answer: {
            kind: "exact",
            value: asksGeneral
              ? `${first * ratio} * (n - 1)`
              : String(first + (wanted - 1) * ratio),
          },
          explain: {
            th: "นี่คือสูตรของลำดับเลขคณิต ลำดับเรขาคณิตคูณด้วยอัตราส่วนร่วม ไม่ได้บวก",
            en: "That is the arithmetic formula. A geometric sequence multiplies by its ratio; it does not add it.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/**
 * Difficulty 4: two terms two places apart, and neither is the first.
 *
 * The first term is never needed, which is the point: what identifies a
 * geometric sequence is its ratio, and any term can be walked to from any
 * other. The two given terms are two gaps apart, so their quotient is `r^2`
 * and the sign has to come from the question rather than from the square root.
 */
function fromTwoGeometricTerms(rng: RNG, difficulty: number): Question {
  const ratio = rng.pick([2, 3, -2, -3, 4]);
  const first = rng.int(1, 6) * (rng.bool() ? 1 : -1);
  const from = rng.int(2, 4);
  const wanted = from + rng.int(3, 5);

  const at = (position: number) => first * ratio ** (position - 1);
  const lower = at(from);
  const upper = at(from + 2);
  const value = at(wanted);

  const steps: Step[] = [
    makeStep(
      `r^2 = \\frac{${upper}}{${lower}} = ${ratio ** 2}`,
      "seq.common-ratio",
      {
        th: "สองพจน์ที่ห่างกันสองช่อง ผลหารจึงเป็นอัตราส่วนร่วมยกกำลังสอง",
        en: "The two terms are two gaps apart, so their quotient is the ratio squared.",
      },
      { math: null },
    ),
    makeStep(
      `r = ${ratio}`,
      "seq.common-ratio",
      {
        th: `โจทย์บอกว่าอัตราส่วนร่วมเป็น${ratio < 0 ? "ลบ" : "บวก"} จึงได้ ${ratio}`,
        en: `The question says the ratio is ${ratio < 0 ? "negative" : "positive"}, which settles it at ${ratio}.`,
      },
      { math: null },
    ),
    makeStep(
      `a_{${wanted}} = ${lower} \\cdot ${power(String(ratio), String(wanted - from))} = ${value}`,
      "seq.geometric-nth",
      {
        th: `จากพจน์ที่ ${from} เดินหน้าอีก ${wanted - from} ช่อง ไม่ต้องหาพจน์แรกเลย`,
        en: `That is ${wanted - from} gaps on from term ${from}, with no need for the first term at all.`,
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: String(value) };

  return {
    ...shell(seqGeometric, rng, difficulty),
    prompt: {
      th: `ลำดับเรขาคณิตลำดับหนึ่งมีพจน์ที่ ${from} เท่ากับ ${lower} และพจน์ที่ ${from + 2} เท่ากับ ${upper} โดยอัตราส่วนร่วมเป็น${ratio < 0 ? "ลบ" : "บวก"} จงหาพจน์ที่ ${wanted}`,
      en: `A geometric sequence has term ${from} equal to ${lower} and term ${from + 2} equal to ${upper}, with a ${ratio < 0 ? "negative" : "positive"} common ratio. Find term ${wanted}.`,
    },
    stem: `a_{${from}} = ${lower}, \\quad a_{${from + 2}} = ${upper}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: `พจน์ทั้งสองห่างกันกี่ช่อง และคูณด้วย r ไปกี่ครั้ง`,
        en: `How many gaps apart are those two terms, and how many times has r been used?`,
      },
      {
        th: "สองครั้ง ผลหารจึงเป็น r ยกกำลังสอง",
        en: "Twice - so the quotient is r squared.",
      },
      {
        th: `r = ${ratio} แล้วเดินหน้าจากพจน์ที่ ${from} อีก ${wanted - from} ช่อง`,
        en: `r is ${ratio}; now go ${wanted - from} gaps on from term ${from}.`,
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: String(lower * ratio ** (wanted - from + 1)) },
        explain: {
          th: `นับช่องเกินไปหนึ่งช่อง จากพจน์ที่ ${from} ถึงพจน์ที่ ${wanted} มี ${wanted - from} ช่อง`,
          en: `One gap too many: from term ${from} to term ${wanted} is ${wanted - from} gaps.`,
        },
      },
      {
        answer: { kind: "exact", value: String(-value) },
        explain: {
          th: "เครื่องหมายผิด อัตราส่วนร่วมที่เป็นลบทำให้พจน์สลับเครื่องหมายทุกครั้งที่คูณ",
          en: "Wrong sign: a negative ratio flips the sign at every single step.",
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

