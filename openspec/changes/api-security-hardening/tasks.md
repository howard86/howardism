## 0. Setup

- [ ] 0.1 Create worktree at `.claude/worktrees/api-security-hardening` with branch `security/api-hardening` off `main`
- [ ] 0.2 Verify `openspec validate api-security-hardening` is green inside the worktree
- [ ] 0.3 Verify `bun install` completes cleanly inside the worktree

## 1. Fix #525 — static error strings (response-body and log hygiene)

- [ ] 1.1 Add failing regression test at `apps/blog/src/pages/api/__tests__/subscription.test.ts` asserting POST to `/api/subscription` with `{ email: 42, secret: "leak-me-525" }` returns a 400 whose response body does not contain `leak-me-525` and does not contain the literal substring `req.body` (specs/api-error-hygiene/spec.md: "API error responses MUST NOT contain raw request body contents")
- [ ] 1.2 Add failing regression test at `apps/blog/src/pages/api/__tests__/sudoku.test.ts` asserting POST to `/api/sudoku` with an invalid body containing `{ canary: "leak-me-525-sudoku" }` returns a response whose body does not contain `leak-me-525-sudoku` and whose error `message` does not echo any submitted key (specs/api-error-hygiene/spec.md: "API error responses MUST NOT contain raw request body contents")
- [ ] 1.3 Edit `apps/blog/src/pages/api/subscription.ts:16`: replace the interpolated error with a static string (e.g. `"Invalid email in request body"`). Do not include `JSON.stringify(req.body)` anywhere in this file (specs/api-error-hygiene/spec.md: "Error log messages SHALL NOT interpolate req.body")
- [ ] 1.4 Edit `apps/blog/src/pages/api/sudoku.ts`: replace the `Invalid input with ${JSON.stringify(req.body)}` string at line 81 with a static message, and at lines 65/94 return a static `message` field instead of `error.message` so raw input cannot reach the response body (specs/api-error-hygiene/spec.md: "API error responses MUST NOT contain raw request body contents")
- [ ] 1.5 Grep-confirm zero hits for `JSON.stringify(req.body)` anywhere under `apps/blog/src/pages/api/` and `apps/blog/src/app/api/`
- [ ] 1.6 Run `bun test apps/blog/src/pages/api/__tests__/subscription.test.ts apps/blog/src/pages/api/__tests__/sudoku.test.ts` and confirm both green
- [ ] 1.7 Commit: `:lock: fix(blog): remove raw request body from API error messages` with body containing `Fixes #525`

## 2. Fix #540 — SSRF root-cause: IP pinning + manual redirect

- [ ] 2.1 Add failing integration test at `apps/blog/src/app/api/proxy/__tests__/route.test.ts` covering: (a) public URL returns 200 body; (b) target returning 302 to `http://127.0.0.1/...` is rejected before the second fetch (no loopback hit); (c) redirect chain exceeding `MAX_REDIRECTS=3` is rejected; (d) DNS returning a private IP on hop 1 is rejected; (e) DNS-rebind simulation: mock `dns/promises` to return a public IP on call 1 and `10.0.0.1` on call 2, assert outbound socket targets the validated public IP (not the rebind); (f) target slower than `FETCH_TIMEOUT_MS` returns 504; (g) response body larger than `MAX_BODY_BYTES` is truncated/rejected. No mocking of the proxy route itself — hit a real local HTTP server (specs/api-proxy-security/spec.md: "IP-pinned outbound connection", "bounded redirect handling")
- [ ] 2.2 Edit `apps/blog/src/app/api/proxy/isPrivateHost.ts` if needed to expose a helper returning the resolved `{ ip, family }` tuple (so the caller can pin the connection to that IP) (specs/api-proxy-security/spec.md: "DNS validation before connect")
- [ ] 2.3 Edit `apps/blog/src/app/api/proxy/route.ts`: construct an `undici.Agent` with a custom `connect` hook that opens the TCP socket against the pre-validated IP while preserving the original hostname for SNI and the `Host` header; pass `{ dispatcher: agent, redirect: "manual", signal: controller.signal }` to `fetch` (specs/api-proxy-security/spec.md: "IP-pinned outbound connection")
- [ ] 2.4 Implement the manual redirect loop in `route.ts`: on a 3xx response with a `Location` header, parse the next URL, re-run `resolveAndCheckPrivateIP`, rebuild the pinned agent against the new validated IP, re-issue the request; cap at `MAX_REDIRECTS=3` hops, reject beyond (specs/api-proxy-security/spec.md: "bounded redirect handling")
- [ ] 2.5 Verify `FETCH_TIMEOUT_MS` / `MAX_BODY_BYTES` invariants from the prior hardening are preserved across the redirect loop (each hop is bounded individually)
- [ ] 2.6 Run `bun test apps/blog/src/app/api/proxy/__tests__/route.test.ts` and confirm all cases green
- [ ] 2.7 Commit: `:lock: fix(blog): pin proxy fetch to validated IP and disable redirect-follow` with body containing `Fixes #540`

