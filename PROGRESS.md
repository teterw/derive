# Build progress

Running log of what is built, what is verified, and what the next session
should pick up. Update it at the end of every working session.

Phases are defined in `PROMPT.md` §2.

Last updated: 2026-09-20 (Calculus I finished, a sweep over the app, then a
pass on navigating twenty chapters; see Rounds eleven to fourteen).

---

## Status at a glance

| Phase | What | State |
|---|---|---|
| 0 | Skeleton, database, auth, invite gating | **done**, live against Neon |
| 1 | Content engine + Learn + Practice | **done** |
| 2 | Exam mode + Review | **done** |
| 3 | Statistics | **done** |
| 4 | Study tools | **done** |
| 5 | Content expansion | **under way** — steps 1-6 of the `docs/CURRICULUM.md` build order are done bar `seq.adv` and `c2.*`, which means the algebra spine, functions, trigonometry, sequences, ม.6 calculus and **the whole of Calculus I**; 20 topics, 78 skills |

Beyond the phase plan: the **daily challenge** from
`docs/CONTENT-PIPELINE.md` §6 is built.

Green as of this commit: `pnpm typecheck`, `pnpm lint`, `pnpm test`
(1387 tests in 64 files), `pnpm build`, `pnpm smoke` (against the real
database), `pnpm render-check` (38 pages, signed in), `pnpm content:coverage`,
`pnpm check:contrast`, `pnpm vars`.

**Phase 6 is under way**; the plan is `docs/NEXT.md`. P0 is done bar the two
items that need the owner — `AUTH_SECRET` in the host, and a home for the
backups. P1 spaced repetition is built. Next is the divergence diff, then the
weekly content session (`docs/CONTENT-PIPELINE.md` §5).

**Deploying: put the app in the same region as the database.** `pnpm perf`
measures every page; what is left after the round-trip work is latency from
wherever the app runs to `ap-southeast-1`, and no code change touches it.

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

What is **not** covered: the *feel*, and anything only visible on screen.
Three rounds of using the app have now produced eleven findings that no test
caught, including **a headline feature that had never once worked** (round
four, below). Every round has paid for itself several times over.

**Open the app before and after any visible change.** Not `pnpm build`, not
the test suite - a browser. The failure mode is never a crash; it is a feature
quietly serving its fallback, or a formula rendering as unstyled text, and
both look exactly like success from the terminal.

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

## Phase 6 so far

Working from `docs/NEXT.md`. Done: the demo seed now refuses to run against a
database that does not look like development (its password is in this repo);
the `/admin` development card is hidden in production; rate limiting turned out
to already exist and cover all three cases, and now has tests; practice
attempts group into sessions by a 25-minute gap, which was the un-backfillable
one; profiles, XP, levels and a leaderboard; the nav shows which page you are
on; and spaced repetition.

Two findings worth carrying forward:

- **The property gate was not covering everything.** Each test file iterated a
  hand-written list of imports, so a generator registered but left off a list
  would ship with its derivations never verified, and every other test would
  still pass. It is driven by the registry now. Proven rather than assumed: a
  deliberately broken generator was registered without touching any test file
  and the suite failed.
- **Pages were slow in proportion to sequential round trips**, nothing else.
  The profile page resolved the same username three times. `pnpm perf` measures
  it; it also now reports bytes actually sent rather than bytes after
  decompression, which had been overstating the transfer six-fold.

## Round four — the first browser pass

The first session where the app was actually opened and looked at, rather than
verified through tests. Two bugs and a pile of UI debt, none of which any test
could have caught.

1. **The maths field had never worked.** `menuItems` was set before the element
   was attached; MathLive throws "Mathfield not mounted" for a detached
   element; that throw landed in the same `catch` as a failed download. So
   every learner silently got the plain-text fallback and the feature looked
   like it had never shipped. **The jsdom stub was the reason the tests missed
   it** — it accepted the assignment happily. A stub more permissive than the
   real thing tests nothing; it now throws exactly where MathLive throws.
2. **Two focus rings on the answer box.** The field carried its own 2px radius
   inside the wrapper's 8px one, and the global `:focus-visible` rule drew an
   outline *inside* the box. The wrapper owns the shape and the focus state
   now.
3. **The sentences came out.** Dashboard action tiles each explained what
   "ฝึกโจทย์" means; practice setup tiles carried a summary plus "มีระดับ 1, 2,
   3, 4" on all fourteen. Tiles now carry *state* (a review count, a tick) and
   formulas. Keyboard shortcuts are keycaps rather than a run-on sentence.
4. **Phone layout.** Three stat cards stacked into three full-width rows; the
   sticky start button sat under the tab bar, invisible; Thai month names
   wrapped onto two lines in the heatmap (each label slot is one 11px column);
   the tool dock landed on the keypad however it was laid out, so on a phone it
   is now one button that opens the rest.

**Responsive work needs a rig.** `resize_window` does not change the viewport
when the browser is maximised. Rendering the app inside iframes at 390 / 768 /
1200 side by side does work - media queries respect the frame width - and
finding three layout bugs in one screenshot is worth the setup.

## Round five — the instruction line, the tool rail, and ม.2 factoring

### The instruction line was a correctness bug

