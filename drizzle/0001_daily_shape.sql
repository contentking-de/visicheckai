CREATE TABLE "favicons" (
	"domain" text PRIMARY KEY NOT NULL,
	"blob_url" text NOT NULL,
	"fetched_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"phone" text,
	"company_name" text,
	"company_street" text,
	"company_zip" text,
	"company_city" text,
	"company_country" text,
	"billing_different" boolean DEFAULT false,
	"billing_company_name" text,
	"billing_street" text,
	"billing_zip" text,
	"billing_city" text,
	"billing_country" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;