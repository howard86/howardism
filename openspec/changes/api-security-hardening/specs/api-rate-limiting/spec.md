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

The client identifier SHALL be derived from the first entry in the `x-forwarded-for` request header, falling back to a literal `"unknown"` when absent.

#### Scenario: Auth brute-force is throttled

- **WHEN** eleven requests are sent to `POST /api/auth/sign-in/email` from the same `x-forwarded-for` within sixty seconds
- **THEN** the eleventh response SHALL carry HTTP 429 and the request SHALL NOT reach the Better Auth handler

#### Scenario: Sudoku flood is throttled

- **WHEN** twenty-one requests are sent to `GET /api/sudoku?difficulty=expert` from the same `x-forwarded-for` within sixty seconds
- **THEN** the twenty-first response SHALL carry HTTP 429 and the sudoku handler SHALL NOT be invoked

#### Scenario: Fallback policy applies to routes without a specific prefix

- **WHEN** sixty-one requests are sent to an `/api/` route that has no explicit policy entry from the same `x-forwarded-for` within sixty seconds
- **THEN** the sixty-first response SHALL carry HTTP 429

### Requirement: Rate-limit composition order in middleware

The Next.js middleware SHALL evaluate the session cookie authentication gate for `/profile/:path*` before the rate-limit evaluation for `/api/:path*`. An unauthenticated `/profile/:path*` request SHALL be redirected without incrementing any rate-limit counter.

#### Scenario: Profile auth redirect does not consume rate-limit budget

- **WHEN** an unauthenticated request is made to `/profile/anything`
- **THEN** the middleware SHALL redirect to `/login?callbackURL=/profile/anything` and SHALL NOT increment any `/api/` rate-limit counter for the client

### Requirement: HTTP 429 response shape on limit exceed

When a request is rejected by the rate limiter, the middleware SHALL respond with HTTP 429, a JSON body of `{ "message": "Too many requests" }`, and SHALL NOT forward the request to the downstream handler.

#### Scenario: 429 response body is shaped consistently

- **WHEN** the rate limiter rejects a request
- **THEN** the response SHALL have status `429` and the response body SHALL equal `{"message":"Too many requests"}`

### Requirement: Single-instance scope with documented follow-up

The rate limiter SHALL use in-memory state backed by a per-process data structure. The middleware source SHALL carry an inline comment `TODO(#497-followup)` identifying the follow-up work to replace the in-memory backing with a distributed store (e.g. Upstash Redis) before multi-instance deployment. Distributed-store backing is explicitly out of scope for this change.

#### Scenario: TODO marker is present in middleware source

- **WHEN** `apps/blog/src/middleware.ts` is scanned for the literal substring `TODO(#497-followup)`
- **THEN** at least one match SHALL be found

#### Scenario: No distributed rate-limit backend is introduced

- **WHEN** the project dependencies in `apps/blog/package.json` are inspected after this change lands
- **THEN** neither `@upstash/ratelimit` nor any other distributed-rate-limit package SHALL be present
