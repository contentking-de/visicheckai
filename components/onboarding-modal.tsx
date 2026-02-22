"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  Globe,
  FileText,
  Settings,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

const STEPS = [
  {
    key: "domains" as const,
    icon: Globe,
    href: "/dashboard/domains/new",
  },
  {
    key: "prompts" as const,
    icon: FileText,
    href: "/dashboard/prompt-sets/new",
  },
  {
    key: "config" as const,
    icon: Settings,
    href: "/dashboard/configs/new",
  },
  {
    key: "team" as const,
    icon: Users,
    href: "/dashboard/team",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const t = useTranslations("Onboarding");
  const router = useRouter();

  const current = STEPS[step];

  function handleAction(href?: string) {
    setOpen(false);
    router.push(href ?? current.href);
  }

  return (
    <>
      <button
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title={t("title")}
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("subtitle")}</DialogDescription>
          </DialogHeader>

          <div className="mt-2 flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-10 rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="mt-4 rounded-xl border bg-muted/30 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <current.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("stepLabel", { current: step + 1, total: STEPS.length })}
                </p>
                <h3 className="text-lg font-semibold">
                  {t(`${current.key}Title`)}
                </h3>
              </div>
            </div>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {t(`${current.key}Desc`)}
            </p>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              {t("back")}
            </Button>

            <div className="flex gap-2">
              {step < STEPS.length - 1 ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleAction()}>
                    {t("goToStep")}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => setStep(step + 1)}>
                    {t("next")}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => handleAction(STEPS[0].href)}>
                  <Check className="mr-1 h-4 w-4" />
                  {t("finish")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
