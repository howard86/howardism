## Context

`apps/blog` is the primary public surface in the howardism monorepo. It runs on Next.js 16 (App Router), React 19, Tailwind v4, with `@howardism/ui` (shadcn-derived) for primitive components. Existing visual surface uses the project's "Nippon" HSL token palette and ad-hoc layout in each page; there is no shared visual vocabulary, no theme/mode persistence beyond a single moon/sun button in `Header.tsx::ModeToggle`, and the home/articles/article surfaces sit somewhere between portfolio template and personal blog without a coherent identity.

The user produced a Howardism design (`Howardism.html`) in claude.ai/design, iterated through three chat sessions, and landed on a warm-paper, journal-style aesthetic: oklch tokens, Fraunces (display) + Newsreader (body) + JetBrains Mono (labels), a paper grain background, a Sun Disc signature primitive, and an editorial vocabulary ("Plate I · Surface", "Vol. 03", "Piece № 02"). Chat-2 is a critical-design review of the prototype that produced fixes 1–7; the user said "applying the fixes 1–5 sequentially" and they were applied in chat-1's later turns, so the **prototype already reflects fixes 1–5** plus 6–7. This change ports that final aesthetic to `apps/blog`.

Current routes: `/` (home), `/articles`, `/articles/[slug]`, `/profile/*` (auth-gated), `/tools/*`, `/login`, `/thank-you`, `/api/*`, `/rss`. New routes proposed: `/photos`, `/about`. `/profile` stays — it is a logged-in user dashboard, not a bio surface.

The `(blog)` route group has its own `layout.tsx` wrapping Header + Footer; that's the natural mount point for `TweaksProvider`, `TweaksLauncher`, and the no-FOUC inline script.

`@howardism/ui` continues to consume the existing Nippon HSL tokens (`--background`, `--primary`, `--border`, etc.). This change does not alter those tokens or re-skin `@howardism/ui`. The Howardism oklch tokens (`--bg`, `--paper`, `--ink`, `--accent`, etc.) live alongside on `:root` and are consumed only by Howardism components.

## Goals / Non-Goals

**Goals:**
- Visual coherence across `apps/blog`'s public surface (Home, Articles, Article detail, Photos, About, Header, Footer) with the Howardism warm-paper aesthetic.
- Reusable primitives (`SunDisc`, `HalfDisc`, `DataGrid`, `DiscPageHeader`, `Eyebrow`, `Squiggle`, `Ph`, `Chip`, `PhotoCard`) that compose into all page-level surfaces and remain available for future surfaces.
- Theme/mode/home-layout user customization via a Tweaks panel with localStorage persistence and no FOUC on first paint.
- Restraint per chat-2 review: SunDisc full-size only on Home (disc layout) + Photos; HalfDisc on Article detail; no disc on Articles index, About, or non-disc home variants.
- A11y: real `<Link>` wrappers on all clickable rows, visible focus rings, skip-to-content anchor, `prefers-reduced-motion` respect.
- Non-disruption: `@howardism/ui` consumers, `/profile`, `/tools`, `/api`, auth, and existing tests keep working unchanged.

