"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";

type PromptSet = {
  id: string;
  name: string;
  prompts: string[];
};

export function PromptSetForm({ promptSet }: { promptSet?: PromptSet }) {
  const router = useRouter();
  const t = useTranslations("PromptSetForm");
  const tc = useTranslations("Common");
  const [name, setName] = useState(promptSet?.name ?? "");
  const [prompts, setPrompts] = useState<string[]>(
    promptSet?.prompts?.length ? promptSet.prompts : [""]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPrompt = () => setPrompts((p) => [...p, ""]);
  const removePrompt = (i: number) =>
    setPrompts((p) => p.filter((_, j) => j !== i));
  const updatePrompt = (i: number, v: string) =>
    setPrompts((p) => p.map((x, j) => (j === i ? v : x)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validPrompts = prompts.filter((p) => p.trim());
    if (validPrompts.length === 0) {
      setError(t("minOnePrompt"));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const url = promptSet
        ? `/api/prompt-sets/${promptSet.id}`
        : "/api/prompt-sets";
      const method = promptSet ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, prompts: validPrompts }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? tc("error"));
      }
      router.push("/dashboard/prompt-sets");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {promptSet ? t("editTitle") : t("newTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{tc("name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("promptsLabel")}</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPrompt}>
                <Plus className="h-4 w-4 mr-1" />
                {t("addPrompt")}
              </Button>
            </div>
            <div className="space-y-2">
              {prompts.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <Textarea
                    value={p}
                    onChange={(e) => updatePrompt(i, e.target.value)}
                    placeholder={t("promptPlaceholder")}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrompt(i)}
                    disabled={prompts.length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? tc("saving") : promptSet ? tc("save") : tc("create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
