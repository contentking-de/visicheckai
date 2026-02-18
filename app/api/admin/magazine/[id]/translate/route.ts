import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";
import {
  magazineArticles,
  magazineArticleTranslations,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import type { UserRole } from "@/lib/schema";
import { translateArticle } from "@/lib/translate-article";
import { locales, defaultLocale } from "@/i18n/config";

type RouteContext = { params: Promise<{ id: string }> };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** GET – fetch translation status for an article */
export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  const translations = await db
    .select({
      locale: magazineArticleTranslations.locale,
      updatedAt: magazineArticleTranslations.updatedAt,
    })
    .from(magazineArticleTranslations)
    .where(eq(magazineArticleTranslations.articleId, id));

  const targetLocales = locales.filter((l) => l !== defaultLocale);
  const status = targetLocales.map((locale) => {
    const t = translations.find((tr) => tr.locale === locale);
    return {
      locale,
      translated: !!t,
      updatedAt: t?.updatedAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json(status);
}

/** POST – trigger AI translation for selected locales */
export async function POST(req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const targetLocales: string[] = body.locales;

  if (
    !Array.isArray(targetLocales) ||
    targetLocales.length === 0 ||
    targetLocales.some((l) => !locales.includes(l as (typeof locales)[number]) || l === defaultLocale)
  ) {
    return NextResponse.json(
      { error: "Invalid locales. Must be non-default locales." },
      { status: 400 }
    );
  }

  const [article] = await db
    .select()
    .from(magazineArticles)
    .where(eq(magazineArticles.id, id))
    .limit(1);

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const results: { locale: string; success: boolean; error?: string }[] = [];

  for (const locale of targetLocales) {
    try {
      const translated = await translateArticle(
        {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
        },
        locale
      );

      const translatedSlug = slugify(translated.title) + "-" + Date.now().toString(36);

      const [existing] = await db
        .select({ id: magazineArticleTranslations.id })
        .from(magazineArticleTranslations)
        .where(
          and(
            eq(magazineArticleTranslations.articleId, id),
            eq(magazineArticleTranslations.locale, locale)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(magazineArticleTranslations)
          .set({
            title: translated.title,
            slug: translatedSlug,
            excerpt: translated.excerpt,
            content: translated.content,
            updatedAt: new Date(),
          })
          .where(eq(magazineArticleTranslations.id, existing.id));
      } else {
        await db.insert(magazineArticleTranslations).values({
          articleId: id,
          locale,
          slug: translatedSlug,
          title: translated.title,
          excerpt: translated.excerpt,
          content: translated.content,
        });
      }

      results.push({ locale, success: true });
    } catch (err) {
      results.push({
        locale,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ results });
}
