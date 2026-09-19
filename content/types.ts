/**
 * The content engine's vocabulary (PROMPT.md §5 and §6.1).
 *
 * Everything here is pure data or pure functions. Nothing in `content/` may
 * import from `lib/db` - content lives in git and has to stay testable without
 * a database.
 */

/** A bilingual string. Thai is the source of truth; English is the translation. */
export type L = { th: string; en: string };

export type RuleId = string;
export type TopicId = string;
export type SkillId = string;
export type GeneratorId = string;

export type Difficulty = 1 | 2 | 3 | 4;

export const DIFFICULTIES: readonly Difficulty[] = [1, 2, 3, 4] as const;

export const DIFFICULTY_LABELS: Record<Difficulty, L> = {
  1: { th: "ง่าย", en: "Easy" },
  2: { th: "ปานกลาง", en: "Medium" },
  3: { th: "ยาก", en: "Hard" },
  4: { th: "ท้าทาย", en: "Challenge" },
};

export type Rule = {
  id: RuleId;
  topicIds: TopicId[];
  /** e.g. สมบัติการคูณของเลขยกกำลัง */
  name: L;
  /** KaTeX, e.g. `a^m \\cdot a^n = a^{m+n}` */
  statement: string;
  /** KaTeX-bearing condition, e.g. `a \\neq 0` */
  conditions?: L;
  /** One sentence, no jargon. */
  plain: L;
  /**
   * How a Thai tutor actually tells you to remember it.
   *
   * Thai maths teaching leans hard on spoken mnemonics, and they are not
   * translations of the formula - they are a different, chantable encoding of
   * it. `(น+ล)^2 = น^2 + 2นล + ล^2` is taught as "หน้ากำลังสอง บวกสองหน้าหลัง
   * บวกหลังกำลังสอง", where หน้า/หลัง mean the front and back terms and น/ล
   * are their initials. A learner who has been taught that chant will not
   * recognise the same rule written only with `a` and `b`.
   *
   * The English side is the gloss, not an English mnemonic: there usually is
   * not one, and inventing a fake one would be worse than explaining the Thai.
   *
   * Optional - most rules do not have a traditional chant, and making one up
   * would put words in a teacher's mouth.
   */
  mnemonic?: L;
  examples: { from: string; to: string; note?: L }[];
  seeAlso?: RuleId[];
};

export type Step = {
  /** KaTeX: the state AFTER this step. */
  expr: string;
  /**
   * Only for lines that contain a word rather than only symbols - "x = 2
   * หรือ x = 3". Everything else is notation, which is the same in both
   * languages, and leaves this undefined.
   */
  exprEn?: string;
  /**
   * The same state in mathjs syntax, when it is machine-checkable.
   * Generators fill this in so the property tests can verify the derivation
   * rather than trust it. Omitted only for prose steps ("reject the negative
   * root, a length cannot be negative").
   */
  math?: string;
  /**
   * Steps sharing a chain must be mathematically equivalent to one another;
   * the property tests check every adjacent pair. A step that changes what is
   * being talked about (an equation becoming a list of roots) starts a new
   * chain, or carries no `math` at all.
   */
  chain?: string;
  /** Which rule got us here. Must exist in the registry. */
  ruleId: RuleId;
  /** One sentence: what changed and why. */
  explain: L;
  /** Sub-expressions that changed, as KaTeX fragments, for highlighting. */
  highlight?: string[];
};

export type Answer =
  | { kind: "exact"; value: string }
  | { kind: "numeric"; value: number; tol: number }
  /** Order-free, e.g. the roots {2, -5}. */
  | { kind: "set"; values: string[] }
  | { kind: "choice"; correct: string };

/**
 * How much the step-by-step can be trusted (docs/CONTENT-PIPELINE.md §1).
 * `generated` and `adapted` derive their steps from how the question was
 * built; `authored` items are hand-written and must pass the §4 gate.
 */
