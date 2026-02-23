CREATE TABLE "maturity_ratings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"team_id" uuid,
	"user_id" text NOT NULL,
	"item_key" text NOT NULL,
	"rating" integer NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "maturity_ratings" ADD CONSTRAINT "maturity_ratings_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maturity_ratings" ADD CONSTRAINT "maturity_ratings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maturity_ratings" ADD CONSTRAINT "maturity_ratings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "maturity_domain" ON "maturity_ratings" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "maturity_team" ON "maturity_ratings" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "maturity_domain_item" ON "maturity_ratings" USING btree ("domain_id","item_key");