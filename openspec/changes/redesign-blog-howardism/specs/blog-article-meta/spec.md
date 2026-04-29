## ADDED Requirements

### Requirement: Article frontmatter requires `tag` and `readingTime`

Every article under `apps/blog/src/app/(blog)/articles/[slug]/(docs)/<slug>/page.mdx` SHALL export a `meta` object whose TypeScript type extends `ArticleMeta` and which MUST include a non-empty `tag: string` and a positive integer `readingTime: number`. The `ArticleMeta` interface in `apps/blog/src/app/(blog)/articles/service.ts` MUST treat both fields as required.

#### Scenario: Build fails when an article omits `tag`
- **WHEN** an article's `page.mdx` exports a `meta` object missing the `tag` field
- **AND** `bun run build` is executed
- **THEN** the build fails with a TypeScript error referencing the missing required field

#### Scenario: Build fails when an article omits `readingTime`
- **WHEN** an article's `page.mdx` exports a `meta` object missing the `readingTime` field
- **AND** `bun run build` is executed
- **THEN** the build fails with a TypeScript error referencing the missing required field

#### Scenario: `getArticles` returns each article's tag and readingTime
- **WHEN** `getArticles()` is invoked
- **THEN** every entity in the returned `entities` map exposes `meta.tag` (non-empty string) and `meta.readingTime` (positive integer)

### Requirement: Article frontmatter supports optional `dropCap`

The `ArticleMeta` interface MAY include an optional `dropCap?: boolean`. When `true`, the article detail page SHALL render the first paragraph with the drop-cap treatment. When falsy or absent, drop-cap is suppressed.

#### Scenario: dropCap omitted defaults to suppressed
- **WHEN** an article's `meta` does not include `dropCap`
- **THEN** the rendered article detail does not apply the `drop-cap` class

#### Scenario: dropCap explicit true enables treatment
- **WHEN** an article's `meta.dropCap === true`
- **THEN** the rendered article detail applies the `drop-cap` class to the first paragraph

### Requirement: Existing articles backfilled with required fields

All `page.mdx` files present in `apps/blog/src/app/(blog)/articles/[slug]/(docs)/<slug>/` at the time of this change SHALL be updated to include `tag` and `readingTime` in their exported `meta` object. `readingTime` MUST be derived from word count assuming 200 words per minute, rounded up to the nearest integer, and clamped to the inclusive range [1, 30] minutes. `tag` MUST be drawn from a small canonical allowlist (e.g., `Programming`, `Engineering`, `Architecture`, `Fundamentals`, `Personal`, `Ocean`, `Notes`).

#### Scenario: Reading time computed from word count
- **WHEN** an article's prose is 1,200 words
- **THEN** the backfilled `readingTime` value is `6` (1200 / 200, rounded up)

#### Scenario: Reading time clamped at floor
- **WHEN** an article's prose is 50 words
- **THEN** the backfilled `readingTime` value is `1` (clamped up from 0.25)

#### Scenario: Reading time clamped at ceiling
- **WHEN** an article's prose is 8,000 words
- **THEN** the backfilled `readingTime` value is `30` (clamped down from 40)

#### Scenario: Tag from canonical allowlist
- **WHEN** all backfilled articles are inspected
- **THEN** every `meta.tag` value matches one entry in the canonical allowlist `["Programming", "Engineering", "Architecture", "Fundamentals", "Personal", "Ocean", "Notes"]`

#### Scenario: Backfill commits land before consumer code
- **WHEN** the backfill commit is reverted but consumer code (Articles index using `meta.tag`) is not
- **THEN** the build SHALL fail (this guarantees the commits land in the correct order)
