# @howardism/blog

Next.js 16 (App Router) blog, profile, and tools site. React 19, Tailwind v4, Prisma 7 (PostgreSQL), better-auth.

## Getting Started

From the repo root, install deps with `bun install`, then from this directory:

```bash
bun run dev          # start the dev server at http://localhost:3000
bun run build        # production build
bun run start        # run the production build
bun run test         # bun tests
bun run type-check   # tsc --noEmit
bun run lint         # ultracite check
bun run analyze      # build with @next/bundle-analyzer
```

### Database (Prisma)

```bash
bun run prisma:generate   # regenerate the Prisma client after schema changes
bun run prisma:migrate    # push the schema to the DB (db push)
bun run prisma:seed       # seed the database
bun run prisma:studio     # open Prisma Studio
bun run prisma:reset      # reset the DB without seeding
```

Copy `.env.example` (if present) to `.env` and fill in the required values — env vars are validated at boot via `@t3-oss/env-nextjs` (`src/config/env.mjs`).

## Layout

- `src/app/` — App Router routes (`(blog)`, `(common)` groups, `api/`, `rss/`)
- `src/pages/api/` — a couple of legacy Pages Router API routes
- `src/config/` — env validation and security headers (CSP, consumed by `next.config.ts`)
- `src/lib/` — `auth.ts` / `auth-client.ts` (better-auth)
- `src/services/`, `src/server/` — singleton clients and server-only utilities
- `src/components/`, `src/hooks/`, `src/utils/`, `src/types/` — UI and shared helpers
- `prisma/` — schema, migrations, seed

## Deploy

Deployed on [Vercel](https://vercel.com).
