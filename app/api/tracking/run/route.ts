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

  const providers: Provider[] = ["chatgpt", "claude", "gemini", "perplexity"];
  const prompts = (promptSet.prompts as string[]) ?? [];

  try {
    for (const prompt of prompts) {
      for (const provider of providers) {
        try {
          const { response, mentionCount, visibilityScore } = await runProvider(
            provider,
            prompt,
            domain.domainUrl
          );
          await db.insert(trackingResults).values({
            runId: run.id,
            provider,
            prompt,
            response,
            mentionCount,
            visibilityScore,
          });
        } catch (err) {
          console.error(`Provider ${provider} failed:`, err);
          await db.insert(trackingResults).values({
            runId: run.id,
            provider,
            prompt,
            response: `Error: ${err instanceof Error ? err.message : "Unknown"}`,
            mentionCount: 0,
            visibilityScore: 0,
          });
        }
      }
    }

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

    return NextResponse.json({ runId: run.id, status: "completed" });
  } catch (err) {
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
