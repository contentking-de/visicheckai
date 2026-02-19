"use client";

import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useCallback, useMemo } from "react";

interface DomainOption {
  id: string;
  name: string;
}

interface RunOption {
  id: string;
  domainId: string;
  domainName: string;
  startedAt: string;
}

export function SentimentFilter({
  domains,
  runs,
}: {
  domains: DomainOption[];
  runs: RunOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Sentiment");

  const currentDomain = searchParams.get("domain") ?? "";
  const currentRun = searchParams.get("runId") ?? "";
  const hasFilters = currentDomain || currentRun;

  const filteredRuns = useMemo(
    () => (currentDomain ? runs.filter((r) => r.domainId === currentDomain) : runs),
    [runs, currentDomain]
  );

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key === "domain") {
        params.delete("runId");
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const formatRunLabel = (run: RunOption) => {
    const date = new Date(run.startedAt).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${run.domainName} · ${date}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={currentDomain}
        onValueChange={(v) => updateFilter("domain", v)}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder={t("filterByDomain")} />
        </SelectTrigger>
        <SelectContent>
          {domains.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentRun}
        onValueChange={(v) => updateFilter("runId", v)}
      >
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder={t("filterByRun")} />
        </SelectTrigger>
        <SelectContent>
          {filteredRuns.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {formatRunLabel(r)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          {t("clearFilters")}
        </Button>
      )}
    </div>
  );
}
