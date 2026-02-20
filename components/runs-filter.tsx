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

interface FilterOption {
  id: string;
  name: string;
}

interface PromptSetFilterOption extends FilterOption {
  intentCategories: string[];
}

export function RunsFilter({
  domains,
  promptSets,
}: {
  domains: FilterOption[];
  promptSets: PromptSetFilterOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Runs");
  const tg = useTranslations("GeneratePrompts");

  const currentDomain = searchParams.get("domain") ?? "";
  const currentPromptSet = searchParams.get("promptSet") ?? "";
  const currentCategory = searchParams.get("category") ?? "";
  const hasFilters = currentDomain || currentPromptSet || currentCategory;

  const filteredPromptSets = useMemo(() => {
    if (!currentCategory) return promptSets;
    return promptSets.filter((ps) => ps.intentCategories.includes(currentCategory));
  }, [promptSets, currentCategory]);

  const availablePhases = useMemo(() => {
    const all = new Set<string>();
    for (const ps of promptSets) {
      for (const cat of ps.intentCategories) all.add(cat);
    }
    return FUNNEL_PHASES.filter((phase) => all.has(phase) || all.size === 0);
  }, [promptSets]);

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
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
        <SelectTrigger className="w-[200px]">
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
        <SelectTrigger className="w-[200px]">
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
