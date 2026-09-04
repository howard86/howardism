---
name: Howardism
description: A bound volume of numbered plates — warm paper, ink, and one rationed red — for reading a connected knowledge base.
colors:
  paper: "oklch(0.965 0.012 82)"
  paper-recessed: "oklch(0.945 0.016 80)"
  plate: "oklch(0.985 0.008 85)"
  ink: "oklch(0.24 0.02 45)"
  ink-muted: "oklch(0.42 0.02 50)"
  ink-subtle: "oklch(0.53 0.015 55)"
  rule: "oklch(0.85 0.018 70)"
  rule-strong: "oklch(0.78 0.02 65)"
  hover-wash: "oklch(0.93 0.018 75)"
  plate-red: "oklch(0.55 0.155 35)"
  verdigris: "oklch(0.62 0.11 150)"
  correction-red: "oklch(0.58 0.21 27)"
  domain-agent-systems: "oklch(0.52 0.11 150)"
  domain-agent-security: "oklch(0.51 0.13 356)"
  domain-ai-coding-practice: "oklch(0.53 0.11 123)"
  domain-evals-and-benchmarks: "oklch(0.52 0.09 172)"
  domain-model-capability-and-training: "oklch(0.55 0.1 70)"
  domain-alignment-and-safety: "oklch(0.5 0.12 333)"
  domain-interpretability: "oklch(0.53 0.1 97)"
  domain-interaction-multimodal: "oklch(0.56 0.15 35)"
  domain-formal-math: "oklch(0.53 0.1 250)"
  domain-startup-founder: "oklch(0.55 0.13 55)"
  domain-product-org: "oklch(0.49 0.11 310)"
  domain-ai-economics-and-labor: "oklch(0.52 0.13 20)"
  domain-superintelligence-trajectory: "oklch(0.53 0.1 222)"
  domain-entities: "oklch(0.5 0.11 290)"
  domain-syntheses: "oklch(0.52 0.09 195)"
typography:
  display:
    fontFamily: "Fraunces, 'Times New Roman', serif"
    fontSize: "clamp(40px, 6vw, 72px)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Fraunces, 'Times New Roman', serif"
    fontSize: "27px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Fraunces, 'Times New Roman', serif"
    fontSize: "19px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.012em"
  numeral:
    fontFamily: "Fraunces, 'Times New Roman', serif"
    fontSize: "28px"
    fontWeight: 300
    lineHeight: 0.9
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  prose:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1.1875rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "10.5px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.22em"
  control:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  none: "0"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  full: "9999px"
spacing:
  gutter: "clamp(20px, 5vw, 72px)"
  row: "14px"
  row-compact: "10px"
  header-gap: "28px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, {colors.ink} 80%, transparent)"
    textColor: "{colors.paper}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    typography: "{typography.control}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.paper-recessed}"
    textColor: "{colors.ink}"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    size: "36px"
  badge-chip:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-chip-hover:
    textColor: "{colors.plate-red}"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  nav-link-active:
    textColor: "{colors.plate-red}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "16px"
  index-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 0"
---

# Design System: Howardism

## Overview

**Creative North Star: "The Plate Book"**

This is a bound volume, not a website. The masthead is plate 00; the four sections are Plates I through IV; every article is a leaf of Plate II, stamped with its domain. The running head reads *Howardism · Vol. 03*. That numbering is not decoration applied after the fact — it is the information architecture, defined once as data in `plate-meta.ts` and read by the single page shell. When you add a surface, you are adding a plate to the book, and it needs a number.

The material is warm paper. A fractal-noise grain sits under every page and a faint radial wash of the accent bleeds from the top edge, so the background is never a flat fill. Structure is drawn the way a press draws it: hairline rules, a triple-rule under the masthead, an ordinal in the margin of every row. Type does nearly all the work — Fraunces for the engraved display, Newsreader for the reading column, JetBrains Mono for the small tracked marginalia that labels everything. One red runs through the whole book, and fifteen domain hues mark specimens without ever becoming surfaces.

