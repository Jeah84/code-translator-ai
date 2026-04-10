import { Language } from "./languages";

export interface TranslationOptions {
  sourceLanguage: Language;
  targetLanguage: Language;
  sourceCode: string;
  preserveComments?: boolean;
  addExplanations?: boolean;
}

export interface TranslationResult {
  translatedCode: string;
  notes: string[];
  warnings: string[];
  tokensUsed?: number;
}

const GOOGLE_AI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-2.0-flash";

function buildSystemPrompt(source: Language, target: Language, preserveComments: boolean, addExplanations: boolean): string {
  return `You are an expert code translator. Translate code from ${source.name} to ${target.name} accurately.

Rules:
1. Translate faithfully — preserve all logic and behavior
2. Use idiomatic ${target.name} patterns
3. Use appropriate ${target.name} standard library equivalents
4. ${preserveComments ? "Preserve all comments" : "Remove comments unless critical"}
5. ${addExplanations ? "Add brief inline comments explaining non-obvious translations" : "Keep output clean"}
6. Output ONLY the translated code — no markdown fences, no explanations before or after
7. If something cannot be directly translated, add a comment explaining why

After the code, on a new line write "NOTES:" followed by any important notes. If none write "NOTES: none".
After that, write "WARNINGS:" followed by any potential issues. If none write "WARNINGS: none".`;
}

function buildUserPrompt(sourceCode: string, source: Language, target: Language): string {
  return `Translate this ${source.name} code to ${target.name}:\n\n${sourceCode}`;
}

function parseResponse(rawText: string): TranslationResult {
  const notesSplit = rawText.split(/^NOTES:/m);
  const codeSection = notesSplit[0].trim();
  let notes: string[] = [];
  let warnings: string[] = [];

  if (notesSplit.length > 1) {
    const warnSplit = notesSplit[1].split(/^WARNINGS:/m);
    const notesText = warnSplit[0].trim();
    const warningsText = warnSplit[1]?.trim() ?? "";
    if (notesText && notesText.toLowerCase() !== "none") {
      notes = notesText.split("\n").map((l) => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
    }
    if (warningsText && warningsText.toLowerCase() !== "none") {
      warnings = warningsText.split("\n").map((l) => l.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
    }
  }

  const cleaned = codeSection.replace(/^```[\w]*\n?/m, "").replace(/\n?```$/m, "").trim();
  return { translatedCode: cleaned, notes, warnings };
}

export async function translateCode(options: TranslationOptions, apiKey: string): Promise<TranslationResult> {
  const { sourceLanguage, targetLanguage, sourceCode, preserveComments = true, addExplanations = false } = options;

  const url = `${GOOGLE_AI_BASE_URL}/${MODEL}:generateContent?key=${apiKey}`;

  const requestBody = {
    system_instruction: {
      parts: [{ text: buildSystemPrompt(sourceLanguage, targetLanguage, preserveComments, addExplanations) }],
    },
    contents: [{ role: "user", parts: [{ text: `Translate this ${sourceLanguage.name} code to ${targetLanguage.name}:\n\n${sourceCode}` }] }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192, topP: 0.95 },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMsg = `API error ${response.status}: ${response.statusText}`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMsg = parsed?.error?.message ?? errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    usageMetadata?: { totalTokenCount?: number };
    error?: { message: string };
  };

  if (data.error) throw new Error(data.error.message);

  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error("No response from model — try again");
  if (candidate.finishReason === "SAFETY") throw new Error("Response blocked by safety filters");

  const rawText = candidate.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!rawText.trim()) throw new Error("Empty response from model");

  const result = parseResponse(rawText);
  result.tokensUsed = data.usageMetadata?.totalTokenCount;
  return result;
}

export async function translateCodeTogether(
  options: TranslationOptions,
  apiKey: string
): Promise<TranslationResult> {
  const { sourceLanguage, targetLanguage, sourceCode, preserveComments = true, addExplanations = false } = options;

  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(sourceLanguage, targetLanguage, preserveComments, addExplanations),
        },
        {
          role: 'user',
          content: buildUserPrompt(sourceCode, sourceLanguage, targetLanguage),
        },
      ],
      temperature: 0.1,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Together.ai error ${response.status}: ${err}`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { total_tokens?: number };
  };

  const rawText = data.choices?.[0]?.message?.content ?? '';
  const result = parseResponse(rawText);
  result.tokensUsed = data.usage?.total_tokens;
  return result;
}