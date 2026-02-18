import { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { buildHreflangAlternates } from "@/lib/locale-href";
import { AuthButtons } from "@/components/auth-buttons";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileNav } from "@/components/mobile-nav";
import {
  ArrowRight,
  Wrench,
  BarChart3,
  Eye,
  ExternalLink,
  Check,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("About");
  return {
    title: t("metaTitle"),
    alternates: {
      languages: buildHreflangAlternates("/ueber-uns"),
    },
  };
}

export default async function AboutPage() {
  const t = await getTranslations("About");
  const tLanding = await getTranslations("Landing");

  return (
    <div className="min-h-screen bg-background">
      {/* Header – identisch zur Startseite */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Image src="/favicon.webp" alt="" width={24} height={24} className="h-6 w-6" />
            visicheck.ai
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {tLanding("navPricing")}
            </Link>
            <Link href="/#faq" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {tLanding("navFaq")}
            </Link>
            <LanguageSwitcher />
            <AuthButtons loginLabel={tLanding("login")} signUpLabel={tLanding("signUp")} dashboardLabel={tLanding("dashboard")} />
          </div>
          <MobileNav loginLabel={tLanding("login")} signUpLabel={tLanding("signUp")} dashboardLabel={tLanding("dashboard")} pricingLabel={tLanding("navPricing")} faqLabel={tLanding("navFaq")} />
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-black py-24 text-white sm:py-32 lg:py-40">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70 sm:text-xl">
              {t("heroSubtitle")}
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {t("storyTitle")}
            </h2>
            <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>{t("storyP1")}</p>
              <p>{t("storyP2")}</p>
              <p>{t("storyP3")}</p>
            </div>
          </div>
        </section>

        {/* Origin – contentking.de */}
        <section className="border-y bg-muted/40 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {t("originTitle")}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {t("originDesc")}
            </p>
            <div className="mt-6">
              <a
                href="https://contentking.de"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                contentking.de
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {t("valuesTitle")}
            </h2>
            <div className="mt-14 grid gap-10 sm:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t("value1Title")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("value1Desc")}
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t("value2Title")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("value2Desc")}
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{t("value3Title")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("value3Desc")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Why visicheck.ai – wiederverwendet von Startseite */}
        <section className="border-y bg-muted/40 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {tLanding("whyTitle")}
            </h2>
            <div className="mt-10 space-y-4 text-left">
              {(["whyPoint1", "whyPoint2", "whyPoint3", "whyPoint4"] as const).map(
                (key) => (
                  <div
                    key={key}
                    className="flex items-center gap-4 rounded-lg border bg-card px-6 py-4"
                  >
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                    <span className="font-medium">{tLanding(key)}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-primary-foreground sm:text-3xl lg:text-4xl">
              {t("ctaTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/70">
              {t("ctaDesc")}
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="h-14 px-10 text-lg"
              >
                <Link href="/sign-up">
                  {t("ctaButton")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer – identisch zur Startseite */}
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
            © {new Date().getFullYear()} visicheck.ai
          </div>
        </div>
      </footer>
    </div>
  );
}
