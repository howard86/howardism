## ADDED Requirements

### Requirement: Tailwind v4 CSS-first infrastructure
The github-search app SHALL use Tailwind v4 with CSS-first configuration, matching the pattern established by blog and recipe apps. The app SHALL import `tailwindcss` and `@howardism/ui` globals in its `src/styles/globals.css`. A `postcss.config.js` SHALL configure `@tailwindcss/postcss`.

#### Scenario: Tailwind CSS processes correctly
- **WHEN** the app builds with `bun run build`
- **THEN** Tailwind utility classes are processed and included in the output CSS

#### Scenario: Shared theme tokens available
- **WHEN** a component uses CSS variables from the shared Nippon Colors palette (e.g., `bg-primary`, `text-muted-foreground`)
- **THEN** the variables resolve correctly from `@howardism/ui` globals

### Requirement: No Chakra UI runtime provider
The app SHALL NOT require a ChakraProvider or ThemeProvider wrapper. The `_app.tsx` SHALL render `ApolloProvider → Layout → Page` without any styling provider.

#### Scenario: App renders without Chakra provider
- **WHEN** the app loads
- **THEN** all components render correctly using Tailwind classes without any CSS-in-JS provider

### Requirement: Layout uses Tailwind utility classes
The Layout component SHALL use `<div>` and `<nav>` elements with Tailwind classes instead of Chakra `Box`, `Flex`, and `Container`. Navigation SHALL use `bg-teal-600` (or equivalent theme color) and responsive padding via Tailwind breakpoint prefixes.

#### Scenario: Responsive navigation padding
- **WHEN** viewport is mobile-sized
- **THEN** navigation has compact padding (py-2)

#### Scenario: Desktop navigation padding
- **WHEN** viewport is desktop-sized
- **THEN** navigation has larger padding (py-4)

### Requirement: CSS page transition animation
The Layout component SHALL apply a CSS `@keyframes` fade-in animation to the main content area instead of framer-motion variants.

#### Scenario: Page content fades in
- **WHEN** a page renders
- **THEN** the main content area animates from opacity 0 to 1

### Requirement: User card grid uses CSS auto-fill
The home page SHALL display UserCard results in a CSS grid with `grid-template-columns: repeat(auto-fill, minmax(...))` instead of a fixed item count from `useBreakpointValue`.

#### Scenario: Grid adapts to viewport width
- **WHEN** the viewport width changes
- **THEN** the grid automatically adjusts the number of columns without JS

#### Scenario: Cards display at reasonable density
- **WHEN** viewed at common viewport widths (360px, 768px, 1024px, 1440px)
- **THEN** cards are evenly distributed with consistent gap spacing

### Requirement: Search form uses shadcn components
The home page search form SHALL use `@howardism/ui` Button and Input components instead of Chakra equivalents. The Button SHALL support a loading state during Apollo query execution.

#### Scenario: Search with loading state
- **WHEN** user submits a search query
- **THEN** the Button displays a loading indicator while the GraphQL query executes

### Requirement: User profile page uses shadcn Tabs and Badge
The `[username].tsx` page SHALL use `@howardism/ui` Tabs for the repositories/starred/followers/following sections. Count indicators SHALL use `@howardism/ui` Badge instead of Chakra Tag.

#### Scenario: Tab navigation on profile page
- **WHEN** user views a GitHub profile
- **THEN** repositories, starred repos, followers, and following are displayed in tabbed panels

#### Scenario: Count badges visible on desktop
- **WHEN** viewport is desktop-sized (md+)
- **THEN** tab labels include Badge components showing counts

#### Scenario: Count badges hidden on mobile
- **WHEN** viewport is mobile-sized
- **THEN** count badges are hidden using Tailwind `hidden md:inline-flex`

### Requirement: Avatar rendered as native img
User avatars SHALL use a native `<img>` element with Tailwind classes (`rounded-full`, responsive sizing via breakpoint prefixes) instead of Chakra Avatar.

#### Scenario: Avatar displays on user card
- **WHEN** a UserCard renders
- **THEN** the user's avatar displays as a circular image with responsive sizing

#### Scenario: Avatar displays on profile page
- **WHEN** a user profile page renders
- **THEN** the avatar displays at 200px with `rounded-full`

### Requirement: Profile metadata uses native HTML and lucide-react
ProfileField and ProfileBadge components SHALL use native HTML elements with Tailwind classes and `lucide-react` icons instead of Chakra `Icon`, `Text`, `Flex`, and `Tooltip`.

#### Scenario: Profile field with tooltip
- **WHEN** a profile field renders (e.g., location, company)
- **THEN** it displays an icon + label + value using `<div>`, lucide-react icon, and `title` attribute for tooltip

#### Scenario: Profile badge with tooltip
- **WHEN** a boolean profile badge renders (e.g., hireable)
- **THEN** it displays a lucide-react icon with `title` attribute for tooltip

### Requirement: Info list uses native HTML
InfoList component SHALL use `<ul>`, `<li>`, and `<a>` elements with Tailwind classes instead of Chakra `List`, `ListItem`, `ListIcon`, and `Link`.

#### Scenario: External link in list
- **WHEN** a list item contains an external URL
- **THEN** it renders as `<a target="_blank" rel="noopener noreferrer">` with a lucide-react icon

### Requirement: Loading spinner uses CSS animation
The loading state on the profile page SHALL use a CSS spinner (`animate-spin` utility) instead of Chakra Spinner.

#### Scenario: Loading state on profile page
- **WHEN** profile data is loading (ISR fallback)
- **THEN** a CSS-animated spinner displays centered on the page

### Requirement: Theme package removed
The `packages/theme/` directory SHALL be deleted. No workspace package named `@howardism/theme` SHALL exist. The github-search `package.json` SHALL NOT list `@howardism/theme` as a dependency.

#### Scenario: Theme package does not exist
- **WHEN** inspecting the monorepo workspace packages
- **THEN** `@howardism/theme` is not listed and `packages/theme/` does not exist

### Requirement: Chakra and Emotion dependencies removed
The github-search `package.json` SHALL NOT contain `@chakra-ui/react`, `@chakra-ui/styled-system`, `@emotion/react`, `@emotion/styled`, `framer-motion`, or `react-icons` in dependencies or devDependencies.

#### Scenario: No Chakra imports in codebase
- **WHEN** searching the github-search source for imports from `@chakra-ui`, `@emotion`, or `framer-motion`
- **THEN** zero results are returned

### Requirement: Build and type-check pass
The github-search app SHALL pass `bun run build` and `bun run type-check` after migration.

#### Scenario: Successful build
- **WHEN** running `bun run build` from the monorepo root
- **THEN** all apps build successfully including github-search

#### Scenario: No type errors
- **WHEN** running `bun run type-check` on github-search
- **THEN** TypeScript reports zero errors
