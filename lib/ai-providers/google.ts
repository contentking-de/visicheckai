import { GoogleGenerativeAI } from "@google/generative-ai";

const IGNORED_HOSTS = [
  "vertexaisearch.cloud.google.com",
  "vertexaisearch.googleapis.com",
];

export type Provider = "gemini";

/**
 * Call Gemini via the official SDK (used when no proxy is needed).
 */
async function chatWithSdk(prompt: string) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools: [{ googleSearch: {} } as any],
  });
  const result = await model.generateContent(prompt);
  const content = result.response.text()?.trim() ?? "";

  const citations: string[] = [];
  const candidate = result.response.candidates?.[0];
  if (candidate?.groundingMetadata?.groundingChunks) {
    for (const chunk of candidate.groundingMetadata.groundingChunks) {
      if (chunk.web?.uri) {
        try {
          const host = new URL(chunk.web.uri).hostname;
          if (IGNORED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) continue;
        } catch { /* keep URL if parsing fails */ }
        citations.push(chunk.web.uri);
      }
    }
  }

  return { content, citations };
}

/**
 * Call Gemini via REST API (used when proxy is needed, since the SDK
 * doesn't support custom fetch/httpAgent).
 */
async function chatWithRest(prompt: string, customFetch: typeof globalThis.fetch) {
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const res = await customFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API: ${res.status} ${err}`);
  }

  const data = await res.json() as any;
  const content = data.candidates?.[0]?.content?.parts
    ?.map((p: any) => p.text ?? "")
    .join("")
    .trim() ?? "";

  const citations: string[] = [];
  const groundingChunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (Array.isArray(groundingChunks)) {
    for (const chunk of groundingChunks) {
      if (chunk.web?.uri) {
        try {
          const host = new URL(chunk.web.uri).hostname;
          if (IGNORED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) continue;
        } catch { /* keep URL if parsing fails */ }
        citations.push(chunk.web.uri);
      }
    }
  }

  return { content, citations };
}

export async function chat(
  prompt: string,
  _domainUrl: string,
  customFetch?: typeof globalThis.fetch
): Promise<{ response: string; provider: Provider; citations?: string[] }> {
  const { content, citations } = customFetch
    ? await chatWithRest(prompt, customFetch)
    : await chatWithSdk(prompt);

  return { response: content, provider: "gemini", citations };
}
