"use client";

import { useEffect, useState, useId } from "react";
import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Globe, FileText, Activity, DollarSign } from "lucide-react";

type TimeSeriesPoint = { date: string; count: number };
type ProviderPoint = {
  date: string;
  chatgpt: number;
  claude: number;
  gemini: number;
  perplexity: number;
  total: number;
};

type CostByProvider = {
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  calls: number;
  hasActualUsage: boolean;
};

type AdminStats = {
  totals: {
    users: number;
    domains: number;
    promptSets: number;
    apiCalls: number;
    estimatedCost: number;
  };
  usageCoverage: number;
  usersOverTime: TimeSeriesPoint[];
  domainsOverTime: TimeSeriesPoint[];
  promptSetsOverTime: TimeSeriesPoint[];
  apiCallsPerDay: ProviderPoint[];
  costByProvider: CostByProvider[];
  dailyCosts: ProviderPoint[];
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StatCard({
  title,
  value,
  icon: Icon,
  prefix,
  suffix,
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  prefix?: string;
  suffix?: string;
}) {
  const display =
    typeof value === "number" ? value.toLocaleString() : value;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}
          {display}
          {suffix}
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number) {
  return value < 0.01 && value > 0
    ? "< $0.01"
    : `$${value.toFixed(2)}`;
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

function GrowthChart({
  title,
  description,
  data,
  color,
}: {
  title: string;
  description?: string;
  data: TimeSeriesPoint[];
  color: string;
}) {
  const gradId = useId().replace(/:/g, "");
  const chartConfig = {
    count: { label: title, color },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Keine Daten
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} />
              <YAxis allowDecimals={false} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => new Date(String(label)).toLocaleDateString()}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--color-count)"
                strokeWidth={2}
                fill={`url(#grad-${gradId})`}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

import { PROVIDER_COLORS, PROVIDER_LABELS } from "@/lib/providers";

const providerConfig = {
  chatgpt: { label: PROVIDER_LABELS["chatgpt"], color: PROVIDER_COLORS["chatgpt"] },
  claude: { label: PROVIDER_LABELS["claude"], color: PROVIDER_COLORS["claude"] },
  gemini: { label: PROVIDER_LABELS["gemini"], color: PROVIDER_COLORS["gemini"] },
  perplexity: { label: PROVIDER_LABELS["perplexity"], color: PROVIDER_COLORS["perplexity"] },
} satisfies ChartConfig;

export function AdminCharts() {
  const t = useTranslations("Admin");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        {t("loadError")}
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title={t("totalUsers")}
          value={stats.totals.users}
          icon={Users}
        />
        <StatCard
          title={t("totalDomains")}
          value={stats.totals.domains}
          icon={Globe}
        />
        <StatCard
          title={t("totalPromptSets")}
          value={stats.totals.promptSets}
          icon={FileText}
        />
        <StatCard
          title={t("totalApiCalls")}
          value={stats.totals.apiCalls}
          icon={Activity}
        />
        <StatCard
          title={stats.usageCoverage === 100 ? t("actualCost") : stats.usageCoverage > 0 ? t("costMixed") : t("estimatedCost")}
          value={formatCurrency(stats.totals.estimatedCost)}
          icon={DollarSign}
        />
      </div>

      {/* User growth */}
      <GrowthChart
        title={t("userGrowth")}
        description={t("userGrowthDesc")}
        data={stats.usersOverTime}
        color="hsl(221, 83%, 53%)"
      />

      {/* API consumption per day per model */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("apiConsumption")}</CardTitle>
          <CardDescription>{t("apiConsumptionDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.apiCallsPerDay.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("noData")}
            </p>
          ) : (
            <ChartContainer config={providerConfig} className="h-[320px] w-full">
              <BarChart data={stats.apiCallsPerDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis allowDecimals={false} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => new Date(String(label)).toLocaleDateString()}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                {Object.keys(PROVIDER_COLORS).map((key) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={`var(--color-${key})`}
                    radius={
                      key === "perplexity" ? [4, 4, 0, 0] : [0, 0, 0, 0]
                    }
                  />
                ))}
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Cost breakdown per provider */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("costBreakdown")}</CardTitle>
          <CardDescription>
            {stats.usageCoverage === 100
              ? t("costDisclaimerActual")
              : stats.usageCoverage > 0
                ? t("costDisclaimerMixed", { percent: stats.usageCoverage })
                : t("costDisclaimer")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.costByProvider.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("noData")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">{t("provider")}</th>
                    <th className="pb-2 font-medium text-right">{t("calls")}</th>
                    <th className="pb-2 font-medium text-right">{t("inputTokens")}</th>
                    <th className="pb-2 font-medium text-right">{t("outputTokens")}</th>
                    <th className="pb-2 font-medium text-right">{t("cost")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.costByProvider.map((row) => (
                    <tr key={row.provider} className="border-b last:border-0">
                      <td className="py-2 font-medium">
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[row.provider] }} />
                        {PROVIDER_LABELS[row.provider] ?? row.provider}
                      </td>
                      <td className="py-2 text-right">{row.calls.toLocaleString()}</td>
                      <td className="py-2 text-right">{formatTokens(row.inputTokens)}</td>
                      <td className="py-2 text-right">{formatTokens(row.outputTokens)}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(row.cost)}</td>
                    </tr>
                  ))}
                  <tr className="font-semibold">
                    <td className="pt-2">{t("total")}</td>
                    <td className="pt-2 text-right">
                      {stats.costByProvider.reduce((s, r) => s + r.calls, 0).toLocaleString()}
                    </td>
                    <td className="pt-2 text-right">
                      {formatTokens(stats.costByProvider.reduce((s, r) => s + r.inputTokens, 0))}
                    </td>
                    <td className="pt-2 text-right">
                      {formatTokens(stats.costByProvider.reduce((s, r) => s + r.outputTokens, 0))}
                    </td>
                    <td className="pt-2 text-right">
                      {formatCurrency(stats.costByProvider.reduce((s, r) => s + r.cost, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily cost chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("dailyCosts")}</CardTitle>
          <CardDescription>
            {stats.usageCoverage === 100 ? t("dailyCostsDescActual") : t("dailyCostsDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.dailyCosts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("noData")}
            </p>
          ) : (
            <ChartContainer config={providerConfig} className="h-[320px] w-full">
              <BarChart data={stats.dailyCosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) => new Date(String(label)).toLocaleDateString()}
                      formatter={(value, name, item, index) => (
                        <>
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="flex flex-1 items-center justify-between gap-2 leading-none">
                            <span className="text-muted-foreground">
                              {providerConfig[String(name) as keyof typeof providerConfig]?.label ?? name}
                            </span>
                            <span className="font-mono font-medium tabular-nums text-foreground">
                              ${Number(value).toFixed(4)}
                            </span>
                          </div>
                        </>
                      )}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                {Object.keys(PROVIDER_COLORS).map((key) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={`var(--color-${key})`}
                    radius={key === "perplexity" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Domains & Prompt Sets growth */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GrowthChart
          title={t("domainGrowth")}
          description={t("domainGrowthDesc")}
          data={stats.domainsOverTime}
          color="hsl(142, 71%, 45%)"
        />
        <GrowthChart
          title={t("promptSetGrowth")}
          description={t("promptSetGrowthDesc")}
          data={stats.promptSetsOverTime}
          color="hsl(280, 67%, 54%)"
        />
      </div>
    </div>
  );
}
