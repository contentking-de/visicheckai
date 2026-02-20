import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { domains, trackingRuns, trackingConfigs, promptSets } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { teamFilter } from "@/lib/rbac";
import { getTranslations, getLocale } from "next-intl/server";
import { SentimentCharts } from "@/components/sentiment-charts";
import { SentimentFilter } from "@/components/sentiment-filter";
import { FUNNEL_PHASES, PHASE_SUBCATEGORIES } from "@/lib/prompt-categories";

function derivePhasesFromSubs(categories: string[]): string[] {
  const phases = new Set<string>();
  for (const phase of FUNNEL_PHASES) {
    if (PHASE_SUBCATEGORIES[phase].some((s) => categories.includes(s))) {
      phases.add(phase);
    }
  }
  return Array.from(phases);
}

export default async function SentimentPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; runId?: string; category?: string }>;
}) {
  const [session, t, locale, params] = await Promise.all([
    auth(),
    getTranslations("Sentiment"),
    getLocale(),
    searchParams,
  ]);
  if (!session?.user?.id) return null;

  const domainFilter = params.domain ?? "";
  const runIdFilter = params.runId ?? "";
  const categoryFilter = params.category ?? "";

  const [userDomains, completedRuns] = await Promise.all([
    db
      .selectDistinct({ id: domains.id, name: domains.name })
      .from(domains)
      .where(teamFilter("domains", session))
      .orderBy(domains.name),
    db
      .select({
        id: trackingRuns.id,
        domainId: domains.id,
        domainName: domains.name,
        startedAt: trackingRuns.startedAt,
        intentCategories: promptSets.intentCategories,
      })
      .from(trackingRuns)
      .innerJoin(trackingConfigs, eq(trackingRuns.configId, trackingConfigs.id))
      .innerJoin(domains, eq(trackingConfigs.domainId, domains.id))
      .innerJoin(promptSets, eq(trackingConfigs.promptSetId, promptSets.id))
      .where(teamFilter("trackingConfigs", session))
      .orderBy(desc(trackingRuns.startedAt))
      .limit(100),
  ]);

  const runOptions = completedRuns.map((r) => ({
    id: r.id,
    domainId: r.domainId,
    domainName: r.domainName,
    startedAt: r.startedAt?.toISOString() ?? "",
    intentCategories: derivePhasesFromSubs(r.intentCategories ?? []),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <SentimentFilter domains={userDomains} runs={runOptions} />

      <SentimentCharts
        domainId={domainFilter}
        runId={runIdFilter}
        category={categoryFilter}
      />
    </div>
  );
}
