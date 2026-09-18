# Content pipeline · การเพิ่มเนื้อหา

How new questions get into Derive, and how the weekly content session works.

Companion to `PROMPT.md`. Read §6 (content engine) and §9 (testing) there first.

---

## 1. Three kinds of question, three levels of trust

Every question in the system carries a `provenance` field. It determines what verification it must pass before it ships.

| provenance | What it is | Step correctness | Volume |
|---|---|---|---|
| `generated` | Built by a parameterised generator, backwards from its answer | **Guaranteed by construction** | Unlimited |
| `adapted` | A generator written to reproduce the *shape* of a real exam question | **Guaranteed by construction** | Unlimited |
| `authored` | A hand-written single item (word problems, proofs, oddities) | Verified by test, not by construction | One per unit of work |

There is deliberately no `imported` class. See §3.

**`adapted` is the default for anything inspired by a real exam.** It is the whole point of this pipeline.

---

## 2. Adapting a past-paper question

The workflow, using a real question as raw material:

1. **Read the question and name the skill.** Which `skillId` does it actually test? If it tests three, it's really three questions stacked — note that.
2. **Name the shape.** Write one sentence describing the question's structure, not its numbers. Example: *"Rectangle with perimeter and area given; solve for the sides; a quadratic with integer roots; one root rejected on physical grounds."*
3. **List the rules it exercises**, as `RuleId`s. If any rule isn't in the registry yet, add it first.
4. **Identify the difficulty levers.** What would make this harder? Non-integer roots? A distractor root that *is* valid? Units that need converting first?
5. **Write a generator for the shape**, building backwards from the answer as usual.
6. **Record the source in the generator's metadata** — exam, year, question number — as a comment and in a `sourceNote` field. This is for your own traceability when you want to check coverage against a real paper. It is not displayed to users.
7. **Property tests**, per `PROMPT.md` §9. No exceptions.

What you keep from the original: the structure, the skill, the difficulty, the style of distractor.
What you do not keep: the wording, the numbers, the diagrams.

### Shape catalogue
Maintain `content/shapes/<topicId>.md` — a running list of question shapes observed in real papers, with which generator covers each and which are still unbuilt. This is the genuinely valuable thing extracted from past papers, and it's what makes the practice transfer to the actual exam.

```md
## quadratic-equations

- [x] Solve by factoring, integer roots, a=1 → `quad.solve-factor-simple`
- [x] Solve by factoring, a>1 → `quad.solve-factor-leading`
- [x] Word problem: area/perimeter rectangle, reject negative root → `quad.word-rectangle`
- [ ] Word problem: consecutive integers whose product is given
- [ ] Given one root, find the coefficient k
- [ ] Discriminant condition: for what k does this have exactly one solution
```

Tick items off as generators land. An empty checkbox is next week's work, already scoped.

---

## 3. Why there is no `imported` class

Two reasons, both load-bearing.

**Legal.** Questions from A-Level, O-NET, สอวน., และแบบเรียน/แบบฝึกหัด สสวท. are copyrighted works. That an exam body publishes a paper for students to study from does not grant a licence to reproduce it inside a product served to other users, even a private invite-only one. Adapted questions raise none of this: structure and mathematical facts are not protected, specific wording is. If you ever do want to host real papers verbatim, check the terms for that specific source first and treat it as a separate decision from this pipeline.

**Technical, and the one that actually matters day to day.** The product's core claim is that the step-by-step is correct. That claim rests entirely on generators deriving steps from how they built the problem. An imported question has no construction to derive from, so its solution must be written by a human or a language model — and a language model doing multi-step algebra is wrong often enough that some fraction of your explanations would quietly teach the wrong rule. You would not notice. The learner would not notice. It would surface in an exam.

If an item genuinely can't be generated (a proof, an unusual word problem), it ships as `authored` and must pass §4 before it counts.

---

## 4. Verification gate for `authored` items

A hand-written item without these is not content, it's a liability. All must pass in CI:

1. The stated answer **satisfies the original problem**, verified computationally — substitute back with mathjs; for equations check every root; for inequalities sample the boundary and interior.
2. Every step's expression is **equivalent to the previous step's**, checked symbolically wherever the expression is machine-parseable. Where it genuinely isn't (geometric reasoning, proofs), mark `machineVerifiable: false` and require a second human read before merge.
3. Every `ruleId` in every step **exists in the rule registry**.
4. `th` and `en` are both non-empty for prompt, every step explanation, and every hint.
5. `checkAnswer` accepts the canonical answer and rejects a perturbed one.

Treat a failing item as a bug, not a content gap. Delete it rather than ship it unverified.

---

## 5. The weekly content session

The repo is the memory. An AI session next month knows nothing about this month's session except what's committed, so the coverage files below are not optional bookkeeping — they're the only continuity there is.

### Before the session
- `content/shapes/*.md` is up to date with anything new you've seen (school exam, tutoring, past paper).
- `pnpm content:coverage` has been run — a script that prints, per skill: generator count, shapes covered vs listed, whether a lesson exists, whether the rules it references all exist.

### The session prompt

```
Read PROMPT.md, docs/CONTENT-PIPELINE.md, and content/shapes/<topic>.md.
Run `pnpm content:coverage` and show me the gaps for <topicId>.

Then pick the <N> highest-value unbuilt shapes and, for each:
  1. Add any missing rules to the rule registry.
  2. Write a generator that builds backwards from the answer.
  3. Write its property tests.
  4. Tick the shape off in content/shapes/<topic>.md.

Run the full test suite. Show me a diff summary before committing.
Do not write any question whose steps you cannot derive from construction.
```

### After the session
- Tests green.
- You personally work through **three** of the new questions on paper, at each difficulty, and check the app's steps against your own. Not a formality — this is where you catch a generator that's correct but explains badly, which tests cannot detect.
- Commit. One commit per skill.

### Realistic cadence
One session per week, two to four generators, is sustainable alongside studying. That's roughly one skill fully covered per week, so a topic every four to six weeks. The full map in `CURRICULUM.md` is therefore a multi-year project at that pace — which is fine, because the app is useful from the moment two topics work, and the topics you build are the topics you end up understanding best.

---

## 6. Making it feel alive without new content

The "new problems dropped" feeling doesn't require new problems. Cheaper mechanics that work from day one:

**โจทย์ประจำวัน / Daily challenge.** Five questions, seeded from the date: `seed = hash('YYYY-MM-DD')`. Every user gets the same set that day, so times and accuracy are comparable, and it resets at midnight Asia/Bangkok. This is LeetCode's daily problem, built entirely from generators you already have. Store the result as a `run` with `mode: 'daily'` so it shows on the heatmap and feeds a separate daily-completion streak.

**Skill unlocks.** Gate later skills behind mastery of their prerequisites (per `CURRICULUM.md` build order). "New content" then arrives because *you* progressed, which is the framing the whole app is built on anyway.

**Weekly focus.** Auto-select the user's weakest skill each Monday and surface it as "โฟกัสสัปดาห์นี้". Uses existing generators, feels like programming.

**Difficulty 4 as a reward.** Keep `ท้าทาย` locked per skill until EMA accuracy at difficulty 3 passes a threshold. Hard questions feel like new content when they arrive.

All four are cheap, need zero ongoing content authoring, and none of them can teach you a wrong rule.
