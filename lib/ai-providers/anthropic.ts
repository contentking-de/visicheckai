import Anthropic from "@anthropic-ai/sdk";

function getClient(customFetch?: typeof globalThis.fetch) {
  const opts: ConstructorParameters<typeof Anthropic>[0] = {
    apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-placeholder",
  };
  if (customFetch) opts.fetch = customFetch;
  return new Anthropic(opts);
}

export type Provider = "claude";

export async function chat(
  prompt: string,
  _domainUrl: string,
  customFetch?: typeof globalThis.fetch
): Promise<{ response: string; provider: Provider; citations?: string[] }> {
  const client = getClient(customFetch);
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3,
      },
    ],
  });

  const textParts: string[] = [];
  const citations: string[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      textParts.push(block.text);
      if ("citations" in block && Array.isArray(block.citations)) {
        for (const citation of block.citations) {
          if (
            citation &&
            typeof citation === "object" &&
            "url" in citation &&
            typeof citation.url === "string"
          ) {
            citations.push(citation.url);
          }
        }
      }
    }
  }

  const content = textParts.join("").trim();
  const uniqueCitations = [...new Set(citations)];

  return { response: content, provider: "claude", citations: uniqueCitations };
}
