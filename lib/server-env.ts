/**
 * Reads server-only secrets with a direct .env.local fallback.
 * Works around edge cases where Next.js doesn't inject all env vars
 * into process.env during dev (e.g. keys added after server start).
 */
import fs from "fs";
import path from "path";

let _cache: Record<string, string> | null = null;

function parseEnvLocal(): Record<string, string> {
  if (_cache) return _cache;
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    _cache = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      _cache[key] = val;
    }
  } catch {
    _cache = {};
  }
  return _cache;
}

export function getServerEnv(key: string): string {
  // Prefer process.env (works in production / Vercel)
  if (process.env[key]) return process.env[key]!;
  // Fall back to reading .env.local directly (dev safety net)
  return parseEnvLocal()[key] ?? "";
}
