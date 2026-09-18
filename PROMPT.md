# Derive (ทีละขั้น) — Build Specification

> **How to use this file.** Put it at the repo root. Open Claude Code in the repo and say:
> `Read PROMPT.md and docs/CURRICULUM.md. Build Phase 0 only. Stop and show me before Phase 1.`
> Do one phase at a time. Do not let it build all phases in one run.
>
> Package and repo name: `derive`.

---

## 0. What this is

A bilingual (ไทย / English) math practice website for Thai secondary-school maths through Calculus II. It is **not** a video course. It is a **drilling and progress-tracking app** in the spirit of Monkeytype and LeetCode:

- The daily loop is *do questions*, not *watch lessons*.
- Every question can be broken open into step-by-step "which rule turned this into that."
- Statistics are deep, personal, and something you want to look at: heatmap, streaks, accuracy curves, per-skill mastery, counts per difficulty.
- Invite-only. No public signup.

**Primary user:** a student who is weak at maths, is rebuilding from the bottom, and needs to *see* that they are improving.

### Non-goals (v1)
- No video. No chat/forum. No payments. No mobile app (responsive web only).
- No AI-generated maths at runtime (see §6.5).
- No full curriculum coverage — v1 ships **two topics**, done properly.

---

## 1. Locked technical decisions

Do not substitute these without asking.

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router, latest stable), TypeScript strict |
| Styling | Tailwind CSS + shadcn/ui |
| Database | **Neon Postgres** (serverless driver) |
| ORM / migrations | **Drizzle ORM** + drizzle-kit |
| Auth | **Hand-rolled** username + password + session cookie. No Auth.js, no Clerk. |
| Access control | **Invite-code gated.** Admin-generated codes only. |
| Math rendering | **KaTeX** (not MathJax) |
| Math parsing / equivalence | **mathjs** |
| i18n | **next-intl**, routes under `/[locale]/`, locales `th` (default) and `en` |
| Charts | Recharts for line/bar. Heatmap: custom SVG/CSS grid, no library. |
| Graphing tool | Desmos embedded API (`NEXT_PUBLIC_DESMOS_API_KEY`) |
| Package manager | pnpm |
| Deployment target | Vercel |
| Tests | Vitest (unit + property tests for generators) |

### Environment variables
```
DATABASE_URL=              # Neon pooled connection string
AUTH_SECRET=               # 32+ random bytes, base64
NEXT_PUBLIC_DESMOS_API_KEY=
ADMIN_BOOTSTRAP_USERNAME=  # used once by the seed script
ADMIN_BOOTSTRAP_PASSWORD=
```
Commit `.env.example`, never `.env`.

---

## 2. Phase plan

Build strictly in order. Each phase ends with a working, committed, reviewable app.

### Phase 0 — Skeleton, database, auth, invite gating
**Deliverables**
- Next.js app, TS strict, Tailwind, shadcn/ui, next-intl with `th`/`en`.
- Drizzle schema + first migration (§3), connected to Neon.
- Register page that **requires a valid invite code**, plus username, password, display name.
- Login page with a "จดจำฉันไว้ / Remember me" checkbox.
- Session middleware: every route except `/[locale]/login`, `/[locale]/register`, and `/api/auth/*` redirects to login when unauthenticated.
- `/[locale]/admin` (role `admin` only): generate invite codes, set max uses + expiry + note, list codes with usage, disable a code, list users.
- Seed script `pnpm db:seed:admin` creating the first admin from env vars.
- Empty dashboard shell showing the logged-in user's display name.

**Acceptance:** I can seed an admin, log in as admin, generate a code, log out, register a second account with that code, and the same code cannot be reused past its `max_uses`. Visiting any page logged-out sends me to login.

### Phase 1 — Content engine + Learn + Practice
**Deliverables**
- Content engine types and rule registry exactly as in §5 and §6.
- Two topics fully implemented (§7): `exponents-radicals`, `quadratic-equations`.
- Lesson pages (Learn mode) with worked examples that reveal step by step.
- Practice mode: endless drilling, immediate feedback, "อธิบาย / Explain" available on any question.
- The step viewer component: each step shows the expression, names the rule used, links to the rule page, and explains in one sentence in the active language.
- Math input: keypad + text parse (`sqrt(2)`, `x^2`, `1/2`).
- Attempts recorded to the database.
- Vitest property tests for every generator (§9).

