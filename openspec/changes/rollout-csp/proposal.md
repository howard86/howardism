## Why

None of the three Next.js apps (`blog`, `github-search`, `recipe`) set a `Content-Security-Policy` header. Every other OWASP-tier response header is present via `apps/blog/src/config/securityHeaders.ts` (blog) or an inline duplicate in the two CJS `next.config.js` files (github-search, recipe). Three consequences follow:

1. **XSS mitigation is one-dimensional.** HSTS, `X-Frame-Options`, and a frozen `X-XSS-Protection: 0` don't compensate for the absence of any resource-origin policy, so a reflected or stored XSS gains full network + DOM reach.
2. **Helper drift.** The blog's `getSecurityHeaders` helper exists but isn't imported by `next.config.mjs` — the production config still copy-pastes the header array, and the other two apps copy-paste it independently. #559 tracks the missing CSP, but #532 was already opened on the duplication itself.
3. **Mixed-module posture.** `github-search` and `recipe` still use CJS `next.config.js`; `blog` is ESM. Publishing a cross-workspace helper means either dual-shipping or converging on one format.

## What Changes

- Create a new workspace package `@howardism/security-headers` that ships hand-authored ESM (`src/index.mjs` + sibling `src/index.d.ts`, no build step) so it can be consumed by Node at `next.config.*` load time without a transpile pass.
- Re-implement the existing header helper inside that package, extend its API with `contentSecurityPolicy` (defaulting to a hardened baseline — `default-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `upgrade-insecure-requests`, etc.) and `cspReportOnly` toggle. Expose `DEFAULT_CSP_DIRECTIVES` so apps can spread+override specific directives without rebuilding the policy from scratch.
- Delete `apps/blog/src/config/securityHeaders.ts` + test; replace the inline header arrays in all three apps' configs with a call to `getSecurityHeaders(...)`.
- Convert `apps/github-search/next.config.js` and `apps/recipe/next.config.js` to ESM `.mjs` so they can `import` the new package; blog's config is already `.mjs`.
- Each app supplies a per-app CSP override only where its default is insufficient: blog widens `connect-src`/`img-src`/`worker-src` for Mapbox + Vercel Analytics + data blobs; github-search widens `connect-src` for `api.github.com`; recipe stays on defaults (`https:` in img/connect covers Cloudinary + its CMS).

## Capabilities

### New Capabilities

- `web-security-headers`: Shared builder returning the Next.js `headers()` array used by every Howardism Next.js app. Must emit the six legacy hardening headers plus a CSP that is enforced by default, with per-app override and report-only escape hatches.

### Modified Capabilities

_(none — no existing `openspec/specs/` capability covers security headers.)_

## Impact

- **Code**:
  - **New** `packages/security-headers/{package.json,tsconfig.json}`
  - **New** `packages/security-headers/src/index.mjs`
  - **New** `packages/security-headers/src/index.d.ts`
  - **New** `packages/security-headers/src/index.test.ts`
  - **Edit** `apps/blog/next.config.mjs`, `apps/blog/package.json`
  - **Delete** `apps/blog/src/config/securityHeaders.ts`, `apps/blog/src/config/securityHeaders.test.ts`
  - **Replace** `apps/github-search/next.config.js` → `apps/github-search/next.config.mjs`; edit `apps/github-search/package.json`
  - **Replace** `apps/recipe/next.config.js` → `apps/recipe/next.config.mjs`; edit `apps/recipe/package.json`
- **APIs**: none (config-time only).
- **Dependencies**: new internal workspace dep `@howardism/security-headers` in the three apps. No new third-party deps.
- **Auth/session**: n/a.
- **Data model**: n/a.
- **Rollback**: swap the `contentSecurityPolicy` option to `false` (or `cspReportOnly: true`) in the affected app's `next.config.mjs`, redeploy — no code revert needed.
- **GitHub issues closed**: #559; incidentally #532 (helper duplication).
- **Follow-up**: nonce-based `script-src` + `style-src` via middleware-generated nonces is deferred — today's default keeps `'unsafe-inline'` + `'unsafe-eval'` because Next.js 14/16 emits inline runtime scripts without nonce plumbing. Filed mentally as the obvious CSP v2.
