import OpenAI from "openai";

function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "sk-placeholder",
  });
}

export type Provider = "chatgpt";

export async function chat(
  prompt: string,
  _domainUrl: string
): Promise<{ response: string; provider: Provider; citations?: string[] }> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini-search-preview",
    web_search_options: {
      search_context_size: "medium",
    },
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 1024,
  });

  const message = response.choices[0]?.message;
  const content = message?.content?.trim() ?? "";

  // Extract citation URLs from annotations
  const citations: string[] = [];
  const annotations = message?.annotations;
  if (Array.isArray(annotations)) {
    for (const annotation of annotations) {
      if (
        annotation &&
        typeof annotation === "object" &&
        "type" in annotation &&
        annotation.type === "url_citation" &&
        "url" in annotation &&
        typeof annotation.url === "string"
      ) {
        citations.push(annotation.url);
      }
    }
  }

  return { response: content, provider: "chatgpt", citations };
}
