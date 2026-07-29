# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is Howard himself, reading and navigating his own corpus in
public. The site is a second brain kept public so it stays honest and linkable;
retrieval tools (`/shelf`, `/questions`, `/compare`, backlink graph, search) are
built for the author's own use over time, not for a visiting audience's first
session.

Outside readers — peers in AI/engineering arriving from search or a shared link
— are real but secondary. They land on a single article and may follow domain or
backlink paths outward. Design serves the author's retrieval first; single-entry
readability is the constraint that keeps that honest.

## Product Purpose

Publish a connected knowledge base about interaction-era AI. Every article is
generated from a real Obsidian wiki vault by `apps/cli`'s importer, carrying that
vault's structure with it: MOC-derived domains, a backlink/related graph, a
per-article external source audit trail, and an open-questions backlog.

Success is that the published corpus stays a faithful, navigable projection of
the vault — nothing invented at the blog layer, nothing lost in transit.

## Positioning

The corpus is vault-derived and whole. A neighboring AI blog can copy the topics
but cannot truthfully copy the artifacts: real backlinks between 275 notes, a
source ledger per article, domains resolved from Map-of-Content membership rather
than assigned by hand, and a live worklist of unanswered questions harvested from
every concept. It publishes a knowledge base, not a stream of posts.

## Operating Context

- Content originates in an Obsidian vault (`WIKI_PATH`), never authored in the
  blog repo. A full `bun run --cwd apps/cli import:wiki` emits MDX plus four
  committed manifests — `article-graph.json`, `wiki-sources.json`,
  `open-questions.json`, and `search-index.json`, which it rebuilds at the end
  of every run that isn't scoped to one slug via `--only`. `build:search-index`
  regenerates that index on its own when articles change without a re-import;
  `translate` maintains the fifth, `translations.json`. The blog reads four of
  them at build time. `search-index.json` is the exception: it is bundled at
  build but *fetched in the browser* — a ~488KB chunk dynamically imported the
  first time the search palette opens, then cached for the session. So search
  carries a real lazy payload cost, and changing the index still needs a
  redeploy.
- `bun run --cwd apps/cli content:check` gates content integrity in CI: missing
  hero images, broken slug references, missing `title`/`description`/`imageAlt`.
- Every content command in this document lives in `apps/cli/package.json`, not
  the root — run it with `--cwd apps/cli` or from inside that workspace.
- Routes: home, `/articles`, `/articles/[slug]`, `/articles/domain/[domain]`,
  `/articles/tag/[tag]`, `/articles/tagged/[tag]`, `/compare`, `/shelf`,
  `/questions`, RSS (`/rss/feed.xml`, `/rss/feed.json`), `/llms.txt`,
  `/robots.txt`, `/sitemap.xml`, and a `zh-TW` locale
  mirror at `/[locale]/articles` and `/[locale]/articles/[slug]`.
  `/photos`, `/about`, and `/thank-you` were removed and permanently redirect to `/`.

## Capabilities and Constraints

- Next.js 16 App Router, React 19, Tailwind v4, static-first. **No auth, no
  database, no API routes.** Any feature that needs per-user server state is out
  of scope by construction.
- Rendering is three-tier, by design, and the article bodies are *not* in the
  prerendered tier:
  - **Prerendered at build:** home, `/articles`, the domain/tag/tagged indexes,
    `/questions`, `/shelf`. The enumerable-param ones pin it with
    `dynamic = "error"` and `dynamicParams = false`.
  - **On demand, then cached until the next deploy** (`revalidate = false`):
    every article reader — `/articles/[slug]` and `/zh-TW/articles/[slug]`, both
    of which add `dynamicParams = true` and a `generateStaticParams` returning
    `[]` — plus `/zh-TW/articles`, which inherits on-demand rendering from its
    dynamic `[locale]` parent. This deliberately skips the build-time prerender
    of all 275 articles to keep builds fast; the first request per article pays
    the render, later ones hit cache. It buys build time, *not* content
    freshness — see below.
  - **Per request:** `/compare` only, because it reads `searchParams`. It is
    `noindex` — a tool view, not content.
