## 1. Extract session helpers (refactor, no issue closed)

- [x] 1.1 Add two helpers to `apps/blog/src/lib/auth.ts`:
  - `requireSessionForPage(callbackUrl?: string)` — for server components; calls Next.js `redirect("/login?callbackUrl=…")` on missing session; returns the session object otherwise
  - `requireSessionForRoute()` — for Route Handlers; returns a tagged union `{ ok: true, session } | { ok: false, response: NextResponse }` so callers can early-return with a 401 Response
- [x] 1.2 Refactor existing ubike API callsite at `apps/blog/src/app/(blog)/profile/ubike/api/route.tsx` (introduced in PR #503) to consume `requireSessionForRoute()` — verify no behaviour change (all PR #503 tests still pass)
- [x] 1.3 Unit tests colocated at `apps/blog/src/lib/auth.test.ts`:
  - `requireSessionForRoute` with mocked session → `{ ok: true, session }`
  - `requireSessionForRoute` with mocked null → `{ ok: false, response: NextResponse(401) }`
  - `requireSessionForPage` with mocked null → calls `redirect()` (mock `next/navigation.redirect`) with correct callbackUrl

## 2. Auth-required checkout pages (`Closes #498`)

**Scope note:** The `/api/checkout` Route Handler does not exist in the repo today (missing per issue #480). This task gates the checkout *page* surfaces so anonymous users cannot reach the form; the forward-looking obligation to auth-gate the future handler lives in the `checkout-flow` spec delta and will be enforced when #480 is implemented.

- [x] 2.1 Enumerate the checkout-flow page surfaces to gate: `apps/blog/src/app/(blog)/tools/checkout/page.tsx`, `apps/blog/src/app/(blog)/tools/checkout/success/page.tsx`, `apps/blog/src/app/(blog)/tools/checkout/cancelled/page.tsx`, `apps/blog/src/app/(blog)/tools/checkout/[orderId]/page.tsx`
- [x] 2.2 Gate each checkout page with `requireSessionForPage(callbackUrl)` — anonymous users redirected to `/login?callbackUrl=<original>` before reaching the form
- [x] 2.3 Ownership-enforce the order details page (`[orderId]/page.tsx`): replace `prisma.commerceOrder.findUnique({ where: { id: orderId } })` with `prisma.commerceOrder.findUnique({ where: { id: orderId, email: session.user.email } })` — a single query whose `where` clause binds both id and email, so non-existent and non-owned orders follow the identical `notFound()` branch by construction
- [x] 2.4 Commit body must note: `/api/checkout` handler missing (#480); when implemented, must consume `requireSessionForRoute()` and set the `CommerceOrder.email` field from `session.user.email` rather than the request body (per `checkout-flow` spec "Future order creation handler" requirement)
- [x] 2.5 Integration-style test at `apps/blog/src/app/(blog)/tools/checkout/[orderId]/page.test.tsx` with mocked `auth.api.getSession` + Prisma:
  - Anonymous → `redirect("/login?callbackUrl=/tools/checkout/<id>")`
  - Authenticated non-owner → Prisma returns `null` (because `email` clause fails) → `notFound()`
  - Authenticated owner → page renders order contents
- [x] 2.6 Manual verification: run blog dev server, attempt anonymous visit to each of the 4 pages → redirected to `/login`; attempt authenticated cross-user order view → `notFound()`

## 3. Harden recipe API (`Closes #499`)

- [x] 3.1 Define Zod schemas in `apps/recipe/src/pages/api/recipe/schemas.ts` (new file), derived from `apps/recipe/src/types/recipe.d.ts`:
  ```ts
  const ingredientSchema = z.object({ amount: z.number(), name: z.string(), processing: z.string().optional(), unit: z.string() });
  const stepSchema = z.object({ description: z.string(), summary: z.string() });
  export const recipeSchema = z.object({ description: z.string(), title: z.string(), ingredients: z.array(ingredientSchema), seasonings: z.array(ingredientSchema), steps: z.array(stepSchema) });
  export const loginSchema = z.object({ identifier: z.string(), password: z.string() });
  export const bearerTokenSchema = z.string().regex(/^Bearer .+/);
  ```
- [x] 3.2 Update `apps/recipe/src/pages/api/auth/login.ts`: `safeParse(req.body)` with `loginSchema`; on failure return 400 with `{ errors: result.error.flatten() }`; no `console.*` calls referencing `req.body` or `req.headers`
- [x] 3.3 Update `apps/recipe/src/pages/api/recipe/create.ts`:
  - `bearerTokenSchema.safeParse(req.headers.authorization)` → 401 on failure (replaces `length < 8` heuristic)
  - `recipeSchema.safeParse(req.body)` → 400 on failure
  - Remove all `console.warn`/`console.error` that reference `req.body`, `req.headers`, `authorization`, or a Bearer value — log only stable identifiers like `error.message`
- [x] 3.4 Unit tests colocated at `apps/recipe/src/pages/api/auth/login.test.ts` and `apps/recipe/src/pages/api/recipe/create.test.ts`:
  - Malformed body → 400 + flattened errors; downstream not called
  - Valid body → 200 path (downstream stub invoked with parsed object)
  - Missing/non-Bearer Authorization → 401; downstream not called
  - Valid Bearer + valid body → 200
- [x] 3.5 **Console-spy assertion** (in addition to file grep): tests install `spyOn(console, "warn")` / `spyOn(console, "error")`, trigger each error path, and assert the spies were not called with any argument that stringifies to contain the request body, `Authorization`, or a Bearer token

## 4. Harden proxy API (`Closes #521`)

- [x] 4.1 Gate `GET /api/proxy` with `requireSessionForRoute()` at the top of the handler — unauthenticated → 401. Placement: auth check runs first (before URL parse) so a missing session never triggers any parsing or DNS work
- [x] 4.2 Append `resolveAndCheckPrivateIP(hostname): Promise<void>` to `apps/blog/src/app/api/proxy/isPrivateHost.ts`:
  - `await Promise.all([dns.resolve4(hostname), dns.resolve6(hostname)])`
  - Treat `ENOTFOUND`/`ENODATA`/`NODATA` as "no resolved addresses" per family — if BOTH families yield nothing, reject (throw) as an unresolvable host
  - For each resolved address, run through existing `isPrivateIPv4`/`isPrivateIPv6` — throw if any match
  - Call from `route.ts` after the existing protocol check + string-based `isPrivateHost()` check
- [x] 4.3 Wrap `fetch()` in `AbortController` with 5000ms timeout (extract as a named constant `FETCH_TIMEOUT_MS`); return 504 on `AbortError`
- [x] 4.4 Response-size cap at 1MB (constant `MAX_BODY_BYTES`):
  - If `response.headers.get("content-length")` > `MAX_BODY_BYTES` → return 413 without reading the body
  - Otherwise read via manual `ReadableStream` reader; track cumulative bytes; abort reader + return 413 if the cap is exceeded
  - **Response shape preserved**: final return remains `NextResponse.json({ data: html })` — do NOT switch to a streamed Response; that would break public API shape
- [x] 4.5 Regression: all PR #503 tests in `apps/blog/src/app/api/proxy/isPrivateHost.test.ts` continue to pass unchanged. Run as part of the T4 validation step
- [x] 4.6 New tests at `apps/blog/src/app/api/proxy/route.test.ts`:
  - Unauthenticated → 401, no URL parse / DNS / fetch
  - Mock `dns.resolve4` returning `["127.0.0.1"]` on a public-looking hostname → 400 (no fetch)
  - Mock `dns.resolve4` returning `["8.8.8.8"]` → proceeds to fetch
  - Mock upstream that never resolves → `AbortController` fires at 5s → 504
  - Mock upstream with `Content-Length: 5000000` → 413, body not read
  - Mock upstream with chunked body exceeding 1MB → 413 during streaming

## 5. Harden github-search GraphQL relay (`Closes #523`)

- [x] 5.1 Define operation allowlist at module scope in `apps/github-search/src/pages/api/graphql.ts`:
  ```ts
  // Keep in sync with src/gql/*.graphql (non-fragment operations only)
  const ALLOWED_OPERATIONS = new Set(["getUser", "searchUsers"]);
  ```
  Fragments (`pageInfoFields`) must NOT be in the set — `operationName` never matches a fragment name
- [x] 5.2 Zod-validate request body: `z.object({ query: z.string(), operationName: z.string(), variables: z.record(z.unknown()).optional() })`; malformed body → 400
- [x] 5.3 Reject any `operationName` not in `ALLOWED_OPERATIONS` → 400 (no upstream fetch)
- [x] 5.4 Parse `query` with `parse()` from `graphql`, walk top-level `definitions`, reject if any has `operation !== "query"` (blocks mutations + subscriptions even if `operationName` matches)
- [x] 5.5 Depth limit (8) via AST-walk — primary path, no extra dependency:
  ```ts
  function maxDepth(doc: DocumentNode): number {
    let max = 0;
    const visit = (node: { selectionSet?: { selections: unknown[] } }, depth: number) => {
      if (depth > max) max = depth;
      if (node.selectionSet) for (const sel of node.selectionSet.selections) visit(sel as typeof node, depth + 1);
    };
    for (const def of doc.definitions) if (def.kind === "OperationDefinition") visit(def, 0);
    return max;
  }
  ```
  Reject if `maxDepth(document) > 8` → 400. Do NOT load `graphql.schema.json` (4.4MB) for this check
- [x] 5.6 Tests at `apps/github-search/src/pages/api/graphql.test.ts`:
  - Malformed body → 400
  - Unknown `operationName` → 400, no upstream fetch
  - Query with `mutation { ... }` → 400
  - Query nested >8 levels → 400
  - Valid `getUser` query at depth ≤8 → forwarded to upstream; response pass-through
  - Regression: upstream `fetch` is called with `Authorization: Bearer <GITHUB_ACCESS_TOKEN>` header (spec "Upstream request remains token-authenticated")
- [x] 5.7 Manual verification: run github-search app, exercise each page that uses `getUser` and `searchUsers`, confirm no regressions
