## ADDED Requirements

### Requirement: Recipe-ID allow-list at the service layer

`getRecipeById(id)` in `apps/recipe/src/services/recipe.ts` SHALL validate its `id` argument against the pattern `/^[A-Za-z0-9_-]{1,64}$/` before any outbound fetch. When the pattern does not match, the function SHALL return `null` without calling the CMS.

The allow-list pattern SHALL be declared at module top-level (Ultracite `useTopLevelRegex`), exported from `services/recipe.ts` as `RECIPE_ID_PATTERN`, and reused by `pages/recipe/[id].tsx`.

#### Scenario: Allow-listed ID proceeds to CMS

- **WHEN** `getRecipeById("abc123")` is invoked
- **THEN** `cms.get` SHALL be called with URL path `/recipes/abc123`

#### Scenario: ID with slash is rejected (regression for #547)

- **WHEN** `getRecipeById("../etc/passwd")` is invoked
- **THEN** the function SHALL return `null`
- **AND** `cms.get` SHALL NOT be called

#### Scenario: URL-encoded traversal is rejected

- **WHEN** `getRecipeById("..%2Fetc%2Fpasswd")` is invoked
- **THEN** the function SHALL return `null`
- **AND** `cms.get` SHALL NOT be called

#### Scenario: Control-character ID is rejected

- **WHEN** `getRecipeById("abc\x00def")` is invoked
- **THEN** the function SHALL return `null`

#### Scenario: Empty ID is rejected

- **WHEN** `getRecipeById("")` is invoked
- **THEN** the function SHALL return `null`

#### Scenario: Oversized ID is rejected

- **WHEN** `getRecipeById(<65-char-string>)` is invoked
- **THEN** the function SHALL return `null`

### Requirement: Defense-in-depth URL encoding

`getRecipeById` SHALL wrap the validated `id` in `encodeURIComponent` before interpolating it into the CMS URL, even though the allow-list already forbids the characters that would need escaping. The encoding SHALL survive any future loosening of the allow-list.

#### Scenario: CMS URL uses encoded ID

- **WHEN** `getRecipeById("abc_123")` is invoked
- **THEN** the CMS call URL path SHALL be `/recipes/abc_123` (encoding is a no-op for this input, but the `encodeURIComponent` call SHALL be present in the source)

### Requirement: Page-layer ID validation

`getStaticProps` in `apps/recipe/src/pages/recipe/[id].tsx` SHALL apply the same `RECIPE_ID_PATTERN` to `context.params?.id` before calling `getRecipeById`. A mismatch SHALL return `{ notFound: true }` and SHALL NOT trigger a CMS round-trip.

#### Scenario: Page rejects traversal ID with notFound

- **WHEN** `getStaticProps` is invoked with `context.params = { id: "../etc/passwd" }`
- **THEN** the result SHALL equal `{ notFound: true }`
- **AND** `getRecipeById` SHALL NOT be called

#### Scenario: Page accepts valid ID and delegates to service

- **WHEN** `getStaticProps` is invoked with `context.params = { id: "42" }`
- **THEN** `getRecipeById("42")` SHALL be invoked
- **AND** its return value SHALL determine the page outcome (`props` on success, `notFound: true` on null)
