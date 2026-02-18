"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
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
};

type AdminStats = {
  totals: {
    users: number;
    domains: number;
    promptSets: number;
    apiCalls: number;
    estimatedCost: number;
  };
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
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                allowDecimals={false}
                className="text-muted-foreground"
              />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--card))",
                  color: "hsl(var(--card-foreground))",
                  boxShadow: "0 4px 12px rgba(0,0,0,.15)",
                }}
                labelStyle={{ color: "hsl(var(--card-foreground))", fontWeight: 600 }}
                itemStyle={{ color: "hsl(var(--card-foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${color})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

const PROVIDER_COLORS: Record<string, string> = {
  chatgpt: "#10a37f",
  claude: "#d97706",
  gemini: "#4285f4",
  perplexity: "#6366f1",
};

const PROVIDER_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

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
          title={t("estimatedCost")}
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
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.apiCallsPerDay}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                  className="text-muted-foreground"
                />
                <Tooltip
                  labelFormatter={(label) =>
                    new Date(label).toLocaleDateString()
                  }
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                    boxShadow: "0 4px 12px rgba(0,0,0,.15)",
                  }}
                  labelStyle={{ color: "hsl(var(--card-foreground))", fontWeight: 600 }}
                  itemStyle={{ color: "hsl(var(--card-foreground))" }}
                />
                <Legend
                  formatter={(value: string) =>
                    PROVIDER_LABELS[value] ?? value
                  }
                />
                {Object.entries(PROVIDER_COLORS).map(([key, color]) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={color}
                    radius={
                      key === "perplexity" ? [4, 4, 0, 0] : [0, 0, 0, 0]
                    }
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Cost breakdown per provider */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("costBreakdown")}</CardTitle>
          <CardDescription>{t("costDisclaimer")}</CardDescription>
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
          <CardDescription>{t("dailyCostsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.dailyCosts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("noData")}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.dailyCosts}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v: number) => `$${v.toFixed(2)}`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  formatter={(value?: number, name?: string) => [
                    `$${(value ?? 0).toFixed(4)}`,
                    PROVIDER_LABELS[name ?? ""] ?? name ?? "",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                    boxShadow: "0 4px 12px rgba(0,0,0,.15)",
                  }}
                  labelStyle={{ color: "hsl(var(--card-foreground))", fontWeight: 600 }}
                  itemStyle={{ color: "hsl(var(--card-foreground))" }}
                />
                <Legend
                  formatter={(value: string) => PROVIDER_LABELS[value] ?? value}
                />
                {Object.entries(PROVIDER_COLORS).map(([key, color]) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={color}
                    radius={key === "perplexity" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
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
