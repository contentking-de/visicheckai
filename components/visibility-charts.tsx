"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
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
import { TrendingUp, TrendingDown, Minus, Eye, Calendar, Hash } from "lucide-react";
import { PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/providers";

type TimelineEntry = {
  date: string;
  chatgpt: number | null;
  claude: number | null;
  gemini: number | null;
  perplexity: number | null;
  avg: number | null;
};

type VisibilityData = {
  timeline: TimelineEntry[];
  summary: {
    latestAvg: number | null;
    previousAvg: number | null;
    trend: number | null;
    totalDataPoints: number;
    timelineDays: number;
  };
};

const chartConfig = {
  avg: { label: "Durchschnitt", color: "#8b5cf6" },
  chatgpt: { label: PROVIDER_LABELS["chatgpt"], color: PROVIDER_COLORS["chatgpt"] },
  claude: { label: PROVIDER_LABELS["claude"], color: PROVIDER_COLORS["claude"] },
  gemini: { label: PROVIDER_LABELS["gemini"], color: PROVIDER_COLORS["gemini"] },
  perplexity: { label: PROVIDER_LABELS["perplexity"], color: PROVIDER_COLORS["perplexity"] },
} satisfies ChartConfig;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export function VisibilityCharts({
  domainId,
  promptSetId,
  category,
}: {
  domainId: string;
  promptSetId?: string;
  category?: string;
}) {
  const t = useTranslations("Visibility");
  const [data, setData] = useState<VisibilityData | null>(null);
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
    fetch(`/api/visibility?${params.toString()}`)
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

  if (!data || data.timeline.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">{t("noData")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("noDataHint")}</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, timeline } = data;
  const trendIcon =
    summary.trend != null ? (
      summary.trend > 0 ? (
        <TrendingUp className="h-4 w-4 text-green-500" />
      ) : summary.trend < 0 ? (
        <TrendingDown className="h-4 w-4 text-red-500" />
      ) : (
        <Minus className="h-4 w-4 text-muted-foreground" />
      )
    ) : null;

  const trendColor =
    summary.trend != null
      ? summary.trend > 0
        ? "text-green-600"
        : summary.trend < 0
          ? "text-red-600"
          : "text-muted-foreground"
      : "";

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("currentScore")}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.latestAvg != null ? summary.latestAvg : "–"}
            </div>
            {summary.trend != null && (
              <div className={`mt-1 flex items-center gap-1 text-sm ${trendColor}`}>
                {trendIcon}
                <span>
                  {summary.trend > 0 ? "+" : ""}
                  {summary.trend} {t("vsLastRun")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("timelineDays")}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.timelineDays}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t("daysWithData")}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("totalDataPoints")}</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalDataPoints}</div>
            <p className="mt-1 text-sm text-muted-foreground">{t("analyzedResponses")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Visibility Timeline Chart */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">{t("chartTitle")}</CardTitle>
          <CardDescription>{t("chartDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full sm:h-[400px]">
            <LineChart data={timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    }
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="var(--color-avg)"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="chatgpt"
                stroke="var(--color-chatgpt)"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="claude"
                stroke="var(--color-claude)"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="gemini"
                stroke="var(--color-gemini)"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="perplexity"
                stroke="var(--color-perplexity)"
                strokeWidth={1.5}
                dot={false}
                strokeDasharray="4 4"
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Provider Comparison for latest data point */}
      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("providerComparison")}</CardTitle>
            <CardDescription>{t("providerComparisonDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {(["chatgpt", "claude", "gemini", "perplexity"] as const).map((provider) => {
                const latest = timeline[timeline.length - 1];
                const score = latest[provider];
                return (
                  <div key={provider} className="rounded-lg border p-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PROVIDER_COLORS[provider] }}
                      />
                      <span className="text-sm font-medium">
                        {PROVIDER_LABELS[provider]}
                      </span>
                    </div>
                    <div className="mt-2 text-2xl font-bold">
                      {score != null ? score : "–"}
                    </div>
                    <div className="mt-1">
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${score != null ? score : 0}%`,
                            backgroundColor: PROVIDER_COLORS[provider],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
