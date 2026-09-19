# Build progress

Running log of what is built, what is verified, and what the next session
should pick up. Update it at the end of every working session.

Phases are defined in `PROMPT.md` §2.

Last updated: 2026-09-19.

---

## Status at a glance

| Phase | What | State |
|---|---|---|
| 0 | Skeleton, database, auth, invite gating | **done**, live against Neon |
| 1 | Content engine + Learn + Practice | **done** |
| 2 | Exam mode + Review | **done** |
| 3 | Statistics | **done** |
| 4 | Study tools | **done** |
| 5 | Content expansion | not started — deliberately, it is the weekly job |

Beyond the phase plan: the **daily challenge** from
`docs/CONTENT-PIPELINE.md` §6 is built.

Green as of this commit: `pnpm typecheck`, `pnpm lint`, `pnpm test`
(331 tests in 29 files), `pnpm build`, `pnpm smoke` (41 checks against the real
database), `pnpm render-check` (15 pages, signed in), `pnpm check:contrast`,
`pnpm vars`.

`pnpm render-check` needs a server already listening on port 3000 — it does not
start one. Without it every page "fails" with `fetch failed`, which looks far
more alarming than it is.

---

## What exists

### Content engine

- `content/types.ts`, a seeded mulberry32 RNG, and a step builder that derives
  each step's machine-checkable form from its KaTeX, so there is one string to
  get right rather than two that can disagree.
- **Rule registry**: all 21 rules `PROMPT.md` §7 asks for, plus the handful the
  generators needed (`exp.power-of-quotient`, `exp.scientific-form`,
  `quad.square-root-property`, `model.equation`, `model.reject-root`, four
  shared algebra rules). Bilingual, KaTeX-verified.
- **`lib/math/`**: KaTeX → mathjs conversion, numeric equivalence by sampling,
  and `checkAnswer` with per-skill form requirements. It distinguishes *wrong*
  from *right value, wrong form* from *one root of two*.
- **17 generators** covering all 14 skills at all four difficulties, each built
  backwards from its answer. Two are `adapted` word-problem shapes.
- **Named wrong answers** (`content/misconception.ts`) on the six generators
  whose classic slips are worth naming: the sign of `-b` in the quadratic
  formula, the exponent sign in scientific notation, rationalising only the
  denominator, and three more in the exponent laws and factoring. Each carries
  its own bilingual explanation, so a learner who makes the expected mistake is
  told *which* mistake it was rather than just "wrong". `namedMistakes()` runs
  every candidate through `checkAnswer` first and drops any that turns out to be
  correct — a "wrong" answer that is actually right would be a disaster.
- **Lessons** for all 14 skills, whose worked examples are
  `(generatorId, seed, difficulty)` triples rather than hand-written prose.
- `content/shapes/*.md` and `pnpm content:coverage`.

### The §9 property gate

Every generator runs 100 seeds × every difficulty, asserting: it does not
throw; adjacent steps in a chain are equivalent; every `ruleId` exists; both
languages are non-empty; every KaTeX fragment renders; the stated answer
satisfies the stem; `checkAnswer` accepts the answer and rejects a
perturbation; and every named misconception is genuinely wrong. Plus
determinism and variety.

### The app

- Learn, Practice, Exam, Review, Daily, Statistics, a searchable rule browser,
  and the admin page.
- A tool dock beside every question: Desmos graph, formula sheet, calculator,
  keyboard shortcuts. `G` `F` `C` `?` `Esc`, and `Enter` `E` `H` in the runner.
- Statistics: activity heatmap, streaks, difficulty rings, rolling 7-day
  accuracy, weekly median speed, per-skill mastery, weakest skills, totals,
  personal bests. All SQL; nothing is summed in the browser.
- Bilingual throughout, with the th/en key sets checked to match (286 keys).

---

## Verified, and how

| Claim | How it is checked |
|---|---|
| Generators never emit a wrong derivation | `pnpm test` — the §9 gate, 100 seeds × 4 difficulties × 17 generators |
| Prose and maths are separated correctly | a test that runs the segmenter over the *whole* corpus and asserts no character is lost, every fragment renders, and no raw KaTeX command is left in prose |
| Registration, invites, attempts, stats, review, exam, daily | `pnpm smoke` — against the real database, then deletes the user |
| No LaTeX command has silently lost its backslash | a corpus check that strips correctly-escaped commands and then looks for bare command names, plus a check for the stray tab `\t` leaves behind |
| The interactive pieces behave | jsdom component tests (`// @vitest-environment jsdom`) over the answer box, the step reveal, the hint ladder and the theme toggle |
| Every page actually renders | `pnpm render-check` — fetches each page as a signed-in user, and asserts that a page shipping KaTeX markup also ships the KaTeX stylesheet |
| The chart palette is colourblind-safe | the data-viz validator, against both surfaces — not eyeballed |

