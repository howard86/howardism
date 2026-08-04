import { resolveDomain } from "@/app/(blog)/articles/domain-meta";
import { KIND_META } from "@/app/(blog)/articles/kind-meta";
import type { TagSectionSlug } from "@/app/(blog)/articles/tag-sections";
import { DomainLabel } from "@/components/howardism/domain-label";

import { buildSnippet, type SearchEntry } from "./search-data";

const KNOWN_KINDS = new Set<string>(Object.keys(KIND_META));

/** How many tag chips a row shows before it starts crowding the title. */
const MAX_TAG_CHIPS = 3;

/**
 * The article's own tags, query-matching ones first so a row always shows *why*
 * it is here when the match was a tag rather than words in the summary.
 * `buildSnippet` is the match test: it already handles casing and per-token
 * fallback, and returns null exactly when nothing in the text matches.
 */
function rankedTags(tags: string[] | undefined, query: string) {
  return (tags ?? [])
    .map((tag) => ({ tag, matched: buildSnippet(tag, query) !== null }))
    .sort((a, b) => Number(b.matched) - Number(a.matched))
    .slice(0, MAX_TAG_CHIPS);
}

/** A single article result: kind badge + title, summary, domain, tag chips. */
export function ResultRow({
  entry,
  query,
  showDomain = true,
}: {
  entry: SearchEntry;
  query: string;
  /** Off when the list is grouped by domain — the heading already says it. */
  showDomain?: boolean;
}) {
  const domain =
    showDomain && entry.domain ? resolveDomain(entry.domain) : null;
  const kindSlug = entry.tag.toLowerCase();
  const kind = KNOWN_KINDS.has(kindSlug)
    ? KIND_META[kindSlug as TagSectionSlug]
    : null;
  // The index carries no article text, so the summary is what gets highlighted.
  const snippet = buildSnippet(entry.description, query);
  const tags = rankedTags(entry.tags, query);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <div className="flex items-center gap-2">
        {kind && (
          <span
            aria-hidden="true"
            className="inline-flex size-[18px] shrink-0 items-center justify-center rounded font-medium font-mono text-[10px]"
            style={{
              color: kind.color,
              background: "color-mix(in oklab, currentColor 14%, transparent)",
            }}
          >
            {kind.prefix}
          </span>
        )}
        <span className="truncate font-display font-medium text-[15px] text-foreground">
          {entry.title}
        </span>
      </div>

      <p className="line-clamp-2 text-[13px] text-muted-foreground leading-snug">
        {snippet ? (
          <>
            {snippet.before}
            <mark className="rounded-[3px] bg-brand/15 px-0.5 font-medium text-foreground">
              {snippet.match}
            </mark>
            {snippet.after}
          </>
        ) : (
          entry.description
        )}
      </p>

      <div className="mt-0.5 flex min-w-0 items-center gap-2 overflow-hidden">
        {domain && (
          <span className="inline-flex shrink-0 items-center font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.12em]">
            <DomainLabel domain={domain} />
          </span>
        )}
        {tags.map(({ tag, matched }) => (
          <span
            className={`shrink-0 rounded-full px-1.5 py-px font-mono text-[10px] ${
              matched
                ? "bg-brand/15 text-foreground"
                : "bg-muted text-foreground-subtle"
            }`}
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