The restraint is deliberate and load-bearing. This is a corpus of 275 connected notes; the design's job is to make structure legible and stay out of the reading. Four looks are explicitly rejected: **SaaS/dev-tool dark** (neon on near-black, gradient-mesh heroes, glassmorphism, Inter), the **Medium-style blog** (giant centered hero, stock photo, floating clap bar, structureless whitespace), the **card-grid content feed** (uniform thumbnail cards, which turn a knowledge base into a scroll), and **Notion/wiki-tool chrome** (sidebar tree, breadcrumbs, emoji, toggles — the look of the tool the notes came *from*, not of the published edition).

**Key Characteristics:**

- Numbered plates as literal IA — every page declares `Masthead 00` or `Plate I–IV` in its eyebrow
- Warm oklch paper with a permanent grain and accent bleed; never a flat background
- Three content widths, one gutter, one shell — no page sets its own frame
- Hairline rules and tonal steps carry depth; shadows are for floating chrome only
- Mono marginalia (uppercase, tracked 0.12–0.22em, ≤11px) labels everything and reads nothing
- One rationed red, plus fifteen domain hues that mark but never fill
- Light and dark are one token system: paper→slate, ink→bone, the red lifting to `oklch(0.74 0.13 40)`

## Colors

Warm paper and ink in the low-chroma 45–85° hue band, cut by one saturated red at 35° and a fifteen-hue spectrum reserved entirely for domain identity.

### Primary

- **Plate Red** (`oklch(0.55 0.155 35)`): The ink the press ran in a second pass. It is prose links, the essay drop-cap, the `§ end` mark, the lede's left rule, active nav, and the one accent a view is allowed. AA-compliant for body text on both surfaces — 5.00:1 on `plate`, 4.71:1 on paper. In dark mode it lifts to `oklch(0.74 0.13 40)` (6.81:1 on `card`).

### Secondary

- **The Domain Spectrum** (fifteen hues, `oklch(0.49–0.56 0.09–0.15 …)`): One per curated knowledge domain, spaced around the wheel and clamped to L ≤ 0.56; lifted to L ≈ 0.72–0.78 in dark. They appear as the domain dot, the ordinal numeral in an index row, a ≤3px rule, and the compact header's eyebrow. They are identity, not palette.

  **Contrast, measured.** On `--card` all fifteen clear AA for normal text (≥4.75:1 light, ≥6.4:1 dark), which is what the L clamp guarantees. On `--background` (paper) the margin is thinner: `model-capability-and-training` was darkened to `oklch(0.52 0.1 70)` to satisfy WCAG AA on paper (≥4.5:1), resolving the previous 4.48:1 near-miss when used at 10.5px in the compact header eyebrow. `interaction-multimodal` sits exactly on 4.50:1 with no margin. Treat this not as licence to place spectrum hues as small text on paper without checking contrast. Dark mode is comfortable throughout.

### Tertiary

- **Verdigris** (`oklch(0.62 0.11 150)`): A cool green counterweight to the red, currently used only in the placeholder ornament. Available for a second signal when one is genuinely needed; not a general-purpose accent. (A `--brand-soft` token is also defined and presently unused — do not reach for it without a reason.)

### Neutral

- **Paper** (`oklch(0.965 0.012 82)`): The page. Carries the grain and the accent bleed.
- **Paper Recessed** (`oklch(0.945 0.016 80)`): Inset controls and segmented tracks — the `secondary`/`muted` slot.
- **Plate** (`oklch(0.985 0.008 85)`): The sheet laid on the page — cards, popovers, the nav pill, and the banding on even plate *sections* (never on individual rows; see Banding).
- **Ink** (`oklch(0.24 0.02 45)`): Body and heading text; also the fill of a primary button.
- **Ink Muted** (`oklch(0.42 0.02 50)`): Secondary prose, values in a data grid, resting nav.
- **Ink Subtle** (`oklch(0.53 0.015 55)`): Mono marginalia — eyebrows, labels, row metadata.
- **Rule** (`oklch(0.85 0.018 70)`): Every hairline. The most-used non-text token in the system.
- **Rule Strong** (`oklch(0.78 0.02 65)`): Input strokes and chip borders.
- **Hover Wash** (`oklch(0.93 0.018 75)`): The `accent` slot — a hover surface, deliberately *not* the brand hue.
- **Correction Red** (`oklch(0.58 0.21 27)`): Destructive only. Distinct in hue from Plate Red so the two never read as the same ink.

