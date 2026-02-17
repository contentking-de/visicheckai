import { after } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  trackingRuns,
  trackingConfigs,
  trackingResults,
  domains,
  promptSets,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { getFaviconMap, fetchFaviconsForDomains } from "@/lib/favicon";
import { notFound } from "next/navigation";
import Link from "next/link";
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
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { ExpandableResponse } from "@/components/expandable-response";
import { CompetitorOverview } from "@/components/competitor-overview";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([auth(), params]);
  if (!session?.user?.id) return null;

  const [t, tComp, locale] = await Promise.all([
    getTranslations("RunDetail"),
    getTranslations("CompetitorOverview"),
    getLocale(),
  ]);

  // Parallel: run+config query and results query
  const [runRows, results] = await Promise.all([
    db
      .select({
        run: trackingRuns,
        config: trackingConfigs,
        domain: domains,
        promptSet: promptSets,
      })
      .from(trackingRuns)
      .innerJoin(trackingConfigs, eq(trackingRuns.configId, trackingConfigs.id))
      .innerJoin(domains, eq(trackingConfigs.domainId, domains.id))
      .innerJoin(promptSets, eq(trackingConfigs.promptSetId, promptSets.id))
      .where(
        and(
          eq(trackingRuns.id, id),
          eq(trackingConfigs.userId, session.user.id)
        )
      ),
    db
      .select()
      .from(trackingResults)
      .where(eq(trackingResults.runId, id)),
  ]);

  const runWithConfig = runRows[0];
  if (!runWithConfig) notFound();

  const { run, domain, promptSet } = runWithConfig;

  const ownHost = domain.domainUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();

  const byProvider = results.reduce<
    Record<string, { prompt: string; response: string; mentions: number; citationCount: number; ownDomainCited: boolean }[]>
  >((acc, r) => {
    if (!acc[r.provider]) acc[r.provider] = [];
    const cits = (r.citations as string[] | null) ?? [];
    const ownDomainCited = cits.some((url) => {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        return host === ownHost || host.endsWith(`.${ownHost}`);
      } catch { return false; }
    });
    acc[r.provider].push({
      prompt: r.prompt,
      response: r.response,
      mentions: r.mentionCount ?? 0,
      citationCount: cits.length,
      ownDomainCited,
    });
    return acc;
  }, {});

  const citationResults = results.map((r) => ({
    provider: r.provider,
    response: r.response,
    citations: (r.citations as string[] | null) ?? null,
  }));

  // Collect all unique domains from citations for favicon lookup
  const allCitedDomains = new Set<string>();
  const ownDomainHost = domain.domainUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  allCitedDomains.add(ownDomainHost);
  for (const r of citationResults) {
    if (!r.citations) continue;
    for (const url of r.citations) {
      try {
        allCitedDomains.add(new URL(url).hostname.replace(/^www\./, ""));
      } catch { /* skip */ }
    }
  }

  const domainArray = [...allCitedDomains];

  // Read existing favicons from DB (fast), render page immediately
  const faviconMap = await getFaviconMap(domainArray);
  const faviconObj: Record<string, string> = {};
  for (const [d, url] of faviconMap) {
    faviconObj[d] = url;
  }

  // Fetch missing favicons in the background AFTER the response is sent
  after(async () => {
    await fetchFaviconsForDomains(domainArray);
  });

  const providerLabels: Record<string, string> = {
    chatgpt: "ChatGPT",
    claude: "Claude",
    gemini: "Gemini",
    perplexity: "Perplexity",
  };

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link
            href="/dashboard/runs"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToRuns")}
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {domain.name} · {promptSet.name} ·{" "}
          {run.startedAt
            ? new Date(run.startedAt).toLocaleString(locale)
            : "-"}
        </p>
        <span
          className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            run.status === "completed"
              ? "bg-green-100 text-green-800"
              : run.status === "failed"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
          }`}
        >
          {run.status}
        </span>
      </div>

      <CompetitorOverview
        results={citationResults}
        ownDomainUrl={domain.domainUrl}
        ownBrandName={domain.name}
        keyword={promptSet.name}
        favicons={faviconObj}
        translations={{
          title: tComp("title"),
          domain: tComp("domain"),
          total: tComp("total"),
          citations: tComp("citations"),
          mentions: tComp("mentions"),
          ownDomain: tComp("ownDomain"),
          competitor: tComp("competitor"),
          showAll: tComp("showAll"),
          showLess: tComp("showLess"),
          noCitations: tComp("noCitations"),
          sources: tComp("sources"),
        }}
      />

      {Object.entries(byProvider).map(([provider, items]) => (
        <Card key={provider}>
          <CardHeader>
            <CardTitle>{providerLabels[provider] ?? provider}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("prompt")}</TableHead>
                  <TableHead>{t("mentions")}</TableHead>
                  <TableHead>{t("citations")}</TableHead>
                  <TableHead>{t("responseExcerpt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-[200px] truncate">
                      {item.prompt}
                    </TableCell>
                    <TableCell>{item.mentions}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        {item.ownDomainCited ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                        )}
                        {item.citationCount}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[400px]">
                      <ExpandableResponse text={item.response} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {results.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("noResults")}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
