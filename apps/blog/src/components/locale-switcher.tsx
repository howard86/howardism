"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

const ZH_TW_PREFIX = /^\/zh-TW/;

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const targetLocale = locale === "en" ? "zh-TW" : "en";
  let href: string;

  if (locale === "zh-TW") {
    href = pathname.replace(ZH_TW_PREFIX, "") || "/";
  } else {
    href = `/zh-TW${pathname}`;
  }

  return (
    <Link
      aria-label={`Switch to ${targetLocale === "zh-TW" ? "中文" : "English"}`}
      className="rounded-full border border-border px-2.5 py-1 font-mono text-[10.5px] text-foreground-subtle uppercase tracking-[0.14em] no-underline transition-colors hover:border-brand hover:text-brand"
      href={href}
    >
      {targetLocale === "zh-TW" ? "中文" : "EN"}
    </Link>
  );
}
