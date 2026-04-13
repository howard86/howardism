## Why

next-auth v4 with SQLite is inadequate for production: JWT-only sessions lack revocation capability, SQLite doesn't scale for deployment, and the library is aging with a stalled upgrade path. Better Auth provides a modern, type-safe auth library with database-backed sessions, and Supabase PostgreSQL replaces SQLite as a managed, production-ready database. The blog app's auth surface is small (6 files), making this a low-risk migration window.

## What Changes

- **BREAKING**: Replace `next-auth` v4 with `better-auth` — all auth imports, session APIs, and provider config change
- **BREAKING**: Replace SQLite with Supabase PostgreSQL — database connection, Prisma schema, and adapter all change
- **BREAKING**: Auth schema changes — `User`, `Account`, `Session`, `VerificationToken` tables are replaced with Better Auth's schema (different field names, types, and structure)
- Move auth API route from Pages Router (`src/pages/api/auth/[...nextauth].ts`) to App Router (`src/app/api/auth/[...all]/route.ts`)
- Switch from JWT sessions to database-backed sessions with cookie tokens
- Add email/password authentication (replaces hardcoded Credentials provider for preview)
- Add minimal login page at `/login` (Better Auth has no default sign-in UI)
- Remove `proxy.ts` middleware — per-page server checks replace middleware-based route protection
- Simplify `src/services/prisma.ts` — remove SQLite adapter, use standard `PrismaClient`

## Capabilities

### New Capabilities

- `better-auth-server`: Server-side auth instance with Prisma PostgreSQL adapter, social providers (Google, GitHub), and email/password authentication
- `better-auth-client`: React client for sign-in, sign-out, and session access on the client side
- `login-page`: Minimal sign-in page with OAuth buttons and email/password form
- `supabase-database`: PostgreSQL database via Supabase with Prisma, replacing SQLite

### Modified Capabilities

_(none — no existing specs)_

## Impact

- **Code**: 4 new files, 6 modified files, 2 deleted files in `apps/blog`
- **Packages**: Remove `next-auth`, `@next-auth/prisma-adapter`, `@prisma/adapter-better-sqlite3`; add `better-auth`
- **Database**: Full schema migration from SQLite to PostgreSQL; auth tables restructured for Better Auth
- **Environment**: Replace `NEXTAUTH_*` vars with `BETTER_AUTH_*`; add `DATABASE_URL` and `DIRECT_URL` for Supabase
- **Deployment**: Requires Supabase project setup with dedicated Prisma database user
- **Auth flow**: All existing sessions invalidated (clean-slate); users must re-authenticate
