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

**Next.js 16** (App Router) + **React 19** + **Tailwind v4**. Articles-focused: no auth, no database. Routes: home, `/articles`, `/articles/[slug]`, `/photos`, `/about`, `/thank-you`, RSS feeds, and a single `pages/api/subscription` (SendGrid newsletter).

Key internal structure under `src/`:
- `app/(blog)/` — pages and the `(layout)` group (Header, Footer)
- `app/(common)/` — shared layout/UI primitives (`Container`, `SimpleLayout`, `Card`, icons, …)
- `app/rss/` — RSS feed routes (`feed.xml`, `feed.json`)
- `pages/api/subscription.ts` — newsletter signup → `services/mail.ts` (SendGrid)
- `config/` — env validation via `@t3-oss/env-nextjs` (`env.mjs`) and `security-headers.ts` (CSP, consumed by `next.config.ts`)
- `services/` — `mail.ts` (SendGrid client)
- `components/`, `hooks/`, `utils/`, `types/` — UI and shared helpers
- `middleware.ts` — in-memory fixed-window rate limiter for `/api/*` (no auth guard)

Articles: MDX, glob-discovered from local files, statically generated.

Design system: oklch CSS variables (`--hw-*`), 5 theme variants × light/dark, home layouts toggled via a Tweaks panel (persisted in `localStorage`).

## Code Style

- **Ultracite** (Biome) for linting and formatting — `bun x ultracite fix`
- Commit messages follow **gitmoji** conventional commit format (enforced by commitlint)
