import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  trackingRuns,
  trackingConfigs,
  domains,
  promptSets,
} from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Play } from "lucide-react";

export default async function RunsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

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
    .where(eq(trackingConfigs.userId, session.user.id))
    .orderBy(desc(trackingRuns.startedAt))
    .limit(50);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tracking Runs</h1>
          <p className="text-muted-foreground">
            Verlauf und Ergebnisse Ihrer Sichtbarkeits-Checks
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/configs" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Neuen Run starten
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Prompt-Set</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Gestartet</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runsWithConfig.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Noch keine Runs.{" "}
                  <Link
                    href="/dashboard/configs"
                    className="text-primary underline"
                  >
                    Tracking konfigurieren
                  </Link>{" "}
                  und einen Run starten.
                </TableCell>
              </TableRow>
            ) : (
              runsWithConfig.map(({ run, domain, promptSet }) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">{domain.name}</TableCell>
                  <TableCell>{promptSet.name}</TableCell>
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
                      ? new Date(run.startedAt).toLocaleString("de-DE")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/runs/${run.id}`}>Details</Link>
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
