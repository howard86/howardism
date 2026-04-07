## ADDED Requirements

### Requirement: Ultracite as sole linter and formatter
The system SHALL use Ultracite (Biome-based) for all linting and formatting. ESLint, Prettier, and all associated plugins and configs SHALL be removed.

#### Scenario: ESLint/Prettier removed
- **WHEN** a developer inspects the repo
- **THEN** no `.eslintrc*`, `eslint.config.*`, `.prettierrc*`, or `prettier.config.*` files exist, and `eslint`/`prettier` are not in any `package.json`

#### Scenario: eslint-config-howardism package deleted
- **WHEN** a developer lists packages
- **THEN** `packages/eslint-config-howardism/` does not exist

### Requirement: Biome configuration uses Ultracite presets
The repo root SHALL contain a `biome.json` extending `ultracite/biome/core`, `ultracite/biome/react`, and `ultracite/biome/next`. No custom formatter overrides SHALL be added.

#### Scenario: Config structure
- **WHEN** Biome reads `biome.json`
- **THEN** it loads the three Ultracite presets with no overrides

### Requirement: Lint scripts use Biome
All package-level `lint` scripts SHALL run `biome check .`. The root `format` script SHALL run `biome check --write .`.

#### Scenario: Package lint
- **WHEN** a developer runs `bun run lint` in an app directory
- **THEN** `biome check .` executes and reports any issues

#### Scenario: Root format
- **WHEN** a developer runs `bun run format` at the repo root
- **THEN** `biome check --write .` formats all files

### Requirement: Pre-commit hook uses Biome
The Husky pre-commit hook SHALL run `biome check --staged --write` instead of lint-staged. The `lint-staged` dependency SHALL be removed.

#### Scenario: Pre-commit formatting
- **WHEN** a developer commits staged files
- **THEN** Biome checks and auto-fixes the staged files before the commit proceeds

### Requirement: Codebase reformatted with blame ignore
The entire codebase SHALL be reformatted by Biome in a single commit. That commit's SHA SHALL be added to `.git-blame-ignore-revs`.

#### Scenario: Git blame skips reformat
- **WHEN** a developer runs `git blame` on any file
- **THEN** the reformat commit is skipped (assuming `blame.ignoreRevsFile` is configured)
