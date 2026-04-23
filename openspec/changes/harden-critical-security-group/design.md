## Context

`apps/blog` is a Next.js 14 app using Prisma/PostgreSQL, Better Auth, and a bespoke per-process rate limiter in `middleware.ts`. Four open issues expose integrity and auth-guard gaps across three subsystems: resume API (`/api/resume`), resume pages (`/profile/resume/*`), and middleware rate limiting. A prior pending change, `api-security-hardening`, introduced the initial `api-rate-limiting` spec but has not archived; the blog rate-limiter implementation has drifted from that still-unmerged spec.

Relevant repo state:
- `apps/blog/src/app/api/resume/route.ts` — current resume POST/PUT handlers accept `email` in the body and write it directly to `ResumeApplicant`. Upsert + profile write are two unordered Prisma calls outside any transaction.
- `apps/blog/src/app/(blog)/profile/resume/add/page.tsx` — currently a Client Component that renders `ResumeEditor` with no server-side session check. Sibling `edit` and `clone` pages call `getResumeById()` which enforces session.
- `apps/blog/src/middleware.ts` — reads full `x-forwarded-for` verbatim, returns a plain `"Too many requests"` text response, stores buckets in an unbounded `Map<string, BucketState>`.
- `apps/blog/src/server/session.ts` — already exports `requireSessionForPage(callbackUrl)` used by sibling pages.

Stakeholders: Howard (repo owner), automated CI (ultracite, bun test, type-check, commitlint).

## Goals / Non-Goals

