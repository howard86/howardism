## Context

The blog app exposes five API-surface defects that are each individually small but compound into a meaningful attack surface: an SSRF that remains bypassable via HTTP redirects and DNS rebinding (#540), unauthenticated access to `/profile/*` (#539), information disclosure through error strings (#525), absence of rate limiting (#497), and weak authentication defaults in Better Auth (#496). The Better Auth migration (PR #537, commit `23d882d`) partially mitigated #540 (added the `requireSessionForRoute` gate, `AbortController` timeout, `MAX_BODY_BYTES` streaming, and a DNS resolve-and-check helper) but left the redirect-follow and TOCTOU paths unclosed. It also deleted the pre-migration `proxy.ts` auth middleware without replacement — that is the direct cause of #539.

Stakeholders: the single developer/owner of the blog app. Deployment target: single Next.js instance (Vercel-compatible but not yet scaled horizontally). Existing conventions enforced: gitmoji commits, `Fixes #N` trailer per issue, Bun tooling, TDD with no mocks in integration tests, PR base `main`.

## Goals / Non-Goals

**Goals:**
- Close #540 at the root: manual redirect handling plus IP-pinned outbound connection, so the hostname validated at `resolveAndCheckPrivateIP` is the exact address the TCP connection opens against.
- Close #539 with a framework-level guard on `/profile/:path*` so newly added profile routes are protected by default.
- Close #525 by eliminating `JSON.stringify(req.body)` and any equivalent interpolation from every error path, in both thrown exceptions and logged messages.
- Close #497 with a per-route-family limiter composed into the Next.js middleware introduced for #539, accepting the single-instance limitation explicitly.
- Close #496 by passing `secret`/`baseURL` explicitly to `betterAuth(...)`, enforcing `minPasswordLength: 8` and `requireEmailVerification: true`, and wiring Better Auth's `emailVerification.sendVerificationEmail` hook to a new `sendTransactionalEmail` helper in `@/services/mail` backed by the existing SendGrid client.
- Every commit carries a `Fixes #N` trailer so GitHub auto-closes each issue on merge.

**Non-Goals:**
- Distributed rate-limit store (Upstash/Redis or equivalent). Captured as a follow-up for when the app moves off single-instance hosting; marked inline with `// TODO(#497-followup)`.
- Back-compat migration for Better Auth email/password users with `emailVerified: false`. Confirmed no such accounts exist; flipping `requireEmailVerification: true` without a grandfather migration is acceptable.
- Refactoring API endpoints outside the scope of the five issues.
- Broadening the auth middleware matcher beyond `/profile/:path*`. Other routes keep their per-route session checks.
- Further Better Auth plugin adoption beyond what #539 and #496 require.
- Deprecating or rewriting the existing `resolveAndCheckPrivateIP` helper; it stays and is called per hop.

## Decisions

### #540 — SSRF hardening: manual redirects + IP pinning

**Decision:** Set `redirect: "manual"` on the outbound `fetch`, handle up to `MAX_REDIRECTS=3` hops by re-running `resolveAndCheckPrivateIP` on each hop's `Location`, and open the TCP connection through an `undici.Agent` whose custom `connect` hook opens the socket against the pre-validated IP while preserving the original hostname for SNI and the `Host` header.

**Rationale:** `resolveAndCheckPrivateIP` followed by `fetch(url)` performs two DNS lookups; a rebind server can return a public address on lookup 1 and `127.0.0.1` on lookup 2. Pinning the connection to the validated IP collapses the two lookups into one, eliminating the TOCTOU window at the root. Manual redirect handling closes the hop-1-validation-only bypass. `undici` ships with Node — no new runtime dependency.

**Alternatives rejected:** (a) Manual redirects only without IP pinning — leaves a known-exploitable TOCTOU window open, violates "root-cause only". (b) Status quo with a comment — not a fix. (c) Replacing `fetch` with an `axios` client — larger blast radius for no security benefit `undici` doesn't already provide.

### #539 — `/profile/:path*` auth guard

**Decision:** Create `apps/blog/src/middleware.ts` (Next 14 naming — not `proxy.ts`, which is Next 16) using `getSessionCookie` from `better-auth/cookies` with `matcher: ['/profile/:path*']`. Unauthenticated requests redirect to `/login?callbackURL=<original>`.

**Rationale:** Restores the pre-migration behaviour removed in commit `6695977`. `getSessionCookie` is a cookie-presence check — no DB round-trip — so it stays cheap on the hot path; per-page `auth.api.getSession` calls that remain handle freshness. Protects routes added in the future by default.

**Alternatives rejected:** (a) `(blog)/profile/layout.tsx` server component with `auth.api.getSession` — pays a DB query per navigation and doesn't cover non-`/profile` routes a future author might add. (b) Per-page session checks at the two offending pages — band-aid; drift returns with every new route.

### #525 — static error strings

**Decision:** At `apps/blog/src/pages/api/subscription.ts:16` and `apps/blog/src/pages/api/sudoku.ts:81` (and the related `error.message` returns at `sudoku.ts:65/94`), replace interpolated strings containing `JSON.stringify(req.body)` with static messages that name the field expectation only.

**Rationale:** Two call sites, bounded scope. The sudoku handler returns `error.message` directly into the HTTP response body at line 65/94, making the leak externally observable — not just a logging issue.

**Alternatives rejected:** (a) A `SafeError` class plus a route-handler error mapper — overkill for two sites; justified only if more leaking endpoints are discovered. (b) A log-formatter filter that scrubs bodies — doesn't fix the root cause (callers still compose leaky strings) and the sudoku endpoint's leak is in the response body, not the log.

### #497 — in-memory per-route rate limiter composed into the #539 middleware

**Decision:** Extend the `middleware.ts` created for #539 with an in-memory token-bucket limiter, ordered after the auth gate (auth → rate-limit → next). Per-route-family policies declared in a `routePolicy` map keyed by path prefix:

| Prefix | Window | Max |
|---|---|---|
| `/api/auth` | 60 s | 10 |
| `/api/sudoku` | 60 s | 20 |
| `/api/subscription` | 60 s | 5 |
| `/api/proxy` | 60 s | 10 |
| `/api/` (fallback) | 60 s | 60 |

**Rationale:** Composing into the same middleware avoids two files with overlapping matchers and keeps ordering explicit. In-memory is honest about its scope — single Node process only — and carries an explicit `// TODO(#497-followup): replace with Redis/Upstash when moving off single-instance — per-instance limits only` comment. Moving to Upstash is deferred to a later change rather than imported prematurely.

**Alternatives rejected:** (a) `@upstash/ratelimit` now — adds a dependency and two env vars; orchestrator decision was to defer. (b) Vercel WAF only — platform-locked, not visible in repo. (c) Better Auth's built-in `rateLimit` for auth routes only — partial coverage; non-auth routes still vulnerable.

### #496 — Better Auth hardening

**Decision:** In `apps/blog/src/lib/auth.ts`, pass `secret: env.BETTER_AUTH_SECRET` and `baseURL: env.BETTER_AUTH_URL` explicitly to `betterAuth(...)`. Set `emailAndPassword: { enabled: true, minPasswordLength: 8, requireEmailVerification: true }`. Configure `emailVerification.sendVerificationEmail` to call a new `sendTransactionalEmail(to, subject, html)` helper in `apps/blog/src/services/mail.ts` that reuses the SendGrid client already backing `subscribeToNewsletter`.

**Rationale:** Closes the three concrete gaps called out in #496 (implicit env discovery, no password policy, no email verification) and does so via Better Auth's first-class options. The mail helper is introduced rather than inlined so the subscription path and the auth-verification path share one SendGrid code path.

**Alternatives rejected:** (a) Disabling `emailAndPassword` entirely (OAuth-only) — drastic; the issue requests hardening, not removal. (b) Adding `zxcvbn`-based strength checks — scope creep; `minPasswordLength` is the documented Better Auth option. (c) Leaving `secret`/`baseURL` on implicit env discovery — creates a divergence window if the deploy environment switches to a secrets manager that bypasses `process.env`.

## Risks / Trade-offs

- **In-memory rate limit is per-instance.** → Explicit non-goal, `// TODO(#497-followup)` comment, follow-up issue tracked. Effective limit on an N-instance deployment is `N × configured limit`; acceptable at the current single-instance deployment and loudly documented.
- **`undici.Agent` + SNI / `Host` header preservation is easy to get wrong.** → Regression test explicitly covers an HTTPS target reached by IP: SNI must match the original hostname, `Host` header must match the original hostname, or TLS will fail. A dedicated test case for HTTPS-via-pinned-IP is required before the fix lands.
- **`requireEmailVerification: true` rejects any account with `user.emailVerified: false`.** → Confirmed none exist. If this assumption is wrong in production, the failure mode is "email/password users cannot sign in until they verify" — not data loss.
- **SendGrid delivery for verification email shares quota with newsletter.** → Reuses existing client; no new env vars; SendGrid free tier quota is a known operational constraint captured elsewhere.
- **Manual redirect handling slightly inflates latency on legitimate proxied URLs that redirect.** → Capped at `MAX_REDIRECTS=3` hops plus the existing 5 s per-hop timeout. Acceptable for the proxy route's use case.
- **Single `middleware.ts` compounds responsibilities (auth gate + rate limit).** → Ordering is explicit (auth first, rate-limit second), each concern documented in its own spec capability; a future extraction into composed helpers is a non-goal now.

## Migration Plan

Single branch `security/api-hardening` off `main`. One commit per issue, each carrying a `Fixes #<N>` trailer so GitHub auto-closes on merge. Commit order (smallest blast radius first; middleware file created before it's extended):

1. `:lock: fix(blog): remove raw request body from API error messages` — **`Fixes #525`**.
2. `:lock: fix(blog): pin proxy fetch to validated IP and disable redirect-follow` — **`Fixes #540`**.
3. `:lock: fix(blog): restore /profile/:path* auth guard via Better Auth middleware` — **`Fixes #539`** (creates `apps/blog/src/middleware.ts`).
4. `:lock: feat(blog): add per-route rate limiting to middleware` — **`Fixes #497`** (extends the middleware from step 3).
5. `:lock: fix(blog): enforce password policy and email verification in Better Auth` — **`Fixes #496`**.

Final PR body lists all five `Fixes #N` trailers. PR base is `main`, not `master` (howardism convention). Rollback strategy: each commit is isolated and revertable; reverting the middleware commits removes the guard / limiter cleanly without affecting other routes.
