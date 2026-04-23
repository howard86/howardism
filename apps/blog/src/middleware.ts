import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Rate-limiting — fixed-window counters, one bucket per (client-IP, route-family)
// ---------------------------------------------------------------------------

// TODO(#497-followup): replace with Redis/Upstash when moving off single-instance — per-instance limits only
export const BUCKET_MAP_CAP = 10_000;

const routePolicy: ReadonlyArray<{
  prefix: string;
  limit: number;
  windowMs: number;
}> = [
  { prefix: "/api/auth", limit: 10, windowMs: 60_000 },
  // More-specific prefix MUST come before the generic /api/checkout entry —
  // routePolicy.find stops at the first match. The confirm callback is
  // redirected to by LINE Pay (possibly retried) and is idempotent, so it
  // gets a slightly higher budget than the user-initiated POST.
  { prefix: "/api/checkout/confirm", limit: 20, windowMs: 60_000 },
  { prefix: "/api/checkout", limit: 10, windowMs: 60_000 },
  { prefix: "/api/resume", limit: 20, windowMs: 60_000 },
  { prefix: "/api/subscription", limit: 5, windowMs: 60_000 },
  { prefix: "/api/proxy", limit: 10, windowMs: 60_000 },
  { prefix: "/api/sudoku", limit: 20, windowMs: 60_000 },
];

const defaultApiPolicy = { prefix: "/api/", limit: 60, windowMs: 60_000 };

interface BucketState {
  count: number;
  windowMs: number;
  windowStart: number;
}

export const buckets = new Map<string, BucketState>();

function consume(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  let state = buckets.get(key);

  if (!state) {
    // Opportunistic on-write eviction: sweep expired entries to keep map bounded.
    if (buckets.size > BUCKET_MAP_CAP) {
      for (const [k, s] of buckets) {
        if (now - s.windowStart >= s.windowMs) {
          buckets.delete(k);
        }
      }
    }
    state = { count: 0, windowStart: now, windowMs };
    buckets.set(key, state);
  }

  if (now - state.windowStart >= state.windowMs) {
    state.count = 0;
    state.windowStart = now;
  }

  if (state.count < limit) {
    state.count++;
    return { allowed: true, retryAfter: 0 };
  }

  const retryAfter = Math.max(
    1,
    Math.ceil((state.windowMs - (now - state.windowStart)) / 1000)
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
    // Trusted-proxy assumption: the left-most entry in X-Forwarded-For is the
    // original client IP set by the outermost proxy. Splitting on commas and
    // taking index 0 prevents suffix-injection bypass (where an attacker appends
    // extra IPs to escape their exhausted bucket).
    const xff = request.headers.get("x-forwarded-for");
    const ip = xff
      ? (xff.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown")
      : (request.headers.get("x-real-ip") ?? "unknown");

    const policy =
      routePolicy.find((p) => pathname.startsWith(p.prefix)) ??
      defaultApiPolicy;

    const key = `${ip}:${policy.prefix}`;
    const { allowed, retryAfter } = consume(key, policy.limit, policy.windowMs);

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
