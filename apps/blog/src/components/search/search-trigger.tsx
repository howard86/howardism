"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { useSearch } from "./search-provider";

/** The magnifying-glass button in the site bar that opens the command palette. */
export function SearchTrigger() {
  const { openSearch } = useSearch();
  return (
    <button
      aria-label="Search articles"
      className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      onClick={openSearch}
      type="button"
    >
      <HugeiconsIcon className="size-[18px]" icon={Search01Icon} />
    </button>
  );
}
