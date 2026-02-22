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
import { teamFilter } from "@/lib/rbac";
import { getFaviconMap, fetchFaviconsForDomains } from "@/lib/favicon";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { CompetitorOverview } from "@/components/competitor-overview";
import { SourceUrls } from "@/components/source-urls";
import { ProviderResultsCard } from "@/components/provider-results-card";
import { extractUrlsFromText } from "@/lib/ai-providers";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [session, { id }] = await Promise.all([auth(), params]);
  if (!session?.user?.id) return null;

  const [t, tComp, tSrc, locale] = await Promise.all([
    getTranslations("RunDetail"),
    getTranslations("CompetitorOverview"),
    getTranslations("SourceUrls"),
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
          teamFilter("trackingConfigs", session)
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
    Record<string, { prompt: string; response: string; mentions: number; citationCount: number; ownDomainCited: boolean; citations: string[] }[]>
  >((acc, r) => {
    if (!acc[r.provider]) acc[r.provider] = [];
    const rawCits = (r.citations as string[] | null) ?? [];
    const cits = rawCits.length > 0 ? rawCits : extractUrlsFromText(r.response);
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
      citations: cits,
    });
    return acc;
  }, {});

  const sourceResults = results.map((r) => {
    const raw = (r.citations as string[] | null) ?? [];
    const cits = raw.length > 0 ? raw : extractUrlsFromText(r.response);
    return {
      provider: r.provider as "chatgpt" | "claude" | "gemini" | "perplexity",
      prompt: r.prompt,
      citations: cits.length > 0 ? cits : null,
    };
  });

  const citationResults = results.map((r) => {
    const raw = (r.citations as string[] | null) ?? [];
    const cits = raw.length > 0 ? raw : extractUrlsFromText(r.response);
    return {
      provider: r.provider,
      response: r.response,
      citations: cits.length > 0 ? cits : null,
    };
  });

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

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <Button asChild variant="ghost" size="sm">
            <Link
              href="/dashboard/runs"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToRuns")}
            </Link>
          </Button>
        </div>
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

      <SourceUrls
        results={sourceResults}
        favicons={faviconObj}
        translations={{
          title: tSrc("title"),
          totalUrls: tSrc("totalUrls"),
          provider: tSrc("provider"),
          prompt: tSrc("prompt"),
          citedBy: tSrc("citedBy"),
          noCitations: tSrc("noCitations"),
          showAll: tSrc("showAll"),
          showLess: tSrc("showLess"),
          urlsCited: tSrc("urlsCited"),
          timesShort: tSrc("timesShort"),
        }}
      />

      {Object.entries(byProvider).map(([provider, items]) => (
        <ProviderResultsCard
          key={provider}
          provider={provider}
          items={items}
          translations={{
            prompt: t("prompt"),
            mentions: t("mentions"),
            citations: t("citations"),
            responseExcerpt: t("responseExcerpt"),
            filterAll: t("filterAll"),
            filterWithMention: t("filterWithMention"),
            filterWithoutMention: t("filterWithoutMention"),
            filterWithSource: t("filterWithSource"),
            filterWithoutSource: t("filterWithoutSource"),
            noMatchingResults: t("noMatchingResults"),
          }}
        />
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
