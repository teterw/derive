ALTER TABLE "users" ADD COLUMN "avatar_image" "bytea";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_type" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_updated_at" timestamp with time zone;