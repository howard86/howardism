# design-sync notes

## Build

- Neither source has a build: `@howardism/ui` ships `.tsx` + Tailwind v4 source CSS, and the editorial components live inside the Next.js app. `.design-sync/pkg/` is a sync-only package (`@howardism/design-system`) that `bun .design-sync/pkg/build.ts` (`cfg.buildCmd`) turns into `dist/index.js`, `dist/index.d.ts` and `dist/styles.css`. Run it before the converter whenever ui or blog source changes.
- `@/` resolves to `packages/ui/src` first, then `apps/blog/src` — the build plugin and the tsconfig `paths` both encode that order. The only path present in both trees is `styles/globals.css`, which no TS file imports.
- `entry.ts` re-exports ui families through relative paths, not `@howardism/ui/...`: the converter's ts-morph pass can't follow the alias and found only 10 of 91 components until this changed.
- `next/link` and `next/navigation` resolve to `.design-sync/pkg/shims/` (plain `<a>`, static pathname `/`). Only `SubjectChip`/`SubjectChipList`/`IndexRow` reach them.
- Bun's isolated install keeps React and `@types/react` out of the repo-root `node_modules`; `build.ts` symlinks them into `.design-sync/pkg/node_modules` (gitignored), which is where the converter's `@types/react` walk finds them. Pass `--node-modules apps/blog/node_modules`.
- CSS is the blog's `globals.css` compiled with the repo's own `@tailwindcss/postcss` (postcss resolved through its install), scanning ui + blog sources, plus a `@source inline(...)` safelist in `styles.src.css` so layout/token utilities the design agent writes exist even when no source file uses them. Fonts are a Google Fonts `@import` prepended to `dist/styles.css` (user's choice; `runtimeFontPrefixes` covers them).
- Render check uses the installed Google Chrome: `DS_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`, with `playwright` installed in `.ds-sync/` under `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`.

## Authoring previews

- Import from `"@howardism/design-system"`. Fonts and tokens apply with no provider.
- Only classes that exist in `ds-bundle/_ds_bundle.css` style anything. Check a class there before using it in preview glue.
- Realistic content is this blog's: article titles about AI agents/evals, real domain labels from `DOMAIN_META` (Agent Systems, Evals & Benchmarks, Alignment & Safety…, never invented ones), "revised 23 Nov 2026", reading times like `25′`.
- Arbitrary values (`w-[420px]`) and anything outside the safelist aren't compiled; use inline `style` for one-off sizes.
- Overlays (`cfg.overrides`: Dialog, Sheet, Popover, HoverCard, Select, NavigationMenu) are single 760x560 cards rendered open: `defaultOpen` (HoverCard takes `open`), Select with `position="popper"` inside a tall wrapper (item-aligned covers the trigger), Popover/HoverCard/NavigationMenu in a `flex h-full justify-center pt-*` wrapper.
- `NavigationMenuLink` is a flex row: wrap multi-line content in one `div.flex.flex-col`.
- `DomainLabel` returns a fragment (dot + text); wrap it in an element inside flex-col parents.
- `SaveButton` takes `initialSaved`, so both states render statically. `DataGrid`'s `stack` only applies below 480px, so its narrow cell looks like the default.
- `Form`/`FormField` need react-hook-form's context: `useForm` is re-exported from the bundle (entry.ts), and `build.ts` links `react-hook-form` from `packages/ui/node_modules`. Import it from `@howardism/design-system`, never from `react-hook-form`.
- ScrollArea scrollbars don't show in a static capture.

## Known render warns

- `[TOKENS_MISSING] --article-accent, --dc, --tone, --tw`: set inline by the components themselves (style props), not missing tokens.

## DS findings (not sync issues)

- Fixed in this sync (packages/ui/src/styles/globals.css): the ui components style Base UI-style variants (`data-open:`, `data-closed:`, `data-active:`, `data-popup-open:`, `data-horizontal:`, `data-vertical:`) but Radix emits `data-state` / `data-orientation`, so the active tab, Separator sizing and overlay animations never applied — on the live site too (/shelf tabs). `@custom-variant` rules now map each onto both forms.

- A bare `border*` class renders in the text colour: `CardFooter`, the Command and ScrollArea boxes and the Sheet edge show it. `CardFooter` uses `border-t` with no colour, and no stylesheet sets a base `border-color: var(--border)`, so its rule renders in the text colour (dark) on the live site too. The preview shows it faithfully.

## Re-sync risks

- `build.ts` encodes repo layout: the `@/` order (ui before blog), the Next.js shims, and symlinks into `apps/blog/node_modules` and `packages/ui/node_modules`. A moved component, a new `next/*` import in an editorial component, or a dependency hoisting change breaks the build first, so read its error before anything else.
- `entry.ts` lists the editorial components by hand; a new editorial component isn't synced until it's added there.
- The `styles.src.css` safelist is a guess at what the design agent writes. Classes outside it (and any arbitrary value) silently don't exist in designs.
- `IndexRow` previews and the conventions example hand-build `ArticleEntity` objects; a change to that shape in `service.ts` makes them stale without a build error.
- Fonts load from fonts.googleapis.com at runtime; designs fall back to Georgia/monospace offline.
- Previews use real domain labels; a renamed or removed domain in `DOMAIN_META` leaves them showing the old one.
- The render check ran against the installed Google Chrome, not a pinned Chromium; a Chrome update can shift screenshots slightly.