- New or changed content always needs a rebuild and redeploy. MDX is imported
  through a build-time webpack require-context and `translations.json` is a
  static import, so a translation or article added after the current build is
  not in the deployed bundle and 404s until the next one. `dynamicParams` defers
  *rendering* to first request; it does not defer bundling.
- `/shelf` reading history and the tweaks panel are browser-local
  (`localStorage`) — they do not survive a device change and there is no account
  to sync them to.
- Three orthogonal content axes, all set by the importer and not editable at the
  blog layer: `tag` (article kind — Concept/Entity/Essay/Index) and `domain`
  (one of 15 curated knowledge domains, 14 from vault MOCs plus a `syntheses`
  catch-all) are both *derived* — the kind from the note's folder and shape (with
  a curated per-slug override list in the CLI), the domain from its MOC
  membership. Free-form `tags` (subject labels) are not: they are authored
  in the vault note's own frontmatter and only normalized on the way through, so
  tooling must preserve them rather than infer them.
- 275 English articles, 274 with a zh-TW translation. Translation freshness is
  tracked per slug and reported by `bun run --cwd apps/cli translate:check`.
- Adding a domain is a three-file change that must agree: the contract package,
  the blog's domain-meta, and the domain CSS.

## Brand Commitments

- Name: **Howardism**. Domain `howardism.dev`. Author Howard Tai
  (`howard@howardism.dev`, `@howard86_`).
- Identity is *both* the person and the notes: a Taiwan-based software engineer
  and mathematician, whose site now holds a working AI knowledge base. Neither
  half replaces the other — the shipped `SITE_DESCRIPTION` ("sharing personal
  thoughts and journeys") under-describes the corpus and the home-page framing
  ("Working notes on interaction-era AI, kept publicly") under-describes the
  person. Both are in scope; the site must not read as a pure AI-topic
  publication that erases its author.
- Existing visual language is incumbent authority and is deliberately not
  re-decided here: the plate motif, oklch token set in `@howardism/ui`, and
  Fraunces / Newsreader / JetBrains Mono. A structural refactor brief against
  that language is open, but it is an external working document and is not
  committed to this repo — do not expect to find it here.

## Evidence on Hand

- 275 MDX articles under `src/content/articles/`, 274 under
  `src/content/articles-zh-TW/`, hero PNGs under `src/content/assets/`.
- `src/data/wiki-sources.json` — real external sources per article, with URLs.
- `src/data/article-graph.json` — real backlink/related edges.
- `src/data/open-questions.json` — the vault's actual open-questions backlog.
- A 16 Jul 2026 PageSpeed Insights run of the production home page, desktop
  emulation: FCP 0.3s, LCP 1.4s, CLS 0, TBT 300ms, Speed Index 1.1s. The report
  itself was not kept; re-run it rather than trusting these numbers indefinitely.
- **No** testimonials, customers, benchmarks, pricing, or usage metrics exist.
  Future work must not fabricate any.

## Product Principles

1. **The vault is the source of truth.** The blog renders and navigates; it never
   originates or edits content. Anything the blog shows must be traceable to an
   importer manifest.
2. **Connection over chronology.** Domain, backlink, and source relationships are
   the primary way through the corpus; date is a secondary fact.
3. **Publish the unknowns.** Open questions and source ledgers are first-class
   content, not appendices.
4. **Static by construction.** No auth, no database, no server state — features
   are designed within that, not around it.
5. **The author is a user.** Retrieval affordances for repeat visits earn their
   place even when they help no first-time reader.

## Accessibility & Inclusion

No product-specific standard has been established beyond the repo's general
Ultracite/Biome a11y lint rules. Bilingual EN / zh-TW parity is a maintained
product commitment.