### Named Rules

**The Second Pass Rule.** Plate Red is a second impression, not a fill. It appears as text, a mark, or a rule — links, the drop-cap, `§`, the lede rule, an active nav label — never a large area. Its sanctioned surface uses are exactly two: a wash at ≤10% opacity (`brand/10` on active nav, `brand/5` behind a blockquote), and one solid fill — the shelf's compare toggle, whose armed state has to be unmissable. There is no third. One accent per view.

**The One Hue Per View Rule.** A page carries exactly one domain hue, and everything tinted on it — numerals, top rule, header eyebrow, accent text — uses that hue via `--article-accent`. The home masthead and cross-domain indexes are the only places the full spectrum appears, and there it functions as a legend.

**The Marker-Never-Surface Rule.** Domain color renders only as a dot, a numeral, a rule of ≤3px, or text. Never a background fill, never a tinted panel, never a badge fill. 1px is a separator, 2px opens a list, and 3px is reserved for exactly one thing: the compact plate header's `double` top rule.

## Typography

**Display Font:** Fraunces (variable, optical-size axis; fallback Times New Roman, serif)
**Body Font:** Newsreader (variable, optical-size axis; fallback Georgia, serif)
**Label/Mono Font:** JetBrains Mono (400/500/600; fallback ui-monospace)

**Character:** Two serifs with different jobs and a monospace that never pretends to be either. Fraunces is the engraved plate — high-contrast, set at normal or light weight, always tightened (-0.012em to -0.03em) so it reads as cut rather than typed. Newsreader is the reading voice: warm, wide-aperture, comfortable at 19px over 1.75. JetBrains Mono is the printer's marginalia — tiny, uppercase, heavily tracked, and used exclusively for labels, numbers, and eyebrows.

### Hierarchy

- **Display** (400, `clamp(40px, 6vw, 72px)`, 1.05, -0.03em): The masthead `h1` on a full plate header. One per page, immediately under the triple rule.
- **Headline** (400, 27px, 1.2, -0.015em): The compact plate title — the article reader. Deliberately close to body scale; the reading column should not open with a shout.
- **Title** (500, 19px, 1.2, -0.012em): The article title inside an index row. Drops to 16px/1.25 at compact density.
- **Numeral** (300, 28px, 0.9, -0.03em): The ordinal marker in the margin of every index row — kind prefix plus zero-padded position (`C01`, `E07`, `S12`, `I03`), tinted with the row's accent. 22px at compact density.
- **Body** (400, 1.125rem, 1.6): Site-wide default set on `body`.
- **Prose** (400, 1.1875rem, 1.75): Article bodies only, in a 720px column. Scales to 0.9× / 1.12× via the reader's text-size control.
- **Label** (400, 10.5–11px, 0.12–0.22em, uppercase): Every eyebrow, data-grid key, row metadata — and the site's bespoke controls. Tracking widens with importance: 0.12em for row metadata, 0.16em for controls, 0.18em for data-grid keys, 0.22em for plate eyebrows. Chips are the one mono element outside this range: 12px at 0.08em, because a chip is a tappable object rather than marginalia, and tight tracking keeps a three-chip row from sprawling.
- **Control** (500, 14px): the shadcn `Button` and `Input` — Newsreader at body weight+1, sentence case. This is the role for a *shadcn* control; the site's own bespoke controls are set in **Label** instead (see below).

