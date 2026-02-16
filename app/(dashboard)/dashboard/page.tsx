import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  domains,
  promptSets,
  trackingRuns,
  trackingConfigs,
} from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Globe, FileText, BarChart3 } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getTranslations("Dashboard");
  const tc = await getTranslations("Common");

  const domainList = await db
    .select()
    .from(domains)
    .where(eq(domains.userId, session.user.id));
  const domainCount = domainList.length;

  const promptSetList = await db
    .select()
    .from(promptSets)
    .where(eq(promptSets.userId, session.user.id));
  const promptSetCount = promptSetList.length;

  const recentRuns = await db
    .select({ run: trackingRuns })
    .from(trackingRuns)
    .innerJoin(
      trackingConfigs,
      eq(trackingRuns.configId, trackingConfigs.id)
    )
    .where(eq(trackingConfigs.userId, session.user.id))
    .orderBy(desc(trackingRuns.startedAt))
    .limit(5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("welcome")}
        </p>
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

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/domains/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("addDomain")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            href="/dashboard/prompt-sets/new"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("createPromptSet")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
