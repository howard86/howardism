## ADDED Requirements

### Requirement: Applicant email is session-pinned on all write paths

The `POST /api/resume` and `PUT /api/resume` handlers in `apps/blog/src/app/api/resume/route.ts` SHALL reject request bodies that contain a non-empty `email` field with HTTP 400. When the request body is accepted, the handler SHALL write the applicant row using the authenticated session email (`authResult.session.user.email`) exclusively; it SHALL NOT read any `email` value from the request body for the applicant upsert.

#### Scenario: POST with body email is rejected

- **WHEN** an authenticated client sends `POST /api/resume` with body `{ "email": "attacker@example.com", ... }`
- **THEN** the response SHALL have status `400` and no applicant row SHALL be created or updated

#### Scenario: PUT with body email is rejected

- **WHEN** an authenticated client sends `PUT /api/resume` with body `{ "email": "attacker@example.com", ... }`
- **THEN** the response SHALL have status `400` and no applicant row SHALL be created or updated

#### Scenario: POST without body email writes session email

- **WHEN** an authenticated client whose session email is `user@example.com` sends `POST /api/resume` with body that omits `email`
- **THEN** the applicant row SHALL be persisted with `email = "user@example.com"`

#### Scenario: PUT without body email preserves session email

- **WHEN** an authenticated client whose session email is `user@example.com` sends `PUT /api/resume` with body that omits `email`
- **THEN** the existing applicant row SHALL remain with `email = "user@example.com"` and SHALL NOT be updated to any other value

### Requirement: Resume writes are atomic

The `POST /api/resume` and `PUT /api/resume` handlers SHALL execute the applicant upsert, profile create/update, and all nested child entity operations (experiences, projects, educations, skills, languages) inside a single Prisma interactive transaction. Any failure within the transaction SHALL roll back the entire write, leaving the database in its pre-request state.

#### Scenario: Profile-create failure rolls back applicant upsert

- **WHEN** `POST /api/resume` is processed and the applicant upsert succeeds but the subsequent profile create throws
- **THEN** the response SHALL be an error status and the `ResumeApplicant` row MUST NOT exist in the database after the request completes

#### Scenario: Nested-child failure rolls back profile and applicant

- **WHEN** `PUT /api/resume` is processed and a nested child entity creation throws
- **THEN** the response SHALL be an error status and both the `ResumeProfile` update and `ResumeApplicant` upsert SHALL be rolled back

#### Scenario: Successful transaction commits all entities

- **WHEN** `POST /api/resume` completes without error
- **THEN** the applicant row, profile row, and all nested child rows SHALL be persisted atomically

### Requirement: Resume write transaction timeout

The Prisma transaction used by resume writes SHALL be invoked with an explicit `timeout` of at least `15000` milliseconds and a `maxWait` of at least `5000` milliseconds to accommodate large nested payloads without hitting the Prisma default 5-second transaction timeout.

#### Scenario: Transaction options are explicit

- **WHEN** the resume POST or PUT handler is invoked
- **THEN** the call to `prisma.$transaction` SHALL include options with `timeout >= 15000` and `maxWait >= 5000`
