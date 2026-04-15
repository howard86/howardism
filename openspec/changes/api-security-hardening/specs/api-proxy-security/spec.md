## ADDED Requirements

### Requirement: Session-authenticated caller only

The `/api/proxy` route SHALL reject any request that does not carry a valid Better Auth session. Authentication SHALL run before any URL parsing, DNS resolution, or outbound network activity.

#### Scenario: Unauthenticated request is rejected without network activity

- **WHEN** a request without a Better Auth session cookie is made to `/api/proxy?url=https://example.com`
- **THEN** the route SHALL respond with HTTP 401 and SHALL NOT perform any DNS lookup or outbound `fetch`

#### Scenario: Authenticated request proceeds to URL validation

- **WHEN** a request with a valid Better Auth session cookie is made to `/api/proxy?url=<value>`
- **THEN** the route SHALL proceed to URL parsing and the private-IP blocklist check

### Requirement: Private-IP blocklist on literal hostname

The `/api/proxy` route SHALL reject any URL whose literal hostname resolves to a loopback, link-local, unspecified, private IPv4 range (10.0.0.0/8, 127.0.0.0/8, 169.254.0.0/16, 172.16.0.0/12, 192.168.0.0/16, 0.0.0.0/8), IPv6 unique-local (fc00::/7), IPv6 link-local (fe80::/10), or IPv4-mapped IPv6 covering any of the above.

#### Scenario: Loopback literal is rejected

- **WHEN** a request is made with `url=https://127.0.0.1/`
- **THEN** the route SHALL respond with HTTP 400 and SHALL NOT open any outbound connection

#### Scenario: IPv6 loopback literal is rejected

- **WHEN** a request is made with `url=https://[::1]/`
- **THEN** the route SHALL respond with HTTP 400 and SHALL NOT open any outbound connection

#### Scenario: Cloud metadata IP is rejected

- **WHEN** a request is made with `url=https://169.254.169.254/latest/meta-data/`
- **THEN** the route SHALL respond with HTTP 400 and SHALL NOT open any outbound connection

### Requirement: Only HTTPS scheme is accepted

The `/api/proxy` route SHALL reject any URL whose scheme is not `https:`.

#### Scenario: HTTP URL is rejected

- **WHEN** a request is made with `url=http://example.com/`
- **THEN** the route SHALL respond with HTTP 400 and SHALL NOT open any outbound connection

### Requirement: DNS validation before outbound connection

The `/api/proxy` route SHALL resolve every hostname (initial URL and every redirect target) via DNS and SHALL reject the request if any returned A or AAAA address matches the private-IP blocklist. Resolution errors in which no address is returned from either family SHALL be treated as a rejection.

#### Scenario: Hostname resolving to a private IP is rejected

- **WHEN** a request is made with `url=https://attacker.example.com/` and DNS returns `10.0.0.5` for `attacker.example.com`
- **THEN** the route SHALL respond with HTTP 400 and SHALL NOT open any outbound connection

#### Scenario: Hostname that cannot be resolved is rejected

- **WHEN** a request is made with `url=https://no-such-host.example.com/` and both `resolve4` and `resolve6` yield no addresses
- **THEN** the route SHALL respond with HTTP 400 and SHALL NOT open any outbound connection

### Requirement: IP-pinned outbound connection

The `/api/proxy` route SHALL open the outbound TCP connection against the exact IP address returned by the DNS validation step, not by performing a second DNS resolution inside `fetch`. The connection SHALL preserve the original hostname for TLS SNI and for the `Host` request header.

#### Scenario: Validated IP is used for the TCP connection

- **WHEN** the DNS validation step returns `203.0.113.5` for `example.com`
- **THEN** the outbound TCP connection SHALL open to `203.0.113.5` while TLS SNI and the `Host` header remain `example.com`

#### Scenario: DNS rebinding attempt cannot reach a private IP

- **WHEN** a rebind server returns a public address on the validation lookup and `127.0.0.1` on the connection-time lookup
- **THEN** the route SHALL connect to the validated public address and SHALL NOT connect to `127.0.0.1`

### Requirement: Bounded redirect follow with re-validation

The `/api/proxy` route SHALL set `redirect: "manual"` on the outbound `fetch` and SHALL re-run the private-IP blocklist, DNS validation, and IP-pinned connection requirements on every redirect target. The route SHALL follow at most three redirect hops and SHALL reject a redirect chain that exceeds three hops.

#### Scenario: Redirect to a private IP is rejected at the redirect hop

- **WHEN** the initial target responds with `302` and `Location: http://127.0.0.1/admin`
- **THEN** the route SHALL reject the redirect without fetching the private target and SHALL respond with HTTP 400 or HTTP 502

#### Scenario: Redirect chain exceeding three hops is rejected

- **WHEN** the initial target begins a redirect chain of four or more hops, all to public addresses
- **THEN** the route SHALL reject the chain after the third hop and SHALL respond with a non-2xx status

#### Scenario: Single redirect to a public target is followed and validated

- **WHEN** the initial target responds with `302` and `Location: https://other.example.com/` whose DNS resolves to a public address
- **THEN** the route SHALL re-run the DNS validation and IP pinning for `other.example.com` and SHALL fetch the redirected resource

### Requirement: Request timeout

The `/api/proxy` route SHALL abort every outbound `fetch` (initial target and every redirect hop) after five seconds via an `AbortController` signal.

#### Scenario: Slow target is aborted

- **WHEN** an outbound target holds the connection open for longer than five seconds without responding
- **THEN** the route SHALL abort the fetch and SHALL respond with HTTP 504

### Requirement: Response body size cap

The `/api/proxy` route SHALL reject any response whose body exceeds 1,000,000 bytes. The route SHALL fast-reject on a `Content-Length` header that exceeds the cap and SHALL enforce the cap with a rolling byte counter while streaming the body.

#### Scenario: Content-Length above cap is fast-rejected

- **WHEN** the upstream response carries `Content-Length: 2000000`
- **THEN** the route SHALL respond with HTTP 413 and SHALL NOT buffer the body

#### Scenario: Streaming body exceeding cap is aborted

- **WHEN** the upstream response carries no `Content-Length` header and streams more than 1,000,000 bytes
- **THEN** the route SHALL cancel the reader at the first chunk that pushes the running total above the cap and SHALL respond with HTTP 413