The prompt - จงแยกตัวประกอบ, จงหาผลลัพธ์, จงแก้สมการ - was `text-sm text-muted`
above a `text-4xl` formula. The same expression is asked about in several
different ways, and two prompts can differ by one word
(จงจัดรูปให้อยู่ในรูปเลขยกกำลังอย่างง่าย against จงจัดรูปให้อยู่ในรูปอย่างง่าย):
the only thing telling those questions apart was the quietest thing on the
page, and skimming it means confidently answering a question nobody asked.

It is a band at the top of the question card now - accent rule down the left
edge, a tint, reading size and weight - so the eye enters at the instruction
and reaches the maths second. `question-display.test.tsx` asserts the *visual
weight*, which is unusual for a test and is the point: a test that only checked
the text was present would have passed throughout the bug.

### Tools sit beside the question on a laptop

Above `lg` the open panels are a docked column at the right edge and the page
is narrowed to fit. Several can be open at once, because working a question
with the calculator *and* the formula sheet is how anyone works a question.
Below `lg` it stays one sheet at a time over the page. The calculator's
expression and history live in the dock, so closing it hides the working
instead of throwing it away.

Three things worth knowing:

- **`position: fixed` was not fixed to the viewport.** The dock renders inside
  `PageTransition`, whose `page-enter` animation animates `transform`, and an
  element with a transform animation applied is a containing block for fixed
  descendants - for as long as the animation is applied, which with `fill: both`
  is for ever. The rail came out the height of the page content and the width
  of the centred column, floating mid-screen with its "right edge" three hundred
  pixels short of the window. The old slide-over had the same bug and nobody had
  noticed, because a panel trapped inside the content column looks like a panel
  deliberately covering the question. It portals to `document.body` now.
- **No test could have found it.** jsdom has no layout, so `fixed` is exactly as
  fixed as you assume. This was a screenshot.
- The rail publishes its width as `--tool-rail` and a rule in `globals.css` pads
  the body by it, so the header and the nav strip stop at the rail too.

### `misapplications` on the Rule type

Added as `docs/NEXT.md` §P1 part 2 specifies, before authoring anything, so the
new rules carry them rather than needing revisiting. `apply` is a mechanical
AST rewrite (`content/rules/misapply.ts`), and `content/rules/misapplications.test.ts`
is the gate: each transform must produce the wrong answer it claims, and that
answer must be *checked* wrong rather than assumed wrong. Proven by breaking
one deliberately. Nothing reads them at runtime yet - that is the diagnosis
engine, and it is still a separate session.

### Content: `poly.factor-degree-2`

The ม.2 chapter, four skills, each complete: generator at all four
difficulties, lesson, rules, named misconceptions, all through the §9 gate and
`answer-accepted`. It carries only what did not already exist - the three
factoring skills the ม.3 pilot ships stay where they are and are named as
prerequisites, because `attempts.topic_id` is written per row and re-homing a
skill orphans the history already recorded. See the header of
`content/topics/poly-factor-degree-2.ts`.

### Four bugs found by using it, three of them older than this session

1. **The whole registry crossed to a client component.** Every question page
   hands the tool dock `allRules`, and a `Misapplication.apply` is a function.
   React cannot serialise one, so the moment any rule declared a
   mis-application, four of the five modes became an error boundary. There is a
   `publicRules` view now, the same idea as `PublicQuestion`.
2. **`pnpm render-check` reported those pages as `ok`.** It looked for the
   strings Next puts on *its* error page; ours is a translated message, and
   when what throws is the serialisation of client props the boundary is not in
   the HTML at all - only the flight stream's `E{"digest":...}` rows are. It
   checks for those now, and for a `data-error-boundary` attribute. **Verified
   by reintroducing the bug and watching it fail**, which is the only way to
   believe a check that has just been written.
3. **The segmenter ate the closing bracket** of any `\left(...\right)` written
   inside a sentence, because `)` was stripped as sentence punctuation
   wherever a run ended in one. KaTeX then threw on the unbalanced fragment. A
   `)` is punctuation only when nothing in the run opened it.
4. **A sentence dash after notation renders as a minus sign.** "ไม่ใช่ x - คูณ"
   is read as `x -` and typeset with a minus hanging off the end. Four strings
   already shipped were doing this on the lessons page. The corpus test now
   refuses any fragment ending on a bare operator, and reports every offender
   in one run rather than one per failure.

## Round six — `poly.factor-higher`

The ม.3 factoring chapter, three skills, each complete at all four
difficulties with a lesson, rules, named misconceptions and a shapes file.
Build-order item 2 is now half done.

| skill | | the ladder |
|---|---|---|
| `poly.cubes` | ผลบวก/ผลต่างของกำลังสาม | `x^3 ± q^3` → leading coefficient → common factor → both |
| `poly.higher-grouping` | จัดหมู่พหุนามดีกรีสาม | four terms → signs → leading coefficient → the quadratic factors again |
| `poly.factor-theorem` | ทฤษฎีบทตัวประกอบ | three roots → signs → a repeated root → one rational root and an irreducible quadratic |

Four things worth carrying forward:

- **The substitution is written out, not asserted.** The first step of a
  factor-theorem question is
  `\left(-5\right)^3 + 5\left(-5\right)^2 - 4\left(-5\right) - 20 = 0`, which
  is the whole content of the theorem. A step saying "-5 is a root" would be
  asking the learner to take it on trust. It carries `chain: "root"` because
  it is an arithmetic check rather than a link in the factorisation, and the
  property gate would otherwise compare a number against a polynomial.
