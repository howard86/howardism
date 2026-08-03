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

import { ResultRow } from "./result-row";
import { loadSearchIndex, type SearchEntry } from "./search-data";

interface SearchPaletteProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

function emptyLabel(loaded: boolean, query: string, failed: boolean): string {
  if (failed) {
    return "Couldn't load search. Close and try again.";
  }
  if (!loaded) {
    return "Loading articles…";
  }
  if (query.trim().length > 0) {
    return "No articles found.";
  }
  return "Type to search articles.";
}

export function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
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
  const results = useMemo(
    () => (fuse ? searchEntries(fuse, deferredQuery) : []),
    [fuse, deferredQuery]
  );

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setQuery("");
    }
  };

  const handleSelect = (slug: string) => {
    handleOpenChange(false);
    router.push(`/articles/${slug}`);
  };

  // Both read the deferred query so the highlighted span and the "no articles"
  // copy always describe the result set actually on screen.
  const emptyMessage = emptyLabel(entries !== null, deferredQuery, failed);

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
      <CommandList>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        {results.length > 0 && (
          <CommandGroup heading="Articles">
            {results.map((entry) => (
              <CommandItem
                key={entry.slug}
                onSelect={() => handleSelect(entry.slug)}
                value={entry.slug}
              >
                <ResultRow entry={entry} query={deferredQuery} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
