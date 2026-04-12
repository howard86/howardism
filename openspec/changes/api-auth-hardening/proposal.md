## Why

Four high-severity API authentication/authorization gaps have been reported across the monorepo, each issuing privileged backend capability on behalf of unverified callers: IDOR disclosure of order records (#498), recipe-create acceptance of unvalidated input with weak auth (#499), an open HTTPS relay proxy (#521), and a GraphQL relay that forwards arbitrary queries to GitHub using the server's access token (#523). They share a common failure mode — backend capability exposed without verifying *who* is calling or *what* they're asking for — and share a natural fix surface, so addressing them together lets us introduce one `requireSession()` primitive (consumed by #498 and #521) and one hardening pattern (input-validation Zod schemas, operation allowlists) applied consistently.

A prior security change (PR #503, closing #475/#474/#476/#481/#487/#488) partially addressed SSRF on the proxy route (protocol + string-based private-host check) but did not address the missing authentication requirement, which is the core of #521.

## What Changes

- **ADDED**: `requireSession()` helper in `apps/blog/src/lib/auth.ts` that throws / redirects on missing session, used by protected server components and Route Handlers. Existing ubike API callsite (from PR #503) refactored to consume it.
- **BREAKING (UX)**: All checkout-flow page surfaces in `apps/blog` require authentication — anonymous users are redirected to `/login` before reaching the form, success, cancelled, or details pages. The `/api/checkout` Route Handler does not exist in this codebase today (tracked as issue #480); the spec carries a forward-looking obligation that when #480 is implemented, that handler MUST require a session and bind `email` from `session.user.email`.
- **ADDED**: Ownership enforcement on `/tools/checkout/[orderId]` — only the session user whose email matches the order's `email` field may view an order. Non-owners see the same 404 path as missing orders (no enumeration oracle).
- **ADDED**: Zod input validation schemas + log-scrubbing on the recipe app's `/api/auth/login` and `/api/recipe/create` endpoints. Bearer-token format check replaces the `length < 8` heuristic. `console.*` calls no longer reference `req.body` or `req.headers`.
- **ADDED**: Authentication + DNS-resolved-IP SSRF check + fetch timeout + response-size cap on `apps/blog/src/app/api/proxy/route.ts`. Keeps the PR #503 protocol and string-based private-host checks; adds `dns.resolve4/6` guard after them.
- **ADDED**: GraphQL operation allowlist + mutation/subscription block + depth limit on `apps/github-search/src/pages/api/graphql.ts`. Only known query operations are forwarded to GitHub.

## Capabilities

### New Capabilities

- `auth-utilities` — Shared `requireSession()` helper for server-side session enforcement in blog app
- `checkout-flow` — End-to-end authenticated checkout flow with ownership-enforced order details
- `proxy-api` — Authenticated, SSRF-hardened, bounded HTTPS relay
- `recipe-api` — Validated, log-scrubbed recipe creation and login endpoints
- `github-search-graphql-relay` — Allowlisted, depth-bounded GraphQL relay to GitHub

### Modified Capabilities

_(none — no existing specs for these surfaces)_

## Impact

- **Code**: ~6 files modified across 3 apps (`apps/blog`, `apps/recipe`, `apps/github-search`), 1 new helper file, optional 1-2 new schema/constant files.
- **Packages**: Add `zod` in apps that don't already have it (blog already does via `@t3-oss/env-nextjs`). No new dep in `apps/github-search` — depth check is a 20-line AST walk over the already-parsed `DocumentNode`, avoiding a dependency on `graphql-depth-limit` and a 4.4MB schema load in the serverless handler.
- **Behaviour breaks**:
  - `/tools/checkout/*` flow requires login — anonymous users redirected to `/login`
  - `/api/proxy` unauthenticated callers receive 401 (previously 200/400)
  - Recipe API rejects malformed bodies with 400 (previously 500 / inconsistent)
  - GraphQL relay rejects unknown operations, mutations, and deep queries with 400 (previously forwarded all)
- **Commits**: Each task produces a single commit with `Closes #NNN` in the body for auto-close on merge to `master`.
- **Explicitly out of scope** (separate future changes): rate limiting (#497-adjacent), IP-pinned undici dispatcher for residual DNS-rebinding TOCTOU, guest-receipt signed URLs, JWT signature verification against CMS, github-search user authentication.
