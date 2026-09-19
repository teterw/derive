# Derive · ทีละขั้น

A bilingual (ไทย / English) maths practice site for Thai secondary-school mathematics through Calculus II — built around drilling, step-by-step rule explanations, and progress statistics you actually want to look at.

The model is Monkeytype and LeetCode, applied to maths: short daily sessions, immediate feedback, and a profile that shows you getting better.

> Invite-only. Accounts can only be created with a code issued by an admin.

---

## Why this exists

Most Thai maths resources are either video courses or PDF worksheets. Neither tells you *which rule* turned line 3 into line 4, and neither shows you whether you're improving. This does both:

- **ทีละขั้น (step by step)** — every question can be opened up into its full derivation, and each step names the rule it used and links to that rule's page.
- **Progress you can see** — activity heatmap, streaks, accuracy curves, per-skill mastery, counts by difficulty.
- **Bilingual, Thai-accurate** — Thai terminology follows what is actually used in Thai classrooms (หลักสูตร สสวท. ฉบับปรับปรุง พ.ศ. 2560), with English alongside.
- **ท่องสูตร** — where Thai teaching has a traditional spoken mnemonic, the rule page leads with it. `(น+ล)² = น² + 2นล + ล²` is taught as *หน้ากำลังสอง บวกสองหน้าหลัง บวกหลังกำลังสอง*, and a learner who was taught that chant will not recognise the rule written only with `a` and `b`.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + hand-written shadcn-style primitives |
| Database | Neon Postgres + Drizzle ORM |
| Auth | Custom session auth, invite-code gated |
| Maths rendering | KaTeX |
| Maths parsing | mathjs |
| i18n | next-intl (`th` default, `en`) |
| Graphing | Desmos embedded API |
| Tests | Vitest |
| Hosting | Vercel |

---

## Getting started

```bash
pnpm install
cp .env.example .env          # fill in DATABASE_URL, AUTH_SECRET, Desmos key
pnpm db:migrate               # apply the schema to Neon
pnpm db:seed:admin            # create the first admin from env vars
pnpm dev
```

Then log in as the admin, open `/admin`, and generate an invite code to create a normal account.

### Environment

```
DATABASE_URL=                 # Neon pooled connection string
AUTH_SECRET=                  # 32+ random bytes, base64 — keys the session HMAC
NEXT_PUBLIC_DESMOS_API_KEY=   # free key from desmos.com/api
ADMIN_BOOTSTRAP_USERNAME=
ADMIN_BOOTSTRAP_PASSWORD=
```

`.env` is read first and `.env.local` overrides it, for both the app and the scripts.

### Commands

| | |
|---|---|
| `pnpm dev` / `pnpm build` | the app |
| `pnpm test` | Vitest, including the generator property gate |
| `pnpm typecheck` / `pnpm lint` | |
| `pnpm smoke` | exercises the whole stack against the real database and cleans up after itself |
| `pnpm render-check` | fetches every page as a signed-in user and looks at what came back |
| `pnpm content:coverage` | per-skill gaps: generators, difficulties, lesson, shapes |
| `pnpm check:contrast` | reads the theme tokens out of `globals.css` and checks every pairing in both modes |
| `pnpm vars` | every letter used in every question stem, flagging anything that is not `x` or `y` |
| `pnpm db:migrate` / `pnpm db:push` | schema |
| `pnpm db:seed:admin` | the bootstrap admin |
| `pnpm db:seed:demo` | a demo account with six weeks of history, for looking at the statistics pages |

---

## Project layout

```
app/[locale]/        routes (learn, practice, exam, review, daily, stats, rules, admin, auth)
content/
  rules/             the rule registry — every formula and property, bilingual
  topics/            topic + skill definitions
  generators/        parameterised question generators (one file per skill)
  lessons/           teaching content
  shapes/            the running catalogue of question shapes worth building
lib/
  auth/              sessions, password hashing, invite codes
  db/                Drizzle schema, queries
  math/              answer checking, normalisation, KaTeX → mathjs
  practice/ exam/ review/ daily/   the four modes
  stats/             the Asia/Bangkok day rule, attempt recording, aggregates
components/          UI, including the step viewer, maths keypad and charts
docs/
  CURRICULUM.md      full Thai curriculum map + build order
  CONTENT-PIPELINE.md how questions get added
PROMPT.md            the build specification
PROGRESS.md          where the build is, and what to pick up next
```

