import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Container } from "@/app/(common)/container";

/**
 * Localised 404 served when `notFound()` is called inside the `[locale]`
 * segment — picks up `NextIntlClientProvider` from the locale layout, so
 * `getTranslations()` resolves messages for the active request locale.
 *
 * The root-level `app/not-found.tsx` remains as the English-only fallback
 * for paths that fall outside the locale segment entirely.
 */
export default async function LocaleNotFound() {
  const t = await getTranslations("NotFound");
  return (
    <Container className="mt-16 flex flex-col items-center text-center sm:mt-32">
      <h1 className="font-display font-semibold text-5xl text-foreground tracking-tight sm:text-6xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-prose font-body text-muted-foreground">
        {t("message")}
      </p>
      <Link
        className="mt-8 font-medium text-primary text-sm underline-offset-4 hover:underline"
        href="/articles"
      >
        {t("backToIndex")}
      </Link>
    </Container>
  );
}
