import Anthropic from "@anthropic-ai/sdk";

function getClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY ?? "sk-ant-placeholder",
  });
}

export type Provider = "claude";

export async function chat(
  prompt: string,
  _domainUrl: string
): Promise<{ response: string; provider: Provider; citations?: string[] }> {
  const client = getClient();
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

  // Extract text content and citations from response blocks
  const textParts: string[] = [];
  const citations: string[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      textParts.push(block.text);
      // Extract citations from text blocks if present
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

  // Deduplicate citations while preserving order
  const uniqueCitations = [...new Set(citations)];

  return { response: content, provider: "claude", citations: uniqueCitations };
}