- **A step whose expression equals the one above it reads as a mistake in the
  working.** At difficulty 4 the division *is* the answer, so "and it stops
  here" went into that step's explanation rather than into a step of its own.
  Caught by looking at the output, then pinned by a test that asserts no
  question shows the same line twice.
- **A repeated factor is written squared, not twice.** `(x - 2)(x - 2)(x - 5)`
  and `(x - 2)^2(x - 5)` are the same expression and the marker takes both,
  which is exactly why no test would have caught it - and the model answer is
  the one the learner copies. Same for `poly.higher-grouping`, where equal
  brackets are nudged apart at generation time.
- **The dangling-operator check from round five earned its keep immediately**,
  on twelve strings in this chapter's first draft.

## Round seven - the rest of the algebra spine, and into functions

Four more topics, thirteen more skills, each complete at all four difficulties
with a lesson, rules, named misconceptions, a shapes file and a chapter test.

| topic | | skills |
|---|---|---|
| `eq.linear-one-var` | ม.1 สมการเชิงเส้น | solve, fractions, word problems |
| `ineq.linear-one-var` | ม.3 อสมการ | solve, whole-number solutions, word problems |
| `func.quadratic-graph` | ม.3 กราฟ | completed square, vertex, intercepts |
| `func.relations` | ม.4 ฟังก์ชัน | evaluate, composite, inverse |

**Build order item 2 is finished.** The algebra spine - degree-two factoring,
higher-degree factoring, linear equations, linear inequalities - is all there.

### Four places the generic gate could not follow, and what was done instead

The §9 chain check asks whether adjacent lines are the *same function*. That is
the right question for an expression and the wrong one for everything in these
four chapters, so each has a test that asks the right one:

- **Linear equations.** Dividing by a coefficient scales the zero form, so
  `3x = 15` and `x = 5` are the same equation and different functions. The
  division starts its own chain; the chapter test asserts every line of the
  working *solves to the same answer*, which survives multiplying, dividing and
  swapping the sides.
- **Inequalities.** Every line evaluates to a boolean, which `areEquivalent`
  refuses - so every step carries `math: null` and the gate is off for the whole
  topic. The chapter test samples the truth value on a grid of half-integers
  either side of the boundary, which settles the solution set exactly,
  including the strict-versus-non-strict distinction random sampling would miss.
- **Graphs.** `y = ax^2 + bx + c` has two symbols in it, so §9.5 cannot check a
  coordinate against it. The chapter test checks the vertex the way ม.3 can:
  the value there is further out than the value either side.
- **Functions.** `f(x) = 2x + 1` is a definition, not an equation. The chapter
  test parses the definition out of the stem, applies it the way the prompt
  says, and compares - so a composite in the wrong order fails here and
  nowhere else.

Every one of those topics says `machineStem: null` out loud rather than
leaving a check that quietly does nothing.

### Three bugs the chapter tests found in their own content

1. **A line shown twice.** Two generators emitted a final "divide by the
   coefficient" step when the coefficient was already 1, so the working ended
   `x = -9` / `x = -9`.
2. **A misconception that was always right.** `x/m + x/n = 2x/(m+n)` was
   written as the wrong answer for the two-denominator shape; solved through,
   it is algebraically the *correct* root every time, so `namedMistakes`
   dropped it and the question shipped with nothing named. The test that
   requires a named wrong answer is what surfaced it.
3. **Two functions that commute.** `f(g(x))` and `g(f(x))` are equal when
   `ad + b = cb + d`, and on those draws the "order matters" question had no
   counterexample to offer.

### New in the engine

- `vertex-form` joins the `FormRequirement` list, so "write it in completed
  square form" can reject an equivalent expanded answer. The predicate is not
  "does it look like that" but the property that makes the form useful: every
  occurrence of the variable is inside one squared bracket.
- `pnpm vars` now ignores a letter that names a function. `f(x) = 2x + 1` names
  its function `f` and its unknown `x`, and only the second is what that script
  is about; without the change the ม.4 chapter would have reported two
  unexpected letters for ever, and a warning nobody can act on is one everybody
  learns to skip.

### Still to build, in `docs/CURRICULUM.md` build order

Superseded by round eight below: items 3 and 4 are finished and item 5 is half
done. What is left is sequences (`seq.basic`, `seq.adv`) and then item 6 -
`calc.intro` and the `c1.*` chapters, which is the target.

Thirty-odd shapes are queued across the `content/shapes/*.md` files. The ones
worth taking first are the remainder theorem, a compound inequality, the vertex
as an ordered pair, and a quadratic word problem about a greatest value - the
last of which is the closest thing ม.3 has to an optimisation question, and the
one calculus will answer properly.

## Round eight - trigonometry, and teaching the parser to read it

Two topics, seven skills, all four difficulties each, with lessons, rules,
named misconceptions, shapes files and a chapter test apiece.

| topic | | skills |
|---|---|---|
| `trig.ratios` | ม.3 อัตราส่วนตรีโกณมิติ | definition, special angles, finding a side |
| `trig.functions` | ม.5 ฟังก์ชันตรีโกณมิติ | unit circle, identities, equations, sine and cosine laws |

**Build order items 3, 4 and half of 5 are done.** Functions, ม.3 trigonometry
and ม.5 trigonometry are all there; sequences and calculus are what is left.

