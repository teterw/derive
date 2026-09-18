# Build progress

Running log of what is built, what is verified, and what the next session
should pick up. Update it at the end of every working session.

Phases are defined in `PROMPT.md` §2.

---

## Status at a glance

| Phase | What | State |
|---|---|---|
| 0 | Skeleton, database, auth, invite gating | **code complete, not yet run against a database** |
| 1 | Content engine + Learn + Practice | not started |
| 2 | Exam mode + Review | not started |
| 3 | Statistics | not started |
| 4 | Study tools | not started |
| 5 | Content expansion | not started |

---

## Phase 0 — done

Branch `phase-0`.

- Next.js 16.3.5 (App Router, Turbopack), TypeScript strict, Tailwind v4,
  hand-written shadcn-style primitives in `components/ui/`.
- next-intl with `th` (default) and `en`, routes under `/[locale]/`, message
  catalogues in `messages/`. Key sets are checked to match.
- Drizzle schema for all nine tables in `PROMPT.md` §3 (plus `auth_failures`
  for rate limiting), first migration generated at
  `drizzle/0000_bizarre_professor_monster.sql`.
- Auth: argon2id passwords, SHA-256 session tokens with sliding refresh,
  remember-me, invite-code-gated registration redeemed inside a transaction,
  rate limits on failed logins (per username and per IP) and on invite
  redemption (per IP).
- `proxy.ts` (Next 16's renamed middleware) redirects unauthenticated requests
  to `/[locale]/login` and authenticated ones away from login/register.
- `/[locale]/admin`: create invite codes (note, max uses, expiry), copy the
  code, disable a code, list codes with status and usage, list users.
- Dashboard shell with greeting, language toggle, theme toggle, logout.
- `pnpm db:seed:admin` creates or promotes the bootstrap admin.

Verified locally: `pnpm typecheck`, `pnpm lint`, `pnpm test` (9 tests),
`pnpm build` all pass.

### Not yet verified — needs a database

The Phase 0 acceptance test in `PROMPT.md` §2 has **not** been run, because
there is no `DATABASE_URL` on this machine and no local Postgres. To run it:

1. Create a free project at <https://neon.tech>, copy the **pooled** connection
   string.
2. `cp .env.example .env`, fill in `DATABASE_URL`, `AUTH_SECRET`
   (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`),
   `ADMIN_BOOTSTRAP_USERNAME`, `ADMIN_BOOTSTRAP_PASSWORD`.
3. `pnpm db:migrate` (or `pnpm db:push`), then `pnpm db:seed:admin`.
4. `pnpm dev`, then walk the acceptance path: log in as admin → `/th/admin` →
   generate a code → log out → register a second account with it → confirm the
   code cannot be reused past `max_uses` → confirm a logged-out visit to any
   page lands on login.

Things to watch for on that first run, since they are the parts that could not
be exercised without a database:

- the registration transaction (invite claim + user insert + redemption row),
- the `invite_codes_uses_within_max` check constraint firing instead of a
  friendly error if the conditional UPDATE is ever wrong,
- sliding session refresh writing a new `expires_at`,
- `format.relativeTime` on the admin users table with a real timestamp.

---

## Decisions taken (and why)

- **Neon WebSocket driver, not HTTP.** `neon-http` throws on
  `db.transaction()`, and §4 requires the invite redemption and the user insert
  to be one transaction.
- **`username` is lower-cased `text`, not `citext`.** `drizzle-kit push` cannot
  `CREATE EXTENSION`. `normalizeUsername()` is the single writer.
- **Rate limiting lives in a table.** Serverless invocations do not share
  memory.
- **`auth_failures` table added** beyond the §3 sketch, for the above.
- **`practice_mode` enum includes `daily`**, for the daily challenge in
  `docs/CONTENT-PIPELINE.md` §6.
- **`typedRoutes` is off.** It fights next-intl's navigation helpers over
  query-string hrefs; revisit if it stops costing more than it gives.
- **shadcn/ui components are hand-written** in the same idiom rather than
  pulled in by the CLI, which wants an interactive init.

## Open questions for the owner

From `PROMPT.md` §12, still unanswered and not needed yet:
spaced-repetition algorithm, profile visibility, leaderboard, XP formula.

---

## Next session

Phase 1 — content engine + Learn + Practice. Build in this order:

1. `content/` types (§6.1), seeded RNG (§6.2), the rule registry (§5).
2. Rules for both pilot topics (§7), bilingual, with KaTeX statements.
3. Generators, working backwards from the answer, one skill at a time.
4. Property tests per §9 — a generator without them does not ship.
5. `checkAnswer` (§6.4) with `strictForm` per skill.
6. Practice mode UI, then the step viewer, then Learn.