**Acceptance:** I can drill 20 questions in Thai, get instant right/wrong, open any question and see correct steps naming the actual rules, switch to English, and all 20 attempts exist in the `attempts` table.

### Phase 2 — Exam mode + Review
- Exam config screen: topics, number of questions, difficulty mix, time limit, and **`explainMode`: `off` | `onWrong` | `always`** (settable before the test, and toggleable mid-test).
- Timed run, progress bar, flag-for-review, submit.
- Results screen: score, time, per-skill breakdown, and every question expandable into its steps.
- Wrong answers go to a review queue the user can re-drill.

### Phase 3 — Statistics (the reason the app exists)
Everything in §8. Personal profile page + dashboard.

### Phase 4 — Study tools
- Formula sheet / rule browser, searchable, filterable by topic, bilingual — generated from the **same rule registry** the step engine uses, so they never drift apart.
- Slide-over Desmos graphing calculator, available from practice and (if `explainMode !== 'off'`) exam.
- Simple scientific calculator for arithmetic-free topics.
- Keyboard shortcuts panel (Monkeytype-style: `Enter` submit, `E` explain, `G` graph, `F` formulas, `Esc` close).

### Phase 5 — Content expansion
More topics from `docs/CURRICULUM.md`, in the prerequisite order given there. Not part of the initial build.

---

## 3. Database schema (Drizzle)

Sketch — refine types as needed, keep the shape.

```ts
users              id, username (citext unique), password_hash, display_name,
                   role ('user' | 'admin'), locale ('th' | 'en'),
                   timezone (default 'Asia/Bangkok'),
                   current_streak, longest_streak, last_active_day (date),
                   created_at, last_seen_at

invite_codes       id, code (unique), created_by -> users.id, note,
                   max_uses (default 1), uses (default 0),
                   expires_at (nullable), disabled (bool), created_at

invite_redemptions id, invite_code_id, user_id, redeemed_at

sessions           id, token_hash (unique), user_id, expires_at,
                   created_at, user_agent

attempts           id, user_id, mode ('learn'|'practice'|'exam'|'review'),
                   run_id (nullable -> runs.id),
                   topic_id, skill_id, generator_id, seed, difficulty (1..4),
                   question_snapshot (jsonb),   -- stem + answer, for replay
                   user_answer (text), is_correct (bool),
                   time_ms, hints_used (int), steps_revealed (bool),
                   day (date),                  -- Asia/Bangkok day, see §8
                   created_at

runs               id, user_id, mode, config (jsonb), started_at, finished_at,
                   total, correct, duration_ms

daily_stats        user_id, day (date), attempts, correct, time_ms, xp
                   PRIMARY KEY (user_id, day)

skill_mastery      user_id, skill_id, attempts, correct,
                   ema_accuracy (real), level (int), updated_at
                   PRIMARY KEY (user_id, skill_id)
```

Topics, skills, generators and rules live in **code**, not the database. The database stores only string ids pointing at them. This keeps content in git where it can be reviewed and tested.

Indexes: `attempts(user_id, day)`, `attempts(user_id, skill_id)`, `attempts(user_id, created_at desc)`, `sessions(token_hash)`.

---

## 4. Auth & security requirements

- Hash passwords with **argon2id** (`@node-rs/argon2`); bcrypt cost ≥ 12 is an acceptable fallback.
- Session token: 32 random bytes, base64url. Store **SHA-256 hash** in the DB, never the raw token.
- Cookie: `httpOnly`, `secure` in production, `sameSite=lax`, path `/`.
- Remember me → 30-day expiry. Unchecked → 12-hour expiry.
- Sliding refresh: if a session is more than halfway to expiry on use, issue a new expiry.
- Rate limit: max 8 failed logins per username per 15 min, and per IP. Rate limit invite redemption attempts too (codes are guessable otherwise).
- Invite codes: 12 characters, `crypto.randomBytes`, excluding ambiguous chars (`0/O/1/I/l`). Shown to the admin in plaintext; that's intentional, they must be able to send them.
- Registration is **only** reachable with a valid unexpired code that has uses remaining. Redeem inside the same transaction that creates the user.
- All mutations via Server Actions or route handlers with an auth check. No client-trusted `user_id` — ever, anywhere.
- Answer keys must never reach the client before the user submits (see §6.4).