**Goals:**
- Eliminate the identity-spoof vector on resume applicant rows (#591).
- Make resume persistence all-or-nothing at the DB level (#587).
- Move auth enforcement on `/profile/resume/add` from cookie presence to server-side session validation, and codify the requirement for all `/profile/resume/*` pages (#592).
- Close three rate-limiter defects (XFF parsing, 429 body, bucket growth) against `middleware.ts` (#554).
- Supersede the pending `api-security-hardening` `api-rate-limiting` spec with the canonical version produced here.

**Non-Goals:**
- Replacing the in-memory bucket store with a distributed backend (#573 deferred; `TODO(#497-followup)` marker preserved).
- Restructuring Better Auth configuration or session lifecycle.
- Refactoring the resume profile schema, child-entity shape, or editor.
- Changing any non-blog app.

## Decisions

### Decision 1: Reject body `email` with HTTP 400 rather than silently dropping it (#591)
Chose explicit rejection over permissive silent drop so that any caller still sending `email` is surfaced immediately at the contract boundary rather than quietly canonicalizing.

**Alternatives considered:**
- Silently drop body `email` and write session email — less disruptive, but hides client bugs.
- Route body `email` to a separate per-profile contact field — introduces new column and product decision not needed for the security fix.

**Implementation:** tighten the POST/PUT Zod schema to `email: z.never().optional()` (or equivalent refinement) and reject at validation time. Applicant row always uses `authResult.session.user.email`.

### Decision 2: Wrap POST/PUT in `prisma.$transaction` with explicit timeout bump (#587)
Use Prisma's interactive transaction API. Nested child operations (`deleteMany` + `create` cascades for experiences/projects/educations/skills/languages) all run inside the same tx handle.

**Rationale:** matches the pattern already used by `apps/blog/src/app/api/checkout/route.ts`. Avoids introducing a new abstraction.

**Trade-off:** interactive tx holds a DB connection for the duration of the HTTP request. Default Prisma timeout is 5s; large resume payloads with many nested children could exceed that. Bump `timeout` to 15s and `maxWait` to 5s explicitly for this route.

**Alternative:** decompose into a single Prisma `upsert` with nested writes. Rejected because the current code uses `deleteMany` + `create` for list-replace semantics, which a single `upsert` cannot express cleanly.

### Decision 3: Server Component + `requireSessionForPage()` for `/profile/resume/add` (#592)
Convert the `add` page to an async Server Component that calls `requireSessionForPage("/profile/resume/add")` before rendering `ResumeEditor`. Mirror the pattern used by `edit` and `clone` pages.

**Rationale:** `ResumeEditor` is already a Client Component; the parent becomes a thin async wrapper. No change to the editor's props or state.

**Alternative:** add a new layout.tsx guard. Rejected because layouts are harder to verify per-page and some resume subpaths may legitimately render without a session in the future.

### Decision 4: XFF parsing — trim left-most entry only, fall back to `x-real-ip` then `"unknown"` (#554 defect 1)
Split the `x-forwarded-for` value on `,`, take index 0, trim surrounding whitespace, use that as the client component of the bucket key.

**Trade-off:** XFF-first-entry is still spoofable if the app is reached without a trusted front proxy. Assumed deployment topology (Vercel) overwrites XFF with the real client IP. Spec notes this trust assumption in a requirement comment.

### Decision 5: 429 body shape — `{"message":"Too many requests"}` via `NextResponse.json()` (#554 defect 2)
Codified in spec (already present in pending `api-security-hardening/specs/api-rate-limiting/spec.md`). Implementation drift, not spec drift.

### Decision 6: Bucket eviction — opportunistic, on-write, when size exceeds cap (#554 defect 3)
Add a soft cap (`BUCKET_MAP_CAP = 10_000`). On each `consume()` call, if `buckets.size > cap`, iterate once over entries and delete any whose `resetAt <= now`. This is O(n) in the worst case but only runs when the cap is breached.

**Alternatives considered:**
- LRU via doubly-linked list — more complex, unnecessary for expected traffic.
- Scheduled sweep via `setInterval` — global state in middleware is risky under Next.js edge runtime; opportunistic on-write avoids timer lifecycle issues.
- WeakMap — keys are strings, so WeakMap won't help; also we need iteration.

### Decision 7: Absorb `api-rate-limiting` spec (Q4=absorb)
Copy the `api-rate-limiting` spec content from pending `api-security-hardening` into this change, add the new bucket-eviction requirement, and treat the pending change as no longer owning rate-limiting. Downstream: `api-security-hardening` must be rebased to drop its `specs/api-rate-limiting/` folder before it can merge after this change archives.

## Risks / Trade-offs

- **Resume POST/PUT breakage:** rejecting body `email` is a contract break. → Mitigation: coordinate with any client that still sends it (CLI, frontend ResumeEditor). Grep for resume POST/PUT callers before finalizing; update client if needed.
- **Prisma tx timeout:** large resumes could time out. → Mitigation: explicit `timeout: 15_000` + monitor after deploy. Regression test uses a realistically-sized payload.
- **XFF trust assumption:** if deployment target changes off Vercel, left-most XFF is client-controlled. → Mitigation: add a doc comment in `middleware.ts` noting the Vercel assumption; spec includes the trust assumption explicitly.
- **Bucket eviction under burst:** if many unique clients hit at once, the cap trigger may cause a large O(n) sweep. → Mitigation: cap is 10_000, sweep only runs when exceeded, expected to be rare under realistic traffic. Alternative sweep strategies can be added later without spec change.
- **Change stacking conflict:** if `api-security-hardening` merges first, this change's `specs/api-rate-limiting/spec.md` becomes a conflict. → Mitigation: per Q4, user decided this change absorbs. Merge this first, rebase api-security-hardening after.

## Migration Plan

- Deploy: standard merge to `main` → Vercel deploy.
- Rollback: revert the commit; no DB migration, no env changes, no new dependencies.
- Watch: after deploy, check for 400 responses on `/api/resume` POST/PUT (indicates clients sending `email`) and for transaction timeout errors in logs.

## Open Questions

- None at this point — all 4 gate questions answered (Q1=no backend, Q2=n/a, Q3=400-reject, Q4=absorb).
