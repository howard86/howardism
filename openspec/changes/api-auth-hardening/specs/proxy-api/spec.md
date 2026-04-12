## ADDED Requirements

### Requirement: Authenticated proxy invocation

The system SHALL require an authenticated session for all calls to `/api/proxy`.

#### Scenario: Unauthenticated call rejected
- **WHEN** an unauthenticated request is made to `/api/proxy`
- **THEN** the system SHALL respond 401 and SHALL NOT perform any upstream fetch

#### Scenario: Authenticated call proceeds through remaining guards
- **WHEN** an authenticated request is made to `/api/proxy`
- **THEN** the system SHALL proceed to the protocol check, string-based private-host check (from PR #503), and the new DNS-resolved-IP check

### Requirement: DNS-resolved-IP SSRF guard

The system SHALL resolve the target URL's hostname via `dns.resolve4` and `dns.resolve6` and reject the request if ANY resolved IP matches the existing private-IP predicates (IPv4 or IPv6 private ranges as defined by `isPrivateHost`).

#### Scenario: Hostname resolving to public IP proceeds
- **WHEN** the URL's hostname resolves exclusively to public IPs
- **THEN** the system SHALL proceed to the upstream fetch

#### Scenario: Hostname resolving to private IPv4 rejected
- **WHEN** the URL's hostname resolves to 127.0.0.1 (or any other private IPv4)
- **THEN** the system SHALL respond 400 and SHALL NOT perform the upstream fetch

#### Scenario: Hostname resolving to private IPv6 rejected
- **WHEN** the URL's hostname resolves to `::1` (or any other private IPv6)
- **THEN** the system SHALL respond 400 and SHALL NOT perform the upstream fetch

#### Scenario: DNS resolution failure
- **WHEN** DNS resolution fails (`ENOTFOUND`, `ENODATA`, or similar)
- **THEN** the system SHALL respond 400 and SHALL NOT perform the upstream fetch

### Requirement: Fetch timeout

The system SHALL wrap the upstream `fetch()` in an `AbortController` with a configured timeout (default 5 seconds) and return 504 if the timeout fires.

#### Scenario: Upstream completes within timeout
- **WHEN** the upstream responds within 5s
- **THEN** the system SHALL return the upstream response as before

#### Scenario: Upstream exceeds timeout
- **WHEN** the upstream does not respond within 5s
- **THEN** the system SHALL abort the fetch and respond 504

### Requirement: Response-size cap

The system SHALL enforce a 1MB cap on the proxied response body. The response shape returned to callers SHALL remain `NextResponse.json({ data: <body-text> })` — the cap is enforced during body reading, not by switching to a streamed response, so clients of `/api/proxy` see no shape change.

#### Scenario: Small response forwarded
- **WHEN** the upstream response body is under 1MB (and `Content-Length` advertises so, if present)
- **THEN** the system SHALL forward the response body unchanged

#### Scenario: Oversized response rejected via Content-Length
- **WHEN** the upstream's `Content-Length` header exceeds 1MB
- **THEN** the system SHALL respond 413 and SHALL NOT read the upstream body

#### Scenario: Oversized chunked response rejected during streaming
- **WHEN** the upstream response has no `Content-Length` and cumulative streamed bytes exceed 1MB
- **THEN** the system SHALL abort reading and respond 413

### Requirement: PR #503 protections preserved

The system SHALL retain the protocol guard (`https:` only) and the string-based `isPrivateHost(hostname)` check introduced in PR #503. The new DNS-resolved-IP check runs *after* those guards, not in place of them.

#### Scenario: Non-HTTPS scheme rejected
- **WHEN** the target URL uses a scheme other than `https:`
- **THEN** the system SHALL respond 400 without performing any DNS resolution or fetch

#### Scenario: String-shape private host rejected before DNS
- **WHEN** the target hostname matches a literal private IP (e.g., `127.0.0.1`) or localhost literal
- **THEN** the system SHALL respond 400 without performing DNS resolution
