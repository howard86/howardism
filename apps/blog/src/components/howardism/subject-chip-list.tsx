import { taggedHref } from "@/utils/tagged-href";

import { SubjectChip } from "./subject-chip";

interface SubjectChipListProps {
  /** When set, show at most this many chips and a `+N` overflow marker. */
  limit?: number;
  /** Tags that have a `/articles/tagged/[tag]` page — these chips link. */
  navigable: ReadonlySet<string>;
  tags: readonly string[];
}

/**
 * Renders an article's subject tags as wrapping chips. Tags in `navigable`
 * link to their tag page; the rest are inert. With `limit`, extra tags
 * collapse into a `+N` marker (used in dense index rows).
 */
export function SubjectChipList({
  tags,
  navigable,
  limit,
}: SubjectChipListProps) {
  const shown = limit ? tags.slice(0, limit) : tags;
  const overflow = tags.length - shown.length;

  return (
    <span>
      {shown.map((tag) => (
        <SubjectChip
          href={navigable.has(tag) ? taggedHref(tag) : undefined}
          key={tag}
          tag={tag}
        />
      ))}
      {overflow > 0 && (
        <span className="mb-1 inline-block font-mono text-[10.5px] text-foreground-subtle leading-none">
          +{overflow}
        </span>
      )}
    </span>
  );
}
