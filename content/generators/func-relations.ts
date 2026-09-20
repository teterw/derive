import { coefficient, linearExpr, paren, quadraticExpr, sumTerms } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type { Generator, Question, RNG, Step } from "../types";

const TOPIC = "func.relations";

/**
 * ความสัมพันธ์และฟังก์ชัน.
 *
 * ## The stem says what `f` is; the prompt says what is wanted
 *
 * `f(x) = 2x + 1` is not a question, and `f(3)` on its own does not say what
 * `f` is. The stem carries the definition - which is the thing the learner has
 * to read correctly - and the prompt asks for the value. That also keeps the
 * stem machine-readable for everything except the ones whose stem defines two
 * functions at once, which say `machineStem: null` and are checked by this
 * chapter's own test instead.
 */
type Linear = { a: number; b: number };

function linear(rng: RNG, range = 9): Linear {
  return { a: rng.nonZeroInt(-range, range), b: rng.nonZeroInt(-12, 12) };
}

/** `2x + 1` as KaTeX and as mathjs - the same string works for both. */
function linearOf({ a, b }: Linear): string {
  return linearExpr(a, b);
}

// ---------------------------------------------------------------------------
// การหาค่าของฟังก์ชัน
// ---------------------------------------------------------------------------

export const funcEvaluate: Generator = {
  id: "func.evaluate",
  skillId: "func.evaluate",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const at = rng.nonZeroInt(-7, 7);

    if (difficulty <= 2) {
      const f = linear(rng, difficulty === 1 ? 5 : 9);
      const value = f.a * at + f.b;
      const definition = linearOf(f);

      const steps: Step[] = [
        makeStep(
          `f${paren(String(at))} = ${f.a}${paren(String(at))} ${f.b > 0 ? "+" : "-"} ${Math.abs(f.b)}`,
          "func.notation",
          {
            th: `แทน x ด้วย ${at} ในทุกที่ที่มี x`,
            en: `Put ${at} in wherever x appears.`,
          },
          { math: null },
        ),
        makeStep(
          `f${paren(String(at))} = ${value}`,
          "func.notation",
          {
            th: `คิดเลขออกมาได้ ${f.a * at} ${f.b > 0 ? "+" : "-"} ${Math.abs(f.b)} = ${value}`,
            en: `That works out to ${f.a * at} ${f.b > 0 ? "+" : "-"} ${Math.abs(f.b)} = ${value}.`,
          },
          { math: null },
        ),
      ];

      return {
        id: `${funcEvaluate.id}:${rng.seed}:${difficulty}`,
        generatorId: funcEvaluate.id,
        skillId: funcEvaluate.skillId,
        topicId: TOPIC,
        difficulty,
        provenance: "generated",
        prompt: {
          th: `จงหาค่าของ f${paren(String(at))}`,
          en: `Find f${paren(String(at))}`,
        },
        stem: `f(x) = ${definition}`,
        // The stem defines `f`; it is not an equation the answer solves.
        machineStem: null,
        answer: { kind: "exact", value: String(value) },
        steps,
        misconceptions: namedMistakes({ kind: "exact", value: String(value) }, [
          {
            answer: { kind: "exact", value: String(f.a * at) },
            explain: {
              th: `แทนแล้วต้องบวกพจน์คงที่ ${f.b} ด้วย ไม่ใช่หยุดที่ ${f.a * at}`,
              en: `After substituting, the constant ${f.b} still has to be added: the answer is not ${f.a * at}.`,
            },
          },
          {
            answer: { kind: "exact", value: String(f.a + f.b + at) },
            explain: {
              th: `${f.a}x หมายถึง ${f.a} คูณ x จึงเป็น ${f.a} คูณ ${at} ไม่ใช่ ${f.a} บวก ${at}`,
              en: `${f.a}x means ${f.a} times x, so it is ${f.a} times ${at}, not ${f.a} plus ${at}.`,
            },
          },
        ]),
        hints: [
          {
            th: `f${paren(String(at))} แปลว่าแทน x ด้วย ${at} ไม่ใช่คูณ f กับ ${at}`,
            en: `f${paren(String(at))} means put ${at} in for x, and is not f times ${at}.`,
          },
          {
            th: `จะได้ ${f.a}${paren(String(at))} ${f.b > 0 ? "+" : "-"} ${Math.abs(f.b)}`,
            en: `That gives ${f.a}${paren(String(at))} ${f.b > 0 ? "+" : "-"} ${Math.abs(f.b)}.`,
          },
          { th: `คิดเลขได้ ${value}`, en: `Which works out to ${value}.` },
        ],
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    /*
     * A quadratic, and at difficulty 4 evaluated at an expression rather than
     * a number - which is the same operation and feels like a different one,
     * and is exactly what the chain rule will ask for later.
     */
    const a = rng.pick([1, 1, 2, -1, -2] as const);
    const b = rng.nonZeroInt(-6, 6);
    const c = rng.nonZeroInt(-9, 9);
    const definition = quadraticExpr(a, b, c);

    if (difficulty === 3) {
      const value = a * at * at + b * at + c;
      const steps: Step[] = [
        makeStep(
          `f${paren(String(at))} = ${a === 1 ? "" : a}${paren(String(at))}^2 ${b > 0 ? "+" : "-"} ${Math.abs(b)}${paren(String(at))} ${c > 0 ? "+" : "-"} ${Math.abs(c)}`,
          "func.notation",
          {
            th: `แทน x ด้วย ${at} ทุกที่ รวมทั้งในพจน์ที่ยกกำลังสองด้วย`,
            en: `Put ${at} in everywhere, including inside the square.`,
          },
          { math: null },
        ),
        makeStep(
          `f${paren(String(at))} = ${value}`,
          "func.notation",
          {
            th: `${a * at * at} ${b * at > 0 ? "+" : "-"} ${Math.abs(b * at)} ${c > 0 ? "+" : "-"} ${Math.abs(c)} = ${value}`,
            en: `${a * at * at} ${b * at > 0 ? "+" : "-"} ${Math.abs(b * at)} ${c > 0 ? "+" : "-"} ${Math.abs(c)} = ${value}.`,
          },
          { math: null },
        ),
      ];

      return {
        id: `${funcEvaluate.id}:${rng.seed}:${difficulty}`,
        generatorId: funcEvaluate.id,
        skillId: funcEvaluate.skillId,
        topicId: TOPIC,
        difficulty,
        provenance: "generated",
        prompt: {
          th: `จงหาค่าของ f${paren(String(at))}`,
          en: `Find f${paren(String(at))}`,
        },
        stem: `f(x) = ${definition}`,
        machineStem: null,
        answer: { kind: "exact", value: String(value) },
        steps,
        misconceptions: namedMistakes({ kind: "exact", value: String(value) }, [
          {
            answer: {
              kind: "exact",
              value: String(a * at * at * -1 + b * at + c),
            },
            explain: {
              th: `${paren(String(at))}^2 เป็นบวกเสมอ เพราะจำนวนลบยกกำลังสองได้บวก`,
              en: `${paren(String(at))}^2 is positive: squaring a negative gives a positive.`,
            },
          },
        ]),
        hints: [
          {
            th: `แทน ${at} ลงไปทุกที่ที่มี x`,
            en: `Put ${at} in wherever x appears.`,
          },
          {
            th: `ระวังเครื่องหมายตอนยกกำลังสอง ${paren(String(at))}^2 = ${at * at}`,
            en: `Watch the sign when squaring: ${paren(String(at))}^2 = ${at * at}.`,
          },
          { th: `รวมกันได้ ${value}`, en: `Adding up gives ${value}.` },
        ],
        rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
      };
    }

    // Difficulty 4: `f(x + k)`, so the answer is an expression.
    const k = rng.nonZeroInt(-5, 5);
    const g = linearExpr(1, k);
    const expanded = quadraticExpr(
      a,
      2 * a * k + b,
      a * k * k + b * k + c,
    );
    const answerMath = expanded;

    /*
     * Written without the `f(x + k) =` in front of it. That prefix reads well
     * and is not machine-readable: `f(...)` parses as `f` *times* the bracket,
     * so the line would carry a symbol the next one does not have and the
     * property gate would see the derivation break. The explanation says what
     * the line is instead.
     */
    const substituted = sumTerms([
      `${coefficient(a, "")}${paren(g)}^2`,
      coefficient(b, paren(g)),
      c === 0 ? null : String(c),
    ]);

    const steps: Step[] = [
      makeStep(substituted, "func.notation", {
        th: `f${paren(g)} คือการแทน x ด้วย ${paren(g)} ทั้งก้อน ทุกที่ที่มี x`,
        en: `f${paren(g)} means putting the whole of ${paren(g)} in wherever x appears.`,
      }),
      makeStep(expanded, "arith.distribute", {
        th: "กระจายแล้วรวมพจน์คล้าย",
        en: "Expand, then collect like terms.",
      }),
    ];

    return {
      id: `${funcEvaluate.id}:${rng.seed}:${difficulty}`,
      generatorId: funcEvaluate.id,
      skillId: funcEvaluate.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: {
        th: `จงหา f${paren(g)} ในรูปอย่างง่าย`,
        en: `Find f${paren(g)}, simplified`,
      },
      stem: `f(x) = ${definition}`,
      machineStem: null,
      answer: { kind: "exact", value: answerMath },
      steps,
      misconceptions: namedMistakes({ kind: "exact", value: answerMath }, [
        {
          answer: {
            kind: "exact",
            value: quadraticExpr(a, b, a * k * k + b * k + c),
          },
          explain: {
            th: `${paren(g)}^2 ต้องกระจายให้ครบ ไม่ใช่ยกกำลังสองเฉพาะ x`,
            en: `${paren(g)}^2 has to be expanded in full, not just the x squared.`,
          },
        },
      ]),
      hints: [
        {
          th: `แทน x ด้วย ${paren(g)} ทั้งก้อน วงเล็บสำคัญมาก`,
          en: `Substitute the whole bracket ${paren(g)}, which is what the bracket is for.`,
        },
        {
          th: `${paren(g)}^2 กระจายได้ ${quadraticExpr(1, 2 * k, k * k)}`,
          en: `${paren(g)}^2 expands to ${quadraticExpr(1, 2 * k, k * k)}.`,
        },
        { th: "แล้วรวมพจน์คล้ายให้เรียบร้อย", en: "Then collect like terms." },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

// ---------------------------------------------------------------------------
// ฟังก์ชันประกอบ
// ---------------------------------------------------------------------------

export const funcComposite: Generator = {
  id: "func.composite",
  skillId: "func.composite",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const f = linear(rng, difficulty === 1 ? 4 : 7);
    const g = linear(rng, difficulty === 1 ? 4 : 7);
    /*
     * At 3 and 4 the outer function is quadratic, which is where composing
     * stops being "multiply the coefficients" and starts needing the bracket.
     */
    const squared = difficulty >= 3;

    /*
     * Two linear functions commute exactly when `ad + b = cb + d`, and when
     * they do, `g(f(x))` *is* `f(g(x))` - so the named wrong answer would be
     * the right one and `namedMistakes` would drop it, leaving the question
     * that teaches "order matters" with nothing to show for it. Nudging one
     * constant is enough to break the coincidence.
     */
    if (!squared && f.a * g.b + f.b === g.a * f.b + g.b) {
      g.b = g.b === 12 ? g.b - 1 : g.b + 1;
      if (g.b === 0) g.b = 1;
    }
    const atValue = difficulty === 4 ? rng.nonZeroInt(-5, 5) : null;

    /** f(g(x)), expanded. */
    const composite = squared
      ? quadraticExpr(
          g.a * g.a,
          2 * g.a * g.b,
          g.b * g.b + f.b,
        )
      : linearExpr(f.a * g.a, f.a * g.b + f.b);
    const fDefinition = squared ? `x^2 ${f.b > 0 ? "+" : "-"} ${Math.abs(f.b)}` : linearOf(f);

    const steps: Step[] = [
      /*
       * The `f(g(x)) =` prefix is left off for the same reason as in
       * `func.evaluate`: `f(g(x))` parses as a product of symbols, and the
       * gate would read the next line as a broken step.
       */
      makeStep(
        squared
          ? sumTerms([
              `${paren(linearOf(g))}^2`,
              f.b === 0 ? null : String(f.b),
            ])
          : sumTerms([
              `${coefficient(f.a, "")}${paren(linearOf(g))}`,
              f.b === 0 ? null : String(f.b),
            ]),
        "func.composite",
        {
          th: `f(g(x)) คือการใส่ ${paren(linearOf(g))} ทั้งก้อนลงไปแทน x ใน f`,
          en: `f(g(x)) means putting the whole of ${paren(linearOf(g))} in for x in f.`,
        },
      ),
      makeStep(composite, "arith.distribute", {
        th: "กระจายแล้วรวมพจน์คล้าย",
        en: "Expand, then collect like terms.",
      }),
    ];

    const answerMath = atValue === null
      ? composite
      : String(
          squared
            ? (g.a * atValue + g.b) ** 2 + f.b
            : f.a * (g.a * atValue + g.b) + f.b,
        );

    if (atValue !== null) {
      steps.push(
        makeStep(
          `f(g(${atValue})) = ${answerMath}`,
          "func.notation",
          {
            th: `แล้วแทน x ด้วย ${atValue} ได้ ${answerMath}`,
            en: `Then put x = ${atValue} in: ${answerMath}.`,
          },
          { math: null },
        ),
      );
    }

    return {
      id: `${funcComposite.id}:${rng.seed}:${difficulty}`,
      generatorId: funcComposite.id,
      skillId: funcComposite.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt:
        atValue === null
          ? {
              th: "จงหา f(g(x)) ในรูปอย่างง่าย",
              en: "Find f(g(x)), simplified",
            }
          : {
              th: `จงหาค่าของ f(g(${atValue}))`,
              en: `Find f(g(${atValue}))`,
            },
      stem: `f(x) = ${fDefinition}, \\quad g(x) = ${linearOf(g)}`,
      // Two definitions in one stem: not an equation, and not one function.
      machineStem: null,
      answer: { kind: "exact", value: answerMath },
      steps,
      misconceptions: namedMistakes({ kind: "exact", value: answerMath }, [
        {
          /** g(f(x)) instead of f(g(x)) - the order swapped. */
          answer: {
            kind: "exact",
            value:
              atValue === null
                ? squared
                  ? linearExpr(g.a, g.a * f.b + g.b).replace("x", "x^2")
                  : linearExpr(f.a * g.a, g.a * f.b + g.b)
                : String(
                    squared
                      ? g.a * (atValue * atValue + f.b) + g.b
                      : g.a * (f.a * atValue + f.b) + g.b,
                  ),
          },
          explain: {
            th: "f(g(x)) คือทำ g ก่อนแล้วจึงทำ f สลับลำดับแล้วได้คนละคำตอบ",
            en: "f(g(x)) is g first and f second. Swapping them gives a different answer.",
          },
        },
      ]),
      hints: [
        {
          th: "อ่านจากในออกนอก ตัวที่อยู่ติดกับ x ทำก่อน",
          en: "Read from the inside out: whichever is next to the x goes first.",
        },
        {
          th: `จะได้ใส่ ${paren(linearOf(g))} แทน x ใน f`,
          en: `So ${paren(linearOf(g))} goes in for x in f.`,
        },
        {
          th: "อย่าลืมวงเล็บ แล้วกระจายให้ครบทุกพจน์",
          en: "Keep the bracket, then expand it fully.",
        },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};

// ---------------------------------------------------------------------------
// ฟังก์ชันผกผัน
// ---------------------------------------------------------------------------

export const funcInverse: Generator = {
  id: "func.inverse",
  skillId: "func.inverse",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    /*
     * `f(x) = ax + b` inverts to `(x - b)/a`. At 1 and 2 `a` divides nothing
     * awkward; from 3 it is a genuine fraction, which is where the answer stops
     * being guessable and the swap-then-solve method earns its keep.
     */
    const a =
      difficulty === 1
        ? rng.pick([1, -1] as const)
        : difficulty === 2
          ? rng.pick([2, 3, -2] as const)
          : rng.nonZeroInt(-7, 7);
    const b = rng.nonZeroInt(-12, 12);

    const definition = linearExpr(a, b);
    const answerKatex =
      a === 1
        ? linearExpr(1, -b)
        : a === -1
          ? linearExpr(-1, b)
          : `\\frac{${linearExpr(1, -b)}}{${a}}`;
    const answerMath = a === 1 ? `x - ${b}` : `(x - ${b})/${a}`;

    const steps: Step[] = [
      makeStep(
        `y = ${definition}`,
        "func.inverse-swap",
        {
          th: "เขียน y แทน f(x) ก่อน",
          en: "Start by writing y for f(x).",
        },
        { math: null },
      ),
      makeStep(
        `x = ${a === 1 ? "y" : a === -1 ? "-y" : `${a}y`} ${b > 0 ? "+" : "-"} ${Math.abs(b)}`,
        "func.inverse-swap",
        {
          th: "สลับ x กับ y",
          en: "Swap x and y.",
        },
        { math: null },
      ),
      makeStep(
        `y = ${answerKatex}`,
        "eq.move-term",
        {
          th: `แก้หา y: ย้าย ${b} ไปอีกข้าง${a === 1 ? "" : ` แล้วหารด้วย ${a}`}`,
          en: `Solve for y: move the ${b} across${a === 1 ? "" : `, then divide by ${a}`}.`,
        },
        { math: null },
      ),
    ];

    return {
      id: `${funcInverse.id}:${rng.seed}:${difficulty}`,
      generatorId: funcInverse.id,
      skillId: funcInverse.skillId,
      topicId: TOPIC,
      difficulty,
      provenance: "generated",
      prompt: {
        th: "จงหาฟังก์ชันผกผันของฟังก์ชันนี้",
        en: "Find the inverse of this function",
      },
      stem: `f(x) = ${definition}`,
      machineStem: null,
      answer: { kind: "exact", value: answerMath },
      steps,
      misconceptions: namedMistakes({ kind: "exact", value: answerMath }, [
        {
          /** One over the function, which is what the notation looks like. */
          answer: { kind: "exact", value: `1/(${definition})` },
          explain: {
            th: `f^{-1} ไม่ได้แปลว่าหนึ่งส่วน f แม้เลขชี้กำลังลบในที่อื่นจะแปลแบบนั้น ตรงนี้หมายถึงฟังก์ชันที่เดินย้อนกลับ`,
            en: `f^{-1} does not mean one over f, even though a negative exponent means that everywhere else. Here it means the function that undoes it.`,
          },
        },
        {
          /** Adding b instead of subtracting it: the sign not flipped. */
          answer: {
            kind: "exact",
            value: a === 1 ? `x + ${b}` : `(x + ${b})/${a}`,
          },
          explain: {
            th: `ย้าย ${b} ข้ามเครื่องหมายเท่ากับ ต้องเปลี่ยนเครื่องหมายเป็น ${-b}`,
            en: `The ${b} crosses the equals sign, so it changes sign to ${-b}.`,
          },
        },
      ]),
      hints: [
        {
          th: "เขียน y แทน f(x) แล้วสลับ x กับ y",
          en: "Write y for f(x), then swap x and y.",
        },
        {
          th: `จะได้ x = ${a === 1 ? "y" : `${a}y`} ${b > 0 ? "+" : "-"} ${Math.abs(b)}`,
          en: `That gives x = ${a === 1 ? "y" : `${a}y`} ${b > 0 ? "+" : "-"} ${Math.abs(b)}.`,
        },
        { th: "แล้วแก้หา y ตามปกติ", en: "Then solve for y as usual." },
      ],
      rulesUsed: [...new Set(steps.map((step) => step.ruleId))],
    };
  },
};
