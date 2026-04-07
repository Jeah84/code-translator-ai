"use client";

import { useState } from "react";
import type { SupportedLanguage, TranslationResponse, ApiError } from "@/types";
import LanguageSelector from "./LanguageSelector";

const LANGUAGES: SupportedLanguage[] = [
  "bash",
  "c",
  "cpp",
  "csharp",
  "go",
  "java",
  "javascript",
  "kotlin",
  "lua",
  "php",
  "python",
  "ruby",
  "rust",
  "scala",
  "swift",
  "typescript",
];

export default function TranslatorPanel() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [sourceLang, setSourceLang] = useState<SupportedLanguage>("python");
  const [targetLang, setTargetLang] = useState<SupportedLanguage>("typescript");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTranslate() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    setOutput("");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
        }),
      });
      const data: TranslationResponse | ApiError = await res.json();
      if (!res.ok || "error" in data) {
        setError((data as ApiError).error ?? "An unexpected error occurred");
      } else {
        setOutput((data as TranslationResponse).translatedCode);
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <LanguageSelector
          label="From"
          value={sourceLang}
          languages={LANGUAGES}
          onChange={setSourceLang}
        />
        <LanguageSelector
          label="To"
          value={targetLang}
          languages={LANGUAGES}
          onChange={setTargetLang}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-400">Input</label>
          <textarea
            className="w-full h-80 bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Paste your code here…"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-400">Output</label>
          <textarea
            readOnly
            className="w-full h-80 bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-100 resize-none"
            placeholder="Translated code will appear here…"
            value={output}
          />
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        onClick={handleTranslate}
        disabled={loading || !code.trim()}
        className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
      >
        {loading ? "Translating…" : "Translate"}
      </button>
    </div>
  );
}
