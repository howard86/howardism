## Why

The blog app's HTTP surface has five outstanding security-correctness defects (#540, #539, #525, #497, #496) that individually are small but compound into a meaningful attack surface: server-side request forgery against internal networks, unauthenticated access to `/profile/*`, information disclosure via error strings, absent rate limiting, and weak authentication defaults. They are cheap to fix in a bundle and dear to leave open.

## What Changes

- **#540** — Harden `/api/proxy` against SSRF: disable redirect-follow (`redirect: "manual"` + explicit re-validation with `MAX_REDIRECTS=3`), and pin the outbound connection to the pre-validated IP address using an `undici.Agent` custom `connect` hook, closing the DNS-rebinding TOCTOU window.
- **#539** — Restore route-level auth on `/profile/:path*`: add `apps/blog/src/middleware.ts` using `getSessionCookie` from `better-auth/cookies`, redirecting unauthenticated requests to `/login?callbackURL=<original>`.
- **#525** — Remove raw request body from error strings in `apps/blog/src/pages/api/subscription.ts` and `apps/blog/src/pages/api/sudoku.ts`. Error messages become static; response bodies never echo submitted input.
- **#497** — Add per-route rate limiting composed into the same `middleware.ts` (order: auth-gate → rate-limit → next). In-memory token bucket with per-route-family policies. **KNOWN LIMITATION** — in-memory state is not shared across serverless instances; this is a single-instance defense and must be replaced with a Redis-backed limiter (`@upstash/ratelimit` or equivalent) before deploying to multi-instance infrastructure. A follow-up issue will track the migration; a `// TODO(#497-followup)` comment marks the limiter.
- **#496** — Enforce authentication minimums in Better Auth: pass explicit `secret` and `baseURL`, set `emailAndPassword.minPasswordLength: 8`, set `emailAndPassword.requireEmailVerification: true`, and wire `emailVerification.sendVerificationEmail` to a new `sendTransactionalEmail` helper in `src/services/mail.ts` built on the existing SendGrid client. **No back-compat migration** for prior unverified accounts — confirmed no such accounts exist.

## Capabilities

### New Capabilities

- `api-proxy-security`: SSRF defenses for the `/api/proxy` route — private-IP blocklist, validated-IP connection pinning, bounded redirect handling, request timeout and body-size caps.
- `api-error-hygiene`: baseline requirement that API error responses and error messages never include raw request bodies or submitted field values.
- `api-rate-limiting`: per-route rate-limit policies applied by the Next.js middleware, with explicit single-instance-only scope until a distributed store is adopted.

### Modified Capabilities

- `better-auth-server`: adds requirements for (a) a Next.js middleware that guards `/profile/:path*` using `getSessionCookie`, (b) explicit `secret`/`baseURL` configuration, (c) password minimum length, (d) mandatory email verification, (e) outbound verification email delivery via the project's SendGrid client.

## Impact

- **Code**: `apps/blog/src/app/api/proxy/route.ts`, `apps/blog/src/app/api/proxy/isPrivateHost.ts`, `apps/blog/src/middleware.ts` (new), `apps/blog/src/lib/auth.ts`, `apps/blog/src/services/mail.ts` (new or extended), `apps/blog/src/pages/api/subscription.ts`, `apps/blog/src/pages/api/sudoku.ts`.
- **Dependencies**: none added (`undici` ships with Node ≥18; no Upstash this pass).
- **Environment**: no new env vars this pass. A future change will introduce `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` when the rate limiter is made distributed.
- **Tests**: new integration tests per fix, hitting real auth/proxy/mail components (no mocks) per project convention.
- **Issues auto-closed on merge**: `Fixes #540`, `Fixes #539`, `Fixes #525`, `Fixes #497`, `Fixes #496`.
