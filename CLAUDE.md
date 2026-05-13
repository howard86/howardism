# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Bun monorepo managed by **Turborepo + Changesets** containing the blog app and the shared packages it depends on, by Howard Tai.

- `apps/`: `blog`
- `packages/`: `ui`, `components/common`, `test-config`, `tsconfig`

## Commands

### Root (run all packages)

```bash
bun run build       # build all packages (respects dependency order via turborepo)
bun run lint        # lint all packages
bun run test        # run all tests
bun run type-check  # TypeScript check across all packages
bun run format      # ultracite fix
```

### Per-package (cd into app or package first)

```bash
bun run dev         # start dev server
bun run build       # build
bun run lint        # lint
bun run test        # run bun tests
bun run type-check  # tsc --noEmit
```

Run a single test file:
```bash
bun test --filter <filename>
```

### Blog app extras (`apps/blog`)

```bash
bun run analyze           # production build with @next/bundle-analyzer
```

## Architecture

### Monorepo tooling

- **Bun workspaces** for dependency management
- **Turborepo** (`turbo.json`) as the task runner — build order is dependency-aware, caches `lint`, `type-check`, `test`, `build`
- **Changesets** for versioning and npm publishing

### Shared packages

| Package | Purpose |
|---|---|
| `@howardism/ui` | shadcn/ui components (Tailwind v4) |
| `@howardism/components-common` | Shared React components |
| `@howardism/test-config` | Shared Bun test preload (happy-dom, jest-dom matchers, Next.js mocks) |
| `@howardism/tsconfig` | Shared TypeScript configs |

### Blog app (`apps/blog`)

**Next.js 16** (App Router) + **React 19** + **Tailwind v4**. Articles-focused: no auth, no database. Routes: home, `/articles`, `/articles/[slug]`, `/thank-you`, RSS feeds, and a single `pages/api/subscription` (SendGrid newsletter). (`/photos` and `/about` were removed; `next.config.ts` permanently redirects both to `/`.)

Key internal structure under `src/`:
- `app/(blog)/` — pages and the `(layout)` group (Header, Footer)
- `app/(common)/` — shared layout/UI primitives (`Container`, `SimpleLayout`, `Card`, icons, …)
- `app/rss/` — RSS feed routes (`feed.xml`, `feed.json`)
- `pages/api/subscription.ts` — newsletter signup → `services/mail.ts` (SendGrid)
- `config/` — env validation via a raw zod schema (`env.ts`) and `security-headers.ts` (CSP, consumed by `next.config.ts`)
- `services/` — `mail.ts` (SendGrid client)
- `components/`, `hooks/`, `utils/`, `types/` — UI and shared helpers
- `proxy.ts` — in-memory fixed-window rate limiter for `/api/*` (no auth guard)

Articles: MDX, glob-discovered from local files, statically generated.

Design system: a single set of oklch design tokens in shadcn slots (`--background`, `--foreground`, `--primary`, …) plus `--brand*` for the editorial terracotta accent, defined in `@howardism/ui`'s `globals.css`; light/dark only, toggled via a Tweaks panel (persisted in `localStorage`). Article bodies use the `@tailwindcss/typography` `prose` plugin, themed onto those tokens. `apps/blog/src/styles/howardism.css` holds only the paper-grain body background and a couple of CSS-only effects.

## Code Style

- **Ultracite** (Biome) for linting and formatting — `bun x ultracite fix`
- Commit messages follow **gitmoji** conventional commit format (enforced by commitlint)
