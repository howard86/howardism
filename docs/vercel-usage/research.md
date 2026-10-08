# Vercel usage reduction: research (2026-10-08)

Project state read from the repo: `next` `^16.3.5` (installed 16.3.5, `apps/blog/node_modules/next/package.json`), `apps/blog/vercel.json` = `{"bunVersion":"1.4.x","buildCommand":"cd ../.. && bun run build"}`, dashboard build command `cd ../../ && bun run build -- --filter=@howardism/blog` (`vercel project inspect`), root directory `apps/blog`, project Node setting 22.x. `next.config.ts` has no `cacheComponents`, `partialPrefetching` or `experimental.dynamicOnHover`. Article page exports `dynamicParams = false` and `revalidate = false` (`src/app/(blog)/articles/[slug]/page.tsx:18-19`).

Measured live against production with `curl` (read-only, UA `research-probe`), for `/articles/asynchronous-rl-for-llms`:

| Request | Result |
|---|---|
| full HTML | 308,501 bytes, `x-vercel-cache: HIT`, `x-nextjs-prerender: 1`, `x-nextjs-stale-time: 300`, `cache-control: public, max-age=0, must-revalidate` |
| RSC prefetch (`RSC: 1`, `Next-Router-Prefetch: 1`) | 160,536 bytes |
| `/rss/feed.xml` | 548,347 bytes, `x-vercel-cache: HIT`, age 88780s |
| `/llms.txt` | 348,762 bytes, `x-vercel-cache: HIT` |

ISR read units are 8 KB each (Q5), so one uncached prefetch is roughly 20 units uncompressed. The feed is roughly 68. Compression of stored ISR data is documented ("automatic compression of ISR writes"), so treat these as upper bounds.

---

## 1. Next 16 `<Link>` prefetch

**Installed source** (`apps/blog/node_modules/next/dist/client/app-dir/link.js`):
- L108-110: `prefetchEnabled = prefetch !== false`; `prefetchIntent = false -> 'none'`, `true -> 'full'`, anything else (`undefined`/`null`/`"auto"`) -> `'auto'`.
- L403-415 `getFetchStrategyFromPrefetchIntent`: without `__NEXT_CACHE_COMPONENTS`, `'auto'` -> `FetchStrategy.PPR`, and `'full'` -> `FetchStrategy.Full`. That means `undefined`, `null` and `"auto"` behave the same.
- `client/components/links.js` L134-153 `mountLinkInstance`: viewport observation is set up only when `prefetchEnabled`. L217-230 `onLinkVisibilityChanged`: viewport prefetch is skipped when `NODE_ENV !== 'production'` and otherwise reschedules at default priority.
- `link.js` L351 (`onMouseEnter`) and L367 (`onTouchStart`): `if (!prefetchEnabled) return;`. So **`prefetch={false}` disables hover and touch prefetch too**, not only viewport prefetch. `onMouseEnter` also returns early in development.
- L354/370 and `links.js` L236-246: `unstable_dynamicOnHover` upgrades the strategy to `Full` on intent, but only acts when `process.env.__NEXT_DYNAMIC_ON_HOVER` is set. `build/define-env.js:125` ties that to `experimental.dynamicOnHover`, and `server/config-shared.js:205` defaults it to `false`. It only upgrades the hover fetch for dynamic routes. It does not suppress viewport prefetch, so it is not the option we need.

**Docs (Next 16.4.0, last updated 2026-10-05/09):**
- https://nextjs.org/docs/app/api-reference/components/link#prefetch: `"auto"` or `null` (default): "For static routes, the full route will be prefetched (including all its data)". `true`: full route for static and dynamic. `false`: "Prefetching will never happen both on entering the viewport and on hover". "Prefetching is only enabled in production".
- https://nextjs.org/docs/app/guides/prefetching: static page, no `loading.js`: "Prefetched payload: Entire page", client cache TTL 5 min (`staleTimes.static`). Scheduler order: viewport links first, then hover/touch intent.
- The same guide gives the supported pattern for hover-only prefetch, which "limits prefetching to routes the user is more likely to visit":
  ```tsx
  const [active, setActive] = useState(false)
  <Link href={href} prefetch={active ? null : false} onMouseEnter={() => setActive(true)}>
  ```
  The `active` state flips `prefetchEnabled` on, so the link mounts its observer and, since it is hovered and visible, prefetches then.
