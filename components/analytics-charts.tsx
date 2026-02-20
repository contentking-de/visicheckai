"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PieChart, Pie } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProviderBadge } from "@/components/provider-badge";
import {
  Link2,
  FileText,
  MessageSquareQuote,
  Tag,
  ChevronDown,
  ExternalLink,
} from "lucide-react";

type OwnUrlEntry = {
  url: string;
  count: number;
  prompts: { prompt: string; provider: string; date: string | null }[];
};

type AnalyticsData = {
  sourcesByProvider: Record<string, number>;
  brandOnlyByProvider: Record<string, number>;
  ownUrls: OwnUrlEntry[];
  outputsWithSource: OutputItem[];
  outputsBrandOnly: OutputItem[];
};

type OutputItem = {
  provider: string;
  prompt: string;
  response: string;
  mentionCount: number;
  date: string | null;
};

import { PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/providers";

function ExpandableUrl({ entry }: { entry: OwnUrlEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-muted/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 rounded-lg transition-colors"
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <a
          href={entry.url.startsWith("http") ? entry.url : `https://${entry.url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {entry.url}
        </a>
        <Badge variant="secondary" className="shrink-0 text-xs font-semibold">
          {entry.count}×
        </Badge>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="border-t px-3 py-2.5 space-y-2">
          {entry.prompts.map((p, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <ProviderBadge provider={p.provider} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate" title={p.prompt}>
                {p.prompt}
              </span>
              {p.date && (
                <span className="shrink-0 tabular-nums">
                  {new Date(p.date).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpandableOutput({ item }: { item: OutputItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ProviderBadge provider={item.provider} />
            {item.date && (
              <span>
                {new Date(item.date).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            )}
            {item.mentionCount > 0 && (
              <span className="text-green-600 font-medium">
                {item.mentionCount}× erwähnt
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-medium">{item.prompt}</p>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            {expanded ? item.response : `${item.response.slice(0, 250)}…`}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 shrink-0 rounded-md p-1 hover:bg-muted"
        >
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </div>
  );
}

export function AnalyticsCharts({
  domainId,
  promptSetId,
  category,
}: {
  domainId: string;
  promptSetId?: string;
  category?: string;
}) {
  const t = useTranslations("Analytics");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!domainId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    params.set("domain", domainId);
    if (promptSetId) params.set("promptSet", promptSetId);
    if (category) params.set("category", category);
    fetch(`/api/analytics?${params.toString()}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [domainId, promptSetId, category]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!domainId) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">{t("selectDomainHint")}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">{t("noData")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("noDataHint")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalSources = Object.values(data.sourcesByProvider).reduce(
    (sum, v) => sum + v,
    0
  );
  const totalBrandOnly = Object.values(data.brandOnlyByProvider).reduce(
    (sum, v) => sum + v,
    0
  );
  const hasOutputs = data.outputsWithSource.length > 0;
  const hasBrandOnly = data.outputsBrandOnly.length > 0;

  if (!hasOutputs && !hasBrandOnly && data.ownUrls.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">{t("noData")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("noDataHint")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const ALL_PROVIDERS = ["chatgpt", "claude", "gemini", "perplexity"] as const;

  const baseProviderConfig = {
    chatgpt: { label: PROVIDER_LABELS["chatgpt"], color: PROVIDER_COLORS["chatgpt"] },
    claude: { label: PROVIDER_LABELS["claude"], color: PROVIDER_COLORS["claude"] },
    gemini: { label: PROVIDER_LABELS["gemini"], color: PROVIDER_COLORS["gemini"] },
    perplexity: { label: PROVIDER_LABELS["perplexity"], color: PROVIDER_COLORS["perplexity"] },
  };

  const providerPieConfig = baseProviderConfig satisfies ChartConfig;

  const sourceChartData = ALL_PROVIDERS
    .map((provider) => ({
      provider,
      count: data.sourcesByProvider[provider] ?? 0,
      fill: `var(--color-${provider})`,
    }))
    .filter((d) => d.count > 0);

  const brandChartData = ALL_PROVIDERS
    .map((provider) => ({
      provider,
      count: data.brandOnlyByProvider[provider] ?? 0,
      fill: `var(--color-${provider})`,
    }))
    .filter((d) => d.count > 0);

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalSources")}
            </CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSources}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalBrandOnly")}
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBrandOnly}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("uniqueUrls")}
            </CardTitle>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.ownUrls.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalOutputs")}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.outputsWithSource.length + data.outputsBrandOnly.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row: Source mentions + Brand-only by Provider */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("sourcesByProvider")}
            </CardTitle>
            <CardDescription>{t("sourcesByProviderDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={providerPieConfig} className="mx-auto h-[280px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="provider" />} />
                <Pie
                  data={sourceChartData}
                  dataKey="count"
                  nameKey="provider"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                />
                <ChartLegend content={<ChartLegendContent nameKey="provider" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("brandOnlyByProvider")}
            </CardTitle>
            <CardDescription>{t("brandOnlyByProviderDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={providerPieConfig} className="mx-auto h-[280px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="provider" />} />
                <Pie
                  data={brandChartData}
                  dataKey="count"
                  nameKey="provider"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                />
                <ChartLegend content={<ChartLegendContent nameKey="provider" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Own URLs List */}
      {data.ownUrls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4" />
              {t("ownUrlsTitle")}
            </CardTitle>
            <CardDescription>{t("ownUrlsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.ownUrls.map((entry) => (
                <ExpandableUrl key={entry.url} entry={entry} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outputs with source */}
      {hasOutputs && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareQuote className="h-4 w-4" />
              {t("allOutputsTitle")}
            </CardTitle>
            <CardDescription>
              {t("allOutputsDesc", { count: data.outputsWithSource.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.outputsWithSource.map((item, i) => (
                <ExpandableOutput key={i} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brand-only mentions */}
      {hasBrandOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="h-4 w-4" />
              {t("brandOnlyTitle")}
            </CardTitle>
            <CardDescription>
              {t("brandOnlyDesc", { count: data.outputsBrandOnly.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.outputsBrandOnly.map((item, i) => (
                <ExpandableOutput key={i} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
