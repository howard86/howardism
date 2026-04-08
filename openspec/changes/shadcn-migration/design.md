## Context

The howardism monorepo has 5 Next.js apps and 6 shared packages. The blog app (primary) uses Tailwind v3.4.1 + DaisyUI + Headless UI + one Radix primitive. The recipe and github-search apps use Chakra UI v2.8.2 with Emotion CSS-in-JS. Shared packages (`components-common`, `login-form`, `theme`) are Chakra-dependent. The minecraft and template apps have no UI framework and are out of scope.

The blog already uses `clsx` and `@radix-ui/react-popover`, making it the natural first migration target.

## Goals / Non-Goals

**Goals:**
- Unify all apps on shadcn/ui (Radix + Tailwind) for consistent, compile-time styling
- Create `packages/ui` as the single source of shared UI components
- Upgrade to Tailwind CSS v4 with CSS-first configuration
- Preserve the existing Japanese color palette and dark mode via CSS variable tokens
- Enable incremental migration — each app migrates independently

**Non-Goals:**
- Visual redesign — preserve current look and feel, just change the implementation
- Migrating minecraft or template apps (no UI framework to replace)
- Next.js 15 or React 19 upgrade (separate concern)
- Adding new UI features beyond what currently exists

## Decisions

1. **New `packages/ui` package** over extending `packages/components/common`: Clean separation. The existing package is Chakra-coupled; a fresh package avoids incremental Chakra→shadcn entanglement. Old packages are deprecated and removed once all consumers migrate.

2. **Tailwind v4 CSS-first config**: Since we're touching every app's styling config anyway, upgrading now avoids a second migration. Use `@import "tailwindcss"` in CSS instead of `tailwind.config.js`.

3. **Blog first, then shared packages, then Chakra apps**: Blog already has Tailwind — lowest friction. Shared packages second unlocks Chakra app migration. Recipe and github-search last (heaviest lift).

4. **Incremental component replacement**: Replace one component type at a time (buttons → inputs → forms → layout). Allows testing at each step. No big-bang rewrite.

5. **React Hook Form + Zod for all forms**: Blog already uses this. Recipe's Formik forms migrate to RHF+Zod to align with shadcn's Form component pattern.

6. **`cn()` utility via `clsx` + `tailwind-merge`**: Standard shadcn pattern. Replaces blog's raw `clsx()` usage.

7. **CSS variable theming**: Map DaisyUI's semantic tokens (`primary`, `secondary`, `base-100/200/300`) and the custom `jp` theme to shadcn's CSS variable system (`--primary`, `--secondary`, `--background`, etc.). Dark mode via `class` strategy on `<html>`.

## Risks / Trade-offs

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| DaisyUI theme color mapping is imprecise | Medium | Medium | Extract exact HSL values from DaisyUI themes; create side-by-side comparison during migration |
| Chakra layout primitives (Box/Flex/Stack) have no shadcn equivalent | Certain | Medium | Convert to Tailwind utility classes directly (`<div className="flex gap-4">`) — tedious but straightforward |
| Tailwind v4 CSS-first config has learning curve | Low | Low | Well-documented migration path; blog is the only app currently on v3 |
| Breaking shared packages disrupts recipe/github-search | High | High | Migrate shared packages and their consumers together in Phase 3+4; don't remove old packages until consumers are migrated |
| Formik → React Hook Form in recipe app | Medium | Medium | Isolated to form components; can be done per-form incrementally |
