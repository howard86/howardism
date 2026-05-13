# @howardism/blog

Next.js 16 (App Router) blog by Howard Tai — articles and RSS feeds. React 19,
Tailwind v4. No authentication, no database, no API routes.

## Getting Started

From the repo root, install deps with `bun install`, then from this directory:

```bash
bun run dev          # start the dev server at http://localhost:3000
bun run build        # production build
bun run start        # run the production build
bun run test         # bun tests
bun run type-check   # tsc --noEmit
bun run lint         # ultracite check
bun run analyze      # production build with @next/bundle-analyzer
```

Env vars are validated at boot in `src/config/env.ts`; only
`NEXT_PUBLIC_DOMAIN_NAME` is required.

## Layout

- `src/app/(blog)/` — pages (home, `articles`) and the `(layout)` group (Header, Footer)
- `src/app/(common)/` — shared layout/UI primitives
- `src/app/rss/` — RSS feed routes (`feed.xml`, `feed.json`)
- `src/config/` — env validation and security headers (CSP, consumed by `next.config.ts`)
- `src/components/`, `src/hooks/`, `src/utils/`, `src/types/` — UI and shared helpers

## Deploy

Deployed on [Vercel](https://vercel.com).
