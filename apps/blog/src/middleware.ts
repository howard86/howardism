import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Rate-limiting — fixed-window counters, one bucket per (client-IP, route-family)
// ---------------------------------------------------------------------------

// TODO(#497-followup): replace with Redis/Upstash when moving off single-instance — per-instance limits only
const routePolicy: ReadonlyArray<{
  prefix: string;
  limit: number;
  windowMs: number;
}> = [
  { prefix: "/api/auth", limit: 10, windowMs: 60_000 },
  { prefix: "/api/subscription", limit: 5, windowMs: 60_000 },
  { prefix: "/api/proxy", limit: 10, windowMs: 60_000 },
  { prefix: "/api/sudoku", limit: 20, windowMs: 60_000 },
];

const defaultApiPolicy = { prefix: "/api/", limit: 60, windowMs: 60_000 };

interface BucketState {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, BucketState>();

function consume(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  let state = buckets.get(key);

  if (!state) {
    state = { count: 0, windowStart: now };
    buckets.set(key, state);
  }

  if (now - state.windowStart >= windowMs) {
    state.count = 0;
    state.windowStart = now;
  }

  if (state.count < limit) {
    state.count++;
    return { allowed: true, retryAfter: 0 };
  }

  const retryAfter = Math.max(
    1,
    Math.ceil((windowMs - (now - state.windowStart)) / 1000)
  );
  return { allowed: false, retryAfter };
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
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
    const ip =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const policy =
      routePolicy.find((p) => pathname.startsWith(p.prefix)) ??
      defaultApiPolicy;

    const key = `${ip}:${policy.prefix}`;
    const { allowed, retryAfter } = consume(key, policy.limit, policy.windowMs);

    if (!allowed) {
      return NextResponse.json(
        { error: "rate_limited" },
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