### The converter can now read trigonometry, and that was the real work

`lib/math/katex.ts` refused `\sin` outright. That was survivable for ม.3, whose
angles are in degrees and genuinely are not machine-readable - but not for ม.5,
and certainly not for calculus, where the derivative of a sine is a cosine and a
converter that cannot read one cannot check any of it.

So it now reads `\sin`, `\cos`, `\tan`, the reciprocals, the inverses, `\ln`,
`\log` (base ten) and `\pi`. Four decisions worth keeping:

- **`^\circ` still refuses.** mathjs works in radians, `\sin 30^\circ` is a half
  and `sin(30)` is -0.988. Refusing a degree stem is not a gap; converting one
  would be a wrong answer with a straight face.
- **`\sin^2 x` is `(\sin x)^2` and `\sin x^2` is `\sin(x^2)`.** The only
  notation in school mathematics that means something other than what it looks
  like, and both now parse as they read.
- **`\sin(x)^2` is the square of the value, `\sin 2x` is the sine of the
  product.** The brackets are the whole difference, and the maths field writes
  the first form whenever an answer is built from a `\sin` key.
- **`\sin A\cos B` is a product.** With no space between them, the argument-
  reading rule would otherwise swallow the second function - which would have
  made every line of a compound-angle derivation quietly wrong.

`lib/math/to-tex.ts` learnt the same names, or a trigonometric answer would
have been printed as the product of the three letters of its own name.

### What each chapter does that the gate cannot

- **ม.3 is in degrees, so every question says `machineStem: null`.** The chapter
  test evaluates each stem with real trigonometry and checks the answer, checks
  every exact value the learner is *shown* against the standard library, and
  rebuilds each triangle from the sides in the stem. Breaking one entry in the
  table fails four tests from three directions; that was checked by breaking it.
- **ม.5 is in radians, so most of it the gate does check** - including every
  line of an identity derivation, which is the one chapter where the gate's
  method (agree at twelve sample points) and the mathematics (true at every
  angle) are the same statement.
- **Completeness of a solution set is the exception.** Substituting a root
  proves the root is a root and says nothing about the root left out - which is
  the single commonest mistake in the topic. So the chapter test sweeps
  `[0, 2\pi)` in thousandths, bisects at every sign change, discards the
  tangent's poles, and insists every root it finds was in the answer. Dropping a
  root on purpose fails it.

### Two bugs the new tests found

- **A dropped `+`.** A hand-rolled term-joiner in the trigonometric equations
  generator stripped the sign from its middle term, so the learner was shown
  `2\cos^2\theta \cos\theta = 0` while the answer belonged to the equation with
  the sign in it. `sumTerms()` in `content/format.ts` already did this correctly
  and is now what is used.
- **§9.5 treated an identity's value as a root.** `\sec^2 x - \tan^2 x + 3` has
  one variable and the constant answer 4, and 4 is not a root of it - it is its
  value, at every x. The gate now substitutes only into things that are actually
  equations, which the doc comment had always said it did.

### Still to build

Superseded by round nine below.

## Round nine - sequences, and calculus

Two topics, eight skills, all four difficulties each, with lessons, rules,
named misconceptions, shapes files and a chapter test apiece.

| topic | | skills |
|---|---|---|
| `seq.basic` | ม.ปลาย ลำดับและอนุกรม | arithmetic, geometric, and the two series |
| `calc.intro` | ม.6 แคลคูลัสเบื้องต้น | limits, derivatives, tangents and turning points, antiderivatives and area |

**The build order's item 6 is reached.** `docs/CURRICULUM.md` planned the whole
map backwards from introductory calculus, and it is now in the app: a learner
can go from factorising a quadratic to finding the area under a cubic without
leaving the material.

### Calculus is checked by measuring it, not by re-deriving it

Every answer in the calculus chapter is something the stem is *not* - a
derivative, an antiderivative, a limit - so §9.5 has nothing to compare and
every question carries `machineStem: null`.

The tempting replacement is a symbolic differentiator in the test file. That
would check one implementation of the power rule against another one, which is
not a check at all. `calc-intro.test.ts` uses the definitions instead:

- a **limit** is what the function approaches, so the function is evaluated at
  a thousandth, a hundred-thousandth and a ten-millionth from the point, on
  both sides, and the gap has to *shrink* each time - a fixed tolerance would
  only have been measuring how steep the function is;
- a **derivative** is the limit of a difference quotient, so a central
  difference is taken at five points;
- an **antiderivative** is a function whose derivative is the integrand, so the
  answer is differentiated back;
- a **definite integral** is an area, so Simpson's rule takes it - and
  Simpson's rule is exact for every polynomial in the chapter.

Changing `value * (index + 1)` to `value * (index + 2)` in the power rule fails
four tests across three different skills. That was checked by doing it.

### Sequences, added up rather than trusted

The series generators compute their sums from closed forms, and a closed form
checked against itself proves nothing - so `seq-basic.test.ts` builds the terms
and adds them. Difficulty 4 of the arithmetic series works backwards from a
given sum, and there the test also checks that one term fewer and one term more
both *miss*, which is what makes the answer unique.

That test found a real bug immediately: a hand-rolled term joiner dropped the
sign from the middle term, so the learner was shown `2\cos^2\theta \cos\theta =
0` while the answer belonged to the equation with the sign in it. `sumTerms()`
in `content/format.ts` had always done this correctly and is now what is used.