---

## 5. Rule registry — build this first

The rule registry is the backbone of the whole product. Everything (steps, hints, formula sheet, "what rule am I dealing with") reads from it.

```ts
type RuleId = string;                    // e.g. 'exp.product', 'quad.zero-product'

type Rule = {
  id: RuleId;
  topicIds: string[];
  name:      { th: string; en: string };   // 'สมบัติการคูณของเลขยกกำลัง'
  statement: string;                       // KaTeX: 'a^m \\cdot a^n = a^{m+n}'
  conditions?: { th: string; en: string }; // 'เมื่อ a \\neq 0'
  plain:     { th: string; en: string };   // one sentence, no jargon
  examples:  { from: string; to: string; note?: { th: string; en: string } }[];
  seeAlso?: RuleId[];
};
```

Rules live in `content/rules/*.ts` and are exported as one keyed registry. Every step a generator emits **must** reference a real `RuleId` — fail a test if it doesn't.

---

## 6. Content engine

### 6.1 Types

```ts
type L = { th: string; en: string };

type Step = {
  expr: string;          // KaTeX: the state AFTER this step
  ruleId: RuleId;        // which rule got us here
  explain: L;            // one sentence: what changed and why
  highlight?: string[];  // optional sub-expressions that changed
};

type Answer =
  | { kind: 'exact';   value: string }            // canonical KaTeX/math string
  | { kind: 'numeric'; value: number; tol: number }
  | { kind: 'set';     values: string[] }         // e.g. roots {2, -5}, order-free
  | { kind: 'choice';  correct: string };

type Question = {
  id: string;              // `${generatorId}:${seed}`
  generatorId: string;
  skillId: string;
  difficulty: 1 | 2 | 3 | 4;
  prompt: L;               // "จงหาคำตอบของสมการ" / "Solve the equation"
  stem: string;            // KaTeX of the problem itself
  answer: Answer;
  choices?: { id: string; label: string }[];
  steps: Step[];           // the full derivation
  hints: L[];              // progressive: nudge → name the rule → first step
  rulesUsed: RuleId[];
};

interface Generator {
  id: string;
  skillId: string;
  difficulties: (1 | 2 | 3 | 4)[];
  generate(rng: RNG, difficulty: 1 | 2 | 3 | 4): Question;
}
```

### 6.2 Seeded randomness
Use a small seeded PRNG (mulberry32 or sfc32) — **never `Math.random()`** inside a generator. Any question must be perfectly reproducible from `(generatorId, seed, difficulty)`. This gives us: replaying missed questions, sharing a question by URL, and deterministic tests.

### 6.3 Writing generators — the rule
A generator works **backwards**: choose the answer first, then construct the problem from it. Want a quadratic with integer roots? Pick roots `p, q`, expand `(x−p)(x−q)`, and you now know both the question and every step of the solution with certainty. This is what makes the step-by-step trustworthy.

Difficulty is controlled by parameter ranges and structure, not by randomness:
1. small positive integers, one rule applied
2. negatives and simple fractions, two rules
3. multi-rule, awkward coefficients, needs rearranging first
4. exam-style, unusual forms, traps (e.g. losing a root by dividing by a variable)

### 6.4 Answer checking
- Server-side only. The client gets `stem`, `prompt`, `choices` — **never** `answer` or `steps` until it has submitted or explicitly asked to be shown.
- Normalize before comparing: parse with mathjs, compare canonical forms. Accept `1/2`, `0.5`, and `2^{-1}` as equal **unless the skill is specifically about form** (e.g. "simplify to lowest radical form" must reject `\sqrt{8}` for `2\sqrt{2}`). Each skill declares `strictForm: boolean`.
- Set answers are order-independent.
- On rejection of an equivalent-but-wrong-form answer, say *why* ("คำตอบถูกต้องแต่ยังจัดรูปไม่เสร็จ").