Controls therefore split by provenance, and both halves are intentional. A shadcn `Button`/`Input` takes **Control**. A hand-rolled control that lives among marginalia takes **Label** — mono, uppercase, tracked: the shelf's Clear / Compare / Select, the fixed resume-reading pill, the labeled `SaveButton`, and the filter bar. The test is where it sits, not what it does: a control surrounded by mono metadata is set in mono so it reads as part of that layer.

### Named Rules

**The Marginalia Rule.** Mono is always uppercase and never used for anything a reader reads in sequence. As marginalia it is tracked ≥0.12em and never above 11px; the chip is the single exception, at 12px / 0.08em, because it is an object on the page rather than a note in the margin. If a mono string needs to be a sentence, it is the wrong font.

**The Tightened Display Rule.** Fraunces is never set at default tracking. Larger means tighter: -0.012em at 19px, -0.015em at 27px, -0.03em at 72px and on numerals.

**The Essay-Only Drop Cap Rule.** Drop-caps are derived from article kind, not authored per file: Essays get one, Concepts and Entities never do. It is 4.2em of Fraunces at 600 in Plate Red, stepping to 3.3em below 480px.

## Layout

Every plate renders through one shell, `PlatePage`, which owns three things no page may set for itself: the content width, the horizontal gutter, and the page-enter animation. Home, `/articles`, the domain/tag indexes, `/questions`, `/shelf`, and the article reader (via `ArticleLayout`, in both locales) all go through it.

Two routes do not, and are known exceptions rather than precedent: `/compare` is a `noindex` URL-driven tool, not a plate, so it has no `plate-meta.ts` entry and renders `CompareView` (or its empty state) directly; `/zh-TW/articles` is a stopgap translation index with its own hand-rolled header. Both still set a width stop and `px-gutter` by hand; only the translation index also carries `hw-page-enter`, so `/compare` enters without the page fade. Closing the second exception means giving it a plate number and the shell; the first is deliberate.

**Three width stops, no raw pixels.** `--container-read: 720px` is the reading column and every single-column view. `--container-index: 1120px` seats the reading column plus its 320px navigation rail — the article reader and `/shelf`. `--container-wide: 1320px` frames everything that lays plates out across the page: the home masthead, `/articles`, the domain / tag / tagged indexes, `/questions`, and `/compare`'s three columns. The article reader is not a fourth width — it is *read* widening to *index* at the `rail` breakpoint (80rem), where the sticky TOC and backlinks rail appears beside the column.

**One gutter.** `--spacing-gutter: clamp(20px, 5vw, 72px)`, applied once on the shell as `px-gutter`. Pages that need full-bleed banded sections pass `bleed` and the shell gutters only the header, letting the body run edge to edge.

**Vertical rhythm.** Index rows are 14px vertical padding at comfortable density, 10px at compact, separated by 1px rules — the first row in a list gets a 2px rule in the list's accent instead. Full plate headers sit on a 3px double rule with 12px below it and 32px of air before the title. Compact headers use a 3px accent-colored `double` top rule with 10px below it, a 1px `double` bottom rule, and 40px of air under that. Pages end with 80px of bottom padding.

**Banding.** Alternating *sections* take the `plate` background (`position % 2 === 0` on `KindPlate`) to keep a long stack of plates scannable across the full width. Index rows themselves are always transparent — the banding is one fill behind a whole plate, never a zebra stripe per row.

**Responsive.** Domain labels drop out of index rows below `sm`. The data grid stacks label-over-value below 480px when asked. Desktop nav is a pill above `md`; below it, a top sheet. The rail appears only at 80rem.

### Named Rules

**The Three Stops Rule.** `max-w-read`, `max-w-index`, `max-w-wide` are the only *page-frame* widths in the app. A `max-w-[1120px]` or a per-page `px-8` is a bug, not a variation. A raw max-width capping a paragraph's measure inside the frame is a different thing and is allowed.

