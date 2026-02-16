"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
      setError("Bitte Domain und Prompt-Set wählen");
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
        throw new Error(data.error ?? "Fehler");
      }
      router.push("/dashboard/configs");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setIsLoading(false);
    }
  };

  if (domains.length === 0 || promptSets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Bitte zuerst{" "}
          <a href="/dashboard/domains/new" className="text-primary underline">
            eine Domain
          </a>{" "}
          und{" "}
          <a href="/dashboard/prompt-sets/new" className="text-primary underline">
            ein Prompt-Set
          </a>{" "}
          anlegen.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neue Konfiguration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Domain</Label>
            <Select value={domainId} onValueChange={setDomainId}>
              <SelectTrigger>
                <SelectValue placeholder="Domain wählen" />
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
            <Label>Prompt-Set</Label>
            <Select value={promptSetId} onValueChange={setPromptSetId}>
              <SelectTrigger>
                <SelectValue placeholder="Prompt-Set wählen" />
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
            <Label>Intervall</Label>
            <Select value={interval} onValueChange={setInterval}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="on_demand">On-demand (nur manuell)</SelectItem>
                <SelectItem value="daily">Täglich</SelectItem>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
                <SelectItem value="monthly">Monatlich</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Wird erstellt…" : "Erstellen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
