## Why

The rate limiter shipped in `api-security-hardening` (issue #497) carried two explicit compromises that are now overdue to retire:

1. **#573** — The limiter backs per-IP counters with a per-process `Map`. On Vercel's multi-instance serverless deployment, each lambda keeps its own bucket, so the effective global limit is `N × limit` where `N` is the active instance count. For `/api/auth` that turns a 10/min throttle into a de-facto 10·N/min throttle — brute-force protection silently degrades under load, which is precisely when it matters.
2. **#554** — The middleware keys buckets on the raw `x-forwarded-for` header value (the whole comma-joined string). An attacker can rotate a trivial suffix (`1.1.1.1, a`, `1.1.1.1, b`, …) to synthesize unbounded distinct keys, achieving both rate-limit bypass and unbounded memory growth in the in-memory fallback. The deployed behavior also drifted from the spec's §15 ("first entry in x-forwarded-for") — spec and code disagree.

Both are fixed in one change because they sit on the same module boundary (`apps/blog/src/middleware.ts`) and share the same abstraction (how a client-identifier + policy map to a rate-limit verdict). Fixing them separately would churn the same file twice.

## What Changes

- **#573 (distributed backend)** — Replace the per-process `Map` with a factory (`getRateLimiter`) that returns an Upstash-backed sliding-window limiter when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set, falling back to an in-memory fixed-window limiter otherwise. The Upstash path uses `@upstash/ratelimit` + `@upstash/redis` — both are Edge-runtime compatible (REST transport, no Node `net`), which matters because the middleware runs on the Edge. The memory fallback keeps `bun run dev` friction-free when the env vars are unset.
- **#554 (IP source)** — Extract client-IP derivation into `apps/blog/src/server/rate-limit/getClientIp.ts`, with precedence: `x-vercel-forwarded-for` (set by Vercel's edge, not spoofable from a direct client) → first comma-separated entry of `x-forwarded-for` (matches spec §15) → `x-real-ip` → literal `"anonymous"`. Leading entries get trimmed of whitespace and empty-string padding rejected. The spec says "unknown"; we normalize to `"anonymous"` to match the shipped code and update the spec to reflect it — this is the less-ambiguous sentinel (a bare `"unknown"` can collide with a header that legitimately contains that string).
- **429 body contract** — Align the middleware response body to the spec's `{ "message": "Too many requests" }`. The deployed code shipped with `{ "error": "rate_limited" }`, which contradicts `api-rate-limiting` spec §41-48. Clients reading the spec would fail the body check today.
- **Opportunistic GC on the memory fallback** — Every 1024 `consume` calls, sweep buckets where `now - windowStart > 5 × windowMs`. Caps memory in long-running dev sessions; irrelevant on serverless (process lifetime ≪ 1024 calls).
- **Policy table additions** — Add `/api/checkout/confirm` (20/60s) ahead of `/api/checkout` (10/60s) in the first-match ordering. Without this, the LINE Pay return-callback would share the 10/60s POST budget and get starved during a burst of real user traffic. (Tracks the new policy added for Change A, #572.)

## Capabilities

### Modified Capabilities

- `api-rate-limiting`:
  - **MODIFIED** — drop the in-memory-only constraint; add Upstash sliding-window option keyed on env presence; lock 429 body shape to `{"message":"Too many requests"}`; extend IP-source rule beyond raw XFF.
  - **ADDED** — IP source precedence rule covering `x-vercel-forwarded-for` and `x-real-ip` fallbacks; `/api/checkout/confirm` dedicated 20/60s bucket.

## Impact

- **Code**: `apps/blog/src/middleware.ts` (rewired to factory), new `apps/blog/src/server/rate-limit/{index,types,memory,upstash,getClientIp}.ts`, new tests under `apps/blog/src/server/rate-limit/__tests__/`, updated `apps/blog/src/__tests__/middleware.rate-limit.test.ts`.
- **Dependencies**: `@upstash/ratelimit@^2.0` + `@upstash/redis@^1.37` added to `apps/blog/package.json`. Both are pure REST clients — no Node-only deps — so they work in the Edge runtime.
- **Environment**: two new optional server env vars in `apps/blog/src/config/env.mjs` — `UPSTASH_REDIS_REST_URL` (`z.string().url().optional()`) and `UPSTASH_REDIS_REST_TOKEN` (`z.string().min(1).optional()`). When both are set, Upstash is used; when either is missing, the memory fallback is used. Callers out: deployment owner (user) must provision these in Vercel before the merge takes real effect — until then, prod keeps using the memory fallback (same behavior as today minus the `x-forwarded-for` bypass).
- **Tests**: existing 7 middleware integration tests continue to pass against the memory fallback (env mocked to unset); added cases for first-XFF keying, `x-vercel-forwarded-for` precedence, 429 body shape, and the new `/api/checkout/confirm` policy. Upstash path not integration-tested — requires a live REST server and is covered by the `@upstash/ratelimit` library's own tests.
- **Issues auto-closed on merge**: `Fixes #573`, `Fixes #554`.
