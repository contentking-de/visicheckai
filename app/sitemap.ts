import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { magazineArticles, magazineArticleTranslations } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { locales, defaultLocale, type Locale } from "@/i18n/config";
import { getBaseUrl } from "@/lib/locale-href";

function localUrl(path: string, locale: Locale): string {
  const base = getBaseUrl().replace(/\/$/, "");
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${base}${prefix}${path}`;
}

type Alternates = { languages: Record<string, string> };

function buildAlternates(path: string): Alternates {
  const langs: Record<string, string> = {};
  for (const locale of locales) {
    langs[locale] = localUrl(path, locale);
  }
  langs["x-default"] = langs[defaultLocale];
  return { languages: langs };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "/",
    "/magazin",
    "/ueber-uns",
    "/impressum",
    "/datenschutz",
    "/agb",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: localUrl(path, locale),
      lastModified: new Date(),
      changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "/" ? 1.0 : 0.7,
      alternates: buildAlternates(path),
    }))
  );

  const articles = await db
    .select({
      id: magazineArticles.id,
      slug: magazineArticles.slug,
      updatedAt: magazineArticles.updatedAt,
    })
    .from(magazineArticles)
    .where(eq(magazineArticles.published, true));

  const translations = await db
    .select({
      articleId: magazineArticleTranslations.articleId,
      locale: magazineArticleTranslations.locale,
      slug: magazineArticleTranslations.slug,
    })
    .from(magazineArticleTranslations);

  const translationMap = new Map<string, Map<string, string>>();
  for (const t of translations) {
    if (!translationMap.has(t.articleId)) {
      translationMap.set(t.articleId, new Map());
    }
    translationMap.get(t.articleId)!.set(t.locale, t.slug);
  }

  const articleEntries: MetadataRoute.Sitemap = articles.flatMap((article) => {
    const slugs = translationMap.get(article.id);

    const langs: Record<string, string> = {};
    for (const locale of locales) {
      const slug =
        locale === defaultLocale
          ? article.slug
          : slugs?.get(locale) ?? article.slug;
      langs[locale] = localUrl(`/magazin/${slug}`, locale);
    }
    langs["x-default"] = langs[defaultLocale];

    return locales.map((locale) => {
      const slug =
        locale === defaultLocale
          ? article.slug
          : slugs?.get(locale) ?? article.slug;
      return {
        url: localUrl(`/magazin/${slug}`, locale),
        lastModified: article.updatedAt ?? new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: { languages: langs },
      };
    });
  });

  return [...staticEntries, ...articleEntries];
}
