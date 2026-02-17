import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  trackingConfigs,
  trackingRuns,
  trackingResults,
  domains,
  promptSets,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { runProvider, type Provider } from "@/lib/ai-providers";
import { fetchFaviconsForDomains } from "@/lib/favicon";

export const maxDuration = 300; // 5 minutes max

const PROVIDERS: Provider[] = ["chatgpt", "claude", "gemini", "perplexity"];
const PROMPT_BATCH_SIZE = 5; // process 5 prompts concurrently (= 20 parallel API calls)

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
        await db.insert(trackingResults).values({
          runId,
          provider,
          prompt,
          response,
          mentionCount,
          visibilityScore,
          citations,
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

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const configId = body.configId as string | undefined;

  let config;
  if (configId) {
    const [c] = await db
      .select()
      .from(trackingConfigs)
      .where(and(eq(trackingConfigs.id, configId), eq(trackingConfigs.userId, session.user.id)));
    config = c;
  } else {
    const configs = await db
      .select()
      .from(trackingConfigs)
      .where(eq(trackingConfigs.userId, session.user.id));
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

  const [run] = await db
    .insert(trackingRuns)
    .values({ configId: config.id, status: "running" })
    .returning();

  if (!run) {
    return NextResponse.json({ error: "Run konnte nicht erstellt werden" }, { status: 500 });
  }

  const prompts = (promptSet.prompts as string[]) ?? [];
  const totalCalls = prompts.length * PROVIDERS.length;

  console.log(`[Run ${run.id}] Starte: ${prompts.length} Prompts × ${PROVIDERS.length} Provider = ${totalCalls} Calls`);
  const startTime = Date.now();

  try {
    // Process prompts in batches for controlled parallelism
    for (let i = 0; i < prompts.length; i += PROMPT_BATCH_SIZE) {
      const batch = prompts.slice(i, i + PROMPT_BATCH_SIZE);
      const batchNum = Math.floor(i / PROMPT_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(prompts.length / PROMPT_BATCH_SIZE);

      console.log(`[Run ${run.id}] Batch ${batchNum}/${totalBatches} (${batch.length} Prompts × ${PROVIDERS.length} Provider = ${batch.length * PROVIDERS.length} Calls)`);

      await Promise.allSettled(
        batch.map((prompt) =>
          executePromptForAllProviders(prompt, PROVIDERS, domain.domainUrl, run.id, domain.name)
        )
      );

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const processed = Math.min(i + PROMPT_BATCH_SIZE, prompts.length);
      console.log(`[Run ${run.id}] Fortschritt: ${processed}/${prompts.length} Prompts abgeschlossen (${elapsed}s)`);
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Run ${run.id}] Abgeschlossen in ${totalTime}s`);

    await db
      .update(trackingRuns)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(trackingRuns.id, run.id));

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

    // Fetch favicons for all cited domains in background (fire-and-forget)
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
      console.error(`[Run ${run.id}] Favicon fetch failed:`, err)
    );

    return NextResponse.json({ runId: run.id, status: "completed" });
  } catch (err) {
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`[Run ${run.id}] Fehlgeschlagen nach ${totalTime}s:`, err);

    await db
      .update(trackingRuns)
      .set({ status: "failed", completedAt: new Date() })
      .where(eq(trackingRuns.id, run.id));
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Run fehlgeschlagen" },
      { status: 500 }
    );
  }
}