What is **not** covered: the *feel*. The first real session with the app
produced six findings that no test could have caught, all now fixed — see
"Round two" below. Expect more of the same from the second session; that is
what this kind of testing is for, and it is worth more per hour than anything
else on this list.

**Compiling is not rendering.** `pnpm build` was green for a long stretch during
which every formula in the app rendered as unstyled fallback text, because
`katex/dist/katex.min.css` was never imported. Nothing that type-checks or
tests can see that. `pnpm render-check` now asserts it explicitly, but the
general lesson stands: after touching routing, translations, styling or
anything a server component reads, look at a page.

---

## Round two — what the first real session changed

Six things, all reported from actually using the app rather than from reading
the code. Each is worth recording because each was invisible to the tests.

1. **The theme.** Black-and-yellow was Monkeytype's, and Monkeytype is only
   ever dark; the gold had to become a dark goldenrod to survive a white page,
   and a dark goldenrod is a muddy olive. Now indigo — chosen because the
   accent sits beside correct-green and wrong-red on every answered question,
   and indigo is the furthest a usable hue gets from both. Gold sits *between*
   them, which is why it muddied. `pnpm check:contrast` now parses the tokens
   out of `globals.css` and checks every pairing in both modes, so this cannot
   quietly rot.
2. **Unknowns were `x`, then `y`, then `k`.** Two generators drew a letter
   from `["x","y","a","m","k"]`. The variety was decoration and it cost
   attention: you had to re-read each stem to see what was being asked. One
   shared `VARIABLES` set now, and `pnpm vars` lists every letter in every
   stem and flags anything outside it.
3. **The answer box showed you your own keystrokes.** `m^5` was displayed
   back as `m^5`, which tells a learner nothing about the thing they are
   unsure of. There is now a live rendered preview under the input, and every
   later display of an answer goes through the same renderer.
4. **The practice setup page was a wall of prose.** Each skill now leads with
   its formula and demotes the name to a caption, because choosing what to
   drill is recognition, not reading. Plus `All` / `None` per topic.
5. **The formula page did not speak Thai.** Thai teaching leans on spoken
   mnemonics that are a *different encoding* of the rule, not a translation of
   it — `หน้ากำลังสอง บวกสองหน้าหลัง บวกหลังกำลังสอง`. Thirteen rules now carry
   one. (The exponent laws turned out to already match Thai convention exactly,
   `a^m \cdot a^n`, conditions and all, so they were left alone.)
6. **Daily could be thrown away by one stray click.** A primary-styled submit
   button sat permanently beside the navigation, and the daily has no second
   attempt that day. Finishing is now guarded by a panel naming what is
   outstanding, with the question numbers as buttons.

## Round three

1. **The answer box is a real maths field.** MathLive, so pressing `÷` gives
   `□/□` with the caret in the numerator and the arrow keys walking between
   boxes - the scientific-calculator model, which is what was asked for. It is
   lazy (218KB gzipped, own chunk) and *optional*: until it loads, and forever
   if it never does, the plain text box with its rendered preview is what you
   get. `onReady(false)` is a normal outcome.
   - Answers now arrive as LaTeX. `normalizeInput` strips `\placeholder{}`
     first, because a half-built fraction has to read as *incomplete* rather
     than as a parse error.
   - **A real bug fell out of this:** `normalizeInput` decided "is this LaTeX?"
     by looking for a backslash, and the field writes a simple power as
     `x^{2}` - braces, no command. That went to mathjs raw, which cannot read
     `{2}`, so a correct answer was marked wrong. Now a braced exponent counts
     as LaTeX too.
   - **And a second:** the field is created asynchronously, so a question
     answered while MathLive was still downloading produced an editable field,
     because the `disabled` effect had already run. Creation now reads the
     current props from a ref rather than the render that started the load.
2. **An admin can reset their own daily.** `/admin` has a dashed "development
   tools" card with one button. It is admin-only, only ever touches the
   caller's own run, and rebuilds `daily_stats` for the day from the attempts
   that survive rather than clearing it - the learner may also have practised
   this morning, and that is not the daily's to delete. Nine smoke checks.

## Where to pick up

1. **Use it.** Register a real account (`/admin` issues codes), drill twenty
   questions, take an exam, and see what irritates. `pnpm db:seed:demo` gives a
   populated account to look at the statistics with, and
   `pnpm db:seed:demo -- --clean` removes it.
