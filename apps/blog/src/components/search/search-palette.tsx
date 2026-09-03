"use client";

import { createFuse, searchEntries } from "@howardism/article-contract/search";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@howardism/ui/components/command";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { DOMAIN_META, resolveDomain } from "@/app/(blog)/articles/domain-meta";

import { ResultRow } from "./result-row";
import { buildFacets, type Scope, ScopeBar } from "./scope-bar";
import { loadSearchIndex, type SearchEntry } from "./search-data";

interface SearchPaletteProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

/**
 * How many results the list shows, and how deep ranking goes behind it. Ranking
 * to 50 (the shared search module's ceiling) rather than to 12 is what lets the
 * scope chips carry honest counts and narrow without re-ranking.
 */
const SHOWN_LIMIT = 12;
const RANK_LIMIT = 50;

function emptyLabel(
  loaded: boolean,
  query: string,
  failed: boolean,
  scoped: boolean
): string {
  if (failed) {
    return "Couldn't load search. Close and try again.";
  }
  if (!loaded) {
    return "Loading articles…";
  }
  if (query.trim().length > 0) {
    return scoped ? "No articles in this filter." : "No articles found.";
  }
  return "Type to search, or pick a filter above.";
}

/** Group heading for a result, falling back for articles without a domain. */
function domainLabel(entry: SearchEntry): string {
  const resolved = entry.domain ? resolveDomain(entry.domain) : null;
  return resolved ? DOMAIN_META[resolved].label : "Other";
}

export function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope | null>(null);
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  // Lazy-load the index the first time the palette opens.
  useEffect(() => {
    if (!(open && entries === null)) {
      return;
    }
    let active = true;
    setFailed(false);
    loadSearchIndex()
      .then((loaded) => {
        if (active) {
          setEntries(loaded);
        }
      })
      .catch(() => {
        // `entries` stays null so reopening retries (loadSearchIndex cleared
        // its cached rejection); surface a message instead of hanging.
        if (active) {
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [open, entries]);

  const fuse = useMemo(() => (entries ? createFuse(entries) : null), [entries]);
  // Ranking is synchronous and the corpus is large enough to be felt (tens of
  // ms per keystroke), so let the input paint the typed character first and
  // rank against the settled query.
  const deferredQuery = useDeferredValue(query);
  const lowerQuery = deferredQuery.trim().toLowerCase();

  // With no query but a scope picked, the palette browses that slice instead of
  // ranking — an empty search box is otherwise a dead end.
  const ranked = useMemo(() => {
    if (deferredQuery.trim().length > 0) {
      return fuse ? searchEntries(fuse, deferredQuery, RANK_LIMIT) : [];
    }
    return scope && entries ? entries : [];
  }, [fuse, entries, deferredQuery, scope]);

  // Facets come from the unscoped result set, so picking one narrows the list
  // without collapsing the row you'd need to click to undo it.
  const facets = useMemo(() => buildFacets(ranked), [ranked]);
  // Nothing typed and nothing picked yet: offer the whole taxonomy as a
  // starting point rather than an empty row. Memoised so this doesn't
  // rescan all entries on every keystroke while facets stays empty.
  const fallbackFacets = useMemo(
    () => (entries ? buildFacets(entries) : []),
    [entries]
  );
  const matches = useMemo(
    () =>
      scope ? ranked.filter((e) => e[scope.field] === scope.value) : ranked,
    [ranked, scope]
  );
  const shown = matches.slice(0, SHOWN_LIMIT);

  const groups = useMemo(() => {
    const byDomain = new Map<string, SearchEntry[]>();
    for (const entry of shown) {
      const label = domainLabel(entry);
      const group = byDomain.get(label);
      if (group) {
        group.push(entry);
      } else {
        byDomain.set(label, [entry]);
      }
    }
    return [...byDomain.entries()];
  }, [shown]);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      setScope(null);
    }
  };

  const handleSelect = (slug: string) => {
    handleOpenChange(false);
    router.push(`/articles/${slug}`);
  };

  // Both read the deferred query so the highlighted span and the "no articles"
  // copy always describe the result set actually on screen.
  const emptyMessage = emptyLabel(
    entries !== null,
    deferredQuery,
    failed,
    scope !== null
  );

  return (
    <CommandDialog
      onOpenChange={handleOpenChange}
      open={open}
      shouldFilter={false}
    >
      <CommandInput
        onValueChange={setQuery}
        placeholder="Search articles…"
        value={query}
      />
      <ScopeBar
        facets={facets.length > 0 || !entries ? facets : fallbackFacets}
        onSelect={setScope}
        scope={scope}
      />
      <CommandList>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        {groups.map(([label, groupEntries]) => (
          // One group needs no heading — it would just restate the active chip,
          // or label a list with nothing to be distinguished from. Whichever of
          // the heading and the per-row domain is redundant is the one dropped,
          // so the domain is stated exactly once per result either way.
          <CommandGroup
            heading={groups.length > 1 ? label : undefined}
            key={label}
          >
            {groupEntries.map((entry) => (
              <CommandItem
                key={entry.slug}
                onSelect={() => handleSelect(entry.slug)}
                value={entry.slug}
              >
                <ResultRow
                  entry={entry}
                  lowerQuery={lowerQuery}
                  showDomain={groups.length === 1 && scope?.field !== "domain"}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
      {matches.length > shown.length && (
        <div className="border-border border-t px-3 py-2 font-mono text-[10px] text-foreground-subtle uppercase tracking-[0.12em]">
          Showing {shown.length} of {matches.length}
          {matches.length === RANK_LIMIT ? "+" : ""} — narrow with a filter
        </div>
      )}
    </CommandDialog>
  );
}
