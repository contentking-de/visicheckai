import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  trackingConfigs,
  domains,
  promptSets,
} from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Play } from "lucide-react";
import { RunConfigButton } from "@/components/run-config-button";
import { DeleteConfigButton } from "@/components/delete-config-button";

export default async function ConfigsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const configs = await db
    .select({
      config: trackingConfigs,
      domain: domains,
      promptSet: promptSets,
    })
    .from(trackingConfigs)
    .innerJoin(domains, eq(trackingConfigs.domainId, domains.id))
    .innerJoin(promptSets, eq(trackingConfigs.promptSetId, promptSets.id))
    .where(eq(trackingConfigs.userId, session.user.id));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tracking-Konfiguration</h1>
          <p className="text-muted-foreground">
            Verbinden Sie Domains mit Prompt-Sets und legen Sie das Intervall fest
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/configs/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Konfiguration erstellen
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead>Prompt-Set</TableHead>
              <TableHead>Intervall</TableHead>
              <TableHead className="w-[150px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Noch keine Konfigurationen.{" "}
                  <Link
                    href="/dashboard/configs/new"
                    className="text-primary underline"
                  >
                    Erste erstellen
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              configs.map(({ config, domain, promptSet }) => (
                <TableRow key={config.id}>
                  <TableCell className="font-medium">{domain.name}</TableCell>
                  <TableCell>{promptSet.name}</TableCell>
                  <TableCell>
                    {config.interval === "daily"
                      ? "Täglich"
                      : config.interval === "weekly"
                        ? "Wöchentlich"
                        : config.interval === "monthly"
                          ? "Monatlich"
                          : "On-demand"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <RunConfigButton configId={config.id} />
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