---

## How questions work

Questions are **generated**, not stored. Each skill has one or more *generators*: small programs that build a question backwards from its answer.

A generator for quadratics picks the roots first, expands to get the equation, and therefore knows with certainty both the answer and every step of the solution. That's what makes the step-by-step trustworthy — it is derived from the construction, not written by hand or produced by a language model.

Each question is reproducible from `(generatorId, seed, difficulty)`, so a missed question can be replayed exactly, and tests are deterministic.

Every step references a real entry in the **rule registry** (`content/rules/`). The same registry powers the in-app formula sheet, so the formulas you revise and the rules used in explanations can never drift apart.

A step also carries a machine-checkable form of itself, derived from its KaTeX. Consecutive steps in a derivation must be equivalent, and the property tests check every one — which is what makes a derivation *checked* rather than merely plausible.

Word problems and reasoning questions that generators handle badly are hand-written items in the same format.

Where a mistake is *classic* rather than random — dropping the minus in `-b`, flipping the sign of a scientific-notation exponent, rationalising only the denominator — the generator also emits that wrong answer with its own explanation, so a learner who makes the expected mistake is told **which** mistake it was. Every one of those is run through the answer checker first and dropped if it turns out to be correct.

### Variables

An unknown is always **`x`**, or `y` when a second one is needed — never `a`, `b`, `m` or `k`.

Generators used to draw from a wider bag, so a practice run could ask about `x`, then `y`, then `k`, and you had to re-read each stem to work out what was being asked. `a`, `b` and `c` are reserved for *coefficients*, which is how the formula page writes them (`ax² + bx + c = 0`); letting a question call its unknown `a` quietly contradicted the formula sheet. `pnpm vars` lists every letter appearing in every stem and flags anything outside the set.

---

## Design decisions

### Indigo, not black-and-yellow

The first theme borrowed Monkeytype's gold. That works on Monkeytype because Monkeytype is only ever dark; on a white page the same hue has to drop to a dark goldenrod to stay readable, and a dark goldenrod is a muddy olive. There was no way to fix light mode without leaving the hue.

Indigo replaced it for a reason that outlives taste: **the accent sits directly beside the correct-green and wrong-red on every answered question**, and indigo is about as far from both as a usable hue gets. Gold sits between them, which is exactly why it muddied. The neutrals were cooled to match — a warm cream background under an indigo accent reads as two themes fighting.

Colours are not eyeballed. `pnpm check:contrast` parses the tokens out of `app/globals.css` and checks every pairing the interface actually puts together, in both modes, and the chart ramp is validated separately for monotone lightness and for adjacent steps clearing the colourblind **and** normal-vision separation floors. Dark mode is its own re-stepped ramp measured against the dark surface, not an automatic flip.

### You should be able to read your own answer

The answer box shows, live, what your typing **means**:

```
┌────────────────────────┐
│ 3sqrt(2)               │
└────────────────────────┘
  อ่านว่า   3√2
```

Being shown `3sqrt(2)` back tells you nothing you did not already know — you are left checking your own typing against a format you half-remember, when the thing you are actually unsure about is the maths. Every place an answer appears afterwards (feedback, exam results) renders it the same way.

The preview must never lie about how the answer will be marked, so `lib/math/to-tex.ts` is tested by parsing a corpus with *both* it and mathjs and asserting they evaluate the same at sample points. It is allowed to understand less than mathjs; it is not allowed to understand anything differently.

It exists at all because mathjs is ~500KB and would be re-entered on every keystroke; a learner on a school connection should not download a computer algebra system to be told that `m^5` is m to the fifth. KaTeX itself was already a client dependency (the results screen is a client component that renders formulas), and sits in its own 76KB-gzipped chunk loaded only by the routes that answer questions.

### Choosing what to practise is recognition, not reading

The practice setup page leads each skill with its **formula**, with the Thai name as the caption:

```
 ☑  x = (-b ± √(b²-4ac)) / 2a
    สูตรหาคำตอบของสมการกำลังสอง
```

