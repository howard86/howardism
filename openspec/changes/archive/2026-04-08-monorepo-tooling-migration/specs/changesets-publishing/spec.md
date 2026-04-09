## ADDED Requirements

### Requirement: Changesets for version management
The system SHALL use `@changesets/cli` for versioning and `@changesets/changelog-github` for changelog generation. Lerna's publish workflow SHALL be replaced entirely.

#### Scenario: Changeset creation
- **WHEN** a developer runs `changeset` in the repo root
- **THEN** an interactive prompt guides them to select packages and semver bump type, creating a changeset file in `.changeset/`

### Requirement: Changeset configuration
A `.changeset/config.json` SHALL exist with `access: "public"`, `baseBranch: "master"`, and `@changesets/changelog-github` as the changelog generator with repo `"howard86/howardism"`.

#### Scenario: Config validation
- **WHEN** Changesets reads `.changeset/config.json`
- **THEN** it uses the GitHub changelog format and targets master as the base branch

### Requirement: CI publish workflow
The `version.yml` workflow SHALL use the `changesets/action` GitHub Action to automate version bumps and npm publishing on push to master.

#### Scenario: Automated version bump
- **WHEN** a PR with changeset files is merged to master
- **THEN** the CI workflow creates a version bump PR or publishes to npm

#### Scenario: No changeset present
- **WHEN** a PR without changeset files is merged to master
- **THEN** no version bump occurs
