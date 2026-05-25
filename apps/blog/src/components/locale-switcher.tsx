"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

import { useTranslatedSlugs } from "./translated-slugs-provider";

/**
 * Recognise an article slug page (e.g. `/articles/foo`) without matching
 * sibling routes like `/articles/tag/foo` or `/articles/topic/foo` — those
 * have an extra path segment after the kind, so the single-segment match
 * here ignores them. The route group `(blog)` is invisible in pathname.
 */
const ARTICLE_SLUG_PATH = /^\/articles\/([^/]+)\/?$/;

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("LocaleSwitcher");
  const translatedSlugs = useTranslatedSlugs();

  const targetLocale: Locale = locale === "en" ? "zh-TW" : "en";
  const articleSlug = pathname.match(ARTICLE_SLUG_PATH)?.[1];

  // Going EN→zh-TW lands on `/zh-TW/articles/<slug>`, which 404s when no
  // committed translation exists for that slug. Hide the toggle in that
  // case rather than offering a dead link. Going zh-TW→EN is always safe
  // because EN is the source of truth.
  const isUntranslatedTarget =
    targetLocale === "zh-TW" &&
    articleSlug !== undefined &&
    !translatedSlugs.has(articleSlug);
  if (isUntranslatedTarget) {
    return null;
  }

  return (
    <Link
      aria-label={t("switchLocale")}
      className="rounded-full border border-border px-2.5 py-1 font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em] no-underline transition-colors hover:border-brand hover:text-brand"
      href={pathname}
      locale={targetLocale}
    >
      {t(targetLocale)}
    </Link>
  );
}
