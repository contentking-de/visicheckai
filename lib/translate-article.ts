import OpenAI from "openai";

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  fr: "French",
  es: "Spanish",
  de: "German",
};

function getClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "sk-placeholder",
  });
}

export type TranslationResult = {
  title: string;
  excerpt: string | null;
  content: string;
};

export async function translateArticle(
  article: { title: string; excerpt: string | null; content: string },
  targetLocale: string
): Promise<TranslationResult> {
  const client = getClient();
  const langName = LANGUAGE_NAMES[targetLocale] ?? targetLocale;

  const parts: { key: string; text: string }[] = [
    { key: "title", text: article.title },
  ];
  if (article.excerpt) {
    parts.push({ key: "excerpt", text: article.excerpt });
  }
  parts.push({ key: "content", text: article.content });

  const payload = Object.fromEntries(parts.map((p) => [p.key, p.text]));

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: [
          `You are a professional translator. Translate the provided JSON values from German to ${langName}.`,
          "Rules:",
          "- Return valid JSON with the exact same keys.",
          "- For the 'content' field: preserve ALL HTML tags, attributes, and structure exactly. Only translate the visible text between tags.",
          "- Do NOT translate brand names, product names, or technical terms that are typically kept in the original language.",
          "- Maintain the same tone and style as the original.",
          "- Return ONLY the JSON object, no markdown fences or extra text.",
        ].join("\n"),
      },
      {
        role: "user",
        content: JSON.stringify(payload),
      },
    ],
    max_tokens: 16384,
  });

  const raw = response.choices[0]?.message?.content?.trim() ?? "{}";

  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const parsed = JSON.parse(cleaned) as Record<string, string>;

  return {
    title: parsed.title ?? article.title,
    excerpt: parsed.excerpt ?? article.excerpt,
    content: parsed.content ?? article.content,
  };
}
