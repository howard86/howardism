# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Bun monorepo managed by **Turborepo + Changesets** containing the blog app and the shared packages it depends on, by Howard Tai.

- `apps/`: `blog`
- `packages/`: `ui`, `components/common`, `components/login-form`, `test-config`, `tsconfig`

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
bun run prisma:generate   # regenerate Prisma client after schema changes
bun run prisma:migrate    # push schema to DB (db push)
bun run prisma:seed       # seed the database
bun run prisma:studio     # open Prisma Studio GUI
bun run prisma:reset      # reset DB without seeding
bun run analyze           # build with @next/bundle-analyzer
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
| `@howardism/login-form` | Login form component |
| `@howardism/test-config` | Shared Bun test preload (happy-dom, jest-dom matchers, Next.js mocks) |
| `@howardism/tsconfig` | Shared TypeScript configs |

### Blog app (`apps/blog`)

**Next.js 16** (App Router) + **React 19** + **Tailwind v4** + **Prisma 7** (PostgreSQL).

Key internal structure under `src/`:
- `app/(blog)/`, `app/(common)/` — route groups (articles, profile, resume, tools)
- `app/api/` — App Router API routes
- `app/rss/` — RSS feed
- `pages/api/` — a couple of legacy Pages Router API routes (sudoku, subscription)
- `config/` — env validation via `@t3-oss/env-nextjs` (`env.mjs`) and `security-headers.ts` (CSP, used by `next.config.ts`)
- `lib/` — `auth.ts` / `auth-client.ts` (better-auth)
- `services/` — singleton clients (Prisma, external APIs)
- `server/` — server-only utilities (incl. `server/libs/sudoku`)
- `components/`, `hooks/`, `utils/`, `types/` — UI and shared helpers

Auth: **better-auth** v1.2 with GitHub + Google OAuth (Credentials provider in preview env). Protected routes guarded by `src/middleware.ts` (cookie check + in-memory fixed-window rate limiter).

Articles: MDX, glob-discovered from local files, statically generated.

Design system: oklch CSS variables (`--hw-*`), 5 theme variants × light/dark, home layouts toggled via a Tweaks panel (persisted in `localStorage`).

## Code Style

- **Ultracite** (Biome) for linting and formatting — `bun x ultracite fix`
- Commit messages follow **gitmoji** conventional commit format (enforced by commitlint)
