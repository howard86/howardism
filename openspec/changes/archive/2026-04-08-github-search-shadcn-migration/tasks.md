## 1. Infrastructure Setup

- [ ] 1.1 Create `apps/github-search/postcss.config.js` with `@tailwindcss/postcss` plugin
- [ ] 1.2 Add `tailwindcss`, `@tailwindcss/postcss` (devDeps) and `@howardism/ui`, `lucide-react` (deps) to `apps/github-search/package.json`
- [ ] 1.3 Create `apps/github-search/src/styles/globals.css` importing tailwindcss and `@howardism/ui` globals
- [ ] 1.4 Update `apps/github-search/next.config.js` — replace `@howardism/theme` with `@howardism/ui` in `transpilePackages`

## 2. Provider and Entry Point

- [ ] 2.1 Delete `src/components/ThemeProvider.tsx`
- [ ] 2.2 Update `src/pages/_app.tsx` — remove ThemeProvider wrapper, import new `globals.css` instead of any Chakra CSS

## 3. Layout Component

- [ ] 3.1 Rewrite `src/components/Layout.tsx` — replace Box/Flex/Container with div+Tailwind, replace framer-motion with CSS `@keyframes` fade-in animation

## 4. Shared Components

- [ ] 4.1 Rewrite `src/components/UserCard.tsx` — replace Avatar/LinkBox/LinkOverlay/WrapItem with native HTML+Tailwind, replace `useBreakpointValue` avatar sizing with Tailwind responsive classes
- [ ] 4.2 Rewrite `src/components/ProfileField.tsx` — replace Flex/Icon/Text/Tooltip with native HTML+Tailwind+lucide-react, use `title` attr for tooltips
- [ ] 4.3 Rewrite `src/components/ProfileBadge.tsx` — replace Icon/Tooltip/WrapItem with native HTML+Tailwind+lucide-react
- [ ] 4.4 Rewrite `src/components/InfoList.tsx` — replace Link/ListIcon/ListItem with native a/ul/li+Tailwind+lucide-react

## 5. Page Components

- [ ] 5.1 Rewrite `src/pages/index.tsx` — replace Button/Input with shadcn components, replace Wrap with CSS grid auto-fill, remove `useBreakpointValue`
- [ ] 5.2 Rewrite `src/pages/user/[username].tsx` — replace Tabs/Tag/Spinner/layout primitives with shadcn Tabs+Badge+CSS spinner+Tailwind, replace `useBreakpointValue` with Tailwind `hidden md:inline-flex`

## 6. Dependency Cleanup

- [ ] 6.1 Remove `@chakra-ui/react`, `@chakra-ui/styled-system`, `@emotion/react`, `@emotion/styled`, `framer-motion`, `react-icons`, `@howardism/theme` from `apps/github-search/package.json`
- [ ] 6.2 Delete `packages/theme/` directory entirely
- [ ] 6.3 Remove `@howardism/theme` from root workspace config if referenced

## 7. Verification

- [ ] 7.1 Verify `bun run build` passes for all apps
- [ ] 7.2 Verify `bun run type-check` passes for github-search
- [ ] 7.3 Verify zero imports from `@chakra-ui`, `@emotion`, or `framer-motion` remain in github-search
