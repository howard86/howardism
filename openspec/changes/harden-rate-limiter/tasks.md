## 0. Code archaeology (must precede plan)

- [x] 0.1 Read the existing inline rate limiter in `apps/blog/src/middleware.ts` and record the current shape (`Map<string, { count, reset }>`, fixed-window algorithm, raw-XFF key).
- [x] 0.2 Read `openspec/changes/api-security-hardening/specs/api-rate-limiting/spec.md` and note every requirement the existing limiter satisfies vs. drifts from — especially §15 (IP source) and §41-48 (429 body).
- [x] 0.3 Confirm `@upstash/ratelimit` + `@upstash/redis` are Edge-runtime safe (REST over `fetch`, no `net`/`tls`) — this change must not break the middleware's current Edge execution context.
- [x] 0.4 Grep for callers of `@/config/env.mjs` inside test files to capture the correct `mock.module` registration pattern (it must run before any `await import()` of the middleware, because `@t3-oss/env-nextjs` wraps `env` in a Proxy that throws on client-side access — and happy-dom's preload makes the runtime look client-side to the Proxy).
- [x] 0.5 Enumerate the 7 routes covered by `routePolicy` today and decide whether `/api/checkout/confirm` belongs here or with Change A — land it here for first-match ordering correctness.

## 1. Extract IP resolution (R1 — issue #554)

- [x] 1.1 Add failing tests in `apps/blog/src/server/rate-limit/__tests__/getClientIp.test.ts` covering: (a) `x-vercel-forwarded-for` beats `x-forwarded-for`, (b) first comma-separated entry of XFF wins, (c) whitespace trimmed, (d) regression: two distinct leading XFF entries produce distinct keys (the `#554` bypass), (e) `x-real-ip` fallback, (f) `"anonymous"` when all absent, (g) `"anonymous"` when XFF is pure padding (`,  , ,`), (h) empty `x-vercel-forwarded-for` defers to XFF.
- [x] 1.2 Create `apps/blog/src/server/rate-limit/getClientIp.ts` with `export function getClientIp(headers: Headers): string` implementing the precedence rule. Use an internal `firstNonEmpty` helper that splits on `,`, trims each fragment, and returns the first non-empty one.
- [x] 1.3 `bun test apps/blog/src/server/rate-limit/__tests__/getClientIp.test.ts` → all green.

## 2. Split limiter into swappable implementations (R2 — issue #573)

- [x] 2.1 Create `apps/blog/src/server/rate-limit/types.ts` exporting `RateLimitPolicy`, `RateLimitResult`, and `RateLimiter` interfaces (`consume(key, policy): Promise<RateLimitResult>`). Policy carries `{ limit, prefix, windowMs }` (alphabetical per Ultracite `useSortedInterfaceMembers`).
- [x] 2.2 Add failing tests in `apps/blog/src/server/rate-limit/__tests__/memory.test.ts` covering: (a) allow until limit, deny at limit+1, (b) windows reset after `windowMs`, (c) distinct keys have distinct buckets, (d) GC sweep removes buckets older than `5 × windowMs` (trigger by running `GC_THRESHOLD` consumes on a short-window policy and checking a stale key re-allows instead of denying).
- [x] 2.3 Create `apps/blog/src/server/rate-limit/memory.ts` exporting `createMemoryRateLimiter(): RateLimiter`. Use a module-private `Map<string, { count: number; reset: number }>`. On each `consume`, increment the opportunistic-GC counter; when it hits `GC_THRESHOLD = 1024`, sweep entries where `now - reset > (5 × windowMs)` and reset the counter. Return `Promise.resolve({ allowed, retryAfter })` to keep the interface async-uniform.
- [x] 2.4 Create `apps/blog/src/server/rate-limit/upstash.ts` exporting `createUpstashRateLimiter(url, token): RateLimiter`. Cache a single `Redis` instance and a `Map<string, Ratelimit>` keyed by `${limit}:${windowMs}` so identical policies reuse the same `Ratelimit` (no per-request `new Ratelimit()`). Use `Ratelimit.slidingWindow(limit, \`${windowMs} ms\`)`, `prefix: "rl"`, `analytics: false`.
- [x] 2.5 Create `apps/blog/src/server/rate-limit/index.ts` — module-scoped singleton `limiter: RateLimiter | null` + `getRateLimiter()` factory that instantiates on first call based on env presence. Export `__resetRateLimiterForTesting()` so tests can force re-selection. Re-export `RateLimiter`, `RateLimitPolicy`, `RateLimitResult` from `./types`. **Do not** re-export `getClientIp` here — Ultracite's `noBarrelFile` rule flags it; callers import from `./getClientIp` directly.
- [x] 2.6 Add `@upstash/ratelimit` and `@upstash/redis` to `apps/blog/package.json` dependencies; run `bun install`.
- [x] 2.7 Add `UPSTASH_REDIS_REST_URL` (`z.string().url().optional()`) and `UPSTASH_REDIS_REST_TOKEN` (`z.string().min(1).optional()`) to the server schema and `runtimeEnv` in `apps/blog/src/config/env.mjs`.
- [x] 2.8 `bun test apps/blog/src/server/rate-limit` → all green.

## 3. Rewire middleware (R3 — spec conformance)

- [x] 3.1 Rewrite `apps/blog/src/middleware.ts` to import `getClientIp` from `@/server/rate-limit/getClientIp` and `{ getRateLimiter, type RateLimitPolicy }` from `@/server/rate-limit/index`. Drop the inline `Map` and the `TODO(#497-followup)` comment.
- [x] 3.2 Add `/api/checkout/confirm` policy (20/60s) BEFORE `/api/checkout` (10/60s) in `routePolicy` — first-match wins, so order is load-bearing.
- [x] 3.3 Change the 429 response body from `{ error: "rate_limited" }` to `{ message: "Too many requests" }` per spec §41-48.
- [x] 3.4 Update `apps/blog/src/__tests__/middleware.rate-limit.test.ts`: (a) register `mock.module("@/config/env.mjs", …)` with undefined Upstash vars BEFORE the dynamic `await import("../middleware")`, (b) assert new 429 body shape, (c) add case: two distinct leading-XFF entries → distinct buckets, (d) add case: `x-vercel-forwarded-for` beats spoofed XFF, (e) add case: `/api/checkout/confirm` permits 20 before limiting.
- [x] 3.5 `bun test apps/blog/src/__tests__/middleware.rate-limit.test.ts` → all green.

## 4. Verification

- [x] 4.1 `cd apps/blog && bun test` → full suite green (memory fallback only).
- [x] 4.2 `bun run type-check` at root → green.
- [x] 4.3 `bun run lint` at root → green (no `useSortedInterfaceMembers` / `useTopLevelRegex` / `noBarrelFile` violations).
- [ ] 4.4 Manual smoke test (out-of-band): point a staging `.env.local` at Upstash free-tier, `bun run dev`, curl `/api/subscription` 6× and confirm the 6th is 429 with `Retry-After` header and the correct body. **Deferred — requires Upstash provisioning; blog owner to run before flipping prod env.**
- [ ] 4.5 Before merge: user provisions `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` in Vercel env. Without them the new code runs on the memory fallback, which is strictly better than the shipped code (now with the XFF-bypass fix) but still per-instance. Flag this in the PR description.

## 5. OpenSpec bookkeeping

- [x] 5.1 Author `openspec/changes/harden-rate-limiter/proposal.md` — single summary of both issues, explicit env/deps impact.
- [x] 5.2 Author `openspec/changes/harden-rate-limiter/tasks.md` (this file).
- [x] 5.3 Author `openspec/changes/harden-rate-limiter/design.md` — IP-source precedence rationale, Upstash-vs-memory tradeoff, why Ratelimit instances are cached by `(limit, window)` tuple.
- [x] 5.4 Author `openspec/changes/harden-rate-limiter/specs/api-rate-limiting/spec.md` delta — `## MODIFIED Requirements` for §15, §41-48, single-instance scope; `## ADDED Requirements` for `x-vercel-forwarded-for` precedence and `/api/checkout/confirm` bucket.
- [ ] 5.5 `bunx openspec validate harden-rate-limiter` → clean.
