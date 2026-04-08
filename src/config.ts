import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const CONFIG_DIR = join(homedir(), ".config", "code-translator");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

interface Config {
  googleApiKey?: string;
  dailyCount?: number;
  dailyDate?: string;
  tier?: "free" | "pro";
}

function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
}

export function getApiKey(): string | undefined {
  const envKey = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY;
  if (envKey) return envKey;
  const config = loadConfig();
  return config.googleApiKey;
}

export function setApiKey(key: string): void {
  const config = loadConfig();
  config.googleApiKey = key;
  saveConfig(config);
}

export function checkDailyLimit(): { allowed: boolean; remaining: number; tier: string } {
  const config = loadConfig();
  const today = new Date().toISOString().split("T")[0];
  const FREE_LIMIT = 10;
  if (config.tier === "pro") return { allowed: true, remaining: Infinity, tier: "pro" };
  if (config.dailyDate !== today) {
    config.dailyCount = 0;
    config.dailyDate = today;
    saveConfig(config);
  }
  const count = config.dailyCount ?? 0;
  return { allowed: FREE_LIMIT - count > 0, remaining: FREE_LIMIT - count, tier: "free" };
}

export function incrementDailyCount(): void {
  const config = loadConfig();
  const today = new Date().toISOString().split("T")[0];
  if (config.dailyDate !== today) {
    config.dailyCount = 0;
    config.dailyDate = today;
  }
  config.dailyCount = (config.dailyCount ?? 0) + 1;
  saveConfig(config);
}