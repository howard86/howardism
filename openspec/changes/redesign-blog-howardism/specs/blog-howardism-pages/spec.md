## ADDED Requirements

### Requirement: Home renders one of four selectable layouts

The home route (`/`) SHALL render one of four hero layouts (`classic | statement | disc | index`) selected by the Tweaks `homeLayout` value. The default layout is `disc`. Server-rendered HTML uses the default; the client may swap layouts after hydration based on the stored preference.

#### Scenario: Default layout is disc
- **WHEN** a user with no stored Tweaks visits `/`
- **THEN** the rendered hero is `<HeroDisc/>` (single line + full SunDisc on the right + DataGrid metadata)

#### Scenario: Layout swap on Tweak change
- **WHEN** the user selects `statement` in the Tweaks panel home-layout segmented control
- **THEN** the home hero re-renders as `<HeroStatement/>` (three giant stacked words, no body paragraph) without a full page reload

#### Scenario: Index layout shows newspaper-style masthead
- **WHEN** the active layout is `index`
- **THEN** the hero renders a double-rule masthead, "In this issue" with up to four numbered article titles, and a Masthead aside (Edited by / Set in / Printed)

### Requirement: Articles index has no SunDisc

The articles index route (`/articles`) SHALL render a double-rule masthead with volume + plate label, an inline tag filter ("Filed under X · Y · Z" rendered as italic-on-active links), and a numbered list of articles where each row uses oversized terracotta numerals as the visual anchor. The page MUST NOT render a `<SunDisc/>` or `<HalfDisc/>`.

#### Scenario: No disc primitive is rendered
- **WHEN** `/articles` is rendered
- **THEN** no element with class or role corresponding to `SunDisc` or `HalfDisc` is in the document

#### Scenario: Numbered list rendering
- **WHEN** `/articles` lists 3 articles
- **THEN** each list item shows a 52px+ terracotta numeral (`01`, `02`, `03`), a Fraunces title, the article date, and the tag

#### Scenario: Tag filter narrows list
- **WHEN** the user clicks the `Programming` tag in the inline filter
- **THEN** only articles with `meta.tag === "Programming"` are visible, the active filter is rendered italic + accent-colored, and the article count in the right corner updates

### Requirement: Article detail uses HalfDisc and DataGrid masthead

The article detail route (`/articles/[slug]`) SHALL render a mini-masthead with `Plate II · Piece № NN`, a `<HalfDisc/>` corner bleed (NOT a full `<SunDisc/>`), and a `<DataGrid/>` listing Published / Filed / Reading / Author. Drop-cap on the first paragraph is opt-in via `meta.dropCap === true`. Prev/next links MUST be real `<Link>` anchors, not `onClick` divs.

#### Scenario: Mini-masthead carries piece number
- **WHEN** `/articles/<slug>` is rendered for an article at index 2 of 5 (descending date)
- **THEN** the masthead displays `Plate II · Piece № 03`

#### Scenario: Drop-cap renders only when opted in
- **WHEN** the article's `meta.dropCap === true`
- **THEN** the first paragraph has the `drop-cap` class and the first letter is rendered Fraunces 4.2em accent-colored

#### Scenario: Drop-cap suppressed by default
- **WHEN** the article's `meta.dropCap` is falsy or undefined
- **THEN** no `drop-cap` class is applied to any paragraph

#### Scenario: Prev/next links are real anchors
- **WHEN** the article detail renders prev/next navigation
- **THEN** each is an `<a href>` (or Next.js `<Link href>`) reachable by keyboard, with right-click "open in new tab" working

### Requirement: New `/photos` route with full SunDisc landing

The system SHALL serve a new route `/photos` that renders a `<DiscPageHeader/>` (full SunDisc) with `Plate III · Field notes, mostly blurry.` and a contact-sheet grid of placeholder photos sourced from a typed `photoData.ts`. Each photo card MUST display a `№ NNN` overlay, a metadata strip ("f-stop · shutter · depth · location"), and use varied tones and aspect ratios.

#### Scenario: Photos page is reachable
- **WHEN** the user navigates to `/photos`
- **THEN** the page renders successfully with HTTP 200 and shows the disc header + contact sheet

