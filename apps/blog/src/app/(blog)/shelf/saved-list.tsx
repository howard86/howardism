"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";

import { SaveButton } from "@/components/save-button";
import { getSaved, type SavedEntry } from "@/lib/reading-store";
import type { ShelfManifestEntry } from "@/lib/shelf-rows";

import { DOMAIN_META } from "../articles/domain-meta";
import {
  ArchivedBadge,
  type ListSelection,
  ShelfArticleRow,
  toRowSelection,
} from "./shelf-article-row";

dayjs.extend(relativeTime);

/**
 * Saved tab: lists deliberately saved articles, newest-saved first, resolved
 * against the article manifest. Unsaving a row drops it from the list. Saves of
 * a now-missing article are simply not shown (the stored list is untouched).
 */
export function SavedList({
  manifest,
  selection,
}: {
  manifest: ShelfManifestEntry[];
  selection?: ListSelection;
}) {
  const [saved, setSaved] = useState<SavedEntry[] | null>(null);

  useEffect(() => {
    setSaved(getSaved());
  }, []);

  if (saved === null) {
    return null;
  }

  const bySlug = new Map(manifest.map((entry) => [entry.slug, entry]));
  const rows = saved
    .map((entry) => ({ entry, meta: bySlug.get(entry.slug) }))
    .filter(
      (row): row is { entry: SavedEntry; meta: ShelfManifestEntry } =>
        row.meta !== undefined
    );

  if (rows.length === 0) {
    return (
      <p className="mt-6 font-body text-[15px] text-muted-foreground leading-[1.6]">
        Nothing saved yet. Use the bookmark control on any article or listing to
        keep it here for later.
      </p>
    );
  }

  const handleToggle = (slug: string, nowSaved: boolean) => {
    if (!nowSaved) {
      setSaved((current) =>
        current ? current.filter((entry) => entry.slug !== slug) : current
      );
    }
  };

  return (
    <ul className="mt-2 flex list-none flex-col p-0">
      {rows.map(({ entry, meta }, index) => (
        <ShelfArticleRow
          accent={meta.domain ? DOMAIN_META[meta.domain].color : "var(--brand)"}
          badge={meta.archived ? <ArchivedBadge /> : undefined}
          control={
            <SaveButton
              onToggle={(nowSaved) => handleToggle(meta.slug, nowSaved)}
              slug={meta.slug}
            />
          }
          href={meta.href}
          key={meta.slug}
          label={meta.label}
          marker={meta.kindPrefix + String(index + 1).padStart(2, "0")}
          readingTime={meta.readingTime}
          selection={toRowSelection(selection, meta.slug, meta.title)}
          tags={meta.tags}
          timeText={`saved ${dayjs(entry.savedAt).fromNow()}`}
          title={meta.title}
        />
      ))}
    </ul>
  );
}
