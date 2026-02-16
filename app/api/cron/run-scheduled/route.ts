import { db } from "@/lib/db";
import { trackingConfigs, trackingRuns, trackingResults, domains, promptSets } from "@/lib/schema";
import { eq, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { runProvider, type Provider } from "@/lib/ai-providers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

    const [run] = await db
      .insert(trackingRuns)
      .values({ configId: config.id, status: "running" })
      .returning();

    if (!run) continue;

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
    } catch (err) {
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
  }

  return NextResponse.json({
    processed: dueConfigs.length,
  });
}
