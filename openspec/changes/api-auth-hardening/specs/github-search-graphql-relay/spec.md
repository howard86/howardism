## ADDED Requirements

### Requirement: Validated GraphQL request body

The system SHALL validate the `POST /api/graphql` request body against a Zod schema requiring `query: string`, `operationName: string`, and optional `variables: object`.

#### Scenario: Malformed body rejected
- **WHEN** the request body does not conform to the schema (missing fields, wrong types, etc.)
- **THEN** the system SHALL respond 400 and SHALL NOT forward any request to the GitHub GraphQL API

### Requirement: Operation name allowlist

The system SHALL maintain a module-level `Set<string>` of allowed GraphQL operation names matching the non-fragment operations defined in `apps/github-search/src/gql/*.graphql` (currently `getUser`, `searchUsers`) and reject any request whose `operationName` is not in the set. The allowlist SHALL exclude fragment names (e.g., `pageInfoFields`) because `operationName` never matches a fragment. The set SHALL be accompanied by a source-code comment directing future contributors to update it when adding new `.graphql` operation files.

#### Scenario: Unknown operation rejected
- **WHEN** a request's `operationName` is not in the allowlist
- **THEN** the system SHALL respond 400 and SHALL NOT forward the request upstream

#### Scenario: Known operation proceeds
- **WHEN** a request's `operationName` is in the allowlist (and other checks pass)
- **THEN** the system SHALL forward the request to the GitHub GraphQL API unchanged and pass through the response

### Requirement: Mutation and subscription block

The system SHALL parse the `query` with the `graphql` library's `parse()` function, walk its definitions, and reject the request if ANY definition has `operation !== "query"`.

#### Scenario: Mutation rejected
- **WHEN** the request's `query` contains a `mutation { ... }` definition
- **THEN** the system SHALL respond 400 even if the `operationName` matches the allowlist

#### Scenario: Subscription rejected
- **WHEN** the request's `query` contains a `subscription { ... }` definition
- **THEN** the system SHALL respond 400

### Requirement: Query depth limit via AST walk

The system SHALL enforce a maximum query depth of 8 by walking the parsed `DocumentNode` of the request `query`. The implementation SHALL NOT introduce a dependency on `graphql-depth-limit` and SHALL NOT load the 4.4MB `graphql.schema.json` introspection file — the AST walk is self-contained.

#### Scenario: Acceptable-depth query proceeds
- **WHEN** the request's `query` has maximum nesting depth ≤ 8
- **THEN** the system SHALL forward the request upstream

#### Scenario: Over-depth query rejected
- **WHEN** the request's `query` has maximum nesting depth > 8
- **THEN** the system SHALL respond 400 and SHALL NOT forward the request upstream

### Requirement: Upstream request remains token-authenticated

The system SHALL continue to attach the server's `GITHUB_ACCESS_TOKEN` as the upstream request's bearer token, unchanged by this change.

#### Scenario: Token forwarding unchanged
- **WHEN** a validated, allowlisted, depth-acceptable query is forwarded upstream
- **THEN** the system SHALL set the `Authorization: Bearer <GITHUB_ACCESS_TOKEN>` header on the upstream request as before
