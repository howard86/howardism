## ADDED Requirements

### Requirement: Legacy hardening headers are emitted

The system SHALL emit the following six headers from `getSecurityHeaders`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains`
- `Permissions-Policy: camera=(), microphone=(), geolocation=<token>` where `<token>` is the `geolocation` option.

#### Scenario: geolocation=()

- **WHEN** `getSecurityHeaders({ geolocation: "()" })` is called
- **THEN** the returned array contains `{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }`

#### Scenario: geolocation=(self)

- **WHEN** `getSecurityHeaders({ geolocation: "(self)" })` is called
- **THEN** the returned array contains a `Permissions-Policy` header whose value includes `geolocation=(self)`

### Requirement: Default CSP is enforced when not overridden

The system SHALL, when `contentSecurityPolicy` is `undefined`, append a `Content-Security-Policy` header whose value contains the baseline directives:

- `default-src 'self'`
- `frame-ancestors 'none'`
- `object-src 'none'`
- `base-uri 'self'`
- `form-action 'self'`
- `upgrade-insecure-requests` (bare token)

#### Scenario: Default invocation

- **WHEN** `getSecurityHeaders({ geolocation: "()" })` is called
- **THEN** the returned array contains a `Content-Security-Policy` header whose value contains `default-src 'self'` AND `frame-ancestors 'none'` AND `upgrade-insecure-requests`

### Requirement: CSP can be disabled explicitly

The system SHALL, when `contentSecurityPolicy` is `false`, omit any `Content-Security-Policy*` header from the returned array.

#### Scenario: Disabled CSP

- **WHEN** `getSecurityHeaders({ geolocation: "()", contentSecurityPolicy: false })` is called
- **THEN** the returned array contains no header whose `key` starts with `Content-Security-Policy`

### Requirement: Custom CSP replaces the default wholesale

The system SHALL, when `contentSecurityPolicy` is an object, emit only the directives in that object — NOT a merge with `DEFAULT_CSP_DIRECTIVES`.

#### Scenario: Two-directive override

- **WHEN** `getSecurityHeaders({ geolocation: "()", contentSecurityPolicy: { "default-src": ["'none'"], "script-src": ["'self'"] } })` is called
- **THEN** the returned array contains exactly one `Content-Security-Policy` header whose value equals `default-src 'none'; script-src 'self'`

### Requirement: Report-only mode

The system SHALL, when `cspReportOnly` is `true`, use the key `Content-Security-Policy-Report-Only` instead of `Content-Security-Policy`, keeping the same serialized value.

#### Scenario: Report-only enabled

- **WHEN** `getSecurityHeaders({ geolocation: "()", cspReportOnly: true })` is called
- **THEN** the returned array contains a `Content-Security-Policy-Report-Only` header AND no `Content-Security-Policy` header

### Requirement: Directive serialization is spec-compliant

The system SHALL serialize a `CspDirectives` object by joining `"<name> <source> <source>..."` segments with `"; "`, emit bare tokens for directives in the bare allow-list (`upgrade-insecure-requests`, `block-all-mixed-content`), throw when a non-bare directive is handed `true`, and skip directives whose source array is empty.

#### Scenario: Multi-source directive

- **WHEN** `serializeCsp({ "img-src": ["'self'", "https:", "data:"] })` is called
- **THEN** the function returns `"img-src 'self' https: data:"`

#### Scenario: Bare directive

- **WHEN** `serializeCsp({ "upgrade-insecure-requests": true })` is called
- **THEN** the function returns `"upgrade-insecure-requests"`

#### Scenario: Invalid bare form

- **WHEN** `serializeCsp({ "default-src": true })` is called
- **THEN** the function throws an `Error` matching `/does not support bare/`

#### Scenario: Empty source array

- **WHEN** `serializeCsp({ "default-src": ["'self'"], "script-src": [] })` is called
- **THEN** the function returns `"default-src 'self'"`

### Requirement: DEFAULT_CSP_DIRECTIVES is frozen

The system SHALL export `DEFAULT_CSP_DIRECTIVES` as a frozen object so apps that spread it into overrides cannot mutate the shared baseline.

#### Scenario: Attempting to mutate DEFAULT_CSP_DIRECTIVES

- **WHEN** a consumer attempts `DEFAULT_CSP_DIRECTIVES["default-src"] = ["'none'"]`
- **THEN** the mutation is rejected (silently in sloppy mode, as a TypeError in strict mode)
