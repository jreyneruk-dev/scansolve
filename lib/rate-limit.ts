/**
 * Lightweight sliding-window rate limiter.
 *
 * Production: uses Upstash Redis REST API (no SDK dependency).
 *   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in env vars.
 *
 * Development / fallback: in-memory Map (per-instance, resets on cold start).
 *   Good enough for local dev and catches rapid bursts within a warm lambda.
 */

// In-memory fallback store — module-level so it persists across requests
// within the same warm serverless instance.
const memStore = new Map<string, { count: number; resetAt: number }>();

// Clean up expired entries periodically to avoid unbounded growth.
function memCleanup() {
  const now = Date.now();
  for (const [key, entry] of memStore) {
    if (now > entry.resetAt) memStore.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
}

/**
 * Check and increment a rate limit counter.
 *
 * @param key        Unique key, e.g. `"issues:ip:1.2.3.4"` or `"ai:user:abc123"`
 * @param limit      Max requests allowed per window
 * @param windowSecs Length of the fixed window in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSecs: number
): Promise<RateLimitResult> {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // ── Upstash path ──────────────────────────────────────────────────────────
  if (url && token) {
    try {
      // Fixed window: bucket by (key + current window index)
      const window  = Math.floor(Date.now() / 1000 / windowSecs);
      const redisKey = `rl:${key}:${window}`;

      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["EXPIRE", redisKey, windowSecs],
        ]),
      });

      if (res.ok) {
        const data = await res.json() as [{ result: number }, unknown];
        const count = data[0]?.result ?? 1;
        return {
          allowed:   count <= limit,
          remaining: Math.max(0, limit - count),
          limit,
        };
      }
    } catch {
      // Upstash unreachable — fall through to in-memory
    }
  }

  // ── In-memory fallback ────────────────────────────────────────────────────
  if (memStore.size > 5000) memCleanup();

  const now   = Date.now();
  const entry = memStore.get(key);

  if (!entry || now > entry.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowSecs * 1000 });
    return { allowed: true, remaining: limit - 1, limit };
  }

  entry.count++;
  return {
    allowed:   entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    limit,
  };
}
