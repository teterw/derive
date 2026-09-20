import type { MathNode } from "mathjs";
import type { Rule } from "../types";
import {
  asCall,
  asOperator,
  binary,
  call,
  rewriteFirst,
  unparen,
} from "./misapply";

/**
 * ฟังก์ชันตรีโกณมิติ · ม.5.
 *
 * ม.3 treated sine as a ratio of two sides, which only exists for an angle
 * inside a right-angled triangle - so only between 0 and 90 degrees. Here it
 * becomes a *function*, defined for every real number by a point going round
 * the unit circle, and that is the whole difference: the sine of 150 degrees
 * means nothing in a triangle and is perfectly ordinary on a circle.
 *
 * Angles are in radians from here on, which is not a notational preference.
 * The derivative of `\sin x` is `\cos x` only in radians, so a chapter that
 * stayed in degrees would have to be unlearned before calculus.
 */
const TOPIC = ["trig.functions"];

export const trigFunctionRules: Rule[] = [
  {
    id: "trig.radian-measure",
    topicIds: TOPIC,
    name: {
      th: "การวัดมุมเป็นเรเดียน",
      en: "Radian measure",
    },
    statement: "\\pi \\ \\mathrm{rad} = 180^\\circ",
    plain: {
      th: "หนึ่งเรเดียนคือมุมที่รองรับส่วนโค้งยาวเท่ากับรัศมี การวัดแบบนี้ไม่ขึ้นกับหน่วยใด จึงเป็นการวัดมุมที่ใช้ในคณิตศาสตร์ชั้นสูง",
      en: "One radian is the angle that cuts off an arc as long as the radius. It is a pure number rather than a made-up unit, which is why higher mathematics uses it.",
    },
    mnemonic: {
      th: "ครึ่งรอบคือ พาย เรเดียน หนึ่งรอบคือ สองพาย",
      en: "Half a turn is pi radians; a whole turn is two pi.",
    },
    examples: [
      { from: "180^\\circ", to: "\\pi" },
      { from: "30^\\circ", to: "\\frac{\\pi}{6}" },
      {
        from: "\\frac{3\\pi}{4}",
        to: "135^\\circ",
        note: {
          th: "คูณด้วย 180 หารด้วย พาย เมื่อจะเปลี่ยนกลับเป็นองศา",
          en: "Multiply by 180 and divide by pi to go back to degrees.",
        },
      },
    ],
    seeAlso: ["trig.unit-circle", "trig.sohcahtoa"],
  },
  {
    id: "trig.unit-circle",
    topicIds: TOPIC,
    name: {
      th: "ฟังก์ชันตรีโกณมิติบนวงกลมหนึ่งหน่วย",
      en: "The unit circle definition",
    },
    statement: "x^2 + y^2 = 1, \\ (x,\\ y) = (\\cos \\theta, \\sin \\theta)",
    plain: {
      th: "ลากรัศมีทำมุม \\theta กับแกน x จุดปลายรัศมีมีพิกัด x เป็น \\cos \\theta และพิกัด y เป็น \\sin \\theta นิยามนี้ใช้ได้กับมุมทุกขนาด ไม่ว่าจะเกิน 90 องศา หรือติดลบ",
      en: "Draw a radius at angle theta from the x-axis. The point where it lands has x-coordinate cos theta and y-coordinate sin theta. This works for any angle at all, past ninety degrees or negative.",
    },
    mnemonic: {
      th: "คอสคือแกนนอน ซินคือแกนตั้ง",
      en: "Cosine is the across one, sine is the up one.",
    },
    examples: [
      { from: "\\theta = 0", to: "(1, 0)" },
      { from: "\\theta = \\frac{\\pi}{2}", to: "(0, 1)" },
      {
        from: "\\theta = \\pi",
        to: "(-1, 0)",
        note: {
          th: "ที่มุม พาย จุดอยู่ทางซ้ายสุด คอสจึงเป็นลบหนึ่ง และซินเป็นศูนย์",
          en: "At pi the point is as far left as it goes, so cosine is minus one and sine is zero.",
        },
      },
    ],
    seeAlso: ["trig.quadrant-signs", "trig.reference-angle"],
  },
  {
    id: "trig.quadrant-signs",
    topicIds: TOPIC,
    name: {
      th: "เครื่องหมายในแต่ละจตุภาค",
      en: "Signs in each quadrant",
    },
    /*
     * Roman numerals and a plus sign, because the quadrants are numbered the
     * same way in both languages and "all positive" is exactly what `+` says.
     * The three named functions are the ones that stay positive in their own
     * quadrant; `plain` and the mnemonic carry the rest.
     */
    statement:
      "\\mathrm{I}: + \\quad \\mathrm{II}: \\sin \\quad \\mathrm{III}: \\tan \\quad \\mathrm{IV}: \\cos",
    plain: {
      th: "เครื่องหมายมาจากพิกัดของจุด จตุภาคที่สอง x เป็นลบ คอสจึงเป็นลบ แต่ y ยังบวก ซินจึงยังบวก",
      en: "The signs come from the coordinates of the point. In the second quadrant x is negative, so cosine is; y is still positive, so sine is.",
    },
    mnemonic: {
      th: "บวกหมด ซิน แทน คอส ไล่ทวนเข็มนาฬิกาจากจตุภาคแรก",
      en: "All, Sine, Tangent, Cosine - anticlockwise from the first quadrant.",
    },
    examples: [
      { from: "\\sin \\frac{5\\pi}{6}", to: "\\frac{1}{2}" },
      {
        from: "\\cos \\frac{5\\pi}{6}",
        to: "-\\frac{\\sqrt{3}}{2}",
        note: {
          th: "มุมนี้อยู่จตุภาคที่สอง ขนาดเท่ากับของ 30 องศา แต่คอสติดลบ",
          en: "That angle is in the second quadrant: the same size as at thirty degrees, but cosine comes out negative.",
        },
      },
    ],
    seeAlso: ["trig.unit-circle", "trig.reference-angle"],
    /**
     * The sign dropped. Every value comes out as though the angle were in the
     * first quadrant - which is what happens when the reference angle is found
     * correctly and the quadrant is then forgotten.
     */
    misapplications: [
      {
        id: "trig.quadrant-signs/dropped-the-sign",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            /*
             * A unary minus has one argument, so `asOperator` - which insists
             * on two - never matches it.
             */
            if (node.type !== "OperatorNode") return null;
            const operator = node as unknown as {
              fn?: string;
              args: MathNode[];
            };
            if (operator.fn !== "unaryMinus") return null;
            return unparen(operator.args[0]!);
          }),
        explain: {
          th: "ขนาดถูกแล้ว แต่เครื่องหมายหายไป ให้ดูว่ามุมอยู่จตุภาคใดก่อนตอบ",
          en: "The size is right and the sign has gone. Decide which quadrant the angle is in before writing the value down.",
        },
        example: { from: "-1/2", right: "-1/2", wrong: "1/2" },
      },
    ],
  },
  {
    id: "trig.reference-angle",
    topicIds: TOPIC,
    name: {
      th: "มุมอ้างอิง",
      en: "The reference angle",
    },
    statement: "\\sin(\\pi - \\theta) = \\sin \\theta",
    conditions: {
      th: "และในทำนองเดียวกัน \\cos(\\pi - \\theta) = -\\cos \\theta",
      en: "and likewise $\\cos(\\pi - \\theta) = -\\cos\\theta$",
    },
    plain: {
      th: "มุมอ้างอิงคือมุมแหลมระหว่างรัศมีกับแกน x ค่าของฟังก์ชันตรีโกณมิติของมุมใดๆ มีขนาดเท่ากับของมุมอ้างอิงเสมอ เหลือแค่ใส่เครื่องหมายให้ถูก",
      en: "The reference angle is the acute angle between the radius and the x-axis. Any angle has the same size of value as its reference angle; all that is left is to get the sign right.",
    },
    mnemonic: {
      th: "หาขนาดจากมุมอ้างอิง หาเครื่องหมายจากจตุภาค",
      en: "Size from the reference angle, sign from the quadrant.",
    },
    examples: [
      { from: "\\frac{2\\pi}{3}", to: "\\frac{\\pi}{3}" },
      {
        from: "\\frac{7\\pi}{6}",
        to: "\\frac{\\pi}{6}",
        note: {
          th: "เกินครึ่งรอบมา หนึ่งส่วนหกพาย มุมอ้างอิงจึงเป็น หนึ่งส่วนหกพาย",
          en: "It is a sixth of pi past half a turn, so the reference angle is a sixth of pi.",
        },
      },
    ],
    seeAlso: ["trig.quadrant-signs", "trig.unit-circle"],
  },
  {
    id: "trig.pythagorean-identity",
    topicIds: TOPIC,
    name: {
      th: "เอกลักษณ์พีทาโกรัส",
      en: "The Pythagorean identity",
    },
    statement: "\\sin^2 \\theta + \\cos^2 \\theta = 1",
    plain: {
      th: "จุดบนวงกลมหนึ่งหน่วยอยู่ห่างจากจุดกำเนิดเป็นระยะหนึ่งเสมอ เอกลักษณ์นี้จึงคือทฤษฎีบทพีทาโกรัสของสามเหลี่ยมที่มีด้านตรงข้ามมุมฉากยาวหนึ่ง",
      en: "A point on the unit circle is always one away from the origin, so this identity is Pythagoras' theorem for a triangle whose hypotenuse is one.",
    },
    mnemonic: {
      th: "ซินกำลังสอง บวก คอสกำลังสอง เท่ากับหนึ่ง เสมอ ทุกมุม",
      en: "Sine squared plus cosine squared is one, at every angle without exception.",
    },
    examples: [
      { from: "1 - \\sin^2 \\theta", to: "\\cos^2 \\theta" },
      {
        from: "\\sin \\theta = \\frac{3}{5}",
        to: "\\cos \\theta = \\pm\\frac{4}{5}",
        note: {
          th: "ได้สองคำตอบ ต้องดูจตุภาคของมุมจึงจะเลือกได้ว่าเป็นค่าใด",
          en: "Two answers come out, and only the quadrant says which one it is.",
        },
      },
    ],
    seeAlso: ["trig.quotient-identity", "trig.pythagoras"],
    /**
     * `\sin^2 + \cos^2` read as `(\sin + \cos)^2`. The identity is remembered
     * and the squares are applied to the wrong thing.
     */
    misapplications: [
      {
        id: "trig.pythagorean-identity/squared-the-sum",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const power = asOperator(node, "^");
            if (!power) return null;
            const inner = asOperator(unparen(power.args[0]!), "+");
            if (!inner) return null;
            return binary(
              "+",
              binary("^", inner.args[0]!, power.args[1]!),
              binary("^", inner.args[1]!, power.args[1]!),
            );
          }),
        explain: {
          th: "กำลังสองอยู่ที่แต่ละพจน์ ไม่ใช่ที่ผลบวก กระจายกำลังสองเข้าไปในวงเล็บไม่ได้",
          en: "The squares are on each term, not on the sum. A square cannot be shared out over a bracket.",
        },
        example: {
          from: "(sin(x) + cos(x))^2",
          right: "1 + 2 * sin(x) * cos(x)",
          wrong: "sin(x)^2 + cos(x)^2",
        },
      },
    ],
  },
  {
    id: "trig.quotient-identity",
    topicIds: TOPIC,
    name: {
      th: "เอกลักษณ์ผลหารและส่วนกลับ",
      en: "The quotient and reciprocal identities",
    },
    statement:
      "\\tan \\theta = \\frac{\\sin \\theta}{\\cos \\theta}, \\quad \\sec \\theta = \\frac{1}{\\cos \\theta}",
    conditions: {
      th: "เมื่อตัวส่วนไม่เป็นศูนย์",
      en: "wherever the denominator is not zero",
    },
    plain: {
      th: "ฟังก์ชันอีกสี่ตัวไม่ได้เป็นของใหม่ ทุกตัวเขียนด้วยซินกับคอสได้หมด เมื่อติดขัดให้เปลี่ยนทุกอย่างเป็นซินกับคอสก่อน",
      en: "The other four functions are not new: every one of them is sine and cosine in disguise. When an expression will not move, turn it all into sine and cosine first.",
    },
    mnemonic: {
      th: "ติดขัดเมื่อไร เปลี่ยนเป็นซินกับคอส",
      en: "Stuck? Write it in sine and cosine.",
    },
    examples: [
      { from: "\\frac{\\sin \\theta}{\\cos \\theta}", to: "\\tan \\theta" },
      { from: "1 + \\tan^2 \\theta", to: "\\sec^2 \\theta" },
    ],
    seeAlso: ["trig.pythagorean-identity"],
  },
  {
    id: "trig.compound-angle",
    topicIds: TOPIC,
    name: {
      th: "สูตรผลบวกของมุม",
      en: "The compound angle formulae",
    },
    statement: "\\sin(A + B) = \\sin A\\cos B + \\cos A\\sin B",
    conditions: {
      th: "และ \\cos(A + B) = \\cos A\\cos B - \\sin A\\sin B",
      en: "and $\\cos(A + B) = \\cos A\\cos B - \\sin A\\sin B$",
    },
    plain: {
      th: "ซินของผลบวกไม่ใช่ผลบวกของซิน นี่คือจุดที่ผิดกันมากที่สุดในบท และสูตรนี้คือสิ่งที่ใช้แทน",
      en: "The sine of a sum is not the sum of the sines. That is the commonest mistake in the chapter, and this formula is what goes in its place.",
    },
    mnemonic: {
      th: "ซินคอส คอสซิน สำหรับซิน ส่วนคอสคือ คอสคอส ลบ ซินซิน",
      en: "Sine: sine-cos plus cos-sine. Cosine: cos-cos minus sine-sine - and mind that minus.",
    },
    examples: [
      {
        from: "\\sin\\left(\\frac{\\pi}{4} + \\frac{\\pi}{6}\\right)",
        to: "\\frac{\\sqrt{6} + \\sqrt{2}}{4}",
        note: {
          th: "นี่คือวิธีหาค่าที่แน่นอนของมุม 75 องศา ซึ่งไม่ได้อยู่ในตารางมุมพิเศษ",
          en: "This is how an exact value for seventy-five degrees is found, an angle no table lists.",
        },
      },
      { from: "\\cos(\\pi - \\theta)", to: "-\\cos \\theta" },
    ],
    seeAlso: ["trig.double-angle", "trig.pythagorean-identity"],
    /**
     * The formula not used at all: the function distributed over the sum, the
     * thing the formula exists to prevent.
     */
    misapplications: [
      {
        id: "trig.compound-angle/distributed-the-function",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const applied = asCall(node, ["sin", "cos", "tan"]);
            if (!applied) return null;
            const inner = applied.args[0];
            if (!inner) return null;
            const sum = asOperator(unparen(inner), "+");
            if (!sum) return null;
            return binary(
              "+",
              call(applied.name, sum.args[0]!),
              call(applied.name, sum.args[1]!),
            );
          }),
        explain: {
          th: "ฟังก์ชันตรีโกณมิติกระจายเข้าไปในวงเล็บไม่ได้ \\sin(A+B) ไม่เท่ากับ \\sin A + \\sin B",
          en: "A trigonometric function does not share out over a bracket: $\\sin(A + B)$ is not $\\sin A + \\sin B$.",
        },
        example: {
          from: "sin(x + y)",
          right: "sin(x) * cos(y) + cos(x) * sin(y)",
          wrong: "sin(x) + sin(y)",
        },
      },
    ],
  },
  {
    id: "trig.double-angle",
    topicIds: TOPIC,
    name: {
      th: "สูตรมุมสองเท่า",
      en: "The double angle formulae",
    },
    statement: "\\sin 2\\theta = 2\\sin \\theta\\cos \\theta",
    conditions: {
      th: "และ \\cos 2\\theta = \\cos^2 \\theta - \\sin^2 \\theta = 1 - 2\\sin^2 \\theta",
      en: "and cos 2theta = cos^2 theta - sin^2 theta = 1 - 2 sin^2 theta",
    },
    plain: {
      th: "ได้จากสูตรผลบวกโดยให้ A กับ B เป็นมุมเดียวกัน ไม่ต้องจำแยก",
      en: "These are the compound angle formulae with A and B the same angle. They are not a separate thing to memorise.",
    },
    mnemonic: {
      th: "ซินสองเท่า คือ สองซินคอส",
      en: "Sine of double is two sine cos.",
    },
    examples: [
      { from: "2\\sin \\theta\\cos \\theta", to: "\\sin 2\\theta" },
      { from: "1 - 2\\sin^2 \\theta", to: "\\cos 2\\theta" },
    ],
    seeAlso: ["trig.compound-angle"],
  },
  {
    id: "trig.general-solution",
    topicIds: TOPIC,
    name: {
      th: "คำตอบของสมการตรีโกณมิติ",
      en: "Solving a trigonometric equation",
    },
    statement: "\\sin \\theta = k \\Rightarrow \\theta, \\ \\pi - \\theta",
    conditions: {
      th: "บนช่วง [0, 2\\pi)",
      en: "on the interval [0, 2pi)",
    },
    plain: {
      th: "วงกลมมีสองจุดที่ให้ค่าซินเท่ากัน สมการตรีโกณมิติจึงมีคำตอบสองคำตอบในหนึ่งรอบเสมอ ยกเว้นที่จุดสูงสุดและต่ำสุด",
      en: "Two points on the circle give the same sine, so a trigonometric equation has two solutions per turn - except at the very top and bottom.",
    },
    mnemonic: {
      th: "หามุมอ้างอิงก่อน แล้วถามว่าจตุภาคใดให้เครื่องหมายนี้",
      en: "Find the reference angle, then ask which quadrants carry that sign.",
    },
    examples: [
      {
        from: "\\sin \\theta = \\frac{1}{2}",
        to: "\\theta = \\frac{\\pi}{6}, \\frac{5\\pi}{6}",
        note: {
          th: "ซินเป็นบวกในจตุภาคที่หนึ่งและสอง จึงได้สองคำตอบนี้",
          en: "Sine is positive in the first and second quadrants, which is where those two come from.",
        },
      },
      {
        from: "\\cos \\theta = -\\frac{1}{2}",
        to: "\\theta = \\frac{2\\pi}{3}, \\frac{4\\pi}{3}",
      },
    ],
    seeAlso: ["trig.quadrant-signs", "trig.reference-angle"],
  },
  {
    id: "trig.law-of-sines",
    topicIds: TOPIC,
    name: {
      th: "กฎของไซน์",
      en: "The law of sines",
    },
    statement: "\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C}",
    plain: {
      th: "ในสามเหลี่ยมใดก็ได้ ไม่จำเป็นต้องมีมุมฉาก ด้านแต่ละด้านกับซินของมุมตรงข้ามมีอัตราส่วนเท่ากันเสมอ",
      en: "In any triangle at all, right-angled or not, each side and the sine of the angle opposite it are in the same ratio.",
    },
    mnemonic: {
      th: "ด้านคู่กับมุมตรงข้ามเสมอ",
      en: "Pair each side with the angle facing it.",
    },
    examples: [
      {
        from: "a = 10, \\ A = \\frac{\\pi}{6}, \\ B = \\frac{\\pi}{2}",
        to: "b = 20",
        note: {
          th: "ใช้เมื่อรู้ด้านกับมุมตรงข้ามเป็นคู่ครบหนึ่งคู่",
          en: "Use it when one side and the angle opposite it are both known.",
        },
      },
    ],
    seeAlso: ["trig.law-of-cosines", "trig.sohcahtoa"],
  },
  {
    id: "trig.law-of-cosines",
    topicIds: TOPIC,
    name: {
      th: "กฎของโคไซน์",
      en: "The law of cosines",
    },
    statement: "c^2 = a^2 + b^2 - 2ab\\cos C",
    plain: {
      th: "คือพีทาโกรัสที่แก้ให้ใช้กับสามเหลี่ยมที่ไม่มีมุมฉากได้ ถ้ามุม C เป็นมุมฉาก คอสของมันเป็นศูนย์ พจน์สุดท้ายหายไป เหลือพีทาโกรัสพอดี",
      en: "Pythagoras' theorem, mended so it works without a right angle. If C is a right angle its cosine is zero, the last term vanishes, and Pythagoras is what is left.",
    },
    mnemonic: {
      th: "พีทาโกรัส ลบ สองเอบีคอสซี",
      en: "Pythagoras, minus two-a-b-cos-C.",
    },
    examples: [
      {
        from: "a = 3, \\ b = 5, \\ C = \\frac{\\pi}{3}",
        to: "c^2 = 19",
        note: {
          th: "มุมที่ใช้ต้องเป็นมุมที่อยู่ระหว่างด้านสองด้านที่รู้เท่านั้น",
          en: "The angle has to be the one between the two known sides, not any other.",
        },
      },
    ],
    seeAlso: ["trig.law-of-sines", "trig.pythagoras"],
    /**
     * The sign of the last term. `+ 2ab\cos C` instead of `- 2ab\cos C` is the
     * slip, and it is invisible in the answer unless the triangle is drawn.
     */
    misapplications: [
      {
        id: "trig.law-of-cosines/added-the-last-term",
        apply: (math) =>
          rewriteFirst(math, (node) => {
            const difference = asOperator(node, "-");
            if (!difference) return null;
            return binary("+", difference.args[0]!, difference.args[1]!);
          }),
        explain: {
          th: "พจน์สุดท้ายเป็นลบ ถ้าบวกจะได้ด้านที่ยาวกว่าที่ควรเป็นเสมอ",
          en: "The last term is subtracted. Adding it always gives a side longer than the triangle allows.",
        },
        example: {
          from: "9 + 25 - 2*3*5*(1/2)",
          right: "19",
          wrong: "49",
        },
      },
    ],
  },
];
