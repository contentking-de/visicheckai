import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { magazineArticles, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNav } from "@/components/mobile-nav";
import { ArrowLeft, Calendar, User } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [article] = await db
    .select({ title: magazineArticles.title, excerpt: magazineArticles.excerpt })
    .from(magazineArticles)
    .where(and(eq(magazineArticles.slug, slug), eq(magazineArticles.published, true)))
    .limit(1);

  if (!article) return { title: "Artikel nicht gefunden" };

  return {
    title: `${article.title} – Magazin – visicheck.ai`,
    description: article.excerpt ?? undefined,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const tLanding = await getTranslations("Landing");

  const [row] = await db
    .select({
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

  if (!row) notFound();

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
            Zurück zum Magazin
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {row.title}
          </h1>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            {row.publishedAt && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(row.publishedAt).toLocaleDateString("de-DE", {
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
