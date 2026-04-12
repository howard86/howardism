## ADDED Requirements

### Requirement: `requireSessionForPage()` enforces session in server components

The system SHALL provide a `requireSessionForPage(callbackUrl?: string)` helper exported from `apps/blog/src/lib/auth.ts` for use in server components (pages, layouts). On a valid session it SHALL return the session object; on a missing session it SHALL call Next.js's `redirect()` (which throws `NEXT_REDIRECT`) to navigate to `/login`, preserving the callback URL when provided.

#### Scenario: Authenticated page call returns session
- **WHEN** `requireSessionForPage()` is called from a server component with a valid session cookie
- **THEN** it SHALL return the full session object returned by `auth.api.getSession({ headers: await headers() })`

#### Scenario: Unauthenticated page call redirects to login
- **WHEN** `requireSessionForPage(callbackUrl)` is called with no valid session cookie
- **THEN** it SHALL invoke Next.js `redirect("/login?callbackUrl=<encoded callbackUrl>")` — and if `callbackUrl` was omitted, `redirect("/login")`

### Requirement: `requireSessionForRoute()` enforces session in Route Handlers

The system SHALL provide a `requireSessionForRoute()` helper exported from `apps/blog/src/lib/auth.ts` for use in Route Handlers. It SHALL return a tagged-union result that the caller can early-return without a try/catch: `{ ok: true, session }` on valid session, `{ ok: false, response: NextResponse }` on missing session where the response carries status 401.

#### Scenario: Authenticated route call returns session
- **WHEN** `requireSessionForRoute()` is called with a valid session cookie
- **THEN** it SHALL return `{ ok: true, session }` where `session` is the object from `auth.api.getSession`

#### Scenario: Unauthenticated route call returns 401 response
- **WHEN** `requireSessionForRoute()` is called with no valid session cookie
- **THEN** it SHALL return `{ ok: false, response }` where `response` is a `NextResponse` with status 401 and a JSON body `{ message: "Unauthorized" }` (or equivalent stable shape)

### Requirement: Ubike API callsite migrated to the route helper

The system SHALL refactor `apps/blog/src/app/(blog)/profile/ubike/api/route.tsx` (introduced by PR #503) to consume `requireSessionForRoute()` in place of its inline `auth.api.getSession` + null check + `NextResponse.json(401)` block, with no observable behaviour change.

#### Scenario: Ubike API status and body unchanged
- **WHEN** the refactored ubike API handler is invoked with or without a session
- **THEN** it SHALL produce the same HTTP status and response body as before the refactor (validated by the existing PR #503 tests)
