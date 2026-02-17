import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { favicons } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

const FAVICON_SIZE = 32;
const GOOGLE_FAVICON_URL = `https://www.google.com/s2/favicons?sz=${FAVICON_SIZE}&domain=`;

/**
 * Fetch favicon for a single domain via Google's favicon service,
 * upload to Vercel Blob, and store the URL in DB.
 */
async function fetchAndStoreFavicon(domain: string): Promise<string | null> {
  try {
    const res = await fetch(`${GOOGLE_FAVICON_URL}${encodeURIComponent(domain)}`, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;

    const blob = await res.blob();
    if (blob.size < 50) return null; // skip empty/broken favicons

    const { url } = await put(`favicons/${domain}.png`, blob, {
      access: "public",
      addRandomSuffix: false,
      contentType: "image/png",
    });

    await db
      .insert(favicons)
      .values({ domain, blobUrl: url })
      .onConflictDoUpdate({
        target: favicons.domain,
        set: { blobUrl: url, fetchedAt: new Date() },
      });

    return url;
  } catch (err) {
    console.error(`[Favicon] Failed to fetch for ${domain}:`, err);
    return null;
  }
}

/**
 * Get favicon URLs for a list of domains.
 * Returns a Map of domain → blobUrl for all domains that have a cached favicon.
 */
export async function getFaviconMap(domainList: string[]): Promise<Map<string, string>> {
  if (domainList.length === 0) return new Map();

  const rows = await db
    .select()
    .from(favicons)
    .where(inArray(favicons.domain, domainList));

  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.domain, row.blobUrl);
  }
  return map;
}

/**
 * Fetch and cache favicons for a batch of domains.
 * Skips domains that already have a cached favicon (unless older than 30 days).
 * Runs in parallel with concurrency limit.
 */
export async function fetchFaviconsForDomains(domainList: string[]): Promise<void> {
  if (domainList.length === 0) return;

  const unique = [...new Set(domainList)];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Check which domains already have a recent favicon
  const existing = await db
    .select()
    .from(favicons)
    .where(inArray(favicons.domain, unique));

  const existingMap = new Map(existing.map((r) => [r.domain, r.fetchedAt]));
  const toFetch = unique.filter((d) => {
    const fetchedAt = existingMap.get(d);
    return !fetchedAt || fetchedAt < thirtyDaysAgo;
  });

  if (toFetch.length === 0) return;

  console.log(`[Favicon] Fetching ${toFetch.length} favicons...`);

  // Process in batches of 10 to avoid overwhelming
  const BATCH_SIZE = 10;
  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map((d) => fetchAndStoreFavicon(d)));
  }

  console.log(`[Favicon] Done fetching ${toFetch.length} favicons`);
}
