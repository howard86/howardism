## ADDED Requirements

### Requirement: Per-route-family rate limits enforced in middleware

The Next.js middleware at `apps/blog/src/middleware.ts` SHALL apply per-route-family rate-limit policies to requests matching `/api/:path*`. Policies SHALL be keyed by path prefix and SHALL include at minimum:

| Prefix | Window | Max requests per client |
|---|---|---|
| `/api/auth` | 60 seconds | 10 |
| `/api/sudoku` | 60 seconds | 20 |
| `/api/subscription` | 60 seconds | 5 |
| `/api/proxy` | 60 seconds | 10 |
| `/api/` (fallback) | 60 seconds | 60 |

#### Scenario: Auth brute-force is throttled

- **WHEN** eleven requests are sent to `POST /api/auth/sign-in/email` from the same client within sixty seconds
- **THEN** the eleventh response SHALL carry HTTP 429 and the request SHALL NOT reach the Better Auth handler

#### Scenario: Sudoku flood is throttled

- **WHEN** twenty-one requests are sent to `GET /api/sudoku?difficulty=expert` from the same client within sixty seconds
- **THEN** the twenty-first response SHALL carry HTTP 429 and the sudoku handler SHALL NOT be invoked

#### Scenario: Fallback policy applies to routes without a specific prefix

- **WHEN** sixty-one requests are sent to an `/api/` route that has no explicit policy entry from the same client within sixty seconds
- **THEN** the sixty-first response SHALL carry HTTP 429

### Requirement: Client identifier derived from left-most X-Forwarded-For entry

The client identifier used to key rate-limit buckets SHALL be derived from the **left-most** comma-separated entry of the `x-forwarded-for` request header, with surrounding whitespace trimmed. If `x-forwarded-for` is absent, the middleware SHALL fall back to `x-real-ip`, then to the literal string `"unknown"`. Trust assumption: deployment sits behind a proxy (Vercel or equivalent) that rewrites or appends `x-forwarded-for` from the real client connection; left-most entry parsing is not safe without that assumption.

#### Scenario: Single-hop XFF uses the single value

- **WHEN** a request arrives with header `x-forwarded-for: 1.2.3.4`
- **THEN** the client identifier component of the rate-limit key SHALL be `1.2.3.4`

#### Scenario: Multi-hop XFF uses left-most entry only

- **WHEN** a request arrives with header `x-forwarded-for: 1.2.3.4, 10.0.0.1, 10.0.0.2`
- **THEN** the client identifier component of the rate-limit key SHALL be `1.2.3.4`

#### Scenario: Prefix-injection bypass attempt maps to one bucket

- **WHEN** three requests arrive, each with `x-forwarded-for` set respectively to `1.2.3.4`, `0.0.0.0, 1.2.3.4`, and `0.0.0.1, 1.2.3.4`
- **THEN** all three requests SHALL map to rate-limit buckets whose client identifier is `0.0.0.0`, `0.0.0.1`, and `1.2.3.4` respectively (i.e., the left-most entry is authoritative and no single original client gains multiple fresh buckets by prepending arbitrary prefixes)

#### Scenario: Missing XFF falls back to x-real-ip

- **WHEN** a request arrives without `x-forwarded-for` but with `x-real-ip: 5.6.7.8`
- **THEN** the client identifier component of the rate-limit key SHALL be `5.6.7.8`

#### Scenario: Missing both headers falls back to "unknown"

- **WHEN** a request arrives without `x-forwarded-for` and without `x-real-ip`
- **THEN** the client identifier component of the rate-limit key SHALL be the literal string `"unknown"`

### Requirement: Rate-limit composition order in middleware

The Next.js middleware SHALL evaluate the session cookie authentication gate for `/profile/:path*` before the rate-limit evaluation for `/api/:path*`. An unauthenticated `/profile/:path*` request SHALL be redirected without incrementing any rate-limit counter.

#### Scenario: Profile auth redirect does not consume rate-limit budget

- **WHEN** an unauthenticated request is made to `/profile/anything`
- **THEN** the middleware SHALL redirect to `/login?callbackURL=/profile/anything` and SHALL NOT increment any `/api/` rate-limit counter for the client

### Requirement: HTTP 429 response shape on limit exceed

When a request is rejected by the rate limiter, the middleware SHALL respond with HTTP 429, a JSON body of `{ "message": "Too many requests" }`, and SHALL NOT forward the request to the downstream handler. The `Content-Type` response header SHALL be `application/json`.

#### Scenario: 429 response body is shaped consistently

- **WHEN** the rate limiter rejects a request
- **THEN** the response SHALL have status `429`, `Content-Type: application/json`, and the response body SHALL equal `{"message":"Too many requests"}`

### Requirement: Bucket map is bounded

The in-memory bucket map used by the rate limiter SHALL be bounded by an upper-bound constant `BUCKET_MAP_CAP` of at least `10000` entries. Whenever a write to the bucket map would leave its size above the cap, the middleware SHALL evict entries whose expiry timestamp (`resetAt`) is less than or equal to the current time before proceeding. Eviction SHALL be opportunistic (triggered by writes, not by timers) so that no long-lived timer handles are required.

#### Scenario: Expired entries are evicted when cap is exceeded

- **WHEN** the bucket map contains `BUCKET_MAP_CAP + 1` entries and a new request is processed whose bucket would be inserted
- **THEN** entries whose `resetAt <= now` SHALL be removed from the map during processing of that request

#### Scenario: Below-cap operation skips eviction work

- **WHEN** the bucket map contains fewer than `BUCKET_MAP_CAP` entries and a new request is processed
- **THEN** the middleware SHALL NOT iterate the map for eviction purposes during that request

#### Scenario: No scheduled-timer eviction

- **WHEN** the middleware source `apps/blog/src/middleware.ts` is inspected
- **THEN** it SHALL NOT call `setInterval` or `setTimeout` for bucket eviction

### Requirement: Single-instance scope with documented follow-up

The rate limiter SHALL use in-memory state backed by a per-process data structure. The middleware source SHALL carry an inline comment `TODO(#497-followup)` identifying the follow-up work to replace the in-memory backing with a distributed store (e.g. Upstash Redis) before multi-instance deployment. Distributed-store backing is explicitly out of scope for this change.

#### Scenario: TODO marker is present in middleware source

- **WHEN** `apps/blog/src/middleware.ts` is scanned for the literal substring `TODO(#497-followup)`
- **THEN** at least one match SHALL be found

#### Scenario: No distributed rate-limit backend is introduced

- **WHEN** the project dependencies in `apps/blog/package.json` are inspected after this change lands
- **THEN** neither `@upstash/ratelimit` nor any other distributed-rate-limit package SHALL be present
