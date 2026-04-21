## 1. Preflight and regression-test scaffolding

- [x] 1.1 Confirm `apps/blog/src/server/session.ts` exports `requireSessionForPage`; if not, identify the canonical server-side session helper used by sibling resume pages (`edit`, `clone`) and use that helper name throughout the change.
- [x] 1.2 Confirm `apps/blog/src/app/api/resume/route.ts` location and current request-validation strategy (Zod schema path) so tests assert against the actual symbols.
- [x] 1.3 Grep for all current callers of `POST /api/resume` and `PUT /api/resume` (frontend `ResumeEditor`, any CLI/test) to enumerate clients that may still send body `email`.

## 2. Issue #591 — Applicant email pinning

- [x] 2.1 Add failing regression test: authenticated POST `/api/resume` with body containing `email: "attacker@example.com"` → expect HTTP 400 and no applicant row written.
- [x] 2.2 Add failing regression test: authenticated PUT `/api/resume` with body containing `email: "attacker@example.com"` → expect HTTP 400 and no applicant update.
- [x] 2.3 Add failing regression test: authenticated POST `/api/resume` with body omitting `email` → expect 2xx and applicant row written with `session.user.email`.
- [x] 2.4 Update the POST/PUT Zod schema (or equivalent validator) to reject non-empty `email` in body with 400.
- [x] 2.5 Change applicant upsert to write `email: authResult.session.user.email` unconditionally; remove any read of body `email` on the applicant row path.
- [x] 2.6 Run the regression tests from 2.1–2.3 and confirm all pass.
- [x] 2.7 Update any caller from task 1.3 that still sends body `email` (most likely `ResumeEditor`) to drop the field.

## 3. Issue #587 — Atomic resume writes

- [x] 3.1 Add failing regression test: POST `/api/resume` where the profile-create step throws → applicant row MUST NOT exist afterwards.
- [x] 3.2 Add failing regression test: PUT `/api/resume` where a nested child-entity write throws → profile update and applicant update MUST both be rolled back.
- [x] 3.3 Add assertion-only test: `prisma.$transaction` is invoked with `timeout >= 15000` and `maxWait >= 5000` in the resume route module.
- [x] 3.4 Wrap applicant upsert + profile create/update + nested child operations in a single `prisma.$transaction` interactive callback; thread the tx client through all downstream calls.
- [x] 3.5 Pass explicit `{ timeout: 15_000, maxWait: 5_000 }` to `prisma.$transaction`.
- [x] 3.6 Run regression tests from 3.1–3.3 and confirm all pass.

## 4. Issue #592 — Server-side auth guard on /profile/resume/add

- [x] 4.1 Add failing regression test (page-level): unauthenticated navigation to `/profile/resume/add` → server responds with redirect to `/login?callbackURL=/profile/resume/add` and page body does NOT include `ResumeEditor`.
- [x] 4.2 Add failing regression test: authenticated navigation to `/profile/resume/add` → page renders `ResumeEditor` with server-resolved session.
- [x] 4.3 Convert `apps/blog/src/app/(blog)/profile/resume/add/page.tsx` to an async Server Component that calls `requireSessionForPage("/profile/resume/add")` (or the canonical helper confirmed in 1.1) before rendering.
- [x] 4.4 Verify sibling `edit/[id]/page.tsx` and `clone/[id]/page.tsx` already use the canonical helper; if any gap exists, fix it in this same commit group.
- [x] 4.5 Run regression tests from 4.1–4.2 and confirm all pass.

## 5. Issue #554 — Rate-limiter hardening

- [x] 5.1 Add failing test: `x-forwarded-for: 0.0.0.0, 1.2.3.4` results in bucket client key `0.0.0.0` (not the full string and not `1.2.3.4`).
- [x] 5.2 Add failing test: rate-limited 429 response has `Content-Type: application/json` and body exactly `{"message":"Too many requests"}`.
- [x] 5.3 Add failing test: when bucket map exceeds `BUCKET_MAP_CAP` entries, expired entries (`resetAt <= now`) are evicted on the next write.
- [x] 5.4 Add assertion-only test: middleware source contains no `setInterval` or `setTimeout` for eviction, and contains the `TODO(#497-followup)` marker.
- [x] 5.5 Update `resolveClientKey` (or inline logic) in `middleware.ts` to split XFF on `,`, take index 0, trim whitespace, and fall back to `x-real-ip` then `"unknown"`.
- [x] 5.6 Replace any text 429 response with `NextResponse.json({ message: "Too many requests" }, { status: 429 })`.
- [x] 5.7 Add `BUCKET_MAP_CAP` constant (10_000) and opportunistic eviction in the bucket-write path that sweeps expired entries when `buckets.size > BUCKET_MAP_CAP`.
- [x] 5.8 Keep the `TODO(#497-followup)` comment line unchanged; add a short comment above the XFF parse explaining the trusted-proxy assumption.
- [x] 5.9 Update any existing rate-limit test whose assertion reflected the old (incorrect) 429 body shape.
- [x] 5.10 Run all rate-limit tests (new + existing) and confirm green.

## 6. Cross-cutting verification

- [x] 6.1 Run `bun run type-check` at the repo root; no new errors introduced.
- [x] 6.2 Run `bun run lint` (ultracite); fix any violations introduced by the change.
- [x] 6.3 Run `bun run test` at the repo root; confirm blog app test suite green including all new regression tests.
- [x] 6.4 Run `openspec validate harden-critical-security-group --strict` and confirm no validation errors.
- [x] 6.5 Update the MEMORY.md `## Artifacts` section with the final change folder path and tasks.md path.
