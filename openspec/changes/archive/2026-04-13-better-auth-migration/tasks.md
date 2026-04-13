## 1. Database & Prisma Setup

- [x] 1.1 Update Prisma schema: change datasource from SQLite to PostgreSQL with `url` and `directUrl`; replace auth tables (User, Account, Session, VerificationToken) with Better Auth schema; keep business models unchanged
- [x] 1.2 Simplify `src/services/prisma.ts`: remove `PrismaBetterSqlite3` adapter and `getDatabaseUrl()`, use standard `PrismaClient()`
- [x] 1.3 Update `src/config/env.mjs`: remove `NEXTAUTH_URL`/`NEXTAUTH_SECRET`, add `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `DATABASE_URL`, `DIRECT_URL`

## 2. Package Changes

- [x] 2.1 Remove `next-auth`, `@next-auth/prisma-adapter`, `@prisma/adapter-better-sqlite3` packages
- [x] 2.2 Add `better-auth` package

## 3. Auth Server & Route

- [x] 3.1 Create `src/lib/auth.ts`: Better Auth server instance with Prisma adapter, Google/GitHub social providers, and emailAndPassword plugin
- [x] 3.2 Create `src/app/api/auth/[...all]/route.ts`: App Router API route handler using `toNextJsHandler`
- [x] 3.3 Delete `src/pages/api/auth/[...nextauth].ts`

## 4. Auth Client & Callsite Migration

- [x] 4.1 Create `src/lib/auth-client.ts`: Better Auth React client using `createAuthClient`
- [x] 4.2 Update `src/app/(blog)/profile/page.tsx`: replace `getServerSession(authOptions)` with `auth.api.getSession({ headers: await headers() })`; redirect to `/login` instead of `/`
- [x] 4.3 Update `src/app/(blog)/profile/resume/[profileId]/utils.tsx`: same session replacement; redirect to `/login`
- [x] 4.4 Update `src/app/(blog)/profile/LogoutButton.tsx`: replace `signOut` from `next-auth/react` with `authClient.signOut()`

## 5. Login Page

- [x] 5.1 Create `src/app/(blog)/login/page.tsx`: minimal login page with Google/GitHub OAuth buttons and email/password form

## 6. Cleanup & Seed

- [x] 6.1 Delete `src/proxy.ts` (next-auth middleware)
- [x] 6.2 Update seed script to create test user via Better Auth's server-side signup API (email: `howard+test@howardism.dev`, password: `test-password-123`)
- [x] 6.3 Run `bunx prisma migrate dev` to generate initial migration for fresh PostgreSQL schema
