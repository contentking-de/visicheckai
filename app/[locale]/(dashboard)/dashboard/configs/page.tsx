import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  trackingConfigs,
  trackingRuns,
  domains,
  promptSets,
} from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
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
import { Plus, Pencil } from "lucide-react";
import { RunConfigButton } from "@/components/run-config-button";
import { DeleteConfigButton } from "@/components/delete-config-button";
import { getTranslations } from "next-intl/server";

export default async function ConfigsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getTranslations("Configs");
  const tc = await getTranslations("Common");

  const configs = await db
    .select({
      config: trackingConfigs,
      domain: domains,
      promptSet: promptSets,
    })
    .from(trackingConfigs)
    .innerJoin(domains, eq(trackingConfigs.domainId, domains.id))
    .innerJoin(promptSets, eq(trackingConfigs.promptSetId, promptSets.id))
    .where(teamFilter("trackingConfigs", session));

  // Check which configs have a currently running run
  const configIds = configs.map((c) => c.config.id);
  const runningRuns = configIds.length > 0
    ? await db
        .select({ configId: trackingRuns.configId })
        .from(trackingRuns)
        .where(
          and(
            inArray(trackingRuns.configId, configIds),
            eq(trackingRuns.status, "running")
          )
        )
    : [];
  const runningConfigIds = new Set(runningRuns.map((r) => r.configId));

  const intervalLabels: Record<string, string> = {
    daily: t("daily"),
    weekly: t("weekly"),
    monthly: t("monthly"),
    on_demand: t("onDemand"),
  };

  const countryLabels: Record<string, string> = {
    DE: t("countryDE"),
    CH: t("countryCH"),
    AT: t("countryAT"),
    UK: t("countryUK"),
    US: t("countryUS"),
    ES: t("countryES"),
    FR: t("countryFR"),
    NL: t("countryNL"),
  };

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
          <Link href="/dashboard/configs/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("createConfig")}
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Prompt-Set</TableHead>
              <TableHead className="text-right">{t("prompts")}</TableHead>
              <TableHead>{t("country")}</TableHead>
              <TableHead>{t("interval")}</TableHead>
              <TableHead className="w-[150px]">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {t("empty")}{" "}
                  <Link
                    href="/dashboard/configs/new"
                    className="text-primary underline"
                  >
                    {t("createFirst")}
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              configs.map(({ config, domain, promptSet }) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">{domain.name}</TableCell>
                  <TableCell>{promptSet.name}</TableCell>
                  <TableCell className="text-right">{(promptSet.prompts as string[]).length}</TableCell>
                  <TableCell>
                    {config.country ? (countryLabels[config.country] ?? config.country) : countryLabels["DE"]}
                  </TableCell>
                  <TableCell>
                    {config.interval ? (intervalLabels[config.interval] ?? config.interval) : t("onDemand")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="icon">
                        <Link href={`/dashboard/configs/${config.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <RunConfigButton configId={config.id} isRunning={runningConfigIds.has(config.id)} />
                      <DeleteConfigButton configId={config.id} />
                    </div>
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
