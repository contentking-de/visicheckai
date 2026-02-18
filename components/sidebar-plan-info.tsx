"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CreditCard, Zap } from "lucide-react";

type PlanData = {
  plan: string | null;
  isTrial: boolean;
  trialDaysLeft: number;
  usage: { used: number; limit: number } | null;
};

export function SidebarPlanInfo() {
  const t = useTranslations("PlanInfo");
  const [data, setData] = useState<PlanData | null>(null);

  useEffect(() => {
    fetch("/api/stripe/subscription")
      .then((r) => r.json())
      .then((res) => {
        setData({
          plan: res.subscription?.plan ?? null,
          isTrial: res.trial?.isTrial ?? false,
          trialDaysLeft: res.trial?.daysLeft ?? 0,
          usage: res.usage ?? null,
        });
      })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const planLabel = data.isTrial
    ? t("trial")
    : data.plan
      ? t(`plan_${data.plan}`)
      : t("noPlan");

  const used = data.usage?.used ?? 0;
  const limit = data.usage?.limit ?? 0;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isLow = limit > 0 && pct >= 80;

  return (
    <Link
      href="/dashboard/billing"
      className="block rounded-lg border bg-card p-3 transition-colors hover:bg-muted/60"
    >
      <div className="flex items-center gap-2">
        {data.isTrial ? (
          <Zap className="h-3.5 w-3.5 text-amber-500" />
        ) : (
          <CreditCard className="h-3.5 w-3.5 text-primary" />
        )}
        <span className="text-xs font-semibold">{planLabel}</span>
      </div>

      {data.isTrial && data.trialDaysLeft > 0 && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t("trialDays", { days: data.trialDaysLeft })}
        </p>
      )}

      {limit > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{t("prompts")}</span>
            <span className={`font-medium ${isLow ? "text-red-500" : "text-foreground"}`}>
              {used}/{limit}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${
                isLow ? "bg-red-500" : "bg-primary"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
