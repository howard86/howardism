import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { PREFIXED_LOCALES } from "../articles/service";

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Guards the prefixed-locale subtree: only `/zh-TW/...` is valid (en is served
 * unprefixed by the sibling routes). Any other first segment 404s, so this
 * dynamic segment never shadows real paths. Chrome (Header/Footer) is inherited
 * from the parent (blog) layout.
 */
export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!(PREFIXED_LOCALES as readonly string[]).includes(locale)) {
    notFound();
  }
  return children;
}
