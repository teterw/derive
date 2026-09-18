# Build progress

Running log of what is built, what is verified, and what the next session
should pick up. Update it at the end of every working session.

Phases are defined in `PROMPT.md` §2.

Last updated: 2026-09-19.

---

## Status at a glance

| Phase | What | State |
|---|---|---|
| 0 | Skeleton, database, auth, invite gating | **done**, schema applied to Neon, admin seeded |
| 1 | Content engine + Learn + Practice | **code complete**, acceptance walkthrough not yet run |
| 2 | Exam mode + Review | not started |
| 3 | Statistics | not started |
| 4 | Study tools | rule browser landed early (Phase 1 needed it); Desmos, calculator, shortcuts panel not started |
| 5 | Content expansion | not started |

`pnpm typecheck`, `pnpm lint`, `pnpm test` (236 tests) and `pnpm build` all
pass as of this commit.

---

## Where to pick up

**The Phase 1 acceptance walkthrough, in the browser.** Everything it needs is
in place: the database is migrated, the admin exists, and the dev server runs.
What has *not* been done is sitting down and actually using it.

`PROMPT.md` §2 Phase 1 acceptance:

> I can drill 20 questions in Thai, get instant right/wrong, open any question
> and see correct steps naming the actual rules, switch to English, and all 20
> attempts exist in the `attempts` table.

Steps to run it:

1. `pnpm dev` (one may already be running on port 3000).
2. There is an **unused invite code in the database**: `3XE6NMRH23EG`
   (single use, note "acceptance walkthrough"). Either use it at
   `http://localhost:3000/th/register?code=3XE6NMRH23EG`, or log in as the
   seeded admin and issue a fresh one at `/th/admin`.
3. Register a second account with it, then go to `/th/practice`, pick some
   skills, and drill 20 questions.
4. Check the steps, the hints, the "อธิบาย / Explain" button, and the language
   toggle mid-question.
5. Confirm in the database:
   `select count(*) from attempts;` should be 20, and `daily_stats` and
   `skill_mastery` should have moved with them.
6. Confirm the invite code cannot be redeemed a second time (it has
   `max_uses = 1`), and that a logged-out visit to any page lands on login.

Already confirmed by hand: a logged-out request to `/` and to `/th/practice`
both 307 to `/th/login`, with `?next=` preserved.

### Then, the parts of Phase 1 still thin

- **Nothing reads the attempts back yet.** They are written correctly, but the
  dashboard still shows an empty shell. That is Phase 3's job, and it is the
  next thing worth building because it is the reason the app exists.
- The practice runner has no "drill this skill again" loop after a wrong
  answer; wrong answers currently just move on. Review mode is Phase 2.
- No exam mode, no runs rows yet (`attempts.run_id` is always null in
  practice).

---

## Phase 0 — done

Branch `phase-0`, merged forward into `phase-1`.

- Next.js 16.3.5 (App Router, Turbopack), TypeScript strict, Tailwind v4,
  hand-written shadcn-style primitives in `components/ui/`.
- next-intl with `th` (default) and `en`, routes under `/[locale]/`, message
  catalogues in `messages/`, key sets checked to match.
- Drizzle schema for all nine tables in `PROMPT.md` §3, plus `auth_failures`
  for the rate limits. Migration `drizzle/0000_bizarre_professor_monster.sql`
  **applied to the live Neon database**; `pnpm db:seed:admin` has run and the
  admin account exists.
- Auth: argon2id passwords, SHA-256 session tokens with sliding refresh,
  remember-me, invite-code-gated registration redeemed inside a transaction,
  rate limits on failed logins (per username and per IP) and on invite
  redemption (per IP).
