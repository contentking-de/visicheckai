"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, Minus, TrendingUp } from "lucide-react";

type SentimentData = {
  totals: {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
    avgScore: number;
  };
  byProvider: Record<
    string,
    {
      positive: number;
      neutral: number;
      negative: number;
      avgScore: number;
      total: number;
    }
  >;
  overTime: {
    date: string;
    positive: number;
    neutral: number;
    negative: number;
    avgScore: number;
  }[];
  promptRanking: {
    prompt: string;
    avgScore: number;
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  }[];
  recentNegative: {
    prompt: string;
    provider: string;
    response: string;
    score: number;
    date: string;
    domain: string;
  }[];
};

const SENTIMENT_COLORS = {
  positive: "#22c55e",
  neutral: "#a1a1aa",
  negative: "#ef4444",
};

import { PROVIDER_LABELS } from "@/lib/providers";

const PROVIDER_COLORS: Record<string, string> = {
  chatgpt: "#10a37f",
  claude: "#d97706",
  gemini: "#4285f4",
  perplexity: "#6366f1",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ScoreDisplay({ score, label }: { score: number; label: string }) {
  const color =
    score > 20
      ? "text-green-600"
      : score < -20
        ? "text-red-600"
        : "text-zinc-500";
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>
        {score > 0 ? "+" : ""}
        {score}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: "8px",
  border: "1px solid hsl(var(--border))",
  backgroundColor: "hsl(var(--card))",
  color: "hsl(var(--card-foreground))",
  boxShadow: "0 4px 12px rgba(0,0,0,.15)",
};

export function SentimentCharts({
  domainId,
  runId,
}: {
  domainId?: string;
  runId?: string;
}) {
  const t = useTranslations("Sentiment");
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (domainId) params.set("domain", domainId);
    if (runId) params.set("runId", runId);
    const qs = params.toString();
    fetch(`/api/sentiment${qs ? `?${qs}` : ""}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [domainId, runId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data || data.totals.total === 0) {
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

  const pieData = [
    { name: t("positive"), value: data.totals.positive, color: SENTIMENT_COLORS.positive },
    { name: t("neutral"), value: data.totals.neutral, color: SENTIMENT_COLORS.neutral },
    { name: t("negative"), value: data.totals.negative, color: SENTIMENT_COLORS.negative },
  ];

  const providerData = Object.entries(data.byProvider).map(([key, val]) => ({
    provider: PROVIDER_LABELS[key] ?? key,
    positive: val.positive,
    neutral: val.neutral,
    negative: val.negative,
    avgScore: val.avgScore,
  }));

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("avgScore")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ScoreDisplay score={data.totals.avgScore} label={t("outOf100")} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("positive")}
            </CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.totals.positive}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.totals.total > 0
                ? `${Math.round((data.totals.positive / data.totals.total) * 100)}%`
                : "0%"}{" "}
              {t("ofTotal")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("neutral")}
            </CardTitle>
            <Minus className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-500">
              {data.totals.neutral}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.totals.total > 0
                ? `${Math.round((data.totals.neutral / data.totals.total) * 100)}%`
                : "0%"}{" "}
              {t("ofTotal")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t("negative")}
            </CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {data.totals.negative}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.totals.total > 0
                ? `${Math.round((data.totals.negative / data.totals.total) * 100)}%`
                : "0%"}{" "}
              {t("ofTotal")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row: Pie chart + Provider comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie chart: overall distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("distribution")}</CardTitle>
            <CardDescription>{t("distributionDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Provider comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("byProvider")}</CardTitle>
            <CardDescription>{t("byProviderDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={providerData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="provider"
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="positive" name={t("positive")} stackId="a" fill={SENTIMENT_COLORS.positive} />
                <Bar dataKey="neutral" name={t("neutral")} stackId="a" fill={SENTIMENT_COLORS.neutral} />
                <Bar dataKey="negative" name={t("negative")} stackId="a" fill={SENTIMENT_COLORS.negative} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment over time */}
      {data.overTime.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("overTime")}</CardTitle>
            <CardDescription>{t("overTimeDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.overTime}>
                <defs>
                  <linearGradient id="gradPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SENTIMENT_COLORS.positive} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={SENTIMENT_COLORS.positive} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SENTIMENT_COLORS.negative} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={SENTIMENT_COLORS.negative} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  contentStyle={tooltipStyle}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="positive"
                  name={t("positive")}
                  stroke={SENTIMENT_COLORS.positive}
                  strokeWidth={2}
                  fill="url(#gradPos)"
                />
                <Area
                  type="monotone"
                  dataKey="negative"
                  name={t("negative")}
                  stroke={SENTIMENT_COLORS.negative}
                  strokeWidth={2}
                  fill="url(#gradNeg)"
                />
                <Area
                  type="monotone"
                  dataKey="neutral"
                  name={t("neutral")}
                  stroke={SENTIMENT_COLORS.neutral}
                  strokeWidth={1}
                  fill="none"
                  strokeDasharray="4 4"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Prompt ranking table */}
      {data.promptRanking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("promptRanking")}</CardTitle>
            <CardDescription>{t("promptRankingDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Prompt</th>
                    <th className="pb-2 px-2 font-medium text-center">Score</th>
                    <th className="pb-2 px-2 font-medium text-center">
                      <ThumbsUp className="inline h-3.5 w-3.5 text-green-600" />
                    </th>
                    <th className="pb-2 px-2 font-medium text-center">
                      <Minus className="inline h-3.5 w-3.5 text-zinc-400" />
                    </th>
                    <th className="pb-2 px-2 font-medium text-center">
                      <ThumbsDown className="inline h-3.5 w-3.5 text-red-500" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.promptRanking.slice(0, 20).map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 max-w-md truncate" title={row.prompt}>
                        {row.prompt}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-block min-w-[3rem] rounded-full px-2 py-0.5 text-xs font-semibold ${
                            row.avgScore > 20
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : row.avgScore < -20
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {row.avgScore > 0 ? "+" : ""}
                          {row.avgScore}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center text-green-600">{row.positive}</td>
                      <td className="py-2.5 px-2 text-center text-zinc-500">{row.neutral}</td>
                      <td className="py-2.5 px-2 text-center text-red-500">{row.negative}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent negative */}
      {data.recentNegative.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("recentNegative")}</CardTitle>
            <CardDescription>{t("recentNegativeDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentNegative.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-red-200 bg-red-50/50 p-4 dark:border-red-900/50 dark:bg-red-950/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {PROVIDER_LABELS[item.provider] ?? item.provider} · {item.domain}
                    </span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {item.score}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{item.prompt}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {item.response}…
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    {new Date(item.date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
