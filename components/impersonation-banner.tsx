"use client";

import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ImpersonationBanner({ teamName }: { teamName: string }) {
  const t = useTranslations("Impersonation");
  const router = useRouter();

  async function stop() {
    await fetch("/api/admin/impersonate", { method: "DELETE" });
    router.push("/dashboard/admin/users");
    router.refresh();
  }

  return (
    <div className="border-b bg-red-600 text-white">
      <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye className="h-4 w-4 shrink-0" />
          <span>{t("banner", { team: teamName })}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={stop}
          className="shrink-0 text-white hover:bg-red-700 hover:text-white"
        >
          <X className="mr-1 h-3.5 w-3.5" />
          {t("stop")}
        </Button>
      </div>
    </div>
  );
}
