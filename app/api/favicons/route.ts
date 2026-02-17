import { NextResponse } from "next/server";
import { getFaviconMap, fetchFaviconsForDomains } from "@/lib/favicon";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const domains = body.domains as string[] | undefined;

  if (!domains || !Array.isArray(domains) || domains.length === 0) {
    return NextResponse.json({ error: "domains array required" }, { status: 400 });
  }

  // Limit to prevent abuse
  const limited = domains.slice(0, 200);

  // Fetch missing favicons in background, then return all known ones
  await fetchFaviconsForDomains(limited);
  const map = await getFaviconMap(limited);

  const result: Record<string, string> = {};
  for (const [domain, url] of map) {
    result[domain] = url;
  }

  return NextResponse.json(result);
}
