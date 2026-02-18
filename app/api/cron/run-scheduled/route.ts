import { db } from "@/lib/db";
import { trackingConfigs, trackingRuns, trackingResults, domains, promptSets, users } from "@/lib/schema";
import { eq, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { runProvider, type Provider } from "@/lib/ai-providers";
import { analyzeSentiment } from "@/lib/sentiment";
import { fetchFaviconsForDomains } from "@/lib/favicon";
import { sendRunCompletedEmail } from "@/lib/email";
import { getAccessStatus } from "@/lib/access";
import { checkPromptQuota } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PROVIDERS: Provider[] = ["chatgpt", "claude", "gemini", "perplexity"];
const PROMPT_BATCH_SIZE = 5;

async function executePromptForAllProviders(
  prompt: string,
  providers: Provider[],
  domainUrl: string,
  runId: string,
  brandName?: string
) {
  await Promise.allSettled(
    providers.map(async (provider) => {
      try {
        const { response, mentionCount, visibilityScore, citations } = await runProvider(
          provider,
          prompt,
          domainUrl,
          brandName
        );
        const { sentiment, sentimentScore } = await analyzeSentiment(response, brandName ?? domainUrl);
        await db.insert(trackingResults).values({
          runId,
          provider,
          prompt,
          response,
          mentionCount,
          visibilityScore,
          citations,
          sentiment,
          sentimentScore,
        });
      } catch (err) {
        console.error(`[Cron] Provider ${provider} failed:`, err);
        await db.insert(trackingResults).values({
          runId,
          provider,
          prompt,
          response: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
          mentionCount: 0,
          visibilityScore: 0,
        });
      }
    })
  );
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dueConfigs = await db
    .select()
    .from(trackingConfigs)
    .where(
      lte(trackingConfigs.nextRunAt, now)
    );

  for (const config of dueConfigs) {
    const [domain] = await db
      .select()
      .from(domains)
      .where(eq(domains.id, config.domainId));
    const [promptSet] = await db
      .select()
      .from(promptSets)
      .where(eq(promptSets.id, config.promptSetId));

    if (!domain || !promptSet) continue;

    const prompts = (promptSet.prompts as string[]) ?? [];

    // Quota check: skip this config if the team/user has exceeded their limit
    const access = await getAccessStatus(config.userId, config.teamId);
    const quota = await checkPromptQuota(
      config.userId,
      config.teamId,
      access.isTrial,
      prompts.length
    );
    if (!quota.allowed) {
      console.log(
        `[Cron] Skipping config ${config.id}: ${quota.reason}`
      );
      continue;
    }

    // Get user email for notification
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, config.userId));

    const [run] = await db
      .insert(trackingRuns)
      .values({ configId: config.id, status: "running" })
      .returning();

    if (!run) continue;
    const totalCalls = prompts.length * PROVIDERS.length;

    console.log(`[Cron Run ${run.id}] Starte: ${prompts.length} Prompts × ${PROVIDERS.length} Provider = ${totalCalls} Calls`);
    const startTime = Date.now();

    let runStatus: "completed" | "failed" = "completed";

    try {
      for (let i = 0; i < prompts.length; i += PROMPT_BATCH_SIZE) {
        const batch = prompts.slice(i, i + PROMPT_BATCH_SIZE);

        await Promise.allSettled(
          batch.map((prompt) =>
            executePromptForAllProviders(prompt, PROVIDERS, domain.domainUrl, run.id, domain.name)
          )
        );

        const processed = Math.min(i + PROMPT_BATCH_SIZE, prompts.length);
        console.log(`[Cron Run ${run.id}] Fortschritt: ${processed}/${prompts.length} Prompts`);
      }

      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[Cron Run ${run.id}] Abgeschlossen in ${totalTime}s`);

      await db
        .update(trackingRuns)
        .set({ status: "completed", completedAt: new Date() })
        .where(eq(trackingRuns.id, run.id));

      // Fetch favicons for all cited domains
      const runResults = await db
        .select({ citations: trackingResults.citations })
        .from(trackingResults)
        .where(eq(trackingResults.runId, run.id));
      const allDomains = new Set<string>();
      for (const r of runResults) {
        const cits = r.citations as string[] | null;
        if (!cits) continue;
        for (const url of cits) {
          try {
            allDomains.add(new URL(url).hostname.replace(/^www\./, ""));
          } catch { /* skip invalid URLs */ }
        }
      }
      fetchFaviconsForDomains([...allDomains]).catch((err) =>
        console.error(`[Cron Run ${run.id}] Favicon fetch failed:`, err)
      );
    } catch (err) {
      console.error(`[Cron Run ${run.id}] Fehlgeschlagen:`, err);
      runStatus = "failed";
      await db
        .update(trackingRuns)
        .set({ status: "failed", completedAt: new Date() })
        .where(eq(trackingRuns.id, run.id));
    }

    if (config.interval && config.interval !== "on_demand") {
      const next = new Date();
      if (config.interval === "daily") next.setDate(next.getDate() + 1);
      else if (config.interval === "weekly") next.setDate(next.getDate() + 7);
      else if (config.interval === "monthly") next.setMonth(next.getMonth() + 1);
      await db
        .update(trackingConfigs)
        .set({ nextRunAt: next })
        .where(eq(trackingConfigs.id, config.id));
    }

    // Send email notification
    if (user?.email) {
      await sendRunCompletedEmail({
        to: user.email,
        runId: run.id,
        domainName: domain.name,
        promptCount: prompts.length,
        status: runStatus,
      });
    }
  }

  return NextResponse.json({
    processed: dueConfigs.length,
  });
}
