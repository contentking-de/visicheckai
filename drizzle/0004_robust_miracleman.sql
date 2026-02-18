CREATE TABLE "magazine_article_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "magazine_article_translations" ADD CONSTRAINT "magazine_article_translations_article_id_magazine_articles_id_fk" FOREIGN KEY ("article_id") REFERENCES "public"."magazine_articles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_translations_unique" ON "magazine_article_translations" USING btree ("article_id","locale");--> statement-breakpoint
CREATE INDEX "article_translations_locale" ON "magazine_article_translations" USING btree ("locale");--> statement-breakpoint
CREATE INDEX "article_translations_slug" ON "magazine_article_translations" USING btree ("slug");