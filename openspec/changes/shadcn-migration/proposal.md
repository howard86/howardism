## Why

The monorepo currently uses two incompatible UI frameworks — DaisyUI (blog) and Chakra UI (recipe, github-search) — with separate styling approaches (Tailwind CSS-in-JS vs Emotion CSS-in-JS). This fragmentation prevents meaningful component sharing across apps and inflates bundle sizes with runtime CSS overhead. Migrating to shadcn/ui unifies the UI layer on a single compile-time approach (Radix UI + Tailwind CSS) with owned, customizable component source code.

## What Changes

- **BREAKING** Remove Chakra UI, Emotion, and `@howardism/theme` package from recipe and github-search apps
- **BREAKING** Remove DaisyUI and `@headlessui/react` from the blog app
- **BREAKING** Rewrite `packages/components/common` and `packages/components/login-form` to use shadcn primitives instead of Chakra
- Create new `packages/ui` shared package with shadcn/ui components, `cn()` utility, and CSS variable theming
- Upgrade Tailwind CSS from v3.4.1 to v4 (latest) across the monorepo
- Port the blog's custom Japanese color palette (`jp` theme) and dark mode to CSS variable tokens
- Add Tailwind CSS v4 configuration to recipe and github-search apps
- Replace 25+ Chakra components per Chakra app with shadcn equivalents + Tailwind utility classes

## Capabilities

### New Capabilities
- `shared-ui`: Centralized shadcn/ui component package (`packages/ui`) providing buttons, inputs, selects, cards, forms, tabs, tooltips, and other primitives shared across all apps via `@howardism/ui` imports
- `css-variable-theming`: CSS variable-based theming system replacing both DaisyUI's `data-theme` and Chakra's `extendTheme()`, preserving the Japanese color palette and dark mode

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **All apps** (blog, recipe, github-search): UI component imports and styling approach change entirely
- **Shared packages**: `components-common` and `login-form` rewritten; `theme` package removed
- **Dependencies**: Add `tailwindcss` v4, `@radix-ui/*`, `tailwind-merge`, `class-variance-authority`; remove `@chakra-ui/*`, `@emotion/*`, `daisyui`, `@headlessui/react`
- **Build**: Tailwind v4 uses CSS-first config (no `tailwind.config.js`) — all apps need config migration
- **Forms**: Blog already uses React Hook Form + Zod; recipe's Formik forms need migration to match shadcn's form approach
