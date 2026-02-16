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

export function countMentions(text: string, domainUrl: string): number {
  const normalized = domainUrl.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const host = normalized.split("/")[0];
  const patterns = [
    new RegExp(host.replace(/\./g, "\\."), "gi"),
    new RegExp(normalized.replace(/\./g, "\\.").replace(/\//g, "\\/"), "gi"),
  ];
  let count = 0;
  const lower = text.toLowerCase();
  for (const p of patterns) {
    const matches = lower.match(p);
    if (matches) count += matches.length;
  }
  return count;
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
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links [text](url)
    .replace(/^\s*[-*+]\s+/gm, "")      // List items
    .replace(/^\s*\d+\.\s+/gm, "")      // Numbered lists
    .replace(/^>{1,}\s*/gm, "")          // Blockquotes
    .replace(/\n{3,}/g, "\n\n")         // Mehrfache Zeilenumbrüche reduzieren
    .trim();
}

export async function runProvider(
  provider: Provider,
  prompt: string,
  domainUrl: string
): Promise<{ response: string; mentionCount: number; visibilityScore: number }> {
  const mod = providers[provider];
  const { response } = await mod.chat(prompt, domainUrl);
  const cleanResponse = stripMarkdown(response);
  const mentionCount = countMentions(cleanResponse, domainUrl);
  const visibilityScore = computeVisibilityScore(mentionCount);
  return { response: cleanResponse, mentionCount, visibilityScore };
}
