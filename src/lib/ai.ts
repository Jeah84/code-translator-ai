import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import type { SupportedLanguage } from "@/types";

const AI_PROVIDER = process.env.AI_PROVIDER ?? "openai";

function buildPrompt(
  code: string,
  source: SupportedLanguage,
  target: SupportedLanguage
): string {
  return [
    `Translate the following ${source} code to ${target}.`,
    "Return only the translated code with no explanation, no markdown fences, and no extra text.",
    "",
    code,
  ].join("\n");
}

export async function translateCode(
  code: string,
  source: SupportedLanguage,
  target: SupportedLanguage
): Promise<string> {
  const prompt = buildPrompt(code, source, target);

  if (AI_PROVIDER === "anthropic") {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");
    return block.text.trim();
  }

  // Default: OpenAI
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
  });
  return (completion.choices[0].message.content ?? "").trim();
}
