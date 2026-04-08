## Why

The `github-search` app is the last Chakra UI consumer in the monorepo. Chakra UI v2 depends on `@emotion/react` which is incompatible with React 19. Completing this migration removes the Chakra/Emotion dependency chain entirely, unblocking the React 18→19 and Next.js 14→16 upgrade across all apps.

## What Changes

- **BREAKING**: Remove `@howardism/theme` package from the monorepo (sole consumer is github-search)
- **BREAKING**: Remove `@chakra-ui/react`, `@chakra-ui/styled-system`, `@emotion/react`, `@emotion/styled`, `framer-motion`, and `react-icons` from github-search
- Replace all Chakra UI components in github-search with Tailwind utility classes and `@howardism/ui` shadcn components
- Replace `react-icons` with `lucide-react` for consistency with other migrated apps
- Replace framer-motion page transitions with CSS `@keyframes` animations
- Replace Chakra's `useBreakpointValue` JS-driven responsive logic with CSS grid auto-fill and Tailwind responsive classes
- Add Tailwind v4 CSS-first infrastructure to github-search (postcss, globals.css)
- Adopt shared `@howardism/ui` Nippon Colors palette (no per-app color overrides)

## Capabilities

### New Capabilities

- `github-search-tailwind-ui`: Tailwind/shadcn component layer for github-search — covers infrastructure setup, component migration (8 files), provider removal, and dependency cleanup

### Modified Capabilities

_(none — no existing spec-level requirements are changing, only implementation)_

## Impact

- **Code**: 8 component/page files rewritten in `apps/github-search/src/`, `_app.tsx` provider change, new `postcss.config.js` and `globals.css`
- **Dependencies**: 7 packages removed, 4 added (tailwindcss, @tailwindcss/postcss, @howardism/ui, lucide-react)
- **Packages**: `packages/theme/` directory deleted entirely, workspace config updated
- **Build**: `next.config.js` transpilePackages updated (theme → ui)
- **No API changes**: GraphQL queries, Apollo Client setup, and route structure unchanged
