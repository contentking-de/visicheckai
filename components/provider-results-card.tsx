"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExpandableResponse } from "@/components/expandable-response";
import { ExpandableCitations } from "@/components/expandable-citations";
import { ProviderIcon } from "@/components/provider-badge";
import { PROVIDER_LABELS } from "@/lib/providers";
import type { ProviderName } from "@/lib/providers";

type FilterValue = "all" | "with" | "without";

interface ResultItem {
  prompt: string;
  response: string;
  mentions: number;
  citationCount: number;
  ownDomainCited: boolean;
  citations: string[];
}

interface ProviderResultsCardProps {
  provider: string;
  items: ResultItem[];
  translations: {
    prompt: string;
    mentions: string;
    citations: string;
    responseExcerpt: string;
    filterAll: string;
    filterWithMention: string;
    filterWithoutMention: string;
    filterWithSource: string;
    filterWithoutSource: string;
    noMatchingResults: string;
  };
}

function FilterToggle({
  value,
  onChange,
  options,
}: {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
  options: { all: string; with: string; without: string };
}) {
  const items: { key: FilterValue; label: string }[] = [
    { key: "all", label: options.all },
    { key: "with", label: options.with },
    { key: "without", label: options.without },
  ];

  return (
    <div className="inline-flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`rounded-md px-2.5 py-1 transition-colors ${
            value === item.key
              ? "bg-background text-foreground shadow-sm font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function ProviderResultsCard({
  provider,
  items,
  translations: t,
}: ProviderResultsCardProps) {
  const [mentionFilter, setMentionFilter] = useState<FilterValue>("all");
  const [sourceFilter, setSourceFilter] = useState<FilterValue>("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (mentionFilter === "with" && item.mentions === 0) return false;
      if (mentionFilter === "without" && item.mentions > 0) return false;
      if (sourceFilter === "with" && item.citationCount === 0) return false;
      if (sourceFilter === "without" && item.citationCount > 0) return false;
      return true;
    });
  }, [items, mentionFilter, sourceFilter]);

  const mentionCounts = useMemo(() => ({
    with: items.filter((i) => i.mentions > 0).length,
    without: items.filter((i) => i.mentions === 0).length,
  }), [items]);

  const sourceCounts = useMemo(() => ({
    with: items.filter((i) => i.citationCount > 0).length,
    without: items.filter((i) => i.citationCount === 0).length,
  }), [items]);

  const hasActiveFilter = mentionFilter !== "all" || sourceFilter !== "all";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ProviderIcon provider={provider as ProviderName} size={20} />
          {PROVIDER_LABELS[provider] ?? provider}
        </CardTitle>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">{t.mentions}:</span>
            <FilterToggle
              value={mentionFilter}
              onChange={setMentionFilter}
              options={{
                all: `${t.filterAll} (${items.length})`,
                with: `${t.filterWithMention} (${mentionCounts.with})`,
                without: `${t.filterWithoutMention} (${mentionCounts.without})`,
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">{t.citations}:</span>
            <FilterToggle
              value={sourceFilter}
              onChange={setSourceFilter}
              options={{
                all: `${t.filterAll} (${items.length})`,
                with: `${t.filterWithSource} (${sourceCounts.with})`,
                without: `${t.filterWithoutSource} (${sourceCounts.without})`,
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t.noMatchingResults}
          </p>
        ) : (
          <>
            {hasActiveFilter && (
              <p className="mb-3 text-xs text-muted-foreground">
                {filtered.length} / {items.length}
              </p>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.prompt}</TableHead>
                    <TableHead>{t.mentions}</TableHead>
                    <TableHead>{t.citations}</TableHead>
                    <TableHead>{t.responseExcerpt}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="max-w-[200px] truncate">
                        {item.prompt}
                      </TableCell>
                      <TableCell>{item.mentions}</TableCell>
                      <TableCell>
                        <ExpandableCitations
                          citations={item.citations}
                          ownDomainCited={item.ownDomainCited}
                          count={item.citationCount}
                        />
                      </TableCell>
                      <TableCell className="max-w-[400px]">
                        <ExpandableResponse text={item.response} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
