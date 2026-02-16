import { GoogleGenerativeAI } from "@google/generative-ai";

function getGenAI() {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
}

export type Provider = "gemini";

export async function chat(
  prompt: string,
  _domainUrl: string
): Promise<{ response: string; provider: Provider }> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const content = result.response.text()?.trim() ?? "";
  return { response: content, provider: "gemini" };
}
