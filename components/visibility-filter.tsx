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

interface PromptSetOption {
  id: string;
  name: string;
  domainIds: string[];
}

export function VisibilityFilter({
  domains,
  promptSets,
}: {
  domains: DomainOption[];
  promptSets: PromptSetOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Visibility");

  const currentDomain = searchParams.get("domain") ?? "";
  const currentPromptSet = searchParams.get("promptSet") ?? "";
  const hasFilters = currentDomain || currentPromptSet;

  const filteredPromptSets = useMemo(
    () =>
      currentDomain
        ? promptSets.filter((ps) => ps.domainIds.includes(currentDomain))
        : promptSets,
    [promptSets, currentDomain]
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
