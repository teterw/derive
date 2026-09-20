import { fraction } from "../format";
import { makeStep } from "../step";
import { namedMistakes } from "../misconception";
import type {
  Generator,
  L,
  Question,
  RNG,
  Step,
} from "../types";

const TOPIC = "trig.ratios";

/**
 * อัตราส่วนตรีโกณมิติ.
 *
 * Every triangle here is a Pythagorean triple, so all three sides are whole
 * numbers and every ratio is an exact fraction. That is not a convenience: a
 * ratio like `\sin A = 0.6` is a rounded number, and rounding at the first step
 * of a two-step question is how a ม.3 answer ends up three per cent out for no
 * reason the learner can see.
 *
 * `\sin` and `^\circ` are outside what `lib/math/katex.ts` will convert - it
 * refuses rather than guesses - so nothing in this chapter has a machine-
 * readable stem, and every question says `machineStem: null`. The chapter's
 * own test checks each answer against the triangle it was built from.
 */
type Triple = { opposite: number; adjacent: number; hypotenuse: number };

/** The triples small enough that a ม.3 learner meets them. */
const TRIPLES: Triple[] = [
  { opposite: 3, adjacent: 4, hypotenuse: 5 },
  { opposite: 5, adjacent: 12, hypotenuse: 13 },
  { opposite: 8, adjacent: 15, hypotenuse: 17 },
  { opposite: 7, adjacent: 24, hypotenuse: 25 },
  { opposite: 20, adjacent: 21, hypotenuse: 29 },
  { opposite: 9, adjacent: 40, hypotenuse: 41 },
];

type RatioName = "sin" | "cos" | "tan";

const RATIO_LABEL: Record<RatioName, L> = {
  sin: { th: "ด้านตรงข้าม ส่วน ด้านตรงข้ามมุมฉาก", en: "opposite over hypotenuse" },
  cos: { th: "ด้านประชิด ส่วน ด้านตรงข้ามมุมฉาก", en: "adjacent over hypotenuse" },
  tan: { th: "ด้านตรงข้าม ส่วน ด้านประชิด", en: "opposite over adjacent" },
};

/**
 * A product written the way a person writes one.
 *
 * `	an 45^\circ` is exactly 1, so a coefficient in front of it produces
 * `2 * (1)` - which renders as `2 \cdot 1` and is the sort of thing that makes
 * a generated answer look generated. `answer-accepted.test.ts` refuses it, and
 * is right to: the model answer is what a learner copies.
 */
function productOf(parts: string[]): string {
  if (parts.some((part) => part === "0")) return "0";
  const kept = parts.filter((part) => part !== "1");
  if (kept.length === 0) return "1";
  if (kept.length === 1) return kept[0]!;
  return kept.map((part) => `(${part})`).join(" * ");
}

/** The same, for a sum: a zero term contributes nothing worth showing. */
function sumOf(parts: string[]): string {
  const kept = parts.filter((part) => part !== "0");
  if (kept.length === 0) return "0";
  if (kept.length === 1) return kept[0]!;
  return kept.map((part) => `(${part})`).join(" + ");
}

/** The two side lengths a ratio is built from, in order. */
function sidesFor(ratio: RatioName, triple: Triple): [number, number] {
  switch (ratio) {
    case "sin":
      return [triple.opposite, triple.hypotenuse];
    case "cos":
      return [triple.adjacent, triple.hypotenuse];
    case "tan":
      return [triple.opposite, triple.adjacent];
  }
}

