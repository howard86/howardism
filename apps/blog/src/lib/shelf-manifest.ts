import { useEffect, useState } from "react";

import type { ShelfManifestEntry } from "./shelf-rows";

let manifestPromise: Promise<ReadonlyMap<string, ShelfManifestEntry>> | null =
  null;

/**
 * Lazily fetch the Shelf's article manifest (a static JSON route — see
 * app/shelf/manifest.json/route.ts) and index it by slug. Cached at module
 * scope, mirroring components/search/search-data.ts, so the Shelf's several
 * client components share one fetch instead of each re-fetching or building
 * their own slug-keyed Map.
 */
export function loadShelfManifest(): Promise<
  ReadonlyMap<string, ShelfManifestEntry>
> {
  if (!manifestPromise) {
    manifestPromise = fetch("/shelf/manifest.json")
      .then((res) => res.json() as Promise<ShelfManifestEntry[]>)
      .then((entries) => new Map(entries.map((entry) => [entry.slug, entry])))
      .catch((err) => {
        // Drop the cached rejection so a later attempt retries the fetch
        // instead of being stuck with a permanently-failed promise.
        manifestPromise = null;
        throw err;
      });
  }
  return manifestPromise;
}

/** Test-only: clears the module-level cache so the next call refetches. */
export function resetShelfManifestCache(): void {
  manifestPromise = null;
}

/**
 * The manifest, fetched only once `active` — an empty shelf (no history, no
 * saved articles) never fetches. Every caller shares the one cached promise
 * above, so this is cheap to call from several components in the same tree.
 */
export function useShelfManifest(
  active: boolean
): ReadonlyMap<string, ShelfManifestEntry> | null {
  const [manifest, setManifest] = useState<ReadonlyMap<
    string,
    ShelfManifestEntry
  > | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }
    let cancelled = false;
    loadShelfManifest().then((loaded) => {
      if (!cancelled) {
        setManifest(loaded);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  return manifest;
}
