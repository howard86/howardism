## ADDED Requirements

### Requirement: Howardism token stack coexists with existing Nippon HSL tokens

The system SHALL declare Howardism oklch design tokens (`--bg`, `--bg-2`, `--paper`, `--ink`, `--ink-2`, `--ink-3`, `--rule`, `--rule-2`, `--accent`, `--accent-2`, `--accent-soft`, `--shadow`, `--shadow-sm`, `--font-display`, `--font-body`, `--font-mono`, `--radius`, `--radius-lg`) on `:root`, layered alongside the existing Nippon HSL tokens (`--background`, `--primary`, `--border`, etc.). The Nippon tokens MUST remain unchanged so existing `@howardism/ui` consumers (Sheet, Button, Sidebar, Form, etc.) continue rendering as before.

#### Scenario: shadcn primitive renders unchanged after Howardism tokens are added
- **WHEN** a `Sheet` from `@howardism/ui` is rendered after `howardism.css` is imported
- **THEN** its background, border, and foreground colors match the values defined by the existing `--background`, `--border`, and `--foreground` HSL tokens (no visual regression in `@howardism/ui` primitives)

#### Scenario: Howardism component consumes oklch tokens
- **WHEN** a `<SunDisc/>` is rendered with the default theme
- **THEN** its accent gradient SHALL derive from `var(--accent)` resolved from the Howardism token stack, not from any HSL token

### Requirement: Five accent themes selectable via `[data-theme]` attribute

The system SHALL ship five named accent themes (`terracotta`, `moss`, `ink-blue`, `plum`, `ochre`), each overriding `--accent`, `--accent-2`, and `--accent-soft` for both light and dark modes via `html[data-theme="<name>"]` and `html.dark[data-theme="<name>"]` selectors. The default theme is `terracotta`.

#### Scenario: Theme attribute changes accent color
- **WHEN** `document.documentElement.dataset.theme` is set to `"moss"`
- **THEN** the computed value of `var(--accent)` on any descendant element matches `oklch(0.52 0.1 145)` in light mode

#### Scenario: Ochre accent boosted for body-text contrast
- **WHEN** the active theme is `ochre`
- **THEN** the computed value of `var(--accent)` SHALL satisfy WCAG AA contrast against `var(--paper)` for 16px+ body text in both light and dark modes

### Requirement: Light/dark mode toggled via `.dark` class on `<html>`

The system SHALL provide light and dark variants of all base tokens. Dark variants are activated by adding a `dark` class to `<html>`. The default mode is `light`.

#### Scenario: Toggling dark class swaps token values
- **WHEN** `document.documentElement.classList.toggle("dark", true)` is called
- **THEN** the computed value of `var(--bg)` becomes the dark base value `oklch(0.18 0.015 260)` (or its current declared value), and `var(--ink)` becomes the light text value `oklch(0.94 0.01 80)` (or its current declared value)

### Requirement: Web fonts loaded via `next/font/google`

The system SHALL load Fraunces (display, weights 300–600 w/ italic), Newsreader (body, weights 300–700 w/ italic), and JetBrains Mono (mono, weights 400/500/600) via `next/font/google` in `apps/blog/src/app/(blog)/layout.tsx` (or equivalent layout-scope file). The font family CSS variables MUST be exposed as `--font-display`, `--font-body`, `--font-mono` and consumed by Howardism components.

#### Scenario: Display font applies via token
- **WHEN** an element has `font-family: var(--font-display)`
- **THEN** its rendered font matches the loaded Fraunces face (with the configured optical-sizing axis enabled)

#### Scenario: No external `<link>` tags for fonts
- **WHEN** the rendered HTML head is inspected
- **THEN** no `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` is present (fonts ship via `next/font/google` self-hosting)

### Requirement: Paper grain texture on the document body

The system SHALL render a subtle 2-octave fractalNoise SVG grain at ≤6% opacity over the body background, applied once globally (e.g., via `body::before`), without per-section reapplication. The grain MUST flip color matrix between light (warm) and dark (cool) modes.

#### Scenario: Grain applies once, not per surface
- **WHEN** the page is rendered with multiple `<DiscPageHeader/>` instances
- **THEN** the grain layer appears once at the body level; descendant surfaces do not re-stack it

#### Scenario: Grain inverts in dark mode
- **WHEN** the active mode is `dark`
- **THEN** the grain noise color matrix uses bright values (`fill = white`) instead of warm browns

### Requirement: Howardism primitives library

