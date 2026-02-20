import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { domains, trackingConfigs, promptSets } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { teamFilter } from "@/lib/rbac";
import { getTranslations } from "next-intl/server";
import { VisibilityCharts } from "@/components/visibility-charts";
import { VisibilityFilter } from "@/components/visibility-filter";

export default async function VisibilityPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; promptSet?: string }>;
}) {
  const [session, t, params] = await Promise.all([
    auth(),
    getTranslations("Visibility"),
    searchParams,
  ]);
  if (!session?.user?.id) return null;

  const domainFilter = params.domain ?? "";
  const promptSetFilter = params.promptSet ?? "";

  const [userDomains, configs] = await Promise.all([
    db
      .selectDistinct({ id: domains.id, name: domains.name })
      .from(domains)
      .where(teamFilter("domains", session))
      .orderBy(domains.name),
    db
      .select({
        promptSetId: trackingConfigs.promptSetId,
        promptSetName: promptSets.name,
        domainId: trackingConfigs.domainId,
      })
      .from(trackingConfigs)
      .innerJoin(promptSets, eq(trackingConfigs.promptSetId, promptSets.id))
      .where(teamFilter("trackingConfigs", session)),
  ]);

  const promptSetMap = new Map<
    string,
    { id: string; name: string; domainIds: string[] }
  >();
  for (const c of configs) {
    const existing = promptSetMap.get(c.promptSetId);
    if (existing) {
      if (!existing.domainIds.includes(c.domainId)) {
        existing.domainIds.push(c.domainId);
      }
    } else {
      promptSetMap.set(c.promptSetId, {
        id: c.promptSetId,
        name: c.promptSetName,
        domainIds: [c.domainId],
      });
    }
  }
  const promptSetOptions = Array.from(promptSetMap.values());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <VisibilityFilter domains={userDomains} promptSets={promptSetOptions} />

      <VisibilityCharts domainId={domainFilter} promptSetId={promptSetFilter} />
    </div>
  );
}
