"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Domain = {
  id: string;
  name: string;
  domainUrl: string;
};

export function DomainForm({ domain }: { domain?: Domain }) {
  const router = useRouter();
  const [name, setName] = useState(domain?.name ?? "");
  const [domainUrl, setDomainUrl] = useState(domain?.domainUrl ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const url = domain
        ? `/api/domains/${domain.id}`
        : "/api/domains";
      const method = domain ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domainUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Fehler");
      }
      router.push("/dashboard/domains");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {domain ? "Domain bearbeiten" : "Neue Domain"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Meine Marke"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domainUrl">Domain / URL</Label>
            <Input
              id="domainUrl"
              value={domainUrl}
              onChange={(e) => setDomainUrl(e.target.value)}
              placeholder="z.B. example.com oder https://example.com"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Wird gespeichert…" : domain ? "Speichern" : "Erstellen"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
