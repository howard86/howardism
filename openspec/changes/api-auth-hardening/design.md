## Context

This change bundles four high-severity API authentication/authorization fixes that share a threat model (backend capability exposed without caller verification) and overlap in their fix surface (blog-app session primitives, Zod validation patterns). The alternative — five separate PRs — would duplicate the `requireSession()` extraction and fragment review. Bundling keeps related work reviewable in one pass while still mapping each commit 1:1 to a closed issue.

The change follows PR #503 (`worktree-fix-security-vulnerabilities`, merged 2026-04-11) which introduced a string-based private-host check and protocol guard on the proxy route. This change preserves that work and adds layers above it.

## Goals / Non-Goals

**Goals:**
- Each of #498, #499, #521, #523 is closed by a dedicated commit that GitHub auto-closes on merge
- `requireSession()` exists as a reusable primitive in `apps/blog/src/lib/auth.ts`
- Existing tests (especially PR #503's private-host tests) continue to pass
- No new abstraction beyond what is needed by two or more callsites

**Non-Goals:**
- Rate limiting — separate change
- IP-pinned DNS (full rebinding mitigation) — follow-up issue
- Guest-checkout signed-URL access — follow-up issue
- JWT signature verification against recipe CMS — belongs at CMS boundary
- Adding user authentication to `apps/github-search` — larger design question

## Decisions

### Decision 1: Require login across the entire checkout flow (#498)

**Chosen:** Gate order creation AND order details behind `requireSession()`. No guest checkout.

**Alternatives considered:**
- Match by `email = session.user.email`, leave guest checkout flow intact — rejected because guests would lose access to their own receipts, and the session-email check still doesn't bind to the order record (new user with same email could view it).
- Signed-URL access for guests — rejected as in-scope; filed as follow-up. Adds token-signing, expiry, and CMS integration work unrelated to the security fix.

**Why this decision:** Cleaner long-term model; ownership is bound to the authenticated user identity, not a string match. UX impact acknowledged: anonymous purchase is removed in blog app's checkout flow until a signed-URL follow-up lands.

### Decision 2: DNS-resolved-IP check for SSRF (#521)

**Chosen:** After the existing string-based `isPrivateHost(hostname)` check (PR #503), additionally resolve the hostname via `dns.resolve4/6` and run each returned IP through the existing private-IP predicates. Reject if any resolved IP is private.

**Alternatives considered:**
- Custom `undici` dispatcher with `lookup` callback pinning the resolved IP — truly closes the TOCTOU race between resolve and fetch. Rejected for this change (higher complexity touching the fetch stack); filed as follow-up.
- Replace the string check with DNS-only — rejected. String check still catches cheap cases without network round-trip and provides defense-in-depth if resolver is slow/unavailable.

**Why this decision:** DNS resolve-and-check meaningfully narrows the rebinding window (from any-time to a sub-second race) at low complexity. Correct long-term fix is flagged, not silently skipped.

### Decision 3: One combined commit per high-severity issue

**Chosen:** Single commit closes each issue, even when multiple logical sub-changes land together (e.g., auth + SSRF + timeout + size-cap all in one commit closing #521).

**Alternatives considered:**
- One commit per sub-change, multiple commits all saying `Closes #521` — technically correct (GitHub closes on the first merged to default), but harder to revert/bisect.

**Why this decision:** Simpler issue↔commit mapping, cleaner review, atomic revert if any sub-change breaks something.

### Decision 4: GraphQL depth limit strategy (#523)

**Chosen:** Prefer `graphql-depth-limit` via `validate()` if a local `GraphQLSchema` is available via codegen; fall back to AST-walk depth check (no schema required) otherwise. Planner to confirm during execution plan.

**Alternatives considered:**
- Query-complexity analysis — more accurate than depth alone, higher complexity, out of scope.
- Hardcoded maximum body size — orthogonal, also useful, added alongside depth limit as cheap extra.

**Why this decision:** Depth is a strong proxy for token-abuse risk; the fallback ensures we can land the fix even without a local schema instance.

## Risks / Trade-offs

- **UX regression on checkout flow.** Blog users who relied on guest checkout can no longer purchase anonymously. Mitigation: flagged in commit body, follow-up issue for signed-URL guest receipts.
- **Residual DNS-rebinding window on proxy route.** Decision 2 doesn't fully close the race. Follow-up issue must be filed and linked from the #521 closing commit.
- **GraphQL allowlist may be incomplete.** The initial operation-name set is inferred from codegen output; if a page uses a dynamic query the allowlist misses it, the page breaks. Mitigation: validator runs the full app manually at validation stage, not just unit tests.
- **`requireSession()` helper shape drift.** Existing ubike callsite uses inline `auth.api.getSession` + 401 return. The helper must match that shape (return shape, error semantics) to avoid subtle regressions. Mitigation: T1 is an explicit refactor with the ubike callsite migrated under it, verifying the baseline.

## Migration Plan

Not a migration — additive security fixes. Deployment order does not matter across the 5 tasks; tasks will land sequentially on a single feature branch with atomic commits.

## Open Questions

_(None — all decisions resolved at brainstorm-approval gate.)_
