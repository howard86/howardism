import { resolveDomain } from "@/app/(blog)/articles/domain-meta";
import { KIND_META } from "@/app/(blog)/articles/kind-meta";
import type { TagSectionSlug } from "@/app/(blog)/articles/tag-sections";
import { DomainLabel } from "@/components/howardism/domain-label";

import { buildSnippet, type SearchEntry } from "./search-data";

const KNOWN_KINDS = new Set<string>(Object.keys(KIND_META));

/** A single article result: kind badge + title, matched snippet, domain. */
export function ResultRow({
  entry,
  query,
}: {
  entry: SearchEntry;
  query: string;
}) {
  const domain = entry.domain ? resolveDomain(entry.domain) : null;
  const kindSlug = entry.tag.toLowerCase();
  const kind = KNOWN_KINDS.has(kindSlug)
    ? KIND_META[kindSlug as TagSectionSlug]
    : null;
  const snippet = buildSnippet(entry.body, query);

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

      {domain && (
        <span className="mt-0.5 inline-flex items-center font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.12em]">
          <DomainLabel domain={domain} />
        </span>
      )}
    </div>
  );
}
