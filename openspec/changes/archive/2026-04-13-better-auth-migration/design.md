## Context

The blog app (`apps/blog`) uses next-auth v4 with JWT sessions and SQLite via `better-sqlite3`. Auth is configured in a Pages Router catch-all route, with server-side session checks in 2 protected pages and a client-side logout button. Route protection uses `next-auth/middleware` in `proxy.ts`. The app is on Next.js 16.2.2 with React 19.2.4 in a Bun monorepo.

SQLite is a file-based database unsuitable for production deployment. JWT sessions lack server-side revocation. The auth surface is small — 6 files total.

## Goals / Non-Goals

**Goals:**
- Replace next-auth with Better Auth using database-backed sessions
- Replace SQLite with Supabase PostgreSQL for the entire Prisma schema
- Move auth API route from Pages Router to App Router
- Add a minimal login page (Better Auth provides no default UI)
- Enable email/password auth for preview environments (replacing hardcoded Credentials provider)
- Simplify the Prisma client by removing the SQLite adapter

**Non-Goals:**
- Migrating existing SQLite data (fresh database, seed only)
- Custom login page design or styling beyond functional minimum
- Adding new auth features (password reset, email verification flows, etc.)
- Modifying business models (Resume, Commerce) beyond the SQLite → PostgreSQL type change
- Multi-tenant or role-based access control

## Decisions

### 1. Clean-slate migration over incremental

**Decision**: Delete all next-auth code and rebuild with Better Auth from scratch.

**Alternatives considered**:
- Parallel setup (run both auth systems, cutover later) — rejected because the auth surface is only 6 files, and Prisma can only have one datasource, making dual-database impractical
- Schema-in-place migration (rename fields to match Better Auth) — rejected because we're starting with a fresh database anyway, so careful field-by-field migration buys nothing

**Rationale**: Small blast radius makes all-at-once safe. Fewer moving parts than parallel approaches.

### 2. Database-backed sessions over JWT

**Decision**: Use Better Auth's default database-backed sessions with cookie tokens.

**Rationale**: Enables session revocation and device tracking (`ipAddress`, `userAgent`). Better Auth is designed around this model — fighting it for JWT would add complexity.

### 3. All providers always registered

**Decision**: Register Google, GitHub, and email/password providers unconditionally (no environment-conditional array).

**Alternative**: Conditionally register providers based on `VERCEL_ENV` (current approach with next-auth).

**Rationale**: Simpler server config. The login UI can conditionally show/hide provider buttons per environment if needed. A seeded test user with known password replaces the fake Credentials provider.

### 4. Per-page auth checks over middleware

**Decision**: Remove `proxy.ts` middleware. Rely on existing `auth.api.getSession()` checks in each protected page.

**Rationale**: Better Auth explicitly recommends per-page checks. Both protected pages already have session checks with redirects — the middleware was redundant. Aligns with Next.js 16's `proxy.ts` model.

### 5. App Router for auth API route

**Decision**: Place the Better Auth handler at `src/app/api/auth/[...all]/route.ts`.

**Alternative**: Keep in Pages Router at `src/pages/api/auth/[...all].ts`.

**Rationale**: The rest of the app uses App Router. Moving auth to App Router reduces Pages Router surface and aligns with the app's direction.

### 6. Supabase with dedicated Prisma user

**Decision**: Create a dedicated `prisma` database user in Supabase with `bypassrls` and `createdb` grants.

**Rationale**: Follows Supabase's recommended pattern. Provides better access control monitoring. Uses dual connection strings: pooled (port 6543) for application, session mode (port 5432) for migrations.

## Risks / Trade-offs

- **All existing sessions invalidated** → Expected for clean-slate. Users must re-authenticate. Acceptable for a blog app with low auth usage.
- **Better Auth is newer than next-auth** → Smaller community, fewer Stack Overflow answers. Mitigated by the library's active development and comprehensive docs.
- **No default login UI** → Must build a login page. Mitigated by keeping it minimal — just functional buttons and form.
- **Supabase dependency** → Adds a managed service dependency. Mitigated by using standard PostgreSQL — could switch to any PostgreSQL host by changing connection strings.
- **Email/password in production** → Enabled everywhere, not just preview. Low risk — the blog doesn't have public signup; the seeded test user is the only email/password account.
