CREATE TABLE "skill_reviews" (
	"user_id" uuid NOT NULL,
	"skill_id" text NOT NULL,
	"interval_days" integer DEFAULT 1 NOT NULL,
	"due_on" date NOT NULL,
	"consecutive_correct" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"ease" real,
	CONSTRAINT "skill_reviews_user_id_skill_id_pk" PRIMARY KEY("user_id","skill_id")
);
--> statement-breakpoint
ALTER TABLE "skill_reviews" ADD CONSTRAINT "skill_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "skill_reviews_user_due_idx" ON "skill_reviews" USING btree ("user_id","due_on");