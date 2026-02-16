export type Provider = "perplexity";

export async function chat(
  prompt: string,
  _domainUrl: string
): Promise<{ response: string; provider: Provider }> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: "sonar",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Perplexity API: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  return { response: content, provider: "perplexity" };
}
