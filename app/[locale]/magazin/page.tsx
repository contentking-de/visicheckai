import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { magazineArticles, magazineArticleTranslations, users } from "@/lib/schema";
import { desc, eq, and } from "drizzle-orm";
import { defaultLocale } from "@/i18n/config";
import { buildHreflangAlternates } from "@/lib/locale-href";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNav } from "@/components/mobile-nav";
import { ArrowRight, Calendar, User } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("Magazine");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
    alternates: {
      languages: buildHreflangAlternates("/magazin"),
    },
  };
}

export const revalidate = 60;

export default async function MagazinPage() {
  const tLanding = await getTranslations("Landing");
  const t = await getTranslations("Magazine");
  const locale = await getLocale();

  const baseArticles = await db
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
    .where(and(eq(magazineArticles.published, true)))
    .orderBy(desc(magazineArticles.publishedAt));

  let articles = baseArticles;

  if (locale !== defaultLocale) {
    const translations = await db
      .select({
        articleId: magazineArticleTranslations.articleId,
        slug: magazineArticleTranslations.slug,
        title: magazineArticleTranslations.title,
        excerpt: magazineArticleTranslations.excerpt,
      })
      .from(magazineArticleTranslations)
      .where(eq(magazineArticleTranslations.locale, locale));

    const translationMap = new Map(translations.map((t) => [t.articleId, t]));

    articles = baseArticles.map((a) => {
      const tr = translationMap.get(a.id);
      if (!tr) return a;
      return {
        ...a,
        slug: tr.slug,
        title: tr.title,
        excerpt: tr.excerpt,
      };
    });
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
              href="/#pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {tLanding("navPricing")}
            </Link>
            <Link
              href="/#faq"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {tLanding("navFaq")}
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

      <section className="border-b bg-gradient-to-b from-muted/50 to-background py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t("heroSubtitle")}
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          {articles.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p className="text-lg">{t("emptyTitle")}</p>
              <p className="mt-2">{t("emptySubtitle")}</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
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
                      <span className="text-4xl text-muted-foreground/30">
                        ✍️
                      </span>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
                      {article.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.publishedAt).toLocaleDateString(
                            locale,
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </span>
                      )}
                      {article.authorName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {article.authorName}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-semibold leading-snug group-hover:text-primary">
                      {article.title}
                    </h2>
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
          )}
        </div>
      </section>

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