### Three smaller things

- **`pnpm vars` now understands notation.** It flagged ten letters, all of them
  labels rather than unknowns: `a_1` and `S_n` name a sequence, `a = 3, b = 5`
  label the sides of a triangle, `A` is an angle, and the `d` of `dx` belongs
  to the integral sign. It strips those and reports what it was always for -
  which letter a question expects the learner to *find*. It now says "every
  unknown is x or y", and the one genuine offender it turned up (an elevation
  problem that called its unknown `h`) was renamed.
- **A stem that overflowed its panel.** `f'(4) \quad \text{เมื่อ} \ f(x) =
  -x^3 + x^2 + 3x - 4` needed a horizontal scrollbar. The stem is now just the
  function at every difficulty, and which point is wanted lives in the prompt
  band - which is the loudest thing on the page since round seven rebuilt it.
  Found by opening the page, not by a test.
- **An `Answer` that is a *value* is no longer mistaken for a root.** See round
  eight: the same fix, and this chapter would have tripped over it too.

### Still to build

Superseded by round ten below.

## Round ten - into university calculus

Two topics, eight skills, all four difficulties each, with lessons, rules,
named misconceptions, shapes files and a chapter test apiece.

| topic | | skills |
|---|---|---|
| `c1.limits` | ลิมิตและความต่อเนื่อง | one-sided limits, limits at infinity and asymptotes, continuity, the trigonometric limit |
| `c1.derivative` | อนุพันธ์และกฎการหาอนุพันธ์ | first principles, product and quotient rules, trigonometric derivatives, exponential and logarithmic derivatives |

These are the first chapters that could not have been written before round
eight: half of `c1.derivative` is about functions `lib/math/katex.ts` refused
to read three rounds ago.

### What the chapter tests measure

The same principle as round nine, extended:

- a **one-sided limit** is approached from one side, so each branch of a
  piecewise function is evaluated only on the side of the join it governs;
- a **limit at infinity** is checked at a thousand, a million and a billion,
  and has to be *settling*, not merely passing through;
- **continuity** puts the chosen constant back into the function and measures
  both sides at the join - and then checks that the constant *next door*
  fails, so the answer is pinned rather than merely consistent;
- an **asymptote** is told from a hole by whether the numerator vanishes too,
  and the function has to genuinely run away there;
- every **derivative** is a central difference at six points, with a relative
  tolerance - `x^4e^x` has a derivative in the hundreds by the time x is four.

### Four bugs the round turned up, three of them in shared code

- **`x\ln x` parsed as a symbol called `xlog`.** The converter emitted a
  function call straight after other output with nothing between them. It now
  inserts the multiplication, and the same fix covers `x^2\sin x`.
- **`xe^x` parsed as a symbol called `xe`.** The same trap as `xy` from round
  three, with the constant `e` in place of a second variable. `VARIABLE_RUN`
  now splits it.
- **`x \cdot (-\sin x)` printed as `x-\sin x`.** Not a cosmetic difference: it
  is a subtraction, and it was shown to the learner as the correct answer.
  `to-tex.ts` keeps the brackets round a negative factor now.
- **A misconception written in KaTeX where mathjs source belongs.** The
  `example` fields of a misapplication and the `value` of an `Answer` are both
  parsed, never displayed. The chapter test caught it on the first run.

### Still to build

~~`c1.chain`, `c1.applications`, `c1.mvt`, `c1.integral-intro`, `c1.ftc`, and
then the `c2.*` chapters. The chain rule is the last piece of differentiation;
after it, applications (optimisation, related rates) and the integral half.~~
— **all five built, in rounds eleven and twelve.**

## Round eleven - the rest of differentiation, and what it is for

Three topics, eleven skills, all four difficulties each, with lessons, rules,
named misconceptions, shapes files and a chapter test apiece.

| topic | | skills |
|---|---|---|
| `c1.chain` | กฎลูกโซ่และอนุพันธ์โดยปริยาย | the chain rule on a power, on sines and exponentials, and arriving alongside the product rule; implicit differentiation |
| `c1.applications` | การประยุกต์ของอนุพันธ์ | rising, falling and bending; maxima and minima; optimisation; related rates |
| `c1.mvt` | ทฤษฎีบทค่าเฉลี่ย | Rolle's theorem, the mean value theorem, bounding a change |

### What the chapter tests measure

- the **chain rule** is a central difference, as in round ten, and then a
  second test that the inside's derivative is actually *there*. Differentiating
  the outside and stopping is the mistake of the chapter; measuring the answer
  at a few points would catch it, but would not say what was wrong.
- an **implicit derivative** is checked against `-F_x/F_y`, both partials taken
  numerically from the equation itself, at points that satisfy it.
- a **turning point** has to turn — the derivative's sign is measured either
  side of it — and an **inflection** has to have the curvature genuinely change
  sign across it, rather than merely touch zero.
- an **optimisation** answer is checked against a model rebuilt from the
  English prompt by regular expression and then swept across its interval.
  That is deliberately a second implementation which shares nothing with the
  generator, so a question whose *setup* is wrong fails even when its algebra
  is flawless. It caught one on the first run.
- **Rolle and the mean value theorem** name a point, so the test measures the
  slope there, compares it with the chord, and insists the point is strictly
  inside the interval — which is the whole content of both theorems. A
  parabola has to answer with the midpoint and a cubic has to not.
