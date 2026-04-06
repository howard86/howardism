## ADDED Requirements

### Requirement: Bun as package manager
The system SHALL use Bun as the sole package manager, replacing pnpm. `bun install` SHALL resolve all workspace dependencies and produce a `bun.lock` file.

#### Scenario: Clean install
- **WHEN** a developer runs `bun install` in the repo root
- **THEN** all workspace dependencies are installed and `bun.lock` is created

#### Scenario: Workspace protocol support
- **WHEN** a package declares `"dependency": "workspace:*"`
- **THEN** Bun resolves it to the local workspace package

### Requirement: Workspace configuration in package.json
The system SHALL define workspaces in the root `package.json` `workspaces` field with `["apps/*", "packages/*"]`. The `pnpm-workspace.yaml` file SHALL be deleted.

#### Scenario: Workspace discovery
- **WHEN** Bun reads the root `package.json`
- **THEN** it discovers all packages under `apps/` and `packages/`

### Requirement: pnpm artifacts removed
The system SHALL NOT contain `pnpm-lock.yaml`, `pnpm-workspace.yaml`, or the `packageManager` field referencing pnpm.

#### Scenario: No pnpm remnants
- **WHEN** a developer searches the repo for pnpm references
- **THEN** no pnpm-specific config files or `packageManager` field exist

### Requirement: Bun runtime as default
The system SHALL use the Bun runtime for scripts and tests. If a Next.js app encounters Bun compatibility issues, it SHALL fall back to Node.js for `next dev` and `next build`.

#### Scenario: Scripts run under Bun
- **WHEN** a developer runs `bun run test` or `bun run build` for a non-Next.js package
- **THEN** the script executes under the Bun runtime

#### Scenario: Next.js Node fallback
- **WHEN** a Next.js app fails under Bun runtime
- **THEN** the app is configured to run under Node.js instead

### Requirement: CI uses Bun
The CI workflow SHALL use `oven-sh/setup-bun` instead of `pnpm/action-setup`. The Node version matrix SHALL be removed in favor of a single Bun version.

#### Scenario: CI install step
- **WHEN** the `test.yml` workflow runs
- **THEN** it installs dependencies with `bun install` after setting up Bun via `oven-sh/setup-bun`
