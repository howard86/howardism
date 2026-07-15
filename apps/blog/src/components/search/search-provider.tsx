"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";

const SearchPalette = dynamic(
  () => import("./search-palette").then((m) => m.SearchPalette),
  { ssr: false }
);

interface SearchContextValue {
  openSearch: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

/**
 * Owns the global command-palette open state and the Cmd/Ctrl+K shortcut, and
 * mounts the palette once for the whole app. Any descendant (e.g. the site bar's
 * search button) opens it via {@link useSearch}.
 */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);

  useKeyboardShortcut("k", openSearch, { ctrlOrMeta: true });

  const value = useMemo(() => ({ openSearch }), [openSearch]);

  return (
    <SearchContext value={value}>
      {children}
      <SearchPalette onOpenChange={setOpen} open={open} />
    </SearchContext>
  );
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return ctx;
}
