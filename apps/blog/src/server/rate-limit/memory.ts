import type { RateLimiter, RateLimitPolicy, RateLimitResult } from "./types";

interface Bucket {
  count: number;
  windowStart: number;
}

const GC_THRESHOLD = 1024;
const STALENESS_MULTIPLIER = 5;

/**
 * Per-process fixed-window limiter backed by a `Map`. Only correct for
 * single-instance deployments — across N replicas the effective limit is
 * `N × policy.limit`. Used as the local-dev / Upstash-disabled fallback.
 *
 * Memory is bounded by opportunistic GC: when the bucket count exceeds
 * `GC_THRESHOLD` on a miss, buckets whose window started more than
 * `STALENESS_MULTIPLIER × windowMs` ago are evicted.
 */
export function createMemoryRateLimiter(): RateLimiter {
  const buckets = new Map<string, Bucket>();

  return {
    consume(key: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
      const now = Date.now();
      let state = buckets.get(key);

      if (!state) {
        if (buckets.size >= GC_THRESHOLD) {
          evictStale(buckets, now, policy.windowMs);
        }
        state = { count: 0, windowStart: now };
        buckets.set(key, state);
      } else if (now - state.windowStart >= policy.windowMs) {
        state.count = 0;
        state.windowStart = now;
      }

      if (state.count < policy.limit) {
        state.count++;
        return Promise.resolve({ allowed: true, retryAfter: 0 });
      }

      const retryAfter = Math.max(
        1,
        Math.ceil((policy.windowMs - (now - state.windowStart)) / 1000)
      );
      return Promise.resolve({ allowed: false, retryAfter });
    },
  };
}

function evictStale(
  buckets: Map<string, Bucket>,
  now: number,
  windowMs: number
): void {
  const cutoff = now - STALENESS_MULTIPLIER * windowMs;
  for (const [k, v] of buckets) {
    if (v.windowStart < cutoff) {
      buckets.delete(k);
    }
  }
}
