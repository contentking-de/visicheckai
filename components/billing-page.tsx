"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ExternalLink, Loader2, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import type { PlanId } from "@/lib/schema";

type Subscription = {
  plan: PlanId;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
} | null;

type TrialInfo = {
  isTrial: boolean;
  daysLeft: number;
  endsAt: string | null;
  hasAccess: boolean;
} | null;

const PLAN_ORDER: PlanId[] = ["starter", "team", "professional"];

export function BillingPage() {
  const t = useTranslations("Billing");
  const tTrial = useTranslations("Trial");
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription>(null);
  const [trial, setTrial] = useState<TrialInfo>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/stripe/subscription");
      const data = await res.json();
      setSubscription(data.subscription);
      setTrial(data.trial);
    } catch {
      console.error("Failed to fetch subscription");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckout(planId: PlanId) {
    setCheckoutLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      console.error("Failed to create checkout session");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      console.error("Failed to create portal session");
    } finally {
      setPortalLoading(false);
    }
  }

  const isActive =
    subscription?.status === "active" || subscription?.status === "trialing";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm">{t("successMessage")}</p>
        </div>
      )}

      {canceled && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm">{t("canceledMessage")}</p>
        </div>
      )}

      {trial?.isTrial && !isActive && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Clock className="h-5 w-5" />
              {tTrial("trialCardTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {tTrial("trialCardDescription", { days: trial.daysLeft })}
            </p>
          </CardContent>
        </Card>
      )}

      {trial && !trial.hasAccess && !isActive && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-5 w-5" />
              {tTrial("expiredTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-700 dark:text-red-300">
              {tTrial("expiredBillingHint")}
            </p>
          </CardContent>
        </Card>
      )}

      {isActive && subscription && (
        <Card>
          <CardHeader>
            <CardTitle>{t("currentPlan")}</CardTitle>
            <CardDescription>{t("currentPlanDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-lg font-semibold capitalize">
                {t(`plan_${subscription.plan}`)}
              </span>
              <Badge variant={subscription.cancelAtPeriodEnd ? "secondary" : "default"}>
                {subscription.cancelAtPeriodEnd
                  ? t("cancelingAtEnd")
                  : t(`status_${subscription.status}`)}
              </Badge>
            </div>
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                {subscription.cancelAtPeriodEnd
                  ? t("endsOn", {
                      date: new Date(subscription.currentPeriodEnd).toLocaleDateString(),
                    })
                  : t("renewsOn", {
                      date: new Date(subscription.currentPeriodEnd).toLocaleDateString(),
                    })}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              {t("manageSubscription")}
            </Button>
          </CardFooter>
        </Card>
      )}

      <div>
        <h2 className="mb-4 text-lg font-semibold">
          {isActive ? t("changePlan") : t("choosePlan")}
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {PLAN_ORDER.map((planId) => {
            const isCurrent = isActive && subscription?.plan === planId;
            const isPopular = planId === "team";

            return (
              <Card
                key={planId}
                className={`relative flex flex-col ${
                  isPopular
                    ? "border-primary shadow-md"
                    : ""
                } ${isCurrent ? "ring-2 ring-primary" : ""}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    {t("popular")}
                  </Badge>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">{t(`plan_${planId}`)}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      €{t(`price_${planId}`)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t("perMonth")}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {t(`prompts_${planId}`)}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {t(`members_${planId}`)}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {t("allCountries")}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {planId === "professional"
                        ? t("phoneSupport")
                        : t("emailSupport")}
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      {t("currentPlanBadge")}
                    </Button>
                  ) : isActive ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handlePortal}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t("changePlan")}
                    </Button>
                  ) : (
                    <Button
                      className={`w-full ${isPopular ? "" : "variant-outline"}`}
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleCheckout(planId)}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === planId ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      {t("subscribe")}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
