import { db } from "@/lib/db";
import {
  trackingResults,
  trackingRuns,
  trackingConfigs,
  subscriptions,
} from "@/lib/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { PLANS, TRIAL_PROMPTS_PER_MONTH } from "@/lib/plans";

export type PromptUsageInfo = {
  used: number;
  limit: number;
  remaining: number;
  periodStart: Date;
  periodEnd: Date;
};

/**
 * Counts the number of unique prompts executed within a date range
 * for a given team (or user if no team).
 *
 * Each prompt text per run counts as 1, regardless of how many providers
 * processed it (each prompt generates one result per provider).
 */
async function countPromptsInPeriod(
  teamId: string | null | undefined,
  userId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<number> {
  const ownerFilter = teamId
    ? eq(trackingConfigs.teamId, teamId)
    : eq(trackingConfigs.userId, userId);

  const [result] = await db
    .select({
      count: sql<number>`count(distinct (${trackingResults.runId}, ${trackingResults.prompt}))`,
    })
    .from(trackingResults)
    .innerJoin(trackingRuns, eq(trackingResults.runId, trackingRuns.id))
    .innerJoin(trackingConfigs, eq(trackingRuns.configId, trackingConfigs.id))
    .where(
      and(
        ownerFilter,
        gte(trackingResults.createdAt, periodStart),
        lte(trackingResults.createdAt, periodEnd)
      )
    );

  return Number(result?.count ?? 0);
}

/**
 * Returns the current prompt usage for a team/user, taking into account
 * their subscription plan or trial status.
 */
export async function getPromptUsage(
  userId: string,
  teamId: string | null | undefined,
  isTrial: boolean
): Promise<PromptUsageInfo> {
  let limit: number;
  let periodStart: Date;
  let periodEnd: Date;

  if (!isTrial && teamId) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.teamId, teamId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (sub && sub.currentPeriodStart && sub.currentPeriodEnd) {
      const plan = PLANS[sub.plan as keyof typeof PLANS];
      limit = plan?.promptsPerMonth ?? 0;
      periodStart = sub.currentPeriodStart;
      periodEnd = sub.currentPeriodEnd;
    } else {
      limit = 0;
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
  } else {
    limit = TRIAL_PROMPTS_PER_MONTH;
    const now = new Date();
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  const used = await countPromptsInPeriod(teamId, userId, periodStart, periodEnd);

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    periodStart,
    periodEnd,
  };
}

export type QuotaCheckResult =
  | { allowed: true; usage: PromptUsageInfo }
  | { allowed: false; usage: PromptUsageInfo; reason: string };

/**
 * Checks whether executing `promptCount` additional prompts
 * would exceed the quota. Returns { allowed, usage, reason? }.
 */
export async function checkPromptQuota(
  userId: string,
  teamId: string | null | undefined,
  isTrial: boolean,
  promptCount: number
): Promise<QuotaCheckResult> {
  const usage = await getPromptUsage(userId, teamId, isTrial);

  if (usage.remaining < promptCount) {
    return {
      allowed: false,
      usage,
      reason:
        `Prompt-Limit erreicht: ${usage.used}/${usage.limit} verwendet. ` +
        `Dieser Run benötigt ${promptCount} Prompts, es sind aber nur noch ${usage.remaining} verfügbar.`,
    };
  }

  return { allowed: true, usage };
}
