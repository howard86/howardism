import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

import { getClientIp } from "@/server/rate-limit/getClientIp";
import {
  getRateLimiter,
  type RateLimitPolicy,
} from "@/server/rate-limit/index";

// ---------------------------------------------------------------------------
// Per-route-family policies — fixed window when served by the memory
// fallback, sliding window when Upstash is configured. Order matters: the
// first prefix match wins, so `/api/checkout/confirm` must be listed before
// `/api/checkout`.
// ---------------------------------------------------------------------------

const routePolicy: readonly RateLimitPolicy[] = [
  { prefix: "/api/auth", limit: 10, windowMs: 60_000 },
  { prefix: "/api/checkout/confirm", limit: 20, windowMs: 60_000 },
  { prefix: "/api/checkout", limit: 10, windowMs: 60_000 },
  { prefix: "/api/resume", limit: 20, windowMs: 60_000 },
  { prefix: "/api/subscription", limit: 5, windowMs: 60_000 },
  { prefix: "/api/proxy", limit: 10, windowMs: 60_000 },
  { prefix: "/api/sudoku", limit: 20, windowMs: 60_000 },
];

const defaultApiPolicy: RateLimitPolicy = {
  prefix: "/api/",
  limit: 60,
  windowMs: 60_000,
};

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // 1. Auth guard: /profile/* requires a Better Auth session cookie.
  //    getSessionCookie parses the Cookie header — no DB query on the hot path.
  //    Returns early on redirect so unauthenticated profile traffic never
  //    consumes a rate-limit slot.
  if (pathname.startsWith("/profile")) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackURL", pathname);
      return NextResponse.redirect(loginUrl, 307);
    }
  }

  // 2. Rate limiting: /api/* paths are checked against per-route-family limits.
  if (pathname.startsWith("/api")) {
    const ip = getClientIp(request.headers);

    const policy =
      routePolicy.find((p) => pathname.startsWith(p.prefix)) ??
      defaultApiPolicy;

    const limiter = getRateLimiter();
    const key = `${ip}:${policy.prefix}`;
    const { allowed, retryAfter } = await limiter.consume(key, policy);

    if (!allowed) {
      return NextResponse.json(
        { message: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/api/:path*"],
};
