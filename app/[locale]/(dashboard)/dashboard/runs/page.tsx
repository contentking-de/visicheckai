import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  trackingRuns,
  trackingConfigs,
  domains,
  promptSets,
} from "@/lib/schema";
import { eq, desc, and, type SQL } from "drizzle-orm";
import { teamFilter } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play, Eye } from "lucide-react";
import { RunsFilter } from "@/components/runs-filter";
import { getTranslations, getLocale } from "next-intl/server";

export default async function RunsPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; promptSet?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getTranslations("Runs");
  const tc = await getTranslations("Common");
  const tConfigs = await getTranslations("Configs");
  const locale = await getLocale();
  const params = await searchParams;
  const domainFilter = params.domain ?? "";
  const promptSetFilter = params.promptSet ?? "";

  // Build where conditions
  const conditions: SQL[] = [teamFilter("trackingConfigs", session)];
  if (domainFilter) {
    conditions.push(eq(domains.id, domainFilter));
  }
  if (promptSetFilter) {
    conditions.push(eq(promptSets.id, promptSetFilter));
  }

  const runsWithConfig = await db
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
    .where(and(...conditions))
    .orderBy(desc(trackingRuns.startedAt))
    .limit(50);

  // Fetch available filter options (only domains/promptSets the user actually has runs for)
  const userDomains = await db
    .selectDistinct({ id: domains.id, name: domains.name })
    .from(domains)
    .where(teamFilter("domains", session))
    .orderBy(domains.name);

  const userPromptSets = await db
    .selectDistinct({ id: promptSets.id, name: promptSets.name })
    .from(promptSets)
    .where(teamFilter("promptSets", session))
    .orderBy(promptSets.name);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/configs" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            {t("startRun")}
          </Link>
        </Button>
      </div>

      <RunsFilter
        domains={userDomains}
        promptSets={userPromptSets}
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Prompt-Set</TableHead>
              <TableHead>{tConfigs("country")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("startedAt")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runsWithConfig.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {domainFilter || promptSetFilter ? (
                    t("noFilterResults")
                  ) : (
                    <>
                      {t("empty")}{" "}
                      <Link
                        href="/dashboard/configs"
                        className="text-primary underline"
                      >
                        {t("configureTracking")}
                      </Link>{" "}
                      {t("andStartRun")}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              runsWithConfig.map(({ run, config, domain, promptSet }) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">{domain.name}</TableCell>
                  <TableCell>{promptSet.name}</TableCell>
                  <TableCell>
                    {config.country ? tConfigs(`country${config.country}`) : tConfigs("countryDE")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        run.status === "completed"
                          ? "text-green-600"
                          : run.status === "failed"
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }
                    >
                      {run.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {run.startedAt
                      ? new Date(run.startedAt).toLocaleString(locale)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/runs/${run.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        {tc("details")}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
