"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@howardism/ui/components/tabs";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { buildCompareHref, MAX_COMPARE } from "@/lib/compare-ids";
import type { ShelfManifestEntry } from "@/lib/shelf-rows";

import { SavedList } from "./saved-list";
import { ShelfList } from "./shelf-list";

/** Minimum selection that makes a comparison meaningful. */
const MIN_COMPARE = 2;

function CompareBar({
  count,
  onCompare,
  onClear,
}: {
  count: number;
  onCompare: () => void;
  onClear: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-border border-t bg-card/95 px-4 py-3 shadow-paper-lg backdrop-blur-sm">
      <div className="mx-auto flex max-w-wide items-center justify-between gap-4">
        <span className="font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.16em]">
          {count} selected
        </span>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full px-3 py-1.5 font-mono text-[11px] text-foreground-subtle uppercase tracking-[0.16em] transition-colors hover:text-foreground"
            onClick={onClear}
            type="button"
          >
            Clear
          </button>
          <button
            className="rounded-full bg-brand px-4 py-1.5 font-mono text-[11px] text-white uppercase tracking-[0.16em] transition-opacity hover:opacity-90 disabled:opacity-40"
            disabled={count < MIN_COMPARE}
            onClick={onCompare}
            type="button"
          >
            Compare ({count}) →
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * The Shelf's tabbed shell: automatic reading History and deliberate Saved
 * lists, both resolved against the same build-time article manifest. Owns the
 * cross-tab compare selection (so a History pick and a Saved pick combine),
 * caps it at three, and launches the comparison via a persistent bar.
 */
export function ShelfTabs({ manifest }: { manifest: ShelfManifestEntry[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  const selection = useMemo(
    () => ({
      selectedSlugs: new Set(selected),
      atLimit: selected.length >= MAX_COMPARE,
      onToggleSelect: (slug: string) =>
        setSelected((current) => {
          if (current.includes(slug)) {
            return current.filter((entry) => entry !== slug);
          }
          if (current.length >= MAX_COMPARE) {
            return current;
          }
          return [...current, slug];
        }),
    }),
    [selected]
  );

  const startCompare = () => {
    if (selected.length >= MIN_COMPARE) {
      router.push(buildCompareHref(selected));
    }
  };

  return (
    <>
      <Tabs className="mt-8" defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <ShelfList manifest={manifest} selection={selection} />
        </TabsContent>
        <TabsContent value="saved">
          <SavedList manifest={manifest} selection={selection} />
        </TabsContent>
      </Tabs>
      {selected.length > 0 && (
        <CompareBar
          count={selected.length}
          onClear={() => setSelected([])}
          onCompare={startCompare}
        />
      )}
    </>
  );
}
