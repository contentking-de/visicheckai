export type ProviderName = "chatgpt" | "claude" | "gemini" | "perplexity";

export const PROVIDERS: ProviderName[] = ["chatgpt", "claude", "gemini", "perplexity"];

export const PROVIDER_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

export const PROVIDER_LABELS_SHORT: Record<string, string> = {
  chatgpt: "GPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Pplx",
};

export const PROVIDER_COLORS: Record<string, string> = {
  chatgpt: "#10a37f",
  claude: "#d97706",
  gemini: "#4285f4",
  perplexity: "#6366f1",
};

export const PROVIDER_ICONS: Record<string, string> = {
  chatgpt: "/chatgpt-icon.svg",
  claude: "/claude-ai-icon.svg",
  gemini: "/google-gemini-icon.svg",
  perplexity: "/perplexity-ai-icon.svg",
};
