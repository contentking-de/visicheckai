"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Sparkles, Loader2, Check } from "lucide-react";

type FanoutResult = {
  question: string;
  fanout: string[];
  selected: boolean;
  fanoutSelected: boolean[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (prompts: string[]) => void;
};

export function GeneratePromptsSheet({ open, onOpenChange, onImport }: Props) {
  const t = useTranslations("GeneratePrompts");
  const tc = useTranslations("Common");
  const [keyword, setKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<FanoutResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!keyword.trim()) return;
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch("/api/prompt-sets/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
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
    onImport(prompts);
    onOpenChange(false);
    setKeyword("");
    setResults([]);
  };

  const selectedCount = results.reduce((acc, r) => {
    let count = r.selected ? 1 : 0;
    count += r.fanoutSelected.filter(Boolean).length;
    return acc + count;
  }, 0);

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

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
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
                disabled={isLoading || !keyword.trim()}
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
