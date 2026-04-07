export type SupportedLanguage =
  | "bash"
  | "c"
  | "cpp"
  | "csharp"
  | "go"
  | "java"
  | "javascript"
  | "kotlin"
  | "lua"
  | "php"
  | "python"
  | "ruby"
  | "rust"
  | "scala"
  | "swift"
  | "typescript";

export interface TranslationRequest {
  code: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}

export interface TranslationResponse {
  translatedCode: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}

export interface ApiError {
  error: string;
}
