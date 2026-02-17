import { GoogleGenerativeAI } from "@google/generative-ai";

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
}

export type Provider = "gemini";

export async function chat(
  prompt: string,
  _domainUrl: string
): Promise<{ response: string; provider: Provider; citations?: string[] }> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools: [{ googleSearch: {} } as any],
  });
  const result = await model.generateContent(prompt);
  const content = result.response.text()?.trim() ?? "";

  // Extract citation URLs from grounding metadata
  // Filter out internal Google infrastructure domains (Vertex AI Search proxy URLs)
  const IGNORED_HOSTS = [
    "vertexaisearch.cloud.google.com",
    "vertexaisearch.googleapis.com",
  ];

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

  return { response: content, provider: "gemini", citations };
}
