import { DomainDot } from "@/components/howardism/domain-dot";

import { DOMAIN_META, DOMAIN_ORDER } from "./domain-meta";

interface FilterBarProps {
  /** Section slugs present on the page, in order, for the "Filed under" row. */
  sectionSlugs: { slug: string; title: string }[];
}

const ROW_LABEL =
  "pt-1.5 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.18em]";
const PILL =
  "font-display font-medium text-[18px] text-muted-foreground capitalize transition-colors hover:text-brand";
const ACTIVE = "border-current border-b pb-0.5 text-brand italic";

/**
 * Two-row filter bar. "Filed under" jumps to each kind plate (in-page
 * anchors); "Domain" links to the `/articles/domain/[domain]` routes.
 */
export function FilterBar({ sectionSlugs }: FilterBarProps) {
  return (
    <div className="border-border border-b bg-card/40 px-gutter py-5">
      <div className="grid grid-cols-[88px_1fr] items-baseline gap-x-6 gap-y-2.5">
        <span className={ROW_LABEL}>Filed under</span>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
          <span className={`${PILL} ${ACTIVE}`}>all</span>
          {sectionSlugs.map(({ slug, title }) => (
            <a className={PILL} href={`#${slug}`} key={slug}>
              {title}
            </a>
          ))}
        </div>

        <span className={ROW_LABEL}>Domain</span>
        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
          {DOMAIN_ORDER.map((domain) => (
            <a
              className={`${PILL} flex items-baseline`}
              href={`/articles/domain/${domain}`}
              key={domain}
            >
              <DomainDot domain={domain} size={6} />
              {DOMAIN_META[domain].label.toLowerCase()}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