### 6.5 On using an LLM
Not in v1. Later, at most as an optional "อธิบายใหม่อีกแบบ / explain this differently" button that receives the **already-correct** steps as context and rephrases them. The deterministic steps stay the source of truth. Never let a model produce an answer key or grade a submission.

---

## 7. Pilot content for v1

Two topics. Thai is the source of truth for terminology; English is the translation.

### Topic A — `exponents-radicals` · เลขยกกำลังและกรณฑ์ (ม.2 พื้นฐาน)
Skills:
1. `exp.integer-laws` — สมบัติของเลขยกกำลังที่มีเลขชี้กำลังเป็นจำนวนเต็ม
2. `exp.negative-zero` — เลขชี้กำลังเป็นศูนย์และจำนวนเต็มลบ
3. `exp.scientific` — สัญกรณ์วิทยาศาสตร์
4. `rad.simplify` — การจัดรูปกรณฑ์ที่สอง (ถอดตัวประกอบกำลังสองออกจากตัวถูกกรณฑ์)
5. `rad.operations` — การบวก ลบ คูณ หารกรณฑ์
6. `rad.rationalize` — การทำให้ตัวส่วนไม่ติดกรณฑ์

Rules to author: `exp.product`, `exp.quotient`, `exp.power-of-power`, `exp.power-of-product`, `exp.zero`, `exp.negative`, `rad.product`, `rad.quotient`, `rad.perfect-square-extract`, `rad.like-terms`, `rad.conjugate`.

### Topic B — `quadratic-equations` · สมการกำลังสองตัวแปรเดียว (ม.3 พื้นฐาน)
Prerequisite: `poly.factor-degree-2` (การแยกตัวประกอบพหุนามดีกรีสอง) — include the minimum needed.

Skills:
1. `quad.factor-common` — แยกตัวประกอบด้วยตัวประกอบร่วม
2. `quad.factor-trinomial` — แยกตัวประกอบตรีนาม
3. `quad.diff-squares` — ผลต่างกำลังสอง
4. `quad.solve-by-factoring` — แก้สมการโดยการแยกตัวประกอบ
5. `quad.completing-square` — การทำให้เป็นกำลังสองสมบูรณ์
6. `quad.formula` — สูตรหาคำตอบ (สูตรกำลังสอง)
7. `quad.discriminant` — ดิสคริมิแนนต์กับจำนวนคำตอบ
8. `quad.word-problems` — โจทย์ปัญหา *(hand-written items, not generated)*

Rules to author: `quad.zero-product`, `quad.common-factor`, `quad.trinomial-pattern`, `quad.diff-squares`, `quad.perfect-square-trinomial`, `quad.complete-square`, `quad.formula`, `quad.discriminant`, `eq.balance` (ทำสิ่งเดียวกันทั้งสองข้างของสมการ), `eq.move-term` (ย้ายข้าง).

### Bilingual glossary (use exactly these Thai terms)

| ไทย | English |
|---|---|
| เลขยกกำลัง | power / exponential expression |
| ฐาน | base |
| เลขชี้กำลัง | exponent, index |
| กรณฑ์ที่สอง, รากที่สอง | square root |
| ตัวถูกกรณฑ์ | radicand |
| จัดรูป | simplify |
| ทำให้ตัวส่วนไม่ติดกรณฑ์ | rationalize the denominator |
| สัมประสิทธิ์ | coefficient |
| พหุนาม | polynomial |
| พหุนามดีกรีสอง | quadratic polynomial |
| การแยกตัวประกอบ | factorization |
| ตัวประกอบร่วม | common factor |
| ผลต่างกำลังสอง | difference of squares |
| ตรีนามกำลังสองสมบูรณ์ | perfect square trinomial |
| สมการกำลังสองตัวแปรเดียว | quadratic equation in one variable |
| การทำให้เป็นกำลังสองสมบูรณ์ | completing the square |
| สูตรหาคำตอบ / สูตรกำลังสอง | quadratic formula |
| ดิสคริมิแนนต์ | discriminant |
| คำตอบ / ราก (ของสมการ) | solution / root |
| สมบัติการคูณเป็นศูนย์ | zero product property |
| ย้ายข้าง | move a term to the other side |

