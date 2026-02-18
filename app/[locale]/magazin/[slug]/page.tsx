import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { magazineArticles, magazineArticleTranslations, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { defaultLocale } from "@/i18n/config";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNav } from "@/components/mobile-nav";
import { ArrowLeft, Calendar, User } from "lucide-react";

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

  return {
    title: `${article.title} – ${t("articleTitleSuffix")}`,
    description: article.excerpt ?? undefined,
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
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {tLanding("login")}
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {tLanding("signUp")}
            </Link>
          </div>
          <div className="md:hidden">
            <MobileNav loginLabel={tLanding("login")} signUpLabel={tLanding("signUp")} />
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
              <span className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                {row.authorName}
              </span>
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
