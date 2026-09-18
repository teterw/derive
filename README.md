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

1. Any new rules to the rule registry (bilingual name, KaTeX statement, plain-language explanation, examples).
2. A generator that emits `Question` objects with full `steps`, each referencing a real `RuleId`.
3. A lesson — whose worked examples point at `(generatorId, seed, difficulty)` rather than being hand-written, so a lesson page can never show unverified working.
4. Property tests (see `PROMPT.md` §9) — a generator without passing property tests does not ship. Wrong steps teach wrong maths, which is worse than no content at all.

Run `pnpm content:coverage` to see what is missing, and tick shapes off in `content/shapes/`.

Thai is the source of truth for terminology. English is the translation, not the other way around.