- `proxy.ts` (Next 16's renamed middleware) as an optimistic cookie gate; real
  authorisation is `requireUser()` / `requireAdmin()` per page and per action.
- `/[locale]/admin`: issue invite codes (note, max uses, expiry), copy one,
  disable one, list codes with status, list users.

## Phase 1 — code complete

Branch `phase-1`.

### Content engine

- `content/types.ts`, a seeded mulberry32 RNG, and `content/step.ts`, which
  derives each step's machine-checkable form from its KaTeX so there is one
  string to get right rather than two that can disagree.
- **Rule registry** (`content/rules/`): all 21 rules `PROMPT.md` §7 asks for,
  plus `exp.power-of-quotient`, `exp.scientific-form`,
  `quad.square-root-property`, `model.equation`, `model.reject-root` and four
  shared algebra rules. Bilingual, KaTeX-verified.
- **`lib/math/`**: KaTeX → mathjs conversion, numeric equivalence by sampling,
  and `checkAnswer` with per-skill form requirements (simplified radical,
  rationalised denominator, scientific notation, factored, positive
  exponents).
- **17 generators** covering all 14 skills at all four difficulties, each
  built backwards from its answer.
- **Lessons** for all 14 skills. Worked examples point at
  `(generatorId, seed, difficulty)` rather than being hand-written, so nothing
  on a lesson page has escaped the property gate.
- `content/shapes/*.md` and `pnpm content:coverage`, per
  `docs/CONTENT-PIPELINE.md` §5.

### The §9 property gate

Every generator runs 100 seeds × every difficulty, asserting: it does not
throw; adjacent steps in a chain are equivalent; every `ruleId` exists; both
languages are non-empty; every KaTeX fragment renders; the stated answer
satisfies the stem; and `checkAnswer` accepts the answer and rejects a
perturbation. Plus determinism and variety checks.

### UI

- `components/math/`: server-rendered KaTeX, a prose/maths segmenter, the step
  viewer (one step at a time, rule name as a chip linking to the rule page),
  and an answer input with a maths keypad.
- Practice: a GET-form setup page and a keyboard-driven runner (Enter to
  submit, E to explain, H for a hint) that never receives the answer key.
- Learn: topic index and a lesson page per skill.
- Rules: searchable browser and a page per rule.
- Attempts are recorded on submit, with `daily_stats`, `skill_mastery` (EMA)
  and streaks rolled forward in the same call.

---

## Decisions taken (and why)

- **Neon WebSocket driver, not HTTP.** `neon-http` throws on
  `db.transaction()`, and §4 requires the invite redemption and the user
  insert to be one transaction.
- **`username` is lower-cased `text`, not `citext`.** `drizzle-kit push` cannot
  `CREATE EXTENSION`. `normalizeUsername()` is the single writer.
- **Rate limiting lives in a table** (`auth_failures`): serverless invocations
  do not share memory.
- **`practice_mode` enum includes `daily`**, for the daily challenge in
  `docs/CONTENT-PIPELINE.md` §6.
- **`typedRoutes` is off.** It fights next-intl's navigation helpers over
  query-string hrefs.
- **Steps carry `math` and `chain`.** An equation's machine form is its zero
  form, so consecutive equations in a derivation must match - which is what
  makes the step-by-step checkable rather than merely plausible.
- **Maths inside prose is detected at render time**, not marked up at
  authoring time. `components/math/math-text.tsx` classifies each token, and
  its test runs over the whole corpus (every rule, lesson and generated
  explanation) asserting that no character is lost, every fragment renders,
  and no raw KaTeX command is left sitting in prose. An author can still write
  `$...$` to be explicit, and that always wins.
- **The rule browser landed in Phase 1**, not Phase 4, because every step chip
  links to it.

## Open questions for the owner

From `PROMPT.md` §12, still unanswered and not yet needed: spaced-repetition
algorithm, profile visibility, leaderboard, XP formula. (There *is* an XP
number being written to `daily_stats` already - `xpFor()` in
`lib/stats/constants.ts` - but nothing displays it, so the formula is still
free to change.)

## Housekeeping

- `.env` and `.env.local` are both read by the scripts
  (`--env-file-if-exists`), with `.env.local` winning.
- The only rows in the database are the seeded `admin` user and one unused
  invite code.
