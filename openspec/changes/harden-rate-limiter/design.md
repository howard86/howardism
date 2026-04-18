# Design — `harden-rate-limiter`

## Scope

This change retires two compromises made when `api-security-hardening` first shipped rate limiting (issue #497):

1. Per-process in-memory state → effective multiplier `N × limit` under multi-instance serverless (#573).
2. Raw `x-forwarded-for` as the client key → trivial bypass plus unbounded memory growth in the memory path (#554).

Both sit on the same module boundary and share the same abstraction, so one change, one PR.

## Key decisions

### D1 — Backing store: Upstash REST with memory fallback

**Options considered:**

| Option | Pros | Cons |
|---|---|---|
| **Upstash Redis REST** (chosen) | Edge-runtime safe (pure `fetch`, no Node sockets); existing sliding-window primitive via `@upstash/ratelimit`; free tier covers dev traffic | Adds 2 deps, requires env vars, extra network hop |
| Vercel KV | Same vendor as hosting; similar REST API | Tighter Vercel lock-in; same blast radius as above |
| DynamoDB via AWS SDK | Already used in other Howard projects | Node-only client; breaks Edge runtime; heavy SDK surface |
| Cloudflare D1 / Durable Objects | Edge-native | Requires migrating to Workers — out of scope |
| Keep memory-only, add `setInterval` GC | Zero-dep | Doesn't fix #573. Fails the "effective limit" requirement. |

Chose Upstash because the middleware already runs on the Edge (`middleware.ts` has no `runtime: 'nodejs'` opt-in), so the backing store must be reachable by `fetch`. `@upstash/ratelimit` is the canonical sliding-window implementation on that stack.

**Fallback rationale.** Gating on env presence means `bun run dev` works zero-config, `bun test` runs without network, and staging/prod get the distributed limiter the moment they provision env vars. The fallback isn't "degraded mode" — it's the same behavior the code has today, minus the `x-forwarded-for` bypass. No worse than shipped; possibly better.

### D2 — IP source precedence

Precedence, in order:

1. `x-vercel-forwarded-for` — Vercel's edge sets this; a client can't set it because the edge strips it off the inbound request before setting its own.
2. First comma-separated, trimmed entry of `x-forwarded-for` — matches the existing spec §15 and the standard Forwarded-For convention: the leftmost entry is the client, subsequent entries are proxies.
3. `x-real-ip` — last-ditch for deployments without Vercel's edge (local reverse proxy setups).
4. Literal `"anonymous"` — the sentinel for requests with no identifying headers.

**Why not just use the whole `x-forwarded-for`?** That's the deployed bug. A client sending `1.1.1.1, a` and then `1.1.1.1, b` creates two distinct keys. The first-entry rule makes the key match `x-forwarded-for`'s semantics (the leftmost = the originating client) and collapses the bypass.

**Why `"anonymous"` and not `"unknown"`?** The shipped code used `"anonymous"`; changing it would invalidate currently-in-flight buckets. The word also contrasts more strongly with a legitimate IP string — if a client literally sent `"unknown"` as their XFF we'd collide with the sentinel. `"anonymous"` is less plausible as a legit header value. Spec text updated to match.

### D3 — Ratelimit instance caching

`@upstash/ratelimit`'s `Ratelimit` constructor wires a sliding-window counter with a fixed `(limit, window)` tuple — a new `Ratelimit` per `consume` call would allocate and reset internal state needlessly. The factory caches by `${limit}:${windowMs}` so each distinct policy gets one shared `Ratelimit`; the route-family table has 7 entries so the cache maxes at 7 instances.

### D4 — Opportunistic GC on the memory fallback

Two options for bounding memory in the fallback:

- `setInterval` sweep — simple but pins a timer in the Edge runtime and may not work in every runtime (Workerd strips `setInterval` in some contexts).
- Opportunistic sweep inside `consume` — zero background work, cost amortized across real traffic. Sweep triggers every 1024 calls; on serverless the process lifetime is typically far shorter so the sweep never runs there. On long-running dev servers it kicks in every ~1000 requests, which is sufficient for capping memory.

Chose opportunistic because the Edge-compat story is clean and the overhead is nil on serverless (the codepath is skipped).

### D5 — Why ship the 429 body fix now

The shipped code responds with `{ "error": "rate_limited" }`; the spec locks it to `{ "message": "Too many requests" }`. Clients inspecting the body shape per the spec fail today. Shipping this fix alongside the limiter rewire costs a one-line diff and brings the runtime into conformance; deferring it would mean another churn-the-same-file change.

### D6 — `/api/checkout/confirm` routing

The new LINE Pay return callback (shipped in Change A, #572) uses `/api/checkout/confirm`. Without a dedicated policy it matches `/api/checkout` (10/60s POST budget for checkout initiation). That would starve the return-callback during burst traffic — a user redirected back from LINE Pay would 429 and hit the "something went wrong" branch instead of completing. Add `/api/checkout/confirm` (20/60s) and list it BEFORE `/api/checkout` so first-match routing picks it.

20/60s chosen empirically: confirm-redirects are idempotent on our side (we early-return for already-completed orders) and LINE Pay at worst sends two callbacks per order; 20/min leaves headroom for retries without softening the fraud signal.

## Out of scope

- **Per-user rate limits.** Keyed on IP. Logged-in users with stable sessions still share the IP-keyed bucket with their household/NAT peers — acceptable for now; a future change could add a user-ID-keyed overlay on authenticated routes.
- **Rate-limit analytics.** `@upstash/ratelimit` has an `analytics: true` knob that writes to a separate Redis key; disabled here to keep the free-tier footprint minimal. Revisit if we ever want per-route telemetry.
- **Different algorithm per route.** `Ratelimit.tokenBucket` and `Ratelimit.fixedWindow` exist; sliding-window is a reasonable default. A future change can swap per policy if the burst profile demands it.

## Risks

1. **Env-var misconfiguration.** If `UPSTASH_REDIS_REST_URL` is set but the Upstash instance is unreachable, `consume` will throw and the middleware will fail open (return 500 via the middleware's default error handling). Mitigation: `@upstash/ratelimit` has a built-in retry; we don't wrap in try/catch so transient errors surface in logs. Document in PR that the env vars are only wired up by the deployment owner after verifying the Upstash instance is live.
2. **Key-space growth on memory fallback.** An attacker can still pressure memory by rotating the leading XFF entry (10^12 IPs × bucket size). The opportunistic GC bounds this to one window's worth of traffic. On serverless, the process lifetime caps it anyway.
3. **Spec drift recurrence.** The fix aligns code with spec today. To avoid regression, the `middleware.rate-limit.test.ts` now asserts the 429 body shape explicitly — any future rewrite that drifts will fail the test.
