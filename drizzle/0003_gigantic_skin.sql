CREATE TABLE "magazine_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"cover_image" text,
	"author_id" text NOT NULL,
	"published" boolean DEFAULT false,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "magazine_articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "magazine_articles" ADD CONSTRAINT "magazine_articles_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "magazine_articles_slug" ON "magazine_articles" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "magazine_articles_published" ON "magazine_articles" USING btree ("published","published_at");