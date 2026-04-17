## Why

`fix-blog-checkout-resilience` (PR #558, already merged) added `POST /api/checkout`, which hands LINE Pay a `confirmUrl` pointing at `${origin}/api/checkout/confirm?orderId=${order.id}`. The corresponding route handler was never created. As a result every LINE Pay transaction ends with a 404 on the return redirect: the shopper completes payment, LINE Pay redirects to `/api/checkout/confirm?...`, Next.js returns 404, and the `CommerceOrder` + `CommerceTransaction` stay `PENDING` forever — the database is never told that the payment succeeded (or failed). This is the critical remaining gap for the LINE Pay flow (GitHub issue #572, labelled `priority:critical, severity:critical`).

## What Changes

- Add `GET /api/checkout/confirm` at `apps/blog/src/app/api/checkout/confirm/route.ts`. The handler reads `orderId` + `transactionId` from query params, re-reads the latest `CommerceTransaction` for the order, and calls LINE Pay's `confirmApi(transactionId, { amount, currency })`.
- On `returnCode === "0000"`: update both the transaction and the order to `COMPLETED` inside a single `prisma.$transaction`. On any other returnCode, or a thrown fetch error (timeout/HTTP-non-2xx from existing T2 hardening in `line-pay.ts`): update both to `FAILED`. Always redirect the shopper to `/tools/checkout/[orderId]` — the already-merged status-driven detail page renders the appropriate status copy.
- Handler is **idempotent**: a transaction that is already `COMPLETED` or `FAILED` short-circuits to the detail page without a second LINE Pay call. Handles LINE Pay's "redirect the user a second time" retry behaviour without double-billing or thrashing DB state.
- Add a dedicated rate-limit policy `{ prefix: "/api/checkout/confirm", limit: 20, windowMs: 60_000 }` placed **before** the generic `/api/checkout` policy in `apps/blog/src/middleware.ts`. Reason: the confirm callback is network-driven (LINE Pay may retry) and the POST is user-driven, so they should not share a budget.
- Confirm handler is **not** session-guarded: LINE Pay's browser redirect does not guarantee our Better Auth cookie survives the cross-site round-trip (SameSite=Lax permits top-level navigation cookies but LINE Pay's confirm callback is a top-level GET, so in practice the cookie arrives, but we must not depend on it — LINE Pay's `confirm` endpoint is the actual authority that validates the `(transactionId, amount, currency)` tuple it issued).

## Capabilities

### New Capabilities

- `blog-checkout-confirm`: server-side confirm route that turns a LINE Pay post-payment redirect into an authoritative `COMPLETED`/`FAILED` transition, with idempotency and no dependence on the in-browser session.

### Modified Capabilities

_(none — `blog-checkout-api` introduced by the earlier change describes `POST /api/checkout`; `GET /api/checkout/confirm` is a new capability on a distinct path.)_

## Impact

- **Code**:
  - **New** `apps/blog/src/app/api/checkout/confirm/route.ts`
  - **New** `apps/blog/src/app/api/checkout/confirm/__tests__/route.test.ts`
  - **Edit** `apps/blog/src/middleware.ts` — one new rate-limit policy row
- **APIs**: one new App Router endpoint; no payload change, redirect contract documented.
- **Dependencies**: none added — reuses `confirmApi` already in `apps/blog/src/services/line-pay.ts` and the existing `@/services/prisma` singleton.
- **Auth/session**: handler runs unauthenticated by design (authority is delegated to LINE Pay's confirm endpoint).
- **Data model**: no schema changes; `CommerceOrder` and `CommerceTransaction` already have `status: String`. This change exercises the `PENDING → COMPLETED` and `PENDING → FAILED` transitions the earlier spec documented.
- **GitHub issues closed**: #572.
