## ADDED Requirements

### Requirement: Validated login request body

The system SHALL validate the `POST /api/auth/login` request body against a Zod schema containing `identifier` and `password` string fields.

#### Scenario: Malformed body rejected
- **WHEN** the request body does not conform to the login schema
- **THEN** the system SHALL respond 400 with a structured error envelope containing the flattened Zod error tree — and SHALL NOT call any downstream auth service

#### Scenario: Valid body proceeds to login
- **WHEN** the request body conforms to the login schema
- **THEN** the system SHALL pass the validated body to the downstream `login()` function unchanged

### Requirement: Bearer token format check on recipe create

The system SHALL validate the `Authorization` header of `POST /api/recipe/create` against `/^Bearer .+/` and respond 401 on missing or malformed headers.

#### Scenario: Missing Authorization header
- **WHEN** the request has no `Authorization` header
- **THEN** the system SHALL respond 401 and SHALL NOT call `createRecipe()`

#### Scenario: Malformed Authorization header
- **WHEN** the request's `Authorization` header does not match `Bearer .+` (e.g., a raw token, an 8-character string, a non-Bearer scheme)
- **THEN** the system SHALL respond 401 and SHALL NOT call `createRecipe()`

#### Scenario: Valid Bearer passes through
- **WHEN** the request's `Authorization` header matches `Bearer .+`
- **THEN** the system SHALL forward the header unchanged to `createRecipe()`

### Requirement: Validated recipe create body

The system SHALL validate the `POST /api/recipe/create` request body against a Zod schema matching the `RawRecipe` shape consumed by `createRecipe()`.

#### Scenario: Malformed recipe body rejected
- **WHEN** the request body does not conform to the recipe schema
- **THEN** the system SHALL respond 400 with a flattened Zod error envelope — and SHALL NOT call `createRecipe()`

#### Scenario: Valid recipe body proceeds
- **WHEN** the request body conforms to the recipe schema
- **THEN** the system SHALL pass the validated body to `createRecipe()` unchanged

### Requirement: No logging of raw request bodies or credentials

The system SHALL NOT emit any `console.log`, `console.warn`, or `console.error` call that references `req.body`, `req.headers`, `Authorization`, or any Bearer token value in the recipe API handlers.

#### Scenario: Log scrub enforced
- **WHEN** the recipe API files (`apps/recipe/src/pages/api/auth/login.ts`, `apps/recipe/src/pages/api/recipe/create.ts`) are grep'd for `console\.(log|warn|error)`
- **THEN** no match SHALL take `req.body`, `req.headers`, `authorization`, or `Bearer` as an argument — only stable identifiers like `error.message`
