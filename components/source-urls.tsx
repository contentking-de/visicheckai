"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProviderBadge } from "@/components/provider-badge";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Globe,
  LinkIcon,
} from "lucide-react";
import type { ProviderName } from "@/lib/providers";

interface SourceResult {
  provider: ProviderName;
  prompt: string;
  citations: string[] | null;
}

interface UrlEntry {
  url: string;
  path: string;
  providers: ProviderName[];
  prompts: string[];
  count: number;
}

interface DomainGroup {
  domain: string;
  urls: UrlEntry[];
  totalCitations: number;
}

interface SourceUrlsProps {
  results: SourceResult[];
  favicons?: Record<string, string>;
  translations: {
    title: string;
    totalUrls: string;
    provider: string;
    prompt: string;
    citedBy: string;
    noCitations: string;
    showAll: string;
    showLess: string;
    urlsCited: string;
    timesShort: string;
  };
}

import { PROVIDER_LABELS } from "@/lib/providers";

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

function extractPath(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname + parsed.search + parsed.hash;
    return path === "/" ? "/" : path;
  } catch {
    return "/";
  }
}

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

export function SourceUrls({
  results,
  favicons = {},
  translations: t,
}: SourceUrlsProps) {
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const INITIAL_SHOW = 10;

  const domainGroups = useMemo(() => {
    const urlMap = new Map<
      string,
      { providers: Set<ProviderName>; prompts: Set<string>; count: number }
    >();

    for (const result of results) {
      if (!result.citations) continue;
      for (const url of result.citations) {
        const domain = extractDomain(url);
        if (isIgnoredDomain(domain)) continue;

        const existing = urlMap.get(url);
        if (existing) {
          existing.providers.add(result.provider);
          existing.prompts.add(result.prompt);
          existing.count++;
        } else {
          urlMap.set(url, {
            providers: new Set([result.provider]),
            prompts: new Set([result.prompt]),
            count: 1,
          });
        }
      }
    }

    const domainMap = new Map<string, UrlEntry[]>();

    for (const [url, data] of urlMap) {
      const domain = extractDomain(url);
      if (!domainMap.has(domain)) {
        domainMap.set(domain, []);
      }
      domainMap.get(domain)!.push({
        url,
        path: extractPath(url),
        providers: [...data.providers],
        prompts: [...data.prompts],
        count: data.count,
      });
    }

    const groups: DomainGroup[] = [...domainMap.entries()]
      .map(([domain, urls]) => ({
        domain,
        urls: urls.sort((a, b) => b.count - a.count),
        totalCitations: urls.reduce((sum, u) => sum + u.count, 0),
      }))
      .sort((a, b) => b.totalCitations - a.totalCitations);

    return groups;
  }, [results]);

  const totalUrls = useMemo(
    () => domainGroups.reduce((sum, g) => sum + g.urls.length, 0),
    [domainGroups]
  );

  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  };

  if (domainGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t.noCitations}</p>
        </CardContent>
      </Card>
    );
  }

  const visibleGroups = showAll
    ? domainGroups
    : domainGroups.slice(0, INITIAL_SHOW);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          {t.title}
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {totalUrls} {t.totalUrls} · {domainGroups.length} Domains
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        {visibleGroups.map((group) => {
          const isExpanded = expandedDomains.has(group.domain);

          return (
            <div
              key={group.domain}
              className="rounded-lg border bg-card"
            >
              <button
                type="button"
                onClick={() => toggleDomain(group.domain)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                {favicons[group.domain] ? (
                  <img
                    src={favicons[group.domain]}
                    alt=""
                    width={16}
                    height={16}
                    className="shrink-0 rounded-sm"
                    loading="lazy"
                  />
                ) : (
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="font-medium text-sm flex-1">
                  {group.domain}
                </span>
                <span className="text-xs text-muted-foreground">
                  {group.urls.length} {t.urlsCited}
                </span>
                <Badge variant="secondary" className="text-xs tabular-nums">
                  {group.totalCitations}×
                </Badge>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-2 space-y-2">
                  {group.urls.map((entry) => (
                    <div
                      key={entry.url}
                      className="group rounded-md px-3 py-2.5 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all leading-snug"
                          >
                            <span className="text-muted-foreground">
                              {group.domain}
                            </span>
                            <span className="font-medium">{entry.path}</span>
                          </a>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {entry.count > 1 && (
                              <span className="text-[11px] text-muted-foreground tabular-nums">
                                {entry.count}× {t.timesShort}
                              </span>
                            )}
                            {entry.providers.map((p) => (
                              <ProviderBadge key={p} provider={p} variant="secondary" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {domainGroups.length > INITIAL_SHOW && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="mt-3 flex w-full items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAll ? (
              <>
                {t.showLess} <ChevronDown className="h-4 w-4 rotate-180" />
              </>
            ) : (
              <>
                {t.showAll} ({domainGroups.length - INITIAL_SHOW}){" "}
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