- a **bound** has its rate cap and its two endpoints read back out of the
  prompt, and `rate × width` recomputed from them.

### Three bugs, one of them a wrong answer

- **The open box had the wrong volume.** The generator built a box of side
  `2c` and called its volume `2c³`; minimising the surface area of a box of
  volume `V` puts `x³ = 2V`, so a whole-number side needs `V = 4c³`. The
  answer shown to a learner was not the optimum. Nothing in the generator
  could have noticed — the algebra was consistent with itself — and it was the
  rebuilt-from-the-prompt sweep that failed. A closed-box variant was added
  while the model was there.
- **The §9 gate called a constant a root.** `\sec^2 x - \tan^2 x + 3` answers
  `4`, and `isRootAnswer` saw a number and went looking for something to
  substitute it into. It now requires an actual equation before treating an
  answer as a root, which is what it always meant.
- **`c1.infinity` at difficulty 4 gave a hole's height as the wrong branch** —
  a round ten chapter, caught here. It answered with `other` where the limit is
  `pole - other`.

### Three things that were not bugs but had to change

- **`e^{(ax+b)^2}` cannot be tested.** At `x = 4` it is around `1e200`, and
  `near()` compares relatively, so a deliberately wrong answer sits well inside
  the tolerance of the right one. A question the gate cannot falsify does not
  belong in the chapter; it is `\ln((ax+b)^2)` now.
- **`asOperator(node, "unaryMinus")` never matched anything.** It demands two
  arguments, and a negation has one, so every misapplication built on it
  silently did nothing. Matching `fn === "unaryMinus"` directly fixed it, and
  `unparen()` was needed before looking for a sum inside a power.
- **A misapplication was written backwards.** These take the *correct*
  expression and return the mistaken one, not the other way round. The power
  rule's read plausibly in either direction, which is exactly why it survived
  review and was caught by a test.

## Round twelve - the integral half, and Calculus I closed

Two topics, eight skills, all four difficulties each, with lessons, rules,
named misconceptions, shapes files and a chapter test apiece.

| topic | | skills |
|---|---|---|
| `c1.integral-intro` | ปริพันธ์ไม่จำกัดเขตและจำกัดเขต | integrating powers and standard functions, substitution, definite integrals, Riemann sums |
| `c1.ftc` | ทฤษฎีบทหลักมูลของแคลคูลัส | both parts of the theorem, net change from a rate, the area between curves |

That completes Calculus I as `docs/CURRICULUM.md` lists it: **seven topics,
twenty-seven skills**, every one of them generator, lesson, rules,
misconceptions, shapes file and chapter test.

### What the chapter tests measure

Integration is the half of the subject where the generic chain check is least
use — an antiderivative is not equivalent to its integrand, which is the
entire point — so every skill here is checked against an independent numerical
method:

- an **antiderivative is differentiated back** and compared with the integrand
  it came from. Nothing in that test knows the power rule.
- **substitution** gets the same treatment, plus a check that the factor the
  substitution introduces has survived into the answer — dropping the `1/k` is
  the mistake of the skill.
- a **definite integral** is checked against Simpson's rule, which is exact for
  the cubics here and knows nothing about antiderivatives.
- a **Riemann sum** is re-added rectangle by rectangle from the description in
  the prompt, and then has to *lean the right way*: a left sum under-estimates
  a rising function, and a question that claims otherwise fails.
- **the fundamental theorem, part one** is checked by building the accumulation
  numerically — integrate from the lower limit up to a moving edge — and then
  differentiating it. The theorem's own statement, turned into an experiment.
  When the upper limit is `4x` rather than `x`, the chain rule falls out of the
  measurement rather than being assumed.
- **net change** integrates the rate it was given; at difficulty 4 the velocity
  changes sign, and the test insists the distance travelled and the
  displacement really are different numbers before checking the answer is the
  second one.
- **the area between two curves** finds the crossings by sweeping and
  bisecting rather than taking them from the working, integrates the gap, and
  requires the result to be positive.

### What the round turned up

- **`\ln(2x-6)` is undefined where the test was sampling it.** `linearInside`
  now takes `positive: true` and the generator picks a shift that keeps the
  argument positive across the sample range. The content was right; the
  question was untestable, which for this project is the same thing.
- **Two tests were slow rather than wrong.** The crossing sweep in
  `c1.area-between` and the trigonometric equation sweep were both over the 5 s
  default. One compiles its expression once instead of per sample, the other
  uses a coarser step and leaves the precision to the bisection; both carry an
  explicit timeout and a comment saying why.
- **`c1.net-change` at difficulty 4 produced only fourteen distinct stems** and
  the variety floor is fifteen. It gained a speed coefficient.
- **`pnpm vars` learned to read calculus.** `\frac{d}{dx}` and `\frac{dr}{dt}`
  are single symbols, not four unknowns called d, x, r and t, and the `d` of
  `dx` belongs to the integral sign. `r`, `h` and `t` joined the allowed set
  with a written reason: they name a radius, a height and a time in a stated
  model, and "the distance after x seconds" is not an improvement on anything.

### One bug found by looking, not by testing

A stem built as `f'(4) \quad \text{เมื่อ} \ f(x) = -x^3 + x^2 + 3x - 4` ran
out of its panel on a laptop. Every test passed; the derivation was correct;
the page was unusable. The stem is the function alone now, with the point in
the prompt where it belongs. This is the second time this session that opening
the page found something no test was ever going to.

