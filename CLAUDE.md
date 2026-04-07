# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Bun monorepo managed by **Turborepo + Changesets** containing Next.js apps and shared packages by Howard Tai.

- `apps/`: blog, github-search, minecraft, recipe, template
- `packages/`: components, eslint-config-howardism, test-config, theme, tsconfig

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
```

### github-search app extras (`apps/github-search`)

```bash
bun run codegen     # regenerate GraphQL types from schema (graphql-codegen)
```

## Architecture

### Monorepo tooling

- **Bun workspaces** for dependency management
- **Turborepo** (`turbo.json`) as the task runner — build order is dependency-aware, caches `lint`, `type-check`, `test`, `build`
- **Changesets** for versioning and npm publishing

### Shared packages

| Package | Purpose |
|---|---|
| `eslint-config-howardism` | Shared ESLint flat config (base, next, react-internal presets) |
| `@howardism/test-config` | Shared Bun test preload (happy-dom, jest-dom matchers, Next.js mocks) |
| `@howardism/tsconfig` | Shared TypeScript configs |
| `@howardism/components-common` | Shared React UI components |
| `@howardism/theme` | Chakra UI theme |

### Blog app (`apps/blog`) — primary app

Uses **Next.js 14** with a hybrid router:
- `src/app/` — App Router (main blog routes: articles, profile, tools, RSS)
- `src/pages/` — Pages Router (legacy: auth endpoints via NextAuth)

Key internal structure under `src/`:
- `app/api/` — App Router API routes
- `app/(blog)/` — Blog route group (articles, profile, resume, tools)
- `config/` — environment variable validation via `@t3-oss/env-nextjs`
- `services/` — singleton clients (Prisma, external APIs)
- `server/` — server-only utilities
- `hooks/`, `utils/`, `types/` — client-side helpers and shared types

Auth: NextAuth v4 with GitHub + Google OAuth (Credentials provider in preview env). Protected routes use `next-auth/middleware` in `middleware.ts`.

Database: PostgreSQL via Prisma (schema in `prisma/`).

### github-search app (`apps/github-search`)

Uses **Chakra UI** + **Apollo Client** + **GitHub GraphQL API**. GraphQL types are code-generated (`codegen.yml`).

## Code Style

- **Ultracite** for linting and formatting
- Commit messages follow **gitmoji** conventional commit format (enforced by commitlint)
