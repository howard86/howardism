## Context

The howardism monorepo currently uses five overlapping tools for build orchestration: pnpm (package manager), Lerna (task runner + publishing), Nx (caching), Turborepo (partially configured), ESLint + Prettier (linting/formatting). This creates maintenance friction — config duplication between Nx and Turborepo, Lerna delegating to Nx, and a heavy ESLint plugin chain.

The migration consolidates to three tools with clear responsibilities: Bun (package manager + runtime), Turborepo (task runner + caching), Ultracite/Biome (linting + formatting). Changesets handles the publishing concern previously owned by Lerna.

## Goals / Non-Goals

**Goals:**
- Single package manager (Bun) replacing pnpm
- Single task runner (Turborepo) replacing Lerna + Nx
- Single linter/formatter (Ultracite/Biome) replacing ESLint + Prettier
- Maintain npm publishing capability via Changesets
- Keep gitmoji commit convention (Husky + commitlint)

**Non-Goals:**
- Migrating Next.js versions or app code
- Changing the monorepo structure (apps/packages layout stays)
- Replicating every ESLint rule — accept Biome's coverage as-is
- Matching old Prettier formatting — adopt Ultracite defaults

## Decisions

### 1. Bun as full runtime with Node fallback for Next.js

**Choice**: Use Bun as the default runtime everywhere. Fall back to Node.js only for Next.js apps if compatibility issues arise during implementation.

**Why**: Bun's runtime is significantly faster for scripts and tests. Next.js 14 doesn't officially support Bun runtime, so pragmatism requires a fallback path.

**Alternative considered**: Bun as package manager only (Node runtime everywhere). Rejected — loses the performance benefits that motivate the migration.

### 2. Turborepo over Nx for task orchestration

**Choice**: Use Turborepo as sole task runner, removing Nx entirely.

**Why**: Turborepo is already partially configured (`turbo.json` exists). It's simpler, has zero config for caching, and doesn't require the `nx-set-shas` CI step. The repo is small enough that Nx's `affected` command provides negligible benefit over Turborepo's cache-based skipping.

**Alternative considered**: Keep Nx alongside Turborepo. Rejected — defeats the consolidation goal.

### 3. Changesets for versioning/publishing

**Choice**: Replace Lerna's publish workflow with Changesets + `@changesets/changelog-github`.

**Why**: Changesets is the standard companion for Turborepo-based monorepos. PR-based workflow gives more control over when versions bump. GitHub changelog integration provides better release notes than Lerna's gitmoji preset.

**Alternative considered**: Keep Lerna solely for publishing. Rejected — adds a dependency just for one command.

### 4. Ultracite presets without customization

**Choice**: Use `ultracite/biome/core`, `ultracite/biome/react`, `ultracite/biome/next` presets as-is. No custom overrides for formatter settings.

**Why**: Minimizes config surface. The old Prettier settings (100-char width, no semicolons) were arbitrary preferences. Adopting Ultracite's opinions wholesale keeps the config to 5 lines.

**Alternative considered**: Override Biome formatter to match old Prettier settings. Rejected — fights the tool and adds config that needs maintenance.

### 5. Three sequential PRs

**Choice**: Implement in three independent, sequential PRs: Bun workspace → Turborepo + Changesets → Ultracite.

**Why**: Each PR is independently reviewable and revertable. Bun must come first (foundation), then Turborepo (removes Lerna/Nx), then Ultracite (independent of the other two but benefits from Turborepo scripts being finalized).

**Alternative considered**: Big-bang single PR. Rejected — too large to review, impossible to revert partially.

## Risks / Trade-offs

- **Bun compatibility with postinstall scripts** → Run `bun install` early and fix any failures before proceeding
- **Next.js + Bun runtime issues** → Fallback to Node for Next.js builds/dev; Bun still used as package manager
- **Loss of Nx affected command** → Turborepo caching provides equivalent efficiency for this repo size
- **Loss of ESLint plugin coverage** (testing-library, jest, Next.js rules) → Accept; these catch low-severity issues. Next.js still warns in `next dev`/`next build`
- **Large formatting diff from Biome** → Single reformat commit with `.git-blame-ignore-revs` to preserve `git blame` history
- **Changesets workflow differs from Lerna** → Team must learn to run `changeset` before merging version-bumping PRs; CI automates the rest