The system SHALL provide reusable Howardism primitives under `apps/blog/src/components/howardism/`:

| Primitive          | Purpose                                                              |
|--------------------|----------------------------------------------------------------------|
| `<SunDisc/>`       | Full radial-gradient orb with grain overlay, plate label, plate №   |
| `<HalfDisc/>`      | Half-circle bleed variant for downgraded use                        |
| `<DataGrid/>`      | Mono-label → serif-value 2-column grid                              |
| `<DiscPageHeader/>`| Composed page header: double-rule masthead + title + DataGrid + SunDisc |
| `<Eyebrow/>`       | Mono uppercase eyebrow label                                        |
| `<Squiggle/>`      | SVG squiggle rule for in-prose section breaks                       |
| `<Ph/>`            | Striped placeholder image with metadata strip                       |
| `<Chip/>`          | Pill-shaped status chip with optional dot                           |
| `<PhotoCard/>`     | Photo card with optional tape strip and caption                     |

Each primitive MUST be a TypeScript-typed React component, accept a `className` for style extension, and consume only Howardism tokens (no HSL Nippon tokens).

#### Scenario: SunDisc renders with default props
- **WHEN** `<SunDisc/>` is rendered with no props
- **THEN** it produces a circular element with the terracotta gradient, a grain overlay, plate label `Plate I · Surface`, and number `01`

#### Scenario: DataGrid composes label-value pairs
- **WHEN** `<DataGrid rows={[["Pieces", "5"], ["Pace", "Monthly"]]}/>` is rendered
- **THEN** the output is a 2-column CSS grid with each row's first cell uppercase mono and second cell serif

#### Scenario: HalfDisc supports left/right alignment
- **WHEN** `<HalfDisc align="right"/>` is rendered
- **THEN** the half-circle bleeds off the right edge with the gradient anchored to the top edge

### Requirement: Tweaks panel infrastructure

The system SHALL provide a `<TweaksProvider/>` React context that exposes and persists the user's `theme`, `mode`, and `homeLayout` preferences in a single localStorage key (`howardism:tweaks`). The Tweaks panel UI (`<TweaksPanel/>`) MUST be reachable via a floating launcher button (`<TweaksLauncher/>`) in the bottom-right corner and via a global `T` keyboard shortcut (suppressed when focus is in `input` or `textarea`).

#### Scenario: Selecting a theme persists across reload
- **WHEN** the user selects the `moss` swatch in the Tweaks panel
- **AND** the page is reloaded
- **THEN** the `<html>` element has `data-theme="moss"` set before the first paint

#### Scenario: `T` key opens panel
- **WHEN** the user presses the `T` key while focus is on the document body
- **THEN** the Tweaks panel becomes visible

#### Scenario: `T` key suppressed in input fields
- **WHEN** the user presses `T` while focus is inside an `<input/>` or `<textarea/>`
- **THEN** the Tweaks panel does NOT toggle

#### Scenario: Mode toggle in panel applies dark class
- **WHEN** the user selects the `Dark` mode option
- **THEN** `document.documentElement.classList` contains `dark` and the choice persists to localStorage

#### Scenario: Defaults applied on first visit
- **WHEN** a user with no `howardism:tweaks` key in localStorage visits the site
- **THEN** the active theme is `terracotta`, mode is `light`, and home layout is `disc`

### Requirement: No-FOUC theme/mode application before paint

The system SHALL inject an inline `<script>` in the document `<head>` (via `<InitTweaksScript/>`) that synchronously reads `localStorage["howardism:tweaks"]` and sets `document.documentElement.dataset.theme` and `document.documentElement.classList.toggle("dark", …)` before React hydrates. The script MUST tolerate missing or malformed JSON without throwing.

#### Scenario: Stored dark theme applied before paint
- **WHEN** localStorage contains `{"theme":"plum","mode":"dark","homeLayout":"disc"}`
- **AND** the page is reloaded
- **THEN** `document.documentElement.dataset.theme` equals `"plum"` and `document.documentElement.classList.contains("dark")` is true *before* the first React render

#### Scenario: Malformed storage value is ignored
- **WHEN** localStorage contains `"not-json"` for `howardism:tweaks`
- **THEN** the inline script does not throw, no theme attribute is set, and the page renders with defaults

#### Scenario: Missing storage value falls back to defaults
- **WHEN** localStorage has no `howardism:tweaks` key
- **THEN** no `data-theme` attribute is set on `<html>` and no `dark` class is added
