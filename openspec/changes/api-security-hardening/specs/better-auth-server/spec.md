## MODIFIED Requirements

### Requirement: Environment variable configuration

The system SHALL require `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` environment variables, validated through the existing `env.mjs` configuration. The validated values SHALL be passed explicitly to the `betterAuth(...)` call as the `secret` and `baseURL` options; the system SHALL NOT rely on Better Auth's implicit `process.env` discovery for these values.

#### Scenario: Missing auth secret

- **WHEN** `BETTER_AUTH_SECRET` is not set
- **THEN** the environment validation SHALL fail at startup

#### Scenario: Validated secret is passed explicitly to betterAuth

- **WHEN** `apps/blog/src/lib/auth.ts` is inspected
- **THEN** the `betterAuth(...)` call SHALL receive `secret: env.BETTER_AUTH_SECRET` and `baseURL: env.BETTER_AUTH_URL` as options sourced from the validated `env` import

## ADDED Requirements

### Requirement: Route-level authentication guard for `/profile/:path*`

The system SHALL expose a Next.js middleware at `apps/blog/src/middleware.ts` whose matcher covers `/profile/:path*` and which SHALL reject requests lacking a Better Auth session cookie by redirecting to `/login?callbackURL=<original-pathname>`. The session-cookie check SHALL use `getSessionCookie` from `better-auth/cookies` and SHALL NOT perform a database query on the hot path.

#### Scenario: Unauthenticated profile request is redirected

- **WHEN** an unauthenticated request is made to `/profile/resume/add`
- **THEN** the middleware SHALL respond with HTTP 307 or 308 redirecting to `/login?callbackURL=%2Fprofile%2Fresume%2Fadd`

#### Scenario: Unauthenticated ubike request is redirected

- **WHEN** an unauthenticated request is made to `/profile/ubike`
- **THEN** the middleware SHALL respond with HTTP 307 or 308 redirecting to `/login?callbackURL=%2Fprofile%2Fubike`

#### Scenario: Authenticated profile request is forwarded

- **WHEN** a request carrying a valid Better Auth session cookie is made to `/profile/resume/add`
- **THEN** the middleware SHALL forward the request to the downstream handler without redirection

### Requirement: Password minimum length policy

The system SHALL configure Better Auth's `emailAndPassword` with `minPasswordLength: 8`. Registration and password-reset requests with passwords shorter than eight characters SHALL be rejected by Better Auth before any user or session record is created or updated.

#### Scenario: Registration with a 7-character password is rejected

- **WHEN** a user attempts to register via `POST /api/auth/sign-up/email` with a password of length seven
- **THEN** Better Auth SHALL respond with a 400-range status and SHALL NOT create a user record

#### Scenario: Registration with an 8-character password is accepted at the length check

- **WHEN** a user attempts to register via `POST /api/auth/sign-up/email` with a password of length eight and an otherwise valid payload
- **THEN** Better Auth SHALL NOT reject the request on the length check (other checks such as email verification may still apply)

### Requirement: Email verification requirement

The system SHALL configure Better Auth's `emailAndPassword` with `requireEmailVerification: true`. A user whose `user.emailVerified` is `false` SHALL NOT be able to establish an authenticated session via email/password sign-in. Social-provider sign-in (Google, GitHub) SHALL continue to produce authenticated sessions irrespective of `user.emailVerified`.

#### Scenario: Unverified email/password user cannot sign in

- **WHEN** a user whose `user.emailVerified` is `false` attempts to sign in via `POST /api/auth/sign-in/email`
- **THEN** Better Auth SHALL NOT issue a session cookie and SHALL return a non-2xx status

#### Scenario: Verified email/password user can sign in

- **WHEN** a user whose `user.emailVerified` is `true` attempts to sign in with correct credentials via `POST /api/auth/sign-in/email`
- **THEN** Better Auth SHALL issue a session cookie and a database-backed session record

### Requirement: Verification email delivery via SendGrid

The system SHALL wire Better Auth's `emailVerification.sendVerificationEmail` hook to a `sendTransactionalEmail(to, subject, html)` helper in `apps/blog/src/services/mail.ts` built on the same SendGrid client already used by `subscribeToNewsletter`. The helper SHALL send an email whose body contains the verification URL provided by Better Auth.

#### Scenario: Registration triggers a verification email

- **WHEN** a user successfully completes `POST /api/auth/sign-up/email` with a valid payload
- **THEN** `sendTransactionalEmail` SHALL be invoked exactly once with the user's email address as `to` and an `html` body containing the verification URL supplied by Better Auth

#### Scenario: Verification email reuses the existing SendGrid client

- **WHEN** `apps/blog/src/services/mail.ts` is inspected
- **THEN** `sendTransactionalEmail` SHALL send via the same `@sendgrid/mail` (or equivalent) client instance that backs `subscribeToNewsletter`, and SHALL NOT instantiate a separate mail transport