- `partialPrefetching` (an App Shell per route, shared across links) "requires Cache Components" (https://nextjs.org/docs/app/guides/prefetching#partial-prefetching). This repo does not use Cache Components, so it is not an option.

**Answers:**
- Viewport prefetch of a statically prerendered route fetches the full RSC payload. This is confirmed by the 160 KB response above and the docs. Whether the fetch incurs an ISR read depends on a CDN miss in that region (Q5/Q6).
- Hover-only is the supported pattern: `prefetch={active ? null : false}` plus `onMouseEnter`. There is no built-in prop for "hover only, no viewport".
- Not verified: the prefetch/ISR-read relationship is inferred from Vercel docs. Vercel prefetch requests were not traced individually.

**Where to change it:** `src/components/internal-link.tsx` renders every article-to-article link (`index-row.tsx`, `article-link-row.tsx`, `open-questions-section.tsx`) and spreads `...linkProps` onto `next/link`. One hover-gated wrapper there covers most of the article-listing traffic. Other `next/link` users to check are `subject-chip.tsx`, `footer.tsx`, `shelf-*`, `compare-*`, `[locale]/articles/page.tsx`, and `article-layout.tsx`. `header.tsx` already uses `prefetch={false}`.

**Recommendation:** put the Next-documented hover-only `prefetch={active ? null : false}` + `onMouseEnter` pattern inside `InternalLink` (and any other article-slug `<Link>`), so only hovered links prefetch.

---

## 2. Vercel Firewall: block `meta-externalagent`

**CLI (Vercel CLI 59.19.0, `vercel firewall --help`, run from `apps/blog`):** subcommands `overview`, `status`, `diff`, `publish`, `discard`, `ip-blocks`, `rules`, `bot-management`, `system-bypass`, `attack-mode`, `system-mitigations`, `alerts`, `persistent-actions`, `traffic`. `rules` has `list | inspect | add | edit | enable | disable | remove | reorder`. Writes only stage a draft; `vercel firewall publish` makes them live (`vercel firewall diff` previews).

Custom rule, from `vercel firewall rules add --help` (the help examples use the same `user_agent` / `sub` shape):
```
vercel firewall rules add "Block Meta AI crawler" \
  --condition '{"type":"user_agent","op":"sub","value":"meta-externalagent"}' \
  --action deny --yes
vercel firewall diff
vercel firewall publish
```
`--action challenge` is also accepted. Other flags: `--description`, `--duration`, `--project`, `--team-level`, `--disabled`, `--or`, `--ai "<prompt>"`.

**Managed ruleset:** it exists. `vercel firewall bot-management` / `rules list` on this project shows `Bot Protection` (Off), `AI Bots` (Allow), `BotID` (Basic). `vercel firewall rules inspect ai-bots` shows `WAF ID managed_ai_bots`, action Allow. Toggle with `vercel firewall rules edit ai-bots --action deny` (or `log`). Docs: https://vercel.com/docs/bot-management#ai-bots-managed-ruleset and https://vercel.com/docs/vercel-firewall/vercel-waf/managed-rulesets#configure-ai-bots-managed-ruleset: available on all plans, inactive by default, "log or deny", list maintained by Vercel. The `vercel.json` schema (https://openapi.vercel.sh/vercel.json, fetched) has no firewall/WAF property, so rules cannot be set from `vercel.json`.

- `meta-externalagent` is in Vercel's verified-bot directory with category `ai_crawler` (https://vercel.com/docs/bot-management). Bot Protection "automatically excludes verified bots", so enabling Bot Protection would not stop it. Whether `ai-bots` specifically contains `meta-externalagent` is **unverified** (the docs say only "known AI crawlers"). `ai-bots` deny also blocks GPTBot, ClaudeBot, ChatGPT-User, etc., which would undercut `llms.txt`.

**Billing when denied:** https://vercel.com/docs/vercel-firewall/firewall-concepts#deny: a denied request returns 403, "does not reach your application", and "does not incur CDN Requests or Fast Data Transfer". So it does not run a function or read ISR. WAF custom rules are not billed (only WAF Rate Limiting and OWASP CRS appear in the regional price list, `https://vercel.com/docs/pricing/regional-pricing`). Rules evaluate before managed rulesets (managed-rulesets page, "Rules execution order").

**robots.txt:** Meta's page (https://developers.facebook.com/docs/sharing/webmasters/web-crawlers) shows `User-agent: meta-externalagent` + disallow as the opt-out and does not list ExternalAgent as an exception. It lists only `meta-externalfetcher` as "may bypass robots.txt". It says crawlers may cache robots.txt up to 24 hours. Honoring is implied, not stated outright. Current `src/app/robots.ts` only has `{ userAgent: "*", allow: "/" }`, so no opt-out exists today. A robots.txt change is free and reversible, but is not enforcement.

**Recommendation:** run the `vercel firewall rules add ... --action deny` command above and publish it, and also add `User-agent: meta-externalagent` / `Disallow: /` to `robots.ts`. Leave `ai-bots` on Allow unless you want to lose AI assistants.

---

## 3. `vercel.json` `functions` memory

- Schema (https://openapi.vercel.sh/vercel.json): `functions` is keyed by glob (`^.{1,256}$`, max 50 keys); `memory` accepts 128-10240. Example in the schema: `"src/pages/**": {"maxDuration": 6, "memory": 1024}`.
- https://vercel.com/docs/project-configuration/vercel-json (`functions`): "`memory`: Memory cannot be set in `vercel.json` with Fluid compute enabled. Instead set it in the **Functions** section in your project dashboard". Also: "With Fluid compute enabled, set memory in the Functions section of your project dashboard, not in vercel.json".
- https://vercel.com/docs/functions/configuring-functions/memory: "You cannot set your memory size using `vercel.json`. If you try to do so, you will receive a warning at build time." Pro/Enterprise can set the project default in the dashboard (Settings -> Functions -> Advanced Settings -> Function CPU). The documented options are Standard 2 GB / 1 vCPU (default) and Performance 4 GB / 2 vCPU. **Neither is 1024 MB.**
- The observed 1024 MB provisioning is therefore not explained by the current docs. The page mentions only pre-2019-11-08 projects having legacy defaults (this project was created 2020-02-20). **Unverified** why 1024 shows up. Check the dashboard Function CPU setting. Fluid compute being enabled on this project was not confirmed (`fluid` appears in the schema; docs say it is the default for projects created after 2025-04-23).
- With `bunVersion` set: nothing in the fetched pages says memory behaves differently under Bun. **Unverified.**
- Pricing (https://vercel.com/docs/functions/usage-and-pricing): Provisioned Memory is "Memory allocated to your function instances (in GB)", billed "for the entire instance lifetime in GB-hours", continuing during I/O until the last in-flight request completes. Rates: $0.0106 (iad1/pdx1/cle1) to $0.0183 per GB-hr. Active CPU: $0.128 to $0.221 per hour. Invocations: $0.60 per million (the doc's own example). Memory billing covers busy time only: "nothing at all between requests".
- Cost scale: ~4k invocations per route at ~1 GB for a few hundred ms each is on the order of cents per month at the iad1 rate. Memory sizing is not a meaningful lever here. Raising to 2 GB would double the GB-hr rate. Lowering below the default is not offered in the dashboard.

**Recommendation:** do not add `memory` to `vercel.json` (it is ignored and warns); leave the dashboard Function CPU alone and look at the ISR-read lever first.

---

## 4. `ignoreCommand`, `buildCommand`

**Precedence:** https://vercel.com/docs/project-configuration/vercel-json#buildcommand: "The `buildCommand` property can be used to override the Build Command in the Project Settings dashboard ... for a given deployment." `ignoreCommand`: "This value overrides the Ignored Build Step in Project Settings". So the `vercel.json` `buildCommand` (`cd ../.. && bun run build`, no filter) wins over the dashboard command (`... -- --filter=@howardism/blog`). The dashboard filter is currently dead config. Root `package.json` `build` wraps `apps/cli/src/content/run.ts`, so check what `bun run build` at root does before choosing; the dashboard version builds only the blog and its dependencies. To keep the filter, put it in `vercel.json`. Not verified: that the two commands produce different task sets here (the root `build` script content was not inspected).

**Exit codes** (https://vercel.com/docs/project-configuration/project-settings#ignored-build-step): runs in the Root Directory; exit `1` -> build continues; exit `0` -> build aborted, deployment `CANCELED`. Canceled builds still count against deployment quotas and concurrent build slots.

**Tools:**
- `turbo-ignore` is deprecated per https://turborepo.dev/docs/reference/turbo-ignore ("will no longer receive updates"; recommends `turbo query affected`). That page does not document workspace detection or exit codes. How it picks `@howardism/blog` from the cwd is **unverified**.
- Vercel's current Turborepo guidance (https://vercel.com/docs/monorepos/turborepo#custom-ignored-build-step): `turbo query affected --base=$VERCEL_GIT_PREVIOUS_SHA --packages <your-project-name> --exit-code`. Local `turbo query affected --help` (turbo ^2.10.13) confirms `--exit-code` "Exit with code 1 when affected packages or tasks are found, 0 when none are found, or 2 on errors", which maps directly onto Vercel's 1 = build, 0 = skip. Exit 2 is not 0, so an error builds, which is the safe direction. `--packages` is documented for filtering by name.
- Vercel also has built-in "Skipping unaffected projects" (https://vercel.com/docs/monorepos#skipping-unaffected-projects): GitHub only, Bun workspaces supported, unique package names, explicit inter-package dependencies. A project is changed if its source, its internal dependencies, or lockfile-only changes affecting it changed. It does not use a concurrent build slot. The docs describe it as automatic; whether it is currently enabled for this project is **unverified** (Settings -> Build and Deployment -> Root Directory -> "Skip deployment").

**Repo-specific gap:** `apps/blog/package.json` does not list `apps/cli` as a dependency. Only `@howardism/article-contract` and `@howardism/ui` are workspace deps. Yet the blog build runs `bun ../cli/src/content/run.ts` (`content:prepare`), so a change under `apps/cli` would be treated as unaffected by any dependency-graph skip, even though it changes build behavior. Content is pinned by `apps/blog/content.lock.json` (inside the blog, so changes to it count as affected).

**Recommendation:** use the built-in unaffected-project skipping if it is on; if a custom command is needed, set `"ignoreCommand": "turbo query affected --base=$VERCEL_GIT_PREVIOUS_SHA --packages @howardism/blog --exit-code"` (the `bunx`/`npx turbo-ignore` route is deprecated), and add `@howardism/cli` (or whatever the `apps/cli` package is named) as a `devDependency`/`dependency` of the blog so changes to the content-prepare code count as affecting it. Before shipping, test the exact command locally with a real base SHA.

---

## 5. Pro allowances and rates (docs dated 2026-08/09)

The Pro plan is credit-based: **$20/month platform fee with $20 of monthly usage credit** applied to all managed infrastructure resources "from the first unit"; the credit expires monthly and usage beyond it is on demand (https://vercel.com/docs/plans/pro-plan#monthly-credit). Alerts at 75% of credit; spend management defaults to $200 per cycle for new customers. **Flat Rate CDN**: Pro includes the lowest tier "at no extra cost, with a capacity of 1 million CDN requests and 1 TB of data transfer each month". Per-resource "Included (Pro)" columns in https://vercel.com/docs/pricing say "Flat Rate CDN" (FDT, CDN requests) or "Usage-based" (Fast Origin Transfer). The on-demand rates below are the ranges across regions, from https://vercel.com/docs/pricing/regional-pricing:

| Resource | Pro on-demand (per region range) | Notes |
|---|---|---|
| ISR reads | $0.40-$0.64 per 1M read units | 1 unit = 8 KB read from the ISR cache; no per-resource Pro allowance in docs |
| ISR writes | $4.00-$6.40 per 1M write units | 8 KB; no write if revalidated content is unchanged |
| CDN requests (formerly Edge requests) | $2.00-$3.20 per 1M | Flat Rate CDN covers 1M/month on Pro |
| Fast Data Transfer | $0.15-$0.35 per GB | Flat Rate CDN covers 1 TB/month on Pro |
| Fast Origin Transfer | $0.06-$0.43 per GB | usage-based on Pro |
| Image transformations | $0.05-$0.0812 per 1K | Hobby gets 5K included; no Pro-specific allowance in docs |
| Image cache reads / writes | $0.40-$0.64 / $4.00-$6.40 per 1M | Hobby: 300K / 100K included |
| Function invocations | $0.60 per 1M (doc example) | |
| Active CPU | $0.128-$0.221 per hour | |
| Provisioned memory | $0.0106-$0.0183 per GB-hr | |
| CDN request CPU duration | $0.30-$0.48 per hour, 1 hour included on Pro | |

- ISR cost model (https://vercel.com/docs/incremental-static-regeneration/limits-and-pricing): "CDN cache reads and writes are free, but reads and writes from durable storage incur costs." The CDN cache is "ephemeral with no guaranteed retention ... typically for minutes to hours" and is per region. ISR reads happen on a CDN miss. Each new deployment gets its own ISR cache (https://vercel.com/docs/incremental-static-regeneration, "each new deployment uses its own ISR cache and does not reuse the cache from a previous deployment").
- Order of magnitude: 3.38M read units x $0.40-$0.64 per 1M = about $1.35-$2.16, well inside the $20 credit. The 402 on Hobby was a plan limit, not a Pro cost problem. Heavy page weight (308 KB HTML, 160 KB RSC, 350-550 KB feeds) multiplies units per request, so shrinking payloads or cutting low-value requests (prefetch, Meta crawler) is the real lever.
- Pro-specific "included" counts for ISR reads/writes, image transformations and invocations are not stated in the fetched docs beyond the $20 credit. Stated as **unverified** rather than guessed.

**Recommendation:** treat the $20 credit as the budget; at current volume ISR reads cost about $2/month, so set a spend alert (default $200) and prioritise cutting requests (Q1, Q2) over config tuning.

---

## 6. `force-static` route handlers still invoking functions

**Verified cause (2026-10-08): `next/link` prefetches, not deploys or ISR.** The footer (`REFERENCE_LINKS`, `FOOTER_NAV`) and mobile menu linked `/llms.txt`, `/rss/feed.xml`, `/rss/feed.json` and `/sitemap.xml` through `next/link`, so every page rendered with JavaScript (mostly headless-Chrome crawlers: `meta-externalagent`, `googleother`) prefetched them with an `RSC: 1` header. Evidence:

- `vercel metrics vercel.request.count -f 'requestPath = "/llms.txt"' --group-by isPrefetchRequest --group-by pathType --since 7d --prod`: 2,256 prefetch requests went to `streaming_func`, against 107 non-prefetch requests served as `prerender`. `/rss/feed.xml`: 2,314 vs 534. `/sitemap.xml`: 2,262 prefetches, each served the static 404 page (these account for the `/sitemap.xml` 404s).
- `vercel logs --environment production --source serverless -q llms.txt`: repeated `cache: MISS` invocations on a single deployment, so this is not a once-per-deploy fill.
- `curl -H 'RSC: 1' https://www.howardism.dev/llms.txt` returns `x-matched-path: /llms.txt.rsc`, `x-vercel-cache: MISS`. Vercel rewrites RSC requests to a `.rsc` path with no prerender for a route handler, so the function runs. A plain request (any user agent, query string, `Range`, `If-None-Match`) returns `x-matched-path: /llms.txt`, `HIT`.
- The response carries `Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch`. The router state tree differs per source page, so these responses rarely reuse a cache entry.

The prerender manifest marks all five routes `compute: static`, `initialRevalidateSeconds: false`, so `revalidate` and moving the files into `public/` were never the lever. **Fix applied:** file routes now render as plain `<a>` (`isFileHref` in `apps/blog/src/app/(blog)/(layout)/constants.ts`). Remaining, optional: the feeds and `llms.txt` are 350-550 KB each, which multiplies read units when they are fetched.
