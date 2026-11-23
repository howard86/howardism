# Howardism — how to build with this design system

An editorial, paper-and-ink look for a public AI-research wiki: warm paper background, Fraunces display headings, Newsreader body text, JetBrains Mono uppercase eyebrows, one terracotta brand colour, and one colour per knowledge domain.

## Setup

No provider or wrapper. `styles.css` carries the tokens, fonts (Google Fonts, loaded at runtime) and base `body` styles (paper background, Newsreader, ink colour). Components come from `window.Howardism`; `useForm` (react-hook-form) and the `DOMAIN_META` / `DOMAIN_ORDER` data come from the same place.

## Styling: Tailwind utilities over CSS-variable tokens

Style layout glue with Tailwind classes. Only compiled classes work: the ones the components use plus a safelist of common layout utilities (flex/grid, `gap-*`/`p-*`/`m-*` on the 0–24 scale, `grid-cols-1…12`, `max-w-xs…7xl`, `text-xs…6xl`, `sm:`/`md:`/`lg:` prefixes). **Arbitrary values you invent (`w-[420px]`) are not compiled** — use an inline `style` for one-off sizes.

| Role | Classes / tokens |
|---|---|
| Surfaces | `bg-background` (page), `bg-card`, `bg-muted`, `shadow-paper` |
| Text | `text-foreground`, `text-muted-foreground`, `text-foreground-subtle` |
| Brand | `text-brand`, `bg-brand`, `bg-brand-soft`; `var(--brand)` |
| Domains | `text-domain-<slug>`, `bg-domain-<slug>`, `var(--domain-<slug>)` — slugs: agent-systems, agent-security, ai-coding-practice, evals-and-benchmarks, model-capability-and-training, alignment-and-safety, interpretability, interaction-multimodal, formal-math, startup-founder, product-org, ai-economics-and-labor, superintelligence-trajectory, entities, syntheses |
| Type | `font-display` (headings, often `font-normal` with an italic `text-brand` accent), `font-body`, `font-mono` |
| Eyebrow | `font-mono text-[10.5px] uppercase tracking-[0.22em] text-foreground-subtle` |
| Page width | `max-w-read`, `max-w-wide`, `px-gutter` |

**Borders:** always pair `border`, `border-t`, `border-b` with `border-border`. There is no base border colour, so a bare `border` draws in the dark text colour.

Use the real domain labels (`DOMAIN_META[slug].label`, `.color`) rather than inventing domains.

## Where the truth lives

- `styles.css` → `_ds_bundle.css`: every token and compiled class. Grep it before relying on a class.
- `components/general/<Name>/<Name>.prompt.md` and `<Name>.d.ts`: per-component usage and props.
- Editorial pieces: `DiscPageHeader` (page masthead), `DataGrid` (label/value rows), `IndexRow` (the article list row), `DomainLabel`/`DomainDot`, `SubjectChip(List)`, `SaveButton`, `HalfDisc`, `Ph` (image placeholder). Generic controls: `Button`, `Badge`, `Card`, `Input`, `Select`, `Tabs`, `Dialog`, `Sheet`, `Popover`, `HoverCard`, `Command`, `NavigationMenu`, `Form`.

## Example

```jsx
const { DiscPageHeader, IndexRow, DOMAIN_META } = window.Howardism;

const article = {
  slug: "agent-context-files", dateMs: 0, position: 0, sourceHash: "",
  meta: { date: "2026-10-27", title: "Agent Context Files", description: "How agents load project instructions.",
          readingTime: 12, tag: "Concept", domain: "agent-systems", tags: ["agents"], imageAlt: "" },
};

<main className="mx-auto max-w-wide px-gutter">
  <DiscPageHeader eyebrowStart="Howardism · Vol. 03" eyebrowEnd="Masthead · No. 00"
                  title="A working wiki," titleAccent="lately." />
  <h2 className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.22em] text-foreground-subtle">Revised this week</h2>
  <ol className="m-0 list-none p-0">
    <IndexRow article={article} ordinal={1} first accent={DOMAIN_META["agent-systems"].color} />
  </ol>
</main>
```