### Still to build

The `c2.*` chapters, in `docs/CURRICULUM.md` order: `c2.techniques` (by parts,
trigonometric substitution, partial fractions), `c2.improper`,
`c2.applications` (area, volume, arc length, surface area),
`c2.sequences-series`, `c2.convergence`, `c2.power-series`, and
`c2.polar-parametric`.

One of those needs a decision before any content is written:

- **`c2.convergence` answers are verdicts** — converges, diverges, converges
  conditionally — with a named test as the reasoning. That is a `choice`
  answer over a fixed vocabulary, and the numerical-oracle approach that
  carried the whole of Calculus I does not apply: partial sums can be added up,
  but no finite sum settles the question, and a series that looks convergent
  for ten thousand terms may not be. The likeliest shape is a table of known
  series with known verdicts, generated *from* the table rather than checked
  against it — which is the same working-backwards-from-the-answer rule the
  rest of the content already follows.

`c2.polar-parametric` was the other candidate for engine work, but is not one:
the converter already reads `\theta` as an ordinary variable, so `r\cos\theta`
becomes `r*cos(theta)` and `2\theta` multiplies. It needs content only.

Outside the calculus line, the build order still has `seq.adv` (the second half
of step 5 — limits of sequences and sigma notation, on top of the `seq.basic`
machinery that already exists), then step 7, the statistics and probability
strands, and step 8, geometry. The ม.4–ม.6 chapters that remain unbuilt are
sets, logic, real numbers, conics, matrices, vectors, complex numbers,
counting, probability and the four statistics topics. Geometry is last for the
reason `docs/CURRICULUM.md` gives: construction and proof do not generate.

## Round thirteen - a pass over the app rather than the content

No new chapters. A sweep of the built thing looking for what was broken or
merely unintended, done by opening pages and clicking rather than by reading
code alone - which is how three of the five were found.

### Two bugs a learner would have hit

- **The streak line reported the wrong number.** "วันนี้ทำไปแล้ว 5 ข้อ อีก 10
  ข้อจะนับเป็นวันต่อเนื่อง" - five done, ten more to go, when the day needs ten
  in total and five were left. The sentence says "อีก N" (N *more*) and was
  handed `threshold`, which is the absolute minimum. The English happened to
  read correctly with the same value, which is why it survived: "10 makes the
  day count" is true. `getStreak` now returns `remaining` and both pages use
  it, so the two cannot drift apart again.
- **`practice.accepts.vertex-form` did not exist**, in either locale. The
  runner looks that key up as `accepts.${form}`, so the one skill in the app
  that insists on completed-square form showed the learner the literal string
  `practice.accepts.vertex-form` under every wrong answer. Found by answering
  the question wrongly on purpose.

### Why key parity did not catch it

`i18n/messages.test.ts` compares the two locale files against each other, and
a key missing from *both* passes that. Nor could a search find it: nothing
references it literally. So the test now walks the sets of values the code can
interpolate - `FORM_REQUIREMENTS` and the daily's bands - and checks each
against both files. `FormRequirement` became a list with the type derived from
it rather than the other way round, so the set can be walked at run time.

Falsified in both directions before being kept: with the key removed from the
Thai file only, parity and the new test both fail; removed from **both**, only
the new test fails. That second case is the bug as it actually was.

### Three things that were not bugs but had aged badly

- **Practice and exam arrived with all seventy-eight skills ticked.** A fair
  default at fourteen chapters of ม.1-ม.4 algebra; at twenty chapters it deals
  the mean value theorem to a ม.3 learner, and makes the first job on the page
  unticking sixty-four boxes. Both pages now start from the lessons actually
  passed - `preselectedSkills` in `lib/practice/session.ts`, one rule in one
  place - falling back to everything for an account that has passed none, so
  day one is unchanged. This is the rule the daily challenge already uses and
  gives its reason for. A line under the heading says what was ticked and why,
  because a page that arrives mostly unticked and says nothing reads as a page
  that failed to load.
- **The statistics page listed all seventy-eight skills flat**, in curriculum
  order, most of them a dash. Every skill still appears - "not started" being
  visible is the point of that list - but under chapter headings now, each
  with the count of its skills you have started.
- **A ladder was being pulled away from a wall at up to nine metres a second**,
  which is thirty kilometres an hour. The other three difficulties of
  `c1.related-rates` are balloons and spreading circles where 2-9 units a
  second is ordinary; the ladder now draws its own rate of 1-3. Five triangles
  times three rates clears the variety floor on its own.

### Checked and found correct

Worth recording so the next sweep can skip them: the level curve against four
real accounts (203 XP is level 2, 103/150 through it, and the leaderboard
agrees with the profile); every admin action's guard; the avatar route's
content type, `nosniff` and cache key; all 115 rules reachable from
`/rules` and all 20 chapters in its filter; the daily's band labels; the
spaced-repetition ladder; and the heatmap's Monday-first weekday labels.

**One thing left alone deliberately:** `notFound()` on a dynamic segment
returns 200 with the 404 page rather than a 404 status - a soft 404. The page
a learner sees is correct and the app is invite-only, so nothing reads that
status today.

## Round fourteen - twenty chapters that fit on a screen

