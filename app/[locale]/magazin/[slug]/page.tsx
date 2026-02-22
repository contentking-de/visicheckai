import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { magazineArticles, magazineArticleTranslations, users } from "@/lib/schema";
import { eq, and, desc, ne } from "drizzle-orm";
import { defaultLocale, type Locale } from "@/i18n/config";
import { buildHreflangAlternates } from "@/lib/locale-href";
import { AuthButtons } from "@/components/auth-buttons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNav } from "@/components/mobile-nav";
import { ArrowLeft, ArrowRight, Calendar, User } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

type ArticleResult = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: Date | null;
  authorName: string | null;
  correctSlug: string;
};

/**
 * Resolves an article from any slug (original DE or any translation).
 * Returns the article data for the current locale plus the correct slug
 * so we can redirect if the URL slug doesn't match.
 */
async function resolveArticle(
  slug: string,
  locale: string
): Promise<ArticleResult | null> {
  // 1) Try direct match on original (German) slug
  const [byOriginal] = await db
    .select({
      id: magazineArticles.id,
      slug: magazineArticles.slug,
      title: magazineArticles.title,
      content: magazineArticles.content,
      excerpt: magazineArticles.excerpt,
      coverImage: magazineArticles.coverImage,
      publishedAt: magazineArticles.publishedAt,
      authorName: users.name,
    })
    .from(magazineArticles)
    .leftJoin(users, eq(users.id, magazineArticles.authorId))
    .where(and(eq(magazineArticles.slug, slug), eq(magazineArticles.published, true)))
    .limit(1);

  // 2) If not found by original slug, search all translation slugs
  let articleId: string | null = byOriginal?.id ?? null;

  if (!byOriginal) {
    const [translationHit] = await db
      .select({ articleId: magazineArticleTranslations.articleId })
      .from(magazineArticleTranslations)
      .where(eq(magazineArticleTranslations.slug, slug))
      .limit(1);

    if (!translationHit) return null;
    articleId = translationHit.articleId;
  }

  // 3) Load base article (needed if we found via translation slug)
  const base = byOriginal ??
    (await (async () => {
      const [row] = await db
        .select({
          id: magazineArticles.id,
          slug: magazineArticles.slug,
          title: magazineArticles.title,
          content: magazineArticles.content,
          excerpt: magazineArticles.excerpt,
          coverImage: magazineArticles.coverImage,
          publishedAt: magazineArticles.publishedAt,
          authorName: users.name,
        })
        .from(magazineArticles)
        .leftJoin(users, eq(users.id, magazineArticles.authorId))
        .where(
          and(eq(magazineArticles.id, articleId!), eq(magazineArticles.published, true))
        )
        .limit(1);
      return row ?? null;
    })());

  if (!base) return null;

  // 4) For default locale, return original content with original slug
  if (locale === defaultLocale) {
    return { ...base, correctSlug: base.slug };
  }

  // 5) For other locales, look up translation for this locale
  const [translation] = await db
    .select({
      slug: magazineArticleTranslations.slug,
      title: magazineArticleTranslations.title,
      excerpt: magazineArticleTranslations.excerpt,
      content: magazineArticleTranslations.content,
    })
    .from(magazineArticleTranslations)
    .where(
      and(
        eq(magazineArticleTranslations.articleId, base.id),
        eq(magazineArticleTranslations.locale, locale)
      )
    )
    .limit(1);

  if (!translation) {
    return { ...base, correctSlug: base.slug };
  }

  return {
    id: base.id,
    title: translation.title,
    content: translation.content,
    excerpt: translation.excerpt,
    coverImage: base.coverImage,
    publishedAt: base.publishedAt,
    authorName: base.authorName,
    correctSlug: translation.slug,
  };
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("Magazine");
  const locale = await getLocale();
  const article = await resolveArticle(slug, locale);

  if (!article) return { title: t("articleNotFound") };

  const allTranslations = await db
    .select({
      locale: magazineArticleTranslations.locale,
      slug: magazineArticleTranslations.slug,
    })
    .from(magazineArticleTranslations)
    .where(eq(magazineArticleTranslations.articleId, article.id));

  const [baseArticle] = await db
    .select({ slug: magazineArticles.slug })
    .from(magazineArticles)
    .where(eq(magazineArticles.id, article.id))
    .limit(1);

  const slugsByLocale: Partial<Record<Locale, string>> = {
    [defaultLocale]: baseArticle?.slug ?? slug,
  };
  for (const tr of allTranslations) {
    slugsByLocale[tr.locale as Locale] = tr.slug;
  }

  return {
    title: `${article.title} – ${t("articleTitleSuffix")}`,
    description: article.excerpt ?? undefined,
    alternates: {
      languages: buildHreflangAlternates(`/magazin/${slug}`, slugsByLocale),
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const tLanding = await getTranslations("Landing");
  const t = await getTranslations("Magazine");
  const locale = await getLocale();

  const row = await resolveArticle(slug, locale);

  if (!row) notFound();

  if (row.correctSlug !== slug) {
    const prefix = locale === defaultLocale ? "" : `/${locale}`;
    redirect(`${prefix}/magazin/${row.correctSlug}`);
  }

  const recentBase = await db
    .select({
      id: magazineArticles.id,
      slug: magazineArticles.slug,
      title: magazineArticles.title,
      excerpt: magazineArticles.excerpt,
      coverImage: magazineArticles.coverImage,
      publishedAt: magazineArticles.publishedAt,
      authorName: users.name,
    })
    .from(magazineArticles)
    .leftJoin(users, eq(users.id, magazineArticles.authorId))
    .where(and(eq(magazineArticles.published, true), ne(magazineArticles.id, row.id)))
    .orderBy(desc(magazineArticles.publishedAt))
    .limit(3);

  let recentArticles = recentBase;
  if (locale !== defaultLocale) {
    const trIds = recentBase.map((a) => a.id);
    if (trIds.length > 0) {
      const translations = await db
        .select({
          articleId: magazineArticleTranslations.articleId,
          slug: magazineArticleTranslations.slug,
          title: magazineArticleTranslations.title,
          excerpt: magazineArticleTranslations.excerpt,
        })
        .from(magazineArticleTranslations)
        .where(eq(magazineArticleTranslations.locale, locale));

      const trMap = new Map(translations.map((t) => [t.articleId, t]));
      recentArticles = recentBase.map((a) => {
        const tr = trMap.get(a.id);
        if (!tr) return a;
        return { ...a, slug: tr.slug, title: tr.title, excerpt: tr.excerpt };
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-semibold tracking-tight"
          >
            <Image
              src="/favicon.webp"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6"
            />
            visicheck.ai
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/magazin"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {tLanding("footerMagazine")}
            </Link>
            <LanguageSwitcher />
            <AuthButtons loginLabel={tLanding("login")} signUpLabel={tLanding("signUp")} dashboardLabel={tLanding("dashboard")} />
          </div>
          <div className="md:hidden">
            <MobileNav loginLabel={tLanding("login")} signUpLabel={tLanding("signUp")} dashboardLabel={tLanding("dashboard")} />
          </div>
        </div>
      </header>

      <article className="py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <Link
            href="/magazin"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("backToMagazine")}
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {row.title}
          </h1>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            {row.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(row.publishedAt).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
            {row.authorName && (
              <a
                href="#autor"
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <User className="h-4 w-4" />
                {row.authorName}
              </a>
            )}
          </div>

          {row.coverImage && row.excerpt ? (
            <div className="mt-8 grid items-start gap-8 md:grid-cols-2">
              <div className="overflow-hidden rounded-xl">
                <img
                  src={row.coverImage}
                  alt={row.title}
                  className="w-full object-cover"
                />
              </div>
              <p className="text-lg font-bold leading-relaxed text-muted-foreground">
                {row.excerpt}
              </p>
            </div>
          ) : (
            <>
              {row.coverImage && (
                <div className="mt-8 overflow-hidden rounded-xl md:w-1/2">
                  <img
                    src={row.coverImage}
                    alt={row.title}
                    className="w-full object-cover"
                  />
                </div>
              )}
              {row.excerpt && (
              <p className="mt-8 text-lg font-bold leading-relaxed text-muted-foreground">
                {row.excerpt}
              </p>
              )}
            </>
          )}

          <div
            className="prose prose-lg mt-10 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-lg"
            dangerouslySetInnerHTML={{ __html: row.content }}
          />

          <div
            id="autor"
            className="mt-24 scroll-mt-24 rounded-2xl border bg-muted/40 p-6 md:p-8"
          >
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("authorBoxHeading")}
            </h3>
            <div className="mt-4 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <img
                src="/nicolas-sacotte.jpg"
                alt="Nicolas Sacotte"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover shrink-0"
              />
              <div>
                <p className="text-xl font-bold tracking-tight">Nicolas Sacotte</p>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground md:text-lg">
                  {t("authorBio")}
                </p>
              </div>
            </div>
          </div>

          {recentArticles.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-bold tracking-tight">
                {t("moreArticles")}
              </h2>
              <div className="mt-8 grid gap-8 md:grid-cols-3">
                {recentArticles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/magazin/${article.slug}`}
                    className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg"
                  >
                    {article.coverImage ? (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/9] items-center justify-center bg-muted">
                        <span className="text-4xl text-muted-foreground/30">✍️</span>
                      </div>
                    )}
                    <div className="p-5">
                      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                        {article.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(article.publishedAt).toLocaleDateString(locale, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        {article.authorName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {article.authorName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold leading-snug group-hover:text-primary">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {article.excerpt}
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                        {t("readMore")}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      <footer className="border-t bg-zinc-950 py-12 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold"
              >
                <Image
                  src="/favicon.webp"
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5"
                />
                visicheck.ai
              </Link>
              <p className="mt-3 text-sm text-white/60">
                {tLanding("footerTagline")}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                {tLanding("footerLegal")}
              </h4>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/impressum"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {tLanding("footerImprint")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/datenschutz"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {tLanding("footerPrivacy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/agb"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {tLanding("footerTerms")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                {tLanding("footerCompany")}
              </h4>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/ueber-uns"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {tLanding("footerAbout")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/magazin"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {tLanding("footerMagazine")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dokumentation"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {tLanding("footerDocumentation")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                {tLanding("footerContact")}
              </h4>
              <address className="mt-4 space-y-1 text-sm not-italic text-white/60">
                <p>visicheck.ai</p>
                <p>Eisenbahnstrasse 1</p>
                <p>88677 Markdorf</p>
                <p>Germany</p>
              </address>
            </div>
          </div>

          <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-white/60">
            &copy; {new Date().getFullYear()} visicheck.ai
          </div>
        </div>
      </footer>
    </div>
  );
}
