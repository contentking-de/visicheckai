import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Search,
  BarChart3,
  Bot,
  Brain,
  Target,
  TrendingUp,
  RefreshCw,
  EyeOff,
  Activity,
  Download,
  Plug,
  Check,
  ArrowRight,
  Users,
  Globe,
  Mail,
  Zap,
  Phone,
  Calendar,
  User,
} from "lucide-react";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { buildHreflangAlternates } from "@/lib/locale-href";
import { auth } from "@/lib/auth";
import { AuthButtons } from "@/components/auth-buttons";
import { LanguageSwitcher } from "@/components/language-switcher";
import dynamic from "next/dynamic";

const MobileNav = dynamic(() =>
  import("@/components/mobile-nav").then((mod) => mod.MobileNav)
);

const FaqSection = dynamic(() =>
  import("@/components/faq-section").then((mod) => mod.FaqSection)
);
import { db } from "@/lib/db";
import { magazineArticles, magazineArticleTranslations, users } from "@/lib/schema";
import { desc, eq, and } from "drizzle-orm";
import { defaultLocale } from "@/i18n/config";

export async function generateMetadata() {
  const t = await getTranslations("Metadata");
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      languages: buildHreflangAlternates("/"),
    },
  };
}

export default async function LandingPage() {
  const [t, locale, session] = await Promise.all([
    getTranslations("Landing"),
    getLocale(),
    auth(),
  ]);

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
    .orderBy(desc(magazineArticles.publishedAt))
    .limit(3);

  let latestArticles = baseArticles;

  if (locale !== defaultLocale) {
    const articleIds = baseArticles.map((a) => a.id);
    if (articleIds.length > 0) {
      const translations = await db
        .select({
          articleId: magazineArticleTranslations.articleId,
          slug: magazineArticleTranslations.slug,
          title: magazineArticleTranslations.title,
          excerpt: magazineArticleTranslations.excerpt,
        })
        .from(magazineArticleTranslations)
        .where(eq(magazineArticleTranslations.locale, locale));

      const translationMap = new Map(translations.map((tr) => [tr.articleId, tr]));

      latestArticles = baseArticles.map((a) => {
        const tr = translationMap.get(a.id);
        if (!tr) return a;
        return { ...a, slug: tr.slug, title: tr.title, excerpt: tr.excerpt };
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Image src="/favicon.webp" alt="" width={24} height={24} className="h-6 w-6" />
            visicheck.ai
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t("navPricing")}
            </Link>
            <Link href="#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {t("navFaq")}
            </Link>
            <LanguageSwitcher />
            <AuthButtons loginLabel={t("login")} signUpLabel={t("signUp")} dashboardLabel={t("dashboard")} user={session?.user} />
          </div>
          <MobileNav loginLabel={t("login")} signUpLabel={t("signUp")} dashboardLabel={t("dashboard")} pricingLabel={t("navPricing")} faqLabel={t("navFaq")} isLoggedIn={!!session?.user} />
        </div>
      </header>

      <main>
        {/* Section 1: Hero – Kategorie definieren */}
        <section className="relative overflow-hidden bg-black py-24 text-white sm:py-32 lg:py-40">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <div className="mb-8 flex items-center justify-center gap-2.5">
              {[
                { src: "/chatgpt-icon.svg", alt: "ChatGPT", delay: "0s" },
                { src: "/claude-ai-icon.svg", alt: "Claude", delay: "0.3s" },
                { src: "/google-gemini-icon.svg", alt: "Google Gemini", delay: "0.6s" },
                { src: "/perplexity-ai-icon.svg", alt: "Perplexity", delay: "0.9s" },
                { src: "/deepseek-logo-icon.svg", alt: "DeepSeek", delay: "1.2s" },
                { src: "/grok-icon.svg", alt: "Grok", delay: "1.5s" },
              ].map((provider) => (
                <Image
                  key={provider.alt}
                  src={provider.src}
                  alt={provider.alt}
                  width={36}
                  height={36}
                  className="animate-gentle-bounce h-7 w-7 sm:h-9 sm:w-9"
                  style={{ animationDelay: provider.delay }}
                />
              ))}
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
              {t("heroSubtitle")}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="h-14 border border-white px-10 text-lg">
                <Link href="/sign-up">
                  {t("heroCta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 border-white bg-white px-10 text-lg text-black hover:bg-white/90"
              >
                <Link href="/login">{t("login")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 2: Kernproblem benennen */}
        <section className="border-y bg-muted/40 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {t("problemTitle")}
            </h2>
            <div className="mt-14 grid gap-10 sm:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  {t("problemPoint1Title")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("problemPoint1Desc")}
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <RefreshCw className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  {t("problemPoint2Title")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("problemPoint2Desc")}
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <EyeOff className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">
                  {t("problemPoint3Title")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("problemPoint3Desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Warum AI Search Visibility wichtig ist */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {t("whyAiVisTitle")}
            </h2>
            <div className="mt-14 grid gap-10 lg:grid-cols-2">
              <p className="leading-relaxed text-muted-foreground">
                {t("whyAiVisCol1")}
              </p>
              <p className="leading-relaxed text-muted-foreground">
                {t("whyAiVisCol2")}
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Core-USP-Bereich */}
        <section className="bg-black py-20 text-white sm:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mx-auto max-w-3xl text-center text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {t("uspSectionTitle")}
            </h2>
            <p className="mx-auto mb-14 mt-4 max-w-2xl text-center text-white/60">
              {t("uspSectionSubtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <div className="w-full rounded-xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t("usp1Title")}</h3>
                <p className="mt-2 leading-relaxed text-white/60">
                  {t("usp1Desc")}
                </p>
              </div>
              <div className="w-full rounded-xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t("usp2Title")}</h3>
                <p className="mt-2 leading-relaxed text-white/60">
                  {t("usp2Desc")}
                </p>
              </div>
              <div className="w-full rounded-xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t("usp3Title")}</h3>
                <p className="mt-2 leading-relaxed text-white/60">
                  {t("usp3Desc")}
                </p>
              </div>
              <div className="w-full rounded-xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t("usp4Title")}</h3>
                <p className="mt-2 leading-relaxed text-white/60">
                  {t("usp4Desc")}
                </p>
              </div>
              <div className="w-full rounded-xl border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t("usp5Title")}</h3>
                <p className="mt-2 leading-relaxed text-white/60">
                  {t("usp5Desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Technisch fundiert, aber praxisnah */}
        <section className="border-y bg-muted/40 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                  {t("techTitle")}
                </h2>
                <div className="mt-8 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{t("techPoint1")}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{t("techPoint2")}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Download className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{t("techPoint3")}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Plug className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{t("techPoint4")}</span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-8 sm:p-10">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t("techMessage1")}
                </p>
                <p className="mt-4 text-xl font-semibold leading-relaxed">
                  {t("techMessage2")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Einstiegshürde senken */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {t("startTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {t("startSubtitle")}
            </p>
            <div className="mt-14 grid gap-8 sm:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="mt-4 font-semibold">{t("startStep1Title")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("startStep1Desc")}
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="mt-4 font-semibold">{t("startStep2Title")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("startStep2Desc")}
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="mt-4 font-semibold">{t("startStep3Title")}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("startStep3Desc")}
                </p>
              </div>
            </div>
            <div className="mt-12">
              <Button asChild size="lg" className="h-14 px-10 text-lg">
                <Link href="/sign-up">
                  {t("heroCta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 6: Warum visicheck.ai – Identitätsblock */}
        <section className="border-y bg-muted/40 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {t("whyTitle")}
            </h2>
            <div className="mt-10 space-y-4 text-left">
              <div className="flex items-center gap-4 rounded-lg border bg-card px-6 py-4">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="font-medium">{t("whyPoint1")}</span>
              </div>
              <div className="flex items-center gap-4 rounded-lg border bg-card px-6 py-4">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="font-medium">{t("whyPoint2")}</span>
              </div>
              <div className="flex items-center gap-4 rounded-lg border bg-card px-6 py-4">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="font-medium">{t("whyPoint3")}</span>
              </div>
              <div className="flex items-center gap-4 rounded-lg border bg-card px-6 py-4">
                <Check className="h-5 w-5 shrink-0 text-primary" />
                <span className="font-medium">{t("whyPoint4")}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-primary py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl lg:text-4xl">
              {t("finalCtaTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/70">
              {t("finalCtaDesc")}
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-14 px-10 text-lg"
              >
                <Link href="/sign-up">
                  {t("finalCtaButton")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {t("pricingTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {t("pricingSubtitle")}
            </p>
            <div className="mt-14 grid gap-8 lg:grid-cols-3">
              {/* Starter */}
              <div className="flex flex-col rounded-2xl border bg-card p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("pricingStarterName")}
                </p>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold tracking-tight">
                    {t("pricingStarterPrice")}
                  </span>
                  <span className="text-2xl font-semibold text-muted-foreground">
                    {t("pricingCurrency")}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    {t("pricingPeriod")}
                  </span>
                </div>
                <ul className="mt-8 flex-1 space-y-4 text-left">
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{t("pricingStarterPrompts")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{t("pricingStarterMembers")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Globe className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{t("pricingAllCountries")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{t("pricingEmailSupport")}</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Button asChild variant="outline" size="lg" className="h-14 w-full px-10 text-lg">
                    <Link href="/sign-up">
                      {t("pricingStarterCta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Team (highlighted) */}
              <div className="relative flex flex-col rounded-2xl border-2 border-primary bg-card p-8 shadow-lg">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold uppercase tracking-wider text-primary-foreground">
                  {t("pricingTeamBadge")}
                </div>
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  {t("pricingTeamName")}
                </p>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold tracking-tight">
                    {t("pricingTeamPrice")}
                  </span>
                  <span className="text-2xl font-semibold text-muted-foreground">
                    {t("pricingCurrency")}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    {t("pricingPeriod")}
                  </span>
                </div>
                <ul className="mt-8 flex-1 space-y-4 text-left">
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{t("pricingTeamPrompts")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{t("pricingUnlimitedMembers")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Globe className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{t("pricingAllCountries")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{t("pricingEmailSupport")}</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Button asChild size="lg" className="h-14 w-full px-10 text-lg">
                    <Link href="/sign-up">
                      {t("pricingTeamCta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Professional */}
              <div className="flex flex-col rounded-2xl border bg-card p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("pricingProName")}
                </p>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold tracking-tight">
                    {t("pricingProPrice")}
                  </span>
                  <span className="text-2xl font-semibold text-muted-foreground">
                    {t("pricingCurrency")}
                  </span>
                  <span className="ml-1 text-muted-foreground">
                    {t("pricingPeriod")}
                  </span>
                </div>
                <ul className="mt-8 flex-1 space-y-4 text-left">
                  <li className="flex items-center gap-3">
                    <Zap className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{t("pricingProPrompts")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{t("pricingUnlimitedMembers")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Globe className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{t("pricingAllCountries")}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{t("pricingPhoneSupport")}</span>
                  </li>
                </ul>
                <div className="mt-8">
                  <Button asChild variant="outline" size="lg" className="h-14 w-full px-10 text-lg">
                    <Link href="/sign-up">
                      {t("pricingProCta")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection
          title={t("faqTitle")}
          subtitle={t("faqSubtitle")}
          items={Array.from({ length: 10 }, (_, i) => ({
            question: t(`faq${i + 1}Q`),
            answer: t(`faq${i + 1}A`),
          }))}
        />

        {/* Magazin – Neueste Artikel */}
        {latestArticles.length > 0 && (
          <section className="py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                {t("magazineSectionTitle")}
              </h2>
              <p className="mx-auto mt-4 mb-14 max-w-xl text-center text-muted-foreground">
                {t("magazineSectionSubtitle")}
              </p>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {latestArticles.map((article) => (
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
                      <h3 className="text-lg font-semibold leading-snug group-hover:text-primary">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {article.excerpt}
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                        {t("magazineReadMore")}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-12 text-center">
                <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
                  <Link href="/magazin">
                    {t("magazineAllArticles")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-20 bg-black pt-16 pb-8 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white"
              >
                <Image src="/favicon.webp" alt="" width={24} height={24} className="h-6 w-6 brightness-0 invert" />
                visicheck.ai
              </Link>
              <p className="mt-3 text-sm text-white/60">
                {t("footerTagline")}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                {t("footerLegal")}
              </h4>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/impressum"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {t("footerImprint")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/datenschutz"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {t("footerPrivacy")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/agb"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {t("footerTerms")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                {t("footerCompany")}
              </h4>
              <ul className="mt-4 space-y-3">
                <li>
                  <Link
                    href="/ueber-uns"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {t("footerAbout")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/magazin"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {t("footerMagazine")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dokumentation"
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {t("footerDocumentation")}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                {t("footerContact")}
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
            © {new Date().getFullYear()} visicheck.ai
          </div>
        </div>
      </footer>
    </div>
  );
}