Difficulty labels: `1 ง่าย (Easy) · 2 ปานกลาง (Medium) · 3 ยาก (Hard) · 4 ท้าทาย (Challenge)`.

---

## 8. Statistics

**Timezone rule:** a "day" is an `Asia/Bangkok` calendar day. Compute it when writing the attempt row, store it in `attempts.day`, and roll it into `daily_stats`. Do not derive days from UTC timestamps at read time — that breaks streaks for anyone practising late at night.

Dashboard and profile show:
- **Heatmap** — GitHub-style year grid of `daily_stats.attempts`, 5 intensity buckets, hover shows count + accuracy. This is the emotional centre of the app; make it look good.
- **Streak** — current and longest, in days. A day counts with ≥ 10 attempts (make the threshold a constant, not magic).
- **Difficulty rings** — LeetCode-style: solved counts per difficulty 1–4, with totals available.
- **Accuracy over time** — rolling 7-day accuracy line.
- **Speed** — median seconds per question, per difficulty, trend over time.
- **Per-skill mastery** — bar per skill with an EMA accuracy (α ≈ 0.2, min 5 attempts before showing a level). Levels: `ยังไม่เริ่ม / กำลังเรียน / ชำนาญ / แม่นยำ`.
- **Weakest skills** — worst 5 by EMA with ≥ 5 attempts, each a one-click "drill this".
- **Totals** — questions answered, hours practised, topics touched, rules encountered.
- **Personal bests** — fastest 20-question sprint per topic, longest correct streak.

All aggregates are SQL over `attempts` / `daily_stats`. No client-side aggregation of raw rows.

---

## 9. Testing requirements (non-negotiable)

Silent maths bugs are the main risk in this project. For **every** generator, write a Vitest property test that, over 100 seeds × every supported difficulty, asserts:

1. The question is produced without throwing.
2. `steps` is non-empty, and the final step's expression is equivalent (via mathjs) to the stated `answer`.
3. Every `ruleId` in `steps` exists in the rule registry.
4. Both `th` and `en` strings are non-empty for `prompt`, every `step.explain`, and every hint.
5. The stated `answer` actually satisfies the original `stem` (substitute back and verify — for equations, check every root).
6. `checkAnswer(correctAnswerInCanonicalForm, answer) === true`, and a deliberately perturbed answer returns `false`.

Also unit-test `checkAnswer` against an equivalence table (`1/2` = `0.5` = `0.50`; `2\sqrt2` ≠ `\sqrt8` when `strictForm`).

---

## 10. UI/UX notes

- **Thai first.** Thai is the default locale and must never look like a translation afterthought. Use a font with proper Thai support (IBM Plex Sans Thai or Noto Sans Thai) and check line height — Thai needs more than Latin.
- Language toggle is always visible; switching preserves the current question and page.
- Practice mode should feel like Monkeytype: minimal chrome, big centred question, keyboard-driven, instant feedback, no page transitions between questions.
- The step viewer reveals one step at a time by default, with "show all". Each step displays: the resulting expression, the **rule name as a clickable chip**, and the one-sentence explanation.
- Wrong answer → show the user's answer next to the correct one, with the first divergent step highlighted where feasible.
- Dark mode. Respect `prefers-color-scheme`, allow manual override.
- Fully usable on a phone, including the math keypad.

---

## 11. Conventions

- `content/` holds topics, skills, rules, generators, lessons. Pure functions, no DB imports, so they stay testable.
- `lib/` for auth, db, stats. `components/` for UI. `app/[locale]/...` for routes.
- Every content id is a stable string; never renumber. Ids appear in the database forever.
- Never delete a generator that has attempts against it — deprecate it.
- Conventional commits. One phase per branch.
- Add a `CLAUDE.md` after Phase 0 recording the conventions actually used.

---

## 12. Open decisions (ask me, don't guess)

- Spaced repetition algorithm for review mode (SM-2 vs a simple leech queue) — deferred to Phase 3+.
- Whether profiles are visible to other invited users, or private.
- Whether to add a global leaderboard. (Probably not: it competes with the self-progress framing.)
- XP/level formula, if we want one at all.
