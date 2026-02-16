import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, Shield, Zap, Globe } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function LandingPage() {
  const t = await getTranslations("Landing");

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-xl font-semibold">visicheck.ai</span>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Button asChild variant="ghost">
              <Link href="/login">{t("login")}</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">{t("signUp")}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-24">
        <section className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            {t("description")}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-12 px-8">
              <Link href="/sign-up">{t("cta")}</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8">
              <Link href="/login">{t("login")}</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto mt-32 grid max-w-5xl gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{t("featureDomains")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("featureDomainsDesc")}
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{t("featurePrompts")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("featurePromptsDesc")}
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{t("featureIntervals")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("featureIntervalsDesc")}
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{t("featurePasswordless")}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("featurePasswordlessDesc")}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
