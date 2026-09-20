import { coefficient, linearExpr, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Answer, Generator, L, Question, RNG, Step } from "../types";

const TOPIC = "c1.derivative";

/**
 * อนุพันธ์จากนิยาม และกฎผลคูณกับกฎผลหาร · Calculus I.
 *
 * Both generators work from a polynomial held as coefficients, so the function
 * shown and the derivative expected come out of the same three numbers and
 * cannot disagree. The stem is the function and the answer is its derivative -
 * two different things - so every question says `machineStem: null` and
 * `c1-derivative.test.ts` takes a central difference instead.
 */

/** `[c, b, a]` is `ax^2 + bx + c`, lowest power first. */
type Poly = number[];

function printPoly(poly: Poly): string {
  return sumTerms(
    poly
      .map((value, exponent) => {
        if (value === 0) return null;
        if (exponent === 0) return String(value);
        return coefficient(value, exponent === 1 ? "x" : `x^${exponent}`) || null;
      })
      .reverse(),
  );
}

function polyMath(poly: Poly): string {
  return sumTerms(
    poly
      .map((value, exponent) => {
        if (value === 0) return null;
        if (exponent === 0) return String(value);
        const body = exponent === 1 ? "x" : `x^${exponent}`;
        return value === 1 ? body : value === -1 ? `-${body}` : `${value}${body}`;
      })
      .reverse(),
  );
}

function differentiate(poly: Poly): Poly {
  const out = poly.slice(1).map((value, index) => value * (index + 1));
  return out.length ? out : [0];
}

