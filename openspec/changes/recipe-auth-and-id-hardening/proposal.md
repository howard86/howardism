## Why

Two outstanding high-severity security defects sit on the same trust boundary — the recipe app's handoff between the browser, its Next.js Pages-API layer, and the Strapi CMS:

1. **#565 — JWT in Redux/JS-readable state.** After login, `redux/slices/auth.ts` stores the CMS JWT directly in Redux state and writes it onto `api.defaults.headers.common.Authorization`. Any XSS vulnerability — in our code, a dependency, or a third-party script — immediately exfiltrates the token. The token grants CMS write access for the session's lifetime. An HttpOnly cookie moves the token out of reach of `document.cookie` and `window.*`, so XSS alone is no longer sufficient to lift a token.
2. **#547 — Unvalidated recipe ID flows into CMS URL.** `getRecipeById(id)` interpolates the caller-supplied `id` into `/recipes/${id}` with no validation and no URL encoding. `getStaticProps` in `pages/recipe/[id].tsx` passes `context.params.id` straight through. A crafted `id` such as `..%2Fadmin%2Fusers` (or decoded `..\admin\users`) can traverse the CMS path and surface internal endpoints the CMS might otherwise auth-gate at the exact `/recipes/:id` shape only. Strapi doesn't normalize arbitrary paths, but depth-of-defense requires the caller validate anyway — unencoded `/` in an `id` is never a legitimate recipe identifier.

Both defects sit on the boundary where the app wraps a CMS — same file cluster (`services/recipe.ts`, `services/auth.ts`, `services/cms.ts`, `pages/api/**`), same "don't trust what you pass downstream" cross-cut. One change, one PR.

## What Changes

### #565 — JWT → HttpOnly cookie

- **Server: set cookie on login.** `pages/api/auth/login.ts` SHALL, on successful CMS login, issue a `Set-Cookie` header for `recipe_auth` with the returned JWT. Cookie attributes: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age=604800` (7 days), `Secure` when `NODE_ENV === "production"`. Response body drops the JWT entirely — returns `{ success: true }`.
- **Server: new logout route.** `pages/api/auth/logout.ts` SHALL clear `recipe_auth` by issuing a `Set-Cookie` with `Max-Age=0`. Idempotent — works whether or not the cookie is present.
- **Server: cookie-as-source for JWT consumers.** `pages/api/auth/me.ts` and `pages/api/recipe/create.ts` SHALL read the token from `req.cookies.recipe_auth` (or via a `getAuthToken` helper in `pages/api/_lib/auth-cookie.ts`) instead of from request headers (`recipe-token`) or `Authorization: Bearer …`. The `bearerTokenSchema` in `pages/api/recipe/schemas.ts` is retired; the authorization gate becomes presence-check-on-cookie.
- **Server: service-layer signature cleanup.** `services/recipe.ts:createRecipe` changes from `(recipe, authHeader)` to `(recipe, jwt)`; the service builds `Authorization: \`Bearer ${jwt}\`` internally. Callers can no longer leak a raw header to the service boundary.
- **Client: drop JWT from Redux state.** `redux/slices/auth.ts` `AuthState` shrinks from `{ isLoggedIn, jwt }` to `{ isLoggedIn }`. `authLogin.fulfilled` flips `isLoggedIn` based on response status, does NOT store a token. `authLogout` posts to `/api/auth/logout` (the server clears the cookie) and flips `isLoggedIn = false`.
- **Client: drop header-mutation helpers.** `redux/api.ts` `updateAuthorizationHeader` / `deleteAuthorizationHeader` are deleted. The browser attaches the `recipe_auth` cookie to same-origin `/api/*` calls automatically — axios has no work to do for auth.
- **Client: `useAuth` logout becomes async.** The hook's `logout` awaits the logout-post-and-dispatch so the server-side clear happens before a follow-up read.
- **Types.** `types/auth.d.ts` `LoginResponse` drops `jwt`; becomes `{ success: boolean }` (or is removed — clients can derive success from HTTP status).

### #547 — Recipe-ID hygiene

- **Validate in the service layer.** `services/recipe.ts:getRecipeById` SHALL reject any `id` that does not match `/^[A-Za-z0-9_-]{1,64}$/` — the allow-list that covers Strapi v4 numeric IDs and v5 documentId (24-char hex) without admitting slashes, `..`, `%`, or control chars. Rejection returns `null` without an outbound fetch.
- **Defense-in-depth URL encoding.** Even after the allow-list admits an `id`, `encodeURIComponent(id)` SHALL be interpolated into the URL path. The allow-list already forbids the chars that would need escaping, but the encoding preserves correctness if the allow-list is ever loosened.
- **Validate at page ingress.** `pages/recipe/[id].tsx:getStaticProps` SHALL apply the same regex to `context.params.id` and return `{ notFound: true }` on mismatch, avoiding an unnecessary CMS round-trip and presenting the attacker with a clean 404 (matching legitimate missing-recipe behavior — no signal that the input was malformed).

## Capabilities

### New Capabilities

- `recipe-auth-cookie` — HttpOnly-cookie-backed authentication for the recipe app's CMS gateway, replacing the prior token-in-JS flow.
- `recipe-cms-id-hygiene` — allow-list validation and URL encoding for CMS-bound recipe identifiers.

## Impact

- **Code**: `apps/recipe/src/pages/api/auth/{login,logout,me}.ts`, new `apps/recipe/src/pages/api/_lib/auth-cookie.ts`, `apps/recipe/src/pages/api/recipe/{create,schemas}.ts`, `apps/recipe/src/services/{auth,recipe}.ts`, `apps/recipe/src/pages/recipe/[id].tsx`, `apps/recipe/src/redux/{api,slices/auth}.ts`, `apps/recipe/src/hooks/useAuth.tsx`, `apps/recipe/src/types/auth.d.ts`.
- **Dependencies**: add `cookie@^0.7` to `apps/recipe/package.json` for `Set-Cookie` serialization (already a Next.js transitive dep; promoting to direct keeps the import graph explicit). `@types/cookie` is bundled with the `cookie` package since v1; no separate `@types` install required.
- **Environment**: none.
- **Tests**: updated `pages/api/auth/login.test.ts` (assert `Set-Cookie` header, body has no `jwt`), new `pages/api/auth/logout.test.ts`, new `pages/api/auth/me.test.ts` (cookie-read path), updated `pages/api/recipe/create.test.ts` (cookie-read in place of `Authorization: Bearer`), new `services/__tests__/recipe.test.ts` (path-traversal regression cases), new `services/__tests__/getRecipeById.test.ts` (allow-list).
- **Issues auto-closed on merge**: `Fixes #565`, `Fixes #547`.
- **Migration note for existing sessions.** A JWT currently held in a browser's Redux Persist blob (if any persistence is on — check `apps/recipe/src/redux/store.ts` in the archaeology step) becomes inert; users re-log-in once. No backwards-compat shim.
