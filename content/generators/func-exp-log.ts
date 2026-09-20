import { linearExpr, paren } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type {
  Generator,
  L,
  Question,
  RNG,
  Step,
} from "../types";

const TOPIC = "func.exp-log";

/**
 * ฟังก์ชันเอกซ์โพเนนเชียลและลอการิทึม.
 *
 * ## Nothing here is machine-readable, and that is a property of the notation
 *
 * `lib/math/katex.ts` refuses subscripts rather than guessing at them, so
 * `\log_{2} 8` cannot be converted and every question in this chapter carries
 * `machineStem: null`. Steps get `math: undefined` automatically for the same
 * reason - `deriveMath` catches the refusal and returns null - so the §9 chain
 * check is off for every line that contains a logarithm.
 *
 * Which is fine, because the chain check is the wrong question anyway: what
 * has to hold is that the answer satisfies the *definition*, `b^answer = x`,
 * and this chapter's test checks exactly that. Everything is built backwards
 * from the exponent, so the definition holds by construction and the test
 * proves it held.
 */
const LOG_BASES = [2, 3, 5, 10] as const;

/** `\log_{2} 8`, with the brace the two-digit base needs. */
function logOf(base: number | string, value: string | number): string {
  return `\\log_{${base}} ${value}`;
}

/** `1/9` as KaTeX, for the negative-exponent questions. */
function reciprocal(value: number): string {
  return `\\frac{1}{${value}}`;
}

// ---------------------------------------------------------------------------
// นิยามของลอการิทึม
// ---------------------------------------------------------------------------

