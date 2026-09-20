import { coefficient, paren, sumTerms } from "../format";
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
 * ผลบวกและผลต่างของกำลังสาม.
 *
 * Built backwards from `g(px ± q)(p^2x^2 ∓ pqx + q^2)`, which expands to
 * `g(p^3x^3 ± q^3)` - so the question is two terms and the answer is known.
 *
 * The trinomial left behind never factors again, and that is worth knowing
 * rather than checking: its discriminant is `p^2q^2 - 4p^2q^2 = -3p^2q^2`,
 * negative for every `p` and `q` this generator can draw. A difference of
 * *squares* invites you to keep going; a difference of cubes does not.
 *
 * The named mistake is the middle sign. `a^3 + b^3` is
 * `(a+b)(a^2 - ab + b^2)` - the trinomial's middle term takes the opposite
 * sign to the one between the cubes - and writing the same sign twice is what
 * the Thai chant exists to prevent.
 */
function build(rng: RNG, difficulty: Difficulty) {
  /** The answer is `g(px + s·q)(p^2x^2 - s·pqx + q^2)`. */
  const p = difficulty === 2 || difficulty === 4 ? rng.int(2, difficulty === 2 ? 4 : 3) : 1;
  const g = difficulty >= 3 ? rng.int(2, difficulty === 3 ? 6 : 5) : 1;
  const q = rng.int(1, difficulty === 1 ? 10 : difficulty === 2 ? 8 : 6);
  const sign = rng.sign();

  const cubeOne = p ** 3;
  const cubeTwo = q ** 3;

  const stem = sumTerms([
    coefficient(g * cubeOne, "x^3"),
    String(sign * g * cubeTwo),
  ]);

  const front = coefficient(p, "x");
  const linear = sumTerms([front, String(sign * q)]);
  /** `p^2x^2 ∓ pqx + q^2`: the middle sign is the opposite of `sign`. */
  const quadratic = sumTerms([
    coefficient(p * p, "x^2"),
    coefficient(-sign * p * q, "x"),
    String(q * q),
  ]);

  const answerKatex = `${g === 1 ? "" : g}${paren(linear)}${paren(quadratic)}`;
  const answerMath = `${g === 1 ? "" : `${g}*`}(${linear})*(${quadratic})`;

  const steps: Step[] = [];

  if (g > 1) {
    steps.push(
      makeStep(
        `${g}${paren(sumTerms([coefficient(cubeOne, "x^3"), String(sign * cubeTwo)]))}`,
        "quad.common-factor",
        {
          th: `ทุกพจน์หารด้วย ${g} ลงตัว ดึงออกมาก่อน แล้วข้างในจึงจะเป็นกำลังสามพอดี`,
          en: `Every term is divisible by ${g}. Take it out and what is left is a pair of cubes.`,
        },
      ),
    );
  }

  const cubes = sumTerms([`${paren(front)}^3`, `${sign < 0 ? "-" : ""}${q}^3`]);
  const rule = sign > 0 ? "poly.sum-cubes" : "poly.diff-cubes";

  steps.push(
    makeStep(g === 1 ? cubes : `${g}${paren(cubes)}`, rule, {
      th: `${coefficient(cubeOne, "x^3")} คือ ${paren(front)}^3 และ ${cubeTwo} คือ ${q}^3`,
      en: `${coefficient(cubeOne, "x^3")} is ${paren(front)}^3, and ${cubeTwo} is ${q}^3.`,
    }),
    makeStep(answerKatex, rule, {
      th:
        sign > 0
          ? `ผลบวกของกำลังสาม: หน้าบวกหลัง คูณ หน้ากำลังสอง ลบหน้าหลัง บวกหลังกำลังสอง`
          : `ผลต่างของกำลังสาม: หน้าลบหลัง คูณ หน้ากำลังสอง บวกหน้าหลัง บวกหลังกำลังสอง`,
      en:
        sign > 0
          ? `A sum of cubes: the sum, times the trinomial whose middle term is negative.`
          : `A difference of cubes: the difference, times the trinomial whose middle term is positive.`,
    }),
  );

  const prefix = g === 1 ? "" : `${g}*`;

  const misconceptions: Misconception[] = namedMistakes(
    { kind: "exact", value: answerMath },
    [
      /*
       * The middle sign, copied from the sign between the cubes instead of
       * being flipped. The single most common slip on this pattern.
       */
      {
        answer: {
          kind: "exact",
          value: `${prefix}(${linear})*(${sumTerms([
            coefficient(p * p, "x^2"),
            coefficient(sign * p * q, "x"),
            String(q * q),
          ])})`,
        },
        explain: {
          th: `เครื่องหมายกลางของตรีนามต้องตรงข้ามกับเครื่องหมายระหว่างสองกำลังสาม ${paren(linear)} คูณกลับกับตรีนามนั้นจะไม่ได้โจทย์เดิม`,
          en: `The trinomial's middle sign is the opposite of the one between the cubes; multiplied back out, that version is not the question.`,
        },
      },
      /*
       * Treating `a^3 + b^3` as `(a + b)^3`, which is the same reflex as
       * reading a difference of squares as a perfect square.
       */
      {
        answer: { kind: "exact", value: `${prefix}(${linear})^3` },
        explain: {
          th: `${paren(linear)}^3 คูณกลับได้สี่พจน์ ไม่ใช่สองพจน์ - กำลังสามของผลบวกกับผลบวกของกำลังสามเป็นคนละเรื่องกัน`,
          en: `${paren(linear)}^3 multiplies back to four terms, not two. The cube of a sum and a sum of cubes are different things.`,
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
        th: "มีแค่สองพจน์ และทั้งสองเป็นกำลังสามพอดี",
        en: "There are only two terms, and both are perfect cubes.",
      },
      {
        th: `${coefficient(g * cubeOne, "x^3")} และ ${g * cubeTwo} เป็นกำลังสามของอะไร`,
        en: `What are ${coefficient(g * cubeOne, "x^3")} and ${g * cubeTwo} cubes of?`,
      },
      {
        th: `ใช้สูตร${sign > 0 ? "ผลบวก" : "ผลต่าง"}ของกำลังสาม และอย่าลืมว่าเครื่องหมายกลางของตรีนามกลับด้านกับเครื่องหมายในวงเล็บแรก`,
        en: `Use the ${sign > 0 ? "sum" : "difference"} of cubes, and remember the trinomial's middle sign is the other way round.`,
      },
    ],
  };
}

export const polyCubes: Generator = {
  id: "poly.cubes",
  skillId: "poly.cubes",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const built = build(rng, difficulty);
    return {
      id: `${polyCubes.id}:${rng.seed}:${difficulty}`,
      generatorId: polyCubes.id,
      skillId: polyCubes.skillId,
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
