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
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
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
pnpm db:push                  # apply schema to Neon
pnpm db:seed:admin            # create the first admin from env vars
pnpm dev
```

Then log in as the admin, open `/admin`, and generate an invite code to create a normal account.

### Environment

```
DATABASE_URL=                 # Neon pooled connection string
AUTH_SECRET=                  # 32+ random bytes, base64
NEXT_PUBLIC_DESMOS_API_KEY=   # free key from desmos.com/api
ADMIN_BOOTSTRAP_USERNAME=
ADMIN_BOOTSTRAP_PASSWORD=
```

---

## Project layout

```
app/[locale]/        routes (learn, practice, exam, stats, admin, auth)
content/
  rules/             the rule registry — every formula and property, bilingual
  topics/            topic + skill definitions
  generators/        parameterised question generators (one file per skill)
  lessons/           teaching content
lib/
  auth/              sessions, password hashing, invite codes
  db/                Drizzle schema, queries
  math/              answer checking, normalisation, seeded RNG
  stats/             aggregation queries
components/          UI, including the step viewer and math keypad
docs/
  CURRICULUM.md      full Thai curriculum map + build order
PROMPT.md            the build specification
```

---

## How questions work

Questions are **generated**, not stored. Each skill has one or more *generators*: small programs that build a question backwards from its answer.

A generator for quadratics picks the roots first, expands to get the equation, and therefore knows with certainty both the answer and every step of the solution. That's what makes the step-by-step trustworthy — it is derived from the construction, not written by hand or produced by a language model.

Each question is reproducible from `(generatorId, seed, difficulty)`, so a missed question can be replayed exactly, and tests are deterministic.

Every step references a real entry in the **rule registry** (`content/rules/`). The same registry powers the in-app formula sheet, so the formulas you revise and the rules used in explanations can never drift apart.

Word problems and reasoning questions that generators handle badly are hand-written items in the same format.

---

## Modes

| Mode | Thai | What it's for |
|---|---|---|
| Learn | เรียน | Concept → worked examples revealed step by step → a few guided questions |
| Practice | ฝึก | Endless drilling, instant feedback, explanation available any time |
| Exam | สอบ | Fixed set, timed, with a pre-set choice of whether explanations appear during the test |
| Review | ทบทวน | Re-drill the questions you got wrong |

---

## Content status

v1 ships two topics, fully built, to prove the engine:

- [x] เลขยกกำลังและกรณฑ์ · Exponents and radicals (ม.2)
- [x] สมการกำลังสองตัวแปรเดียว · Quadratic equations (ม.3)

Everything else is planned in [`docs/CURRICULUM.md`](docs/CURRICULUM.md), which maps คณิตศาสตร์พื้นฐาน and คณิตศาสตร์เพิ่มเติม from ม.1 to ม.6, then Calculus I and II, in prerequisite order.

---

## Contributing content

Adding a skill means adding, in `content/`:

1. Any new rules to the rule registry (bilingual name, KaTeX statement, plain-language explanation, examples).
2. A generator that emits `Question` objects with full `steps`, each referencing a real `RuleId`.
3. A lesson.
4. Property tests (see `PROMPT.md` §9) — a generator without passing property tests does not ship. Wrong steps teach wrong maths, which is worse than no content at all.

Thai is the source of truth for terminology. English is the translation, not the other way around.
