import {
  DOMAIN_META,
  DOMAIN_ORDER,
  resolveDomain,
} from "@/app/(blog)/articles/domain-meta";
import { DomainDot } from "@/components/howardism/domain-dot";

import type { SearchEntry } from "./search-data";

/** Which index field a scope narrows on. `tag` is the article kind. */
export type ScopeField = "domain" | "tag";

export interface Scope {
  field: ScopeField;
  value: string;
}

export interface Facet extends Scope {
  count: number;
  label: string;
}

/** Article kinds, in the order the home page files them. */
const KIND_ORDER = ["Concept", "Entity", "Essay", "Index"];

const labelFor = (field: ScopeField, value: string): string => {
  if (field !== "domain") {
    return value;
  }
  const resolved = resolveDomain(value);
  return resolved ? DOMAIN_META[resolved].label : value;
};

/**
 * Count how many of `entries` sit in each domain and each kind, ordered by the
 * site's own taxonomy order rather than by count — the palette's chip row
 * should read the same way every time, not reshuffle as the query changes.
 *
 * Free-form `tags` are deliberately not faceted: 325 distinct values across 275
 * articles, 176 of them used exactly once, is a list nobody can scan. Tags
 * surface per-row instead (see `ResultRow`).
 */
export function buildFacets(entries: SearchEntry[]): Facet[] {
  const domains = new Map<string, number>();
  const kinds = new Map<string, number>();
  for (const entry of entries) {
    if (entry.domain) {
      domains.set(entry.domain, (domains.get(entry.domain) ?? 0) + 1);
    }
    kinds.set(entry.tag, (kinds.get(entry.tag) ?? 0) + 1);
  }

  const ordered = (
    field: ScopeField,
    counts: Map<string, number>,
    order: readonly string[]
  ): Facet[] =>
    order
      .filter((value) => counts.has(value))
      .map((value) => ({
        field,
        value,
        count: counts.get(value) ?? 0,
        label: labelFor(field, value),
      }));

  return [
    ...ordered("domain", domains, DOMAIN_ORDER),
    ...ordered("tag", kinds, KIND_ORDER),
  ];
}

const isActive = (facet: Facet, scope: Scope | null): boolean =>
  scope !== null && scope.field === facet.field && scope.value === facet.value;

/**
 * The chip row above the results. Clicking a chip narrows to that domain or
 * kind; clicking the active one clears it. With no query typed this is the
 * whole palette — picking a chip browses that slice, which is the answer to an
 * empty search box being a dead end.
 */
export function ScopeBar({
  facets,
  onSelect,
  scope,
}: {
  facets: Facet[];
  onSelect: (next: Scope | null) => void;
  scope: Scope | null;
}) {
  if (facets.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 border-border border-b px-3 py-2.5">
      {facets.map((facet) => {
        const active = isActive(facet, scope);
        return (
          <button
            aria-pressed={active}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] transition-colors ${
              active
                ? "bg-brand text-background"
                : "bg-muted text-foreground-subtle hover:text-foreground"
            }`}
            key={`${facet.field}:${facet.value}`}
            onClick={() => onSelect(active ? null : facet)}
            type="button"
          >
            {facet.field === "domain" && !active && (
              <DomainDot
                domain={resolveDomain(facet.value) ?? "syntheses"}
                size={5}
              />
            )}
            {facet.label}
            <span className={active ? "opacity-70" : "opacity-50"}>
              {facet.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