#### Scenario: Contact-sheet cards vary
- **WHEN** the photos page renders 9 placeholder cards
- **THEN** the cards use at least 3 distinct tones and at least 3 distinct aspect ratios (1/1, 3/4, 4/3, etc.)

#### Scenario: End-of-roll mark
- **WHEN** the photo grid is fully rendered
- **THEN** an `End of roll` rule with horizontal hairlines appears below the last card

### Requirement: New `/about` route without SunDisc

The system SHALL serve a new route `/about` that renders a quiet plate (no `<SunDisc/>`, no `<HalfDisc/>`) with `Plate IV · Howard Tai, in long form.`, long-form prose, and a sidebar containing Now reading / Where I've been / Colophon ruled lists. The Where I've been list MUST source from the existing `Resume.tsx` data shape.

#### Scenario: About page renders without disc
- **WHEN** `/about` is rendered
- **THEN** no `<SunDisc/>` or `<HalfDisc/>` is in the document, but the masthead row still shows `Plate IV` plate label and number

#### Scenario: Sidebar lists use ruled rows, not card chrome
- **WHEN** the About sidebar renders Now reading / Where I've been / Colophon
- **THEN** each list item uses a 1px hairline divider between rows, no card border or background

### Requirement: Header and Footer adopt Howardism vocabulary

The header SHALL render an Avatar (warm initial disc, no portrait), Fraunces wordmark "Howardism" with a JetBrains Mono volume subtitle (e.g., `vol. 03 · quiet corner of the web`), and a 4-item nav-pill (Home / Articles / Photos / About) with backdrop blur. The previous moon/sun `ModeToggle` button MUST be removed from the Header. The footer SHALL render an Avatar + © + location, a Tools link (preserving `/tools` discoverability), an RSS link, and a Colophon link, all in the Howardism vocabulary.

#### Scenario: Mode toggle removed from header
- **WHEN** the rendered header is inspected
- **THEN** no moon or sun icon is present in the Header (mode lives only in the Tweaks panel)

#### Scenario: Nav pill is exactly 4 items
- **WHEN** the rendered header nav-pill is inspected
- **THEN** it contains exactly Home, Articles, Photos, About (in that order); no `Tools` link and no `App` link

#### Scenario: Footer exposes Tools
- **WHEN** the rendered footer is inspected
- **THEN** a link to `/tools` is present (preserving discoverability after removal from primary nav)

### Requirement: Skip-to-content anchor

The system SHALL render a `Skip to content` anchor at the top of the document that becomes visible on focus and jumps to the `<main>` element.

#### Scenario: Skip anchor focusable and visible on tab
- **WHEN** the user presses Tab from a fresh page load
- **THEN** the first focused element is a `Skip to content` anchor visible above the Header
- **AND** activating it moves focus to `<main>` and scrolls accordingly

### Requirement: Clickable rows are real links, not onClick wrappers

All clickable article-row, photo-card, and feature-card elements SHALL be wrapped in `<Link>` (or `<a href>`) anchors. `<article onClick>` and `<li onClick>` patterns MUST be removed. Each clickable row MUST have a visible focus ring on `:focus-visible`.

#### Scenario: Articles index row is keyboard-reachable
- **WHEN** the user tabs through `/articles`
- **THEN** each list item receives focus in DOM order with a visible 2px accent-colored ring

#### Scenario: Right-click "open in new tab" works on home cards
- **WHEN** the user right-clicks a featured article on `/`
- **THEN** the browser context menu offers "Open Link in New Tab" pointing to `/articles/<slug>`

### Requirement: Reduced-motion respect

The system SHALL gate page-enter animation, photo-card hover rotation, and any other non-essential motion behind `@media (prefers-reduced-motion: no-preference)`. Static visuals (colors, layout, type) remain unchanged under reduced-motion.

#### Scenario: Reduced-motion disables page-enter
- **WHEN** the user has `prefers-reduced-motion: reduce` set
- **AND** they navigate from `/` to `/articles`
- **THEN** the destination page renders without the 4px upward fade animation
