"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
import { useCallback } from "react";

interface FilterOption {
  id: string;
  name: string;
}

export function RunsFilter({
  domains,
  promptSets,
}: {
  domains: FilterOption[];
  promptSets: FilterOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Runs");

  const currentDomain = searchParams.get("domain") ?? "";
  const currentPromptSet = searchParams.get("promptSet") ?? "";
  const hasFilters = currentDomain || currentPromptSet;

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
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
        value={currentPromptSet}
        onValueChange={(v) => updateFilter("promptSet", v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t("filterByPromptSet")} />
        </SelectTrigger>
        <SelectContent>
          {promptSets.map((ps) => (
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
