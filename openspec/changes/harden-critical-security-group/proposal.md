## Why

The `apps/blog` app has one severity:critical and three severity:high open issues (#591, #587, #592, #554) that together weaken identity integrity, write-atomicity, auth-guard coverage, and API rate-limiter resilience. #591 lets any authenticated user overwrite another applicant's canonical email through a body-supplied value. #587 leaves the database in inconsistent state on partial resume write failures. #592 relies solely on a middleware cookie-presence check for a create page that mutates resume data. #554 allows trivial rate-limit bypass via `x-forwarded-for` prefixing, serves a non-standard 429 body, and lets the in-memory bucket map grow unbounded. Fixing them one at a time would produce four separate changes touching overlapping surfaces; this change addresses all four as a coherent security/integrity hardening pass.

## What Changes

- **BREAKING:** `POST /api/resume` and `PUT /api/resume` reject requests whose body contains a non-empty `email` field with HTTP 400. Applicant `email` is always written from the authenticated session (#591).
- `POST /api/resume` and `PUT /api/resume` execute applicant upsert + profile create/update + nested child operations inside a single `prisma.$transaction`; any failure rolls back the whole write (#587).
- `app/(blog)/profile/resume/add/page.tsx` resolves the session server-side via `requireSessionForPage()` and redirects unauthenticated users to `/login?callbackURL=/profile/resume/add`. Spec requires every `/profile/resume/*` route-group page to do the same (#592).
- `apps/blog/src/middleware.ts` rate limiter:
  - Uses only the left-most `x-forwarded-for` entry (trimmed) as the client key (#554 defect 1).
  - Returns 429 with body `{"message":"Too many requests"}` (#554 defect 2).
  - Bounds the in-memory `buckets` Map via opportunistic eviction of expired entries when size exceeds a cap (#554 defect 3).
- Out of scope: #573 (per-instance rate limiter) — deferred until a shared-store backend is approved. `TODO(#497-followup)` marker stays in place.

## Capabilities

### New Capabilities
- `resume-api`: REST contract for resume read/write endpoints — identity pinning, atomic persistence, payload validation.
- `resume-page-auth`: server-side session-validation contract for all `/profile/resume/*` pages.
- `api-rate-limiting`: request-rate-limiting contract for `apps/blog` middleware — key derivation, response shape, bucket lifecycle.

### Modified Capabilities
(none — all three capabilities are net-new to `openspec/specs/`)

## Impact

- **Code:**
  - `apps/blog/src/app/api/resume/route.ts` — request validation, transactional write, session-pinned applicant email.
  - `apps/blog/src/app/(blog)/profile/resume/add/page.tsx` — server-side guard.
  - `apps/blog/src/middleware.ts` — XFF parsing, 429 body, bucket eviction.
  - Existing rate-limiter unit test updated to assert spec-correct 429 body + XFF-prefix bypass + bucket cap.
- **API contract:** resume POST/PUT body shape — `email` is no longer accepted. Callers sending it will now receive HTTP 400.
- **Dependencies:** none added.
- **Specs:** supersedes the `api-rate-limiting` spec in pending change `api-security-hardening` (Q4 decision: absorb). That pending change must be rebased to drop its `api-rate-limiting` delta before merging.
- **Known gap preserved:** #573 multi-instance counter leak — `TODO(#497-followup)` marker remains in `middleware.ts`.
