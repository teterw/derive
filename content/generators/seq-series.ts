import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "seq.basic";

/**
 * อนุกรมเลขคณิตและอนุกรมเรขาคณิต · ม.ปลาย.
 *
 * A series is a sequence with plus signs between the terms, and the whole
 * chapter is one idea: there is a shortcut, so you never add them up one at a
 * time. Every sum here is therefore checked *both* ways in
 * `seq-basic.test.ts` - by the formula and by actually adding the terms - which
 * is the only honest test of a shortcut.
 */

/** `3 + 7 + 11 + \cdots + 43` as a learner sees it. */
function written(terms: number[], last: number): string {
  return `${terms.join(" + ")} + \\cdots + ${last}`;
}

export const seriesArithmetic: Generator = {
  id: "series.arithmetic",
  skillId: "series.arithmetic",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 4) return countTheTerms(rng, difficulty);

    const first = rng.int(-8, 12);
    const difference = rng.pick([2, 3, 4, 5, 6, 7, -2, -3, -4, -5]);
    const count = difficulty === 1 ? rng.int(5, 12) : rng.int(10, 40);

    const last = first + (count - 1) * difference;
    const sum = (count * (first + last)) / 2;

    const shown = Array.from(
      { length: 3 },
      (_, index) => first + index * difference,
    );

    /*
     * At 1 the number of terms is given outright; at 2 and 3 the series is
     * written out to its last term and how many there are has to be worked out
     * first, which is where the fence-post mistake lives.
     */
    const givesCount = difficulty === 1;
    const stem = givesCount
      ? `a_1 = ${first}, \\quad d = ${difference}, \\quad n = ${count}`
      : written(shown, last);

    const steps: Step[] = [];

    if (!givesCount) {
      steps.push(
        makeStep(
          `n = \\frac{${last} - ${first}}{${difference}} + 1 = ${count}`,
          "seq.how-many-terms",
          {
            th: `นับช่องว่างได้ ${count - 1} ช่อง จึงมีพจน์ทั้งหมด ${count} พจน์`,
            en: `That is ${count - 1} gaps, so there are ${count} terms.`,
          },
          { math: null },
        ),
      );
    }

    steps.push(
      makeStep(
        givesCount
          ? `S_{${count}} = \\frac{${count}}{2}\\left(2(${first}) + ${count - 1}(${difference})\\right)`
          : `S_{${count}} = \\frac{${count}}{2}(${first} + ${last})`,
        "series.arithmetic-sum",
        givesCount
          ? {
              th: "ยังไม่รู้พจน์สุดท้าย จึงใช้สูตรรูปที่เขียนด้วย d",
              en: "The last term is not known, so use the form written with d.",
            }
          : {
              th: `จับพจน์แรกกับพจน์สุดท้ายเข้าคู่กัน ได้ ${first + last} ทุกคู่`,
              en: `Pairing the ends gives ${first + last} every time.`,
            },
        { math: null },
      ),
      makeStep(
        `S_{${count}} = ${sum}`,
        "series.arithmetic-sum",
        {
          th: "คิดเลขออกมาได้ผลบวก",
          en: "Working it out gives the sum.",
        },
        { math: null },
      ),
    );

    const answer: Answer = { kind: "exact", value: String(sum) };

    return {
      ...shell(seriesArithmetic, rng, difficulty),
      prompt: givesCount
        ? {
            th: `อนุกรมเลขคณิตมีพจน์แรก ${first} ผลต่างร่วม ${difference} จงหาผลบวก ${count} พจน์แรก`,
            en: `An arithmetic series has first term ${first} and common difference ${difference}. Find the sum of the first ${count} terms.`,
          }
        : {
            th: "จงหาผลบวกของอนุกรมเลขคณิตต่อไปนี้",
            en: "Find the sum of this arithmetic series",
          },
      stem,
      machineStem: null,
      answer,
      steps,
      hints: [
        givesCount
          ? {
              th: "ใช้สูตร S_n = \\frac{n}{2}(2a_1 + (n-1)d) เมื่อยังไม่รู้พจน์สุดท้าย",
              en: "Use the form with d when the last term is not known.",
            }
          : {
              th: "หาจำนวนพจน์ก่อน นับช่องว่างแล้วบวกหนึ่ง",
              en: "Find how many terms there are first: count the gaps and add one.",
            },
        {
          th: `มีทั้งหมด ${count} พจน์`,
          en: `There are ${count} terms.`,
        },
        {
          th: `พจน์แรกบวกพจน์สุดท้ายได้ ${first + last} แล้วคูณด้วยครึ่งหนึ่งของจำนวนพจน์`,
          en: `The two ends add to ${first + last}; multiply by half the number of terms.`,
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: String(((count - 1) * (first + last)) / 2),
          },
          explain: {
            th: "ใช้จำนวนช่องว่างแทนจำนวนพจน์ จำนวนพจน์มากกว่าช่องว่างอยู่หนึ่ง",
            en: "Counting gaps where terms belong: there is always one more term than there are gaps.",
          },
        },
        {
          answer: { kind: "exact", value: String(count * (first + last)) },
          explain: {
            th: "ลืมหารสอง แต่ละคู่ถูกนับสองครั้งในผลคูณนั้น",
            en: "The halving is missing: that product counts every pair twice.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/**
 * Difficulty 4: the sum is given and the number of terms is not.
 *
 * `\frac{n}{2}(2a_1 + (n-1)d) = S` is a quadratic in n, so this is the first
 * place the algebra from ม.3 is needed for something that is not algebra. The
 * numbers are chosen so the useful root is a whole number and the other is
 * negative - and a negative number of terms is the sort of answer that has to
 * be thrown away rather than written down.
 */
function countTheTerms(rng: RNG, difficulty: number): Question {
  const first = rng.int(1, 9);
  const difference = rng.pick([2, 3, 4, 5, 6]);
  const count = rng.int(5, 14);
  const sum = (count * (2 * first + (count - 1) * difference)) / 2;

  const steps: Step[] = [
    makeStep(
      `\\frac{n}{2}\\left(2(${first}) + (n - 1)(${difference})\\right) = ${sum}`,
      "series.arithmetic-sum",
      {
        th: "เขียนสูตรผลบวกโดยให้จำนวนพจน์เป็นตัวไม่ทราบค่า",
        en: "Write the sum formula with the number of terms as the unknown.",
      },
      { math: null },
    ),
    makeStep(
      `${difference}n^2 + ${2 * first - difference}n - ${2 * sum} = 0`,
      "quad.zero-product",
      {
        th: "คูณสองทั้งสองข้างแล้วจัดให้อยู่ในรูปสมการกำลังสอง",
        en: "Double both sides and tidy it into a quadratic.",
      },
      { math: null },
    ),
    makeStep(
      `n = ${count}`,
      "model.reject-root",
      {
        th: "อีกรากหนึ่งเป็นจำนวนลบ ซึ่งเป็นจำนวนพจน์ไม่ได้",
        en: "The other root is negative, and a count of terms cannot be.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: String(count) };

  return {
    ...shell(seriesArithmetic, rng, difficulty),
    prompt: {
      th: `อนุกรมเลขคณิตมีพจน์แรก ${first} และผลต่างร่วม ${difference} ถ้าผลบวก n พจน์แรกเท่ากับ ${sum} จงหา n`,
      en: `An arithmetic series has first term ${first} and common difference ${difference}. If the sum of the first n terms is ${sum}, find n.`,
    },
    stem: `S_n = ${sum}, \\quad a_1 = ${first}, \\quad d = ${difference}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "ใส่สิ่งที่รู้ลงในสูตรผลบวก แล้วจะเหลือ n เป็นตัวไม่ทราบค่าตัวเดียว",
        en: "Put what you know into the sum formula and n is the only unknown left.",
      },
      {
        th: "คูณสองทั้งสองข้างเพื่อกำจัดเศษส่วน จะได้สมการกำลังสอง",
        en: "Double both sides to clear the fraction, and a quadratic appears.",
      },
      {
        th: "จะได้สองราก แต่จำนวนพจน์ต้องเป็นจำนวนเต็มบวก",
        en: "Two roots come out, but a number of terms has to be a positive whole number.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: String(count + 1) },
        explain: {
          th: "เกินไปหนึ่งพจน์ ลองบวกดูว่าผลบวกเกิน {sum} หรือไม่",
          en: "One term too many - add them up and the total overshoots.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

/** Ratios whose powers stay small enough to write out. */
const RATIOS = [2, 3, -2, 4, -3];

export const seriesGeometric: Generator = {
  id: "series.geometric",
  skillId: "series.geometric",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const ratio = rng.pick(difficulty === 1 ? [2, 3] : RATIOS);
    const first = rng.int(1, 8) * (difficulty >= 3 && rng.bool() ? -1 : 1);
    const count =
      difficulty === 1
        ? rng.int(4, 6)
        : Math.abs(ratio) === 2
          ? rng.int(6, 11)
          : rng.int(5, 7);

    const last = first * ratio ** (count - 1);
    const sum = (first * (ratio ** count - 1)) / (ratio - 1);

    const shown = Array.from(
      { length: 3 },
      (_, index) => first * ratio ** index,
    );

    /*
     * At 4 the series is written out and the number of terms is not given, so
     * it has to come from the last term - which needs the nth term formula
     * before the sum formula can even be started.
     */
    const givesCount = difficulty <= 3;
    const stem = givesCount
      ? `a_1 = ${first}, \\quad r = ${ratio}, \\quad n = ${count}`
      : written(shown, last);

    const steps: Step[] = [];

    if (!givesCount) {
      steps.push(
        makeStep(
          `${first} \\cdot ${ratio}^{n-1} = ${last}`,
          "seq.geometric-nth",
          {
            th: `พจน์สุดท้ายคือ ${last} จึงหาได้ว่ามีกี่พจน์`,
            en: `The last term is ${last}, which says how many there are.`,
          },
          { math: null },
        ),
        makeStep(
          `n = ${count}`,
          "seq.geometric-nth",
          {
            th: `เทียบเลขชี้กำลังได้ n = ${count}`,
            en: `Matching the exponents gives n = ${count}.`,
          },
          { math: null },
        ),
      );
    }

    steps.push(
      makeStep(
        `S_{${count}} = \\frac{${first}\\left(${ratio}^{${count}} - 1\\right)}{${ratio} - 1}`,
        "series.geometric-sum",
        {
          th: `แทน a_1 = ${first}, r = ${ratio}, n = ${count} ลงในสูตร`,
          en: `Put a_1 = ${first}, r = ${ratio} and n = ${count} into the formula.`,
        },
        { math: null },
      ),
      makeStep(
        `S_{${count}} = ${sum}`,
        "series.geometric-sum",
        {
          th: "คิดเลขออกมาได้ผลบวก",
          en: "Working it out gives the sum.",
        },
        { math: null },
      ),
    );

    const answer: Answer = { kind: "exact", value: String(sum) };

    return {
      ...shell(seriesGeometric, rng, difficulty),
      prompt: givesCount
        ? {
            th: `อนุกรมเรขาคณิตมีพจน์แรก ${first} อัตราส่วนร่วม ${ratio} จงหาผลบวก ${count} พจน์แรก`,
            en: `A geometric series has first term ${first} and common ratio ${ratio}. Find the sum of the first ${count} terms.`,
          }
        : {
            th: "จงหาผลบวกของอนุกรมเรขาคณิตต่อไปนี้",
            en: "Find the sum of this geometric series",
          },
      stem,
      machineStem: null,
      answer,
      steps,
      hints: [
        givesCount
          ? {
              th: "ใช้สูตร S_n = \\frac{a_1(r^n - 1)}{r - 1}",
              en: "Use the geometric sum formula.",
            }
          : {
              th: "หาจำนวนพจน์ก่อน จากพจน์สุดท้ายกับสูตรพจน์ทั่วไป",
              en: "Find how many terms there are first, from the last term.",
            },
        {
          th: `มีทั้งหมด ${count} พจน์ และอัตราส่วนร่วมคือ ${ratio}`,
          en: `There are ${count} terms and the ratio is ${ratio}.`,
        },
        {
          th: "เลขชี้กำลังในสูตรผลบวกคือจำนวนพจน์ ไม่ใช่จำนวนพจน์ลบหนึ่ง",
          en: "The exponent in the sum formula is how many terms there are, not one less.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: String((first * (ratio ** (count - 1) - 1)) / (ratio - 1)),
          },
          explain: {
            th: "ใช้เลขชี้กำลัง n-1 ซึ่งเป็นของสูตรพจน์ทั่วไป สูตรผลบวกใช้ n",
            en: "That is the nth term formula's exponent. The sum formula uses n itself.",
          },
        },
        {
          answer: { kind: "exact", value: String(-sum) },
          explain: {
            th: "สลับเครื่องหมายของตัวเศษหรือตัวส่วน ทั้งสองต้องไปทางเดียวกัน",
            en: "One of the two subtractions is the wrong way round; they have to match.",
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
