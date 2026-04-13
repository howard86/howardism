## ADDED Requirements

### Requirement: Auth server instance with Prisma PostgreSQL adapter
The system SHALL create a Better Auth server instance at `src/lib/auth.ts` that uses the Prisma adapter configured for PostgreSQL.

#### Scenario: Server instance initializes with Prisma adapter
- **WHEN** the auth server module is imported
- **THEN** it SHALL create a `betterAuth` instance with `prismaAdapter` using the shared Prisma client and `provider: "postgresql"`

### Requirement: Google OAuth provider
The system SHALL configure Google as a social provider using `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables.

#### Scenario: Google OAuth sign-in
- **WHEN** a user initiates Google sign-in
- **THEN** the system SHALL authenticate via Google OAuth and create a user record and session in the database

### Requirement: GitHub OAuth provider
The system SHALL configure GitHub as a social provider using `GITHUB_ID` and `GITHUB_SECRET` environment variables.

#### Scenario: GitHub OAuth sign-in
- **WHEN** a user initiates GitHub sign-in
- **THEN** the system SHALL authenticate via GitHub OAuth and create a user record and session in the database

### Requirement: Email and password authentication
The system SHALL enable the `emailAndPassword` plugin for Better Auth, allowing sign-in with email and password credentials.

#### Scenario: Email/password sign-in with seeded test user
- **WHEN** a user signs in with email `howard+test@howardism.dev` and password `test-password-123`
- **THEN** the system SHALL authenticate the user and create a database-backed session

### Requirement: App Router API route handler
The system SHALL expose Better Auth's API handler at `src/app/api/auth/[...all]/route.ts` using `toNextJsHandler`.

#### Scenario: Auth API route handles requests
- **WHEN** an HTTP GET or POST request is made to `/api/auth/*`
- **THEN** the Better Auth handler SHALL process the request and return the appropriate response

### Requirement: Server-side session retrieval
The system SHALL provide session retrieval via `auth.api.getSession()` accepting Next.js request headers.

#### Scenario: Authenticated session retrieval
- **WHEN** a server component calls `auth.api.getSession({ headers: await headers() })` with a valid session cookie
- **THEN** the system SHALL return a session object with `user.name`, `user.email`, and `user.image`

#### Scenario: Unauthenticated session retrieval
- **WHEN** a server component calls `auth.api.getSession()` without a valid session cookie
- **THEN** the system SHALL return `null`

### Requirement: Database-backed sessions
The system SHALL store sessions in the PostgreSQL database with cookie-based token management (not JWT).

#### Scenario: Session stored in database
- **WHEN** a user successfully authenticates
- **THEN** a session record SHALL be created in the `session` table with `token`, `expiresAt`, `ipAddress`, `userAgent`, and `userId` fields

### Requirement: Environment variable configuration
The system SHALL require `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` environment variables, validated through the existing `env.mjs` configuration.

#### Scenario: Missing auth secret
- **WHEN** `BETTER_AUTH_SECRET` is not set
- **THEN** the environment validation SHALL fail at startup

### Requirement: Remove next-auth
The system SHALL remove all `next-auth` dependencies and code, including `src/pages/api/auth/[...nextauth].ts` and `src/proxy.ts`.

#### Scenario: No next-auth imports remain
- **WHEN** the migration is complete
- **THEN** no file in the codebase SHALL import from `next-auth`, `next-auth/react`, `next-auth/next`, or `next-auth/middleware`
