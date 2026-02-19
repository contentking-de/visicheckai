"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Globe,
  ExternalLink,
  Link2,
  MessageSquareQuote,
} from "lucide-react";

import { ProviderIcon } from "@/components/provider-badge";
import { PROVIDERS, PROVIDER_LABELS_SHORT } from "@/lib/providers";
import type { ProviderName } from "@/lib/providers";

interface ResultItem {
  provider: ProviderName;
  response: string;
  citations: string[] | null;
}

interface CompetitorOverviewProps {
  results: ResultItem[];
  ownDomainUrl: string;
  ownBrandName: string;
  keyword?: string;
  favicons?: Record<string, string>;
  translations: {
    title: string;
    domain: string;
    total: string;
    citations: string;
    mentions: string;
    ownDomain: string;
    competitor: string;
    showAll: string;
    showLess: string;
    noCitations: string;
    sources: string;
  };
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function extractBrandFromDomain(domain: string): string {
  return domain.split(".")[0];
}

/**
 * For generic/exact-match domains, only count explicit full domain mentions
 * (e.g. "bauzinsen.net"), not the generic keyword portion.
 */
function countFullDomainInText(text: string, domain: string): number {
  // Search for the full domain (e.g. "bauzinsen.net", "www.bauzinsen.net")
  const escaped = escapeRegex(domain);
  const escapedWithWww = escapeRegex(`www.${domain}`);
  const pattern = new RegExp(`\\b(?:${escapedWithWww}|${escaped})`, "gi");
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

// Internal/infrastructure domains to exclude from competitor analysis
const IGNORED_DOMAINS = new Set([
  "vertexaisearch.cloud.google.com",
  "vertexaisearch.googleapis.com",
  "googleapis.com",
  "googleusercontent.com",
  "gstatic.com",
  "bing.com",
  "bingapis.com",
]);

function isIgnoredDomain(domain: string): boolean {
  if (IGNORED_DOMAINS.has(domain)) return true;
  for (const ignored of IGNORED_DOMAINS) {
    if (domain.endsWith(`.${ignored}`)) return true;
  }
  return false;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countBrandInText(text: string, brand: string): number {
  if (brand.length < 2) return 0;
  const pattern = new RegExp(`\\b${escapeRegex(brand)}`, "gi");
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

interface CompetitorEntry {
  domain: string;
  brand: string;
  citationCount: number;
  mentionCount: number;
  totalScore: number;
  citationsByProvider: Record<ProviderName, number>;
  mentionsByProvider: Record<ProviderName, number>;
  isOwnDomain: boolean;
  urls: string[];
}

export function CompetitorOverview({
  results,
  ownDomainUrl,
  ownBrandName,
  keyword,
  favicons: initialFavicons = {},
  translations: t,
}: CompetitorOverviewProps) {
  const [showAll, setShowAll] = useState(false);
  const [favicons, setFavicons] = useState<Record<string, string>>(initialFavicons);
  const INITIAL_SHOW = 15;

  const ownDomain = extractDomain(
    ownDomainUrl.startsWith("http") ? ownDomainUrl : `https://${ownDomainUrl}`
  );

  const competitors = useMemo(() => {
    // Step 1: Collect all unique domains from citations
    const domainMap = new Map<
      string,
      {
        citationCount: number;
        mentionCount: number;
        citationsByProvider: Record<ProviderName, number>;
        mentionsByProvider: Record<ProviderName, number>;
        urls: Set<string>;
      }
    >();

    const ensureDomain = (domain: string) => {
      if (!domainMap.has(domain)) {
        domainMap.set(domain, {
          citationCount: 0,
          mentionCount: 0,
          citationsByProvider: { chatgpt: 0, claude: 0, gemini: 0, perplexity: 0 },
          mentionsByProvider: { chatgpt: 0, claude: 0, gemini: 0, perplexity: 0 },
          urls: new Set(),
        });
      }
      return domainMap.get(domain)!;
    };

    // Step 1a: Count citations per domain
    for (const result of results) {
      if (!result.citations || result.citations.length === 0) continue;
      for (const url of result.citations) {
        const domain = extractDomain(url);
        if (!domain || isIgnoredDomain(domain)) continue;
        const entry = ensureDomain(domain);
        entry.citationCount++;
        entry.citationsByProvider[result.provider]++;
        entry.urls.add(url);
      }
    }

    // Step 2: For each known domain (from citations) + own domain, count text mentions
    ensureDomain(ownDomain);

    // Step 2a: Count OWN BRAND mentions by name (user-provided, reliable brand name)
    // This is the only brand where we trust name-based matching,
    // because the user explicitly provides their brand name (e.g. "Interhyp").
    if (ownBrandName && ownBrandName.length >= 2) {
      for (const result of results) {
        if (!result.response) continue;
        const text = result.response.toLowerCase();
        const count = countBrandInText(text, ownBrandName.toLowerCase());
        if (count > 0) {
          const entry = ensureDomain(ownDomain);
          entry.mentionCount += count;
          entry.mentionsByProvider[result.provider] += count;
        }
      }
    }

    // Step 2b: For ALL competitors (including own domain), count explicit full-domain mentions
    // e.g. "check24.de", "interhyp.de", "vergleich.de" written out in the AI response.
    // This avoids false positives from generic words like "Vergleich", "Finanz", "Bauzinsen".
    for (const result of results) {
      if (!result.response) continue;
      const text = result.response.toLowerCase();
      for (const domain of domainMap.keys()) {
        const count = countFullDomainInText(text, domain);
        if (count > 0) {
          const entry = ensureDomain(domain);
          entry.mentionCount += count;
          entry.mentionsByProvider[result.provider] += count;
        }
      }
    }

    // Step 3: Discover new domains mentioned in text that aren't in citations yet
    // Scan for domain-like strings (e.g. "dr-klein.de", "check24.de", "immobilien.vr.de")
    const domainPattern = /\b((?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.(?:de|com|net|org|io|at|ch|co\.uk|eu))\b/gi;
    for (const result of results) {
      if (!result.response) continue;
      const matches = result.response.matchAll(domainPattern);
      for (const match of matches) {
        const foundDomain = match[1].toLowerCase().replace(/^www\./, "");
        if (!domainMap.has(foundDomain) && !isIgnoredDomain(foundDomain)) {
          const entry = ensureDomain(foundDomain);
          entry.mentionCount++;
          entry.mentionsByProvider[result.provider]++;
        }
      }
    }

    // Step 4: Convert to sorted array, filter out domains with zero activity
    // Always keep the own domain visible (even with 0 citations/mentions)
    const entries: CompetitorEntry[] = [...domainMap.entries()]
      .map(([domain, data]) => ({
        domain,
        brand: extractBrandFromDomain(domain),
        citationCount: data.citationCount,
        mentionCount: data.mentionCount,
        totalScore: data.citationCount + data.mentionCount,
        citationsByProvider: data.citationsByProvider,
        mentionsByProvider: data.mentionsByProvider,
        isOwnDomain:
          domain === ownDomain ||
          ownDomain.endsWith(`.${domain}`) ||
          domain.endsWith(`.${ownDomain}`),
        urls: [...data.urls],
      }))
      .filter((entry) => entry.isOwnDomain || entry.citationCount > 0 || entry.mentionCount > 0)
      .sort((a, b) => {
        if (a.isOwnDomain && !b.isOwnDomain) return -1;
        if (!a.isOwnDomain && b.isOwnDomain) return 1;
        return b.totalScore - a.totalScore;
      });

    return entries;
  }, [results, ownDomain, ownBrandName]);

  // Fetch missing favicons once after competitors are computed
  const fetchedRef = useRef(false);
  const allDomains = useMemo(() => competitors.map((c) => c.domain), [competitors]);

  useEffect(() => {
    if (fetchedRef.current || allDomains.length === 0) return;

    const missing = allDomains.filter((d) => !initialFavicons[d]);
    if (missing.length === 0) return;

    fetchedRef.current = true;

    const controller = new AbortController();
    fetch("/api/favicons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domains: missing }),
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Record<string, string> | null) => {
        if (data && Object.keys(data).length > 0) {
          setFavicons((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => { /* ignore abort/network errors */ });

    return () => controller.abort();
  }, [allDomains, initialFavicons]);

  if (competitors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t.title}{keyword ? ` – ${keyword}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t.noCitations}</p>
        </CardContent>
      </Card>
    );
  }

  const visibleCompetitors = showAll
    ? competitors
    : competitors.slice(0, INITIAL_SHOW);

  const maxScore = Math.max(...competitors.map((c) => c.totalScore));

  const providerLabels = PROVIDER_LABELS_SHORT;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t.title}{keyword ? ` – ${keyword}` : ""}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {competitors.length} {t.sources}
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">#</TableHead>
              <TableHead>{t.domain}</TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1" title={t.mentions}>
                  <MessageSquareQuote className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">{t.mentions}</span>
                </div>
              </TableHead>
              <TableHead className="text-center">
                <div className="flex items-center justify-center gap-1" title={t.citations}>
                  <Link2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">{t.citations}</span>
                </div>
              </TableHead>
              <TableHead className="text-center font-bold">{t.total}</TableHead>
              {PROVIDERS.map((p) => (
                <TableHead key={p} className="text-center text-xs px-1">
                  <div className="flex items-center justify-center gap-1">
                    <ProviderIcon provider={p} size={14} />
                    {providerLabels[p]}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-0.5 text-[10px] font-normal text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <MessageSquareQuote className="h-2.5 w-2.5" />
                    </span>
                    <span>/</span>
                    <span className="flex items-center gap-0.5">
                      <Link2 className="h-2.5 w-2.5" />
                    </span>
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[160px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleCompetitors.map((entry, idx) => (
              <TableRow
                key={entry.domain}
                className={entry.isOwnDomain ? "bg-green-50 dark:bg-green-950/20" : ""}
              >
                <TableCell className="text-muted-foreground text-xs">
                  {idx + 1}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {favicons[entry.domain] ? (
                      <img
                        src={favicons[entry.domain]}
                        alt=""
                        width={16}
                        height={16}
                        className="shrink-0 rounded-sm"
                        loading="lazy"
                      />
                    ) : (
                      <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <a
                      href={`https://${entry.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      {entry.domain}
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                    {entry.isOwnDomain && (
                      <Badge
                        variant="outline"
                        className="text-xs text-green-700 border-green-300"
                      >
                        {t.ownDomain}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                {/* Mentions (text) */}
                <TableCell className="text-center">
                  {entry.mentionCount > 0 ? (
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      {entry.mentionCount}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">–</span>
                  )}
                </TableCell>
                {/* Citations (links) */}
                <TableCell className="text-center">
                  {entry.citationCount > 0 ? (
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      {entry.citationCount}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">–</span>
                  )}
                </TableCell>
                {/* Total */}
                <TableCell className="text-center font-bold">
                  {entry.totalScore}
                </TableCell>
                {/* Per provider breakdown: mentions / citations */}
                {PROVIDERS.map((p) => {
                  const m = entry.mentionsByProvider[p];
                  const c = entry.citationsByProvider[p];
                  return (
                    <TableCell key={p} className="text-center px-1">
                      {m > 0 || c > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm">
                          <span className={m > 0 ? "font-medium text-purple-600 dark:text-purple-400" : "text-muted-foreground"}>
                            {m}
                          </span>
                          <span className="text-muted-foreground text-xs">/</span>
                          <span className={c > 0 ? "font-medium text-blue-600 dark:text-blue-400" : "text-muted-foreground"}>
                            {c}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">–</span>
                      )}
                    </TableCell>
                  );
                })}
                {/* Bar chart */}
                <TableCell>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                    {/* Mention portion (purple) */}
                    {entry.mentionCount > 0 && (
                      <div
                        className={`h-full ${
                          entry.isOwnDomain
                            ? "bg-green-400"
                            : "bg-purple-400"
                        }`}
                        style={{
                          width: `${(entry.mentionCount / maxScore) * 100}%`,
                        }}
                      />
                    )}
                    {/* Citation portion (blue) */}
                    {entry.citationCount > 0 && (
                      <div
                        className={`h-full ${
                          entry.isOwnDomain
                            ? "bg-green-600"
                            : "bg-blue-500"
                        }`}
                        style={{
                          width: `${(entry.citationCount / maxScore) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-400" />
            {t.mentions}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
            {t.citations}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            {t.ownDomain}
          </span>
        </div>

        {competitors.length > INITIAL_SHOW && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="mt-4 flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAll ? (
              <>
                {t.showLess} <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                {t.showAll} ({competitors.length - INITIAL_SHOW} more){" "}
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
