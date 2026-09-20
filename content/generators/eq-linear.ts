import { coefficient, gcd, lcm, linearExpr, paren } from "../format";
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

const TOPIC = "eq.linear-one-var";

const PROMPT = {
  th: "จงแก้สมการ",
  en: "Solve the equation",
};

/**
 * สมการเชิงเส้นตัวแปรเดียว.
 *
 * Built backwards from the root: `r` is chosen first and the equation is
 * assembled around it, so every question has an integer answer and the
 * derivation is construction rather than search.
 *
 * ## Why the last step starts a new chain
 *
 * A step's machine form is the equation's zero form, and the property gate
 * checks that adjacent steps in a chain have the *same* one. That holds for
 * every move that adds or subtracts the same thing from both sides - which is
 * most of solving a linear equation - but not for dividing by the coefficient:
 * `3x = 15` and `x = 5` have zero forms `3x - 15` and `x - 5`, which are the
 * same *equation* and different *functions*.
 *
 * So the division starts a chain of its own. The correctness of that step is
 * still checked, by §9.5 substituting the stated root back into the original
 * stem, and by this chapter's own test asserting every intermediate line has
 * the same solution as the question.
 */
const SOLVED = { chain: "solved" } as const;

type Built = {
  stem: string;
  root: number;
  steps: Step[];
  misconceptions: Misconception[];
  hints: { th: string; en: string }[];
};

/** `x = r`, the line that ends every one of these. */
function solutionStep(root: number): Step {
  return makeStep(
    `x = ${root}`,
    "eq.balance",
    {
      th: `หารทั้งสองข้างด้วยสัมประสิทธิ์ของ x จะได้ x = ${root}`,
      en: `Divide both sides by the coefficient of x, giving x = ${root}.`,
    },
    SOLVED,
  );
}

