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

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Willkommen zurück! Hier ist Ihre Übersicht.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Domains</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domainCount}</div>
            <Button asChild variant="link" className="h-auto p-0">
              <Link href="/dashboard/domains">Verwalten</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Prompt-Sets</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promptSetCount}</div>
            <Button asChild variant="link" className="h-auto p-0">
              <Link href="/dashboard/prompt-sets">Verwalten</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Letzte Runs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentRuns.length}</div>
            <Button asChild variant="link" className="h-auto p-0">
              <Link href="/dashboard/runs">Alle anzeigen</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button asChild>
          <Link href="/dashboard/domains/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Domain hinzufügen
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link
            href="/dashboard/prompt-sets/new"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Prompt-Set erstellen
          </Link>
        </Button>
      </div>
    </div>
  );
}
