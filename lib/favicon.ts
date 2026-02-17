import { put } from "@vercel/blob";
import { db } from "@/lib/db";
import { favicons } from "@/lib/schema";
import { inArray } from "drizzle-orm";

const GOOGLE_FAVICON_URL = "https://www.google.com/s2/favicons?sz=32&domain=";
const TIMEOUT_MS = 8_000;

/**
 * Try multiple strategies to fetch a favicon for a domain.
 * Returns the image blob or null if all fail.
 */
async function fetchFaviconBlob(domain: string): Promise<{ blob: Blob; contentType: string } | null> {
  // Strategy 1: Direct /favicon.ico from the domain
  for (const protocol of ["https", "http"]) {
    for (const prefix of ["www.", ""]) {
      try {
        const url = `${protocol}://${prefix}${domain}/favicon.ico`;
        const res = await fetch(url, {
          redirect: "follow",
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (res.ok) {
          const ct = res.headers.get("content-type") ?? "";
          if (ct.includes("image") || ct.includes("icon")) {
            const blob = await res.blob();
            if (blob.size >= 100) {
              return { blob, contentType: ct.split(";")[0] || "image/x-icon" };
            }
          }
        }
      } catch { /* try next */ }
    }
  }

  // Strategy 2: Google Favicon Service (accepts any status since it always returns an image)
  try {
    const res = await fetch(`${GOOGLE_FAVICON_URL}${encodeURIComponent(domain)}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const blob = await res.blob();
    const ct = res.headers.get("content-type") ?? "image/png";
    // Google returns a default ~726 byte globe for unknown domains;
    // real favicons are typically >100 bytes and have 200 status
    if (res.ok && blob.size >= 100) {
      return { blob, contentType: ct.split(";")[0] || "image/png" };
    }
  } catch { /* give up */ }

  return null;
}

/**
 * Fetch favicon for a single domain, upload to Vercel Blob, store URL in DB.
 */
async function fetchAndStoreFavicon(domain: string): Promise<string | null> {
  try {
    const result = await fetchFaviconBlob(domain);
    if (!result) return null;

    const ext = result.contentType.includes("icon") ? "ico" : "png";
    const { url } = await put(`favicons/${domain}.${ext}`, result.blob, {
      access: "public",
      addRandomSuffix: false,
      contentType: result.contentType,
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
    console.error(`[Favicon] Failed for ${domain}:`, err);
    return null;
  }
}

/**
 * Get favicon URLs for a list of domains.
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
 * Skips domains that already have a recent favicon (< 30 days old).
 */
export async function fetchFaviconsForDomains(domainList: string[]): Promise<void> {
  if (domainList.length === 0) return;

  const unique = [...new Set(domainList)];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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

  const BATCH_SIZE = 10;
  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map((d) => fetchAndStoreFavicon(d)));
  }

  console.log(`[Favicon] Done fetching ${toFetch.length} favicons`);
}