function solve(rng: RNG, difficulty: Difficulty): Built {
  const root = rng.nonZeroInt(-10, 10);

  if (difficulty === 1) {
    /*
     * One move. Half the time it is an addition to undo, half the time a
     * multiplication - a learner who only ever meets one of the two comes away
     * thinking "solving" means "subtract".
     */
    if (rng.bool()) {
      const c = rng.nonZeroInt(-12, 12);
      return {
        stem: `${linearExpr(1, c)} = ${root + c}`,
        root,
        // `x + c = k` and `x = k - c` have the same zero form, so this one
        // stays in the main chain and the gate checks it.
        steps: [
          makeStep(`x = ${root}`, "eq.move-term", {
            th: `ย้าย ${c} ไปอีกข้าง เครื่องหมายเปลี่ยนเป็น ${-c}`,
            en: `Move the ${c} across; it changes sign to ${-c}.`,
          }),
        ],
        misconceptions: namedMistakes({ kind: "exact", value: String(root) }, [
          {
            answer: { kind: "exact", value: String(root + 2 * c) },
            explain: {
              th: `ย้ายข้างแล้วต้องเปลี่ยนเครื่องหมาย ${c} ที่ข้ามไปกลายเป็น ${-c} ไม่ใช่ ${c}`,
              en: `A term that crosses the equals sign changes sign: the ${c} becomes ${-c}, not ${c}.`,
            },
          },
        ]),
        hints: [
          {
            th: "ทำอย่างไรให้เหลือ x อยู่ข้างเดียวโดด ๆ",
            en: "What would leave x on its own?",
          },
          {
            th: `ลบ ${c} ออกจากทั้งสองข้าง`,
            en: `Subtract ${c} from both sides.`,
          },
          { th: `จะได้ x = ${root}`, en: `That gives x = ${root}.` },
        ],
      };
    }

    const a = rng.int(2, 9);
    return {
      stem: `${coefficient(a, "x")} = ${a * root}`,
      root,
      steps: [solutionStep(root)],
      misconceptions: namedMistakes({ kind: "exact", value: String(root) }, [
        {
          answer: { kind: "exact", value: String(a * root - a) },
          explain: {
            th: `${coefficient(a, "x")} หมายถึง ${a} คูณ x จึงต้องหารด้วย ${a} ไม่ใช่ลบ ${a}`,
            en: `${coefficient(a, "x")} means ${a} times x, so it is undone by dividing by ${a}, not by subtracting ${a}.`,
          },
        },
      ]),
      hints: [
        {
          th: `${coefficient(a, "x")} คือ ${a} คูณกับ x`,
          en: `${coefficient(a, "x")} means ${a} times x.`,
        },
        { th: `หารทั้งสองข้างด้วย ${a}`, en: `Divide both sides by ${a}.` },
        { th: `จะได้ x = ${root}`, en: `That gives x = ${root}.` },
      ],
    };
  }

  if (difficulty === 2) {
    const a = rng.int(2, 9);
    const c = rng.nonZeroInt(-12, 12);
    const k = a * root + c;

    return {
      stem: `${linearExpr(a, c)} = ${k}`,
      root,
      steps: [
        makeStep(`${coefficient(a, "x")} = ${k - c}`, "eq.move-term", {
          th: `ย้าย ${c} ไปอีกข้างก่อน ได้ ${k} ${c < 0 ? "+" : "-"} ${Math.abs(c)} = ${k - c}`,
          en: `Move the ${c} across first: ${k} ${c < 0 ? "+" : "-"} ${Math.abs(c)} = ${k - c}.`,
        }),
        solutionStep(root),
      ],
      misconceptions: namedMistakes({ kind: "exact", value: String(root) }, [
        {
          answer: { kind: "exact", value: `(${k} + ${c})/${a}` },
          explain: {
            th: `ย้าย ${c} ข้ามไปต้องกลายเป็น ${-c} จึงเหลือ ${k - c} ไม่ใช่ ${k + c}`,
            en: `The ${c} becomes ${-c} when it crosses, so the right-hand side is ${k - c}, not ${k + c}.`,
          },
        },
        {
          answer: { kind: "exact", value: String(k - c - a) },
          explain: {
            th: `เหลือ ${coefficient(a, "x")} = ${k - c} แล้วต้องหารด้วย ${a} ไม่ใช่ลบ ${a}`,
            en: `From ${coefficient(a, "x")} = ${k - c} you divide by ${a}; subtracting it is a different operation.`,
          },
        },
      ]),
      hints: [
        {
          th: "จัดการพจน์ที่เป็นตัวเลขก่อน แล้วค่อยจัดการสัมประสิทธิ์",
          en: "Deal with the number first, then with the coefficient.",
        },
        {
          th: `ย้าย ${c} ไปอีกข้าง จะเหลือ ${coefficient(a, "x")} = ${k - c}`,
          en: `Moving the ${c} leaves ${coefficient(a, "x")} = ${k - c}.`,
        },
        { th: `แล้วหารด้วย ${a}`, en: `Then divide by ${a}.` },
      ],
    };
  }

  if (difficulty === 3) {
    // `ax + c = bx + d`, the first shape where the variable is on both sides.
    const a = rng.int(2, 9);
    let b = rng.int(1, 8);
    if (b === a) b = a === 8 ? 1 : b + 1;
    const c = rng.nonZeroInt(-9, 9);
    const d = (a - b) * root + c;
    const gap = a - b;

    const steps: Step[] = [
      makeStep(`${linearExpr(gap, c)} = ${d}`, "eq.collect-variable", {
        th: `ย้าย ${coefficient(b, "x")} มาทางซ้าย เหลือ ${coefficient(gap, "x")}`,
        en: `Move ${coefficient(b, "x")} to the left, leaving ${coefficient(gap, "x")}.`,
      }),
      makeStep(`${coefficient(gap, "x")} = ${d - c}`, "eq.move-term", {
        th: `ย้าย ${c} ไปทางขวา ได้ ${d - c}`,
        en: `Move the ${c} to the right: ${d - c}.`,
      }),
    ];
    // With a coefficient of 1 the line above already *is* the answer.
    if (gap !== 1) steps.push(solutionStep(root));

    return {
      stem: `${linearExpr(a, c)} = ${linearExpr(b, d)}`,
      root,
      steps,
      misconceptions: namedMistakes({ kind: "exact", value: String(root) }, [
        {
          answer: { kind: "exact", value: `(${d} + ${c})/${gap}` },
          explain: {
            th: `ย้าย ${c} ข้ามไปต้องกลายเป็น ${-c} ทางขวาจึงเป็น ${d - c}`,
            en: `The ${c} flips to ${-c} as it crosses, so the right-hand side is ${d - c}.`,
          },
        },
        {
          answer: { kind: "exact", value: `(${d} - ${c})/${a + b}` },
          explain: {
            th: `ย้าย ${coefficient(b, "x")} ข้ามไปต้องลบ ไม่ใช่บวก สัมประสิทธิ์ที่เหลือคือ ${a} - ${b} = ${gap}`,
            en: `Moving ${coefficient(b, "x")} across subtracts it: the coefficient left is ${a} - ${b} = ${gap}.`,
          },
        },
      ]),
      hints: [
        {
          th: "มีตัวแปรทั้งสองข้าง รวมตัวแปรไว้ข้างเดียวก่อน",
          en: "The variable is on both sides: gather it on one side first.",
        },
        {
          th: `ย้าย ${coefficient(b, "x")} มาทางซ้าย เหลือ ${coefficient(gap, "x")}`,
          en: `Moving ${coefficient(b, "x")} left leaves ${coefficient(gap, "x")}.`,
        },
        {
          th: `แล้วย้ายตัวเลข จะได้ ${coefficient(gap, "x")} = ${d - c}`,
          en: `Then move the numbers: ${coefficient(gap, "x")} = ${d - c}.`,
        },
      ],
    };
  }

  /*
   * Brackets on both sides. `a` and `b` are coprime so neither side can be
   * divided through first - the learner has to expand - and `c` is nudged
   * until `d` comes out a whole number, which it always does within `b` steps
   * because `a` is invertible modulo `b`.
   */
  const pairs: [number, number][] = [];
  for (let a = 2; a <= 7; a++) {
    for (let b = 2; b <= 7; b++) {
      if (a !== b && gcd(a, b) === 1) pairs.push([a, b]);
    }
  }
  const [a, b] = rng.pick(pairs);
  let c = rng.nonZeroInt(-8, 8);
  for (let tries = 0; tries < b * 2; tries++) {
    const numerator = (a - b) * root + a * c;
    if (numerator % b === 0 && numerator / b !== 0 && c !== 0) break;
    c = c === 8 ? -8 : c + 1;
    if (c === 0) c = 1;
  }
  const d = ((a - b) * root + a * c) / b;
  const gap = a - b;

  const steps: Step[] = [
    makeStep(
      `${linearExpr(a, a * c)} = ${linearExpr(b, b * d)}`,
      "arith.distribute",
      {
        th: "คูณกระจายเข้าไปในวงเล็บทั้งสองข้างก่อน",
        en: "Multiply into the brackets on both sides first.",
      },
    ),
    makeStep(`${coefficient(gap, "x")} = ${b * d - a * c}`, "eq.collect-variable", {
      th: "รวมตัวแปรไว้ข้างหนึ่ง และรวมตัวเลขไว้อีกข้างหนึ่ง",
      en: "Gather the variable on one side and the numbers on the other.",
    }),
  ];
  if (gap !== 1) steps.push(solutionStep(root));

  return {
    stem: `${a}${paren(linearExpr(1, c))} = ${b}${paren(linearExpr(1, d))}`,
    root,
    steps,
    misconceptions: namedMistakes({ kind: "exact", value: String(root) }, [
      {
        answer: { kind: "exact", value: `(${b * d} - ${c})/${gap}` },
        explain: {
          th: `${a}${paren(linearExpr(1, c))} คือ ${coefficient(a, "x")} + ${a * c} ตัวเลขในวงเล็บก็ต้องคูณ ${a} ด้วย`,
          en: `${a}${paren(linearExpr(1, c))} is ${coefficient(a, "x")} + ${a * c}: the number inside the bracket gets multiplied too.`,
        },
      },
    ]),
    hints: [
      {
        th: "มีวงเล็บทั้งสองข้าง คูณกระจายออกมาก่อน",
        en: "Brackets on both sides: expand them first.",
      },
      {
        th: `ทางซ้ายได้ ${linearExpr(a, a * c)} ทางขวาได้ ${linearExpr(b, b * d)}`,
        en: `The left becomes ${linearExpr(a, a * c)}, the right ${linearExpr(b, b * d)}.`,
      },
      {
        th: "แล้วรวมตัวแปรไว้ข้างเดียวตามปกติ",
        en: "Then gather the variable on one side as usual.",
      },
    ],
  };
}

