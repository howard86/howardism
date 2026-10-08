import { InternalLink } from "@/components/internal-link";
import { humanizeTag } from "@/utils/humanize-tag";

interface SubjectChipProps {
  /** When set, the chip links to its tag page; otherwise it renders inert. */
  href?: string;
  tag: string;
}

/** Trailing spacing so chips wrap with breathing room in dense lists. */
const SPACING = "mr-1.5 mb-1";

/**
 * A single free-form subject tag, styled by the compact `subject-chip`
 * utility (the Badge `chip` look without its long class string, which bloated
 * list pages). Clickable (linking to `/articles/tagged/[tag]`) only when an
 * `href` is supplied — rare singleton tags have no page and render inert.
 * Distinct from `TagChip` (`components/tag-chip`), which renders the singular
 * kind enum.
 */
export function SubjectChip({ tag, href }: SubjectChipProps) {
  const label = humanizeTag(tag);
  if (href) {
    return (
      <InternalLink
        className={`subject-chip ${SPACING} transition-colors hover:border-brand hover:text-brand`}
        href={href}
      >
        {label}
      </InternalLink>
    );
  }
  return <span className={`subject-chip ${SPACING}`}>{label}</span>;
}
