import * as openai from "./openai";
import * as anthropic from "./anthropic";
import * as google from "./google";
import * as perplexity from "./perplexity";
import type { Country } from "../countries";
import { getProxyUrl } from "../countries";
import { createProxyFetch } from "../proxy-fetch";

export type Provider = "chatgpt" | "claude" | "gemini" | "perplexity";

const providers = {
  chatgpt: openai,
  claude: anthropic,
  gemini: google,
  perplexity,
} as const;

export function countMentions(text: string, domainUrl: string, brandName?: string): number {
  const normalized = domainUrl.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const host = normalized.split("/")[0];
  const withoutWww = host.replace(/^www\./, "");
  // Extract brand from domain: "interhyp.de" → "interhyp", "dr-klein.co.uk" → "dr-klein"
  const brandFromDomain = withoutWww.split(".")[0];

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Collect unique search terms, deduplicated and lowercased
  const terms = new Set<string>();
  if (brandName) terms.add(brandName.toLowerCase().trim());
  if (brandFromDomain.length >= 2) terms.add(brandFromDomain);
  terms.add(withoutWww);
  if (host !== withoutWww) terms.add(host);

  // Use broadest match: count with shortest term first (brand name),
  // since it catches all variations ("Interhyp", "interhyp.de", "www.interhyp.de")
  const sortedTerms = [...terms].sort((a, b) => a.length - b.length);

  let maxCount = 0;
  for (const term of sortedTerms) {
    const pattern = new RegExp(`\\b${escapeRegex(term)}`, "gi");
    const matches = text.match(pattern);
    if (matches && matches.length > maxCount) {
      maxCount = matches.length;
    }
  }

  return maxCount;
}

export function computeVisibilityScore(mentionCount: number): number {
  const raw = Math.min(100, mentionCount * 25);
  return Math.round(raw);
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^>{1,}\s*/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const PROVIDER_TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout nach ${ms / 1000}s: ${label}`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

/**
 * Resolve [N] citation references in text to actual URLs.
 */
function resolveCitations(text: string, citations: string[]): string {
  return text.replace(/\[(\d+)\]/g, (match, num) => {
    const idx = parseInt(num, 10) - 1;
    if (idx >= 0 && idx < citations.length) {
      return `[${num}: ${citations[idx]}]`;
    }
    return match;
  });
}

export async function runProvider(
  provider: Provider,
  prompt: string,
  domainUrl: string,
  brandName?: string,
  country?: Country
): Promise<{ response: string; mentionCount: number; visibilityScore: number; citations: string[] }> {
  const mod = providers[provider];

  // Resolve proxy for the target country
  const proxyUrl = country ? getProxyUrl(country) : undefined;
  const customFetch = proxyUrl ? createProxyFetch(proxyUrl) : undefined;

  const result = await withTimeout(
    mod.chat(prompt, domainUrl, customFetch) as Promise<{ response: string; provider: string; citations?: string[] }>,
    PROVIDER_TIMEOUT_MS,
    `${provider} call`
  );

  let processedResponse = result.response;
  const citations = result.citations ?? [];

  if (citations.length > 0) {
    processedResponse = resolveCitations(processedResponse, citations);
  }

  const cleanResponse = stripMarkdown(processedResponse);

  const citationsText = citations.join(" ");
  const fullTextForCounting = cleanResponse + " " + citationsText;
  const mentionCount = countMentions(fullTextForCounting, domainUrl, brandName);

  const visibilityScore = computeVisibilityScore(mentionCount);
  return { response: cleanResponse, mentionCount, visibilityScore, citations };
}
