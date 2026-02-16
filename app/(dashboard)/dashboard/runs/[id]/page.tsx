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
import { ArrowLeft } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";
import { ExpandableResponse } from "@/components/expandable-response";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getTranslations("RunDetail");
  const locale = await getLocale();

  const { id } = await params;
  const [runWithConfig] = await db
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
    );

  if (!runWithConfig) notFound();

  const { run, domain, promptSet } = runWithConfig;

  const results = await db
    .select()
    .from(trackingResults)
    .where(eq(trackingResults.runId, id));

  const byProvider = results.reduce<
    Record<string, { prompt: string; response: string; score: number; mentions: number }[]>
  >((acc, r) => {
    if (!acc[r.provider]) acc[r.provider] = [];
    acc[r.provider].push({
      prompt: r.prompt,
      response: r.response,
      score: r.visibilityScore ?? 0,
      mentions: r.mentionCount ?? 0,
    });
    return acc;
  }, {});

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
                  <TableHead>{t("score")}</TableHead>
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
                    <TableCell>{item.score}</TableCell>
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
