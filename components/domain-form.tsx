"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("DomainForm");
  const tc = useTranslations("Common");
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
        throw new Error(data.error ?? tc("error"));
      }
      router.push("/dashboard/domains");
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
          {domain ? t("editTitle") : t("newTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="domainUrl">{t("urlLabel")}</Label>
            <Input
              id="domainUrl"
              value={domainUrl}
              onChange={(e) => setDomainUrl(e.target.value)}
              placeholder={t("urlPlaceholder")}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? tc("saving") : domain ? tc("save") : tc("create")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
