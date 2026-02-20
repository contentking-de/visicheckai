import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireAccess } from "@/lib/access";
import {
  ALL_SUBCATEGORY_IDS,
  buildCategoryPromptContext,
} from "@/lib/prompt-categories";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const denied = await requireAccess(session as Parameters<typeof requireAccess>[0]);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const keyword = body.keyword as string | undefined;
  const categories = body.categories as string[] | undefined;
  const locale = (body.locale as string | undefined) ?? "en";

  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    return NextResponse.json(
      { error: "Keyword is required" },
      { status: 400 }
    );
  }

  const LOCALE_LABELS: Record<string, string> = {
    de: "German",
    en: "English",
    fr: "French",
    es: "Spanish",
  };
  const language = LOCALE_LABELS[locale] ?? "English";

  const validCategories = (categories ?? []).filter((c) =>
    ALL_SUBCATEGORY_IDS.includes(c)
  );

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const hasCategoryContext = validCategories.length > 0;
  const categoryBlock = hasCategoryContext
    ? buildCategoryPromptContext(validCategories)
    : "";

  const languageInstruction = `IMPORTANT: All generated questions MUST be written in ${language}.`;

  const systemPromptFaq = hasCategoryContext
    ? `You are an SEO and AI search intent expert. Generate frequently asked questions about a given topic, specifically aligned with the user intent categories described below. The questions should be realistic queries that users would actually ask AI chatbots like ChatGPT, Claude, or Perplexity. Make sure each question clearly reflects the intent of its category. ${languageInstruction} Return ONLY valid JSON, no markdown formatting.`
    : `You are an SEO and AI search intent expert. Generate the most frequently asked questions about a given topic or keyword. These should be realistic questions that users would actually ask AI chatbots like ChatGPT, Claude, or Perplexity. ${languageInstruction} Return ONLY valid JSON, no markdown formatting.`;

  const userPromptFaq = hasCategoryContext
    ? `Generate 8 frequently asked questions in ${language} about: "${keyword.trim()}"

Focus on these user intent categories:
${categoryBlock}

Distribute the questions across the selected categories. Each question should clearly match the intent of one of the categories above.
All questions must be in ${language}.

Return as JSON: { "questions": ["question1", "question2", ...] }`
    : `Generate 8 frequently asked questions in ${language} about: "${keyword.trim()}"

All questions must be in ${language}.

Return as JSON: { "questions": ["question1", "question2", ...] }`;

  const faqResponse = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPromptFaq },
      { role: "user", content: userPromptFaq },
    ],
    temperature: 0.7,
    max_tokens: 1024,
    response_format: { type: "json_object" },
  });

  const faqContent = faqResponse.choices[0]?.message?.content ?? "{}";
  let faqs: string[];
  try {
    const parsed = JSON.parse(faqContent);
    faqs = Array.isArray(parsed)
      ? parsed
      : (parsed.questions ?? parsed.faqs ?? []);
  } catch {
    return NextResponse.json(
      { error: "Failed to parse FAQ response" },
      { status: 500 }
    );
  }

  if (faqs.length === 0) {
    return NextResponse.json(
      { error: "No FAQs generated" },
      { status: 500 }
    );
  }

  const fanoutResponse = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are an AI search behavior expert. For each given question, generate query fanout — the related queries, reformulations, and follow-up questions that AI models internally consider when processing the original query. These represent the different angles and sub-queries a search or AI system would explore to provide a comprehensive answer. ${languageInstruction} Return ONLY valid JSON, no markdown formatting.`,
      },
      {
        role: "user",
        content: `For each of these questions, generate 3–5 query fanout variations in ${language}:\n\n${faqs.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nAll fanout variations must be in ${language}.\n\nReturn as JSON: { "results": [{ "question": "original question", "fanout": ["variation1", "variation2", ...] }] }`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  });

  const fanoutContent = fanoutResponse.choices[0]?.message?.content ?? "{}";
  let results: { question: string; fanout: string[] }[];
  try {
    const parsed = JSON.parse(fanoutContent);
    results = parsed.results ?? [];
  } catch {
    results = faqs.map((q) => ({ question: q, fanout: [] }));
  }

  return NextResponse.json({ keyword: keyword.trim(), results });
}