/**
 * สมการที่มีเศษส่วน.
 *
 * Every shape here is built so that clearing the denominators is the first
 * move and everything after it is difficulty 1-3 again. The root is chosen as
 * a multiple of whatever denominator it has to survive, so the answer is a
 * whole number and the question is about the method rather than the arithmetic.
 */
function fractions(rng: RNG, difficulty: Difficulty): Built {
  if (difficulty === 1) {
    // `x/n + c = k`.
    const n = rng.int(2, 9);
    const t = rng.nonZeroInt(-9, 9);
    const root = n * t;
    const c = rng.nonZeroInt(-9, 9);

    return {
      stem: `\\frac{x}{${n}} ${c < 0 ? "-" : "+"} ${Math.abs(c)} = ${t + c}`,
      root,
      steps: [
        makeStep(`\\frac{x}{${n}} = ${t}`, "eq.move-term", {
          th: `ย้าย ${c} ไปอีกข้างก่อน`,
          en: `Move the ${c} across first.`,
        }),
        makeStep(
          `x = ${root}`,
          "eq.clear-fractions",
          {
            th: `คูณทั้งสองข้างด้วย ${n} ได้ x = ${root}`,
            en: `Multiply both sides by ${n}: x = ${root}.`,
          },
          SOLVED,
        ),
      ],
      misconceptions: namedMistakes({ kind: "exact", value: String(root) }, [
        {
          answer: { kind: "exact", value: String(t) },
          explain: {
            th: `${t} คือค่าของ \\frac{x}{${n}} ไม่ใช่ค่าของ x ต้องคูณ ${n} กลับเข้าไปอีกที`,
            en: `${t} is the value of \\frac{x}{${n}}, not of x. Multiply by ${n} to finish.`,
          },
        },
      ]),
      hints: [
        {
          th: "จัดการตัวเลขที่บวกลบอยู่ก่อน แล้วค่อยจัดการตัวส่วน",
          en: "Deal with the number being added first, then with the denominator.",
        },
        {
          th: `จะเหลือ \\frac{x}{${n}} = ${t}`,
          en: `That leaves \\frac{x}{${n}} = ${t}.`,
        },
        { th: `คูณทั้งสองข้างด้วย ${n}`, en: `Multiply both sides by ${n}.` },
      ],
    };
  }

  if (difficulty === 2) {
    // `(x + c)/n = k`, where the whole numerator is over the denominator.
    const n = rng.int(2, 9);
    const t = rng.nonZeroInt(-9, 9);
    const c = rng.nonZeroInt(-12, 12);
    const root = n * t - c;

    return {
      stem: `\\frac{${linearExpr(1, c)}}{${n}} = ${t}`,
      root,
      steps: [
        makeStep(
          `${linearExpr(1, c)} = ${n * t}`,
          "eq.clear-fractions",
          {
            th: `คูณทั้งสองข้างด้วย ${n} ตัวส่วนหายไปทั้งก้อน`,
            en: `Multiply both sides by ${n}; the whole numerator comes out.`,
          },
          { chain: "cleared" },
        ),
        makeStep(
          `x = ${root}`,
          "eq.move-term",
          {
            th: `ย้าย ${c} ไปอีกข้าง ได้ x = ${root}`,
            en: `Move the ${c} across: x = ${root}.`,
          },
          { chain: "cleared" },
        ),
      ],
      misconceptions: namedMistakes({ kind: "exact", value: String(root) }, [
        {
          answer: { kind: "exact", value: String(n * (t - c)) },
          explain: {
            th: `เศษทั้งก้อน ${paren(linearExpr(1, c))} อยู่บนตัวส่วน จึงต้องคูณ ${n} ก่อน แล้วค่อยย้าย ${c}`,
            en: `The whole of ${paren(linearExpr(1, c))} is over the denominator, so multiply by ${n} first and move the ${c} afterwards.`,
          },
        },
      ]),
      hints: [
        {
          th: `เศษทั้งก้อน ${paren(linearExpr(1, c))} อยู่บนตัวส่วน`,
          en: `The whole of ${paren(linearExpr(1, c))} sits over the denominator.`,
        },
        {
          th: `คูณทั้งสองข้างด้วย ${n} จะได้ ${linearExpr(1, c)} = ${n * t}`,
          en: `Multiply both sides by ${n}: ${linearExpr(1, c)} = ${n * t}.`,
        },
        { th: `แล้วย้าย ${c} ไปอีกข้าง`, en: `Then move the ${c} across.` },
      ],
    };
  }

  if (difficulty === 3) {
    // `x/m + x/n = k`: two denominators, so the lowest common multiple matters.
    let m = rng.int(2, 6);
    let n = rng.int(2, 8);
    if (m === n) n = n === 8 ? 2 : n + 1;
    if (m > n) [m, n] = [n, m];
    const common = lcm(m, n);
    const t = rng.nonZeroInt(-6, 6);
    const root = common * t;
    const k = t * (common / m) + t * (common / n);

    return {
      stem: `\\frac{x}{${m}} + \\frac{x}{${n}} = ${k}`,
      root,
      steps: [
        makeStep(
          `${coefficient(common / m, "x")} + ${coefficient(common / n, "x")} = ${common * k}`,
          "eq.clear-fractions",
          {
            th: `ค.ร.น. ของ ${m} กับ ${n} คือ ${common} คูณทุกพจน์ด้วย ${common}`,
            en: `The lowest common multiple of ${m} and ${n} is ${common}; multiply every term by it.`,
          },
          { chain: "cleared" },
        ),
        makeStep(
          `${coefficient(common / m + common / n, "x")} = ${common * k}`,
          "arith.combine-like-terms",
          {
            th: "รวมพจน์ที่มี x เข้าด้วยกัน",
            en: "Combine the x terms.",
          },
          { chain: "cleared" },
        ),
        solutionStep(root),
      ],
      misconceptions: namedMistakes({ kind: "exact", value: String(root) }, [
        {
          answer: { kind: "exact", value: `${k}*${m + n}/2` },
          explain: {
            th: `\\frac{x}{${m}} + \\frac{x}{${n}} ไม่ใช่ \\frac{2x}{${m + n}} ตัวส่วนบวกกันไม่ได้ ต้องใช้ ค.ร.น. ซึ่งคือ ${common}`,
            en: `\\frac{x}{${m}} + \\frac{x}{${n}} is not \\frac{2x}{${m + n}}: denominators do not add. Use the lowest common multiple, ${common}.`,
          },
        },
      ]),
      hints: [
        {
          th: `ตัวส่วนคนละตัว หาตัวส่วนร่วมก่อน`,
          en: `Two different denominators: find a common one first.`,
        },
        {
          th: `ค.ร.น. ของ ${m} กับ ${n} คือ ${common}`,
          en: `The lowest common multiple of ${m} and ${n} is ${common}.`,
        },
        {
          th: `คูณทุกพจน์ด้วย ${common} จะได้ ${coefficient(common / m + common / n, "x")} = ${common * k}`,
          en: `Multiplying every term by ${common} gives ${coefficient(common / m + common / n, "x")} = ${common * k}.`,
        },
      ],
    };
  }

  /*
   * `(x + c)/m = (x + d)/n`: a fraction on each side, which is where cross
   * multiplying is worth its name. Coprime denominators, and `c` nudged until
   * `d` is whole.
   */
  const pairs: [number, number][] = [];
  for (let m = 2; m <= 7; m++) {
    for (let n = 2; n <= 7; n++) {
      if (m !== n && gcd(m, n) === 1) pairs.push([m, n]);
    }
  }
  const [m, n] = rng.pick(pairs);
  const root = rng.nonZeroInt(-9, 9);
  let c = rng.nonZeroInt(-9, 9);
  for (let tries = 0; tries < m * 2; tries++) {
    const numerator = (n - m) * root + n * c;
    if (numerator % m === 0 && numerator / m !== 0 && c !== 0) break;
    c = c === 9 ? -9 : c + 1;
    if (c === 0) c = 1;
  }
  const d = ((n - m) * root + n * c) / m;

  return {
    stem: `\\frac{${linearExpr(1, c)}}{${m}} = \\frac{${linearExpr(1, d)}}{${n}}`,
    root,
    steps: [
      makeStep(
        `${n}${paren(linearExpr(1, c))} = ${m}${paren(linearExpr(1, d))}`,
        "eq.clear-fractions",
        {
          th: `คูณไขว้: คูณทั้งสองข้างด้วย ${m * n} เศษส่วนหายไปทั้งคู่`,
          en: `Cross-multiply: multiplying both sides by ${m * n} clears both fractions.`,
        },
        { chain: "cleared" },
      ),
      makeStep(
        `${linearExpr(n, n * c)} = ${linearExpr(m, m * d)}`,
        "arith.distribute",
        {
          th: "คูณกระจายเข้าไปในวงเล็บทั้งสองข้าง",
          en: "Multiply into both brackets.",
        },
        { chain: "cleared" },
      ),
      makeStep(
        `${coefficient(n - m, "x")} = ${m * d - n * c}`,
        "eq.collect-variable",
        {
          th: "รวมตัวแปรไว้ข้างหนึ่ง และตัวเลขไว้อีกข้างหนึ่ง",
          en: "Gather the variable on one side and the numbers on the other.",
        },
        { chain: "cleared" },
      ),
      // With a coefficient of 1 the line above already *is* `x = r`.
      ...(n - m === 1 ? [] : [solutionStep(root)]),
    ],
    misconceptions: namedMistakes({ kind: "exact", value: String(root) }, [
      {
        answer: { kind: "exact", value: `(${m * d} - ${c})/${n - m}` },
        explain: {
          th: `คูณไขว้แล้วต้องคูณกระจายด้วย ${n}${paren(linearExpr(1, c))} คือ ${linearExpr(n, n * c)} ไม่ใช่ ${linearExpr(n, c)}`,
          en: `After cross-multiplying, expand: ${n}${paren(linearExpr(1, c))} is ${linearExpr(n, n * c)}, not ${linearExpr(n, c)}.`,
        },
      },
    ]),
    hints: [
      {
        th: "เศษส่วนข้างละตัวพอดี คูณไขว้ได้เลย",
        en: "Exactly one fraction on each side: cross-multiply.",
      },
      {
        th: `จะได้ ${n}${paren(linearExpr(1, c))} = ${m}${paren(linearExpr(1, d))}`,
        en: `That gives ${n}${paren(linearExpr(1, c))} = ${m}${paren(linearExpr(1, d))}.`,
      },
      {
        th: "แล้วคูณกระจายและรวมตัวแปรตามปกติ",
        en: "Then expand and gather the variable as usual.",
      },
    ],
  };
}

function toQuestion(
  generator: { id: string; skillId: string },
  rng: RNG,
  difficulty: Difficulty,
  built: Built,
): Question {
  return {
    id: `${generator.id}:${rng.seed}:${difficulty}`,
    generatorId: generator.id,
    skillId: generator.skillId,
    topicId: TOPIC,
    difficulty,
    provenance: "generated",
    prompt: PROMPT,
    stem: built.stem,
    answer: { kind: "exact", value: String(built.root) },
    steps: built.steps,
    hints: built.hints,
    ...(built.misconceptions.length
      ? { misconceptions: built.misconceptions }
      : {}),
    rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
  };
}

export const eqLinearSolve: Generator = {
  id: "eq.linear.solve",
  skillId: "eq.linear.solve",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",
  generate: (rng, difficulty) =>
    toQuestion(eqLinearSolve, rng, difficulty, solve(rng, difficulty)),
};

export const eqLinearFractions: Generator = {
  id: "eq.linear.fractions",
  skillId: "eq.linear.fractions",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",
  generate: (rng, difficulty) =>
    toQuestion(eqLinearFractions, rng, difficulty, fractions(rng, difficulty)),
};
