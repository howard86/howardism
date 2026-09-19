"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";

const SearchPalette = dynamic(
  () => import("./search-palette").then((m) => m.SearchPalette),
  { ssr: false }
);

const WebMcpTools = dynamic(
  () => import("./webmcp-tools").then((m) => m.WebMcpTools),
  { ssr: false }
);

interface SearchContextValue {
  openSearch: () => void;
  /**
   * Start fetching the palette chunk without mounting it, so the first
   * Cmd+K / click opens instantly. Safe to call repeatedly — the module
   * registry dedupes.
   */
  warmSearch: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

/**
 * Owns the global command-palette open state and the Cmd/Ctrl+K shortcut, and
 * mounts the palette once for the whole app. Any descendant (e.g. the site bar's
 * search button) opens it via {@link useSearch}.
 *
 * Both children are mounted lazily on purpose. `next/dynamic` with
 * `ssr: false` defers *rendering*, not the fetch: rendering them
 * unconditionally pulled the palette (+ cmdk), the WebMCP tools and fuse.js
 * down on every page load right after hydration. The palette now mounts on
 * first open (warmed on trigger hover/focus and on the first Cmd/Ctrl
 * chord), and the WebMCP tools only where `document.modelContext` exists —
 * Chrome 150 behind a flag, a no-op everywhere else.
 */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [paletteMounted, setPaletteMounted] = useState(false);
  const [webMcpSupported, setWebMcpSupported] = useState(false);

  const warmSearch = useCallback(() => {
    import("./search-palette").catch(() => {
      // Warming is best-effort: the real mount re-imports and surfaces failures.
    });
  }, []);

  const openSearch = useCallback(() => {
    setPaletteMounted(true);
    setOpen(true);
  }, []);

  useKeyboardShortcut("k", openSearch, { ctrlOrMeta: true });

  useEffect(() => {
    if ("modelContext" in document) {
      setWebMcpSupported(true);
    }
  }, []);

  useEffect(() => {
    // Keyboard users never hover the trigger, so warm on the first Cmd/Ctrl
    // chord instead: holding the modifier lands a keydown before the "k".
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        warmSearch();
        document.removeEventListener("keydown", onKeyDown);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [warmSearch]);

  const value = useMemo(
    () => ({ openSearch, warmSearch }),
    [openSearch, warmSearch]
  );

  return (
    <SearchContext value={value}>
      {children}
      {paletteMounted ? (
        <SearchPalette onOpenChange={setOpen} open={open} />
      ) : null}
      {webMcpSupported ? <WebMcpTools /> : null}
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
