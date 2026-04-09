## Why

The monorepo uses a fragmented tooling stack (pnpm + Lerna + Nx + Turborepo + ESLint + Prettier) with overlapping responsibilities and mounting maintenance burden. Consolidating to Bun + Turborepo + Ultracite reduces the dependency surface, simplifies CI, and modernizes the developer experience.

## What Changes

- **BREAKING**: Replace pnpm with Bun as the package manager, workspace resolver, and default runtime
- **BREAKING**: Remove Lerna and Nx; Turborepo becomes the sole task runner and build orchestrator
- **BREAKING**: Replace ESLint + Prettier with Ultracite (Biome-based); codebase reformatted to Ultracite's style
- Add Changesets for versioning and npm publishing (replacing Lerna publish)
- Replace lint-staged with `biome check --staged --write` in the Husky pre-commit hook
- Update both CI workflows (`test.yml`, `version.yml`) for new tooling
- Delete `eslint-config-howardism` package (no longer needed)

## Capabilities

### New Capabilities

- `bun-workspace`: Bun as package manager, workspace resolver, and runtime across the monorepo
- `turborepo-orchestration`: Turborepo as the sole task runner with caching, replacing Lerna + Nx
- `changesets-publishing`: Changesets-based versioning and npm publishing workflow
- `ultracite-linting`: Ultracite/Biome for linting and formatting, replacing ESLint + Prettier

### Modified Capabilities

(No existing specs to modify)

## Impact

- **Root config files**: `package.json`, `turbo.json` updated; `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `lerna.json`, `nx.json`, `.eslintrc.js` deleted
- **Dependencies**: `lerna`, `nx`, `eslint`, `prettier`, `lint-staged` and all ESLint plugins removed; `ultracite`, `@changesets/cli` added
- **Packages**: `eslint-config-howardism` package deleted entirely
- **CI**: Both GitHub Actions workflows rewritten for Bun + Turborepo + Changesets
- **All source files**: Reformatted by Biome (cosmetic changes only)
- **Git history**: Reformat commit added to `.git-blame-ignore-revs`
