## ADDED Requirements

### Requirement: PostgreSQL datasource with driver adapter
The Prisma schema SHALL use `postgresql` as the provider with a bare datasource block (no `url`/`directUrl` — these are removed in Prisma 7). Runtime connections use a driver adapter (`@prisma/adapter-pg` with `DATABASE_URL`). CLI operations use `prisma.config.ts` with `DIRECT_URL`.

#### Scenario: Prisma connects to Supabase PostgreSQL
- **WHEN** the application starts
- **THEN** Prisma SHALL connect using `PrismaPg` adapter with `DATABASE_URL` (Supavisor pooled transaction mode, port 6543) connection string

#### Scenario: Prisma migrations use direct URL
- **WHEN** `bunx prisma migrate dev` is run
- **THEN** Prisma SHALL use `DIRECT_URL` (session mode, port 5432) via `prisma.config.ts` for schema migrations

### Requirement: Better Auth database schema
The Prisma schema SHALL define auth tables matching Better Auth's requirements.

#### Scenario: User table schema
- **WHEN** the schema is applied
- **THEN** the `user` table SHALL have: `id` (String, cuid), `name` (String, required), `email` (String, unique, required), `emailVerified` (Boolean), `image` (String, optional), `createdAt` (DateTime), `updatedAt` (DateTime)

#### Scenario: Session table schema
- **WHEN** the schema is applied
- **THEN** the `session` table SHALL have: `id` (String, cuid), `token` (String, unique), `expiresAt` (DateTime), `ipAddress` (String, optional), `userAgent` (String, optional), `userId` (String, FK to user), `createdAt` (DateTime), `updatedAt` (DateTime)

#### Scenario: Account table schema
- **WHEN** the schema is applied
- **THEN** the `account` table SHALL have: `id` (String, cuid), `accountId` (String), `providerId` (String), `userId` (String, FK to user), `accessToken` (String, optional), `refreshToken` (String, optional), `accessTokenExpiresAt` (DateTime, optional), `refreshTokenExpiresAt` (DateTime, optional), `scope` (String, optional), `idToken` (String, optional), `password` (String, optional), `createdAt` (DateTime), `updatedAt` (DateTime)

#### Scenario: Verification table schema
- **WHEN** the schema is applied
- **THEN** the `verification` table SHALL have: `id` (String, cuid), `identifier` (String), `value` (String), `expiresAt` (DateTime), `createdAt` (DateTime), `updatedAt` (DateTime)

### Requirement: Simplified Prisma client
`src/services/prisma.ts` SHALL use `PrismaClient` with the `@prisma/adapter-pg` driver adapter, replacing the SQLite adapter.

#### Scenario: Prisma client initialization
- **WHEN** the Prisma client module is imported
- **THEN** it SHALL create a `PrismaClient` instance with `PrismaPg` adapter using `DATABASE_URL` from `process.env`

#### Scenario: Development mode singleton
- **WHEN** running in development mode
- **THEN** the Prisma client SHALL be attached to the global object to prevent connection exhaustion

### Requirement: Seed test user
The seed script SHALL create a test user via Better Auth's server-side signup API.

#### Scenario: Seed creates test user
- **WHEN** `bun run prisma:seed` is executed
- **THEN** a user SHALL be created with email `howard+test@howardism.dev`, password `test-password-123`, name `Howard Tai`

### Requirement: Remove SQLite dependencies
The system SHALL remove `@prisma/adapter-better-sqlite3` and `better-sqlite3` packages.

#### Scenario: No SQLite references remain
- **WHEN** the migration is complete
- **THEN** no file SHALL import from `@prisma/adapter-better-sqlite3` or `better-sqlite3`, and the Prisma schema SHALL not reference `sqlite`

### Requirement: Environment variables for database
The system SHALL require `DATABASE_URL` and `DIRECT_URL` environment variables. These are read directly from `process.env` by Prisma (not validated through `env.mjs`) to avoid breaking builds in environments without a database connection.

#### Scenario: Missing DATABASE_URL
- **WHEN** `DATABASE_URL` is not set and the application attempts a database connection
- **THEN** the Prisma client SHALL fail at connection time with a descriptive error
