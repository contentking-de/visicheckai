import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAccess } from "@/lib/access";
import { db } from "@/lib/db";
import {
  trackingResults,
  trackingRuns,
  trackingConfigs,
  domains,
  promptSets,
} from "@/lib/schema";
import { eq, and, sql, type SQL } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const denied = await requireAccess(
    session as Parameters<typeof requireAccess>[0]
  );
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get("domain") ?? "";
  const promptSetId = searchParams.get("promptSet") ?? "";

  if (!domainId) {
    return NextResponse.json({ error: "domain is required" }, { status: 400 });
  }

  const teamId = session.user.teamId;

  const conditions: SQL[] = [
    teamId
      ? eq(trackingConfigs.teamId, teamId)
      : eq(trackingConfigs.userId, session.user.id),
    eq(domains.id, domainId),
  ];

  if (promptSetId) conditions.push(eq(promptSets.id, promptSetId));

  const rows = await db
    .select({
      date: sql<string>`to_char(${trackingResults.createdAt}, 'YYYY-MM-DD')`,
      provider: trackingResults.provider,
      avgScore: sql<number>`round(avg(${trackingResults.visibilityScore})::numeric, 1)`,
      avgMentions: sql<number>`round(avg(${trackingResults.mentionCount})::numeric, 1)`,
      count: sql<number>`count(*)::int`,
    })
    .from(trackingResults)
    .innerJoin(trackingRuns, eq(trackingResults.runId, trackingRuns.id))
    .innerJoin(trackingConfigs, eq(trackingRuns.configId, trackingConfigs.id))
    .innerJoin(domains, eq(trackingConfigs.domainId, domains.id))
    .innerJoin(promptSets, eq(trackingConfigs.promptSetId, promptSets.id))
    .where(and(...conditions))
    .groupBy(
      sql`to_char(${trackingResults.createdAt}, 'YYYY-MM-DD')`,
      trackingResults.provider
    )
    .orderBy(sql`to_char(${trackingResults.createdAt}, 'YYYY-MM-DD')`);

  const dateMap = new Map<
    string,
    {
      date: string;
      chatgpt: number | null;
      claude: number | null;
      gemini: number | null;
      perplexity: number | null;
      avg: number | null;
    }
  >();

  for (const row of rows) {
    if (!row.date) continue;
    let entry = dateMap.get(row.date);
    if (!entry) {
      entry = {
        date: row.date,
        chatgpt: null,
        claude: null,
        gemini: null,
        perplexity: null,
        avg: null,
      };
      dateMap.set(row.date, entry);
    }
    const score = row.avgScore != null ? Number(row.avgScore) : null;
    entry[row.provider as keyof typeof entry] = score as never;
  }

  for (const entry of dateMap.values()) {
    const scores = [entry.chatgpt, entry.claude, entry.gemini, entry.perplexity].filter(
      (v): v is number => v != null
    );
    entry.avg = scores.length
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : null;
  }

  const timeline = Array.from(dateMap.values());

  let latestAvg: number | null = null;
  let previousAvg: number | null = null;
  if (timeline.length >= 1) latestAvg = timeline[timeline.length - 1].avg;
  if (timeline.length >= 2) previousAvg = timeline[timeline.length - 2].avg;

  const totalRows = rows.reduce((s, r) => s + (r.count ?? 0), 0);

  return NextResponse.json({
    timeline,
    summary: {
      latestAvg,
      previousAvg,
      trend:
        latestAvg != null && previousAvg != null
          ? Math.round((latestAvg - previousAvg) * 10) / 10
          : null,
      totalDataPoints: totalRows,
      timelineDays: timeline.length,
    },
  });
}
