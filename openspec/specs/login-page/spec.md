# login-page Specification

## Purpose
TBD - created by archiving change better-auth-migration. Update Purpose after archive.
## Requirements
### Requirement: Login page at /login
The system SHALL provide a login page at `src/app/(blog)/login/page.tsx` that is a client component.

#### Scenario: Unauthenticated user visits /login
- **WHEN** an unauthenticated user navigates to `/login`
- **THEN** the page SHALL display Google and GitHub OAuth buttons and an email/password form

### Requirement: OAuth sign-in buttons
The login page SHALL display buttons for Google and GitHub social sign-in.

#### Scenario: User clicks GitHub sign-in
- **WHEN** the user clicks the GitHub button
- **THEN** `authClient.signIn.social({ provider: "github" })` SHALL be called

#### Scenario: User clicks Google sign-in
- **WHEN** the user clicks the Google button
- **THEN** `authClient.signIn.social({ provider: "google" })` SHALL be called

### Requirement: Email/password sign-in form
The login page SHALL display a form with email and password inputs and a submit button.

#### Scenario: User submits email/password form
- **WHEN** the user enters email and password and submits the form
- **THEN** `authClient.signIn.email({ email, password })` SHALL be called

#### Scenario: Successful sign-in redirects to profile
- **WHEN** sign-in succeeds (any method)
- **THEN** the user SHALL be redirected to `/profile`

### Requirement: Protected page redirect to login
Protected pages (`/profile`, `/profile/resume/*`) SHALL redirect unauthenticated users to `/login` instead of `/`.

#### Scenario: Unauthenticated user visits /profile
- **WHEN** an unauthenticated user navigates to `/profile`
- **THEN** the user SHALL be redirected to `/login`

#### Scenario: Unauthenticated user visits /profile/resume/:id
- **WHEN** an unauthenticated user navigates to `/profile/resume/:id`
- **THEN** the user SHALL be redirected to `/login`

