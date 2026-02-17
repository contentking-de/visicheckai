import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  domains,
  promptSets,
  trackingRuns,
  trackingConfigs,
  trackingResults,
} from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { teamFilter } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Globe, FileText, BarChart3, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getTranslations, getLocale } from "next-intl/server";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getTranslations("Dashboard");
  const tRuns = await getTranslations("Runs");
  const tc = await getTranslations("Common");
  const locale = await getLocale();

  const domainList = await db
    .select()
    .from(domains)
    .where(teamFilter("domains", session));
  const domainCount = domainList.length;

  const promptSetList = await db
    .select()
    .from(promptSets)
    .where(teamFilter("promptSets", session));
  const promptSetCount = promptSetList.length;

  const recentRuns = await db
    .select({
      run: trackingRuns,
      domain: domains,
      promptSet: promptSets,
    })
    .from(trackingRuns)
    .innerJoin(trackingConfigs, eq(trackingRuns.configId, trackingConfigs.id))
    .innerJoin(domains, eq(trackingConfigs.domainId, domains.id))
    .innerJoin(promptSets, eq(trackingConfigs.promptSetId, promptSets.id))
    .where(teamFilter("trackingConfigs", session))
    .orderBy(desc(trackingRuns.startedAt))
    .limit(5);

  // Domain statistics: results across all runs per domain
  const allDomainResults = await db
    .select({
      domainId: domains.id,
      domainName: domains.name,
      domainUrl: domains.domainUrl,
      runId: trackingRuns.id,
      runStartedAt: trackingRuns.startedAt,
      provider: trackingResults.provider,
      mentionCount: trackingResults.mentionCount,
      citations: trackingResults.citations,
      visibilityScore: trackingResults.visibilityScore,
    })
    .from(trackingResults)
    .innerJoin(trackingRuns, eq(trackingResults.runId, trackingRuns.id))
    .innerJoin(trackingConfigs, eq(trackingRuns.configId, trackingConfigs.id))
    .innerJoin(domains, eq(trackingConfigs.domainId, domains.id))
    .where(teamFilter("trackingConfigs", session));

  type DomainStat = {
    domainId: string;
    domainName: string;
    domainUrl: string;
    totalRuns: number;
    totalMentions: number;
    totalCitations: number;
    avgScore: number | null;
    lastRunAt: Date | null;
    providers: Record<string, { mentions: number; citations: number }>;
  };

  const domainStatsMap = new Map<string, DomainStat>();

  for (const d of domainList) {
    domainStatsMap.set(d.id, {
      domainId: d.id,
      domainName: d.name,
      domainUrl: d.domainUrl,
      totalRuns: 0,
      totalMentions: 0,
      totalCitations: 0,
      avgScore: null,
      lastRunAt: null,
      providers: {},
    });
  }

  const runIdsByDomain = new Map<string, Set<string>>();
  const scoresByDomain = new Map<string, number[]>();

  for (const row of allDomainResults) {
    const stat = domainStatsMap.get(row.domainId);
    if (!stat) continue;

    // Track unique runs
    if (!runIdsByDomain.has(row.domainId)) {
      runIdsByDomain.set(row.domainId, new Set());
    }
    runIdsByDomain.get(row.domainId)!.add(row.runId);

    // Mentions
    const mentions = row.mentionCount ?? 0;
    stat.totalMentions += mentions;

    // Citations
    const cits = (row.citations as string[] | null) ?? [];
    stat.totalCitations += cits.length;

    // Visibility score
    if (row.visibilityScore != null) {
      if (!scoresByDomain.has(row.domainId)) {
        scoresByDomain.set(row.domainId, []);
      }
      scoresByDomain.get(row.domainId)!.push(row.visibilityScore);
    }

    // Latest run
    if (row.runStartedAt && (!stat.lastRunAt || row.runStartedAt > stat.lastRunAt)) {
      stat.lastRunAt = row.runStartedAt;
    }

    // Provider breakdown
    if (!stat.providers[row.provider]) {
      stat.providers[row.provider] = { mentions: 0, citations: 0 };
    }
    stat.providers[row.provider].mentions += mentions;
    stat.providers[row.provider].citations += cits.length;
  }

  for (const [domainId, stat] of domainStatsMap) {
    stat.totalRuns = runIdsByDomain.get(domainId)?.size ?? 0;
    const scores = scoresByDomain.get(domainId);
    if (scores && scores.length > 0) {
      stat.avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }

  const domainStats = [...domainStatsMap.values()];

  const providerLabels: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    perplexity: "Perplexity",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("welcome")}
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Button asChild>
            <Link href="/dashboard/domains/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("addDomain")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/prompt-sets/new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("createPromptSet")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("domains")}</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domainCount}</div>
            <Button asChild variant="link" className="h-auto p-0">
              <Link href="/dashboard/domains">{tc("manage")}</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("promptSets")}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promptSetCount}</div>
            <Button asChild variant="link" className="h-auto p-0">
              <Link href="/dashboard/prompt-sets">{tc("manage")}</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("recentRuns")}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentRuns.length}</div>
            <Button asChild variant="link" className="h-auto p-0">
              <Link href="/dashboard/runs">{tc("showAll")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Domain Statistics */}
      {domainStats.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t("domainStats")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {domainStats.map((stat) => (
              <Card key={stat.domainId}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base font-semibold">
                      {stat.domainName}
                    </CardTitle>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/runs">{t("viewRuns")}</Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stat.totalRuns === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("noData")}
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("totalRuns")}
                          </p>
                          <p className="text-xl font-bold">{stat.totalRuns}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("totalMentions")}
                          </p>
                          <p className="text-xl font-bold">
                            {stat.totalMentions}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("totalCitations")}
                          </p>
                          <p className="text-xl font-bold">
                            {stat.totalCitations}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            {t("avgScore")}
                          </p>
                          <p className="text-xl font-bold">
                            {stat.avgScore != null ? stat.avgScore : "–"}
                          </p>
                        </div>
                      </div>

                      {/* Provider breakdown */}
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(stat.providers).map(
                          ([provider, data]) => (
                            <Badge
                              key={provider}
                              variant="secondary"
                              className="flex items-center gap-1.5 text-xs"
                            >
                              <Activity className="h-3 w-3" />
                              {providerLabels[provider] ?? provider}
                              <span className="font-semibold">
                                {data.mentions}
                              </span>
                            </Badge>
                          )
                        )}
                      </div>

                      {stat.lastRunAt && (
                        <p className="text-xs text-muted-foreground">
                          {t("lastRun")}:{" "}
                          {new Date(stat.lastRunAt).toLocaleString(locale)}
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Runs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("recentRuns")}</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/runs">{tc("showAll")}</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">
              {tRuns("empty")}{" "}
              <Link
                href="/dashboard/configs"
                className="text-primary underline"
              >
                {tRuns("configureTracking")}
              </Link>{" "}
              {tRuns("andStartRun")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Prompt-Set</TableHead>
                  <TableHead>{tRuns("status")}</TableHead>
                  <TableHead>{tRuns("startedAt")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRuns.map(({ run, domain, promptSet }) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-medium">
                      {domain.name}
                    </TableCell>
                    <TableCell>{promptSet.name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          run.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : run.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : run.status === "running"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {run.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {run.startedAt
                        ? new Date(run.startedAt).toLocaleString(locale)
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/runs/${run.id}`}>
                          {tc("details")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
