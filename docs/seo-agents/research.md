# SEO metadata and agent-facing surfaces: research (2026-11-04)

Project state read from the repo: `next` 16.3.5 installed (`apps/blog/node_modules/next/package.json`), `feed` 6.0.0. Vercel serves a static export (`DEPLOY_TARGET=vercel`, `output: "export"`), and `vercel.json` is generated from `src/config/redirects.ts` + `security-headers.ts`. The local content profile is `sample` (16 EN articles, 16 zh-TW). Live numbers come from read-only `curl` GETs against `https://www.howardism.dev` (UA `research-probe`), taken on 2026-11-04.

## Summary

The basics are already in place: per-page canonicals, prerendered `<head>` metadata, `robots.txt`, a 645-URL sitemap, RSS + JSON Feed, `llms.txt`, and a WebMCP tool pair. The biggest gaps are these:

1. **zh-TW is invisible to search.** There are 504 translated pages, but none are in the sitemap and there is no `hreflang` in either direction. The zh pages also render `<html lang="en">` and have no share image.
2. **Metadata merge clobbering.** Next merges `openGraph`/`twitter`/`alternates` shallowly. Every page that sets one of them loses the root's `og:image`, `og:site_name`, `og:locale`, `twitter:site` and the feed `<link rel="alternate">`. List pages therefore share with no image at all.
3. **No structured data anywhere.** There are zero `application/ld+json` blocks. There is no `BlogPosting`, no `WebSite` (site name), and no `BreadcrumbList`.
4. **Agents get HTML only.** The article bodies are already plain Markdown (0 of 16 sample MDX files contain JSX), but there are no `.md` copies and no `text/markdown` alternates. `llms.txt` is 437 KB, far past the spec's "fits in context" intent.
5. **Freshness signals are weak.** The sitemap stamps index pages with the build time, articles have no modified date, and Google and Bing both ignore `changefreq`/`priority`.

Everything in the P1/P2 proposals fits the static export. A remote MCP endpoint, server-side Accept negotiation, and NLWeb all need a runtime this deployment deliberately does not have. They are covered under "not worth doing".

---

## Current state audit

### What exists

| Surface | Source | Live (2026-11-04) |
|---|---|---|
| Root metadata | `src/app/(blog)/layout.tsx:76-154`: `metadataBase`, title template `Howardism \| %s`, OG website + profile image, twitter `summary_large_image`, canonical, feed alternates | matches on `/` |
| Article metadata | `src/app/(blog)/articles/[slug]/page.tsx:26-64`: title, description, canonical, archived → `noindex`, OG `article` + hero image + `published_time`, twitter | matches (`/articles/agent-skill-format`) |
| zh-TW article metadata | `src/app/(blog)/[locale]/articles/[slug]/page.tsx:36-60`: canonical, OG `locale: zh_TW`, no image | matches (`/zh-TW/articles/jev`) |
| robots | `src/app/robots.ts:8-26`: `*` allow, disallow `meta-externalagent`/`ExaSearchBot`/`PetalBot`, `Sitemap` + `Host` (omitted on Pages) | 219 B, matches |
| sitemap | `src/app/sitemap.ts:9-51`: home, `/articles`, 4 tag sections, visible articles | 645 `<url>`, 121 KB |
| llms.txt | `src/app/llms.txt/route.ts:15-59`: H1, blockquote, `##` per domain, `- [title](url): description` | 437 KB, `text/plain` |
| Feeds | `src/app/rss/service.tsx:18-62`, routes in `rss/feed.{xml,json}` | RSS 673 KB, 639 items, no `<language>`; JSON Feed `version/1` |
| WebMCP | `src/components/search/webmcp-tools.tsx:178-218` (`search_articles`, `get_article`, read-only), gated on `"modelContext" in document` (`search-provider.tsx:69-73`) | no-op unless the browser exposes the API |
| CSP | `src/config/security-headers.ts:85-102` → `vercel.json` | `script-src 'self' 'unsafe-inline' …`. Inline JSON-LD is not blocked: it is a non-executed data block, and `'unsafe-inline'` is present anyway |
| Pages backup | `noindex, nofollow` (`layout.tsx:127-129`), no sitemap line. `NEXT_PUBLIC_DOMAIN_NAME` is unset in `pages.yml`, so canonicals default to `www` | correct cross-domain canonical |

