## 1. Tokens, fonts, base styles

- [ ] 1.1 Create `apps/blog/src/styles/howardism.css` with full Howardism oklch token set on `:root` (light), `.dark` overrides, and `[data-theme]` accent overrides for terracotta / moss / ink-blue / plum / ochre — including dark-theme variants. Include base body styles, paper grain via `body::before`, selection color, scrollbar chrome, prose styles, drop-cap utility, photo-card / chip / nav-pill / tweaks utilities ported from `Howardism.html` lines 15–207. Bump ochre accent to `oklch(0.56 0.16 75)` for body-text contrast (chat-2 fix #6). **Triplet-expansion target:** split into 5 sub-commits during expansion — (1.1a) tokens + light/dark base, (1.1b) `[data-theme]` accent overrides for all 5 themes × 2 modes, (1.1c) base body + grain + selection + scrollbar, (1.1d) prose + drop-cap utilities, (1.1e) chip / nav-pill / tweaks-panel utilities.
- [ ] 1.2 Wire fonts in `apps/blog/src/app/(blog)/layout.tsx` via `next/font/google`: Fraunces (display, weights 300–600 + italic axis), Newsreader (body, weights 300–700 + italic), JetBrains Mono (mono, 400/500/600). Expose CSS variables `--font-display`, `--font-body`, `--font-mono` on the layout root element.
- [ ] 1.3 Update `apps/blog/src/styles/globals.css` to import `./howardism.css` after the existing imports. Verify Tailwind v4 `@theme inline` block exposes the Howardism tokens as utilities (`bg-paper`, `text-ink-2`, `border-rule`, `font-display`, `font-body`, `font-mono`).
- [ ] 1.4 Run `bun --filter @howardism/blog run type-check` and `bun --filter @howardism/blog run lint`; verify no diagnostics. Smoke `bun --filter @howardism/blog run dev` and confirm fonts load + grain visible at body level (no per-section restacking).

## 2. Howardism primitives

- [ ] 2.1 Create `apps/blog/src/components/howardism/SunDisc.tsx` (props: `size`, `plate`, `number`, `accent`, `className`). Match `Howardism.html:494–520` shape: radial gradient, grain overlay, plate label bottom-right, plate number top-left.
- [ ] 2.2 Create `apps/blog/src/components/howardism/HalfDisc.tsx` (props: `size`, `align: "right"|"left"`, `accent`, `className`). Half-circle bleed variant per `Howardism.html:523–542`.
- [ ] 2.3 Create `apps/blog/src/components/howardism/DataGrid.tsx` (props: `rows: [string, string][]`, `maxWidth`, `className`). Mono-label → serif-value 2-column grid per `Howardism.html:545–558`.
- [ ] 2.4 Create `apps/blog/src/components/howardism/DiscPageHeader.tsx` (props: `volume`, `title`, `titleAccent?`, `plate`, `number`, `data?: [string,string][]`, `discSize?`, `children?`). Composed header per `Howardism.html:563–593`.
- [ ] 2.5 Create `apps/blog/src/components/howardism/Eyebrow.tsx` (props: `children`, `className`).
- [ ] 2.6 Create `apps/blog/src/components/howardism/Squiggle.tsx` (no props). SVG squiggle rule.
- [ ] 2.7 Create `apps/blog/src/components/howardism/Ph.tsx` (props: `label`, `aspect`, `tone`, `meta?: string`, `className`). Striped placeholder image with optional metadata strip; vary tones via existing `palettes` array.
- [ ] 2.8 Create `apps/blog/src/components/howardism/Chip.tsx` (props: `children`, `dot?: boolean`, `className`).
- [ ] 2.9 Create `apps/blog/src/components/howardism/PhotoCard.tsx` (props: `src?`, `label`, `aspect`, `tape?: boolean`, `caption?`, `tone?: number`, `className`). Composes `Ph` with optional tape strip + caption.
- [ ] 2.10 Create `apps/blog/src/components/howardism/photoData.ts` exporting a typed `Photo[]` with at least 12 entries spanning ≥3 distinct tones and ≥3 distinct aspect ratios; include lens-style metadata strings ("f/8 · 1/125 · 18m · Tioman").
- [ ] 2.11 Add unit tests under `apps/blog/src/__tests__/howardism/` for: SunDisc default render (default plate label + number), HalfDisc alignment (left vs right anchored gradient), DataGrid composition (n rows → 2n cells in correct order), DiscPageHeader composition (renders volume + plate-no + DataGrid + SunDisc), Eyebrow renders mono uppercase, Squiggle renders SVG path, Ph applies aspect ratio + tone, Chip renders dot when `dot` prop true, PhotoCard renders tape strip when `tape` true. Use existing Bun test config.

## 3. Tweaks panel infrastructure

- [ ] 3.1 Create `apps/blog/src/components/tweaks/types.ts` with the `Tweaks` discriminated type and the canonical defaults constant.
- [ ] 3.2 Create `apps/blog/src/components/tweaks/InitTweaksScript.tsx` — server component that renders an inline `<script>` with the no-FOUC IIFE (try/catch, parse storage, set `dataset.theme` and `.dark` class). Export the script body string for unit testing.
- [ ] 3.3 Create `apps/blog/src/components/tweaks/TweaksProvider.tsx` — client `"use client"` context provider that hydrates from localStorage on mount, exposes `{state, setTheme, setMode, setHomeLayout}`, persists on every change, and re-applies `dataset.theme` + `.dark` class on every state mutation.
- [ ] 3.4 Create `apps/blog/src/components/tweaks/TweaksPanel.tsx` — Sheet from `@howardism/ui` (right side). Three sections: theme swatches (5 oklch circles with active outline ring), mode segmented toggle (Sun/Moon, `aria-pressed`), home layout segmented control (4 options, only active when current pathname is `/`). All buttons keyboard-reachable.
- [ ] 3.5 Create `apps/blog/src/components/tweaks/TweaksLauncher.tsx` — fixed bottom-right circular ✨ button + `T` keypress handler (suppress when `e.target.tagName` is `INPUT` or `TEXTAREA`). Use `Sheet` open/close state; opens panel.
- [ ] 3.6 Wire all of the above into `apps/blog/src/app/(blog)/layout.tsx`: render `<InitTweaksScript/>` in `<head>`, wrap children with `<TweaksProvider/>`, render `<TweaksLauncher/>` after `<Footer/>`.
- [ ] 3.7 Add unit tests:
  - `InitTweaksScript` script body sets correct dataset attributes given seeded localStorage; tolerates malformed JSON; tolerates missing key.
  - `TweaksProvider` persists changes to localStorage; reads on mount; defaults applied when storage empty.
  - `TweaksLauncher` `T` keypress toggles open; keypress in `<input>` does not toggle.

## 4. Header / Footer chrome

- [ ] 4.1 Create `apps/blog/src/app/(blog)/(layout)/Avatar.tsx` (or co-locate in `Header.tsx`) — generated initial disc per `Howardism.html:389–405`.
- [ ] 4.2 Rewrite `apps/blog/src/app/(blog)/(layout)/Header.tsx` to Howardism nav-pill: Avatar + Fraunces wordmark + JetBrains Mono volume subtitle + 4-item nav (Home / Articles / Photos / About) + Skip-to-content anchor at top. Remove the `ModeToggle` block entirely. Keep mobile `Sheet` menu but restyle internals to Howardism vocabulary.
- [ ] 4.3 Update `apps/blog/src/app/(blog)/(layout)/constants.ts`: `NavSection` becomes `Home / Articles / Photos / About` (drop `App` and `Tools`). Define routes: `/`, `/articles`, `/photos`, `/about`.
- [ ] 4.4 Rewrite `apps/blog/src/app/(blog)/(layout)/Footer.tsx`: minimal Howardism vocabulary with Avatar (28px), `© Howardism · YYYY · Singapore / anywhere` mono caption, footer nav (Home / Articles / Photos / About / Tools / RSS / Colophon — Tools preserved here), dashed-rule top border per `Howardism.html:431–447`.
- [ ] 4.5 Run a11y check: skip-to-content focusable on first Tab, all nav links keyboard-reachable, focus rings visible.

## 5. Article frontmatter contract + backfill

**Sequencing invariant (load-bearing):** the type tightening (5.2b) and the MDX edits (5.2a) MUST land in the SAME commit. Splitting them produces a transient broken build that violates the article-meta spec.

- [ ] 5.1 Enumerate every `apps/blog/src/app/(blog)/articles/[slug]/(docs)/<slug>/page.mdx` (`ls` the docs dir to get the full list — at least the canonical 5 articles plus any added since). For each: count words in prose; compute `readingTime = clamp(ceil(words / 200), 1, 30)`; propose a `tag` from the canonical allowlist (`Programming | Engineering | Architecture | Fundamentals | Personal | Ocean | Notes`). Surface the proposed tag list to the orchestrator/user for review/override BEFORE editing files (chat-2 concern #6 / MEMORY decision).
- [ ] 5.2 In a single atomic commit (must NOT split):
  - (a) edit each `page.mdx` to add `tag` and `readingTime` (and `dropCap: true` only where the user opted in) to the exported `meta`,
  - (b) extend `ArticleMeta` interface in `apps/blog/src/app/(blog)/articles/service.ts` with required `tag: string`, required `readingTime: number`, optional `dropCap?: boolean`,
  - (c) update any internal `Pick<>`/`Omit<>` of `ArticleMeta` across the codebase (grep for `ArticleMeta` and `Pick<.*ArticleMeta`).
- [ ] 5.3 Run `bun --filter @howardism/blog run type-check`; verify zero errors. Run `bun --filter @howardism/blog run build`; verify build green. Both MUST pass on the same commit as 5.2.
- [ ] 5.4 Add a regression unit test under `apps/blog/src/__tests__/articles/` that imports `ArticleMeta` and asserts `tag` + `readingTime` are required (`@ts-expect-error` on a literal missing them). Pinned to satisfy the article-meta spec scenario "Backfill commits land before consumer code".

## 6. Articles index redesign

- [ ] 6.1 Rewrite `apps/blog/src/app/(blog)/articles/page.tsx` to Howardism layout per `Howardism.html:952–1049`: double-rule masthead, inline tag filter ("Filed under …" with active state italic + accent + underline 1px), numbered list with oversized terracotta numerals, no `<SunDisc/>` or `<HalfDisc/>`. Pull tag list from union of `meta.tag` across articles.
- [ ] 6.2 Update `apps/blog/src/app/(blog)/articles/ArticleCard.tsx` to surface `meta.tag` and `meta.readingTime` chips. ArticleCard remains in use on the home FeaturedArticles surface (the new Articles index uses an inline numbered list, not ArticleCard). Verify ArticleCard's only consumer after the redesign is `FeaturedArticles.tsx`; if Articles index still imports it, remove that import.
- [ ] 6.3 Replace any `onClick` row patterns with `<Link href={\`/articles/${slug}\`}>` wrappers; ensure focus ring (`focus-visible:ring-2 ring-accent ring-offset-2`).
- [ ] 6.4 Verify on `bun run dev`: tag filter narrows list, numbered list visually balanced, hover paddingLeft animation honors reduced-motion.

## 7. Article detail redesign

- [ ] 7.1 Update `apps/blog/src/app/(blog)/articles/[slug]/ArticleLayout.tsx` to Howardism layout per `Howardism.html:1057–1177`: mini-masthead with `Plate II · Piece № NN`, **HalfDisc corner bleed** (NOT full SunDisc), `<DataGrid/>` (Published / Filed / Reading / Author), italic description lede, prose with optional drop-cap (`meta.dropCap === true`), `§ end` rule, author card, bracketed prev/next using Next.js `<Link>` (real anchors).
- [ ] 7.2 Replace any `onClick` div patterns in prev/next nav with `<Link href>` anchors. Verify keyboard reachability and right-click "open in new tab" behavior.
- [ ] 7.3 Add a smoke test for an article with `dropCap: true` rendering `drop-cap` class on first paragraph; another article without `dropCap` not rendering the class.

## 8. Home redesign

- [ ] 8.1 Create `apps/blog/src/app/(blog)/HeroClassic.tsx` — port `HeroClassic` from `Howardism.html:601–646`. Replace static placeholder portrait with `Ph` primitive; remove unused tape if not desired.
- [ ] 8.2 Create `apps/blog/src/app/(blog)/HeroStatement.tsx` — port `HeroStatement` from `Howardism.html:649–677`.
- [ ] 8.3 Create `apps/blog/src/app/(blog)/HeroDisc.tsx` — port `HeroDisc` from `Howardism.html:680–727` using shared `<SunDisc/>`.
- [ ] 8.4 Create `apps/blog/src/app/(blog)/HeroIndex.tsx` — port `HeroIndex` from `Howardism.html:730–790` with article data.
- [ ] 8.5 Create `apps/blog/src/app/(blog)/Hero.tsx` — `"use client"` switcher. Reads Tweaks `homeLayout` via `useTweaks()`. Receives `articles: ArticleEntity[]` as a prop. Renders one of `<HeroClassic/>`, `<HeroStatement/>`, `<HeroDisc/>`, `<HeroIndex articles={articles}/>` based on the active layout. Default branch: `disc`.
- [ ] 8.6 Rewrite `apps/blog/src/app/(blog)/page.tsx` — stays a Server Component:
  - (a) `const articles = await getSlicedArticles(4)` — server fetch.
  - (b) Render `<Hero articles={articles}/>` (client child).
  - (c) Render `<Photos/>` (existing Server Component, unchanged behavior — keeps article-image-driven per design Decision 8 / concern #4 path a).
  - (d) Render `<FeaturedArticles articles={articles}/>` — extract from current `page.tsx` into its own Server Component file `apps/blog/src/app/(blog)/FeaturedArticles.tsx`. Stays server-rendered (no Tweaks, no client hooks).
  - (e) Right rail composes `<Newsletter/>`, `<Resume/>`, `<Elsewhere/>` (Server Components, restyled in 8.7–8.9).
- [ ] 8.7 Restyle `apps/blog/src/app/(blog)/NewsLetter.tsx` to Howardism card chrome per `Howardism.html:861–883`. PRESERVE existing POST behavior to `/api/subscription` (do not change request shape).
- [ ] 8.8 Restyle `apps/blog/src/app/(blog)/Resume.tsx` to Howardism card chrome per `Howardism.html:885–910`. Data unchanged.
- [ ] 8.9 Create `apps/blog/src/app/(blog)/Elsewhere.tsx` — Howardism card listing socials per `Howardism.html:912–929`. Source from existing `SocialLinks.tsx` data shape.
- [ ] 8.10 Update home `page.tsx` to render Elsewhere card alongside Newsletter + Resume in the right rail.

## 9. Photos route

- [ ] 9.1 Create `apps/blog/src/app/(blog)/photos/page.tsx` — server component with `<DiscPageHeader/>` (Plate III, "Field notes, mostly blurry.") and a contact-sheet grid composed from `photoData.ts`.
- [ ] 9.2 Create `apps/blog/src/app/(blog)/photos/PhotoGrid.tsx` — pure presentation client component that renders the contact sheet per `Howardism.html:1185–1257`, varying aspect ratios, `№ NNN` overlays, lens-meta strips.
- [ ] 9.3 Add an `End of roll` rule below the grid.
- [ ] 9.4 Verify photo grid varies tones/aspect ratios per spec.

## 10. About route

- [ ] 10.1 Create `apps/blog/src/app/(blog)/about/page.tsx` — quiet plate (no SunDisc, no HalfDisc), masthead with `Plate IV · Howard Tai, in long form.`, long-form prose per `Howardism.html:1268–1313`, italic lede.
- [ ] 10.2 Create `apps/blog/src/app/(blog)/about/AboutSidebar.tsx` — Now reading + Where I've been + Colophon ruled lists per `Howardism.html:1315–1369`. Pull Where I've been data from existing `Resume.tsx` data export (refactor `Resume.tsx` to expose data separately if needed).
- [ ] 10.3 Verify no SunDisc/HalfDisc in `/about` DOM.

## 11. A11y + cross-cutting cleanup

- [ ] 11.1 **Verification grep, not reimplementation** — anchor wiring already done in 6.3, 7.2 during page work. Run: `rg "onClick=" apps/blog/src/app/\(blog\)` and confirm no clickable rows/cards remain that aren't real `<Link>` or `<a href>` anchors. If any survive, fix in this task; otherwise close as "no changes required, verified".
- [ ] 11.2 Add `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2` (or equivalent CSS rule) to all interactive elements: nav links, list items, tweak swatches, tweak toggles, photo cards, prev/next anchors.
- [ ] 11.3 Verify Skip-to-content anchor first in tab order, becomes visible on focus, jumps to `<main>`.
- [ ] 11.4 In `howardism.css` wrap each animation/transform rule for page-enter, photo-card hover rotation, and hover translateY in `@media (prefers-reduced-motion: no-preference) { … }`. Add a unit test under `apps/blog/src/__tests__/howardism/reduced-motion.test.tsx` that toggles a mock `matchMedia` to `reduce` and asserts the page-enter element has no `animation-name` computed. Static visuals (colors, layout, type) MUST be preserved under reduced-motion.
- [ ] 11.5 Manual WCAG AA contrast sampling — no new dependency. For each of 5 themes × 2 modes (10 combinations), open the running dev server in Chrome DevTools, inspect a body-text element using `--ink` over `--paper` and a link/chip using `--accent` over `--paper`, and capture the WCAG contrast ratio shown in the Contrast field. Document the 10 ratios in the validation commit message; AA threshold is 4.5:1 for body text (16px), 3:1 for large text (18px+ bold or 24px+). Fix any failures (likely none after ochre bump per chat-2 fix #6).
- [ ] 11.6 Smoke `bun --filter @howardism/blog run dev` end-to-end: navigate Home → Articles → Article → Photos → About; toggle theme + mode + home layout; reload to verify no FOUC; verify keyboard-only navigation works.
- [ ] 11.7 Run `bun --filter @howardism/blog run type-check`, `bun --filter @howardism/blog run lint`, `bun --filter @howardism/blog run test`, `bun --filter @howardism/blog run build`. All MUST pass.

## 12. Final validation

- [ ] 12.1 Run `openspec validate redesign-blog-howardism --strict`; verify pass.
- [ ] 12.2 Verify the commit log reflects the migration order from design.md: tokens (Group 1) → primitives (Group 2) → tweaks (Group 3) → chrome (Group 4) → meta+backfill (Group 5) → Articles index (Group 6) → Article detail (Group 7) → Home (Group 8) → /photos (Group 9) → /about (Group 10) → a11y (Group 11). No commit in 6/7/8 lands before the meta+backfill commit (Group 5).
- [ ] 12.3 Hand off for integrated review (orchestrator stage 9 — code-review skill + spec-verify).
