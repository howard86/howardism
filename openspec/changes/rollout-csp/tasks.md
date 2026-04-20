## 1. New shared workspace

- [x] 1.1 Create `packages/security-headers/package.json` with `"type": "module"`, `exports.` pointing at `src/index.mjs`, `types` at `src/index.d.ts`, and a `@howardism/tsconfig` workspace devDep.
- [x] 1.2 Create `packages/security-headers/tsconfig.json` extending `@howardism/tsconfig/base` with `allowJs` + `noEmit` so TS can type-check the hand-authored `.mjs`.
- [x] 1.3 Run `bun install` from the repo root so workspace symlinks resolve.

## 2. Header helper + CSP implementation

- [x] 2.1 Re-author the six hardening headers inside `src/index.mjs` as `getSecurityHeaders({ geolocation })`, matching the legacy helper's output byte-for-byte.
- [x] 2.2 Add `CspDirectives` type, `DEFAULT_CSP_DIRECTIVES` export (frozen), and `serializeCsp()` helper that joins `"<directive> <source> <source>"` segments with `"; "` and emits bare tokens for `upgrade-insecure-requests` / `block-all-mixed-content`.
- [x] 2.3 Add `contentSecurityPolicy?: CspDirectives | false` option; `false` suppresses the CSP header entirely, `undefined` emits the default, a directives object replaces the default wholesale.
- [x] 2.4 Add `cspReportOnly?: boolean` option that switches the header key from `Content-Security-Policy` to `Content-Security-Policy-Report-Only`.
- [x] 2.5 Mirror the API in `src/index.d.ts` — `SecurityHeader`, `CspDirectiveName`, `CspDirectives`, `SecurityHeaderOptions`.

## 3. Package-level test coverage

- [x] 3.1 Assert the six legacy headers are emitted and `Permissions-Policy` honours `geolocation`.
- [x] 3.2 Assert `Content-Security-Policy` is emitted by default, contains `default-src 'self'`, `frame-ancestors 'none'`, and `upgrade-insecure-requests`.
- [x] 3.3 Assert `contentSecurityPolicy: false` suppresses the CSP header entirely.
- [x] 3.4 Assert a passed directives object replaces the default wholesale (no merge).
- [x] 3.5 Assert `cspReportOnly: true` swaps the header key.
- [x] 3.6 Assert `serializeCsp` throws when a non-bare directive is handed `true`.
- [x] 3.7 Assert `DEFAULT_CSP_DIRECTIVES` is frozen.

## 4. Migrate the three apps

- [x] 4.1 `apps/blog`: import from `@howardism/security-headers`, delete the legacy `src/config/securityHeaders{,.test}.ts`, override `connect-src`/`img-src`/`worker-src` for Mapbox + Vercel Analytics, add the workspace dep to `package.json`.
- [x] 4.2 `apps/github-search`: rename `next.config.js` → `.mjs`, switch to ESM `import`, override `connect-src` for `https://api.github.com`, add the workspace dep.
- [x] 4.3 `apps/recipe`: rename `next.config.js` → `.mjs`, switch to ESM `import`, use default CSP directives untouched, add the workspace dep.

## 5. Verification

- [x] 5.1 `bun test packages/security-headers` — all 13 pass.
- [x] 5.2 `bun run type-check` in each of `apps/blog`, `apps/github-search`, `apps/recipe` — clean.
- [x] 5.3 `bun run lint` in each of the three apps — clean.
- [x] 5.4 `node --input-type=module -e "import('@howardism/security-headers').then(...)"` from each app — workspace resolution succeeds.
- [ ] 5.5 Manual smoke: `bun run build && bun run start` each app; `curl -I` the home page and grep for `Content-Security-Policy`; load in Chrome, verify devtools console has **no** CSP violations on the home page.