## Elevation & Depth

The system is flat and ruled. Depth comes from two places: hairline rules in `--border`, and a single tonal step between `--background` (the page) and `--card` (a sheet on it). Nothing in the content area lifts but a `Card`. Shadows are otherwise reserved for chrome that genuinely floats above the page and needs to be read as detached — the desktop nav pill, the fixed resume-reading pill, the sticky shelf control bar, and shadcn cards and popovers.

Both shadow tokens lead with a 1px warm bottom edge rather than a blur, so the effect reads as one sheet resting on another rather than an object hovering in space.

### Shadow Vocabulary

- **`--shadow-paper`** (`0 1px 0 oklch(0.85 0.02 70 / 0.6), 0 4px 12px -6px oklch(0.3 0.05 50 / 0.15)`): Resting floating chrome — the nav pill, cards.
- **`--shadow-paper-lg`** (`0 1px 0 oklch(0.85 0.02 70 / 0.6), 0 10px 30px -12px oklch(0.3 0.05 50 / 0.18)`): Fixed overlays anchored to a viewport edge.

### Named Rules

**The Hairline Rule.** If two regions need separating, the answer is a 1px `--border` rule — not a shadow, not a gap, not a filled panel. Weight escalates only for meaning: 1px separates, 2px opens a list in its accent, 3px double-rules a masthead.

**The Flat Content Rule.** Nothing inside the content column casts a shadow *except* a `Card`, which always carries `shadow-paper` — that one resting shadow is what makes it read as a sheet laid on the page, and the article reader's "About this piece" card uses it mid-column. Anything else that appears to float must be `position: fixed` or `sticky` and genuinely above the page.

## Shapes

Two form languages, split by role and never mixed.

**Content structure is unrounded.** Index rows, plate headers, rules, tables, the reading column, banded sections — all square. This is print geometry; a rounded corner on a plate would break the metaphor.

**Chrome is rounded, and rounds harder the more it floats.** The radius scale derives from `--radius: 0.625rem` (10px): controls and inputs at 10px (`lg`), small controls at 6–8px, cards at 18px (`2xl`), and anything pill-shaped — nav links, icon buttons, chips, the nav container, the domain dot — fully round.

**The half-disc** is the system's one piece of geometry that is neither: a 2:1 rectangle clipped to a 999px top (or bottom) radius, filled with a three-stop radial gradient derived from the accent hue via `oklch(from …)` and overlaid with grain at 60% opacity in `mix-blend-overlay`. It is a printed illustration on the plate, not a UI shape.

## Components

### Buttons

- **Shape:** Softly rounded (10px), or fully round for icon-only. Square corners are for content, never for controls.
- **Primary:** Ink fill on paper text (`bg-primary text-primary-foreground`), 32px tall, 10px horizontal padding. Hover drops the fill to 80% opacity. This is the only filled button in the general vocabulary.
- **The one red fill:** the shelf's compare affordance — `bg-brand text-white` on the Compare action and on Select once compare mode is armed (`shelf-tabs.tsx`). It is a mode toggle whose *on* state has to be unmissable, and it is the single sanctioned exception to the no-red-fill rule. Do not extend it to a second surface.
- **Ghost / Outline:** The default in this system. Ghost is transparent until hover, when it takes the muted wash and ink text. Outline adds a `--border` stroke over the page.
- **Hover / Focus:** All transitions are `transition-all` at the browser default duration. Focus is a 3px `--ring` ring at 50% opacity plus a ring-colored border; the ring is the brand hue, which is the one place the red touches a control. Active state translates 1px down.
- **Icon buttons:** 36px round (`size-9`), muted until hover, then the hover wash. Header controls (theme, menu, search, reader settings) are all this. The one smaller case is `SaveButton`'s icon-only variant at 28px (`size-7`), sized to sit inside an index row without stretching it — still a full round hit area, never a bare glyph.

### Chips

