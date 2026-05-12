## Why

The Howardism design (`Howardism.html`, exported from claude.ai/design) defines a warm-paper, journal-style visual system that gives the personal blog a coherent identity it lacks today — Fraunces/Newsreader/JetBrains Mono typography, oklch warm-paper tokens, the Sun Disc signature, and an editorial "Plate / Vol. / Piece №" vocabulary. The current `apps/blog` surface uses default shadcn HSL tokens with no distinctive type or layout language, and chat-2 review of the design proposes restraints (don't over-spend the disc, drop unused chrome, fix a11y gaps on clickable rows). This change ports the approved Howardism aesthetic to `apps/blog`, with the chat-2 restraints baked in from day one.

## What Changes

- Add Howardism oklch token stack (`--bg`, `--paper`, `--ink-*`, `--rule-*`, `--accent`, `--accent-2`, `--accent-soft`, `--shadow*`, font tokens) layered on `:root` alongside the existing Nippon HSL tokens (no churn to `@howardism/ui` Sheet/Button consumers).
- Load Fraunces, Newsreader, JetBrains Mono via `next/font/google` and expose them through Tailwind v4 `@theme` font tokens.
- Add a `<TweaksProvider/>` React context with localStorage-backed state `{theme, mode, homeLayout}`, a `<TweaksPanel/>` (Sheet) UI with theme swatches + mode toggle + home-layout segmented control, a `<TweaksLauncher/>` (✨ button + `T` keybind), and a no-FOUC inline `<script>` that applies `data-theme`/`.dark` before paint.
- **BREAKING (in-tree only)**: remove `Header.tsx::ModeToggle`. Mode lives only in Tweaks panel.
- Add reusable Howardism primitives under `apps/blog/src/components/howardism/`: `SunDisc`, `HalfDisc`, `DataGrid`, `DiscPageHeader`, `Eyebrow`, `Squiggle`, `Ph` (placeholder image), `Chip`, `PhotoCard`, plus typed `photoData.ts`.
- Redesign Home (`/`) with four selectable layouts (`classic | statement | disc | index`); default `disc`. Sun Disc is full-size on the disc layout only.
- Redesign Articles index (`/articles`) as a double-rule masthead + inline tag filter + numbered terracotta-numeral index — **no SunDisc** (chat-2 fix #1).
- Redesign Article detail (`/articles/[slug]`) with mini-masthead, **HalfDisc** corner bleed (downgraded from full disc), DataGrid metadata, opt-in drop-cap (`meta.dropCap`), bracketed prev/next anchors.
- Add new route `/photos` with full SunDisc landing surface, contact-sheet grid using `photoData.ts` placeholders (varied tones + aspect ratios + lens metadata strips per chat-2 fix #3).
- Add new route `/about` with quiet plate (no disc), long-form prose, and a sidebar (Now reading / Where I've been / Colophon).
- Restyle Header (`(layout)/Header.tsx`) as Howardism nav-pill (Avatar + Vol/quiet-corner subtitle, 4-item nav: Home/Articles/Photos/About). Restyle Footer with dashed-rule chrome, mono labels, and a `Tools` link (preserves `/tools` discoverability after dropping it from primary nav).
- Restyle existing home cards (`NewsLetter`, `Resume`) with Howardism vocabulary. Newsletter form preserves `/api/subscription` POST behavior. Add a new `Elsewhere` card surfacing socials.
- Extend the article frontmatter contract with required `tag: string` and required `readingTime: number`, plus optional `dropCap?: boolean`. Backfill all existing MDX articles (implementer infers `readingTime` from word count and proposes `tag` per article during validation).
- A11y pass per chat-2 fix #5: replace `<article onClick>` / `<li onClick>` with real `<Link>` wrappers; add `focus-visible:ring-2 ring-accent` rings; add a "Skip to content" anchor in Header; respect `prefers-reduced-motion` on page-enter and photo-card hover; bump ochre theme accent for body-text contrast (chat-2 fix #6).

## Capabilities

### New Capabilities
- `blog-howardism-design-system`: Howardism warm-paper token stack, typography, paper grain, reusable primitives (SunDisc / HalfDisc / DataGrid / DiscPageHeader / Eyebrow / Squiggle / Ph / Chip / PhotoCard), and the Tweaks panel infrastructure (provider, panel UI, launcher, no-FOUC script, localStorage persistence).
- `blog-howardism-pages`: Page-level redesigns of Home (4 layouts), Articles index, Article detail, Header, Footer; new `/photos` and `/about` routes; restyled Newsletter/Resume/Elsewhere home cards; a11y guarantees for clickable rows, focus rings, skip-to-content, and reduced-motion.
- `blog-article-meta`: Article MDX frontmatter contract requiring `tag` and `readingTime`, with optional `dropCap`. Defines validation behavior (build-time error on missing required fields) and the migration commitment to backfill existing articles.

### Modified Capabilities
<!-- None — no existing OpenSpec specs cover the blog visual surface or article frontmatter. -->

## Impact

- **Affected code:**
  - New: `apps/blog/src/styles/howardism.css`; `apps/blog/src/components/howardism/**`; `apps/blog/src/components/tweaks/**`; `apps/blog/src/app/(blog)/photos/**`; `apps/blog/src/app/(blog)/about/**`; per-Hero components under `apps/blog/src/app/(blog)/Hero*.tsx` + `Hero.tsx` switcher; `apps/blog/src/app/(blog)/Elsewhere.tsx`.
  - Modified: `apps/blog/src/app/(blog)/layout.tsx`, `page.tsx`, `(layout)/Header.tsx`, `(layout)/Footer.tsx`, `(layout)/constants.ts`, `articles/page.tsx`, `articles/ArticleCard.tsx`, `articles/[slug]/ArticleLayout.tsx`, `articles/service.ts`, `Photos.tsx`, `NewsLetter.tsx`, `Resume.tsx`, `styles/globals.css`, all existing `articles/[slug]/(docs)/<slug>/page.mdx` files (frontmatter backfill).
- **Affected APIs:** none. `/api/subscription` request shape preserved.
- **Affected dependencies:** none added at workspace level. Fonts via built-in `next/font/google`.
- **Affected systems:**
  - Existing `Header.tsx::ModeToggle` is removed in favor of Tweaks panel — any external code or tests that target the moon/sun button must move to the Tweaks UI.
  - Article build will fail loudly if a `page.mdx` is missing `tag` or `readingTime` after this change lands; backfill is part of this change to keep the build green.
  - Out of scope: `@howardism/design-system` standalone package, color palette page, `/profile` and sub-routes, `/tools/*`, `/api/*`, `/login`, `/thank-you`, `src/pages/`, real photo assets, CLAUDE.md docs-hygiene (separate change).
