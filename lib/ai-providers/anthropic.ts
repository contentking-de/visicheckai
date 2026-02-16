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
): Promise<{ response: string; provider: Provider }> {
  const client = getClient();
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const content =
    response.content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("") ?? "";
  return { response: content, provider: "claude" };
}
