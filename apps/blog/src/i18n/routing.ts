import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh-TW"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
export const DEFAULT_LOCALE = routing.defaultLocale;
