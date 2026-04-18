import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import type { RateLimiter, RateLimitPolicy, RateLimitResult } from "./types";

/**
 * Distributed limiter backed by Upstash Redis over the REST API. Edge-runtime
 * safe — the `@upstash/redis` client uses `fetch`, not a TCP socket.
 *
 * One `Ratelimit` instance is cached per unique `(limit, windowMs)` pair so
 * that a single Upstash REST connection is reused across all policies.
 */
export function createUpstashRateLimiter(
  url: string,
  token: string
): RateLimiter {
  const redis = new Redis({ url, token });
  const limiterCache = new Map<string, Ratelimit>();

  const getLimiter = (policy: RateLimitPolicy): Ratelimit => {
    const cacheKey = `${policy.limit}:${policy.windowMs}`;
    const cached = limiterCache.get(cacheKey);
    if (cached) {
      return cached;
    }
    const instance = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(policy.limit, `${policy.windowMs} ms`),
      prefix: "rl",
      analytics: false,
    });
    limiterCache.set(cacheKey, instance);
    return instance;
  };

  return {
    async consume(
      key: string,
      policy: RateLimitPolicy
    ): Promise<RateLimitResult> {
      const limiter = getLimiter(policy);
      const { success, reset } = await limiter.limit(key);
      if (success) {
        return { allowed: true, retryAfter: 0 };
      }
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return { allowed: false, retryAfter };
    },
  };
}
