"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ChecklistCategory } from "@/lib/checklist-data";

type Domain = {
  id: string;
  name: string;
  domainUrl: string;
};

type Props = {
  domains: Domain[];
  categories: ChecklistCategory[];
  totalItems: number;
};

export function VisibilityChecklist({ domains, categories, totalItems }: Props) {
  const t = useTranslations("Checklist");
  const [selectedDomainId, setSelectedDomainId] = useState<string>(
    domains[0]?.id ?? ""
  );
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchChecklist = useCallback(async (domainId: string) => {
    if (!domainId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/checklist?domainId=${domainId}`);
      if (res.ok) {
        const data = await res.json();
        setCheckedKeys(new Set(data.checkedKeys));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDomainId) {
      fetchChecklist(selectedDomainId);
    }
  }, [selectedDomainId, fetchChecklist]);

  const toggleItem = async (itemKey: string, checked: boolean) => {
    const newChecked = new Set(checkedKeys);
    if (checked) {
      newChecked.add(itemKey);
    } else {
      newChecked.delete(itemKey);
    }
    setCheckedKeys(newChecked);

    await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domainId: selectedDomainId,
        itemKey,
        checked,
      }),
    });
  };

  const checkedCount = checkedKeys.size;
  const progressPercent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const getCategoryProgress = (cat: ChecklistCategory) => {
    const done = cat.items.filter((item) => checkedKeys.has(item.key)).length;
    return { done, total: cat.items.length };
  };

  if (domains.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t("noDomains")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Domain selector + progress */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder={t("selectDomain")} />
          </SelectTrigger>
          <SelectContent>
            {domains.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name} ({d.domainUrl})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {checkedCount} / {totalItems} {t("completed")}
          </div>
          <Badge
            variant={progressPercent === 100 ? "default" : "secondary"}
            className="tabular-nums"
          >
            {progressPercent}%
          </Badge>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("loading")}
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={[categories[0]?.id]} className="space-y-3">
          {categories.map((cat) => {
            const { done, total } = getCategoryProgress(cat);
            const catPercent = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <AccordionItem
                key={cat.id}
                value={cat.id}
                className="rounded-lg border bg-card px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-3">
                    <span className="font-semibold">{t(cat.titleKey)}</span>
                    <Badge
                      variant={catPercent === 100 ? "default" : "outline"}
                      className="ml-auto mr-2 tabular-nums text-xs"
                    >
                      {done}/{total}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {cat.descriptionKey && (
                    <p className="mb-4 text-sm text-muted-foreground">
                      {t(cat.descriptionKey)}
                    </p>
                  )}
                  {/* Category progress bar */}
                  <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${catPercent}%` }}
                    />
                  </div>
                  <div className="space-y-3">
                    {cat.items.map((item) => {
                      const isChecked = checkedKeys.has(item.key);
                      return (
                        <label
                          key={item.key}
                          className="flex cursor-pointer items-start gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(val) =>
                              toggleItem(item.key, val === true)
                            }
                            className="mt-0.5"
                          />
                          <span
                            className={`text-sm leading-relaxed ${
                              isChecked
                                ? "text-muted-foreground line-through"
                                : ""
                            }`}
                          >
                            {t(item.labelKey)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
