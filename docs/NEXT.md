# Phase 6 · What next

Written against the state-of-project report of 19 September 2026.

The engine is finished. From here the app improves almost entirely by having more maths in it. This document exists to stop that from being interrupted by more features.

**Standing rule for this phase: no new feature ships unless it either (a) unblocks deployment, (b) makes the daily loop pull harder, or (c) teaches better. Everything else waits.**

---

## P0 · Deploy blockers

Do these first, in one session, then deploy.

1. `AUTH_SECRET` set in the host's environment before the first request. Build succeeds without it and then every sign-in throws — a broken deploy, not a failed one.
2. Merge `phase-1` into `master`, or repoint the host. Then rename the convention: adopt `master` + short-lived feature branches and delete the "one phase per branch" line from `CLAUDE.md`, since it is no longer what happens.
3. Guard the demo seed: `db:seed:demo` must exit non-zero when `NODE_ENV === 'production'` or when `DATABASE_URL` does not point at localhost. Do not rely on remembering.
4. Remove or hide the "for development only" card on `/admin` when `NODE_ENV === 'production'`.
5. ~~Verify rate limiting actually exists~~ — **checked: it does.** `lib/auth/rate-limit.ts`, backed by the `auth_failures` table rather than an in-memory map, and it covers all three cases: `login:user:<username>`, `login:ip:<ip>`, `invite:ip:<ip>`. The invite brute-force concern was already handled. This item came from an omission in the state-of-project report, not from a gap in the code.

   What **is** outstanding: **no test asserts the limiter trips.** An untested security control is exactly what stops working silently during a refactor. Write one.

---

## P0 · Un-backfillable data, fix before more use accumulates

6. **`run_id` for practice sessions.** Open a `run` when a practice session starts, close it on exit or timeout, stamp every attempt with it. Every day this is missing is a day of session structure permanently lost. Unlocks: questions-per-session distribution, accuracy as a function of position in session (the fatigue curve), session length trend.
7. **Back up `attempts` and `daily_stats`.** Content lives in git, users are re-invitable, but attempt history is the one irreplaceable asset in the project and it becomes more valuable every week. A scheduled `pg_dump` of those two tables to storage outside Neon, weekly, retained for a few months. Verify a restore once, now, rather than discovering the dump was empty in a year.

---

## P1 · Spaced repetition — schedule skills, not questions

### The design

Do **not** key the schedule on `(generatorId, seed)`. Re-showing the identical question teaches recall of that answer, not of the method. For generated content, the unit under review is the **skill**; when a skill comes due, serve a fresh question from it.

```
skill_reviews   user_id, skill_id,
                interval_days (int), due_on (date, Asia/Bangkok),
                consecutive_correct (int), lapses (int),
                last_reviewed_at, ease (real, optional)
                PRIMARY KEY (user_id, skill_id)
```

Interval ladder: `1 → 3 → 7 → 16 → 35 → 90` days.
- Correct on a due review → advance one rung, set `due_on`.
- Wrong → drop two rungs (floor of 1 day), increment `lapses`.
- A skill with `lapses >= 4` is a leech: surface it in Learn with its lesson, not in Review.

Start with this ladder rather than SM-2 or FSRS. It is legible, easy to test, and the difference in outcomes at this scale is small. Leave `ease` in the schema so a smarter scheduler can be swapped in without a migration.

### Cold start
Backfill from existing data — no history is lost by having waited. For each `(user_id, skill_id)` in `skill_mastery`, seed `interval_days` from EMA accuracy (high → 7, medium → 3, low → 1) and set `due_on` relative to the last attempt on that skill in `attempts`. Clamp everything to at most 20 skills due on any one day so nobody signs in to a wall.

### Why this matters more than any feature on the list
Review currently drops a question the moment it is answered correctly once, so the queue drains to empty and stays empty. There is no reason to come back tomorrow beyond willpower. A **"ทบทวนวันนี้ · N" count on the dashboard** is the strongest daily-return mechanic available, and it costs nothing in content.

Build this and drop the planned "weekly focus" feature — due-counts do the same job better.

---

## P1 · The divergence diff

The highest-value unbuilt teaching feature. It comes in two parts, and only the first is a task.

### Part 1 — the task: misconceptions point at a step

Six generators already emit the wrong answer a learner is likely to give. Extend the misconception record to carry the **index of the step it corrupts**, so a wrong answer jumps straight to that step rather than only to the final side-by-side comparison. Bounded, testable, ships in a session.

### Part 2 — the experiment: mis-applications live on rules

"Work out what they did wrong" is an open-ended search if attempted at diagnosis time, and does not land in a session as first written. The way to bound it is to enumerate the mistakes at **authoring** time, attached to the **rule** rather than the generator:

```ts
type Rule = {
  // ...existing fields
  misapplications?: {
    id: string;
    transform: (expr: string) => string;  // the wrong move, applied mechanically
    explain: L;                           // 'คูณเลขชี้กำลังแทนที่จะบวก'
  }[];
};
```

