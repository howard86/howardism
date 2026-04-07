## 1. Bun Workspace Migration

- [ ] 1.1 Delete `pnpm-workspace.yaml` and `pnpm-lock.yaml`
- [ ] 1.2 Update root `package.json`: remove `packageManager` field, add `"workspaces": ["apps/*", "packages/*"]`
- [ ] 1.3 Run `bun install` and resolve any postinstall or dependency issues
- [ ] 1.4 Update root `package.json` scripts to use `bun run` instead of `pnpm run`
- [ ] 1.5 Verify `bun run build`, `bun run lint`, `bun run test`, `bun run type-check` all pass locally
- [ ] 1.6 Test Next.js apps under Bun runtime; configure Node fallback if needed
- [ ] 1.7 Update `test.yml`: replace `pnpm/action-setup` with `oven-sh/setup-bun`, remove Node matrix, use `bun install`
- [ ] 1.8 Update `version.yml`: replace pnpm setup with Bun setup
- [ ] 1.9 Commit and push Phase 1 PR

## 2. Turborepo + Changesets

- [ ] 2.1 Remove `lerna.json`, `nx.json` files
- [ ] 2.2 Remove `lerna`, `nx`, `conventional-changelog-gitmoji-config` from root `package.json` devDependencies
- [ ] 2.3 Update `turbo.json` with complete task definitions (build, lint, type-check, test, clean, dev)
- [ ] 2.4 Update root `package.json` scripts: replace `lerna run X` with `turbo run X`
- [ ] 2.5 Install `@changesets/cli` and `@changesets/changelog-github`
- [ ] 2.6 Create `.changeset/config.json` with public access, master base branch, GitHub changelog
- [ ] 2.7 Replace `version.yml` workflow with Changesets-based publish workflow
- [ ] 2.8 Update `test.yml`: remove `nrwl/nx-set-shas` step, use `bunx turbo run` for lint/type-check/test
- [ ] 2.9 Verify `turbo run build`, `turbo run lint`, `turbo run test`, `turbo run type-check` pass locally
- [ ] 2.10 Verify Turborepo caching works (second run hits cache)
- [ ] 2.11 Commit and push Phase 2 PR

## 3. Ultracite (ESLint + Prettier replacement)

- [ ] 3.1 Install `ultracite` as root dev dependency
- [ ] 3.2 Create `biome.json` extending `ultracite/biome/core`, `ultracite/biome/react`, `ultracite/biome/next`
- [ ] 3.3 Delete `packages/eslint-config-howardism/` directory entirely
- [ ] 3.4 Delete root `.eslintrc.js` and any per-app ESLint configs
- [ ] 3.5 Delete all `.prettierrc*` and `prettier.config.*` files
- [ ] 3.6 Remove ESLint/Prettier dependencies from root `package.json`: `eslint`, `eslint-config-howardism`, `prettier`, `prettier-plugin-tailwindcss`, `lint-staged`
- [ ] 3.7 Update per-app/package `lint` scripts to `biome check .`
- [ ] 3.8 Update root `format` script to `biome check --write .`
- [ ] 3.9 Update Husky pre-commit hook: replace lint-staged with `biome check --staged --write`
- [ ] 3.10 Run `biome check --write .` to reformat entire codebase
- [ ] 3.11 Add reformat commit SHA to `.git-blame-ignore-revs`
- [ ] 3.12 Verify `turbo run lint` passes across all packages
- [ ] 3.13 Commit and push Phase 3 PR