You are usually looking for the thing you got wrong yesterday, and a formula is recognised far faster than a sentence of Thai skill name plus a sentence of summary. `All` / `None` per topic exist because everything starts ticked, which is the right default for "just give me something" and the wrong one for "only this skill" — otherwise that is thirteen boxes to untick.

### Finishing is guarded

Finishing an exam or a daily throws away every question left blank, and the daily has no second attempt that day. The old footer had a primary-styled submit button permanently live next to the navigation. Now the per-question **ตรวจคำตอบ** is the only primary button while a question is open; the finish button stays quiet until everything is answered, and clicking it early opens a panel naming how many are outstanding — with the question numbers as buttons, so recovering from a near-miss is one tap.

---

## Modes

| Mode | Thai | What it's for |
|---|---|---|
| Learn | เรียน | Concept → worked examples revealed step by step → a few guided questions |
| Practice | ฝึก | Endless drilling, instant feedback, explanation available any time |
| Exam | สอบ | Fixed set, timed, with a pre-set choice of whether explanations appear during the test |
| Review | ทบทวน | Re-drill the questions you got wrong — the same question, not a similar one |
| Daily | โจทย์ประจำวัน | Five questions seeded from the date; everyone gets the same set |

---

## Content status

v1 ships two topics, fully built, to prove the engine:

- [x] เลขยกกำลังและกรณฑ์ · Exponents and radicals (ม.2) — 6 skills, 6 generators
- [x] สมการกำลังสองตัวแปรเดียว · Quadratic equations (ม.3) — 8 skills, 11 generators

Every skill has a lesson and reaches all four difficulties. Everything else is planned in [`docs/CURRICULUM.md`](docs/CURRICULUM.md), which maps คณิตศาสตร์พื้นฐาน and คณิตศาสตร์เพิ่มเติม from ม.1 to ม.6, then Calculus I and II, in prerequisite order.

---

## Contributing content

Adding a skill means adding, in `content/`:

1. Any new rules to the rule registry (bilingual name, KaTeX statement, plain-language explanation, examples — plus `mnemonic` if Thai teaching has a traditional chant for it, and only then; inventing one puts words in a teacher's mouth).
2. A `formula` on the skill: the one line that makes it recognisable at a glance on the practice setup page.
3. A generator that emits `Question` objects with full `steps`, each referencing a real `RuleId`, using `x` and `y` for unknowns and nothing else.
4. A lesson — whose worked examples point at `(generatorId, seed, difficulty)` rather than being hand-written, so a lesson page can never show unverified working.
5. Property tests (see `PROMPT.md` §9) — a generator without passing property tests does not ship. Wrong steps teach wrong maths, which is worse than no content at all.

Run `pnpm content:coverage` to see what is missing, and tick shapes off in `content/shapes/`.

Thai is the source of truth for terminology. English is the translation, not the other way around.

### Writing LaTeX into source files

Two traps, both of which have shipped bugs here:

- A shell heredoc in this environment collapses `\\` to `\`. Write files containing LaTeX with an editor or a Node script, never a heredoc.
- In a template literal, a mis-escaped command does not leave a broken backslash behind — it eats it. `\left` written with one backslash becomes the word `left`; `\times` becomes a tab. Neither leaves anything for a "raw command in prose" check to find, which is why `components/math/math-text.test.ts` also looks for command names that have *lost* their backslash.

---

## Verification

Nothing here is checked by looking at it and deciding it seems fine:

| Claim | How it is checked |
|---|---|
| Derivations are correct | the §9 property gate — 100 seeds × 4 difficulties × every generator, asserting adjacent steps are equivalent, every rule id exists, the answer satisfies the stem, and each named misconception really is wrong |
| The answer preview matches the marker | a corpus parsed by both `to-tex` and mathjs, evaluated at sample points |
| Prose and maths are separated correctly | the segmenter run over the *whole* content corpus: no character lost, every fragment renders, no raw command left in prose, no command that lost its backslash |
| Colours are legible in both modes | `pnpm check:contrast` |
| Unknowns are `x` and `y` | `pnpm vars` |
| The stack works end to end | `pnpm smoke`, against the real database, cleaning up after itself |
| The pages actually render | `pnpm render-check`, signed in — including that a page showing maths also ships KaTeX's stylesheet, which a green build once hid for a long time |
