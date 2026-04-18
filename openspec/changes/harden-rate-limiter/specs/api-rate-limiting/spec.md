## MODIFIED Requirements

### Requirement: Per-route-family rate limits enforced in middleware

The Next.js middleware at `apps/blog/src/middleware.ts` SHALL apply per-route-family rate-limit policies to requests matching `/api/:path*`. Policies SHALL be keyed by path prefix, evaluated first-match by declaration order, and SHALL include at minimum:

| Prefix | Window | Max requests per client |
|---|---|---|
| `/api/auth` | 60 seconds | 10 |
| `/api/checkout/confirm` | 60 seconds | 20 |
| `/api/checkout` | 60 seconds | 10 |
| `/api/resume` | 60 seconds | 20 |
| `/api/subscription` | 60 seconds | 5 |
| `/api/proxy` | 60 seconds | 10 |
| `/api/sudoku` | 60 seconds | 20 |
| `/api/` (fallback) | 60 seconds | 60 |

The client identifier SHALL be derived by `getClientIp(headers)`, whose precedence rule is specified below in "Requirement: Client-IP source precedence".

Policies listed earlier in the table SHALL be evaluated before later entries, so `/api/checkout/confirm` (20/60s) SHALL NOT be shadowed by `/api/checkout` (10/60s).

#### Scenario: Auth brute-force is throttled

- **WHEN** eleven requests are sent to `POST /api/auth/sign-in/email` from the same client identifier within sixty seconds
- **THEN** the eleventh response SHALL carry HTTP 429 and the request SHALL NOT reach the Better Auth handler

#### Scenario: Sudoku flood is throttled

- **WHEN** twenty-one requests are sent to `GET /api/sudoku?difficulty=expert` from the same client identifier within sixty seconds
- **THEN** the twenty-first response SHALL carry HTTP 429 and the sudoku handler SHALL NOT be invoked

#### Scenario: Fallback policy applies to routes without a specific prefix

- **WHEN** sixty-one requests are sent to an `/api/` route that has no explicit policy entry from the same client identifier within sixty seconds
- **THEN** the sixty-first response SHALL carry HTTP 429

### Requirement: HTTP 429 response shape on limit exceed

When a request is rejected by the rate limiter, the middleware SHALL respond with HTTP 429, a JSON body of `{ "message": "Too many requests" }`, and SHALL NOT forward the request to the downstream handler. The response SHALL include a `Retry-After` header whose value is a positive integer number of seconds.

#### Scenario: 429 response body is shaped consistently

- **WHEN** the rate limiter rejects a request
- **THEN** the response SHALL have status `429`
- **AND** the response body SHALL equal `{"message":"Too many requests"}`
- **AND** the response SHALL carry a `Retry-After` header whose value parses as a positive integer

### Requirement: Backing-store selection

The middleware SHALL load the rate limiter through a module-scoped factory (`getRateLimiter`) that selects its backing store based on environment-variable presence:

1. **WHEN** both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set at process start, the factory SHALL return a distributed sliding-window limiter backed by Upstash Redis REST.
2. **WHEN** either environment variable is absent or empty, the factory SHALL return an in-memory fixed-window limiter.

The factory SHALL memoize the limiter for the lifetime of the process; the first `getRateLimiter()` call SHALL instantiate it and subsequent calls SHALL return the memoized instance.

The in-memory fallback SHALL bound its key-space by opportunistic garbage collection: once per 1024 `consume` calls, entries whose `reset` timestamp is older than `5 × windowMs` before the current time SHALL be removed.

The distributed limiter SHALL reuse a single Upstash `Redis` client instance across calls, and SHALL cache `Ratelimit` sub-instances by `(limit, windowMs)` tuple so identical policies do not allocate new instances per request.

#### Scenario: Upstash is selected when env is set

- **WHEN** `UPSTASH_REDIS_REST_URL=https://example.upstash.io` and `UPSTASH_REDIS_REST_TOKEN=xxx` are present
- **AND** the middleware processes two requests
- **THEN** both `consume` calls SHALL route through the Upstash-backed limiter
- **AND** the Upstash `Redis` client SHALL be instantiated at most once

#### Scenario: Memory fallback is selected when env is unset

