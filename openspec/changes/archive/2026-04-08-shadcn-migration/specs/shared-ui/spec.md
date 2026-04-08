## ADDED Requirements

### Requirement: Shared UI package exists
A `packages/ui` workspace package provides shadcn/ui components to all apps via `@howardism/ui` imports.

#### Scenario: Package structure
- **WHEN** a developer inspects `packages/ui`
- **THEN** it contains `src/components/`, `src/lib/utils.ts` (cn utility), `src/styles/globals.css`, `components.json`, and `package.json` with proper exports

#### Scenario: Component consumption
- **WHEN** an app imports `import { Button } from "@howardism/ui/components/button"`
- **THEN** the import resolves correctly and the component renders with Tailwind + Radix

#### Scenario: Adding new components
- **WHEN** `npx shadcn@latest add <component>` is run from an app directory
- **THEN** the component is installed into `packages/ui/src/components/`

### Requirement: Blog app uses shadcn components
All blog UI components previously from DaisyUI or Headless UI are replaced with shadcn equivalents.

#### Scenario: No DaisyUI imports remain
- **WHEN** the blog app is searched for DaisyUI class names (`btn`, `input`, `select`, `form-control`, `card`, `tab`, `swap`, `base-100`)
- **THEN** no matches are found

#### Scenario: No Headless UI imports remain
- **WHEN** the blog app is searched for `@headlessui/react` imports
- **THEN** no matches are found

### Requirement: Shared packages migrated
`packages/components/common` and `packages/components/login-form` use shadcn primitives instead of Chakra UI.

#### Scenario: No Chakra imports in shared packages
- **WHEN** shared packages are searched for `@chakra-ui` imports
- **THEN** no matches are found

### Requirement: Chakra apps migrated
Recipe and github-search apps use shadcn/ui + Tailwind instead of Chakra UI.

#### Scenario: No Chakra dependencies
- **WHEN** `package.json` of recipe and github-search is inspected
- **THEN** no `@chakra-ui/*` or `@emotion/*` dependencies exist

#### Scenario: Tailwind configured
- **WHEN** recipe and github-search apps are built
- **THEN** Tailwind CSS v4 processes their styles correctly

### Requirement: Tailwind CSS v4
All apps using Tailwind are on v4 with CSS-first configuration.

#### Scenario: No tailwind.config.js
- **WHEN** the monorepo is searched for `tailwind.config`
- **THEN** no config files are found (all config is CSS-first via `@import`)
