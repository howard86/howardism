# Design — `recipe-auth-and-id-hardening`

## Scope

Two high-severity defects at the recipe app's CMS boundary, bundled because they share the same file cluster and the same cross-cutting principle (don't trust what flows downstream):

- **#565** — CMS JWT stored in Redux state + on `axios.defaults.headers`. XSS = token theft.
- **#547** — `getRecipeById(id)` passes caller-supplied `id` unvalidated + unencoded into the CMS URL. Path-traversal risk.

## Key decisions

### D1 — HttpOnly cookie, not sessionStorage, not Redis-backed session

**Options considered:**

| Option | Pros | Cons |
|---|---|---|
| **HttpOnly cookie (`recipe_auth`)** (chosen) | Zero JS exposure — not reachable from `document.cookie` or `window.*`; browser-attached on same-origin `/api/*` calls with no axios config; 7-day lifetime matches previous UX | Cookie is sent on every same-origin request — slight bandwidth uptick; CSRF surface appears on state-changing routes |
| `sessionStorage` | Still no meaningful improvement over Redux state — readable by any JS on the page | Same XSS exposure as today |
| Server-side session (Redis or Strapi session lookup) | Rotates token, adds server session knobs | Overkill — no session state to manage; Strapi returns a signed JWT that's already self-validating |
| Move JWT to a Next.js server action / middleware-only context | Token never reaches client | Requires App Router migration + much heavier refactor |

Chose the cookie because it fully closes the XSS window with the smallest surface change — login sets the cookie, browsers attach it automatically, server reads it, client never touches it.

**CSRF note.** `SameSite=Lax` blocks cross-site POSTs from a third-party origin following a link (which is how CSRF typically lands). This app has no cross-site state-changing flows, and the only mutating endpoint (`/api/recipe/create`) is called from first-party JS via axios. If we later add forms posted from other origins we'll layer a CSRF token; for now Lax is sufficient.

### D2 — Cookie name and attributes

- `name: "recipe_auth"` — keeps the app prefix; avoids colliding with a different app on the same domain during local-dev on shared ports.
- `httpOnly: true` — non-negotiable; the whole point of the change.
- `sameSite: "lax"` — see D1 CSRF note.
- `path: "/"` — cookie attaches to both page navigation and `/api/*` same-origin calls.
- `secure: process.env.NODE_ENV === "production"` — `Secure` requires HTTPS; enabling it in dev breaks `http://localhost:3000`. The gate is standard Next.js convention.
- `maxAge: 60 * 60 * 24 * 7` (7 days) — the previous flow had no explicit client-side expiry (JWT validity was CMS-controlled). 7 days keeps UX unchanged while giving a client-side revocation knob (logout).

### D3 — Allow-list pattern for recipe IDs

`^[A-Za-z0-9_-]{1,64}$` covers:

- Strapi v4 numeric IDs: digits only (e.g. `42`).
- Strapi v5 `documentId`: 24-char cuid-ish (alphanumeric + `-`).
- Realistic upper bound of 64 chars to forbid absurdly long inputs without cutting into legitimate shapes.
- Excludes: `/`, `\`, `%`, `.`, whitespace, control chars — every char a path-traversal payload would need.

**Why not use the CMS's ID schema directly?** Strapi doesn't publish a regex; schemas vary across versions. A conservative allow-list is stable across CMS upgrades — a CMS change that introduces a new ID shape gets caught at the service-layer boundary and surfaces as a 404, which is the correct failure mode.

**Why both allow-list AND `encodeURIComponent`?** The allow-list is the primary defense; the encoder is belt-and-braces. If the allow-list is ever loosened (say, to admit `:` for a namespaced ID), the encoder prevents any newly-permitted special char from reshaping the URL path. The cost of the encoder is one function call.

### D4 — Share the regex via the service module, not a new barrel

The same pattern is used in `services/recipe.ts` and `pages/recipe/[id].tsx`. Three options:

| Option | Verdict |
|---|---|
| Inline-duplicate | rejected — drift risk |
| Export `RECIPE_ID_PATTERN` from `services/recipe.ts` | **chosen** — single source of truth, no new file, Ultracite-compliant (top-level regex) |
| Create `services/constants.ts` barrel | rejected — Ultracite's `noBarrelFile` flags barrels; a single shared regex doesn't justify a new barrel |

### D5 — Why retire `bearerTokenSchema` entirely

`bearerTokenSchema = z.string().regex(/^Bearer .+/)` validates the CLIENT-supplied header shape. Post-cookie, the client doesn't supply a header at all — the browser sends the cookie, the server reads it. Schema validation on a header we don't read anymore is dead code. Removing it shrinks the trust surface.

### D6 — Signature change: `createRecipe(recipe, jwt)` not `createRecipe(recipe, authHeader)`

The service used to take a full `Authorization: Bearer <jwt>` string. Passing a full header around couples the service to HTTP specifics and makes it possible for the API-route layer to pass the WRONG header (e.g., `Basic`). Passing the raw JWT and letting the service construct the header is the straightforward contract — service knows it's talking to a Bearer-expecting CMS, caller knows it has a user JWT.

### D7 — Retain API-route layer (don't collapse into Server Action)

Recipe app is on the Pages Router. Moving to App Router server actions to "eliminate the network hop" is out of scope — would require rewriting the routing + data-fetching model for a single endpoint. The Pages API layer stays; the cookie read happens there.

## Risks

1. **Session-invalidation UX.** Users currently authenticated via the old Redux-stored JWT become "logged out" on first load after deploy. No server session to migrate. The UI already handles unauthenticated state (signin page). Mitigation: none needed — one-time re-login is acceptable for a security fix.
2. **Dev HTTPS gap.** `Secure` is off in dev, so a MITM on localhost could observe the cookie. Local-dev MITM is out of threat model.
3. **CSRF drift.** If we later accept cross-site state-changing requests, `SameSite=Lax` alone isn't enough — need a CSRF token. Flagged in D1; not addressed in this change.
4. **Allow-list over-restriction.** If Strapi's future ID format includes `:` or `.`, the regex rejects legitimate IDs and all recipe pages 404. Mitigation: change is centralized in one constant; a follow-up one-liner updates it. Failure mode is visible (404 on every page) not silent.

## Out of scope

- App-Router migration for the recipe app (architectural rewrite, separate change).
- CSRF token layer (see D1).
- Strapi-side RBAC or per-user recipe ownership (this app currently trusts any valid-JWT holder to write — tightening is orthogonal).
