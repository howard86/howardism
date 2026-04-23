# Preflight Audit Notes — harden-critical-security-group

## 1. Session Helper

**`apps/blog/src/server/session.ts` does NOT exist.**

The server directory (`apps/blog/src/server/`) only contains `libs/`. The blog app has migrated from NextAuth to **better-auth**. Both session helpers are exported from:

- **File:** `apps/blog/src/lib/auth.ts`
- **Symbols:**
  - `requireSessionForPage(callbackUrl?: string)` — Server Component guard; reads session via `auth.api.getSession({ headers })`, calls `redirect("/login")` if unauthenticated. Returns the session object.
  - `requireSessionForRoute()` — Route Handler guard; returns tagged union `{ ok: true, session }` or `{ ok: false, response: NextResponse 401 }`.

**Sibling pages audit:**
- `apps/blog/src/app/(blog)/profile/resume/[profileId]/edit/page.tsx` — no `requireSessionForPage` call; server-component only calls `getResumeById(profileId)`. No server-side auth guard.
- `apps/blog/src/app/(blog)/profile/resume/[profileId]/clone/page.tsx` — same; no server-side auth guard.
- `apps/blog/src/app/(blog)/profile/resume/add/page.tsx` — renders `<ResumeEditor />` only; no server-side auth guard. This is the page targeted by issue #592.

**Task 4 fix symbol:** `requireSessionForPage` from `@/lib/auth`.

---

## 2. Resume Route & Zod Schema

**Route file confirmed:** `apps/blog/src/app/api/resume/route.ts`

**Zod schema:**
- **Module:** `@/app/(blog)/profile/resume/schema` → `apps/blog/src/app/(blog)/profile/resume/schema.ts`
- **Symbol:** `resumeSchema` (exported named export)
- **Type:** `ResumeSchema` (inferred type also exported)

**Schema includes `email`:** `email: requiredString.email()` (line 74 of schema.ts). The route currently destructures `email` from `parsed.data` and passes it to `prisma.resumeApplicant.upsert({ update: { email, ... } })` — this is the issue #591 vector (client-supplied email overwrites canonical applicant email).

---

## 3. POST/PUT `/api/resume` Callers

| File | Line | Method | Notes |
|------|------|--------|-------|
| `apps/blog/src/app/(blog)/profile/resume/ResumeEditor.tsx` | 69–78 | `POST` or `PUT` | Single fetch; uses `profileId ? "PUT" : "POST"`. Sends `JSON.stringify(values)` where `values` is the full `ResumeSchema` including `email`. |
| `apps/blog/src/app/api/resume/__tests__/route.test.ts` | 128 | `POST` | `makePostRequest(body)` helper constructs `POST` to `http://localhost:3000/api/resume` |
| `apps/blog/src/app/api/resume/__tests__/route.test.ts` | 137 | `PUT` | `makePutRequest(body, profileId)` helper constructs `PUT` to `http://localhost:3000/api/resume?profileId=…` |

**No other callers found** (no CLI scripts, no other frontend components, no other test files).

**Implication for Task 2.7:** `ResumeEditor.tsx` submits `email` in the request body today. After Task 2 strips `email` from the server-side upsert (pinning to session email instead), the client may still send it — the route will simply ignore it. No breaking change to `ResumeEditor.tsx` required. The test file `route.test.ts` sends `email` in `validBody`; tests should remain valid but may need an assertion update to confirm body `email` is NOT used.