/** A triangle described in words, since there is no picture. */
function describe(
  triple: Triple,
  known: "all" | "legs" | "leg-hyp",
  vertex: string,
): L {
  const { opposite, adjacent, hypotenuse } = triple;
  if (known === "legs") {
    return {
      th: `สามเหลี่ยมมุมฉาก ABC มีมุม C เป็นมุมฉาก ด้านตรงข้ามมุม ${vertex} ยาว ${opposite} หน่วย และด้านประชิดมุม ${vertex} ยาว ${adjacent} หน่วย`,
      en: `In right-angled triangle ABC the right angle is at C. The side opposite ${vertex} is ${opposite} units and the side adjacent to ${vertex} is ${adjacent} units.`,
    };
  }
  if (known === "leg-hyp") {
    return {
      th: `สามเหลี่ยมมุมฉาก ABC มีมุม C เป็นมุมฉาก ด้านตรงข้ามมุม ${vertex} ยาว ${opposite} หน่วย และด้านตรงข้ามมุมฉากยาว ${hypotenuse} หน่วย`,
      en: `In right-angled triangle ABC the right angle is at C. The side opposite ${vertex} is ${opposite} units and the hypotenuse is ${hypotenuse} units.`,
    };
  }
  return {
    th: `สามเหลี่ยมมุมฉาก ABC มีมุม C เป็นมุมฉาก ด้านตรงข้ามมุม ${vertex} ยาว ${opposite} หน่วย ด้านประชิดมุม ${vertex} ยาว ${adjacent} หน่วย และด้านตรงข้ามมุมฉากยาว ${hypotenuse} หน่วย`,
    en: `In right-angled triangle ABC the right angle is at C, the side opposite ${vertex} is ${opposite} units, the side adjacent to ${vertex} is ${adjacent} units, and the hypotenuse is ${hypotenuse} units.`,
  };
}

// ---------------------------------------------------------------------------
// นิยามอัตราส่วนตรีโกณมิติ
// ---------------------------------------------------------------------------

export const trigDefinition: Generator = {
  id: "trig.definition",
  skillId: "trig.definition",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const drawn = rng.pick(TRIPLES);
    const ratio = rng.pick(["sin", "cos", "tan"] as const);
    /*
     * Either acute angle, not always A. Reading the triangle from the other
     * corner swaps which side is opposite and which adjacent, and getting that
     * wrong is the commonest slip in the topic - a generator that only ever
     * asks about one corner never tests it.
     */
    const vertex = rng.bool() ? "A" : "B";
    const triple =
      vertex === "A"
        ? drawn
        : {
            opposite: drawn.adjacent,
            adjacent: drawn.opposite,
            hypotenuse: drawn.hypotenuse,
          };
    const [top, bottom] = sidesFor(ratio, triple);
    const answer = fraction(top, bottom);
    const answerMath = `${top}/${bottom}`;

    /*
     * At 3 and 4 one side is missing and has to come from Pythagoras first.
     * That is the difference between knowing the definition and being able to
     * use it, and it is what every exam question actually asks.
     */
    /*
     * At 3 and 4 the adjacent side is withheld and has to come from Pythagoras
     * first. That is the difference between knowing the definition and being
     * able to use it, and it is what an exam question actually asks.
     */
    const hidden = difficulty >= 3;
    const known = hidden ? "leg-hyp" : "all";

    const steps: Step[] = [];

    if (hidden) {
      steps.push(
        makeStep(
          `b = \\sqrt{${triple.hypotenuse}^2 - ${triple.opposite}^2} = ${triple.adjacent}`,
          "trig.pythagoras",
          {
            th: `หาด้านประชิดก่อนด้วยพีทาโกรัส ได้ ${triple.adjacent}`,
            en: `Pythagoras gives the adjacent side first: ${triple.adjacent}.`,
          },
          { math: null },
        ),
      );
    }

    steps.push(
      makeStep(
        `\\${ratio} ${vertex} = \\frac{${top}}{${bottom}}`,
        "trig.sohcahtoa",
        {
          th: `\\${ratio} คือ ${RATIO_LABEL[ratio].th} จึงได้ ${answer}`,
          en: `${ratio} is ${RATIO_LABEL[ratio].en}, which is ${answer}.`,
        },
        { math: null },
      ),
    );

    /*
     * The sides go in the stem as well as in the sentence. The stem is the big
     * panel on the page, and `\sin A = ?` wastes it - the numbers being worked
     * with should be where the eye lands.
     */
    const sides = hidden
      ? `\\text{ข้าม} = ${triple.opposite}, \\ \\text{ฉาก} = ${triple.hypotenuse}`
      : `\\text{ข้าม} = ${triple.opposite}, \\ \\text{ชิด} = ${triple.adjacent}, \\ \\text{ฉาก} = ${triple.hypotenuse}`;

    return question(trigDefinition, rng, difficulty, {
      prompt: {
        th: `${describe(triple, known, vertex).th} จงหาค่าของ \\${ratio} ${vertex}`,
        en: `${describe(triple, known, vertex).en} Find \\${ratio} ${vertex}.`,
      },
      stem: `\\${ratio} ${vertex} \\quad \\text{เมื่อ} \\ ${sides}`,
      answer: answerMath,
      steps,
      misconceptions: [
        {
          answer: { kind: "exact", value: `${bottom}/${top}` },
          explain: {
            th: `${RATIO_LABEL[ratio].th} - ตัวเศษกับตัวส่วนสลับกัน`,
            en: `${ratio} is ${RATIO_LABEL[ratio].en}; those two are the wrong way round.`,
          },
        },
      ],
      hints: [
        {
          th: `\\${ratio} คือ ${RATIO_LABEL[ratio].th}`,
          en: `${ratio} is ${RATIO_LABEL[ratio].en}.`,
        },
        hidden
          ? {
              th: "ยังขาดด้านหนึ่ง หาด้วยพีทาโกรัสก่อน",
              en: "One side is missing - get it from Pythagoras first.",
            }
          : {
              th: "ด้านตรงข้ามมุมฉากคือด้านที่ยาวที่สุด",
              en: "The hypotenuse is the longest side.",
            },
        {
          th: `จะได้ ${answer}`,
          en: `That gives ${answer}.`,
        },
      ],
    });
  },
};

