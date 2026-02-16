"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Domain = { id: string; name: string; domainUrl: string };
type PromptSet = { id: string; name: string; prompts: string[] };

export function ConfigForm() {
  const router = useRouter();
  const t = useTranslations("ConfigForm");
  const tc = useTranslations("Common");
  const [domains, setDomains] = useState<Domain[]>([]);
  const [promptSets, setPromptSets] = useState<PromptSet[]>([]);
  const [domainId, setDomainId] = useState<string>("");
  const [promptSetId, setPromptSetId] = useState<string>("");
  const [interval, setInterval] = useState<string>("on_demand");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/domains").then((r) => r.json()),
      fetch("/api/prompt-sets").then((r) => r.json()),
    ]).then(([d, p]) => {
      setDomains(d);
      setPromptSets(p);
      if (d.length) setDomainId(d[0].id);
      if (p.length) setPromptSetId(p[0].id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainId || !promptSetId) {
      setError(t("needBoth"));
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tracking-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId, promptSetId, interval }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? tc("error"));
      }
      router.push("/dashboard/configs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tc("error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (domains.length === 0 || promptSets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("needDomainAndPromptSet")}{" "}
          <a href="/dashboard/domains/new" className="text-primary underline">
            {t("aDomain")}
          </a>{" "}
          {t("and")}{" "}
          <a href="/dashboard/prompt-sets/new" className="text-primary underline">
            {t("aPromptSet")}
          </a>{" "}
          {t("createThem")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("domainLabel")}</Label>
            <Select value={domainId} onValueChange={setDomainId}>
              <SelectTrigger>
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
          </div>
          <div className="space-y-2">
            <Label>{t("promptSetLabel")}</Label>
            <Select value={promptSetId} onValueChange={setPromptSetId}>
              <SelectTrigger>
                <SelectValue placeholder={t("selectPromptSet")} />
              </SelectTrigger>
              <SelectContent>
                {promptSets.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("intervalLabel")}</Label>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_demand">{t("onDemandLabel")}</SelectItem>
                <SelectItem value="daily">{t("dailyLabel")}</SelectItem>
                <SelectItem value="weekly">{t("weeklyLabel")}</SelectItem>
                <SelectItem value="monthly">{t("monthlyLabel")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? tc("creating") : tc("create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
