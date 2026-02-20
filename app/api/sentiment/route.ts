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
import { eq, and, isNotNull, type SQL } from "drizzle-orm";
import { PHASE_SUBCATEGORIES, type FunnelPhase } from "@/lib/prompt-categories";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const denied = await requireAccess(session as Parameters<typeof requireAccess>[0]);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get("domain") ?? "";
  const runId = searchParams.get("runId") ?? "";
  const categoryFilter = searchParams.get("category") ?? "";

  const teamId = session.user.teamId;

  const conditions: SQL[] = [
    teamId
      ? eq(trackingConfigs.teamId, teamId)
      : eq(trackingConfigs.userId, session.user.id),
    isNotNull(trackingResults.sentiment),
  ];

  if (domainId) conditions.push(eq(domains.id, domainId));
  if (runId) conditions.push(eq(trackingRuns.id, runId));

  const allResultsRaw = await db
    .select({
      sentiment: trackingResults.sentiment,
      sentimentScore: trackingResults.sentimentScore,
      provider: trackingResults.provider,
      prompt: trackingResults.prompt,
      response: trackingResults.response,
      createdAt: trackingResults.createdAt,
      domainName: domains.name,
      intentCategories: promptSets.intentCategories,
    })
    .from(trackingResults)
    .innerJoin(trackingRuns, eq(trackingResults.runId, trackingRuns.id))
    .innerJoin(trackingConfigs, eq(trackingRuns.configId, trackingConfigs.id))
    .innerJoin(domains, eq(trackingConfigs.domainId, domains.id))
    .innerJoin(promptSets, eq(trackingConfigs.promptSetId, promptSets.id))
    .where(and(...conditions));

  const allResults = categoryFilter
    ? allResultsRaw.filter((r) => {
        const cats = r.intentCategories ?? [];
        const phaseSubs = PHASE_SUBCATEGORIES[categoryFilter as FunnelPhase] ?? [];
        return phaseSubs.some((sub) => cats.includes(sub));
      })
    : allResultsRaw;

  // --- Totals ---
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let totalScore = 0;

  for (const r of allResults) {
    if (r.sentiment === "positive") positive++;
    else if (r.sentiment === "negative") negative++;
    else neutral++;
    totalScore += r.sentimentScore ?? 0;
  }
  const total = allResults.length;
  const avgScore = total > 0 ? Math.round(totalScore / total) : 0;

  // --- By provider ---
  const byProvider: Record<string, { positive: number; neutral: number; negative: number; avgScore: number; total: number }> = {};
  for (const r of allResults) {
    if (!byProvider[r.provider]) {
      byProvider[r.provider] = { positive: 0, neutral: 0, negative: 0, avgScore: 0, total: 0 };
    }
    const p = byProvider[r.provider];
    p.total++;
    if (r.sentiment === "positive") p.positive++;
    else if (r.sentiment === "negative") p.negative++;
    else p.neutral++;
    p.avgScore += r.sentimentScore ?? 0;
  }
  for (const key of Object.keys(byProvider)) {
    const p = byProvider[key];
    p.avgScore = p.total > 0 ? Math.round(p.avgScore / p.total) : 0;
  }

  // --- Over time (daily) ---
  const byDate: Record<string, { positive: number; neutral: number; negative: number; avgScore: number; count: number }> = {};
  for (const r of allResults) {
    const d = r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : "unknown";
    if (!byDate[d]) byDate[d] = { positive: 0, neutral: 0, negative: 0, avgScore: 0, count: 0 };
    const b = byDate[d];
    b.count++;
    if (r.sentiment === "positive") b.positive++;
    else if (r.sentiment === "negative") b.negative++;
    else b.neutral++;
    b.avgScore += r.sentimentScore ?? 0;
  }
  const overTime = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      positive: v.positive,
      neutral: v.neutral,
      negative: v.negative,
      avgScore: v.count > 0 ? Math.round(v.avgScore / v.count) : 0,
    }));

  // --- By prompt (top 20 worst) ---
  const byPrompt: Record<string, { totalScore: number; count: number; positive: number; neutral: number; negative: number }> = {};
  for (const r of allResults) {
    const key = r.prompt.slice(0, 200);
    if (!byPrompt[key]) byPrompt[key] = { totalScore: 0, count: 0, positive: 0, neutral: 0, negative: 0 };
    const p = byPrompt[key];
    p.count++;
    p.totalScore += r.sentimentScore ?? 0;
    if (r.sentiment === "positive") p.positive++;
    else if (r.sentiment === "negative") p.negative++;
    else p.neutral++;
  }
  const promptRanking = Object.entries(byPrompt)
    .map(([prompt, v]) => ({
      prompt,
      avgScore: v.count > 0 ? Math.round(v.totalScore / v.count) : 0,
      positive: v.positive,
      neutral: v.neutral,
      negative: v.negative,
      total: v.count,
    }))
    .sort((a, b) => a.avgScore - b.avgScore);

  // --- Recent negative results (last 10) ---
  const recentNegative = allResults
    .filter((r) => r.sentiment === "negative")
    .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0))
    .slice(0, 10)
    .map((r) => ({
      prompt: r.prompt,
      provider: r.provider,
      response: r.response.slice(0, 300),
      score: r.sentimentScore,
      date: r.createdAt,
      domain: r.domainName,
    }));

  return NextResponse.json({
    totals: { positive, neutral, negative, total, avgScore },
    byProvider,
    overTime,
    promptRanking,
    recentNegative,
  });
}
