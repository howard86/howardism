/**
 * Augment `next-intl`'s `AppConfig` with the project's locales and message
 * shape so that `useTranslations(...)` / `getTranslations(...)` give
 * compile-time errors on unknown namespaces or keys, and so that the locale
 * type narrows to the routing's literal union instead of `string`.
 *
 * Both locale bundles must declare the same keys — enforced at runtime by
 * `src/__tests__/messages-parity.test.ts` — so picking either one as the
 * source of truth here is safe.
 */

import type { routing } from "@/i18n/routing";
import type messages from "../../messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
