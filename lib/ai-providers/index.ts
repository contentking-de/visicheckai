import * as openai from "./openai";
import * as anthropic from "./anthropic";
import * as google from "./google";
import * as perplexity from "./perplexity";

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
  // Brand name (user-provided, most important)
  if (brandName) terms.add(brandName.toLowerCase().trim());
  // Brand extracted from domain URL
  if (brandFromDomain.length >= 2) terms.add(brandFromDomain);
  // Domain without www (e.g. "interhyp.de")
  terms.add(withoutWww);
  // Full host (e.g. "www.interhyp.de")
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
    .replace(/#{1,6}\s*/g, "")           // Headers (# ## ### etc.)
    .replace(/\*\*(.+?)\*\*/g, "$1")     // Bold **text**
    .replace(/__(.+?)__/g, "$1")         // Bold __text__
    .replace(/\*(.+?)\*/g, "$1")         // Italic *text*
    .replace(/_(.+?)_/g, "$1")           // Italic _text_ (ohne word boundaries)
    .replace(/`([^`]+)`/g, "$1")         // Inline code
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)") // Links [text](url) → text (url)
    .replace(/^\s*[-*+]\s+/gm, "")      // List items
    .replace(/^\s*\d+\.\s+/gm, "")      // Numbered lists
    .replace(/^>{1,}\s*/gm, "")          // Blockquotes
    .replace(/\n{3,}/g, "\n\n")         // Mehrfache Zeilenumbrüche reduzieren
    .trim();
}

const PROVIDER_TIMEOUT_MS = 30_000; // 30 seconds per provider call

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
 * e.g. "[1][3]" with citations ["https://a.com", "https://b.com", "https://c.com"]
 * becomes "[1: https://a.com][3: https://c.com]"
 */
function resolveCitations(text: string, citations: string[]): string {
  return text.replace(/\[(\d+)\]/g, (match, num) => {
    const idx = parseInt(num, 10) - 1; // citations are 1-indexed in text
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
  brandName?: string
): Promise<{ response: string; mentionCount: number; visibilityScore: number; citations: string[] }> {
  const mod = providers[provider];
  const result = await withTimeout(
    mod.chat(prompt, domainUrl) as Promise<{ response: string; provider: string; citations?: string[] }>,
    PROVIDER_TIMEOUT_MS,
    `${provider} call`
  );

  let processedResponse = result.response;
  const citations = result.citations ?? [];

  // If citations exist, resolve [N] references in text
  if (citations.length > 0) {
    processedResponse = resolveCitations(processedResponse, citations);
  }

  const cleanResponse = stripMarkdown(processedResponse);

  // Count mentions in both the response text and cited source URLs
  const citationsText = citations.join(" ");
  const fullTextForCounting = cleanResponse + " " + citationsText;
  const mentionCount = countMentions(fullTextForCounting, domainUrl, brandName);

  const visibilityScore = computeVisibilityScore(mentionCount);
  return { response: cleanResponse, mentionCount, visibilityScore, citations };
}
