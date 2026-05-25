"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

const TranslatedSlugsContext = createContext<ReadonlySet<string>>(new Set());

interface TranslatedSlugsProviderProps {
  children: ReactNode;
  slugs: readonly string[];
}

/**
 * Surfaces the set of article slugs that have a committed zh-TW translation
 * to client components — particularly the locale switcher, which uses it to
 * suppress dead links to untranslated articles. The slug list is computed
 * server-side once per request (from `translations.json`) and serialised to
 * the client; ~100 short slugs is a few KB at most.
 */
export function TranslatedSlugsProvider({
  children,
  slugs,
}: TranslatedSlugsProviderProps) {
  const value = useMemo(() => new Set(slugs), [slugs]);
  return (
    <TranslatedSlugsContext.Provider value={value}>
      {children}
    </TranslatedSlugsContext.Provider>
  );
}

/** Read the translated-slug set from context (empty set if unprovided). */
export function useTranslatedSlugs(): ReadonlySet<string> {
  return useContext(TranslatedSlugsContext);
}
