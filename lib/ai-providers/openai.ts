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
): Promise<{ response: string; provider: Provider }> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 1024,
  });

  const content =
    response.choices[0]?.message?.content?.trim() ?? "";
  return { response: content, provider: "chatgpt" };
}
