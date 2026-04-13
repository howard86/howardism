## ADDED Requirements

### Requirement: Authenticated checkout page surfaces

The system SHALL gate every server-component page under `apps/blog/src/app/(blog)/tools/checkout/**/page.tsx` with `requireSessionForPage()` so that unauthenticated users are redirected to `/login?callbackUrl=<original>` before reaching the form or any existing page content.

#### Scenario: Anonymous visit to the checkout form page
- **WHEN** an unauthenticated user navigates to `/tools/checkout`
- **THEN** the system SHALL redirect to `/login?callbackUrl=/tools/checkout`

#### Scenario: Anonymous visit to the success page
- **WHEN** an unauthenticated user navigates to `/tools/checkout/success`
- **THEN** the system SHALL redirect to `/login?callbackUrl=/tools/checkout/success`

#### Scenario: Anonymous visit to the cancelled page
- **WHEN** an unauthenticated user navigates to `/tools/checkout/cancelled`
- **THEN** the system SHALL redirect to `/login?callbackUrl=/tools/checkout/cancelled`

#### Scenario: Anonymous visit to the order details page
- **WHEN** an unauthenticated user navigates to `/tools/checkout/<orderId>`
- **THEN** the system SHALL redirect to `/login?callbackUrl=/tools/checkout/<orderId>`

### Requirement: Ownership-enforced order details via single-query binding

The system SHALL restrict access to `/tools/checkout/[orderId]` to the authenticated user whose email matches the order's `email` field, implemented as a single Prisma query whose `where` clause includes BOTH `id` and `email` so that non-existent and non-owned cases follow the identical null-result branch by construction.

#### Scenario: Owner views their order
- **WHEN** `session.user.email` equals `order.email` for the requested `orderId`
- **THEN** the single query `prisma.commerceOrder.findUnique({ where: { id, email: session.user.email } })` SHALL return the order record and the page SHALL render as before

#### Scenario: Non-owner request uses the null-result branch
- **WHEN** `session.user.email` does NOT equal `order.email` for the requested `orderId`, OR the `orderId` does not exist
- **THEN** the same query SHALL return `null` in both cases, and the page SHALL invoke `notFound()` — producing an identical response that does not distinguish the two cases

### Requirement: Future order-creation handler obligation

**Forward-looking** — the `/api/checkout` Route Handler does not exist in the current codebase (tracked by issue #480). When that handler is implemented, it SHALL consume `requireSessionForRoute()` to require an authenticated session and SHALL set the new order's `email` field from `session.user.email` rather than from the request body, binding ownership to the authenticated identity.

#### Scenario: Unauthenticated future create rejected
- **WHEN** the future `/api/checkout` Route Handler is invoked without a valid session
- **THEN** it SHALL return 401 via the `NextResponse` provided by `requireSessionForRoute()` and SHALL NOT create any `CommerceOrder` record

#### Scenario: Authenticated future create binds email to session
- **WHEN** the future `/api/checkout` Route Handler is invoked with a valid session
- **THEN** it SHALL ignore any `email` value supplied in the request body and SHALL set `email: session.user.email` on the created `CommerceOrder`