**Non-Goals:**
- Standalone `@howardism/design-system` package (chat-1 spinoff — defer; primitives live in `apps/blog` for now).
- Color palette page from chat-3.
- Real photo assets (deferred — placeholder-with-metadata path is intentional per chat-2 fix #3).
- Re-skinning `@howardism/ui` Sheet / Button / etc. The transient Sheet visual seam in the Tweaks panel is accepted (chat-2 concern #5).
- Modifying `/profile`, `/tools/*`, `/login`, `/thank-you`, `/api/*`, or `src/pages/`.
- Backporting the design to `apps/recipe`, `apps/github-search`, `apps/template`, or `apps/minecraft`.
- CLAUDE.md docs-hygiene drift fix (separate change — `@howardism/blog` actually runs Next 16, not 14, but that doc lives outside this change).

## Decisions

### Decision 1: Dual token stack on `:root`, no bridge mapping

**Choice:** Add Howardism oklch tokens alongside existing Nippon HSL tokens on `:root`. Howardism components consume `var(--bg)`, `var(--paper)`, `var(--ink)`, etc. `@howardism/ui` continues consuming `var(--background)`, `var(--primary)`, etc. The two stacks coexist; no aliasing.

**Why over alternative:** Alternative was to remap shadcn semantic tokens (`--background`, `--primary`) to Howardism values, which would re-skin `@howardism/ui`. That breaks the look of `Sheet`, `Sidebar`, `Form` etc. across `/tools/*` (in-tree consumers of `@howardism/ui`) and any future surface. Keeping the stacks independent is two-token-files of housekeeping for clean separation.

**Implication:** The Tweaks panel uses `Sheet` from `@howardism/ui`, which renders with HSL Nippon chrome on top of warm-paper pages. Acceptable visual seam in transient overlay (chat-2 concern #5, deferred decision).

### Decision 2: Tweaks state shape and persistence

**Choice:** Single React context `TweaksProvider` exposes `{theme, mode, homeLayout, setTheme, setMode, setHomeLayout}`. Persisted to localStorage key `howardism:tweaks` as JSON. Defaults: `terracotta / light / disc`.

```ts
type Tweaks = {
  theme: "terracotta" | "moss" | "ink-blue" | "plum" | "ochre";
  mode: "light" | "dark";
  homeLayout: "classic" | "statement" | "disc" | "index";
};
```

**Why over alternative:**
- *URL params:* would force `?theme=…` everywhere, not friendly for a blog.
- *Cookies:* possible but overkill — no SSR personalization needed; default render is fine.
- *Three separate contexts:* over-engineered; the three values are read together in nearly every consumer (panel, Hero switcher) and change together at the same UI surface.

**Implication:** First server-rendered HTML uses defaults. Client hydration may swap the theme, which is what causes FOUC if not handled. See Decision 3.

### Decision 3: No-FOUC inline `<script>` runs before React hydrates

**Choice:** A small `<script>` injected via `<InitTweaksScript/>` in `(blog)/layout.tsx` `<head>` reads localStorage and sets `document.documentElement.dataset.theme = saved.theme; document.documentElement.classList.toggle("dark", saved.mode === "dark")` synchronously on first paint. The TweaksProvider's `useEffect` later re-applies the same values, ensuring React's idea of state matches the DOM.

```tsx
// InitTweaksScript.tsx
const script = `
(function(){try{
  var s=localStorage.getItem('howardism:tweaks');
  if(!s)return;
  var t=JSON.parse(s);
  if(t.theme)document.documentElement.dataset.theme=t.theme;
  if(t.mode==='dark')document.documentElement.classList.add('dark');
}catch(e){}})();`;
return <script dangerouslySetInnerHTML={{__html: script}} />;
```

**Why over alternative:**
- *Cookie-based theme on the server:* eliminates FOUC but adds a request mutation surface and forces every page through cookie middleware. The blog is otherwise static — too heavy.
- *No FOUC mitigation:* on every refresh, dark-mode users see one frame of light theme. Unacceptable.

**Implication:** Inline script runs untyped on every page load. Test required: assert `document.documentElement.dataset.theme === stored.theme` after script execution given seeded `localStorage`. This is the unit test called out in MEMORY.md hydration concern.

### Decision 4: `tag` and `readingTime` are required `ArticleMeta` fields; backfilled in this change

**Choice:** Extend the `ArticleMeta` interface in `apps/blog/src/app/(blog)/articles/service.ts` with required `tag: string` and required `readingTime: number`, plus optional `dropCap?: boolean`. `getArticles()` will throw a build-time error if any `page.mdx` is missing these fields. Backfill all existing MDX articles in this same change.

**Why required (not optional):**
- The articles index numbered list and the home FeaturedArticles tag chip both depend on these values to render. Defaulting to `"Untagged" / 5` produces silent quality bugs.
- Build-time failure on missing field is surfaced once at MDX edit time, not at runtime where the page renders weirdly.

**Backfill approach (chat-2 concern #6, path b):** Implementer reads each `page.mdx`, computes `readingTime` from word count (200 wpm, rounded up, clamped to [1, 30]), proposes a `tag` from a small allowlist (`Programming | Engineering | Architecture | Fundamentals | Personal | Ocean | Notes`), commits a backfill commit per article OR one bulk backfill commit. User reviews proposed tags during validation.

### Decision 5: Restraint table is the design — encoded in component placement, not configuration

**Choice:** SunDisc usage is fixed at the call site, not configurable per page. There is no "show disc" prop on `DiscPageHeader` — the component renders a `SunDisc` always, and the decision of whether to use `DiscPageHeader` vs. a stripped variant lives at the page level.

| Surface          | Header component                       |
|------------------|----------------------------------------|
| Home (disc)      | `<HeroDisc/>` — full SunDisc           |
| Photos           | `<DiscPageHeader/>` — full SunDisc     |
| Article detail   | `<ArticleMasthead/>` — HalfDisc bleed  |
| Articles index   | `<MastheadOnly/>` — no disc            |
| About            | `<MastheadOnly/>` — no disc            |

**Why:** A configurable `disc?: boolean` on `DiscPageHeader` would invite future drift — every new page gets one because it's the path of least resistance. Static placement keeps the disc rare.

### Decision 6: Home layout switching uses Tweak state, not URL

**Choice:** `homeLayout` is a Tweak (persisted to localStorage). Default is `disc`. The home `page.tsx` is a client-tree-rooted render that reads Tweaks and renders the matching `<HeroXxx/>` variant. Server render emits the default `disc` layout; client may swap on hydration based on stored preference.

**Why over URL routes (`/?layout=statement`):**
- The home is one URL — switching layouts via URL fragments invites SEO ambiguity.
- Tweak persistence matches the design's "personal customization" framing in chat-1.

**Implication:** `page.tsx` becomes a thin client wrapper around `<Hero/>` that consumes Tweaks. Server-side data fetching for FeaturedArticles still happens in the parent component (Server Component) and is passed as a prop to the client subtree.

### Decision 7: Mode lives only in Tweaks; Header `ModeToggle` is removed

**Choice:** Delete `Header.tsx::ModeToggle` (the moon/sun button). Mode is set exclusively via the Tweaks panel.

**Why over keeping both:** Two surfaces controlling the same state is a class of bug — they must stay in sync, and it doubles the a11y surface. The Tweaks panel is one keypress away (`T`), which is faster than reaching for a header button.

**Migration:** None outside the change. There is no documented external dependency on the moon/sun button.

### Decision 8: Photos on home keeps article-image-driven behavior

**Choice:** Existing `Photos.tsx` (which surfaces article hero images on the home strip) stays as-is in behavior; only its visual chrome changes. The new `/photos` route uses `photoData.ts` placeholders with metadata strips.

**Why:** Replacing home Photos with placeholder data would lose the implicit "this is a recent piece" affordance. Keeping article-image-driven on home and intentional placeholders on the dedicated route gives each surface its own identity.

### Decision 9: Tools removed from primary nav; preserved in Footer

**Choice:** Primary nav-pill: Home / Articles / Photos / About (4 items, matches design). Footer adds a `Tools` link (preserves discoverability of `/tools/checkout`, `/tools/sudoku`, `/tools/strip-html-tags`, `/tools/design-system`).

**Why:** The Howardism nav-pill is sized for 4 items. A 5th item breaks the visual rhythm. Tools is a utility surface, not a primary destination.

## Risks / Trade-offs

- [Visual seam: Tweaks Sheet uses HSL Nippon tokens against warm-paper page] → Accept; transient overlay. Revisit only if validation flags it. (chat-2 concern #5)
- [Backfill across all `page.mdx` files is content work, not just code] → Implementer infers `readingTime` from word count and proposes `tag` per article; user reviews proposed tags during validation. Bulk-commit acceptable.
- [No-FOUC script runs untyped, can desync from `Tweaks` shape if storage key drifts] → Hard-coded localStorage key, hard-coded shape, dedicated unit test pinned to that shape. If `Tweaks` type changes, the script and the test must change together.
- [`tag`/`readingTime` newly-required fields will fail build for any MDX added before backfill lands] → Backfill is part of this change (single commit ladder); CI will only see the new contract after backfill commit. Locally during development, the implementer must order commits accordingly.
- [Reduced-motion users still see grain background and theme transitions] → Static visuals are fine under reduced-motion; only animations (page-enter, photo card hover rotation, hover translateY) gate on `prefers-reduced-motion`. Documented in `howardism.css`.
- [Dark mode token contrast on five themes is not yet verified pixel-perfect] → Validator runs WCAG AA contrast check on `--ink` over `--paper` and `--accent` over `--paper` for all 5 themes × 2 modes (10 combinations). Failures block. (chat-2 fix #6 already bumped ochre.)
- [SunDisc full-size on mobile may overflow viewport] → SunDisc has a `max-width: size` cap and uses `clamp()` for typography; verified against 360px viewport during validation.

## Migration Plan

This is in-tree work on a single app — no infrastructure migration. Sequence within the change:

1. Land tokens + fonts + base styles (`howardism.css`, `globals.css` import).
2. Land Howardism primitives (`SunDisc`, `HalfDisc`, `DataGrid`, `DiscPageHeader`, etc.) with unit/visual tests.
3. Land Tweaks infrastructure (`TweaksProvider`, `TweaksPanel`, `TweaksLauncher`, `InitTweaksScript`).
4. Wire `(blog)/layout.tsx` to mount Tweaks + import `howardism.css`.
5. Restyle Header + Footer chrome.
6. Backfill MDX frontmatter (`tag`, `readingTime`) — must precede article-meta consumers.
7. Update `ArticleMeta` interface in `service.ts`, redesign Articles index, redesign Article detail.
8. Redesign Home (Hero variants + restyled cards).
9. Add `/photos` route + `photoData.ts`.
10. Add `/about` route.
11. A11y pass: clickable-row anchor wrappers, focus rings, skip link, reduced-motion.

Rollback: any single step is its own commit; `git revert` of the full series restores the previous look.

## Open Questions

- Are the existing MDX articles' computed `readingTime` values (from word count) acceptable to the user, or should we let user override? **Proposal:** computed values committed by implementer; user can override during validation review or in a follow-up commit.
- Should the `Tools` footer link point to `/tools` (current index) or to a hand-curated list? **Proposal:** point to `/tools` (existing index). Out of scope to rebuild that page in Howardism vocabulary.
- Should Tweaks panel state sync across browser tabs (BroadcastChannel)? **Proposal:** no — single-tab persistence is sufficient for a personal blog. Can be added later if user complains.
- Should the design-system standalone package (`@howardism/design-system` from chat-1) be a follow-up change? **Proposal:** yes, after this change ships. Open as a separate OpenSpec change after the in-tree primitives have lived for a sprint.