- **WHEN** neither Upstash environment variable is set
- **AND** the middleware processes a request
- **THEN** `consume` SHALL route through the in-memory limiter

#### Scenario: Memory fallback bounds its key-space

- **WHEN** a short-window policy has accumulated stale buckets and the GC threshold is crossed
- **THEN** buckets whose `reset` is older than `5 × windowMs` before now SHALL be evicted
- **AND** a subsequent request with the same key SHALL be allowed (not denied from a stale bucket)

## ADDED Requirements

### Requirement: Client-IP source precedence

Client identifiers used for rate-limit keying SHALL be resolved by a `getClientIp(headers: Headers): string` helper with the following precedence:

1. The trimmed value of `x-vercel-forwarded-for`, if present and non-empty.
2. Otherwise, the first comma-separated entry of `x-forwarded-for` (trimmed), when that entry is non-empty.
3. Otherwise, the trimmed value of `x-real-ip`, if present and non-empty.
4. Otherwise, the literal string `"anonymous"`.

The raw `x-forwarded-for` header SHALL NOT be used as a key — only its first comma-separated entry. A request whose `x-forwarded-for` is purely padding (e.g. `",  , ,"`) SHALL resolve to `"anonymous"`.

#### Scenario: Vercel-edge header wins

- **WHEN** a request carries `x-vercel-forwarded-for: 203.0.113.5` and `x-forwarded-for: 1.2.3.4`
- **THEN** `getClientIp` SHALL return `"203.0.113.5"`

#### Scenario: First entry of XFF is used (regression #554)

- **WHEN** two requests arrive with `x-forwarded-for: "1.1.1.1, 9.9.9.9"` and `"2.2.2.2, 9.9.9.9"` respectively
- **THEN** `getClientIp` SHALL return different values (`"1.1.1.1"` vs. `"2.2.2.2"`)
- **AND** each request SHALL be bucketed under its own rate-limit key

#### Scenario: Empty x-vercel-forwarded-for defers to XFF

- **WHEN** `x-vercel-forwarded-for: ""` and `x-forwarded-for: "198.51.100.3"` are both present
- **THEN** `getClientIp` SHALL return `"198.51.100.3"`

#### Scenario: Absent headers collapse to anonymous sentinel

- **WHEN** no IP-bearing header is present
- **THEN** `getClientIp` SHALL return `"anonymous"`

#### Scenario: Padding-only XFF collapses to anonymous sentinel

- **WHEN** `x-forwarded-for: ",  , ,"` is present and no other IP-bearing header is
- **THEN** `getClientIp` SHALL return `"anonymous"`

### Requirement: Checkout-confirm redirect bucket

Requests to `/api/checkout/confirm` — the LINE Pay return-callback route — SHALL be bucketed against a dedicated 20-requests-per-60-second policy that is distinct from the `/api/checkout` policy. The `/api/checkout/confirm` prefix SHALL appear before `/api/checkout` in the first-match policy table so that the 10/60s checkout-initiation budget does not shadow the callback bucket.

#### Scenario: Confirm route permits twenty before limiting

- **WHEN** twenty requests are sent to `GET /api/checkout/confirm?orderId=x&transactionId=y` from the same client identifier within sixty seconds
- **THEN** all twenty SHALL be forwarded to the handler
- **AND** the twenty-first SHALL respond with HTTP 429

#### Scenario: Confirm bucket is distinct from initiation bucket

- **WHEN** a client exhausts the 10/60s `/api/checkout` budget
- **THEN** a subsequent `/api/checkout/confirm` request from the same client SHALL be allowed (unless its own 20/60s budget is also exhausted)

## REMOVED Requirements

### Requirement: Single-instance scope with documented follow-up

**Reason:** Retired by the Upstash-backed limiter introduced in this change. The middleware no longer carries a `TODO(#497-followup)` marker because the follow-up work is the current change itself. `@upstash/ratelimit` and `@upstash/redis` are now permitted (and required when their env vars are set) — the prior "neither … SHALL be present" constraint is invalidated.

**Migration:** Deployments SHALL provision `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in their runtime environment to activate the distributed limiter. Without them, the middleware falls back to the in-memory limiter — functionally equivalent to the pre-change behavior minus the #554 XFF bypass.
