CREATE TABLE "visibility_checklist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"team_id" uuid,
	"user_id" text NOT NULL,
	"item_key" text NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"checked_at" timestamp,
	"checked_by" text
);
--> statement-breakpoint
ALTER TABLE "visibility_checklist" ADD CONSTRAINT "visibility_checklist_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visibility_checklist" ADD CONSTRAINT "visibility_checklist_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visibility_checklist" ADD CONSTRAINT "visibility_checklist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visibility_checklist" ADD CONSTRAINT "visibility_checklist_checked_by_user_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "checklist_domain" ON "visibility_checklist" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "checklist_team" ON "visibility_checklist" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "checklist_domain_item" ON "visibility_checklist" USING btree ("domain_id","item_key");