export const logDefinition: Generator = {
  id: "log.definition",
  skillId: "log.definition",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const base = rng.pick(LOG_BASES);

    if (difficulty === 1) {
      // `\log_b b^n` for a small positive n: the definition, read forwards.
      const exponent = rng.int(1, base === 10 ? 4 : base === 2 ? 8 : 4);
      const value = base ** exponent;
      const steps: Step[] = [
        makeStep(`${base}^{${exponent}} = ${value}`, "log.definition", {
          th: `ถามว่า ${base} ยกกำลังเท่าไรได้ ${value} คำตอบคือ ${exponent}`,
          en: `The question is: ${base} to what power gives ${value}? The answer is ${exponent}.`,
        }),
      ];

      return question(logDefinition, rng, difficulty, {
        prompt: {
          th: "จงหาค่าของลอการิทึมนี้",
          en: "Find the value of this logarithm",
        },
        stem: logOf(base, value),
        answer: String(exponent),
        steps,
        misconceptions: [
          {
            answer: { kind: "exact", value: String(value / base) },
            explain: {
              th: `ลอการิทึมไม่ใช่การหาร คำตอบคือเลขชี้กำลัง คือจำนวนครั้งที่ต้องคูณ ${base} เข้าด้วยกัน`,
              en: `A logarithm is not a division: the answer is the exponent - how many times ${base} is multiplied by itself.`,
            },
          },
        ],
        hints: [
          {
            th: `อ่านว่า ${base} ยกกำลังเท่าไรจึงได้ ${value}`,
            en: `Read it as: ${base} to what power gives ${value}?`,
          },
          {
            th: `ลองคูณ ${base} ไปเรื่อย ๆ แล้วนับดู`,
            en: `Multiply ${base} by itself and count.`,
          },
          { th: `ได้ ${exponent} ครั้ง`, en: `It takes ${exponent}.` },
        ],
      });
    }

    if (difficulty === 2) {
      // A negative exponent, so the number asked about is less than one.
      const exponent = rng.int(1, base === 2 ? 6 : 3);
      const value = base ** exponent;
      const steps: Step[] = [
        makeStep(
          `${base}^{-${exponent}} = ${reciprocal(value)}`,
          "exp.negative",
          {
            th: `${reciprocal(value)} คือ ${base} ยกกำลังลบ ${exponent} เพราะเลขชี้กำลังลบหมายถึงส่วนกลับ`,
            en: `${reciprocal(value)} is ${base} to the power minus ${exponent}: a negative exponent means the reciprocal.`,
          },
        ),
      ];

      return question(logDefinition, rng, difficulty, {
        prompt: {
          th: "จงหาค่าของลอการิทึมนี้",
          en: "Find the value of this logarithm",
        },
        stem: logOf(base, reciprocal(value)),
        answer: String(-exponent),
        steps,
        misconceptions: [
          {
            answer: { kind: "exact", value: String(exponent) },
            explain: {
              th: `${reciprocal(value)} น้อยกว่าหนึ่ง เลขชี้กำลังจึงต้องติดลบ`,
              en: `${reciprocal(value)} is less than one, so the exponent has to be negative.`,
            },
          },
        ],
        hints: [
          {
            th: `จำนวนที่ถามน้อยกว่าหนึ่ง เลขชี้กำลังจะเป็นอย่างไร`,
            en: `The number asked about is less than one - what does that make the exponent?`,
          },
          {
            th: `${reciprocal(value)} = ${base}^{-${exponent}}`,
            en: `${reciprocal(value)} = ${base}^{-${exponent}}.`,
          },
          { th: `คำตอบคือ ${-exponent}`, en: `The answer is ${-exponent}.` },
        ],
      });
    }

    if (difficulty === 3) {
      // Given the logarithm, find the number: the definition read backwards.
      const exponent = rng.int(2, base === 2 ? 7 : 4);
      const value = base ** exponent;
      const steps: Step[] = [
        makeStep(`x = ${base}^{${exponent}}`, "log.definition", {
          th: `จากนิยาม ${logOf(base, "x")} = ${exponent} แปลว่า x = ${base}^{${exponent}}`,
          en: `By the definition, ${logOf(base, "x")} = ${exponent} means x = ${base}^{${exponent}}.`,
        }),
        makeStep(`x = ${value}`, "log.definition", {
          th: `คิดออกมาได้ ${value}`,
          en: `Which works out to ${value}.`,
        }),
      ];

      return question(logDefinition, rng, difficulty, {
        prompt: {
          th: `จงหาค่า x จากสมการนี้`,
          en: `Find x`,
        },
        stem: `${logOf(base, "x")} = ${exponent}`,
        answer: String(value),
        steps,
        misconceptions: [
          {
            answer: { kind: "exact", value: String(base * exponent) },
            explain: {
              th: `${exponent} คือเลขชี้กำลัง ไม่ใช่ตัวคูณ x คือ ${base} ยกกำลัง ${exponent}`,
              en: `${exponent} is an exponent, not a multiplier: x is ${base} to the power ${exponent}.`,
            },
          },
        ],
        hints: [
          {
            th: "เปลี่ยนจากรูปลอการิทึมกลับเป็นรูปเลขยกกำลังก่อน",
            en: "Turn it from logarithm form back into power form first.",
          },
          {
            th: `จะได้ x = ${base}^{${exponent}}`,
            en: `That gives x = ${base}^{${exponent}}.`,
          },
          { th: `คิดเลขได้ ${value}`, en: `Which is ${value}.` },
        ],
      });
    }

    // Difficulty 4: the base is the unknown.
    const exponent = rng.int(2, 4);
    const root = rng.int(2, 6);
    const value = root ** exponent;
    const steps: Step[] = [
      makeStep(`x^{${exponent}} = ${value}`, "log.definition", {
        th: `จากนิยาม ${logOf("x", value)} = ${exponent} แปลว่า x ยกกำลัง ${exponent} ได้ ${value}`,
        en: `By the definition, ${logOf("x", value)} = ${exponent} means x to the power ${exponent} is ${value}.`,
      }),
      makeStep(
        `x = ${root}`,
        "log.definition",
        {
          th: `จำนวนที่ยกกำลัง ${exponent} แล้วได้ ${value} คือ ${root}`,
          en: `The number whose ${exponent}th power is ${value} is ${root}.`,
        },
        // Taking a root keeps the solution and changes the function.
        { chain: "solved" },
      ),
    ];

    return question(logDefinition, rng, difficulty, {
      prompt: { th: "จงหาค่าฐาน x", en: "Find the base x" },
      stem: `${logOf("x", value)} = ${exponent}`,
      answer: String(root),
      steps,
      misconceptions: [
        {
          answer: { kind: "exact", value: String(value / exponent) },
          explain: {
            th: `${exponent} เป็นเลขชี้กำลัง ต้องหาจำนวนที่ยกกำลัง ${exponent} แล้วได้ ${value} ไม่ใช่หาร`,
            en: `${exponent} is an exponent: look for the number whose ${exponent}th power is ${value}, not a division.`,
          },
        },
      ],
      hints: [
        {
          th: "เปลี่ยนกลับเป็นรูปเลขยกกำลัง แล้วดูว่าฐานคืออะไร",
          en: "Turn it into power form and see what the base must be.",
        },
        {
          th: `จะได้ x^{${exponent}} = ${value}`,
          en: `That gives x^{${exponent}} = ${value}.`,
        },
        { th: `ลองยกกำลังดูจะได้ ${root}`, en: `Trying powers gives ${root}.` },
      ],
    });
  },
};