- **Style:** Fully round, `--card` at 60% opacity, `--input` stroke, mono uppercase at 0.08em tracking, with a 6px Plate Red dot as a `::before` (`before:size-1.5`) — the chip's only color. The tighter index-row variant drops the dot to 5px.
- **State:** Navigable chips (a subject tag that has its own page) link and shift border and text to Plate Red on hover. Rare singleton tags render inert with no hover. Lists cap at 3 visible.

### Cards / Containers

- **Corner Style:** 18px (`2xl`).
- **Background:** `--card`, the one tonal step above the page.
- **Shadow Strategy:** `--shadow-paper` — cards are one of the four sanctioned floating surfaces.
- **Border:** 1px `--border`, always.
- **Internal Padding:** 16px vertical, 16px horizontal (12px at `size="sm"`).

### Inputs / Fields

- **Style:** 10px radius, transparent background over the page, 1px `--input` stroke. In dark mode the fill becomes `--input/30`.
- **Focus:** Border shifts to `--ring` and a 3px `--ring/50` halo appears. No glow, no color change on the text.
- **Error / Disabled:** `aria-invalid` swaps border and ring to `--destructive`. Disabled drops to 50% opacity with a filled `--input/50` background.

### Navigation

- **Style:** A floating pill above `md` — round, `--card` at 85%, `--border` stroke, `--shadow-paper`, `backdrop-blur-md`. Links are round, 16px × 8px, body font at 0.9rem.
- **States:** Muted at rest; hover goes to full ink; the active route takes `brand/10` behind Plate Red text — the sanctioned wash exception to the Second Pass Rule.
- **Mobile:** A top sheet at 24px radius with 32px padding, listing routes as full-width rows on hairline rules with a 48px minimum touch target.
- **Scroll behavior:** The bar is sticky and condenses on scroll past 80px — padding tightens from 16px to 8px, the avatar shrinks 36→30px, the tagline drops, and a translucent blurred background with a bottom rule fades in. On article routes it grows reader controls (TOC, find, settings) separated from the global cluster by a 20px hairline, and the reading-progress bar becomes its bottom edge.

### Index Row (signature)

One row pattern renders an article in every *list* on the site — home plates, the articles index, domain pages, tag pages, and the shelf. It has two implementations: `IndexRow` for the site indexes, and `ShelfArticleRow` for the shelf, which keeps the same five facts and adds reading progress and a compare checkbox. The shelf's resume strip is deliberately not a list: `ContinueReading` renders its own `ResumeCard` as a horizontally snapping card carousel, because resuming is a glanceable jump-back-in, not something you scan in order. Five facts in a `[auto_1fr_auto]` grid, left to right:

1. **Numeral marker** — Fraunces 300 at 28px, kind prefix plus zero-padded ordinal (`C01`), tinted with the row's accent (domain or kind color).
2. **Title** — Fraunces 500 at 19px, hovering to Plate Red, with a hover preview card; up to three subject chips beneath.
3. **Domain label** — dot plus name in mono, hidden below `sm` and on single-domain pages.
4. **Date · reading** — `formatDateShort · {readingTime}′`, mono, tabular figures, right-aligned. One format across every index. The shelf is the exception and has to be: `ShelfArticleRow` is never handed a publication date, because what matters there is *when you touched it* — it renders a relative `lastReadAt` on History and `saved {relative}` on Saved, still followed by reading time.
5. **Save button** — the one save affordance in the system, icon-only at 28px round.

Rows separate on 1px `--border`; the first row in a list takes a 2px rule in the list accent instead. Comfortable (14px) and compact (10px) densities only.

### Plate Header (signature)

Every page's identity block, in two variants.

