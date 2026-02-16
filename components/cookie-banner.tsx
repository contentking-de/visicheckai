"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

const CONSENT_KEY = "visicheck_cookie_consent";

type ConsentState = "all" | "essential" | "loading" | null;

function getStoredConsent(): "all" | "essential" | null {
  if (typeof window === "undefined") return null;
  const val = localStorage.getItem(CONSENT_KEY);
  if (val === "all" || val === "essential") return val;
  return null;
}

export function CookieBanner() {
  const t = useTranslations("CookieBanner");
  const [consent, setConsent] = useState<ConsentState>("loading");
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    if (!stored) {
      setShowBanner(true);
    }
  }, []);

  function accept(value: "all" | "essential") {
    localStorage.setItem(CONSENT_KEY, value);
    setConsent(value);
    setShowBanner(false);
  }

  function reopen() {
    setShowBanner(true);
  }

  if (consent === "loading") return null;

  return (
    <>
      {/* Banner */}
      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6">
          <div className="mx-auto max-w-2xl rounded-2xl border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{t("title")}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {t("description")}{" "}
                    <Link
                      href="/datenschutz"
                      className="underline underline-offset-4 transition-colors hover:text-foreground"
                    >
                      {t("privacyLink")}
                    </Link>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => accept("essential")}
              >
                {t("essentialOnly")}
              </Button>
              <Button size="sm" onClick={() => accept("all")}>
                {t("acceptAll")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cookie Icon */}
      {!showBanner && consent !== "loading" && (
        <button
          type="button"
          onClick={reopen}
          className="fixed bottom-5 left-5 z-[99] flex h-11 w-11 items-center justify-center rounded-full border bg-card shadow-lg transition-all hover:scale-110 hover:shadow-xl"
          aria-label={t("manage")}
          title={t("manage")}
        >
          <Cookie className="h-5 w-5 text-muted-foreground" />
        </button>
      )}
    </>
  );
}