## 3. Fix #539 — restore `/profile/:path*` auth guard

- [ ] 3.1 Add failing integration test at `apps/blog/src/__tests__/middleware.test.ts` asserting: (a) unauthenticated request to `/profile` → 307/302 redirect to `/login?callbackURL=%2Fprofile`; (b) unauthenticated request to `/profile/resume/add` → redirect to `/login?callbackURL=%2Fprofile%2Fresume%2Fadd`; (c) request with a valid Better Auth session cookie passes through. No mocking of Better Auth — use the real module (specs/better-auth-server/spec.md: "route middleware guard on /profile/:path*")
- [ ] 3.2 Create `apps/blog/src/middleware.ts` that imports `getSessionCookie` from `better-auth/cookies`, checks request on matched paths, and 307-redirects to `/login?callbackURL=<encoded-original-path>` when no session cookie is present (specs/better-auth-server/spec.md: "route middleware guard on /profile/:path*")
- [ ] 3.3 Export `config = { matcher: ['/profile/:path*'] }` from the middleware file (specs/better-auth-server/spec.md: "route middleware guard on /profile/:path*")
- [ ] 3.4 Run `bun test apps/blog/src/__tests__/middleware.test.ts` and confirm green
- [ ] 3.5 Commit: `:lock: fix(blog): restore /profile/:path* auth guard via Better Auth middleware` with body containing `Fixes #539`

## 4. Fix #497 — per-route in-memory rate limiting (extends #539 middleware)

- [ ] 4.1 Add failing integration test at `apps/blog/src/__tests__/middleware.rate-limit.test.ts` asserting: (a) 6th request within 60s to `/api/subscription` from the same client identifier returns 429; (b) 11th request within 60s to `/api/auth/sign-in/email` returns 429; (c) 61st request within 60s to `/api/sudoku` returns 429; (d) 429 responses carry a `Retry-After` header; (e) unmatched API routes fall back to the `/api/` limit of 60/60s (specs/api-rate-limiting/spec.md: "per-route-family limits", "HTTP 429 on exceed")
- [ ] 4.2 Add test case asserting auth gate runs before rate limit: an unauthenticated request to `/profile/anything` hits the 307 redirect *without* consuming a rate-limit slot (specs/api-rate-limiting/spec.md: "composition order after auth gate")
- [ ] 4.3 Extend `apps/blog/src/middleware.ts` with an in-memory token-bucket limiter. Declare `routePolicy` map keyed by path prefix: `/api/auth`=10/60s, `/api/sudoku`=20/60s, `/api/subscription`=5/60s, `/api/proxy`=10/60s, `/api/`=60/60s fallback (specs/api-rate-limiting/spec.md: "per-route-family limits")
- [ ] 4.4 Compose the limiter *after* the auth redirect and *before* `NextResponse.next()` so unauthenticated profile traffic does not consume rate-limit capacity (specs/api-rate-limiting/spec.md: "composition order after auth gate")
- [ ] 4.5 On exceed, return `NextResponse` with status 429, header `Retry-After: <seconds>`, and a plain JSON body `{ error: "rate_limited" }` (specs/api-rate-limiting/spec.md: "HTTP 429 on exceed")
- [ ] 4.6 Add the comment `// TODO(#497-followup): replace with Redis/Upstash when moving off single-instance — per-instance limits only` immediately above the `routePolicy` declaration (specs/api-rate-limiting/spec.md: "single-instance scope")
- [ ] 4.7 Extend the middleware `matcher` to also cover `/api/:path*` so the limiter runs on API requests (kept distinct from the profile-only matcher via the internal routing logic)
- [ ] 4.8 Run `bun test apps/blog/src/__tests__/middleware.rate-limit.test.ts` and confirm green; re-run the #539 middleware test and confirm still green
- [ ] 4.9 Commit: `:lock: feat(blog): add per-route rate limiting to middleware` with body containing `Fixes #497`

