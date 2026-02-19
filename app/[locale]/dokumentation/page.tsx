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
  Globe,
  MessageSquare,
  Settings,
  Play,
  Users as UsersIcon,
  BarChart3,
  Link2,
  Heart,
  CreditCard,
  Bot,
  Check,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Documentation");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      languages: buildHreflangAlternates("/dokumentation"),
    },
  };
}

function FeatureSection({
  icon: Icon,
  title,
  description,
  features,
  reverse = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: string[];
  reverse?: boolean;
}) {
  return (
    <div
      className={`grid items-start gap-10 lg:grid-cols-2 ${reverse ? "lg:direction-rtl" : ""}`}
    >
      <div className={reverse ? "lg:order-2" : ""}>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </h3>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      <div className={reverse ? "lg:order-1" : ""}>
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg border bg-card px-5 py-4">
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <span className="font-medium">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default async function DocumentationPage() {
  const t = await getTranslations("Documentation");
  const tLanding = await getTranslations("Landing");

  return (
    <div className="min-h-screen bg-background">
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

        {/* Overview */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {t("overviewTitle")}
            </h2>
            <div className="mt-8 space-y-6 text-lg leading-relaxed text-muted-foreground">
              <p>{t("overviewP1")}</p>
              <p>{t("overviewP2")}</p>
            </div>
          </div>
        </section>

        {/* Supported AI Models */}
        <section className="border-y bg-muted/40 py-20 sm:py-24">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              {t("modelsTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              {t("modelsDesc")}
            </p>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {[
                { key: "modelChatGPT" as const, icon: Bot },
                { key: "modelGemini" as const, icon: Globe },
                { key: "modelClaude" as const, icon: MessageSquare },
                { key: "modelPerplexity" as const, icon: Link2 },
              ].map(({ key, icon: ModelIcon }) => (
                <div key={key} className="flex items-start gap-4 rounded-xl border bg-card p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ModelIcon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium">{t(key)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Sections */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-5xl space-y-24 px-4">
            <FeatureSection
              icon={Globe}
              title={t("domainsTitle")}
              description={t("domainsDesc")}
              features={[t("domainsFeature1"), t("domainsFeature2"), t("domainsFeature3")]}
            />

            <FeatureSection
              icon={MessageSquare}
              title={t("promptSetsTitle")}
              description={t("promptSetsDesc")}
              features={[t("promptSetsFeature1"), t("promptSetsFeature2"), t("promptSetsFeature3")]}
              reverse
            />

            <FeatureSection
              icon={Settings}
              title={t("configsTitle")}
              description={t("configsDesc")}
              features={[t("configsFeature1"), t("configsFeature2"), t("configsFeature3")]}
            />

            <FeatureSection
              icon={Play}
              title={t("runsTitle")}
              description={t("runsDesc")}
              features={[t("runsFeature1"), t("runsFeature2"), t("runsFeature3")]}
              reverse
            />

            <FeatureSection
              icon={BarChart3}
              title={t("competitorTitle")}
              description={t("competitorDesc")}
              features={[t("competitorFeature1"), t("competitorFeature2"), t("competitorFeature3")]}
            />

            <FeatureSection
              icon={Link2}
              title={t("sourcesTitle")}
              description={t("sourcesDesc")}
              features={[t("sourcesFeature1"), t("sourcesFeature2"), t("sourcesFeature3")]}
              reverse
            />

            <FeatureSection
              icon={Heart}
              title={t("sentimentTitle")}
              description={t("sentimentDesc")}
              features={[t("sentimentFeature1"), t("sentimentFeature2"), t("sentimentFeature3")]}
            />
          </div>
        </section>

        {/* Team & Pricing */}
        <section className="border-y bg-muted/40 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl space-y-24 px-4">
            <FeatureSection
              icon={UsersIcon}
              title={t("teamTitle")}
              description={t("teamDesc")}
              features={[t("teamFeature1"), t("teamFeature2"), t("teamFeature3")]}
              reverse
            />

            <FeatureSection
              icon={CreditCard}
              title={t("pricingTitle")}
              description={t("pricingDesc")}
              features={[t("pricingFeature1"), t("pricingFeature2"), t("pricingFeature3")]}
            />
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

      {/* Footer */}
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
            © {new Date().getFullYear()} visicheck.ai
          </div>
        </div>
      </footer>
    </div>
  );
}