// ---------------------------------------------------------------------------
// สมบัติของลอการิทึม
// ---------------------------------------------------------------------------

export const logLaws: Generator = {
  id: "log.laws",
  skillId: "log.laws",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const base = rng.pick(LOG_BASES);
    /** The answer is the exponent the whole expression collapses to. */
    const total = rng.int(2, base === 2 ? 8 : 4);

    if (difficulty === 1) {
      // A sum: `\log_b b^m + \log_b b^n`.
      const first = rng.int(1, total - 1);
      const second = total - first;
      const steps: Step[] = [
        makeStep(
          logOf(base, `${base ** first} \\times ${base ** second}`),
          "log.product",
          {
            th: "ผลบวกของลอการิทึมฐานเดียวกันคือลอการิทึมของผลคูณ",
            en: "A sum of logs with the same base is the log of the product.",
          },
        ),
        makeStep(logOf(base, base ** total), "log.product", {
          th: `คูณข้างในได้ ${base ** total}`,
          en: `Multiplying inside gives ${base ** total}.`,
        }),
        makeStep(String(total), "log.definition", {
          th: `${base ** total} คือ ${base} ยกกำลัง ${total}`,
          en: `${base ** total} is ${base} to the power ${total}.`,
        }),
      ];

      return question(logLaws, rng, difficulty, {
        prompt: { th: "จงหาค่าของนิพจน์นี้", en: "Find the value" },
        stem: `${logOf(base, base ** first)} + ${logOf(base, base ** second)}`,
        answer: String(total),
        steps,
        misconceptions: [
          {
            answer: {
              kind: "exact",
              value: String(base ** first + base ** second),
            },
            explain: {
              th: "ผลบวกของลอการิทึมคือลอการิทึมของผลคูณ ไม่ใช่ผลบวกของจำนวนข้างใน",
              en: "A sum of logs is the log of a product, not the sum of the numbers inside.",
            },
          },
        ],
        hints: [
          {
            th: "ฐานเดียวกัน บวกกัน ให้คูณข้างในเข้าด้วยกัน",
            en: "Same base, added: multiply what is inside.",
          },
          {
            th: `จะได้ ${logOf(base, base ** total)}`,
            en: `That gives ${logOf(base, base ** total)}.`,
          },
          {
            th: `แล้วอ่านเป็นเลขชี้กำลัง ได้ ${total}`,
            en: `Read as an exponent, that is ${total}.`,
          },
        ],
      });
    }

    if (difficulty === 2) {
      // A difference: `\log_b (b^m k) - \log_b k`.
      const extra = rng.int(2, 9);
      const inside = base ** total * extra;
      const steps: Step[] = [
        makeStep(
          logOf(base, `\\frac{${inside}}{${extra}}`),
          "log.quotient",
          {
            th: "ผลต่างของลอการิทึมฐานเดียวกันคือลอการิทึมของผลหาร",
            en: "A difference of logs with the same base is the log of the quotient.",
          },
        ),
        makeStep(logOf(base, base ** total), "log.quotient", {
          th: `หารข้างในได้ ${base ** total}`,
          en: `Dividing inside gives ${base ** total}.`,
        }),
        makeStep(String(total), "log.definition", {
          th: `${base ** total} คือ ${base} ยกกำลัง ${total}`,
          en: `${base ** total} is ${base} to the power ${total}.`,
        }),
      ];

      return question(logLaws, rng, difficulty, {
        prompt: { th: "จงหาค่าของนิพจน์นี้", en: "Find the value" },
        stem: `${logOf(base, inside)} - ${logOf(base, extra)}`,
        answer: String(total),
        steps,
        misconceptions: [
          {
            answer: { kind: "exact", value: String(inside - extra) },
            explain: {
              th: "ผลต่างของลอการิทึมคือลอการิทึมของผลหาร ไม่ใช่ผลต่างของจำนวนข้างใน",
              en: "A difference of logs is the log of a quotient, not the difference of the numbers inside.",
            },
          },
        ],
        hints: [
          {
            th: "ฐานเดียวกัน ลบกัน ให้หารข้างใน",
            en: "Same base, subtracted: divide what is inside.",
          },
          {
            th: `${inside} หารด้วย ${extra} ได้ ${base ** total}`,
            en: `${inside} divided by ${extra} is ${base ** total}.`,
          },
          {
            th: `แล้วอ่านเป็นเลขชี้กำลัง ได้ ${total}`,
            en: `Read as an exponent, that is ${total}.`,
          },
        ],
      });
    }

    if (difficulty === 3) {
      // A multiplier in front: `k \log_b b^m`.
      const multiplier = rng.int(2, 4);
      const inner = Math.max(1, Math.floor(total / multiplier));
      const value = multiplier * inner;
      const steps: Step[] = [
        makeStep(
          logOf(base, `${paren(String(base ** inner))}^{${multiplier}}`),
          "log.power",
          {
            th: `ตัวคูณข้างหน้ากลับเข้าไปเป็นเลขชี้กำลังข้างในได้`,
            en: `The multiplier in front goes back in as an exponent.`,
          },
        ),
        makeStep(String(value), "log.definition", {
          th: `${base ** inner} คือ ${base} ยกกำลัง ${inner} คูณ ${multiplier} ได้ ${value}`,
          en: `${base ** inner} is ${base} to the power ${inner}; times ${multiplier} is ${value}.`,
        }),
      ];

      return question(logLaws, rng, difficulty, {
        prompt: { th: "จงหาค่าของนิพจน์นี้", en: "Find the value" },
        stem: `${multiplier}${logOf(base, base ** inner)}`,
        answer: String(value),
        steps,
        misconceptions: [
          {
            answer: { kind: "exact", value: String(inner ** multiplier) },
            explain: {
              th: `ตัวคูณข้างหน้าคูณกับค่าของลอการิทึม ไม่ได้ยกกำลังมัน`,
              en: `The multiplier in front multiplies the log's value; it does not raise it to a power.`,
            },
          },
        ],
        hints: [
          {
            th: `หาค่า ${logOf(base, base ** inner)} ก่อน`,
            en: `Work out ${logOf(base, base ** inner)} first.`,
          },
          {
            th: `ได้ ${inner} แล้วคูณด้วย ${multiplier}`,
            en: `That is ${inner}; now multiply by ${multiplier}.`,
          },
          { th: `ได้ ${value}`, en: `Giving ${value}.` },
        ],
      });
    }

    // Difficulty 4: all three laws in one expression.
    // Base ten grows fastest, so it gets the shorter exponents: otherwise the
    // question is a seven-figure number and the arithmetic becomes the point.
    const span = base === 10 ? 2 : 3;
    const first = rng.int(1, span);
    const second = rng.int(1, span);
    const removed = rng.int(1, 2);
    const value = first + second - removed;
    const steps: Step[] = [
      makeStep(
        logOf(
          base,
          `\\frac{${base ** first} \\times ${base ** second}}{${base ** removed}}`,
        ),
        "log.product",
        {
          th: "รวมทั้งสามพจน์เข้าเป็นลอการิทึมเดียว บวกคือคูณ ลบคือหาร",
          en: "Gather all three into one logarithm: plus is times, minus is divide.",
        },
      ),
      makeStep(logOf(base, base ** value), "log.quotient", {
        th: `คิดข้างในได้ ${base ** value}`,
        en: `Inside that works out to ${base ** value}.`,
      }),
      makeStep(String(value), "log.definition", {
        th: `${base ** value} คือ ${base} ยกกำลัง ${value}`,
        en: `${base ** value} is ${base} to the power ${value}.`,
      }),
    ];

    return question(logLaws, rng, difficulty, {
      prompt: { th: "จงหาค่าของนิพจน์นี้", en: "Find the value" },
      stem: `${logOf(base, base ** first)} + ${logOf(base, base ** second)} - ${logOf(base, base ** removed)}`,
      answer: String(value),
      steps,
      misconceptions: [
        {
          answer: { kind: "exact", value: String(first + second + removed) },
          explain: {
            th: "พจน์ที่ติดลบต้องลบออก ไม่ใช่บวกเข้าไป",
            en: "The subtracted term comes off, it does not go on.",
          },
        },
      ],
      hints: [
        {
          th: "หาค่าแต่ละพจน์แยกกันก็ได้ หรือรวมเป็นลอการิทึมเดียวก่อนก็ได้",
          en: "Either work out each term separately, or gather them into one log first.",
        },
        {
          th: `แต่ละพจน์คือ ${first}, ${second} และ ${removed}`,
          en: `The three terms are ${first}, ${second} and ${removed}.`,
        },
        {
          th: `${first} + ${second} - ${removed} = ${value}`,
          en: `${first} + ${second} - ${removed} = ${value}.`,
        },
      ],
    });
  },
};

