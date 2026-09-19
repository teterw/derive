ALTER TABLE "users" ADD COLUMN "avatar_slot" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hide_from_leaderboard" boolean DEFAULT false NOT NULL;