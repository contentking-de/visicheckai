import OpenAI from "openai";
import type { Sentiment } from "@/lib/schema";

function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "sk-placeholder",
  });
}

export type SentimentResult = {
  sentiment: Sentiment;
  sentimentScore: number; // -100 (very negative) to +100 (very positive)
};

/**
 * Analyzes the sentiment of an AI response regarding a specific brand/domain.
 * Uses gpt-4o-mini for fast, cheap classification.
 *
 * Returns:
 * - sentiment: "positive" | "neutral" | "negative"
 * - sentimentScore: -100 to +100
 */
export async function analyzeSentiment(
  response: string,
  brandName: string
): Promise<SentimentResult> {
  const client = getClient();

  const truncated = response.slice(0, 2000);

  try {
    const result = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            `You are a brand sentiment classifier. Analyze the following AI-generated text ` +
            `and determine the sentiment SPECIFICALLY toward the brand "${brandName}". ` +
            `If the brand is not mentioned, classify as "neutral" with score 0.\n\n` +
            `Respond with ONLY a JSON object: {"sentiment":"positive"|"neutral"|"negative","score":<-100 to 100>}\n` +
            `Score guide: -100 = strongly negative, 0 = neutral, +100 = strongly positive.`,
        },
        {
          role: "user",
          content: truncated,
        },
      ],
      max_tokens: 50,
      temperature: 0,
    });

    const raw = result.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = raw.replace(/```json\s*/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const sentiment: Sentiment =
      parsed.sentiment === "positive"
        ? "positive"
        : parsed.sentiment === "negative"
          ? "negative"
          : "neutral";

    const score = Math.max(-100, Math.min(100, Math.round(Number(parsed.score) || 0)));

    return { sentiment, sentimentScore: score };
  } catch (err) {
    console.error("[Sentiment] Analysis failed, defaulting to neutral:", err);
    return { sentiment: "neutral", sentimentScore: 0 };
  }
}