// ---------------------------------------------------------------------------
// สมการเอกซ์โพเนนเชียลและลอการิทึม
// ---------------------------------------------------------------------------

export const expLogEquations: Generator = {
  id: "exp.log.equations",
  skillId: "exp.log.equations",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const base = rng.pick([2, 3, 5] as const);
    const root = rng.nonZeroInt(-4, 6);

    if (difficulty === 1) {
      // `b^x = b^n`, with the right-hand side written as a plain number.
      const exponent = rng.int(2, base === 2 ? 9 : base === 3 ? 6 : 4);
      const steps: Step[] = [
        makeStep(`${base}^{x} = ${base}^{${exponent}}`, "exp.same-base", {
          th: `เขียน ${base ** exponent} ให้เป็นกำลังของ ${base} ก่อน`,
          en: `Write ${base ** exponent} as a power of ${base} first.`,
        }),
        makeStep(
          `x = ${exponent}`,
          "exp.same-base",
          {
            th: "ฐานเท่ากันแล้ว จึงเทียบเลขชี้กำลังได้เลย",
            en: "The bases match, so the exponents can be set equal.",
          },
          { chain: "solved" },
        ),
      ];

      return question(expLogEquations, rng, difficulty, {
        prompt: { th: "จงแก้สมการ", en: "Solve the equation" },
        stem: `${base}^{x} = ${base ** exponent}`,
        answer: String(exponent),
        steps,
        misconceptions: [
          {
            answer: { kind: "exact", value: String(base ** exponent / base) },
            explain: {
              th: `ตัวแปรอยู่บนเลขชี้กำลัง จึงหารไม่ได้ ต้องเขียนสองข้างให้ฐานเดียวกันแล้วเทียบกำลัง`,
              en: `The unknown is in the exponent, so dividing does not reach it: match the bases and compare the exponents.`,
            },
          },
        ],
        hints: [
          {
            th: `${base ** exponent} เป็นกำลังของ ${base} หรือไม่`,
            en: `Is ${base ** exponent} a power of ${base}?`,
          },
          {
            th: `${base ** exponent} = ${base}^{${exponent}}`,
            en: `${base ** exponent} = ${base}^{${exponent}}.`,
          },
          { th: "ฐานเท่ากันแล้วเทียบกำลังได้", en: "Same base, same exponent." },
        ],
      });
    }

    if (difficulty === 2) {
      // `b^{px + q} = b^n`, so the exponents give a linear equation.
      /*
       * The exponent is chosen first and the constant derived from it, rather
       * than the other way round with a retry: a generator that re-rolls by
       * calling itself at a different difficulty hands back a question whose
       * own `difficulty` field is a lie, and the §9 shape check would say so.
       */
      const maxExponent = base === 2 ? 9 : base === 3 ? 5 : 4;
      const exponent = rng.int(2, maxExponent);
      const p = rng.int(2, 3);
      const q = exponent - p * root;
      const steps: Step[] = [
        makeStep(
          `${base}^{${linearExpr(p, q)}} = ${base}^{${exponent}}`,
          "exp.same-base",
          {
            th: `เขียน ${base ** exponent} เป็น ${base}^{${exponent}}`,
            en: `Write ${base ** exponent} as ${base}^{${exponent}}.`,
          },
        ),
        makeStep(
          `${linearExpr(p, q)} = ${exponent}`,
          "exp.same-base",
          {
            th: "ฐานเท่ากัน จึงเทียบเลขชี้กำลัง",
            en: "The bases match, so compare the exponents.",
          },
          { chain: "exponents" },
        ),
        makeStep(
          `x = ${root}`,
          "eq.collect-variable",
          {
            th: `แก้สมการเชิงเส้นตามปกติ ได้ x = ${root}`,
            en: `Solve the linear equation as usual: x = ${root}.`,
          },
          { chain: "solved" },
        ),
      ];

      return question(expLogEquations, rng, difficulty, {
        prompt: { th: "จงแก้สมการ", en: "Solve the equation" },
        stem: `${base}^{${linearExpr(p, q)}} = ${base ** exponent}`,
        answer: String(root),
        steps,
        misconceptions: [
          {
            answer: { kind: "exact", value: String(exponent) },
            explain: {
              th: `${exponent} คือค่าของเลขชี้กำลังทั้งก้อน ยังต้องแก้ ${linearExpr(p, q)} = ${exponent} ต่ออีก`,
              en: `${exponent} is the value of the whole exponent; ${linearExpr(p, q)} = ${exponent} still has to be solved.`,
            },
          },
        ],
        hints: [
          {
            th: `เขียนข้างขวาให้เป็นกำลังของ ${base}`,
            en: `Write the right-hand side as a power of ${base}.`,
          },
          {
            th: `จะได้ ${linearExpr(p, q)} = ${exponent}`,
            en: `That gives ${linearExpr(p, q)} = ${exponent}.`,
          },
          { th: "แล้วแก้สมการเชิงเส้นตามปกติ", en: "Then solve it as usual." },
        ],
      });
    }

    if (difficulty === 3) {
      /*
       * Both sides a power of the same base, written differently:
       * `b^{x + m} = (b^k)^{x - n}`. The right-hand side has to be rewritten
       * before the exponents can be compared at all.
       */
      const k = rng.int(2, 3);
      const n = rng.int(1, 4);
      // (x + m) = k(x - n) has the solution x = (k*n + m) / (k - 1).
      const m = root * (k - 1) - k * n;
      const steps: Step[] = [
        makeStep(
          `${base}^{${linearExpr(1, m)}} = ${base}^{${k}${paren(linearExpr(1, -n))}}`,
          "exp.power-of-power",
          {
            th: `${base ** k} คือ ${base}^{${k}} ยกกำลังซ้อนกันจึงคูณเลขชี้กำลัง`,
            en: `${base ** k} is ${base}^{${k}}, and a power of a power multiplies the exponents.`,
          },
        ),
        makeStep(
          `${linearExpr(1, m)} = ${k}${paren(linearExpr(1, -n))}`,
          "exp.same-base",
          {
            th: "ฐานเท่ากันแล้ว เทียบเลขชี้กำลังได้",
            en: "Same base now, so compare the exponents.",
          },
          { chain: "exponents" },
        ),
        makeStep(
          `x = ${root}`,
          "eq.collect-variable",
          {
            th: `กระจายแล้วรวมตัวแปรไว้ข้างเดียว ได้ x = ${root}`,
            en: `Expand, gather the variable on one side: x = ${root}.`,
          },
          { chain: "solved" },
        ),
      ];

      return question(expLogEquations, rng, difficulty, {
        prompt: { th: "จงแก้สมการ", en: "Solve the equation" },
        stem: `${base}^{${linearExpr(1, m)}} = ${base ** k}^{${linearExpr(1, -n)}}`,
        answer: String(root),
        steps,
        misconceptions: [
          {
            answer: { kind: "exact", value: String(m + n) },
            explain: {
              th: `ข้างขวาเป็นฐาน ${base ** k} ไม่ใช่ ${base} ต้องเขียนเป็น ${base}^{${k}} ก่อนจึงเทียบได้`,
              en: `The right-hand side has base ${base ** k}, not ${base}: rewrite it as ${base}^{${k}} before comparing.`,
            },
          },
        ],
        hints: [
          {
            th: "สองข้างยังฐานไม่เท่ากัน ทำให้เท่ากันก่อน",
            en: "The bases do not match yet - make them match first.",
          },
          {
            th: `${base ** k} = ${base}^{${k}} แล้วยกกำลังซ้อนให้คูณเลขชี้กำลัง`,
            en: `${base ** k} = ${base}^{${k}}, and nesting powers multiplies the exponents.`,
          },
          {
            th: `จะได้ ${linearExpr(1, m)} = ${k}${paren(linearExpr(1, -n))}`,
            en: `That gives ${linearExpr(1, m)} = ${k}${paren(linearExpr(1, -n))}.`,
          },
        ],
      });
    }

    // Difficulty 4: a logarithmic equation, turned back into a power.
    const exponent = rng.int(2, base === 2 ? 6 : 3);
    const shift = rng.nonZeroInt(-9, 9);
    const value = base ** exponent;
    const answer = value - shift;
    const steps: Step[] = [
      makeStep(`${linearExpr(1, shift)} = ${base}^{${exponent}}`, "log.definition", {
        th: `จากนิยาม ถ้า ${logOf(base, "A")} = ${exponent} แล้ว A = ${base}^{${exponent}}`,
        en: `By the definition, ${logOf(base, "A")} = ${exponent} means A = ${base}^{${exponent}}.`,
      }),
      makeStep(`${linearExpr(1, shift)} = ${value}`, "log.definition", {
        th: `${base}^{${exponent}} = ${value}`,
        en: `${base}^{${exponent}} = ${value}.`,
      }),
      makeStep(`x = ${answer}`, "eq.collect-variable", {
        th: `ย้าย ${shift} ไปอีกข้าง ได้ x = ${answer}`,
        en: `Move the ${shift} across: x = ${answer}.`,
      }),
    ];

    return question(expLogEquations, rng, difficulty, {
      prompt: { th: "จงแก้สมการ", en: "Solve the equation" },
      stem: `${logOf(base, paren(linearExpr(1, shift)))} = ${exponent}`,
      answer: String(answer),
      steps,
      misconceptions: [
        {
          answer: { kind: "exact", value: String(value) },
          explain: {
            th: `${value} คือค่าของ ${paren(linearExpr(1, shift))} ทั้งก้อน ยังต้องย้าย ${shift} ออกอีกที`,
            en: `${value} is the value of all of ${paren(linearExpr(1, shift))}; the ${shift} still has to come off.`,
          },
        },
      ],
      hints: [
        {
          th: "เปลี่ยนจากรูปลอการิทึมกลับเป็นรูปเลขยกกำลังก่อน",
          en: "Turn it out of logarithm form and into power form first.",
        },
        {
          th: `จะได้ ${linearExpr(1, shift)} = ${base}^{${exponent}} = ${value}`,
          en: `That gives ${linearExpr(1, shift)} = ${base}^{${exponent}} = ${value}.`,
        },
        { th: "แล้วแก้สมการเชิงเส้นตามปกติ", en: "Then solve it as usual." },
      ],
    });
  },
};

/** Everything in this chapter shares the same shape, so it is assembled once. */
function question(
  generator: { id: string; skillId: string },
  rng: RNG,
  difficulty: number,
  built: {
    prompt: L;
    stem: string;
    answer: string;
    steps: Step[];
    misconceptions: { answer: { kind: "exact"; value: string }; explain: L }[];
    hints: L[];
  },
): Question {
  const answer = { kind: "exact" as const, value: built.answer };
  const named = namedMistakes(answer, built.misconceptions);
  return {
    id: `${generator.id}:${rng.seed}:${difficulty}`,
    generatorId: generator.id,
    skillId: generator.skillId,
    topicId: TOPIC,
    difficulty: difficulty as 1 | 2 | 3 | 4,
    provenance: "generated",
    prompt: built.prompt,
    stem: built.stem,
    /*
     * A subscript is not machine-readable - `lib/math/katex.ts` refuses rather
     * than guesses - so nothing in this chapter can be checked against its own
     * stem. See the file header, and `func-exp-log.test.ts`, which checks the
     * answers against the definition instead.
     */
    machineStem: null,
    answer,
    steps: built.steps,
    hints: built.hints,
    ...(named.length ? { misconceptions: named } : {}),
    rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
  };
}
