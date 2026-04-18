## Why this shape

### Shipping the helper as a hand-authored `.mjs` workspace

`next.config.mjs` is loaded by the bare Node process that spawns Next — it is NOT transpiled by Next's webpack loader, Bun's TS runtime, or `transpilePackages`. So any shared helper imported from `next.config.*` must already be valid JavaScript on disk at resolve time.

Three options were considered:

1. **Author in `.ts`, compile to `dist/` with `tsc`, commit the output.** Gives single-source-of-truth TS but introduces a build step and committed generated files. Requires turborepo pipelining because the helper must exist on disk before any consumer app loads its config.
2. **Author in `.ts`, add a pre-install hook that runs the compile.** Avoids committing generated files but breaks `bun install --frozen-lockfile` / CI determinism.
3. **Author in `.mjs` with a sibling `.d.ts`.** No build, no generated checked-in files, types still surface in monorepo consumers. Cost: you can't use TS syntax in the `.mjs`; JSDoc `@typedef` imports from the `.d.ts` recover the annotations.

We picked (3). The surface is ~60 lines of pure data manipulation; TS syntax gains nothing here, and the no-build property keeps `bun install && next dev` friction-free for every fresh clone.

### Existing monorepo packages ship `.ts` directly — why not here?

`@howardism/components-common` and `@howardism/test-config` both ship raw `.ts`. That works because their consumers are either transpiled by Next (`transpilePackages`) or loaded by Bun (`bun:test` preload). `@howardism/security-headers` is a third consumption shape — Node-at-config-load — that neither of those tricks covers. The `.mjs` authoring pattern doesn't replace the `.ts` pattern; it extends it for a different consumer class.

### Converging `next.config.js` → `.mjs`

`apps/blog/next.config.mjs` was already ESM; `apps/github-search/next.config.js` and `apps/recipe/next.config.js` were CJS. Rather than dual-ship the helper (CJS + ESM), we converted the two holdouts to `.mjs`. Rationale:

- The only CJS-ism in either file was `require()` + `module.exports =`; both have 1:1 ESM equivalents with no behavioural change.
- Dual-shipping means either a build step or carefully authored wrapper files that pretend to be both. Both are moving parts we don't need.
- The repo's direction is already ESM (blog, eslint-config-howardism flat configs, turbo 2 tasks).

### Default CSP tradeoffs

Default directives:

| Directive | Value | Reasoning |
|---|---|---|
| `default-src` | `'self'` | Strict fallback for anything unspecified. |
| `script-src` | `'self' 'unsafe-inline' 'unsafe-eval'` | Next.js 14/16 emits inline runtime scripts without nonce plumbing, and webpack dev mode calls `eval`. Dropping `'unsafe-eval'` breaks `next dev`. Deferred to CSP v2 (nonce middleware). |
| `style-src` | `'self' 'unsafe-inline'` | Tailwind + CSS-in-JS libraries emit inline styles. Removing `'unsafe-inline'` breaks every app. |
| `img-src` | `'self' https: data: blob:` | Covers remote images, `data:` previews, and `blob:` for canvas/file-picker flows. |
| `font-src` | `'self' data:` | `data:` covers bundled base64 fonts. |
| `connect-src` | `'self' https:` | Permissive by default; apps tighten per-origin. |
| `frame-ancestors` | `'none'` | Pairs with the existing `X-Frame-Options: DENY`. |
| `base-uri` | `'self'` | Blocks `<base>` injection. |
| `form-action` | `'self'` | Blocks cross-origin form exfil. |
| `object-src` | `'none'` | Kills Flash/PDF embed surface. |
| `upgrade-insecure-requests` | bare | Forces http→https on same-origin subresources. |

This is NOT a tight CSP. It's a defense-in-depth layer that blocks whole-page iframe framing, cross-origin form submits, `<object>` embeds, and protocol downgrades — without breaking Next.js's inline runtime. Follow-up work (nonce-based `script-src`, drop `'unsafe-inline'` from `style-src` via hashed Tailwind output) is the real payoff.

### Enforce vs report-only as the shipping default

Plan prompt: "Report-only header first for 1 release cycle? No — scope is tight; ship enforce mode, note in design.md that a rollback is one header swap."

Acted on. `cspReportOnly` is an opt-in flag, not the default. Rollback path is a one-line edit in the affected app's `next.config.mjs` (`cspReportOnly: true` or `contentSecurityPolicy: false`) + redeploy — no package change.

### Wholesale replace vs merge semantics

`contentSecurityPolicy: { "connect-src": ["'self'", "..."] }` REPLACES the default, not a merge. Merging was considered and rejected: the non-obvious behaviour of "I overrode connect-src and now I still have `upgrade-insecure-requests` I forgot about" is worse than the explicit spread pattern we document (`...DEFAULT_CSP_DIRECTIVES, "connect-src": [...]`). The spread makes additions visible at the call site.

### Why freeze `DEFAULT_CSP_DIRECTIVES`

Apps spread it into their override object. If an app also mutated the source (e.g. via `push`), it would leak into every other app in the same process. `Object.freeze` prevents that at the cost of a single runtime assertion.
