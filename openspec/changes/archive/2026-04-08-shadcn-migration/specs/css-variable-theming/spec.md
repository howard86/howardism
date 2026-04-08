## ADDED Requirements

### Requirement: CSS variable theme system
A CSS variable-based theming system replaces both DaisyUI's `data-theme` and Chakra's `extendTheme()`.

#### Scenario: Theme tokens defined
- **WHEN** `packages/ui/src/styles/globals.css` is inspected
- **THEN** CSS variables are defined for `--primary`, `--secondary`, `--background`, `--foreground`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, and `--card` (plus their foreground variants)

### Requirement: Japanese color palette preserved
The blog's custom `jp` theme colors are faithfully mapped to CSS variables.

#### Scenario: Color accuracy
- **WHEN** the blog renders with the default theme
- **THEN** the primary, secondary, and accent colors match the existing DaisyUI `jp` theme HSL values

### Requirement: Dark mode support
Dark mode is supported via class-based strategy.

#### Scenario: Dark mode toggle
- **WHEN** the `dark` class is applied to `<html>`
- **THEN** all CSS variables switch to their dark mode values

#### Scenario: No DaisyUI data-theme
- **WHEN** the codebase is searched for `data-theme`
- **THEN** no usage is found (replaced by class-based dark mode)

### Requirement: All apps share theme
All apps consuming `packages/ui` inherit the same theme tokens.

#### Scenario: Consistent theming
- **WHEN** a shadcn component is rendered in blog, recipe, or github-search
- **THEN** it uses the same CSS variable values from `globals.css`
