"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CreditCard, Clock, AlertTriangle } from "lucide-react";
import type { AccessStatus } from "@/lib/access";

const ALWAYS_ALLOWED = ["/dashboard/billing", "/dashboard/profile", "/dashboard/team"];

function isAllowedPath(pathname: string): boolean {
  return ALWAYS_ALLOWED.some((p) => {
    const segments = pathname.split("/");
    const pathWithoutLocale = "/" + segments.slice(2).join("/");
    return pathWithoutLocale.startsWith(p);
  });
}

export function AccessGate({
  access,
  children,
}: {
  access: AccessStatus;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const t = useTranslations("Trial");

  if (access.hasAccess) {
    return (
      <>
        {access.isTrial && <TrialBanner daysLeft={access.trialDaysLeft} />}
        {children}
      </>
    );
  }

  if (isAllowedPath(pathname)) {
    return <>{children}</>;
  }

  return <Paywall />;
}

function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const t = useTranslations("Trial");

  return (
    <div className="border-b bg-amber-50 dark:bg-amber-950">
      <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            {t("bannerText", { days: daysLeft })}
          </span>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900">
          <Link href="/dashboard/billing">
            <CreditCard className="mr-1.5 h-3.5 w-3.5" />
            {t("upgradeCta")}
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Paywall() {
  const t = useTranslations("Trial");

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <AlertTriangle className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{t("expiredTitle")}</h2>
          <p className="text-muted-foreground">{t("expiredDescription")}</p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/dashboard/billing">
            <CreditCard className="mr-2 h-5 w-5" />
            {t("choosePlan")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
