import { Badge } from "@howardism/ui/components/badge";
import Link from "next/link";

import { humanizeTag } from "@/utils/humanize-tag";

interface SubjectChipProps {
  /** When set, the chip links to its tag page; otherwise it renders inert. */
  href?: string;
  tag: string;
}

/** Trailing spacing so chips wrap with breathing room in dense lists. */
const SPACING = "mr-1.5 mb-1";

/**
 * A single free-form subject tag, rendered with the design system's `chip`
 * badge. Clickable (linking to `/articles/tagged/[tag]`) only when an `href`
 * is supplied — rare singleton tags have no page and render inert. Distinct
 * from `TagChip` (`components/tag-chip`), which renders the singular kind enum.
 */
export function SubjectChip({ tag, href }: SubjectChipProps) {
  const label = humanizeTag(tag);
  if (href) {
    return (
      <Badge
        asChild
        className={`${SPACING} transition-colors hover:border-brand hover:text-brand`}
        variant="chip"
      >
        <Link href={href}>{label}</Link>
      </Badge>
    );
  }
  return (
    <Badge className={SPACING} variant="chip">
      {label}
    </Badge>
  );
}