The content grew from fourteen chapters to twenty and every list page grew with
it. `/learn` measured **9,036 pixels - ten screens** - with seventy-eight
rendered formulas, and Calculus I, the part a university learner came for, sat
in the last third. `/practice` was 7,221. Nobody scrolls that far to find out
whether something is there; they assume it is not.

### Chapters that open and shut

`components/ui/chapter.tsx`, a native `<details>`, now carries every chapter on
`/learn`, `/practice`, `/exam` and the per-skill list on `/stats`. Shut, a
chapter is one row: name, grade, and a count - lessons passed, skills ticked,
skills started, whichever the page is about. `/learn` is **2,417 pixels**, and
the twenty headings have become the page's own index.

What opens on arrival is the work in progress, and each page says what that
means: on `/learn` a chapter started but not finished, falling back to the
first unfinished one so a new account does not meet twenty shut doors; on the
setup pages a chapter with something ticked; on `/stats` a chapter with
attempts in it.

Native, so it needs no JavaScript, keeps working on the setup pages that are
deliberately plain GET forms, and is keyboard- and screen-reader-operable for
free. The property that matters on those pages is that a shut `<details>` is
still in the DOM: a skill ticked and then shut away still submits. That was
checked by doing it - tick `c1.ftc-second`, shut its chapter, press เริ่มฝึก,
and read it back out of the URL.

### Three links that skip the scrolling entirely

Collapsing was most of it but not the part a university learner feels: Calculus
I still began below the fold, behind thirteen chapters of school maths. So
`StageJump` puts ม.ต้น / ม.ปลาย / มหาวิทยาลัย above the list, as plain in-page
anchors. One click on มหาวิทยาลัย and **all seven Calculus I chapters are on
one screen**, with no scrolling at all.

Anchors rather than a filter, deliberately: a filter hides the chapters either
side, and seeing that ม.6 `calc.intro` sits immediately before `c1.limits` is
worth something the moment it is gone.

`stageOf` derives the stage from `grade.en` rather than storing it on the
topic, so there is one fact about a chapter's level and not two that can
disagree. A grade it did not recognise would fall through to "university" and
file a ม.2 chapter under Calculus, quietly - so `topics.test.ts` cross-checks
it against a fact it does not consult, the chapter's own id: every `c1.`
chapter is university and no other chapter is.

### What this did not do

It did not make anything faster to serve, and the numbers say so plainly:
`pnpm perf` reads the same either side, 168ms and 61KB for `/learn` against
170ms and 59KB before. The markup still ships, KaTeX still renders all
seventy-eight formulas on the server, and a shut chapter's contents still
report a real box in the browser (`content-visibility: visible` - checked,
rather than assumed). Every page was already under 200ms and none of them was
the complaint. What changed is how far you walk past what you did not come for.

`/stats` is the one page still long at 6.9 screens, because ten of this
account's twenty chapters have attempts in them and all ten open. That is a
dashboard behaving like one, and left alone.

## Where to pick up

1. **Use it.** Register a real account (`/admin` issues codes), drill twenty
   questions, take an exam, and see what irritates. `pnpm db:seed:demo` gives a
   populated account to look at the statistics with, and
   `pnpm db:seed:demo -- --clean` removes it.
2. **The weekly content session** (`docs/CONTENT-PIPELINE.md` §5). Run
   `pnpm content:coverage`, pick the highest-value unbuilt shapes from
   `content/shapes/*.md`, and add two to four generators. That is the job from
   here on, and the app is useful while it happens.
3. ~~Open questions from `PROMPT.md` §12~~ — **all three settled and built.**
   - **Spaced repetition**: built, scheduled per *skill* rather than per
     question, because these questions are generated and re-showing an
     identical one teaches recall of that answer rather than the method.
     Ladder 1/3/7/16/35/90; right climbs one rung, wrong drops two; four lapses
     makes a leech. The old wrong-answer queue still runs alongside it and the
     dashboard count is the sum — retiring the old one is a small follow-up
     once you have lived with both.
   - **Profiles are visible to everyone with an account**, statistics included.
     Everyone here was invited by someone.
   - **XP is weighted by difficulty, levels are a pure function of it**, and
     there is a global board ranked by XP — not accuracy, which would reward
     answering three easy questions and stopping. Anyone can opt out and keep a
     visible profile.
   - the XP formula: `xpFor()` already writes a number to `daily_stats` that
     nothing displays, so it is still free to change

### Needs the owner, not the next session

- ~~**`master` is 31 commits behind `phase-1`.**~~ **Settled.** `phase-1` was
  merged and `master` is the trunk again — 24 commits ahead of `phase-1` and
  tracking `origin/master`, which is what a visitor to
  `github.com/teterw/derive` sees and what Vercel would build. `phase-0`,
  `phase-1` and `phase-6` are all merged and can be deleted whenever the owner
  wants the branch list tidy.
- **A known-password account is live in the database.** `demo` /
  `derive-demo-2026`, and the password is in `scripts/seed-demo.ts` in a public
  repository. Harmless on a laptop, not harmless the moment this database
  serves anything on the internet. `pnpm accounts` lists what is there;
  `pnpm db:seed:demo -- --clean` removes it.
- **Not deployed.** Vercel needs `DATABASE_URL` and `AUTH_SECRET` set as
  environment variables, and the Neon database is already migrated, so a deploy
  should be uneventful — but it has not been attempted, and the demo account
  above should go first.

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
