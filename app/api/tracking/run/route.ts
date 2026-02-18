import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  trackingConfigs,
  trackingRuns,
  trackingResults,
  domains,
  promptSets,
  users,
} from "@/lib/schema";
import { requireAccess, getAccessStatus } from "@/lib/access";
import { checkPromptQuota } from "@/lib/usage";
import { eq, and } from "drizzle-orm";
import { NextResponse, after } from "next/server";
import { runProvider, type Provider } from "@/lib/ai-providers";
import { analyzeSentiment } from "@/lib/sentiment";
import { fetchFaviconsForDomains } from "@/lib/favicon";
import { sendRunCompletedEmail } from "@/lib/email";

export const maxDuration = 300; // 5 minutes max

const PROVIDERS: Provider[] = ["chatgpt", "claude", "gemini", "perplexity"];
const PROMPT_BATCH_SIZE = 5;

async function executePromptForAllProviders(
  prompt: string,
  providers: Provider[],
  domainUrl: string,
  runId: string,
  brandName?: string
) {
  const results = await Promise.allSettled(
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
        return { provider, status: "ok" as const };
      } catch (err) {
        console.error(`Provider ${provider} failed for prompt "${prompt.slice(0, 50)}...":`, err);
        await db.insert(trackingResults).values({
          runId,
          provider,
          prompt,
          response: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
          mentionCount: 0,
          visibilityScore: 0,
        });
        return { provider, status: "error" as const };
      }
    })
  );

  return results;
}

async function processRunInBackground(
  runId: string,
  configId: string,
  domainUrl: string,
  domainName: string,
  prompts: string[],
  interval: string | null,
  userEmail: string
) {
  const totalCalls = prompts.length * PROVIDERS.length;
  console.log(`[Run ${runId}] Starte im Hintergrund: ${prompts.length} Prompts × ${PROVIDERS.length} Provider = ${totalCalls} Calls`);
  const startTime = Date.now();

  try {
    for (let i = 0; i < prompts.length; i += PROMPT_BATCH_SIZE) {
      const batch = prompts.slice(i, i + PROMPT_BATCH_SIZE);
      const batchNum = Math.floor(i / PROMPT_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(prompts.length / PROMPT_BATCH_SIZE);

      console.log(`[Run ${runId}] Batch ${batchNum}/${totalBatches} (${batch.length} Prompts × ${PROVIDERS.length} Provider = ${batch.length * PROVIDERS.length} Calls)`);

      await Promise.allSettled(
        batch.map((prompt) =>
          executePromptForAllProviders(prompt, PROVIDERS, domainUrl, runId, domainName)
        )
      );

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const processed = Math.min(i + PROMPT_BATCH_SIZE, prompts.length);
      console.log(`[Run ${runId}] Fortschritt: ${processed}/${prompts.length} Prompts abgeschlossen (${elapsed}s)`);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Run ${runId}] Abgeschlossen in ${totalTime}s`);

    await db
      .update(trackingRuns)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(trackingRuns.id, runId));

    if (interval && interval !== "on_demand") {
      const next = new Date();
      if (interval === "daily") next.setDate(next.getDate() + 1);
      else if (interval === "weekly") next.setDate(next.getDate() + 7);
      else if (interval === "monthly") next.setMonth(next.getMonth() + 1);
      await db
        .update(trackingConfigs)
        .set({ nextRunAt: next })
        .where(eq(trackingConfigs.id, configId));
    }

    // Fetch favicons for all cited domains
    const runResults = await db
      .select({ citations: trackingResults.citations })
      .from(trackingResults)
      .where(eq(trackingResults.runId, runId));
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

    await fetchFaviconsForDomains([...allDomains]).catch((err) =>
      console.error(`[Run ${runId}] Favicon fetch failed:`, err)
    );

    // Send email notification
    await sendRunCompletedEmail({
      to: userEmail,
      runId,
      domainName,
      promptCount: prompts.length,
      status: "completed",
    });
  } catch (err) {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[Run ${runId}] Fehlgeschlagen nach ${totalTime}s:`, err);

    await db
      .update(trackingRuns)
      .set({ status: "failed", completedAt: new Date() })
      .where(eq(trackingRuns.id, runId));

    // Send failure notification
    await sendRunCompletedEmail({
      to: userEmail,
      runId,
      domainName,
      promptCount: prompts.length,
      status: "failed",
    });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const denied = await requireAccess(session as Parameters<typeof requireAccess>[0]);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const configId = body.configId as string | undefined;

  const teamId = session.user.teamId;

  let config;
  if (configId) {
    const filter = teamId
      ? and(eq(trackingConfigs.id, configId), eq(trackingConfigs.teamId, teamId))
      : and(eq(trackingConfigs.id, configId), eq(trackingConfigs.userId, session.user.id));
    const [c] = await db.select().from(trackingConfigs).where(filter);
    config = c;
  } else {
    const filter = teamId
      ? eq(trackingConfigs.teamId, teamId)
      : eq(trackingConfigs.userId, session.user.id);
    const configs = await db.select().from(trackingConfigs).where(filter);
    config = configs[0];
  }

  if (!config) {
    return NextResponse.json(
      { error: "Keine Tracking-Konfiguration gefunden" },
      { status: 400 }
    );
  }

  const [domain] = await db
    .select()
    .from(domains)
    .where(eq(domains.id, config.domainId));
  const [promptSet] = await db
    .select()
    .from(promptSets)
    .where(eq(promptSets.id, config.promptSetId));

  if (!domain || !promptSet) {
    return NextResponse.json({ error: "Domain oder Prompt-Set nicht gefunden" }, { status: 400 });
  }

  const prompts = (promptSet.prompts as string[]) ?? [];

  // Quota check: ensure the team/user has enough prompts remaining
  const access = await getAccessStatus(
    session.user.id,
    teamId,
    (session as { user: { role?: string | null } }).user.role
  );
  const quota = await checkPromptQuota(
    session.user.id,
    teamId,
    access.isTrial,
    prompts.length
  );
  if (!quota.allowed) {
    return NextResponse.json(
      {
        error: quota.reason,
        code: "PROMPT_LIMIT_EXCEEDED",
        usage: quota.usage,
      },
      { status: 429 }
    );
  }

  // Get user email for notification
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id));

  if (!user?.email) {
    return NextResponse.json({ error: "Benutzer-E-Mail nicht gefunden" }, { status: 400 });
  }

  const [run] = await db
    .insert(trackingRuns)
    .values({ configId: config.id, status: "running" })
    .returning();

  if (!run) {
    return NextResponse.json({ error: "Run konnte nicht erstellt werden" }, { status: 500 });
  }

  // Schedule background processing — response is sent immediately
  after(() =>
    processRunInBackground(
      run.id,
      config.id,
      domain.domainUrl,
      domain.name,
      prompts,
      config.interval,
      user.email!
    )
  );

  return NextResponse.json({ runId: run.id, status: "running" });
}
