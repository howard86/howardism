## ADDED Requirements

### Requirement: API error response bodies SHALL NOT echo request body contents

Every API route in the blog app SHALL construct error response bodies from static messages or from server-derived identifiers. No API route SHALL serialize the request body, any field of the request body, or any request query value into an error response body.

#### Scenario: Subscription endpoint rejects a malformed body without echoing input

- **WHEN** `POST /api/subscription` is called with body `{ "email": 42, "secret": "do-not-leak" }`
- **THEN** the response body SHALL NOT contain the substring `do-not-leak`, SHALL NOT contain the substring `req.body`, and SHALL NOT contain the number `42`

#### Scenario: Sudoku endpoint rejects a malformed body without echoing input

- **WHEN** `POST /api/sudoku` is called with body `{ "unknown": "leak-me" }`
- **THEN** the response body SHALL NOT contain the substring `leak-me` and SHALL NOT contain the substring `req.body`

### Requirement: API error log messages SHALL NOT interpolate request body contents

No API route in the blog app SHALL interpolate `req.body`, `JSON.stringify(req.body)`, or any field of `req.body` into an error message that is thrown, logged, or otherwise persisted.

#### Scenario: Thrown error messages contain no request-body interpolation

- **WHEN** the blog app is scanned for the literal patterns `JSON.stringify(req.body)`, `` `${JSON.stringify(req.body)}` ``, and `` `req.body=${`` within `apps/blog/src/pages/api/**` and `apps/blog/src/app/api/**`
- **THEN** zero matches SHALL be found

#### Scenario: Rejected sudoku input yields a static error message

- **WHEN** `POST /api/sudoku` is called with a body that contains neither `sudoku` nor `code`
- **THEN** the thrown `Error` instance's `message` SHALL NOT contain any value from the submitted body