- **Full** — a 3px double rule in `--foreground` under a mono eyebrow pair (`Howardism · Vol. 03` left, `Plate II · No. 02` right), then the display `h1` with an optional italic Plate Red accent word, then an optional mono data grid.
- **Compact** — a 3px `double` top rule in the page's accent color over a 1px `double` bottom rule in `--border`, the eyebrow left side switching to `Plate II · {domain}` in that accent, and a 27px headline. Used by the article reader only; every other plate, the shelf included, takes the full variant, which is the shell's default. (`DiscPageHeader` also carries an accent-less compact branch with a dashed bottom rule, but nothing reaches it — the reader always passes an accent, falling back to `--brand`. Treat the double rule as the compact spec.)

Both carry the `hw-grain` overlay, which adds grain to the header surface without re-stacking the body grain.

### Domain Dot & Label

A `size`-configurable round dot in the domain's hue, followed by the domain's display label. The system's smallest and most-repeated identity element — it appears in index rows, header eyebrows, filter bars, and the search palette, and it is the primary sanctioned use of a domain hue.

## Do's and Don'ts

### Do:

- **Do** give every new page a plate number in `plate-meta.ts` and render it through `PlatePage`. A surface without a plate number is not part of the book.
- **Do** use `max-w-read` / `max-w-index` / `max-w-wide` and `px-gutter`. Nothing else sets a page width or a horizontal page padding.
- **Do** reach for a 1px `--border` rule before a shadow, a gap, or a filled panel.
- **Do** set mono uppercase, tracked 0.12–0.22em, at 9.5–11px, for every label, eyebrow, and metadata string.
- **Do** derive an article's accent from its domain and thread it through the whole view via `--article-accent`.
- **Do** render every article list through `IndexRow` — or `ShelfArticleRow` on the shelf, where rows carry progress and selection — with one date format (`formatDateShort · {readingTime}′`). The shelf differs twice, both deliberate: it shows a relative read/saved time instead of a publication date, and its trailing control varies by list — `SaveButton` on every index and on Saved, `RemoveButton` on History, where the useful action is dismissing a row you've already read.
- **Do** keep content structure square and chrome rounded (10px controls, 18px cards, full-round pills).
- **Do** define new colors in OKLCH in `packages/ui/src/styles/globals.css` with a light and a dark value, and clamp accents to L ≤ 0.56 light / L ≈ 0.75 dark so they hold AA on `--card`.

### Don't:

- **Don't** fill anything with Plate Red. It is text, a mark, or a rule — plus washes at ≤10% (`brand/10`, `brand/5`). Never a button, badge, or panel background — the shelf's compare toggle is the one standing exception, not a precedent.
- **Don't** let a domain hue become a surface. Dot, numeral, rule of ≤3px (3px only on the compact header), or text only — and one hue per view outside the masthead and cross-domain indexes.
- **Don't** add a shadow to anything inside the content column. Shadows belong to `fixed`/`sticky` chrome, cards, and popovers.
- **Don't** introduce a fourth content width: no raw page-container width (`max-w-[720px]`, `max-w-[1120px]`, `max-w-[1280px]`, `max-w-[1320px]`) anywhere, and no raw `px-4` / `px-8` gutter on a route entry. `src/__tests__/howardism/page-frame.test.ts` fails CI on both. A `max-w-[680px]` or `max-w-[60ch]` capping a *paragraph's* measure is not a page frame and is fine.
- **Don't** set Fraunces at default tracking, or use Newsreader for labels, or JetBrains Mono for anything read in sequence.
- **Don't** author drop-caps per article. They are an Essay-only rule derived from article kind.
- **Don't** add a third way to render an article in a list. Extend `IndexRow`'s props, or `ShelfArticleRow`'s if the surface is the shelf. (`ResumeCard` is not a third row — it is the shelf's card carousel, and it stays that way.)
- **Don't** reach for the four rejected worlds: neon-on-black SaaS chrome with gradient-mesh heroes and glassmorphism; a giant centered hero with a stock photo and a floating clap bar; a uniform rounded card grid with thumbnails; or sidebar-tree, breadcrumb, emoji-icon wiki-tool chrome.
- **Don't** flatten the background to a solid color. The grain and the top accent bleed are the material.