export type Provenance = "generated" | "adapted" | "authored";

/**
 * A wrong answer that a particular mistake produces, and what the mistake was.
 *
 * "Wrong" on its own teaches nothing. A learner who multiplies exponents
 * instead of adding them has applied a real rule in the wrong place, and
 * saying which rule they reached for is the whole point of this app.
 *
 * It carries a whole `Answer`, checked the same way the real one is - so it
 * recognises the mistake however the learner happens to write it, and a set of
 * roots is matched as a set.
 */
export type Misconception = {
  answer: Answer;
  explain: L;
};

export type Question = {
  /** `${generatorId}:${seed}:${difficulty}` */
  id: string;
  generatorId: GeneratorId;
  skillId: SkillId;
  topicId: TopicId;
  difficulty: Difficulty;
  provenance: Provenance;
  /** "จงหาคำตอบของสมการ" / "Solve the equation" */
  prompt: L;
  /** KaTeX of the problem itself. */
  stem: string;
  /**
   * The problem restated for a machine: an expression, or the zero form of an
   * equation. Usually derived from `stem`; a word problem supplies the model
   * it sets up. `null` means "not machine-verifiable" and, per
   * docs/CONTENT-PIPELINE.md §4, requires a second human read before merge.
   */
  machineStem?: string | null;
  answer: Answer;
  choices?: { id: string; label: string }[];
  /** The full derivation. */
  steps: Step[];
  /** Progressive: a nudge, then the rule's name, then the first step. */
  hints: L[];
  /** Named wrong answers, each with the mistake that produces it. */
  misconceptions?: Misconception[];
  rulesUsed: RuleId[];
};

/** What the client is allowed to see before it submits (PROMPT.md §6.4). */
export type PublicQuestion = Omit<
  Question,
  "answer" | "steps" | "hints" | "misconceptions" | "machineStem"
> & {
  hintCount: number;
};

export interface RNG {
  /** The seed this stream was created from; generators put it in the question id. */
  readonly seed: number;
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform integer in [min, max], inclusive. */
  int(min: number, max: number): number;
  /** Uniform integer in [min, max] excluding 0. */
  nonZeroInt(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  /** +1 or -1. */
  sign(): number;
  bool(p?: number): boolean;
  shuffle<T>(items: readonly T[]): T[];
}

export interface Generator {
  id: GeneratorId;
  skillId: SkillId;
  difficulties: Difficulty[];
  provenance: Provenance;
  /** Exam, year, question number - for coverage tracking, never shown to users. */
  sourceNote?: string;
  generate(rng: RNG, difficulty: Difficulty): Question;
}

/**
 * Form predicates for skills where the *shape* of the answer is the point
 * (PROMPT.md §6.4). `null` means any equivalent form is accepted.
 */
export type FormRequirement =
  | "simplified-radical"
  | "rationalized-denominator"
  | "scientific-notation"
  | "factored"
  | "positive-exponents";

export type Skill = {
  id: SkillId;
  topicId: TopicId;
  name: L;
  /** One line describing what the learner can do once they have this. */
  summary: L;
  /**
   * The one formula that makes the skill recognisable at a glance, as KaTeX.
   *
   * A list of fourteen Thai skill names is fourteen things to read; the same
   * list with `a^m \cdot a^n = a^{m+n}` beside each one is something a learner
   * can scan. This is the picture on the tin, not a complete statement of the
   * skill - the rule page is where the full statement lives.
   */
  formula: string;
  /** When set, an equivalent answer in the wrong form is rejected. */
  strictForm: FormRequirement | null;
  /** Skills that should come first. */
  prerequisites: SkillId[];
  ruleIds: RuleId[];
};

export type Topic = {
  id: TopicId;
  name: L;
  /** e.g. ม.2 พื้นฐาน */
  grade: L;
  summary: L;
  skillIds: SkillId[];
};
