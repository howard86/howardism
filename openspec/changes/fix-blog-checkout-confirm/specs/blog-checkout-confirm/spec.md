## ADDED Requirements

### Requirement: /api/checkout/confirm exists and is not session-guarded

The system SHALL provide a `GET /api/checkout/confirm` handler that does NOT require a Better Auth session. Authority for status transitions is delegated to LINE Pay's `confirm` endpoint.

#### Scenario: Unauthenticated GET is accepted

- **WHEN** `GET /api/checkout/confirm?orderId=<id>&transactionId=<tx>` is called with no `Cookie` header
- **THEN** the response is a 307 redirect (not a 401) AND the handler attempts its idempotent confirm flow

### Requirement: /api/checkout/confirm validates query params

The system SHALL respond with a 307 redirect to `/tools/checkout?error=missing_params` when either `orderId` or `transactionId` is missing or empty.

#### Scenario: Missing orderId

- **WHEN** `GET /api/checkout/confirm?transactionId=99` is called
- **THEN** the response is 307 with `location` ending in `/tools/checkout?error=missing_params` AND no LINE Pay call is made AND no DB write occurs

#### Scenario: Missing transactionId

- **WHEN** `GET /api/checkout/confirm?orderId=abc` is called
- **THEN** the response is 307 with `location` ending in `/tools/checkout?error=missing_params` AND no LINE Pay call is made

### Requirement: /api/checkout/confirm is idempotent

The system SHALL short-circuit to the detail page without calling LINE Pay when the latest `CommerceTransaction` on the order has a non-`PENDING` status.

#### Scenario: Transaction already COMPLETED

- **WHEN** `GET /api/checkout/confirm` is called for an order whose latest transaction has `status = "COMPLETED"`
- **THEN** the response is 307 to `/tools/checkout/<orderId>` AND `confirmApi` is NOT called AND no DB write occurs

#### Scenario: Transaction already FAILED

- **WHEN** `GET /api/checkout/confirm` is called for an order whose latest transaction has `status = "FAILED"`
- **THEN** the response is 307 to `/tools/checkout/<orderId>` AND `confirmApi` is NOT called AND no DB write occurs

### Requirement: /api/checkout/confirm commits COMPLETED on LINE Pay success

The system SHALL, when `confirmApi` returns `returnCode === "0000"`, update both the `CommerceTransaction.status` and the `CommerceOrder.status` to `"COMPLETED"` inside a single `prisma.$transaction`.

#### Scenario: LINE Pay confirm success

- **WHEN** the LINE Pay `confirmApi` returns `{ returnCode: "0000", ... }` for the pending transaction
- **THEN** the linked `CommerceTransaction` row has `status = "COMPLETED"` AND the linked `CommerceOrder` row has `status = "COMPLETED"` AND both writes happen inside a single Prisma transaction AND the shopper is redirected to `/tools/checkout/<orderId>`

### Requirement: /api/checkout/confirm marks FAILED on LINE Pay failure

The system SHALL, when `confirmApi` returns any `returnCode !== "0000"` or throws, update both the `CommerceTransaction.status` and the `CommerceOrder.status` to `"FAILED"` inside a single `prisma.$transaction`.

#### Scenario: LINE Pay non-success returnCode

- **WHEN** `confirmApi` returns `returnCode === "9000"` (or any value other than `"0000"`)
- **THEN** the linked `CommerceTransaction` row has `status = "FAILED"` AND the linked `CommerceOrder` row has `status = "FAILED"` AND the shopper is still redirected to `/tools/checkout/<orderId>`

#### Scenario: LINE Pay fetch throws

- **WHEN** the outbound `confirmApi` fetch rejects (timeout, HTTP non-ok, network error)
- **THEN** the linked `CommerceTransaction` row has `status = "FAILED"` AND the linked `CommerceOrder` row has `status = "FAILED"` AND the shopper is still redirected to `/tools/checkout/<orderId>`

### Requirement: /api/checkout/confirm has an independent rate-limit bucket

The system SHALL rate-limit `/api/checkout/confirm` under a dedicated policy prefix, separate from the `/api/checkout` POST budget, so that LINE Pay retries cannot exhaust the shopper's checkout-submit budget.

#### Scenario: Separate policies

- **WHEN** the middleware `routePolicy` is evaluated for the path `/api/checkout/confirm`
- **THEN** the selected policy prefix is `"/api/checkout/confirm"` (not `"/api/checkout"`)

### Requirement: /api/checkout/confirm ends with a redirect to the order detail page

The system SHALL always finish with `NextResponse.redirect(\`/tools/checkout/<orderId>\`)` (status 307) on every non-missing-param path, so the shopper sees the status-driven detail page rather than a JSON body.

#### Scenario: Response shape

- **WHEN** any non-missing-param request is processed by the handler
- **THEN** the response has status 307 AND the `location` header points at `/tools/checkout/<orderId>` (the already-existing status-driven detail page)
