import { execSync } from "child_process";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { Language } from "./languages";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  checkerAvailable: boolean;
}

export async function validateCode(code: string, language: Language): Promise<ValidationResult> {
  if (!language.compileCheck) return { valid: true, checkerAvailable: false };

  const command = language.compileCheck.split(" ")[0];
  try {
    execSync(`which ${command}`, { stdio: "ignore" });
  } catch {
    return { valid: true, checkerAvailable: false };
  }

  const ext = language.extensions[0];
  const tmpFile = join(tmpdir(), `ct_validate_${Date.now()}${ext}`);

  try {
    writeFileSync(tmpFile, code, "utf-8");
    execSync(`${language.compileCheck} ${tmpFile}`, { stdio: "pipe", timeout: 15000 });
    return { valid: true, checkerAvailable: true };
  } catch (err: unknown) {
    let errorMsg = "Compilation failed";
    if (err && typeof err === "object" && "stderr" in err) {
      const stderr = (err as { stderr?: Buffer }).stderr;
      errorMsg = stderr?.toString().trim() ?? errorMsg;
      errorMsg = errorMsg.replace(tmpFile, "<output_file>");
    }
    return { valid: false, error: errorMsg, checkerAvailable: true };
  } finally {
    if (existsSync(tmpFile)) unlinkSync(tmpFile);
  }
}