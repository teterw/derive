import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Topics, skills, generators and rules live in `content/`, not here. The
 * database stores only their string ids, so content stays in git where it can
 * be reviewed and tested (PROMPT.md section 3).
 */

export const userRole = pgEnum("user_role", ["user", "admin"]);
export const localeEnum = pgEnum("locale", ["th", "en"]);
export const practiceMode = pgEnum("practice_mode", [
  "learn",
  "practice",
  "exam",
  "review",
  "daily",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /**
     * Stored lower-cased; normalizeUsername() is the only way it is written.
     * A citext column would need CREATE EXTENSION citext, which
     * `drizzle-kit push` cannot do - see CLAUDE.md.
     */
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    role: userRole("role").notNull().default("user"),
    locale: localeEnum("locale").notNull().default("th"),
    timezone: text("timezone").notNull().default("Asia/Bangkok"),
    currentStreak: integer("current_streak").notNull().default(0),
    longestStreak: integer("longest_streak").notNull().default(0),
    lastActiveDay: date("last_active_day"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    /**
     * Which generated avatar this learner picked. The picture is drawn from
     * the seed, so there is no file to store, serve or moderate.
     */
    avatarSlot: integer("avatar_slot").notNull().default(0),
    /** One line the learner writes about themselves. Optional, and often empty. */
    bio: text("bio"),
    /**
     * Opt out of appearing on the leaderboard and the people list.
     *
     * Everyone here was invited by someone, so profiles are visible by
     * default - but being ranked in public is a different thing from being
     * visible, and a learner who is struggling should be able to keep
     * practising without it being a scoreboard.
     */
    hideFromLeaderboard: boolean("hide_from_leaderboard")
      .notNull()
      .default(false),
  },
  (t) => [index("users_role_idx").on(t.role)],
);

export const inviteCodes = pgTable(
  "invite_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    note: text("note"),
    maxUses: integer("max_uses").notNull().default(1),
    uses: integer("uses").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    disabled: boolean("disabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("invite_codes_created_by_idx").on(t.createdBy),
    check("invite_codes_uses_within_max", sql`${t.uses} <= ${t.maxUses}`),
  ],
);

export const inviteRedemptions = pgTable(
  "invite_redemptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    inviteCodeId: uuid("invite_code_id")
      .notNull()
      .references(() => inviteCodes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    redeemedAt: timestamp("redeemed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("invite_redemptions_code_idx").on(t.inviteCodeId)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** SHA-256 of the cookie value. The raw token is never stored. */
    tokenHash: text("token_hash").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    userAgent: text("user_agent"),
  },
  (t) => [
    index("sessions_token_hash_idx").on(t.tokenHash),
    index("sessions_user_id_idx").on(t.userId),
  ],
);

export const runs = pgTable(
  "runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mode: practiceMode("mode").notNull(),
    config: jsonb("config").notNull().default({}),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    total: integer("total").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    durationMs: integer("duration_ms"),
  },
  (t) => [index("runs_user_started_idx").on(t.userId, t.startedAt)],
);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    mode: practiceMode("mode").notNull(),
    runId: uuid("run_id").references(() => runs.id, { onDelete: "set null" }),
    topicId: text("topic_id").notNull(),
    skillId: text("skill_id").notNull(),
    generatorId: text("generator_id").notNull(),
    seed: integer("seed").notNull(),
    difficulty: integer("difficulty").notNull(),
    /** stem + answer + steps, so a missed question can be replayed exactly */
    questionSnapshot: jsonb("question_snapshot").notNull(),
    userAnswer: text("user_answer"),
    isCorrect: boolean("is_correct").notNull(),
    timeMs: integer("time_ms").notNull().default(0),
    hintsUsed: integer("hints_used").notNull().default(0),
    stepsRevealed: boolean("steps_revealed").notNull().default(false),
    /** Asia/Bangkok calendar day, computed at write time (section 8). */
    day: date("day").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("attempts_user_day_idx").on(t.userId, t.day),
    index("attempts_user_skill_idx").on(t.userId, t.skillId),
    index("attempts_user_created_idx").on(t.userId, t.createdAt.desc()),
    index("attempts_run_idx").on(t.runId),
    check("attempts_difficulty_range", sql`${t.difficulty} between 1 and 4`),
  ],
);

export const dailyStats = pgTable(
  "daily_stats",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    attempts: integer("attempts").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    timeMs: integer("time_ms").notNull().default(0),
    xp: integer("xp").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

export const skillMastery = pgTable(
  "skill_mastery",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: text("skill_id").notNull(),
    attempts: integer("attempts").notNull().default(0),
    correct: integer("correct").notNull().default(0),
    emaAccuracy: real("ema_accuracy").notNull().default(0),
    level: integer("level").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skillId] })],
);

/**
 * Failed-attempt ledger backing the login and invite-redemption rate limits.
 * A table rather than an in-memory map, because every Vercel invocation is a
 * fresh process.
 */
export const authFailures = pgTable(
  "auth_failures",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** bucket key, e.g. login:user:somebody or invite:ip:1.2.3.4 */
    key: text("key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("auth_failures_key_created_idx").on(t.key, t.createdAt)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type InviteCode = typeof inviteCodes.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Attempt = typeof attempts.$inferSelect;
export type NewAttempt = typeof attempts.$inferInsert;
export type Run = typeof runs.$inferSelect;
