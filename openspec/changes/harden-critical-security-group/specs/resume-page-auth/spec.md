## ADDED Requirements

### Requirement: Resume pages validate session server-side

Every page under the route group `app/(blog)/profile/resume/*` in `apps/blog` SHALL resolve the current session server-side before rendering. When no valid session exists, the page SHALL redirect to `/login?callbackURL=<current-path>` and SHALL NOT render any resume editor or viewer content. This requirement applies to `add`, `edit/[id]`, `clone/[id]`, and any future resume subpages; it supplements but does not replace the middleware cookie-presence check.

#### Scenario: Unauthenticated access to /profile/resume/add redirects

- **WHEN** a client with no valid session navigates to `/profile/resume/add`
- **THEN** the server SHALL respond with a redirect to `/login?callbackURL=/profile/resume/add` and SHALL NOT render the resume editor

#### Scenario: Authenticated access to /profile/resume/add renders editor

- **WHEN** a client with a valid session navigates to `/profile/resume/add`
- **THEN** the server SHALL render the resume editor page with the authenticated user context

#### Scenario: Unauthenticated access to /profile/resume/edit/[id] redirects

- **WHEN** a client with no valid session navigates to `/profile/resume/edit/some-id`
- **THEN** the server SHALL respond with a redirect to `/login?callbackURL=/profile/resume/edit/some-id`

#### Scenario: Unauthenticated access to /profile/resume/clone/[id] redirects

- **WHEN** a client with no valid session navigates to `/profile/resume/clone/some-id`
- **THEN** the server SHALL respond with a redirect to `/login?callbackURL=/profile/resume/clone/some-id`

### Requirement: Server-side guard uses canonical helper

Pages under `app/(blog)/profile/resume/*` SHALL invoke the shared `requireSessionForPage(callbackUrl)` helper (or an equivalent server utility that performs session validation and redirect) rather than re-implementing session lookup inline. The helper MUST read the session from the server (cookie + session store), not from client-only signals.

#### Scenario: /profile/resume/add uses requireSessionForPage

- **WHEN** the source file `apps/blog/src/app/(blog)/profile/resume/add/page.tsx` is inspected
- **THEN** it SHALL invoke `requireSessionForPage` (or the canonical server-side session helper) with a callback URL equal to the page's own path