// ---------------------------------------------------------------------------
// มุมพิเศษ
// ---------------------------------------------------------------------------

/** The exact values, as KaTeX and as mathjs source. */
const SPECIAL: Record<
  number,
  Record<RatioName, { katex: string; math: string } | null>
> = {
  0: {
    sin: { katex: "0", math: "0" },
    cos: { katex: "1", math: "1" },
    tan: { katex: "0", math: "0" },
  },
  30: {
    sin: { katex: "\\frac{1}{2}", math: "1/2" },
    cos: { katex: "\\frac{\\sqrt{3}}{2}", math: "sqrt(3)/2" },
    tan: { katex: "\\frac{\\sqrt{3}}{3}", math: "sqrt(3)/3" },
  },
  45: {
    sin: { katex: "\\frac{\\sqrt{2}}{2}", math: "sqrt(2)/2" },
    cos: { katex: "\\frac{\\sqrt{2}}{2}", math: "sqrt(2)/2" },
    tan: { katex: "1", math: "1" },
  },
  60: {
    sin: { katex: "\\frac{\\sqrt{3}}{2}", math: "sqrt(3)/2" },
    cos: { katex: "\\frac{1}{2}", math: "1/2" },
    tan: { katex: "\\sqrt{3}", math: "sqrt(3)" },
  },
  90: {
    sin: { katex: "1", math: "1" },
    cos: { katex: "0", math: "0" },
    // `\tan 90^\circ` is undefined, and a question with no answer is not one.
    tan: null,
  },
};

function specialValue(angle: number, ratio: RatioName) {
  return SPECIAL[angle]![ratio];
}

