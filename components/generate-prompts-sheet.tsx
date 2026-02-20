"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Sparkles,
  Loader2,
  Check,
  Eye,
  Scale,
  Target,
  Shield,
  Wrench,
} from "lucide-react";
import {
  FUNNEL_PHASES,
  PHASE_SUBCATEGORIES,
  type FunnelPhase,
} from "@/lib/prompt-categories";

const PHASE_ICONS: Record<FunnelPhase, React.ComponentType<{ className?: string }>> = {
  awareness: Eye,
  consideration: Scale,
  decision: Target,
  trust: Shield,
  usage: Wrench,
};

type FanoutResult = {
  question: string;
  fanout: string[];
  selected: boolean;
  fanoutSelected: boolean[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (prompts: string[], categories: string[]) => void;
};

export function GeneratePromptsSheet({ open, onOpenChange, onImport }: Props) {
  const t = useTranslations("GeneratePrompts");
  const tc = useTranslations("Common");
  const locale = useLocale();

  const [selectedPhases, setSelectedPhases] = useState<Set<FunnelPhase>>(new Set());
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FanoutResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const togglePhase = (phase: FunnelPhase) => {
    setSelectedPhases((prev) => {
      const next = new Set(prev);
      const subs = PHASE_SUBCATEGORIES[phase];
      if (next.has(phase)) {
        next.delete(phase);
        setSelectedSubs((prevSubs) => {
          const nextSubs = new Set(prevSubs);
          subs.forEach((s) => nextSubs.delete(s));
          return nextSubs;
        });
      } else {
        next.add(phase);
        setSelectedSubs((prevSubs) => {
          const nextSubs = new Set(prevSubs);
          subs.forEach((s) => nextSubs.add(s));
          return nextSubs;
        });
      }
      return next;
    });
  };

  const toggleSub = (phase: FunnelPhase, subId: string) => {
    setSelectedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) {
        next.delete(subId);
      } else {
        next.add(subId);
      }

      const phaseSubs = PHASE_SUBCATEGORIES[phase];
      const anySelected = phaseSubs.some((s) => (s === subId ? !prev.has(s) : next.has(s)));
      setSelectedPhases((prevPhases) => {
        const nextPhases = new Set(prevPhases);
        if (anySelected) {
          nextPhases.add(phase);
        } else {
          nextPhases.delete(phase);
        }
        return nextPhases;
      });

      return next;
    });
  };

  const handleGenerate = async () => {
    if (!keyword.trim() || selectedSubs.size === 0) return;
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch("/api/prompt-sets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          categories: Array.from(selectedSubs),
          locale,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? tc("errorGeneric"));
      }

      const data = await res.json();
      setResults(
        data.results.map((r: { question: string; fanout: string[] }) => ({
          ...r,
          selected: true,
          fanoutSelected: r.fanout.map(() => true),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("errorGeneric"));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleQuestion = (index: number) => {
    setResults((prev) =>
      prev.map((r, i) =>
        i === index
          ? {
              ...r,
              selected: !r.selected,
              fanoutSelected: r.fanoutSelected.map(() => !r.selected),
            }
          : r
      )
    );
  };

  const toggleFanout = (qIndex: number, fIndex: number) => {
    setResults((prev) =>
      prev.map((r, i) =>
        i === qIndex
          ? {
              ...r,
              fanoutSelected: r.fanoutSelected.map((s, j) =>
                j === fIndex ? !s : s
              ),
            }
          : r
      )
    );
  };

  const handleImport = () => {
    const prompts: string[] = [];
    results.forEach((r) => {
      if (r.selected) prompts.push(r.question);
      r.fanout.forEach((f, i) => {
        if (r.fanoutSelected[i]) prompts.push(f);
      });
    });
    onImport(prompts, Array.from(selectedSubs));
    onOpenChange(false);
    setKeyword("");
    setResults([]);
    setSelectedPhases(new Set());
    setSelectedSubs(new Set());
  };

  const selectedCount = results.reduce((acc, r) => {
    let count = r.selected ? 1 : 0;
    count += r.fanoutSelected.filter(Boolean).length;
    return acc + count;
  }, 0);

  const canGenerate = keyword.trim().length > 0 && selectedSubs.size > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t("title")}
          </SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          {/* Category Selection */}
          <div className="space-y-3">
            <div>
              <Label>{t("categoryLabel")}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("categoryHint")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {FUNNEL_PHASES.map((phase) => {
                const Icon = PHASE_ICONS[phase];
                const isActive = selectedPhases.has(phase);
                return (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => togglePhase(phase)}
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all ${
                      isActive
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium leading-tight">
                        {t(`phase_${phase}` as Parameters<typeof t>[0])}
                      </div>
                      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                        {t(`phase_${phase}_desc` as Parameters<typeof t>[0])}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Subcategory Refinement */}
            {selectedPhases.size > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">{t("subcategoryLabel")}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {FUNNEL_PHASES.filter((p) => selectedPhases.has(p)).flatMap(
                    (phase) =>
                      PHASE_SUBCATEGORIES[phase].map((subId) => {
                        const isActive = selectedSubs.has(subId);
                        return (
                          <Badge
                            key={subId}
                            variant={isActive ? "default" : "outline"}
                            className="cursor-pointer select-none text-xs"
                            onClick={() => toggleSub(phase, subId)}
                          >
                            {isActive && <Check className="h-2.5 w-2.5" />}
                            {t(`sub_${subId}` as Parameters<typeof t>[0])}
                          </Badge>
                        );
                      })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Keyword Input */}
          <div className="space-y-2">
            <Label htmlFor="keyword">{t("keywordLabel")}</Label>
            <div className="flex gap-2">
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t("keywordPlaceholder")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !canGenerate}
                size="sm"
                className="shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("generate")
                )}
              </Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {isLoading && (
            <div className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t("generating")}</span>
            </div>
          )}

          {results.length > 0 && !isLoading && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("selectHint")} ({selectedCount} {t("selected")})
              </p>
              {results.map((result, qIndex) => (
                <div key={qIndex} className="space-y-1">
                  <button
                    type="button"
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      result.selected
                        ? "border-primary bg-primary/5"
                        : "opacity-50"
                    }`}
                    onClick={() => toggleQuestion(qIndex)}
                  >
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                        result.selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                      }`}
                    >
                      {result.selected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="text-sm font-medium">
                      {result.question}
                    </span>
                  </button>
                  {result.fanout.length > 0 && (
                    <div className="ml-8 space-y-1">
                      {result.fanout.map((f, fIndex) => (
                        <button
                          key={fIndex}
                          type="button"
                          className={`flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                            result.fanoutSelected[fIndex]
                              ? "bg-muted/50"
                              : "opacity-40"
                          }`}
                          onClick={() => toggleFanout(qIndex, fIndex)}
                        >
                          <div
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                              result.fanoutSelected[fIndex]
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground"
                            }`}
                          >
                            {result.fanoutSelected[fIndex] && (
                              <Check className="h-2.5 w-2.5" />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {f}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {results.length > 0 && !isLoading && (
          <SheetFooter>
            <Button
              onClick={handleImport}
              disabled={selectedCount === 0}
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {t("importButton", { count: String(selectedCount) })}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