export const c1FirstPrinciples: Generator = {
  id: "c1.first-principles",
  skillId: "c1.first-principles",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty === 4) return reciprocal(rng, difficulty);

    const degree = difficulty === 1 ? 1 : difficulty === 2 ? 2 : 3;
    const poly: Poly = [];
    for (let exponent = 0; exponent < degree; exponent += 1) {
      poly.push(rng.int(-7, 7));
    }
    poly.push(rng.pick([1, 2, 3, -1, -2, 4]));

    const derivative = differentiate(poly);
    const shown = printPoly(poly);

    /*
     * The expansion, written out. The whole point of a first-principles
     * question is that every term without an `h` in it cancels - so the
     * working shows that happening rather than asserting the answer.
     */
    const expanded = poly
      .map((value, exponent) => {
        if (exponent === 0 || value === 0) return null;
        if (exponent === 1) return `${value}h`;
        if (exponent === 2) return `${2 * value}xh + ${value}h^2`;
        return `${3 * value}x^2h + ${3 * value}xh^2 + ${value}h^3`;
      })
      .filter((term): term is string => term !== null)
      .join(" + ");

    const steps: Step[] = [
      makeStep(
        `\\frac{f(x + h) - f(x)}{h}`,
        "c1.first-principles",
        {
          th: "เริ่มจากนิยาม ความชันระหว่างสองจุดที่ห่างกัน h",
          en: "Start from the definition: the slope between two points h apart.",
        },
        { math: null },
      ),
      makeStep(
        `\\frac{${expanded}}{h}`,
        "c1.first-principles",
        {
          th: "กระจายแล้วลบกัน พจน์ที่ไม่มี h ตัดกันหมด",
          en: "Expand and subtract: every term without an h in it cancels.",
        },
        { math: null },
      ),
      makeStep(
        `f'(x) = ${printPoly(derivative)}`,
        "calc.limit-factor-cancel",
        {
          th: "หารด้วย h ได้ แล้วให้ h เข้าใกล้ศูนย์ พจน์ที่ยังมี h อยู่ก็หายไป",
          en: "Divide by h, then let h go to zero and whatever still holds an h disappears.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: polyMath(derivative) };

    return {
      ...shell(c1FirstPrinciples, rng, difficulty),
      prompt: {
        th: "จงหาอนุพันธ์ของฟังก์ชันนี้จากนิยาม",
        en: "Differentiate this function from the definition",
      },
      stem: shown,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "เขียน f(x + h) ออกมาก่อน แล้วลบด้วย f(x)",
          en: "Write out f(x + h) first, then subtract f(x).",
        },
        {
          th: "พจน์ที่ไม่มี h จะตัดกันหมด เหลือแต่พจน์ที่มี h เป็นตัวประกอบ",
          en: "Everything without an h cancels, and what is left has h as a factor.",
        },
        {
          th: "หารด้วย h แล้วจึงให้ h เข้าใกล้ศูนย์ ห้ามให้ h เป็นศูนย์ก่อนหาร",
          en: "Divide by h and only then let h go to zero - never the other way round.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: { kind: "exact", value: polyMath(poly) },
          explain: {
            th: "นั่นคือฟังก์ชันเดิม ยังไม่ได้หาอนุพันธ์",
            en: "That is the function itself, not its derivative.",
          },
        },
        {
          answer: { kind: "exact", value: "0" },
          explain: {
            th: "ให้ h เป็นศูนย์ก่อนหาร จะได้ศูนย์ส่วนศูนย์ ต้องหารด้วย h ก่อนเสมอ",
            en: "Setting h to zero before dividing gives zero over zero. The dividing comes first.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/** Difficulty 4: a function that is not a polynomial at all. */
function reciprocal(rng: RNG, difficulty: number): Question {
  const scale = rng.int(2, 9);
  const move = rng.int(-4, 5);
  // `x`, `x + 3`, `x - 2`: the denominator, written the way it is read.
  const shift = move === 0 ? "x" : move > 0 ? `x + ${move}` : `x - ${-move}`;

  const steps: Step[] = [
    makeStep(
      `\\frac{1}{h}\\left(\\frac{${scale}}{${shift} + h} - \\frac{${scale}}{${shift}}\\right)`,
      "c1.first-principles",
      {
        th: "เขียนนิยามออกมา ได้ผลต่างของเศษส่วนสองตัว",
        en: "The definition, which here is a difference of two fractions.",
      },
      { math: null },
    ),
    makeStep(
      `\\frac{1}{h} \\cdot \\frac{-${scale}h}{(${shift})(${shift} + h)}`,
      "arith.simplify-fraction",
      {
        th: "ทำให้เป็นเศษส่วนเดียวก่อน ตัวเศษจะเหลือ -h คูณค่าคงตัว",
        en: "Put them over one denominator and the numerator collapses to a multiple of h.",
      },
      { math: null },
    ),
    makeStep(
      `f'(x) = -\\frac{${scale}}{(${shift})^2}`,
      "calc.limit-factor-cancel",
      {
        th: "ตัด h ทิ้งแล้วให้ h เข้าใกล้ศูนย์",
        en: "Cancel the h, then let it go to zero.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: `-${scale}/(${shift})^2` };

  return {
    ...shell(c1FirstPrinciples, rng, difficulty),
    prompt: {
      th: "จงหาอนุพันธ์ของฟังก์ชันนี้จากนิยาม",
      en: "Differentiate this function from the definition",
    },
    stem: `\\frac{${scale}}{${shift}}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "ผลต่างของเศษส่วนสองตัว ต้องทำให้เป็นเศษส่วนเดียวก่อน",
        en: "A difference of two fractions has to become one fraction first.",
      },
      {
        th: `ตัวส่วนร่วมคือ (${shift})(${shift} + h)`,
        en: `The common denominator is the two of them multiplied together.`,
      },
      {
        th: "ตัวเศษจะเหลือแค่ตัวที่มี h เป็นตัวประกอบ แล้วจึงตัดกับ h ข้างนอกได้",
        en: "The numerator keeps only what has an h in it, which then cancels the h outside.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: { kind: "exact", value: `${scale}/(${shift})^2` },
        explain: {
          th: "เครื่องหมายหายไป ฟังก์ชันนี้ลดลงเสมอ อนุพันธ์จึงต้องเป็นลบ",
          en: "The sign is missing: this function always falls, so its derivative is negative everywhere.",
        },
      },
      {
        answer: { kind: "exact", value: `-${scale}/(${shift})` },
        explain: {
          th: "เลขชี้กำลังของตัวส่วนต้องเป็นสอง ไม่ใช่หนึ่ง",
          en: "The denominator is squared, not left as it was.",
        },
      },
    ]),
    rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
  };
}

export const c1ProductQuotient: Generator = {
  id: "c1.product-quotient",
  skillId: "c1.product-quotient",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty >= 3) return quotient(rng, difficulty);

    const a = rng.pick([1, 2, 3, -1, -2]);
    const b = rng.int(-6, 6);
    const power = difficulty === 1 ? 1 : rng.int(2, 4);
    const scale = rng.pick([1, 2, 3]);

    /*
     * `scale * x^power * (ax + b)`, which expands to a two-term polynomial -
     * so the product rule and multiplying out first have to agree, and the
     * chapter test checks the answer against a central difference either way.
     */
    const expanded: Poly = [];
    for (let i = 0; i <= power + 1; i += 1) expanded.push(0);
    expanded[power + 1] = scale * a;
    expanded[power] = scale * b;
    const derivative = differentiate(expanded);

    const left = power === 1 ? "x" : `x^${power}`;
    const leftShown = scale === 1 ? left : `${scale}${left}`;
    const right = linearExpr(a, b, "x");

    const steps: Step[] = [
      makeStep(
        `${scale * power === 1 ? "" : scale * power}${power === 1 ? "" : power === 2 ? "x" : `x^${power - 1}`}(${right}) + ${leftShown}(${a})`,
        "c1.product-rule",
        {
          th: "ตัวหน้าดิฟคูณตัวหลัง บวก ตัวหน้าคูณตัวหลังดิฟ",
          en: "First differentiated times second, plus first times second differentiated.",
        },
        { math: null },
      ),
      makeStep(
        `f'(x) = ${printPoly(derivative)}`,
        "calc.derivative-sum",
        {
          th: "กระจายแล้วรวมพจน์คล้าย ตรวจได้ด้วยการกระจายวงเล็บก่อนดิฟ",
          en: "Expand and collect. Multiplying out before differentiating is a free check.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = { kind: "exact", value: polyMath(derivative) };

    return {
      ...shell(c1ProductQuotient, rng, difficulty),
      prompt: {
        th: "จงหาอนุพันธ์ของฟังก์ชันนี้",
        en: "Differentiate this function",
      },
      stem: `${leftShown}(${right})`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ใช้กฎผลคูณ หรือกระจายวงเล็บก่อนก็ได้ ผลต้องตรงกัน",
          en: "Product rule, or multiply out first. They must agree.",
        },
        {
          th: `ตัวหน้าคือ ${leftShown} ตัวหลังคือ ${right}`,
          en: `The first is ${leftShown} and the second is ${right}.`,
        },
        {
          th: "อนุพันธ์ของผลคูณไม่ใช่ผลคูณของอนุพันธ์",
          en: "The derivative of a product is not the product of the derivatives.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: polyMath(
              (() => {
                const wrong: Poly = [];
                for (let i = 0; i <= power; i += 1) wrong.push(0);
                wrong[power - 1] = scale * power * a;
                return wrong;
              })(),
            ),
          },
          explain: {
            th: "คูณอนุพันธ์ของสองตัวเข้าด้วยกัน กฎผลคูณไม่ได้ทำแบบนั้น",
            en: "That multiplies the two derivatives together, which is not what the rule says.",
          },
        },
        {
          answer: { kind: "exact", value: polyMath(expanded) },
          explain: {
            th: "นั่นคือฟังก์ชันที่กระจายวงเล็บแล้ว ยังไม่ได้หาอนุพันธ์",
            en: "That is the function with its brackets opened, not its derivative.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

/** Difficulties 3 and 4: the quotient rule, where the order of the minus matters. */
function quotient(rng: RNG, difficulty: number): Question {
  const a = rng.pick([1, 2, 3, -1, -2]);
  const b = rng.int(-6, 6);
  const c = rng.pick([1, 2, 3, -1]);
  const d = rng.int(-6, 6);

  const quadratic = difficulty === 4;

  if (!quadratic) {
    /*
     * (ax + b)/(cx + d). The numerator of the derivative collapses to the
     * constant ad - bc, which is the tidiest possible illustration that the
     * order of the subtraction is not optional.
     */
    const determinant = a * d - b * c;
    const numerator = linearExpr(a, b, "x");
    const denominator = linearExpr(c, d, "x");
    const denominatorMath = `(${c}x ${d < 0 ? "-" : "+"} ${Math.abs(d)})`;

    const steps: Step[] = [
      makeStep(
        `\\frac{(${a})(${denominator}) - (${numerator})(${c})}{(${denominator})^2}`,
        "c1.quotient-rule",
        {
          th: "บนดิฟคูณล่าง ลบ บนคูณล่างดิฟ ทั้งหมดส่วนล่างกำลังสอง",
          en: "Top differentiated times bottom, minus top times bottom differentiated, over bottom squared.",
        },
        { math: null },
      ),
      makeStep(
        `\\frac{${determinant}}{(${denominator})^2}`,
        "arith.combine-like-terms",
        {
          th: "พจน์ที่มี x ตัดกันหมด เหลือแต่ค่าคงตัว",
          en: "Every term with an x in it cancels, leaving a constant.",
        },
        { math: null },
      ),
    ];

    const answer: Answer = {
      kind: "exact",
      value: `${determinant}/${denominatorMath}^2`,
    };

    return {
      ...shell(c1ProductQuotient, rng, difficulty),
      prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
      stem: `\\frac{${numerator}}{${denominator}}`,
      machineStem: null,
      answer,
      steps,
      hints: [
        {
          th: "ใช้กฎผลหาร ระวังลำดับของการลบในตัวเศษ",
          en: "Quotient rule, and mind the order of the subtraction on top.",
        },
        {
          th: "ตัวส่วนยกกำลังสอง ไม่ต้องกระจาย",
          en: "The denominator is squared, and there is no need to expand it.",
        },
        {
          th: "พจน์ที่มี x ในตัวเศษจะตัดกันหมด",
          en: "The x terms on top all cancel each other.",
        },
      ],
      ...mistakes(answer, [
        {
          answer: {
            kind: "exact",
            value: `${-determinant}/${denominatorMath}^2`,
          },
          explain: {
            th: "ลบสลับที่ กฎผลหารคือบนดิฟคูณล่างก่อน แล้วจึงลบ",
            en: "The subtraction is backwards: top-differentiated comes first.",
          },
        },
        {
          // mathjs source, not KaTeX: this is compared, not displayed.
          answer: { kind: "exact", value: `${a}/${c}` },
          explain: {
            th: "หารอนุพันธ์ของบนด้วยอนุพันธ์ของล่าง กฎผลหารไม่ได้ทำแบบนั้น",
            en: "That divides one derivative by the other, which is not the rule.",
          },
        },
      ]),
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  }

  // Difficulty 4: x^2 over a linear, where the numerator does not collapse.
  const denominator = linearExpr(c, d, "x");
  const denominatorMath = `(${c}x ${d < 0 ? "-" : "+"} ${Math.abs(d)})`;
  const scale = rng.pick([1, 2, 3]);

  /*
   * d/dx of `scale x^2 / (cx + d)` is `scale x (cx + 2d) / (cx + d)^2`, which
   * is worth writing out: the numerator keeps an x, so there is nothing to
   * cancel and the shape of the answer is the whole point.
   */
  const answerMath = `${scale}x*(${c}x ${2 * d < 0 ? "-" : "+"} ${Math.abs(2 * d)})/${denominatorMath}^2`;

  const steps: Step[] = [
    makeStep(
      `\\frac{${2 * scale}x(${denominator}) - ${scale}x^2(${c})}{(${denominator})^2}`,
      "c1.quotient-rule",
      {
        th: "ใส่ลงในกฎผลหารตามลำดับ",
        en: "Into the quotient rule, in order.",
      },
      { math: null },
    ),
    makeStep(
      `\\frac{${scale}x(${c}x ${2 * d < 0 ? "-" : "+"} ${Math.abs(2 * d)})}{(${denominator})^2}`,
      "quad.common-factor",
      {
        th: "ดึงตัวประกอบร่วมในตัวเศษออกมา",
        en: "Take the common factor out of the numerator.",
      },
      { math: null },
    ),
  ];

  const answer: Answer = { kind: "exact", value: answerMath };

  return {
    ...shell(c1ProductQuotient, rng, difficulty),
    prompt: { th: "จงหาอนุพันธ์ของฟังก์ชันนี้", en: "Differentiate this function" },
    stem: `\\frac{${scale === 1 ? "" : scale}x^2}{${denominator}}`,
    machineStem: null,
    answer,
    steps,
    hints: [
      {
        th: "ใช้กฎผลหาร ตัวเศษดิฟได้ 2x คูณตัวประกอบข้างหน้า",
        en: "Quotient rule; the top differentiates to twice x times whatever is in front.",
      },
      {
        th: "อย่าลืมยกกำลังสองที่ตัวส่วน",
        en: "The denominator gets squared.",
      },
      {
        th: "ตัวเศษดึงตัวประกอบร่วม x ออกมาได้",
        en: "The numerator has an x that can be taken outside.",
      },
    ],
    ...mistakes(answer, [
      {
        answer: {
          kind: "exact",
          value: `${scale}x*(${c}x ${2 * d < 0 ? "+" : "-"} ${Math.abs(2 * d)})/${denominatorMath}^2`,
        },
        explain: {
          th: "เครื่องหมายในตัวเศษผิด มาจากการลบสลับที่ในกฎผลหาร",
          en: "A sign in the numerator has come out backwards from the subtraction.",
        },
      },
      {
        answer: { kind: "exact", value: `${2 * scale}x/${c}` },
        explain: {
          th: "หารอนุพันธ์บนด้วยอนุพันธ์ล่าง ซึ่งไม่ใช่กฎผลหาร",
          en: "One derivative divided by the other, which is not the rule.",
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

export { differentiate, printPoly, polyMath, type Poly };
