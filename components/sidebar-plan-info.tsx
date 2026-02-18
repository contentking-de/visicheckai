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
      className="block rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-white transition-colors hover:bg-zinc-900"
    >
      <div className="flex items-center gap-2">
        {data.isTrial ? (
          <Zap className="h-3.5 w-3.5 text-amber-400" />
        ) : (
          <CreditCard className="h-3.5 w-3.5 text-white/70" />
        )}
        <span className="text-xs font-semibold text-white">{planLabel}</span>
      </div>

      {data.isTrial && data.trialDaysLeft > 0 && (
        <p className="mt-1 text-[11px] text-zinc-400">
          {t("trialDays", { days: data.trialDaysLeft })}
        </p>
      )}

      {limit > 0 && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-400">{t("prompts")}</span>
            <span className={`font-medium ${isLow ? "text-red-400" : "text-white"}`}>
              {used}/{limit}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
            <div
              className={`h-full rounded-full transition-all ${
                isLow ? "bg-red-500" : "bg-white"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  );
}
