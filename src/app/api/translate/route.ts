import { NextRequest, NextResponse } from "next/server";
import { translateCode } from "@/lib/ai";
import type {
  TranslationRequest,
  TranslationResponse,
  ApiError,
} from "@/types";

export async function POST(
  request: NextRequest
): Promise<NextResponse<TranslationResponse | ApiError>> {
  try {
    const body: TranslationRequest = await request.json();
    const { code, sourceLanguage, targetLanguage } = body;

    if (!code || !sourceLanguage || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing required fields: code, sourceLanguage, targetLanguage" },
        { status: 400 }
      );
    }

    if (sourceLanguage === targetLanguage) {
      return NextResponse.json(
        { error: "Source and target languages must be different" },
        { status: 400 }
      );
    }

    const translatedCode = await translateCode(code, sourceLanguage, targetLanguage);

    return NextResponse.json({ translatedCode, sourceLanguage, targetLanguage });
  } catch (err) {
    console.error("[/api/translate] error:", err);
    return NextResponse.json(
      { error: "Translation failed. Please try again." },
      { status: 500 }
    );
  }
}
