ALTER TABLE "visibility_checklist" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "visibility_checklist" ADD COLUMN "assignee_id" text;--> statement-breakpoint
ALTER TABLE "visibility_checklist" ADD CONSTRAINT "visibility_checklist_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;