2. **The weekly content session** (`docs/CONTENT-PIPELINE.md` §5). Run
   `pnpm content:coverage`, pick the highest-value unbuilt shapes from
   `content/shapes/*.md`, and add two to four generators. That is the job from
   here on, and the app is useful while it happens.
3. Open questions from `PROMPT.md` §12, now worth answering:
   - spaced repetition for review — the queue is currently "most recent attempt
     was wrong", which is a leech queue, not SM-2
   - whether profiles are visible to other invited users
   - the XP formula: `xpFor()` already writes a number to `daily_stats` that
     nothing displays, so it is still free to change

### Needs the owner, not the next session

- **Nothing has been pushed.** The work is committed locally on its phase
  branches; `github.com/teterw/derive` has not received any of it. Pushing is
  the owner's call.
- **Not deployed.** Vercel needs `DATABASE_URL` and `AUTH_SECRET` set as
  environment variables, and the Neon database is already migrated and seeded,
  so a deploy should be uneventful — but it has not been attempted.

### Smaller things noticed but not done

- "first divergent step highlighted" (`PROMPT.md` §10) is only partly there:
  wrong answers show your answer beside the right one, a partially-correct root
  set is called out, and an expected mistake is now named — but the working is
  still not diffed against what you typed, and only six generators have named
  mistakes. Extending them is cheap and worth doing as the content sessions go.
- Skill unlocks and the weekly focus (`docs/CONTENT-PIPELINE.md` §6) are not
  built; the dashboard surfaces weakest skills instead.
- Exam mode has no per-question timing display, only the overall clock.
- `attempts.run_id` is null for practice; only exams and dailies group.

---

## Decisions taken (and why)

- **Neon WebSocket driver, not HTTP.** `neon-http` throws on
  `db.transaction()`, and §4 requires the invite redemption and the user insert
  to be one transaction.
- **`username` is lower-cased `text`, not `citext`.** `drizzle-kit push` cannot
  `CREATE EXTENSION`. `normalizeUsername()` is the single writer.
- **Rate limiting lives in a table** (`auth_failures`): serverless invocations
  do not share memory.
- **Session tokens are an HMAC keyed with `AUTH_SECRET`**, not a bare hash, so
  a database dump alone cannot recognise a stolen cookie.
- **`typedRoutes` is off.** It fights next-intl's navigation helpers over
  query-string hrefs.
- **Steps carry `math` and `chain`.** An equation's machine form is its zero
  form, so consecutive equations in a derivation must match.
- **Maths inside prose is detected at render time**, not marked up at authoring
  time — with `$...$` as an escape hatch for the few genuinely ambiguous cases
  (`bx` is indistinguishable from the English words beside it).
- **The proxy matcher excludes only real file extensions**, anchored to the end
  of the path: rule and skill ids contain dots, and the usual "any dot" matcher
  skipped exactly those pages.
- **The exam, daily and review modes share one runner and one set of actions.**
  The run row says which mode an attempt is recorded under.
- **A named wrong answer is verified wrong, not assumed wrong.** Misconceptions
  are generated from the same coefficients as the real answer, so a change to a
  generator could quietly make one of them correct. `namedMistakes()` filters
  through `checkAnswer`, and the property gate re-checks every seed.
- **A second maths parser ships to the browser, deliberately.** The answer
  preview needs to parse on every keystroke and mathjs is ~500KB.
  `lib/math/to-tex.ts` is the small one; its test parses a corpus with *both*
  it and mathjs and asserts they agree at sample points, because a preview
  that disagrees with the marker is worse than no preview.
- **`data-answer` on every rendered answer.** Once KaTeX has rendered, there
  is no single node whose text is "2, 3" any more, so tests and the render
  check assert against that attribute rather than picking through KaTeX's
  internals. Note also that `textContent` includes KaTeX's MathML annotation,
  which carries the raw TeX on purpose — assert on `.katex-html` when what you
  mean is "what a sighted learner sees".
- **Files containing LaTeX are never written through a shell heredoc.** The
  heredoc in this environment collapses `\\` to `\`, and a mis-escaped command
  in a template literal eats its backslash entirely rather than leaving a
  broken one. Both have shipped bugs here; see CLAUDE.md.

## Housekeeping

- The database holds the seeded `admin`, and whatever the demo seeder was last
  asked to create.
- Two dev servers are easy to end up with: `next dev` guards against a second
  one, `next start` does not. If a page looks stale, check what is actually
  listening on the port.
