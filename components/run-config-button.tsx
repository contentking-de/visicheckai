"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useState } from "react";

export function RunConfigButton({ configId }: { configId: string }) {
  const router = useRouter();
  const t = useTranslations("Runs");
  const [isLoading, setIsLoading] = useState(false);

  const handleRun = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/tracking/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configId }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/dashboard/runs/${data.runId}`);
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRun}
      disabled={isLoading}
    >
      <Play className="h-4 w-4 mr-1" />
      {isLoading ? t("running") : t("runNow")}
    </Button>
  );
}
