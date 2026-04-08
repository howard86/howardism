# github-search: Chakra UI → shadcn/Tailwind Migration

**Date:** 2026-04-08
**Scope:** `apps/github-search` + `packages/theme` removal
**Branch:** `feat/shadcn-migration`

## Context

The `github-search` app is the last consumer of Chakra UI v2 in the monorepo. The `@howardism/theme` package exists solely to serve this app. Blog, recipe, login-form, and the shared UI package have already been migrated to shadcn/Tailwind v4. This migration completes the Chakra removal, unblocking the subsequent React 18→19 and Next.js 14→16 upgrade (Chakra UI v2 + Emotion is incompatible with React 19).

## Goals

1. Replace all Chakra UI components in github-search with Tailwind utility classes and `@howardism/ui` shadcn components
2. Replace `react-icons` with `lucide-react` for icon consistency
3. Replace framer-motion page transitions with CSS animations
4. Remove `@howardism/theme` package entirely
5. Remove all Chakra UI, Emotion, and framer-motion dependencies

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Responsive grid layout | CSS grid `auto-fill` | Eliminates `useBreakpointValue` JS logic; layout adapts to container width naturally |
| Page transition animation | CSS `@keyframes` | Removes framer-motion dependency; lighter runtime |
| Color palette | Shared `@howardism/ui` Nippon Colors palette | Consistent theming across all apps; no per-app overrides |
| Migration approach | Component-by-component | Proven pattern from recipe migration; reviewable diffs; each step verifiable |

## Infrastructure Setup

### New files

- `apps/github-search/postcss.config.js` — `@tailwindcss/postcss` plugin (identical to recipe)
- `apps/github-search/src/styles/globals.css` — imports `tailwindcss` and `@howardism/ui` globals

### Dependency changes

**Add:**
- `@howardism/ui` (workspace dependency)
- `tailwindcss` ^4.0.0 (devDependency)
- `@tailwindcss/postcss` (devDependency)
- `lucide-react` (dependency)

**Remove:**
- `@chakra-ui/react`
- `@chakra-ui/styled-system`
- `@emotion/react`
- `@emotion/styled`
- `framer-motion`
- `react-icons`
- `@howardism/theme`

### Config changes

- `next.config.js` — replace `@howardism/theme` with `@howardism/ui` in `transpilePackages`

## Component Mapping

| Chakra | Replacement |
|---|---|
| `ChakraProvider` / `ThemeProvider` | Remove (Tailwind needs no provider) |
| `Box`, `Flex`, `Container`, `VStack`, `Stack`, `Spacer` | `<div>` + Tailwind utility classes |
| `Button` | `@howardism/ui` Button |
| `Input` | `@howardism/ui` Input |
| `Tabs`, `TabList`, `Tab`, `TabPanel`, `TabPanels` | `@howardism/ui` Tabs |
| `Avatar`, `Img` | `<img>` + Tailwind (`rounded-full`, sizing) |
| `Heading` | `<h1>`–`<h6>` + Tailwind typography |
| `Text` | `<p>`/`<span>` + Tailwind |
| `Wrap`, `WrapItem` | `flex flex-wrap gap-*` |
| `Spinner` | CSS spinner (`animate-spin`) |
| `Tag` | `@howardism/ui` Badge |
| `Tooltip` | `title` attribute (native) |
| `Link` (Chakra) | `<a>` + Tailwind or Next.js `Link` |
| `Icon`, `ListIcon` | `lucide-react` icons directly |
| `List`, `ListItem` | `<ul>`/`<li>` |
| `LinkBox`, `LinkOverlay` | `<a>` wrapper with relative/absolute positioning |
| `useBreakpointValue` | Tailwind responsive classes / CSS grid auto-fill |
| `framer-motion` variants | CSS `@keyframes` fade-in |

## File-by-File Migration Plan

### Phase 1: Infrastructure

1. Add `postcss.config.js`, `src/styles/globals.css`, new dependencies
2. Add `@howardism/ui` to dependencies and `transpilePackages`

### Phase 2: Component migration (one file at a time)

3. **Delete `ThemeProvider.tsx`** — no replacement needed
4. **`Layout.tsx`** — `Box`/`Flex`/`Container` → `<div>`+Tailwind; framer-motion → CSS `@keyframes` fade-in animation on `<main>`
5. **`UserCard.tsx`** — `Avatar`/`LinkBox`/`LinkOverlay`/`WrapItem` → `<a>`+`<img>`+Tailwind; `useBreakpointValue` for avatar size → Tailwind responsive `w-*` classes
6. **`ProfileField.tsx`** — `Flex`/`Icon`/`Text`/`Tooltip` → native elements + Tailwind + lucide-react; responsive `fontSize` arrays → Tailwind `text-sm md:text-base`
7. **`ProfileBadge.tsx`** — `Icon`/`Tooltip`/`WrapItem` → native elements + Tailwind + lucide-react
8. **`InfoList.tsx`** — `Link`/`ListIcon`/`ListItem` → `<a>`/`<li>` + Tailwind + lucide-react
9. **`index.tsx`** (home page) — `Button`/`Input` → shadcn components; `VStack`/`Stack`/`Wrap` → Tailwind flex/grid; `useBreakpointValue` for grid count → CSS `grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr))`
10. **`[username].tsx`** (profile page) — `Tabs`/`Tag`/`Spinner`/layout primitives → shadcn Tabs + Badge + CSS spinner + Tailwind layout; `useBreakpointValue` for display toggle → Tailwind `hidden md:inline-flex`

### Phase 3: Provider and entry point

11. **`_app.tsx`** — Remove `ThemeProvider` wrapper, import new `globals.css`

### Phase 4: Cleanup

12. Remove Chakra/Emotion/framer-motion/react-icons from `package.json`
13. Remove `@howardism/theme` from dependencies
14. Delete `packages/theme/` directory entirely
15. Update root workspace config if needed (remove theme from workspace list)
16. Verify build passes (`bun run build`)
17. Verify type-check passes (`bun run type-check`)

## What Stays Unchanged

- Apollo Client setup and GraphQL data fetching
- Page routing structure (`/`, `/user/[username]`)
- `RouteLink` from `@howardism/components-common` (already uses `className`)
- GraphQL codegen configuration and generated types
- `.env` / `.env.local` configuration

## Icon Mapping

All `react-icons` imports will be replaced with `lucide-react` equivalents. Specific icon mappings will be determined during implementation based on the icons used in ProfileField, ProfileBadge, and InfoList components (GitHub profile metadata: location, company, blog, email, Twitter, hireable status, etc.).

## Risks

- **Tooltip behavior change:** Native `title` attribute has different UX than Chakra's `Tooltip` (delayed, no styling control). Acceptable for this app's use case (profile metadata labels).
- **CSS grid auto-fill item sizing:** May need tuning of `minmax()` values to match the current visual density at each breakpoint. Will verify during implementation.
- **Tabs component compatibility:** `@howardism/ui` Tabs must support the same patterns used in `[username].tsx` (fitted tabs, tab counts in badges). Will verify the shared component API covers this.