### Bugs and gaps found

1. **Shallow-merge losses (live-confirmed).** Next documents that nested fields like `openGraph` "defined in an earlier segment are **overwritten** by the last segment to define them". The recommended fix is a shared object spread into each segment (https://nextjs.org/docs/app/api-reference/functions/generate-metadata#merging). Effects:
   - `/articles`, `/articles/domain/*`, `/articles/tag/*`, `/articles/tagged/*`, `/questions`, `/shelf`, `/zh-TW/articles` set `openGraph: { url }`. They emit no `og:image`, `og:site_name`, `og:type` or `og:locale`, yet still declare `twitter:card=summary_large_image` with no image.
   - Article pages override `twitter` (`[slug]/page.tsx:57-62`), which drops `twitter:site`/`twitter:creator`.
   - Every non-home page overrides `alternates` with a canonical only, which drops the RSS/JSON Feed `<link rel="alternate">`. Live, only `/` advertises the feeds.
   - zh-TW articles have no `og:image`/`twitter:image` (`[locale]/articles/[slug]/page.tsx:52-58`).
2. **`/articles` has no title or description** (`articles/page.tsx:28-31`). Live it renders `Howardism | Blog` with the site-wide description, the same as `/`.
3. **Double branding.** Seven titles append `— Howardism` under a template that already prefixes it: `domain/[domain]/page.tsx:40,45`, `tag/[tag]/page.tsx:38,42`, `tagged/[tag]/page.tsx:39,44`, `compare/page.tsx:9`, `shelf/page.tsx:16`, `questions/page.tsx:14`. Live result: `Howardism | Agent Systems notes — Howardism`.
4. **`og:locale` is `en_UK`** (`layout.tsx:112`). OGP wants `language_TERRITORY` (https://ogp.me/), and the ISO 3166-1 code for the UK is `GB`, so this should be `en_GB`.
5. **zh-TW has no hreflang and is missing from the sitemap.** `/zh-TW/articles` links 504 translated slugs, and the live sitemap has 0 `zh-TW` URLs. Neither EN nor zh pages carry `rel="alternate" hreflang`. Article pages do link to the translation in the body (`render-article.tsx:117`), so crawlers can still find them.
6. **`<html lang="en">` on zh-TW pages.** `[locale]/layout.tsx:26` only sets `lang` on an inner `div`. Google ignores `lang` ("We don't use any code-level language information such as `lang` attributes", https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites), so this is an accessibility and other-engine issue rather than a Google one.
7. **Sitemap `lastmod`.** Home, `/articles` and the tag pages use `new Date()` (`sitemap.ts:12`), so every build re-stamps them. Articles use `date`, which is the publish date. There is no modified date in the contract (`packages/article-contract/src/schema.ts:10-20`). The sitemap omits the 14 domain pages and `/questions`. `changefreq`/`priority` are emitted but ignored (finding A3).
8. **No JSON-LD** on any page (live count 0 on `/`, articles, domain pages, zh pages). There are also no `<time datetime>` elements; the publish date is shown only as text (`article-layout.tsx:202`).
9. **Author is the site name.** `AUTHOR_NAME = "Howardism"` (`constants.ts:6`) feeds `meta author`, the feed and OG. Google's Article guidance wants a `Person` with `name` and a uniquely identifying `url`/`sameAs` (finding A2). `social-links.tsx:20-38` already has the GitHub/LinkedIn/X profiles.
10. **Feed defects.**
    - The RSS `<image>` is `favicon.ico` (`service.tsx:32`). RSS 2.0 requires "a GIF, JPEG or PNG image" (https://www.rssboard.org/rss-specification).
    - There is no `<language>` and no `<category>`.
    - The JSON Feed is `version/1` with deprecated `author`, and puts the description in `content_html`. JSON Feed 1.1 has `summary` for that and says "new feeds should use `authors`" (https://www.jsonfeed.org/version/1.1/).
11. **`llms.txt` size.** It is 437 KB, roughly 110k tokens, because each article line carries the full multi-sentence description. The spec says the file should stay small enough to fit in context, with detail behind links (https://llmstxt.org/). It also does not link any Markdown copies, because none exist.
12. **Unused tags.** `keywords` (`layout.tsx:86-106`, also stale: "Singapore, London, Remote, Anywhere, World") has no effect: "The meta-keyword tag is not used by Google Search" (https://developers.google.com/search/docs/crawling-indexing/special-tags). `msapplication-TileColor` (`layout.tsx:152`) is "no longer needed" per the Next docs (generate-metadata, `icons` note). `Host:` in robots is non-standard, and Next emits it as a raw line.
13. **No `max-image-preview:large`.** Google Discover wants images at least 1200 px wide plus that robots setting (https://developers.google.com/search/docs/appearance/google-discover). The heroes are 1600×900 (16:9), so they qualify; only the directive is missing.
14. **The WebMCP `get_article` tool says to "fetch the returned url"** (`webmcp-tools.tsx:205`). That URL is a ~224 KB HTML page. A `.md` alternate would give the tool something cheap to point at.

---

## Findings by topic

### A. Search metadata (Google, Bing)

**A1. hreflang.** There are three equivalent methods (HTML `<link>`, HTTP `Link`, sitemap `xhtml:link`), and Google advises picking one. Rules quoted from the page:
- "Each language version must list itself **as well as** all other language versions."
- "If two pages don't both point to each other, the tags will be ignored."
- `zh-TW` is a valid code. `x-default` is for a fallback or language-selector page.

Source: https://developers.google.com/search/docs/specialty/international/localized-versions. Next 14.2+ supports `alternates.languages` in `sitemap.ts` and emits `xhtml:link` (https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap), and supports `alternates.languages` in `generateMetadata` (generate-metadata docs). The sitemap route is the single place that already sees every slug and `getTranslatedSlugs()`, so it is the cheapest correct option. The head `<link>` form is equally static, and also helps non-Google consumers.

**A2. Article structured data.** Google's Article doc has "no required properties". It recommends `author` (Person/Organization, each with `name` and a `url` or `sameAs` that identifies them), `datePublished`, `dateModified`, `headline` and `image`. Images should be "at least 50K pixels", in 16x9, 4x3 and 1x1 aspect ratios (https://developers.google.com/search/docs/appearance/structured-data/article). Next's recommended rendering is a plain `<script type="application/ld+json">` in the page, with `<` escaped as `<`, and `schema-dts` available for types (https://nextjs.org/docs/app/guides/json-ld, updated 2026-03-02). That rendering is static-export safe. For the zh pages, schema.org `translationOfWork` ("The work that this work has been translated from", on `CreativeWork`; inverse `workTranslation`) describes the relationship (https://schema.org/translationOfWork). Article `sources` map naturally to `citation` (unverified that any consumer uses it).

**A3. Site name and breadcrumbs.**
- `WebSite` structured data with `name` + `url` on the domain-level home page is how Google picks the site name (https://developers.google.com/search/docs/appearance/site-names).
- `BreadcrumbList` needs at least two `ListItem`s with `position`/`name`/`item`. The page says it is shown "on desktop in all regions"; mobile is not mentioned (https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).

**A4. AI Overviews / AI Mode.** "There are no additional requirements to appear in AI Overviews or AI Mode". "You don't need to create new machine readable files, AI text files, or markup". Structured data should match visible text (https://developers.google.com/search/docs/appearance/ai-features). So llms.txt and Markdown copies are for agents, not for Google ranking.

**A5. Sitemaps.**
- Google uses `lastmod` only "if it's consistently and verifiably" accurate, and ignores `<priority>` and `<changefreq>`. Limits are 50 MB / 50,000 URLs (https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
- Bing: lastmod "should reflect the true last modification time of the page content, not the sitemap file itself", and changefreq/priority "are ignored by Bing" (https://blogs.bing.com/webmaster/2025/7/Keeping-Content-Discoverable-with-Sitemaps-in-AI-Powered-Search/).
- About 645 EN plus 505 zh URLs is well under the limits; no split is needed.

**A6. Machine translation.** Google's scaled-content-abuse policy names "automated transformations like synonymizing, translating" applied to scraped content, and "generative AI tools … to generate many pages without adding value" (https://developers.google.com/search/docs/essentials/spam-policies). The zh pages are self-authored translations, labelled as AI-translated (`/zh-TW/articles` description). That is a different case from scraping, but they are 504 machine-generated pages. Unverified how Google treats this case. The hreflang pairing does not change the risk; it only tells Google which version to show to whom.

**A7. IndexNow.**
- Mechanism: a UTF-8 `{key}.txt` at the site root, then GET/POST to an engine's `/indexnow`, up to 10,000 URLs per POST (https://www.indexnow.org/documentation).
- Participants: Amazon, Bing, Naver, Seznam, Yandex and Yep. Submissions are shared among them. Google is not listed (https://www.indexnow.org/faq).
- Bing positions IndexNow as the real-time complement to sitemaps (the Bing post in A5).
- Fit: the key file is a static `public/` asset, and the ping can run from CI after a deploy. No runtime is needed.

### B. Social metadata (Open Graph, X)

- OGP defines `og:locale` (format `language_TERRITORY`, default `en_US`), `og:locale:alternate`, `og:site_name`, and `article:published_time`/`modified_time`/`author`/`section`/`tag`. It names no image formats (https://ogp.me/). Next maps `openGraph.publishedTime`/`authors`/`tags` to these tags (generate-metadata docs).
- The hero `og:image` is WebP (`/_next/static/media/<slug>.<hash>.webp`, 1600×900). **Unverified** which unfurlers accept WebP: the X card docs returned HTTP 402 to the fetch, and the OGP spec is silent. If a real share preview fails on some platform, the fix is to keep a JPEG variant when the importer transcodes (`apps/cli/src/webp.ts`). Do not change this speculatively.

### C. AI crawlers and usage preferences

| Token | Operator's stated purpose | robots.txt | Source |
|---|---|---|---|
| `GPTBot` | training data | disallow = "content should not be used in training" | https://developers.openai.com/api/docs/bots |
| `OAI-SearchBot` | ChatGPT search | opted-out sites "will not be shown in ChatGPT search answers" (nav links only). Changes take ~24 h | same |
| `ChatGPT-User` | user-initiated fetch | "robots.txt rules may not apply" | same |
| `ClaudeBot` | training | honoured. `Crawl-delay` supported | https://support.claude.com/en/articles/8896518 |
| `Claude-SearchBot` | search index | honoured | same |
| `Claude-User` | user-initiated fetch | honoured (per same page) | same |
| `Google-Extended` | control token: Gemini training + grounding | no separate UA. "does not impact a site's inclusion in Google Search nor is it used as a ranking signal" | https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers |
| `Applebot-Extended` | control token: Apple foundation-model training | "does not crawl". Not used in Search ranking | https://support.apple.com/en-us/119829 |
| `PerplexityBot` | Perplexity search | honoured. "not used to crawl content for AI foundation models" | https://docs.perplexity.ai/guides/bots |
| `Perplexity-User` | user-initiated | "generally ignores robots.txt" | same |
| `CCBot` | Common Crawl corpus | honoured. Crawl-delay not documented | https://commoncrawl.org/ccbot |

Current robots allows all of these. Blocking any search-type agent (`OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`) removes the site from that product's answers. The 2026-10 blocks were driven by ISR read cost. On the static export, crawler traffic bills only CDN requests and Fast Data Transfer (per this repo's CLAUDE.md), so re-evaluate those blocks on traffic grounds, not policy grounds.

**Usage preferences (no crawl change):**
- **IETF AIPREF.**
  - `draft-ietf-aipref-attach-05` (2026-08-19) defines a robots.txt rule `Content-Usage: train-ai=n` (optionally path-scoped) and an HTTP `Content-Usage` header (https://www.ietf.org/archive/id/draft-ietf-aipref-attach-05.html).
  - `draft-ietf-aipref-vocab-07` defines `train-ai` and `search`, and notes the vocabulary "does not yet have Working Group consensus" (https://www.ietf.org/archive/id/draft-ietf-aipref-vocab-07.html).
  - Google says it "intends to support the AIPREF shared machine-readable training preference signal" in early 2027 (google-common-crawlers page above).
  - These are Internet-Drafts, i.e. work in progress.
- **Cloudflare Content Signals.** `Content-signal: search=yes, ai-input=…, ai-train=…` in robots.txt. `ai-input` covers RAG/grounding and `ai-train` covers training. "compliance is voluntary" (https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/). Cloudflare-specific, but it is plain text and costs nothing to emit.
- **Next.js support.** Since 16.3 a rule can carry `other: Record<string, …>` for non-standard per-agent lines, passed through verbatim (https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots). The installed 16.3.5 has it (`next/dist/build/webpack/loaders/metadata/resolve-route-data.js:59`). Either signal is therefore a two-line change to `robots.ts`. Which values to send (allow or deny training) is the owner's policy call, not a technical one.

### D. Agent-readable content

**D1. llms.txt** (https://llmstxt.org/): the H1 is the only required section. An optional blockquote, optional prose, and `##` link lists follow. An `## Optional` section holds links "an agent can skip when a shorter context is needed". The spec does not mention `llms-full.txt`. On Markdown copies it says pages "should have a clean Markdown copy at the same URL" with `.md` appended (or `index.html.md` for directory URLs), advertised with `rel="alternate" type="text/markdown"` or a `Link:` header.

**D2. Markdown alternates in practice.** Vercel's own docs:
- serve `<page>.md` as a "durable and shareable" explicit URL,
- negotiate `Accept: text/markdown` on the canonical URL with `Vary: Accept`,
- advertise both via `rel="alternate"` with type `text/markdown`.

Source: https://vercel.com/docs/agent-resources/markdown-access (updated 2026-09-17). Their Markdown starts with YAML frontmatter (title, canonical_url, last_updated, summary, related), which maps directly onto this blog's frontmatter plus `article-graph.json`.

**D3. Static-export feasibility.**
- *`.md` files: yes.* The MDX bodies are already Markdown. In the sample, 0 of 16 files contain JSX; the only non-Markdown line is `export { default as heroImage } …`. Two build routes:
  - (a) A post-build step in `apps/cli` that writes `out/articles/<slug>.md` and `out/zh-TW/articles/<slug>.md` from the source MDX, the way `pages:redirects` writes into `out/`. **Unverified:** that `@vercel/next` picks up files added to `out/` after `next build` but before the build command exits. Confirm on a preview deploy.
  - (b) Inside Next: a dynamic segment cannot carry a suffix (`[slug].md`), so an in-app route handler can only produce `/articles/<slug>/index.md`. llms.txt permits that form for directory URLs, but it is a worse fit for `/articles/<slug>`.
  - A `vercel.json` `headers` entry should pin `Content-Type: text/markdown; charset=utf-8`, the same pattern already used for the feeds.
- *Accept negotiation on the canonical URL: not with `rewrites`.* Vercel: "precedence is given to the filesystem prior to rewrites being applied" (https://vercel.com/docs/project-configuration/vercel-json, rewrites). A Vercel staff answer reproduces exactly this failure for a static site and moves the rule to `routes`, which run before the filesystem (https://community.vercel.com/t/rewrite-getting-override-by-html/49646). Current docs say `routes` can now be used alongside `redirects`/`headers` (vercel-json, `routes`). **Unverified** for an `@vercel/next` static export deployment.

**D4. WebMCP.**
- Spec: Draft Community Group Report, 2 November 2026, Web Machine Learning CG, "not a W3C Standard nor … on the W3C Standards Track". API: `document.modelContext.registerTool(tool, {exposedTo, signal})` (https://webmachinelearning.github.io/webmcp/).
- Chrome: origin trial from Chrome 149 (https://developer.chrome.com/blog/ai-webmcp-origin-trial), and a local flag `chrome://flags/#enable-webmcp-testing` (https://developer.chrome.com/docs/ai/webmcp).
- Edge: lists its own origin trial expiring 2027-03-30 (https://developer.microsoft.com/en-us/microsoft-edge/origin-trials/trials/0b76fe60-b266-458e-a285-04e375c0c31a).
- The repo's implementation is already correct and read-only. Today it only runs for users who flipped the flag.
- Fit: an origin-trial token is a static `<meta http-equiv="origin-trial">`, so it fits the static export. Tokens expire and must be renewed, and the trial may change the API.

**D5. Hosted MCP / NLWeb.**
- NLWeb is a server: a web server plus a vector store (Qdrant/Milvus/Postgres/Azure AI Search) plus an LLM provider. "Every NLWeb instance also acts as an MCP server" (https://github.com/nlweb-ai/NLWeb).
- Any remote MCP endpoint needs a function or another host.
- MCP server discovery is still experimental. Candidates are the server-card extension with `/.well-known/mcp/catalog.json` (https://github.com/modelcontextprotocol/experimental-ext-server-card/pull/3), SEP-1649's `/.well-known/mcp.json`, and the individual draft `draft-serra-mcp-discovery-uri-02` (`/.well-known/mcp-server`). The live site returns 404 for `/.well-known/mcp.json`.

### E. Feeds

- RSS 2.0: `<image><url>` must be GIF/JPEG/PNG. `<language>` lets aggregators group by language. `<category>` takes an optional `domain` taxonomy (https://www.rssboard.org/rss-specification).
- JSON Feed 1.1: an item needs `content_html` or `content_text`. `summary` is "a plain-text sentence or two". `authors` replaces `author`. Items can also carry `image`, `date_modified`, `tags` and `language` (https://www.jsonfeed.org/version/1.1/).
- Both feeds already include every visible article (639 items). Full article text in the feed would push it to roughly the corpus size (tens of MB on the full release), so keep summaries.

---

## Proposals (prioritized)

| # | Item | Why | Effort | Static? | Files |
|---|---|---|---|---|---|
| P1.1 | **Shared base metadata.** Export `baseOpenGraph` (siteName, locale `en_GB`, type, default image), `baseTwitter` (site, creator) and `feedAlternates` from one module, and spread them in every segment that sets `openGraph`/`twitter`/`alternates` (Next's documented pattern) | Fixes bug 1 on ~10 routes: list pages get a share image, articles regain `twitter:site`, every page advertises the feeds | S | y | new `src/app/(blog)/shared-metadata.ts`; `(blog)/layout.tsx`; `articles/page.tsx`; `articles/[slug]/page.tsx`; `domain/[domain]`, `tag/[tag]`, `tagged/[tag]`, `questions`, `shelf`, `compare` pages; `[locale]/articles/page.tsx`, `[locale]/articles/[slug]/page.tsx` |
| P1.2 | **Title/description cleanup.** Give `/articles` a title and description. Drop the `— Howardism` suffix from the 7 titles. Fix `en_UK` → `en_GB`. Remove `keywords` and `msapplication-TileColor` | Bugs 2-4 and 12; visible in every SERP and share card | S | y | `articles/page.tsx`, the 6 pages in bug 3, `(blog)/layout.tsx` |
| P1.3 | **hreflang + zh-TW in the sitemap.** Add the 505 zh URLs, each with `alternates.languages` `{en, zh-TW, x-default: en}`, mirrored on the paired EN entries. Optionally add the same `alternates.languages` to both article `generateMetadata`s so non-Google consumers see it in the head | Bug 5: 504 pages currently unlisted and unpaired; Google ignores one-way tags | S | y | `src/app/sitemap.ts`, `articles/[slug]/page.tsx`, `[locale]/articles/[slug]/page.tsx`, `[locale]/articles/page.tsx` |
| P1.4 | **zh-TW share image + OG pairing.** Reuse the EN hero for zh `openGraph.images`/`twitter.images`, and add `og:locale:alternate` on both sides | zh shares currently unfurl with no image | S | y | `[locale]/articles/[slug]/page.tsx`, `articles/[slug]/page.tsx` |
| P1.5 | **`BlogPosting` JSON-LD per article.** Include headline, description, `datePublished`, `image` (800/1200/1600 variants), `author` Person + `sameAs` (GitHub/LinkedIn/X from `social-links.tsx`), `publisher`, `inLanguage`, `mainEntityOfPage`, `keywords` = tags, `articleSection` = domain label, `citation` = sources. zh pages add `translationOfWork` → EN URL. Escape `<` per the Next guide | Bug 8; the only structured-data signal Google documents for articles; matches visible content | M | y | new `src/components/json-ld.tsx`; `articles/render-article.tsx` (has module + meta); possibly `schema-dts` dev dep |
| P1.6 | **`WebSite` JSON-LD on `/`** (name, url, alternateName) and **`BreadcrumbList`** on articles (Home › Articles › Domain › Article) and domain pages | Site-name selection; desktop breadcrumbs | S | y | `(blog)/page.tsx`, `render-article.tsx`, `domain/[domain]/page.tsx` |
| P2.1 | **Markdown copies + alternates.** Emit `/articles/<slug>.md` (and the zh mirror) with YAML frontmatter (title, canonical_url, date, domain, tags, summary, related slugs from `article-graph.json`) and the MDX body minus the `export` line. Advertise with `alternates.types['text/markdown']`, set `Content-Type` in the generated `vercel.json`, and point WebMCP `get_article` at it | Bug 14; llms.txt spec and Vercel's own practice; agents fetch ~20-30 KB of Markdown instead of ~220 KB of HTML | M | y (post-export write; verify Vercel picks it up) | new `apps/cli/src/markdown-export/*`; `apps/blog/package.json` build script; `apps/cli/src/vercel-config/*` (header); `articles/[slug]/page.tsx`; `webmcp-tools.tsx`; `pages-export/verify.ts` if it walks `out/` |
| P2.2 | **Slim `llms.txt`.** Per domain, list `- [Title](…/slug.md)` with a one-clause note (or none), move Entity/Index kinds under `## Optional`, and link `sitemap.xml` and the feeds | Bug 11: 437 KB defeats the "fits in context" intent | S | y | `src/app/llms.txt/route.ts` |
| P2.3 | **Honest `lastmod` + `dateModified`.** Index/tag lastmod = newest visible article date, not `now`. Add an importer-emitted `updated` field (vault file mtime or git date) to the contract and feed it to the sitemap, `article:modified_time`, JSON-LD and JSON Feed `date_modified` | Bug 7; both Google and Bing say they distrust a lastmod that does not track content | S (index pages) / M (`updated` field) | y | `sitemap.ts`; `packages/article-contract/src/{index,schema}.ts`; `apps/cli/src/import-wiki/*`; `articles-meta.ts`. Check `surface.ts` hashing: treat `updated` as copy-verbatim so it does not mark translations stale |
| P2.4 | **Sitemap completeness.** Add the 14 domain pages and `/questions`, and drop `changefreq`/`priority` | Bug 7; the dropped fields are ignored by both engines | S | y | `sitemap.ts` |
| P2.5 | **Usage-preference lines in robots.** Add `Content-Signal: search=yes, ai-input=yes, ai-train=<owner's choice>` and/or `Content-Usage: train-ai=<y\|n>` via the rule's `other` field. Drop `Host:`. Re-check whether the three ISR-era blocks are still wanted | Section C; Google plans to read AIPREF in 2027 | S | y | `src/app/robots.ts` |
| P2.6 | **`max-image-preview:large`.** Set `robots.googleBot['max-image-preview']='large'` on the production branch | Bug 13; Discover/large previews; heroes already qualify | S | y | `(blog)/layout.tsx` |
| P2.7 | **Feed fixes.** Use a PNG for the channel image (`android-chrome-512x512.png`), add `language: "en"`, add `category` = domain + tags, and post-process `json1()` to 1.1 (`summary`, `authors`, `image`) | Bug 10; spec conformance | S | y | `src/app/rss/service.tsx`, `rss/feed.json/route.ts` |
| P3.1 | **IndexNow from CI.** Static key file in `public/`. After a production deploy, POST changed article URLs (diff the release manifests) to `api.indexnow.org` | Faster Bing/Yandex/Naver/Seznam/Yep pickup. No Google | M | y | `apps/blog/public/<key>.txt`; new CI step / `apps/cli` script |
| P3.2 | **`<html lang>` per locale.** Split into two root layouts (route groups) so zh pages render `<html lang="zh-TW">` | Bug 6; a11y and non-Google engines. Google ignores it | M | y | `(blog)/layout.tsx` → shared shell + two root layouts; `[locale]/layout.tsx` |
| P3.3 | **`<time datetime>`** around the "Published" value | Machine-readable date in the visible content | S | y | `articles/[slug]/article-layout.tsx` |
| P3.4 | **WebMCP origin-trial token** as a `<meta http-equiv="origin-trial">` | Turns the existing tools on for Chrome 149+ users and agents. Renew on expiry | S | y | `(blog)/layout.tsx` |
| P3.5 | **Search Console / Bing Webmaster check.** Confirm both properties are verified (DNS or the `verification` metadata field), the sitemap is submitted, and zh hreflang errors are monitored after P1.3 | Only way to see whether P1.3/P1.5 took | S | y | none, or `(blog)/layout.tsx` |

Suggested batching: P1.1 + P1.2 + P1.4 + P2.6 in one PR (metadata objects only). P1.3 + P2.3 (index-page part) + P2.4 together (sitemap). P1.5 + P1.6 (JSON-LD). P2.1 + P2.2 together, since llms.txt should link the `.md` files.

## Not worth doing

- **Remote MCP server / NLWeb on this deployment.** Both need a runtime (functions, or a vector store + LLM for NLWeb), which is exactly what the static export removed for cost. WebMCP (in-page, free) plus `.md` + `llms.txt` (fetchable by any agent) cover the same read-only use. If a hosted endpoint is ever wanted, a separate free-tier worker reading the published `.md` files is the honest option. It is a new service, not a blog change.
- **`/.well-known/mcp*` discovery files.** Three competing, unratified locations (D5), and nothing to point them at without a server.
- **Accept-header negotiation on canonical URLs.** `rewrites` cannot do it on a static site (filesystem precedence). `routes` might, but that is unverified on `@vercel/next` exports and touches every request's routing. Explicit `.md` URLs plus `rel=alternate` give agents the same content with no routing risk.
- **`llms-full.txt`.** Not in the spec. The full corpus is tens of MB, too large for any context window. Per-article `.md` covers the need.
- **Full article text in RSS/JSON Feed.** It would multiply a 673 KB feed by roughly the corpus size for little reader benefit. Summaries plus `.md` links are enough.
- **Per-bot `Allow` lines for OAI-SearchBot/Claude-SearchBot/PerplexityBot.** `User-Agent: * / Allow: /` already admits them. Explicit groups only matter if `*` ever becomes restrictive.
- **Dynamic OG images (`opengraph-image.tsx` / `ImageResponse`).** Every article already has a 1600×900 hero. Generated cards add build time and duplicate the art.
- **`changefreq` / `priority` tuning.** Ignored by Google and Bing (A5).
- **AI-Overview-specific markup.** Google says none exists (A4).
- **Converting hero `og:image` to JPEG pre-emptively.** No verified platform failure. Revisit only if a real share preview breaks.
