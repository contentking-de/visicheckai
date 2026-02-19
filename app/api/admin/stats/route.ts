import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, domains, promptSets, trackingResults } from "@/lib/schema";
import { sql, count } from "drizzle-orm";
import type { UserRole } from "@/lib/schema";

// Pricing per 1M tokens (USD) – update when models change
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  chatgpt:    { input: 0.15,  output: 0.60 },  // gpt-4o-mini-search-preview
  claude:     { input: 0.80,  output: 4.00 },  // claude-haiku-4-5-20251001
  gemini:     { input: 0.075, output: 0.30 },  // gemini-2.0-flash
  perplexity: { input: 1.00,  output: 1.00 },  // sonar
};

const CHARS_PER_TOKEN = 4;

/**
 * Hybrid token calculation: use real token counts from API when available,
 * fall back to character-based estimation for legacy rows (before tracking).
 */
const ACTUAL_INPUT_TOKENS = sql<number>`coalesce(sum(input_tokens), 0)`;
const ACTUAL_OUTPUT_TOKENS = sql<number>`coalesce(sum(output_tokens), 0)`;
const ESTIMATED_INPUT_TOKENS = sql<number>`coalesce(sum(case when input_tokens is null then length(prompt) / ${CHARS_PER_TOKEN} else 0 end), 0)`;
const ESTIMATED_OUTPUT_TOKENS = sql<number>`coalesce(sum(case when output_tokens is null then length(response) / ${CHARS_PER_TOKEN} else 0 end), 0)`;
const ROWS_WITH_USAGE = sql<number>`count(input_tokens)`;
const TOTAL_ROWS = sql<number>`count(*)`;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers] = await db
    .select({ count: count() })
    .from(users);

  const [totalDomains] = await db
    .select({ count: count() })
    .from(domains);

  const [totalPromptSets] = await db
    .select({ count: count() })
    .from(promptSets);

  const [totalApiCalls] = await db
    .select({ count: count() })
    .from(trackingResults);

  // Users over time (grouped by day)
  const usersOverTime = await db
    .select({
      date: sql<string>`to_char(registered_at, 'YYYY-MM-DD')`.as("date"),
      count: count(),
    })
    .from(users)
    .where(sql`registered_at IS NOT NULL`)
    .groupBy(sql`to_char(registered_at, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(registered_at, 'YYYY-MM-DD')`);

  // Domains over time (grouped by day)
  const domainsOverTime = await db
    .select({
      date: sql<string>`to_char(created_at, 'YYYY-MM-DD')`.as("date"),
      count: count(),
    })
    .from(domains)
    .where(sql`created_at IS NOT NULL`)
    .groupBy(sql`to_char(created_at, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM-DD')`);

  // Prompt sets over time (grouped by day)
  const promptSetsOverTime = await db
    .select({
      date: sql<string>`to_char(created_at, 'YYYY-MM-DD')`.as("date"),
      count: count(),
    })
    .from(promptSets)
    .where(sql`created_at IS NOT NULL`)
    .groupBy(sql`to_char(created_at, 'YYYY-MM-DD')`)
    .orderBy(sql`to_char(created_at, 'YYYY-MM-DD')`);

  // API calls per day per provider (last 90 days)
  const apiCallsPerDay = await db
    .select({
      date: sql<string>`to_char(created_at, 'YYYY-MM-DD')`.as("date"),
      provider: trackingResults.provider,
      count: count(),
    })
    .from(trackingResults)
    .where(sql`created_at >= now() - interval '90 days'`)
    .groupBy(
      sql`to_char(created_at, 'YYYY-MM-DD')`,
      trackingResults.provider
    )
    .orderBy(sql`to_char(created_at, 'YYYY-MM-DD')`);

  // Transform API calls into a pivoted format for the chart
  const apiCallsMap = new Map<
    string,
    { date: string; chatgpt: number; claude: number; gemini: number; perplexity: number; total: number }
  >();

  for (const row of apiCallsPerDay) {
    if (!row.date) continue;
    if (!apiCallsMap.has(row.date)) {
      apiCallsMap.set(row.date, {
        date: row.date,
        chatgpt: 0,
        claude: 0,
        gemini: 0,
        perplexity: 0,
        total: 0,
      });
    }
    const entry = apiCallsMap.get(row.date)!;
    const provider = row.provider as keyof typeof entry;
    if (provider in entry && provider !== "date" && provider !== "total") {
      entry[provider] = row.count;
      entry.total += row.count;
    }
  }

  // Cost calculation: use real token counts when available, estimate for legacy data
  const costByProvider = await db
    .select({
      provider: trackingResults.provider,
      actualInput: ACTUAL_INPUT_TOKENS.as("actual_input"),
      actualOutput: ACTUAL_OUTPUT_TOKENS.as("actual_output"),
      estimatedInput: ESTIMATED_INPUT_TOKENS.as("estimated_input"),
      estimatedOutput: ESTIMATED_OUTPUT_TOKENS.as("estimated_output"),
      rowsWithUsage: ROWS_WITH_USAGE.as("rows_with_usage"),
      totalRows: TOTAL_ROWS.as("total_rows"),
      calls: count(),
    })
    .from(trackingResults)
    .groupBy(trackingResults.provider);

  const costs: Record<string, { provider: string; inputTokens: number; outputTokens: number; cost: number; calls: number; hasActualUsage: boolean }> = {};
  let totalCost = 0;
  let totalWithUsage = 0;
  let totalRowsAll = 0;

  for (const row of costByProvider) {
    const p = row.provider;
    const pricing = MODEL_PRICING[p];
    if (!pricing) continue;

    const inputTokens = Number(row.actualInput ?? 0) + Number(row.estimatedInput ?? 0);
    const outputTokens = Number(row.actualOutput ?? 0) + Number(row.estimatedOutput ?? 0);
    const withUsage = Number(row.rowsWithUsage ?? 0);
    const total = Number(row.totalRows ?? 0);
    const cost =
      (inputTokens / 1_000_000) * pricing.input +
      (outputTokens / 1_000_000) * pricing.output;

    costs[p] = {
      provider: p,
      inputTokens,
      outputTokens,
      cost: Math.round(cost * 10000) / 10000,
      calls: row.calls,
      hasActualUsage: withUsage > 0,
    };
    totalCost += cost;
    totalWithUsage += withUsage;
    totalRowsAll += total;
  }

  // Daily cost breakdown (last 90 days) – hybrid: actual tokens + estimation fallback
  const dailyCostRows = await db
    .select({
      date: sql<string>`to_char(created_at, 'YYYY-MM-DD')`.as("date"),
      provider: trackingResults.provider,
      actualInput: sql<number>`coalesce(sum(input_tokens), 0)`.as("actual_input"),
      actualOutput: sql<number>`coalesce(sum(output_tokens), 0)`.as("actual_output"),
      estimatedInput: sql<number>`coalesce(sum(case when input_tokens is null then length(prompt) / ${CHARS_PER_TOKEN} else 0 end), 0)`.as("estimated_input"),
      estimatedOutput: sql<number>`coalesce(sum(case when output_tokens is null then length(response) / ${CHARS_PER_TOKEN} else 0 end), 0)`.as("estimated_output"),
    })
    .from(trackingResults)
    .where(sql`created_at >= now() - interval '90 days'`)
    .groupBy(sql`to_char(created_at, 'YYYY-MM-DD')`, trackingResults.provider)
    .orderBy(sql`to_char(created_at, 'YYYY-MM-DD')`);

  const dailyCostMap = new Map<
    string,
    { date: string; chatgpt: number; claude: number; gemini: number; perplexity: number; total: number }
  >();

  for (const row of dailyCostRows) {
    if (!row.date) continue;
    if (!dailyCostMap.has(row.date)) {
      dailyCostMap.set(row.date, { date: row.date, chatgpt: 0, claude: 0, gemini: 0, perplexity: 0, total: 0 });
    }
    const entry = dailyCostMap.get(row.date)!;
    const pricing = MODEL_PRICING[row.provider];
    if (!pricing) continue;

    const inputTokens = Number(row.actualInput ?? 0) + Number(row.estimatedInput ?? 0);
    const outputTokens = Number(row.actualOutput ?? 0) + Number(row.estimatedOutput ?? 0);
    const cost =
      (inputTokens / 1_000_000) * pricing.input +
      (outputTokens / 1_000_000) * pricing.output;
    const rounded = Math.round(cost * 10000) / 10000;

    const p = row.provider as keyof typeof entry;
    if (p in entry && p !== "date" && p !== "total") {
      (entry[p] as number) = rounded;
      entry.total += rounded;
    }
  }

  // Build cumulative series for users
  let cumUsers = 0;
  const usersCumulative = usersOverTime.map((row) => {
    cumUsers += row.count;
    return { date: row.date, count: cumUsers };
  });

  // Build cumulative series for domains
  let cumDomains = 0;
  const domainsCumulative = domainsOverTime.map((row) => {
    cumDomains += row.count;
    return { date: row.date, count: cumDomains };
  });

  // Build cumulative series for prompt sets
  let cumPromptSets = 0;
  const promptSetsCumulative = promptSetsOverTime.map((row) => {
    cumPromptSets += row.count;
    return { date: row.date, count: cumPromptSets };
  });

  const usageCoverage = totalRowsAll > 0
    ? Math.round((totalWithUsage / totalRowsAll) * 100)
    : 0;

  return NextResponse.json({
    totals: {
      users: totalUsers.count,
      domains: totalDomains.count,
      promptSets: totalPromptSets.count,
      apiCalls: totalApiCalls.count,
      estimatedCost: Math.round(totalCost * 100) / 100,
    },
    usageCoverage,
    usersOverTime: usersCumulative,
    domainsOverTime: domainsCumulative,
    promptSetsOverTime: promptSetsCumulative,
    apiCallsPerDay: Array.from(apiCallsMap.values()),
    costByProvider: Object.values(costs),
    dailyCosts: Array.from(dailyCostMap.values()),
  });
}
