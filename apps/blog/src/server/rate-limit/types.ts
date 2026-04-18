export interface RateLimitPolicy {
  limit: number;
  prefix: string;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

export interface RateLimiter {
  consume(key: string, policy: RateLimitPolicy): Promise<RateLimitResult>;
}
