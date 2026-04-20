## Context

The `POST /api/checkout` handler (shipped in PR #558) persists a `CommerceOrder` + a `PENDING` `CommerceTransaction` in a single Prisma transaction, then calls LINE Pay's `requestApi` with a `redirectUrls.confirmUrl` pointing at `/api/checkout/confirm?orderId=...`. That file did not exist. Once the shopper approves the payment, LINE Pay redirects their browser to the confirm URL — the request lands on a 404, the transaction stays `PENDING`, and the user sees a generic "Payment Pending" page (the order detail page at `/tools/checkout/[orderId]` already infers status from `transactions[0]?.status`). Money is authorised by LINE Pay; from the merchant side, nothing indicates success or failure.

## Goals / Non-Goals

### Goals

- Confirm LINE Pay payments against LINE Pay's `confirm` endpoint and persist the authoritative outcome in our DB.
- Handle LINE Pay retrying the redirect without double-charging or flapping DB state (idempotency).
- Reuse `confirmApi` and the existing fetch hardening (`AbortController`, `response.ok` throw) so no new network primitives are introduced.
- Return the shopper to `/tools/checkout/[orderId]`, which already renders status copy via `STATUS_COPY`.

### Non-Goals

- Refactoring status fields from `String` to Prisma enum (tracked separately by #567).
- Capturing payment details (credit-card masked number, reg-key for recurring) from `info.payInfo[]`. The confirm response exposes them, but our DB has no column; if the product ever needs receipts, that's a schema-level change.
- Emitting a webhook / email on completion. Out of scope for the bug fix.
- Introducing an external session token in the confirm URL. LINE Pay's own `(amount, currency, transactionId)` tuple check is the authority; adding a second secret would be defence-in-depth but is not required to fix the 404.

## Decisions

### Decision: Handler is unauthenticated

LINE Pay's browser redirect is a top-level GET. SameSite=Lax cookies are included on cross-site top-level navigation, so in practice our Better Auth cookie accompanies the redirect — but we cannot rely on it. LINE Pay's own confirm-endpoint contract is strict: it rejects any `transactionId` whose `amount`/`currency` do not match what was issued at request-time. That means an attacker who guesses an `orderId` cannot flip the order to `COMPLETED`: LINE Pay will refuse the inner `confirmApi` call and we will take the FAILED branch.

We considered sending a per-order HMAC nonce in the `confirmUrl` as belt-and-braces auth, but it adds state (we'd need to persist the nonce) for no extra security — the LINE Pay authority is already the tightest possible check on the transition.

### Decision: Idempotent short-circuit

On second visit to `/api/checkout/confirm?...`, we load the latest transaction and bail out early if its `status !== "PENDING"`. This covers two real retry paths:

1. LINE Pay issues duplicate confirm redirects (network retries on their side).
2. The shopper reloads the confirm URL in their browser after we've already redirected them to the detail page.

Either way, we redirect to the detail page without re-calling LINE Pay (`confirmApi` would return `1152 TransactionRecordExists` on re-attempt — safe but wasteful, and we'd pointlessly spend a rate-limit slot).

### Decision: `prisma.$transaction([...array])` instead of interactive

Two updates (transaction row + order row) with no branching logic between them. The batched array form is cheaper than the interactive callback form, and the code is simpler to read. The order-update must not leave the transaction-update uncommitted on rollback; Prisma's batched form is atomic at the SQL level, satisfying this.

### Decision: Redirect status 307

`NextResponse.redirect` defaults to 307 Temporary Redirect. The inbound method is GET, the outbound is GET, and we want the shopper to observe the page the first time they land. 303 See Other would also work; 302 is ambiguous across clients. Default is fine.

### Decision: Insert `/api/checkout/confirm` rate-limit policy before `/api/checkout`

`routePolicy.find` returns the first matching prefix. Without an explicit confirm policy, `/api/checkout/confirm` would match the existing `/api/checkout` (10/60s) and share the POST's budget — LINE Pay retries could exhaust the user's own checkout attempts. Separate 20/60s budget keeps them independent. The new row goes before the broader prefix because `find` is order-dependent.

## Risks / Trade-offs

- **LINE Pay contract changes**: if LINE Pay ever changes the confirm endpoint's amount-enforcement, this becomes less safe (an attacker could guess an `orderId`). Mitigation: monitor LINE Pay's dev notice; the code is one HMAC-signed `fetch` call — fast to replace.
- **Stuck PENDING orders**: if the shopper never returns (closes the LINE Pay tab without approving), the PENDING row stays PENDING forever. Cleanup belongs in a scheduled job — out of scope here, tracked separately.
- **Unauthenticated endpoint**: the route is reachable by anyone, so it's a small rate-limit target. The 20/60s policy + LINE Pay authority prevents abuse, but any future scope creep ("let's also log the caller's IP / notify them via email") would need to re-evaluate.

## Migration Plan

No data migration. Existing PENDING rows remain PENDING until either (a) the shopper retries checkout and the new flow updates them on the second pass, or (b) the shopper returns to `/tools/checkout/[orderId]` for the first time after deploy — nothing changes, but their next confirm redirect will now work. No backfill needed.
