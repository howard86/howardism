## 1. Confirm route handler

- [x] 1.1 Add failing tests in `apps/blog/src/app/api/checkout/confirm/__tests__/route.test.ts` covering: missing `orderId`, missing `transactionId`, unknown order, idempotent no-op on already-`COMPLETED` transaction, happy path marks both rows `COMPLETED` inside a single `$transaction`, non-0000 returnCode marks both `FAILED`, thrown fetch marks both `FAILED`.
- [x] 1.2 Create `apps/blog/src/app/api/checkout/confirm/route.ts` — `GET` handler that reads the query params, loads the latest transaction via `prisma.commerceOrder.findUnique({ transactions: { take: 1, orderBy: { createdAt: "desc" } } })`, calls `confirmApi(transactionId, { amount: tx.amount.toNumber(), currency: tx.currency })`, and branches status updates per return code / throw. Always returns `NextResponse.redirect(new URL(\`/tools/checkout/\${orderId}\`, origin))` at the end.
- [x] 1.3 Run `bun test src/app/api/checkout/confirm` → all green.

## 2. Rate-limit policy

- [x] 2.1 Edit `apps/blog/src/middleware.ts` — insert `{ prefix: "/api/checkout/confirm", limit: 20, windowMs: 60_000 }` BEFORE the existing `/api/checkout` entry (routePolicy.find stops at first match). Include a one-line comment explaining the ordering.
- [x] 2.2 Run `bun test src/__tests__/middleware.rate-limit.test.ts` → no regressions.

## 3. Full-suite validation + lint

- [ ] 3.1 `bun run lint` (ultracite) green across the blog workspace.
- [ ] 3.2 `bun run type-check` green across the blog workspace.
- [ ] 3.3 `bun test` green across the blog workspace (no regressions in unrelated suites).
- [ ] 3.4 Manual smoke in the LINE Pay sandbox: start a real checkout, complete the approval flow in LINE Pay sandbox, confirm the redirect lands on `/tools/checkout/[orderId]` with "Thank you!" copy and the DB rows show `status = "COMPLETED"`.
