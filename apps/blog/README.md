# @howardism/blog

Next.js 16 (App Router) blog by Howard Tai — articles, photos, about, RSS feeds, and a
newsletter signup. React 19, Tailwind v4. No authentication, no database.

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

Env vars are validated at boot via `@t3-oss/env-nextjs` (`src/config/env.mjs`); only
`NEXT_PUBLIC_DOMAIN_NAME` is required. The newsletter route additionally reads
`SENDGRID_API_KEY` and `SENDGRID_CONTACT_LIST_ID` at request time.

## Layout

- `src/app/(blog)/` — pages (home, `articles`, `photos`, `about`, `thank-you`) and the `(layout)` group (Header, Footer)
- `src/app/(common)/` — shared layout/UI primitives
- `src/app/rss/` — RSS feed routes (`feed.xml`, `feed.json`)
- `src/pages/api/subscription.ts` — newsletter signup endpoint
- `src/config/` — env validation and security headers (CSP, consumed by `next.config.ts`)
- `src/services/mail.ts` — SendGrid client
- `src/components/`, `src/hooks/`, `src/utils/`, `src/types/` — UI and shared helpers
- `src/middleware.ts` — in-memory rate limiter for `/api/*`

## Deploy

Deployed on [Vercel](https://vercel.com).