export const trigSpecial: Generator = {
  id: "trig.special",
  skillId: "trig.special",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    const angles = difficulty === 1 ? [30, 45, 60] : [0, 30, 45, 60, 90];

    if (difficulty <= 2) {
      const angle = rng.pick(angles);
      let ratio = rng.pick(["sin", "cos", "tan"] as const);
      // `\tan 90^\circ` has no value; ask about its sine instead.
      if (specialValue(angle, ratio) === null) ratio = "sin";
      const value = specialValue(angle, ratio)!;

      /*
       * A coefficient in front. There are only fourteen exact special values
       * worth asking about at all - fewer than the variety floor the property
       * gate sets - and a multiple of one of them is ordinary ม.3 content, so
       * this widens the question set rather than padding it.
       */
      const k = rng.int(1, difficulty === 1 ? 4 : 6);
      const scaledMath = productOf([String(k), value.math]);
      const scaled = k === 1 ? value.katex : `${k} \\times ${value.katex}`;

      const steps: Step[] = [
        makeStep(
          `\\${ratio} ${angle}^\\circ = ${value.katex}`,
          "trig.special-angles",
          {
            th: `จากตารางค่ามุมพิเศษ \\${ratio} ${angle} องศา เท่ากับ ${value.katex}`,
            en: `From the table of special angles, ${ratio} ${angle} degrees is ${value.katex}.`,
          },
          { math: null },
        ),
      ];

      return question(trigSpecial, rng, difficulty, {
        prompt: { th: "จงหาค่าที่แน่นอนของนิพจน์นี้", en: "Find the exact value" },
        stem: `${k === 1 ? "" : k}\\${ratio} ${angle}^\\circ`,
        answer: scaledMath,
        steps,
        misconceptions: [
          {
            answer: {
              kind: "exact",
              value:
                k === 1
                  ? ratio === "sin"
                    ? specialValue(angle, "cos")!.math
                    : specialValue(angle, "sin")!.math
                  : `${k} + (${value.math})`,
            },
            explain:
              k === 1
                ? {
                    th: "sin กับ cos ของมุมเดียวกันเป็นคนละค่า ยกเว้นที่ 45 องศา",
                    en: "Sine and cosine of the same angle are different values, except at forty-five degrees.",
                  }
                : {
                    th: "ตัวเลขข้างหน้าคูณกับค่าของอัตราส่วน ไม่ได้บวกเข้าไป",
                    en: "The number in front multiplies the ratio; it is not added to it.",
                  },
          },
        ],
        hints: [
          {
            th: "ค่าเหล่านี้มาจากสามเหลี่ยมสองรูป ด้านเท่าผ่าครึ่ง กับมุมฉากหน้าจั่ว",
            en: "These come from two triangles: half an equilateral one, and a right-angled isosceles one.",
          },
          {
            th: `กำลังถาม \\${ratio} ของ ${angle} องศา`,
            en: `The question is ${ratio} of ${angle} degrees.`,
          },
          { th: `ได้ ${scaled}`, en: `Which is ${scaled}.` },
        ],
      });
    }

    if (difficulty === 3) {
      // A sum of two, chosen so the total is exact and tidy.
      const pairs: [number, RatioName, number, RatioName][] = [
        [30, "sin", 60, "cos"],
        [45, "sin", 45, "cos"],
        [60, "sin", 30, "cos"],
        [30, "cos", 60, "sin"],
        [45, "tan", 30, "sin"],
        [60, "tan", 45, "tan"],
      ];
      const [angleOne, ratioOne, angleTwo, ratioTwo] = rng.pick(pairs);
      const first = specialValue(angleOne, ratioOne)!;
      const second = specialValue(angleTwo, ratioTwo)!;
      // A coefficient on the first term, for the same reason as at 1 and 2.
      const lead = rng.int(1, 3);
      const leadKatex = lead === 1 ? "" : `${lead} \\times `;
      const shown = `${leadKatex}${first.katex} + ${second.katex}`;
      const answerMath = sumOf([productOf([String(lead), first.math]), second.math]);

      const steps: Step[] = [
        makeStep(
          shown,
          "trig.special-angles",
          {
            th: `แทนค่าจากตารางมุมพิเศษทั้งสองพจน์`,
            en: `Put in both values from the table of special angles.`,
          },
          { math: null },
        ),
      ];

      return question(trigSpecial, rng, difficulty, {
        prompt: { th: "จงหาค่าที่แน่นอนของนิพจน์นี้", en: "Find the exact value" },
        stem: `${lead === 1 ? "" : lead}\\${ratioOne} ${angleOne}^\\circ + \\${ratioTwo} ${angleTwo}^\\circ`,
        answer: answerMath,
        steps,
        misconceptions: [
          {
            answer: {
              kind: "exact",
              value: productOf([String(lead), first.math, second.math]),
            },
            explain: {
              th: "โจทย์เป็นการบวก ไม่ใช่การคูณ",
              en: "The question adds them; it does not multiply them.",
            },
          },
        ],
        hints: [
          {
            th: "แทนค่าของแต่ละพจน์จากตารางก่อน",
            en: "Put in each value from the table first.",
          },
          {
            th: `จะได้ ${shown}`,
            en: `That gives ${shown}.`,
          },
          {
            th: "แล้วรวมกัน ตอบเป็นค่าที่แน่นอน ไม่ใช่ทศนิยม",
            en: "Then add them, and leave the answer exact rather than decimal.",
          },
        ],
      });
    }

    // Difficulty 4: a product, where the two roots multiply into something tidy.
    const products: [number, RatioName, number, RatioName][] = [
      [60, "sin", 30, "cos"],
      [45, "sin", 45, "cos"],
      [30, "sin", 60, "cos"],
      [60, "tan", 30, "tan"],
      [45, "tan", 60, "sin"],
    ];
    const [angleOne, ratioOne, angleTwo, ratioTwo] = rng.pick(products);
    const first = specialValue(angleOne, ratioOne)!;
    const second = specialValue(angleTwo, ratioTwo)!;
    const multiplier = rng.int(2, 4);
    const answerMath = productOf([String(multiplier), first.math, second.math]);

    const steps: Step[] = [
      makeStep(
        `${multiplier} \\times ${first.katex} \\times ${second.katex}`,
        "trig.special-angles",
        {
          th: "แทนค่าจากตารางมุมพิเศษทั้งสองพจน์",
          en: "Put in both values from the table of special angles.",
        },
        { math: null },
      ),
    ];

    return question(trigSpecial, rng, difficulty, {
      prompt: { th: "จงหาค่าที่แน่นอนของนิพจน์นี้", en: "Find the exact value" },
      stem: `${multiplier}\\${ratioOne} ${angleOne}^\\circ \\cdot \\${ratioTwo} ${angleTwo}^\\circ`,
      answer: answerMath,
      steps,
      misconceptions: [
        {
          answer: {
            kind: "exact",
            value: productOf([
              String(multiplier),
              sumOf([first.math, second.math]),
            ]),
          },
          explain: {
            th: "โจทย์เป็นการคูณ ไม่ใช่การบวก",
            en: "The question multiplies them; it does not add them.",
          },
        },
      ],
      hints: [
        {
          th: "แทนค่าของแต่ละพจน์ก่อน แล้วค่อยคูณ",
          en: "Put in each value first, then multiply.",
        },
        {
          th: `จะได้ ${multiplier} \\times ${first.katex} \\times ${second.katex}`,
          en: `That gives ${multiplier} \\times ${first.katex} \\times ${second.katex}.`,
        },
        {
          th: "คูณรากกับรากได้จำนวนเต็มบ่อย ๆ ลองคูณดู",
          en: "A root times a root is often a whole number - try it.",
        },
      ],
    });
  },
};

