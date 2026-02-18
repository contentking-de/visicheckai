CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"plan" text NOT NULL,
	"status" text NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscriptions_team" ON "subscriptions" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_sub" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_stripe_customer_id_unique" UNIQUE("stripe_customer_id");