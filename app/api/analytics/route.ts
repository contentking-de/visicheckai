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
import { eq, and, type SQL } from "drizzle-orm";
import { PHASE_SUBCATEGORIES, type FunnelPhase } from "@/lib/prompt-categories";
import { extractUrlsFromText } from "@/lib/ai-providers";

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
  const categoryFilter = searchParams.get("category") ?? "";

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

  const allResultsRaw = await db
    .select({
      provider: trackingResults.provider,
      prompt: trackingResults.prompt,
      response: trackingResults.response,
      citations: trackingResults.citations,
      mentionCount: trackingResults.mentionCount,
      createdAt: trackingResults.createdAt,
      domainName: domains.name,
      domainUrl: domains.domainUrl,
      promptSetName: promptSets.name,
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

  if (allResults.length === 0) {
    return NextResponse.json({
      sourcesByProvider: {},
      brandOnlyByProvider: {},
      ownUrls: [],
      outputsWithSource: [],
      outputsBrandOnly: [],
    });
  }

  const domainUrl = allResults[0].domainUrl;
  const domainName = allResults[0].domainName;

  const normalizedDomain = domainUrl
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .toLowerCase();

  const domainNameLower = domainName.toLowerCase();

  const sourcesByProvider: Record<string, number> = {};
  const brandOnlyByProvider: Record<string, number> = {};

  const ownUrlMap = new Map<
    string,
    { count: number; prompts: { prompt: string; provider: string; date: string | null }[] }
  >();

  const outputsWithSource: {
    provider: string;
    prompt: string;
    response: string;
    mentionCount: number;
    date: string | null;
  }[] = [];

  const outputsBrandOnly: {
    provider: string;
    prompt: string;
    response: string;
    mentionCount: number;
    date: string | null;
  }[] = [];

  for (const r of allResults) {
    const responseLower = r.response.toLowerCase();

    // Check if domain URL appears in response text
    const hasDomainInText = responseLower.includes(normalizedDomain);

    const rawCitations = r.citations ?? [];
    const citations = rawCitations.length > 0 ? rawCitations : extractUrlsFromText(r.response);
    let hasDomainInCitations = false;
    for (const url of citations) {
      const normalizedUrl = url
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .toLowerCase();
      if (normalizedUrl.startsWith(normalizedDomain)) {
        hasDomainInCitations = true;
        const entry = ownUrlMap.get(url);
        if (entry) {
          entry.count++;
          entry.prompts.push({
            prompt: r.prompt,
            provider: r.provider,
            date: r.createdAt?.toISOString() ?? null,
          });
        } else {
          ownUrlMap.set(url, {
            count: 1,
            prompts: [{
              prompt: r.prompt,
              provider: r.provider,
              date: r.createdAt?.toISOString() ?? null,
            }],
          });
        }
      }
    }

    const isSourceMention = hasDomainInText || hasDomainInCitations;
    const hasBrandName = responseLower.includes(domainNameLower);
    const isBrandOnly = hasBrandName && !isSourceMention;

    const outputItem = {
      provider: r.provider,
      prompt: r.prompt,
      response: r.response,
      mentionCount: r.mentionCount ?? 0,
      date: r.createdAt?.toISOString() ?? null,
    };

    if (isSourceMention) {
      sourcesByProvider[r.provider] =
        (sourcesByProvider[r.provider] ?? 0) + 1;
      outputsWithSource.push(outputItem);
    }

    if (isBrandOnly) {
      brandOnlyByProvider[r.provider] =
        (brandOnlyByProvider[r.provider] ?? 0) + 1;
      outputsBrandOnly.push(outputItem);
    }
  }

  outputsWithSource.sort(
    (a, b) =>
      new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
  );
  outputsBrandOnly.sort(
    (a, b) =>
      new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
  );

  const ownUrls = Array.from(ownUrlMap.entries())
    .map(([url, data]) => ({ url, count: data.count, prompts: data.prompts }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    sourcesByProvider,
    brandOnlyByProvider,
    ownUrls,
    outputsWithSource,
    outputsBrandOnly,
  });
}
