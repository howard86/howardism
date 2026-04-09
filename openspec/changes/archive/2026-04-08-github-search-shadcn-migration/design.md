## Context

The monorepo has 5 Next.js apps. Four apps (blog, recipe, minecraft, template) and shared packages (ui, components-common, login-form) have already been migrated to Tailwind v4 + shadcn. The `github-search` app remains on Chakra UI v2 with Emotion, and `@howardism/theme` exists solely to serve it. This blocks the React 19 upgrade since Chakra UI v2 + Emotion is incompatible with React 19.

The established migration pattern uses Tailwind v4 CSS-first configuration (no `tailwind.config.ts`), `@tailwindcss/postcss` plugin, shared components from `@howardism/ui`, and CSS variable theming from a Japanese Nippon Colors palette. The recipe app migration is the closest precedent — it also started on Chakra UI v2.

## Goals / Non-Goals

**Goals:**

- Replace all Chakra UI components in github-search with Tailwind classes + `@howardism/ui` shadcn components
- Remove framer-motion, replacing page transitions with CSS animations
- Remove `react-icons`, replacing with `lucide-react`
- Delete `packages/theme/` entirely
- Follow the same Tailwind v4 CSS-first pattern as blog and recipe

**Non-Goals:**

- Upgrading Next.js or React versions (separate change)
- Redesigning the github-search UI or adding features
- Migrating to App Router (stays on Pages Router)
- Adding dark mode support (not currently present)

## Decisions

### Responsive layout: CSS grid auto-fill over JS-driven item counts

**Choice:** Replace `useBreakpointValue` grid item counts with CSS `grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr))`.

**Alternatives considered:**
- Custom `useMediaQuery` hook — adds JS runtime cost, same result achievable in CSS
- Fixed breakpoint classes (`grid-cols-3 md:grid-cols-5`) — less fluid than auto-fill

**Rationale:** CSS grid auto-fill adapts to any container width without JS. Eliminates the hook dependency entirely. The current breakpoint-to-count mapping (`{ base: 9, sm: 12, md: 18, lg: 15, xl: 25 }`) was an approximation of what auto-fill does natively.

### Page transitions: CSS @keyframes over framer-motion

**Choice:** Replace framer-motion fade-in variants with a CSS `@keyframes` animation on `<main>`.

**Alternatives considered:**
- Keep framer-motion — adds 30KB+ to the bundle for a single fade animation
- Remove transitions entirely — simple but loses the polish

**Rationale:** A CSS fade-in is ~5 lines of CSS, zero JS, and visually equivalent for this use case. Removes the framer-motion dependency.

### Theming: Shared palette, no per-app overrides

**Choice:** Use `@howardism/ui` Nippon Colors palette as-is. The current brown/coral palette from `@howardism/theme` is not preserved.

**Alternatives considered:**
- Preserve brown/coral as github-search overrides in its `globals.css` — adds maintenance burden for an app-specific palette
- Create a new palette — unnecessary design work for this scope

**Rationale:** Consistency across apps. The recipe app similarly adopted the shared palette with minor overrides; github-search can do the same without any overrides.

### Component replacements: shadcn from @howardism/ui where available, native HTML + Tailwind otherwise

**Choice:** Use `@howardism/ui` Button, Input, Tabs, Badge. Use native HTML elements with Tailwind for layout primitives (Box→div, Flex→div.flex), avatar (img), tooltips (title attr), lists (ul/li), and spinners (CSS animate-spin).

**Alternatives considered:**
- Add shadcn Avatar, Tooltip, and Spinner to `@howardism/ui` — over-engineering for this app's simple needs
- Use a different component library — contradicts monorepo standardization

**Rationale:** Only use shared components when they add value. A `<div className="flex">` doesn't need a component abstraction. Chakra's `Tooltip` provided styled hover tooltips, but native `title` is sufficient for profile metadata labels.

### Icons: lucide-react over react-icons

**Choice:** Replace all `react-icons` imports with `lucide-react` equivalents.

**Rationale:** Consistent with blog, recipe, and `@howardism/ui`. lucide-react is tree-shakeable and already a transitive dependency via the shared UI package.

## Risks / Trade-offs

- **Tooltip UX regression** → Native `title` has delayed appearance, no styling control, and is invisible on touch devices. Acceptable for profile metadata labels. If richer tooltips are needed later, add shadcn Tooltip to `@howardism/ui`.
- **CSS grid auto-fill visual density** → The `minmax()` values may need tuning to match the current visual density at each breakpoint. Mitigation: test at common viewport widths and adjust.
- **Tabs component API fit** → The `[username].tsx` page uses Chakra Tabs with `isFitted` and `variant="enclosed"`. The `@howardism/ui` Tabs component (Radix-based) may not have identical props. Mitigation: verify the shared Tabs API and extend if needed.
- **Icon mapping gaps** → Some `react-icons` icons may not have exact lucide-react equivalents. Mitigation: use closest visual match; lucide has 1500+ icons covering common cases.
