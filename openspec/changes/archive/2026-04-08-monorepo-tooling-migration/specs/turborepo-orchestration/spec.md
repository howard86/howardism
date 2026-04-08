## ADDED Requirements

### Requirement: Turborepo as sole task runner
The system SHALL use Turborepo as the only task runner, with all tasks defined in `turbo.json`. Lerna and Nx SHALL be removed entirely.

#### Scenario: Task execution
- **WHEN** a developer runs `turbo run build`
- **THEN** Turborepo executes the build task across all packages respecting dependency order

#### Scenario: Lerna and Nx removed
- **WHEN** a developer inspects the repo
- **THEN** `lerna.json`, `nx.json`, and the `lerna`/`nx` dependencies are absent

### Requirement: Task caching
Turborepo SHALL cache the outputs of `build`, `lint`, `type-check`, and `test` tasks. Cached tasks SHALL be skipped on subsequent runs when inputs are unchanged.

#### Scenario: Cache hit
- **WHEN** a developer runs `turbo run build` twice without changing source files
- **THEN** the second run completes near-instantly with cache hits for all packages

### Requirement: turbo.json task definitions
The `turbo.json` SHALL define tasks for `build`, `lint`, `type-check`, `test`, `clean`, and `dev`. The `build` task SHALL depend on `^build` and capture `.next/**` and `dist/**` outputs.

#### Scenario: Build dependency chain
- **WHEN** `turbo run build` executes
- **THEN** packages are built in topological order (dependencies before dependents)

### Requirement: Root package.json scripts use Turborepo
All root-level task scripts (`build`, `lint`, `test`, `type-check`, `clean`) SHALL invoke `turbo run <task>` instead of `lerna run <task>`.

#### Scenario: Root script execution
- **WHEN** a developer runs `bun run build` at the repo root
- **THEN** it delegates to `turbo run build`

### Requirement: CI uses Turborepo
The CI test workflow SHALL run lint, type-check, and test tasks via `turbo run` instead of `nx affected`.

#### Scenario: CI task execution
- **WHEN** the `test.yml` workflow runs
- **THEN** it executes `bunx turbo run lint`, `bunx turbo run type-check`, and `bunx turbo run test`
