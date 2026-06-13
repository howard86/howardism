"use client";

import { cn } from "@howardism/ui/lib/utils";
import {
  BookmarkAdd01Icon,
  BookmarkCheck01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";

import { isSaved, toggleSave } from "@/lib/reading-store";

interface SaveButtonProps {
  className?: string;
  /** Notified with the new saved state after a toggle. */
  onToggle?: (saved: boolean) => void;
  /** Render the state word ("Save" / "Saved") next to the icon. */
  showLabel?: boolean;
  slug: string;
}

/**
 * Reusable save-for-later toggle. Reflects the persisted saved state (read on
 * mount to avoid a hydration mismatch — the server always renders the unsaved
 * state) and flips it on click. Used on the article page, listing rows, and
 * the Shelf.
 */
export function SaveButton({
  slug,
  className,
  showLabel = false,
  onToggle,
}: SaveButtonProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isSaved(slug));
  }, [slug]);

  const handleClick = () => {
    const next = toggleSave(slug);
    setSaved(next);
    onToggle?.(next);
  };

  return (
    <button
      aria-label={saved ? "Saved for later — remove" : "Save for later"}
      aria-pressed={saved}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full text-foreground-subtle transition-colors hover:text-brand aria-pressed:text-brand",
        showLabel
          ? "border border-border px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] aria-pressed:border-brand/40"
          : "size-7 justify-center",
        className
      )}
      onClick={handleClick}
      type="button"
    >
      <HugeiconsIcon
        className="size-[18px]"
        icon={saved ? BookmarkCheck01Icon : BookmarkAdd01Icon}
      />
      {showLabel && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
