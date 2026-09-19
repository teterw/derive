import { Tex } from "./katex";

/**
 * Prose with maths in it.
 *
 * Explanations, hints and lesson text are written as ordinary sentences with
 * notation dropped in - "ครึ่งหนึ่งของ 6 คือ 3", "so \sqrt{16} = 4". Rather
 * than making every content author remember delimiters, this works out which
 * runs are notation and renders those through KaTeX.
 *
 * An author who wants to be explicit can write `$...$`, which always wins.
 */

const THAI = /[฀-๿]/;
const BARE_OPERATOR = /^[-+*/=<>]$/;
const TRAILING_PUNCTUATION = /[.,:;!?)]+$/;

type Strength = "strong" | "weak" | "prose";

/**
 * `strong` is unambiguously notation. `weak` is a single Latin letter, which
 * is a variable beside notation ("so x = 2") but an English word on its own
 * ("a perfect square").
 */
export function classify(token: string): Strength {
  const core = token.replace(TRAILING_PUNCTUATION, "");
  if (!core) return "prose";
  if (THAI.test(core)) return "prose";
  if (/\\[a-zA-Z]+/.test(core)) return "strong";

  // A plain word is a word; a single letter beside notation is a variable.
  if (/^[A-Za-z]+$/.test(core)) return core.length === 1 ? "weak" : "prose";
  // Hyphenated English ("step-by-step", "A-Level") is still a word.
  if (/^[A-Za-z]+(-[A-Za-z]+)+$/.test(core)) return "prose";

  /**
   * Anything else carrying a maths character is notation - including `ax^2`
   * and `4ac`, which a "two letters means a word" rule would wrongly leave
   * sitting in the prose as raw source.
   */
  if (/[0-9^_{}\\+\-*/=<>()[\]|]/.test(core)) return "strong";
  return "prose";
}

export type Segment =
  { kind: "text"; value: string } | { kind: "math"; value: string };

/** Splits a sentence into prose and maths. Exported for its tests. */
export function segment(text: string): Segment[] {
  const segments: Segment[] = [];
  let buffer = "";

  const pushText = (value: string) => {
    if (!value) return;
    buffer += value;
  };
  const flushText = () => {
    if (buffer) segments.push({ kind: "text", value: buffer });
    buffer = "";
  };

  // Explicit $...$ wins: split on it first and only guess inside the gaps.
  const explicit = text.split(/(\$[^$]+\$)/g);
  if (explicit.length > 1) {
    for (const part of explicit) {
      if (/^\$[^$]+\$$/.test(part)) {
        flushText();
        segments.push({ kind: "math", value: part.slice(1, -1) });
      } else {
        for (const inner of segment(part)) {
          if (inner.kind === "text") pushText(inner.value);
          else {
            flushText();
            segments.push(inner);
          }
        }
      }
    }
    flushText();
    return segments;
  }

  const tokens = text.split(" ");
  let run: string[] = [];

  const flushRun = () => {
    if (run.length === 0) return;
    const hasStrong = run.some((token) => classify(token) === "strong");
    const onlyOperator = run.length === 1 && BARE_OPERATOR.test(run[0]!);
    if (!hasStrong || onlyOperator) {
      pushText(run.join(" "));
      run = [];
      return;
    }

    // Sentence punctuation belongs to the sentence, not to the formula.
    const joined = run.join(" ");
    const trailing = TRAILING_PUNCTUATION.exec(joined);
    const body = trailing ? joined.slice(0, trailing.index) : joined;
    const tail = trailing ? trailing[0] : "";

    flushText();
    segments.push({ kind: "math", value: body });
    if (tail) buffer = tail;
    run = [];
  };

  tokens.forEach((token, index) => {
    const strength = classify(token);
    if (strength === "prose") {
      flushRun();
      pushText(index === 0 ? token : ` ${token}`);
      return;
    }
    if (run.length === 0 && index > 0) pushText(" ");
    run.push(token);
  });
  flushRun();
  flushText();

  return segments;
}

export function MathText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {segment(text).map((part, index) =>
        part.kind === "math" ? (
          <Tex key={index} tex={part.value} />
        ) : (
          <span key={index}>{part.value}</span>
        ),
      )}
    </span>
  );
}