## 5. Fix #496 — Better Auth password policy + email verification

- [ ] 5.1 Add failing unit test at `apps/blog/src/lib/__tests__/auth.test.ts` asserting the exported `auth` config has `emailAndPassword.minPasswordLength === 8`, `emailAndPassword.requireEmailVerification === true`, and that `betterAuth` was called with an explicit `secret` and `baseURL` (not relying on implicit env discovery) (specs/better-auth-server/spec.md: "minPasswordLength", "requireEmailVerification", MODIFIED "Environment variable configuration")
- [ ] 5.2 Add failing integration test at `apps/blog/src/lib/__tests__/email-verification.test.ts` asserting a new-user registration triggers `sendTransactionalEmail` once with a subject containing "Verify" and an HTML body containing the verification URL; use a SendGrid sandbox key (no real delivery) (specs/better-auth-server/spec.md: "SendGrid-backed verification delivery")
- [ ] 5.3 Create `apps/blog/src/services/mail.ts` exporting `sendTransactionalEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<void>` built on the existing SendGrid client used by `subscribeToNewsletter`; reuse the same env-var configuration (specs/better-auth-server/spec.md: "SendGrid-backed verification delivery")
- [ ] 5.4 Refactor `subscribeToNewsletter` (or its caller in `apps/blog/src/pages/api/subscription.ts`) to call `sendTransactionalEmail` instead of duplicating SendGrid wiring, preserving exact existing behaviour (specs/better-auth-server/spec.md: "SendGrid-backed verification delivery")
- [ ] 5.5 Edit `apps/blog/src/lib/auth.ts`: pass `secret: env.BETTER_AUTH_SECRET`, `baseURL: env.BETTER_AUTH_URL`, and `emailAndPassword: { enabled: true, minPasswordLength: 8, requireEmailVerification: true }` to `betterAuth(...)` (specs/better-auth-server/spec.md: MODIFIED "Environment variable configuration", ADDED "minPasswordLength", "requireEmailVerification")
- [ ] 5.6 Edit `apps/blog/src/lib/auth.ts`: configure `emailVerification: { sendVerificationEmail: async ({ user, url }) => sendTransactionalEmail({ to: user.email, subject: "Verify your email", html: \`<p>Verify your email: <a href=\"${url}\">${url}</a></p>\` }) }` (specs/better-auth-server/spec.md: "SendGrid-backed verification delivery")
- [ ] 5.7 Run `bun test apps/blog/src/lib/__tests__/auth.test.ts apps/blog/src/lib/__tests__/email-verification.test.ts` and confirm green
- [ ] 5.8 Commit: `:lock: fix(blog): enforce password policy and email verification in Better Auth` with body containing `Fixes #496`

## 6. Cross-cutting verification

- [ ] 6.1 Run `bun run type-check` at repo root — confirm zero type errors
- [ ] 6.2 Run `bun run lint` at repo root — confirm clean
- [ ] 6.3 Run `bun run test` at repo root — confirm full suite green (including pre-existing tests untouched by this change)
- [ ] 6.4 Run `openspec validate api-security-hardening` — confirm still green
- [ ] 6.5 Run `openspec diff api-security-hardening` — sanity-check the delta preview

## 7. PR submission

- [ ] 7.1 Push branch `security/api-hardening` to origin
- [ ] 7.2 Create PR with `gh pr create --base main --title ":lock: Security hardening: API error hygiene, SSRF, auth guard, rate limit, Better Auth policy" --body "<body>"` where `<body>` contains a summary section plus trailer lines `Fixes #540`, `Fixes #539`, `Fixes #525`, `Fixes #497`, `Fixes #496`
- [ ] 7.3 Verify on the PR page that all five referenced issues appear in the "Linked issues" sidebar (GitHub's auto-link parser)
