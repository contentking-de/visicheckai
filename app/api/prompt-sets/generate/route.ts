import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const keyword = body.keyword as string | undefined;

  if (!keyword || typeof keyword !== "string" || !keyword.trim()) {
    return NextResponse.json(
      { error: "Keyword is required" },
      { status: 400 }
    );
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Step 1: Generate FAQs for the keyword
  const faqResponse = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an SEO and AI search intent expert. Generate the most frequently asked questions about a given topic or keyword. These should be realistic questions that users would actually ask AI chatbots like ChatGPT, Claude, or Perplexity. Return ONLY valid JSON, no markdown formatting.",
      },
      {
        role: "user",
        content: `Generate 8 frequently asked questions about: "${keyword.trim()}"\n\nReturn as JSON: { "questions": ["question1", "question2", ...] }`,
      },
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

  // Step 2: Generate query fanout for each FAQ
  const fanoutResponse = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are an AI search behavior expert. For each given question, generate query fanout — the related queries, reformulations, and follow-up questions that AI models internally consider when processing the original query. These represent the different angles and sub-queries a search or AI system would explore to provide a comprehensive answer. Return ONLY valid JSON, no markdown formatting.",
      },
      {
        role: "user",
        content: `For each of these questions, generate 3–5 query fanout variations:\n\n${faqs.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n\nReturn as JSON: { "results": [{ "question": "original question", "fanout": ["variation1", "variation2", ...] }] }`,
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
