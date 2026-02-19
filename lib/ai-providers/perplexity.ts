export type Provider = "perplexity";

export async function chat(
  prompt: string,
  _domainUrl: string,
  customFetch?: typeof globalThis.fetch,
  geoContext?: string
): Promise<{ response: string; provider: Provider; citations?: string[] }> {
  const fetchFn = customFetch ?? globalThis.fetch;

  const messages: Array<{ role: string; content: string }> = [];
  if (geoContext) messages.push({ role: "system", content: geoContext });
  messages.push({ role: "user", content: prompt });

  const res = await fetchFn("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Perplexity API: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    citations?: string[];
  };
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  const citations = data.citations ?? [];
  return { response: content, provider: "perplexity", citations };
}
