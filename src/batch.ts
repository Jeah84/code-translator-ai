import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, relative, dirname, extname } from "path";
import { Language, getOutputExtension } from "./languages";
import { translateCode, translateCodeTogether } from "./translator";
import { validateCode } from "./validator";

export interface BatchOptions {
  inputDir: string;
  outputDir: string;
  sourceLanguage: Language;
  targetLanguage: Language;
  apiKey: string;
  validate?: boolean;
  recursive?: boolean;
  preserveComments?: boolean;
  dryRun?: boolean;
}

export interface BatchResult {
  total: number;
  succeeded: number;
  failed: number;
  skipped: number;
  files: Array<{
    input: string;
    output: string;
    status: "success" | "failed" | "skipped";
    error?: string;
    validationPassed?: boolean;
  }>;
}

function findSourceFiles(dir: string, language: Language, recursive: boolean): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    if (entry.startsWith(".") || entry === "node_modules" || entry === "dist" || entry === "__pycache__") continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && recursive) {
      files.push(...findSourceFiles(fullPath, language, recursive));
    } else if (stat.isFile() && language.extensions.includes(extname(entry).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function batchTranslate(
  options: BatchOptions,
  onProgress?: (current: number, total: number, file: string) => void
): Promise<BatchResult> {
  const {
    inputDir,
    outputDir,
    sourceLanguage,
    targetLanguage,
    apiKey,
    validate = false,
    recursive = true,
    preserveComments = true,
    dryRun = false,
  } = options;

  const sourceFiles = findSourceFiles(inputDir, sourceLanguage, recursive);
  const result: BatchResult = { total: sourceFiles.length, succeeded: 0, failed: 0, skipped: 0, files: [] };
  const outExt = getOutputExtension(targetLanguage);

  for (let i = 0; i < sourceFiles.length; i++) {
    const inputFile = sourceFiles[i];
    const relPath = relative(inputDir, inputFile);
    const outputFile = join(outputDir, relPath.replace(/\.[^.]+$/, outExt));
    onProgress?.(i + 1, sourceFiles.length, relPath);

    if (dryRun) {
      result.files.push({ input: inputFile, output: outputFile, status: "skipped" });
      result.skipped++;
      continue;
    }

    try {
      const sourceCode = readFileSync(inputFile, "utf-8");
      if (!sourceCode.trim()) {
        result.files.push({ input: inputFile, output: outputFile, status: "skipped" });
        result.skipped++;
        continue;
      }
      const translation = await translateCodeTogether(
        { sourceLanguage, targetLanguage, sourceCode, preserveComments },
        apiKey
      );
      mkdirSync(dirname(outputFile), { recursive: true });
      writeFileSync(outputFile, translation.translatedCode, "utf-8");
      let validationPassed: boolean | undefined;
      if (validate) {
        const v = await validateCode(translation.translatedCode, targetLanguage);
        validationPassed = v.checkerAvailable ? v.valid : undefined;
      }
      result.files.push({ input: inputFile, output: outputFile, status: "success", validationPassed });
      result.succeeded++;
      if (i < sourceFiles.length - 1) await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      result.files.push({
        input: inputFile,
        output: outputFile,
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
      result.failed++;
    }
  }
  return result;
}