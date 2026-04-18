import { env } from "@/config/env.mjs";

import { createMemoryRateLimiter } from "./memory";
import type { RateLimiter } from "./types";
import { createUpstashRateLimiter } from "./upstash";

export type { RateLimiter, RateLimitPolicy, RateLimitResult } from "./types";

let limiter: RateLimiter | null = null;

/**
 * Module-scoped singleton — the first call instantiates the limiter once;
 * subsequent calls reuse it. Keeping the cache hot across requests is what
 * makes the memory fallback useful in the first place, and it lets the
 * Upstash path reuse its REST client instead of reconnecting per request.
 */
export function getRateLimiter(): RateLimiter {
  if (limiter) {
    return limiter;
  }
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = env;
  if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
    limiter = createUpstashRateLimiter(
      UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN
    );
  } else {
    limiter = createMemoryRateLimiter();
  }
  return limiter;
}

/**
 * Test-only hook: drop the cached limiter so the next `getRateLimiter()`
 * call re-reads env and rebuilds. Exported for use from tests that need to
 * toggle Upstash env between cases.
 */
export function __resetRateLimiterForTesting(): void {
  limiter = null;
}