// ---------------------------------------------------------------------------
// หาด้านหรือมุมที่ขาดหาย
// ---------------------------------------------------------------------------

export const trigSolve: Generator = {
  id: "trig.solve",
  skillId: "trig.solve",
  difficulties: [1, 2, 3, 4],
  provenance: "generated",

  generate(rng, difficulty): Question {
    if (difficulty <= 2) {
      /*
       * A special angle and one side. Built from the hypotenuse so the answer
       * is the hypotenuse times an exact ratio - which is exact itself.
       */
      const angle = rng.pick([30, 45, 60] as const);
      const ratio: RatioName = difficulty === 1 ? "sin" : rng.pick(["sin", "cos"] as const);
      const value = specialValue(angle, ratio)!;
      const hypotenuse = rng.int(2, 12) * 2;
      const answerMath = productOf([String(hypotenuse), value.math]);

      const steps: Step[] = [
        makeStep(
          `\\${ratio} ${angle}^\\circ = \\frac{x}{${hypotenuse}}`,
          "trig.sohcahtoa",
          {
            th: `\\${ratio} คือ ${RATIO_LABEL[ratio].th} ด้านที่ถามอยู่บนเศษ`,
            en: `${ratio} is ${RATIO_LABEL[ratio].en}, and the side asked for is on top.`,
          },
          { math: null },
        ),
        makeStep(
          `x = ${hypotenuse} \\times ${value.katex}`,
          "trig.special-angles",
          {
            th: `แทนค่า \\${ratio} ${angle} องศา แล้วคูณกลับ`,
            en: `Put in ${ratio} ${angle} degrees and multiply back.`,
          },
          { math: null },
        ),
      ];

      return question(trigSolve, rng, difficulty, {
        prompt: {
          th: `สามเหลี่ยมมุมฉากรูปหนึ่งมีด้านตรงข้ามมุมฉากยาว ${hypotenuse} หน่วย และมีมุมหนึ่งขนาด ${angle} องศา จงหาความยาวของด้าน${ratio === "sin" ? "ตรงข้าม" : "ประชิด"}มุมนั้น`,
          en: `A right-angled triangle has a hypotenuse of ${hypotenuse} units and an angle of ${angle} degrees. Find the side ${ratio === "sin" ? "opposite" : "adjacent to"} that angle.`,
        },
        stem: `\\${ratio} ${angle}^\\circ = \\frac{x}{${hypotenuse}}`,
        answer: answerMath,
        steps,
        misconceptions: [
          {
            answer: { kind: "exact", value: `${hypotenuse} / (${value.math})` },
            explain: {
              th: `ด้านที่ถามอยู่บนเศษ จึงคูณด้วย ${value.katex} ไม่ใช่หาร`,
              en: `The side asked for is on top, so it is a multiplication by ${value.katex}, not a division.`,
            },
          },
        ],
        hints: [
          {
            th: `รู้ด้านตรงข้ามมุมฉาก และถามด้าน${ratio === "sin" ? "ตรงข้าม" : "ประชิด"} ใช้ \\${ratio}`,
            en: `The hypotenuse is known and the ${ratio === "sin" ? "opposite" : "adjacent"} side is wanted, so use ${ratio}.`,
          },
          {
            th: `\\${ratio} ${angle}^\\circ = ${value.katex}`,
            en: `${ratio} ${angle} degrees is ${value.katex}.`,
          },
          {
            th: `คูณกลับ ได้ ${hypotenuse} \\times ${value.katex}`,
            en: `Multiplying back gives ${hypotenuse} \\times ${value.katex}.`,
          },
        ],
      });
    }

    if (difficulty === 3) {
      // Two sides given, the angle wanted - and it is always a special one.
      const angle = rng.pick([30, 45, 60] as const);
      const ratio: RatioName = "tan";
      const value = specialValue(angle, ratio)!;
      const adjacent = rng.int(2, 9);

      const steps: Step[] = [
        makeStep(
          `\\tan A = \\frac{x}{${adjacent}}`,
          "trig.sohcahtoa",
          {
            th: "รู้ด้านตรงข้ามกับด้านประชิด จึงใช้ \\tan",
            en: "The opposite and adjacent sides are known, so use tan.",
          },
          { math: null },
        ),
        makeStep(
          `x = ${adjacent} \\times ${value.katex}`,
          "trig.special-angles",
          {
            th: `\\tan ${angle} องศา เท่ากับ ${value.katex}`,
            en: `Tan ${angle} degrees is ${value.katex}.`,
          },
          { math: null },
        ),
      ];

      return question(trigSolve, rng, difficulty, {
        prompt: {
          th: `สามเหลี่ยมมุมฉากรูปหนึ่งมีมุมหนึ่งขนาด ${angle} องศา และด้านประชิดมุมนั้นยาว ${adjacent} หน่วย จงหาความยาวของด้านตรงข้ามมุมนั้น`,
          en: `A right-angled triangle has an angle of ${angle} degrees with an adjacent side of ${adjacent} units. Find the side opposite that angle.`,
        },
        stem: `\\tan ${angle}^\\circ = \\frac{x}{${adjacent}}`,
        answer: productOf([String(adjacent), value.math]),
        steps,
        misconceptions: [
          {
            answer: {
              kind: "exact",
              value: productOf([
                String(adjacent),
                specialValue(angle, "sin")!.math,
              ]),
            },
            explain: {
              th: "รู้ด้านประชิดและถามด้านตรงข้าม เป็นงานของ \\tan ไม่ใช่ \\sin",
              en: "Adjacent known and opposite wanted is tan's job, not sine's.",
            },
          },
        ],
        hints: [
          {
            th: "ด้านตรงข้ามมุมฉากไม่ได้ให้มา จึงใช้ \\tan",
            en: "The hypotenuse is not given, so tan is the one to use.",
          },
          {
            th: `\\tan ${angle}^\\circ = ${value.katex}`,
            en: `Tan ${angle} degrees is ${value.katex}.`,
          },
          {
            th: `คูณกลับ ได้ ${adjacent} \\times ${value.katex}`,
            en: `Multiplying back gives ${adjacent} \\times ${value.katex}.`,
          },
        ],
      });
    }

    /*
     * Difficulty 4: a word problem, which is where the topic actually lives.
     * The angle of elevation is one of the three exact ones, so the answer
     * stays exact.
     */
    const angle = rng.pick([30, 45, 60] as const);
    const value = specialValue(angle, "tan")!;
    const distance = rng.int(4, 30);
    const eye = rng.int(1, 2);

    const steps: Step[] = [
      makeStep(
        `\\tan ${angle}^\\circ = \\frac{x}{${distance}}`,
        "trig.sohcahtoa",
        {
          th: `ความสูงที่วัดจากระดับสายตาคือด้านตรงข้ามมุมเงย ระยะทางคือด้านประชิด`,
          en: `The height above eye level is opposite the angle of elevation, and the distance is adjacent to it.`,
        },
        { math: null },
      ),
      makeStep(
        `x = ${distance} \\times ${value.katex}`,
        "trig.special-angles",
        {
          th: `แทนค่า \\tan ${angle} องศา`,
          en: `Put in tan ${angle} degrees.`,
        },
        { math: null },
      ),
      makeStep(
        `${distance} \\times ${value.katex} + ${eye}`,
        "trig.sohcahtoa",
        {
          th: `แล้วบวกความสูงระดับสายตา ${eye} เมตร กลับเข้าไป`,
          en: `Then add the ${eye} metre eye height back on.`,
        },
        { math: null },
      ),
    ];

    return question(trigSolve, rng, difficulty, {
      prompt: {
        th: `คนคนหนึ่งยืนห่างจากตึกเป็นระยะ ${distance} เมตร มองยอดตึกด้วยมุมเงย ${angle} องศา ถ้าระดับสายตาสูงจากพื้น ${eye} เมตร ตึกนี้สูงกี่เมตร ตอบเป็นค่าที่แน่นอน`,
        en: `Someone standing ${distance} metres from a building sees its top at an angle of elevation of ${angle} degrees. If their eye level is ${eye} metres above the ground, how tall is the building? Give an exact value.`,
      },
      stem: `\\tan ${angle}^\\circ = \\frac{x}{${distance}}`,
      answer: sumOf([productOf([String(distance), value.math]), String(eye)]),
      steps,
      misconceptions: [
        {
          answer: {
            kind: "exact",
            value: productOf([String(distance), value.math]),
          },
          explain: {
            th: `นั่นคือความสูงจากระดับสายตาขึ้นไป ต้องบวก ${eye} เมตรที่อยู่ใต้สายตาด้วย`,
            en: `That is the height above eye level; the ${eye} metres below eye level still has to be added.`,
          },
        },
      ],
      hints: [
        {
          th: "วาดรูปก่อน มุมเงยอยู่ที่ระดับสายตา ไม่ใช่ที่พื้น",
          en: "Draw it first: the angle of elevation is at eye level, not at the ground.",
        },
        {
          th: `\\tan ${angle}^\\circ = ${value.katex} จึงได้ความสูงเหนือสายตา ${distance} \\times ${value.katex}`,
          en: `Tan ${angle} degrees is ${value.katex}, so the height above eye level is ${distance} \\times ${value.katex}.`,
        },
        {
          th: `อย่าลืมบวก ${eye} เมตรกลับเข้าไป`,
          en: `Do not forget to add the ${eye} metres back on.`,
        },
      ],
    });
  },
};

/** Every question in this chapter has the same shape; assembled once. */
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
     * `\sin` and `^\circ` are outside the subset `lib/math/katex.ts` converts,
     * and it refuses rather than guesses. See the file header and
     * `trig-ratios.test.ts`, which checks the answers against the triangle.
     */
    machineStem: null,
    answer,
    steps: built.steps,
    hints: built.hints,
    ...(named.length ? { misconceptions: named } : {}),
    rulesUsed: [...new Set(built.steps.map((step) => step.ruleId))],
  };
}
