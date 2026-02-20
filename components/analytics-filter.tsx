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
import { FUNNEL_PHASES } from "@/lib/prompt-categories";

interface DomainOption {
  id: string;
  name: string;
}

interface PromptSetOption {
  id: string;
  name: string;
  domainIds: string[];
  intentCategories: string[];
}

export function AnalyticsFilter({
  domains,
  promptSets,
}: {
  domains: DomainOption[];
  promptSets: PromptSetOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Analytics");
  const tg = useTranslations("GeneratePrompts");

  const currentDomain = searchParams.get("domain") ?? "";
  const currentPromptSet = searchParams.get("promptSet") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const hasFilters = currentDomain || currentPromptSet || currentCategory;

  const filteredPromptSets = useMemo(() => {
    let sets = promptSets;
    if (currentDomain) {
      sets = sets.filter((ps) => ps.domainIds.includes(currentDomain));
    }
    if (currentCategory) {
      sets = sets.filter((ps) => ps.intentCategories.includes(currentCategory));
    }
    return sets;
  }, [promptSets, currentDomain, currentCategory]);

  const availablePhases = useMemo(() => {
    const all = new Set<string>();
    const relevant = currentDomain
      ? promptSets.filter((ps) => ps.domainIds.includes(currentDomain))
      : promptSets;
    for (const ps of relevant) {
      for (const cat of ps.intentCategories) all.add(cat);
    }
    return FUNNEL_PHASES.filter((phase) => all.has(phase) || all.size === 0);
  }, [promptSets, currentDomain]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key === "domain") {
        params.delete("promptSet");
      }
      if (key === "category") {
        params.delete("promptSet");
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

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
        value={currentCategory}
        onValueChange={(v) => updateFilter("category", v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t("filterByCategory")} />
        </SelectTrigger>
        <SelectContent>
          {availablePhases.map((phase) => (
            <SelectItem key={phase} value={phase}>
              {tg(`phase_${phase}` as Parameters<typeof tg>[0])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={currentPromptSet}
        onValueChange={(v) => updateFilter("promptSet", v)}
      >
        <SelectTrigger className="w-[260px]">
          <SelectValue placeholder={t("filterByPromptSet")} />
        </SelectTrigger>
        <SelectContent>
          {filteredPromptSets.map((ps) => (
            <SelectItem key={ps.id} value={ps.id}>
              {ps.name}
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
