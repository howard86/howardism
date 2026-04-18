## 0. Code archaeology (must precede plan)

- [x] 0.1 Confirm the recipe app has no `redux-persist` or equivalent client-side storage of Redux state (grep `persistReducer`, `redux-persist`, `localStorage` under `apps/recipe/src/redux`) — needed to rule out a migration for stored JWTs.
- [x] 0.2 Enumerate consumers of `state.auth.jwt` (expect two: `redux/slices/auth.ts`, any component destructuring `jwt`). Confirm only `isLoggedIn` is read outside the slice itself (`hooks/useAuth.tsx`).
- [x] 0.3 Enumerate callers of `api.defaults.headers.common.Authorization` / `updateAuthorizationHeader` / `deleteAuthorizationHeader` — should be contained to `redux/api.ts` + `redux/slices/auth.ts`.
- [x] 0.4 Confirm `cms.post("recipes", …)` at `services/recipe.ts:31` is the only caller of the header-injected CMS write path; `getRecipes()` + `getRecipeById()` do NOT attach auth (read endpoints on Strapi are public in this app).
- [x] 0.5 Confirm `cookie@^0.7` is resolvable in the workspace (it's already a Next.js transitive dep); plan to add it as a direct dependency of `apps/recipe` so the import graph is explicit.
- [x] 0.6 Confirm the page caller `pages/recipe/[id].tsx:89` is the only caller of `getRecipeById`; tests in `src/pages/api/` don't exercise this path so no mock updates needed there.

## 1. Recipe-ID allow-list + encoding (R1 — issue #547)

- [ ] 1.1 Add failing tests in `apps/recipe/src/services/__tests__/recipe.test.ts` for `getRecipeById`:
  - (a) allow-listed ID `"abc123"` → proceeds (mock cms.get, assert URL path is `/recipes/abc123`)
  - (b) numeric ID `"42"` → proceeds
  - (c) 24-char hex ID (Strapi v5 documentId shape) → proceeds
  - (d) regression: ID containing `/` (`"../etc/passwd"`) → returns `null` without calling `cms.get`
  - (e) regression: ID containing `%` (`"..%2Fetc%2Fpasswd"`) → returns `null`
  - (f) regression: ID containing control chars (`"abc\x00def"`) → returns `null`
  - (g) empty string → returns `null`
  - (h) oversized ID (>64 chars) → returns `null`
- [ ] 1.2 Define a top-level `RECIPE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/` in `apps/recipe/src/services/recipe.ts` (top-level per Ultracite `useTopLevelRegex`).
- [ ] 1.3 Rewrite `getRecipeById(id)` in `apps/recipe/src/services/recipe.ts` to: `if (!RECIPE_ID_PATTERN.test(id)) return null;` then `cms.get<Recipe>(\`/recipes/${encodeURIComponent(id)}\`)` — both the allow-list and the encoding land, belt-and-braces.
- [ ] 1.4 Add matching validation in `apps/recipe/src/pages/recipe/[id].tsx:getStaticProps`: if `context.params.id` fails the same regex, return `{ notFound: true }`. Share the pattern via export from `services/recipe.ts` (NOT via a new barrel).
- [ ] 1.5 `cd apps/recipe && bun test src/services/__tests__/recipe.test.ts` → all green.

## 2. Cookie helper + login handler (R2 — issue #565)

- [ ] 2.1 Create `apps/recipe/src/pages/api/_lib/auth-cookie.ts` exporting `AUTH_COOKIE_NAME = "recipe_auth" as const`, `serializeAuthCookie(jwt: string): string`, `serializeClearAuthCookie(): string`, and `getAuthToken(req: NextApiRequest): string | null`. `serializeAuthCookie` uses `cookie.serialize` with `httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7, secure: process.env.NODE_ENV === "production"`. `serializeClearAuthCookie` emits the same cookie name with `maxAge: 0`.
- [ ] 2.2 Add `cookie@^0.7.2` to `apps/recipe/package.json` dependencies; run `bun install`.
- [ ] 2.3 Update `apps/recipe/src/pages/api/auth/login.test.ts`:
  - Assert `res.setHeader` called with `"Set-Cookie"` and a value containing `"recipe_auth="`, `"HttpOnly"`, `"SameSite=Lax"`, `"Path=/"`, `"Max-Age=604800"`.
  - Assert the response body passed to `send` is `{ success: true }` (NO `jwt` key).
- [ ] 2.4 Rewrite `apps/recipe/src/pages/api/auth/login.ts`:
  - On success, `res.setHeader("Set-Cookie", serializeAuthCookie(jwt))`.
  - Respond `{ success: true }` — no JWT in body.
- [ ] 2.5 `bun test src/pages/api/auth/login.test.ts` → all green.

## 3. Logout handler (R2 — issue #565)

- [ ] 3.1 Add new `apps/recipe/src/pages/api/auth/logout.test.ts` covering: POST returns 200 and sets a `Set-Cookie` header that clears `recipe_auth` (`Max-Age=0`); non-POST returns 405.
- [ ] 3.2 Create `apps/recipe/src/pages/api/auth/logout.ts` — `POST` only; sets the clear cookie; responds `{ success: true }`.
- [ ] 3.3 `bun test src/pages/api/auth/logout.test.ts` → green.

## 4. Cookie-as-source for protected handlers (R2 — issue #565)

- [ ] 4.1 Add new `apps/recipe/src/pages/api/auth/me.test.ts`:
  - 400 when `req.cookies.recipe_auth` is absent
  - 200 with account info when present and verify() succeeds
  - 403 when verify() throws (invalid/expired token)
  - 405 on non-GET
- [ ] 4.2 Rewrite `apps/recipe/src/pages/api/auth/me.ts` to use `getAuthToken(req)` instead of `req.headers["recipe-token"]`. Drop the `recipe-token` header contract entirely.
- [ ] 4.3 Update `apps/recipe/src/pages/api/recipe/create.test.ts`:
  - Remove the `bearerTokenSchema`-based cases (missing/non-Bearer/short).
  - Add a "missing cookie" case → 401, no `createRecipe` call.
  - Happy path: `req.cookies = { recipe_auth: "valid-token-abc" }` → `createRecipe` called with `(validRecipe, "valid-token-abc")` (raw JWT, NOT `"Bearer valid-token-abc"`).
- [ ] 4.4 Rewrite `apps/recipe/src/pages/api/recipe/create.ts`:
  - Replace `bearerTokenSchema.safeParse(req.headers.authorization)` with `const jwt = getAuthToken(req); if (jwt === null) return res.status(401).send({ success: false });`.
  - Pass raw `jwt` to `createRecipe`.
- [ ] 4.5 Delete `bearerTokenSchema` from `apps/recipe/src/pages/api/recipe/schemas.ts` — no callers remain.
- [ ] 4.6 `bun test src/pages/api/auth src/pages/api/recipe` → all green.

## 5. Service-layer signature cleanup (R2 — issue #565)

- [ ] 5.1 Change `createRecipe` in `apps/recipe/src/services/recipe.ts` from `(recipe, authHeader)` to `(recipe, jwt)`. Inside the function, construct `Authorization: \`Bearer ${jwt}\``. Callers pass only the raw JWT.
- [ ] 5.2 `bun run type-check` at root → green (catches any stale caller).

## 6. Client-side Redux simplification (R2 — issue #565)

- [ ] 6.1 Delete `updateAuthorizationHeader` and `deleteAuthorizationHeader` from `apps/recipe/src/redux/api.ts`. The file becomes the axios-instance-only module.
- [ ] 6.2 In `apps/recipe/src/redux/slices/auth.ts`:
  - Shrink `AuthState` to `{ isLoggedIn: boolean }`.
  - `authLogin.fulfilled`: `state.isLoggedIn = action.payload.success` only; drop JWT writes and `updateAuthorizationHeader` call.
  - `authLogout`: becomes an async thunk that POSTs `/api/auth/logout` and returns the response. Reducer on `authLogout.fulfilled` resets to `initialState`. Delete the `deleteAuthorizationHeader` call.
- [ ] 6.3 Update `apps/recipe/src/hooks/useAuth.tsx` `logout` to `async (): Promise<void>`; `await dispatch(authLogout())`.
- [ ] 6.4 Update `apps/recipe/src/types/auth.d.ts` — drop `jwt` from `LoginResponse` (becomes `{ success: boolean }`); retain `Account` and `VerifyResponse` unchanged.
- [ ] 6.5 `bun run type-check` at root → green.

## 7. Verification

- [ ] 7.1 `cd apps/recipe && bun test` → all green (expect new tests to dominate the delta).
- [ ] 7.2 `bun run type-check` at root → green.
- [ ] 7.3 `bun run lint` at root → green (no `useTopLevelRegex`, no `noBarrelFile` violations; the shared pattern export lives in `services/recipe.ts`, not a barrel).
- [ ] 7.4 Manual smoke: `cd apps/recipe && bun run dev`, sign in, open devtools → Application → Cookies: `recipe_auth` visible, `HttpOnly` + `SameSite=Lax` attributes checked, no JS-visible cookie (`document.cookie` in console returns empty string for the recipe cookie). Create a recipe via `/create`. Visit `/recipe/42` (valid) → renders. Visit `/recipe/..%2Fetc%2Fpasswd` → 404, no CMS round-trip in Network tab. Log out, confirm the cookie is cleared.

## 8. OpenSpec bookkeeping

- [x] 8.1 `openspec/changes/recipe-auth-and-id-hardening/.openspec.yaml`
- [x] 8.2 `openspec/changes/recipe-auth-and-id-hardening/proposal.md`
- [x] 8.3 `openspec/changes/recipe-auth-and-id-hardening/tasks.md` (this file)
- [ ] 8.4 `openspec/changes/recipe-auth-and-id-hardening/design.md` — cookie attribute rationale, allow-list rationale, why one PR for two issues
- [ ] 8.5 `openspec/changes/recipe-auth-and-id-hardening/specs/recipe-auth-cookie/spec.md` — ADDED requirements for cookie issue, clear, consumption
- [ ] 8.6 `openspec/changes/recipe-auth-and-id-hardening/specs/recipe-cms-id-hygiene/spec.md` — ADDED requirements for allow-list + encoding
- [ ] 8.7 `bunx openspec validate recipe-auth-and-id-hardening` → clean.
