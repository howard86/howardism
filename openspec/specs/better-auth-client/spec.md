# better-auth-client Specification

## Purpose
TBD - created by archiving change better-auth-migration. Update Purpose after archive.
## Requirements
### Requirement: Auth client instance
The system SHALL create a Better Auth React client at `src/lib/auth-client.ts` using `createAuthClient` from `better-auth/react`.

#### Scenario: Client instance creation
- **WHEN** the auth client module is imported
- **THEN** it SHALL export an `authClient` object with `signIn`, `signOut`, and `useSession` methods

### Requirement: Client-side sign-out
The system SHALL replace `signOut()` from `next-auth/react` with `authClient.signOut()` in the `LogoutButton` component.

#### Scenario: User clicks logout
- **WHEN** the user clicks the logout button
- **THEN** `authClient.signOut()` SHALL be called, clearing the session cookie and invalidating the database session

### Requirement: Social sign-in via client
The system SHALL provide social sign-in methods via the auth client.

#### Scenario: GitHub sign-in from client
- **WHEN** the login page calls `authClient.signIn.social({ provider: "github" })`
- **THEN** the user SHALL be redirected to GitHub's OAuth consent screen

#### Scenario: Google sign-in from client
- **WHEN** the login page calls `authClient.signIn.social({ provider: "google" })`
- **THEN** the user SHALL be redirected to Google's OAuth consent screen

### Requirement: Email/password sign-in via client
The system SHALL provide email/password sign-in via `authClient.signIn.email()`.

#### Scenario: Email/password sign-in from client
- **WHEN** the login page calls `authClient.signIn.email({ email, password })` with valid credentials
- **THEN** a session SHALL be created and the user redirected to `/profile`

#### Scenario: Email/password sign-in with invalid credentials
- **WHEN** the login page calls `authClient.signIn.email({ email, password })` with invalid credentials
- **THEN** the system SHALL return an error and no session SHALL be created