`exp.product` declares two: added the bases, multiplied the exponents instead of adding them. `quad.formula` declares one: dropped the minus on `-b`. Diagnosis is then bounded — for each step, apply that step's rule's mis-applications, propagate forward, and check whether any result matches what the learner submitted. Five steps × three mis-applications is fifteen candidates, not a search.

This moves the hard part into **content work**, which is where the effort belongs anyway, and every rule authored from here documents its own known failure modes — worth doing on its own merits, diff or no diff.

Honest limit: it only ever diagnoses anticipated mistakes. Novel errors fall through, and that is acceptable.

### Both parts

Where nothing matches, fall back to the current behaviour rather than guessing. **A confidently wrong diagnosis is worse than none** — the same reasoning that keeps language models out of the step engine applies here.

Display: the correct derivation with everything up to the divergence point dimmed as "you had this", the divergence step highlighted, and the rule chip for what was missed.

---

## P2 · Does it work?

You now have enough data to check whether the app does what it claims. Build one analysis, as a script first and a page only if the result is interesting:

**Learning curve per skill.** For each `(user, skill)`, plot accuracy at difficulty 3 against cumulative attempts on that skill. If the curve rises, the tool works. If it is flat, something upstream is wrong — questions too similar, explanations not landing, difficulty mislabelled — and no amount of new content fixes it.

Also worth a look: retention interval versus accuracy (how fast do skills decay?), which directly tunes the interval ladder above.

This is the only way to find out whether the project succeeds at its actual goal rather than at being an app.

---

## P2 · Then content, and mostly nothing else

`content:coverage` is clean and 22 shapes are queued. Run the weekly session from `CONTENT-PIPELINE.md` §5. Two to four generators a session.

Order: finish the 22 queued shapes for the existing two topics, then take the next topics in the build order from `CURRICULUM.md` §Build order — `poly.factor-degree-2`, `poly.factor-higher`, `eq.linear-one-var`, `ineq.linear-one-var`. That is the algebra spine and it unblocks everything downstream.

Target: one skill fully covered per week. A topic every four to six weeks. Nothing about that pace is improved by adding features.

---

## Explicitly not now

- Skill unlocks. Superseded by due-counts.
- Weekly focus. Superseded by due-counts.
- Per-question timing display in exam mode. Nice, not load-bearing.
- Any further social feature. The leaderboard, profiles and avatars already exceed what the current user count justifies; adding more widens the maintenance surface that has to survive years of content work.
- The LLM "explain differently" button. Still no.

---

## Understanding your own codebase

This was originally argued from lines-per-commit. The number is out, and not for the reason it was challenged on: rewrites push *total* churn above the current line count, so churn per commit is higher than the naive figure, not lower. What genuinely softens it is composition — 338 strings × 2 locales, test fixtures, shadcn components and generated content are lines nobody needs to read line by line.

So drop the arithmetic; it was a proxy for something a report cannot measure. The real diagnostic takes a minute: open a file in `lib/math/` or `lib/stats/` at random and explain what it does out loud without reading around it. Wherever that fails is the tour worth taking.

The point it stood in for is unchanged: when something breaks in eight months, the cost of the fix depends entirely on whether you can navigate the code.

Worth one session, before Phase 6 proper: read through `content/`, `lib/math/` and `lib/stats/` and write `docs/ARCHITECTURE.md` **in your own words, without generating it**. Where you cannot explain what a file does, that is the tour worth taking. It is also the version of this project that survives someone asking you to explain it.

---

## Session prompts

**Deploy blockers**
```
Read docs/NEXT.md. Do P0 items 1-7 only, in order. For item 5, first check whether
rate limiting exists anywhere in lib/auth — report what you find before writing
anything. Run pnpm test and pnpm smoke. Show me a diff summary before committing.
```

**Spaced repetition**
```
Read docs/NEXT.md §P1 spaced repetition and PROMPT.md §3.
Add the skill_reviews table, the interval ladder, the cold-start backfill script,
and the due-count on the dashboard. Reviews serve a fresh question from the due
skill — never a stored one. Tests: ladder advance, ladder drop, leech threshold,
backfill clamping to 20 per day, and the Asia/Bangkok day boundary.
Do not touch review mode's existing wrong-answer queue until the new one passes.
```

**Divergence diff**
```
Read docs/NEXT.md §P1 divergence diff. Build Part 1 ONLY — misconceptions carry
the index of the step they corrupt, and a wrong answer jumps to that step.
Do not start Part 2 in this session.

Then, separately: add the `misapplications` field to the Rule type and author
them for the rules in ONE topic, with tests asserting each transform produces
something the answer checker marks wrong. That is content, not the diagnosis
engine — do not wire it to the UI yet.

Anywhere diagnosis cannot identify a divergence point with confidence, fall
back silently. Never guess.
```

**Weekly content**
```
Read PROMPT.md, docs/CONTENT-PIPELINE.md, content/shapes/<topic>.md.
Run pnpm content:coverage and show me the gaps.
Then build the 2-4 highest-value unbuilt shapes per the pipeline workflow.
Do not write any question whose steps you cannot derive from construction.
```
