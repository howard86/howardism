"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { Container } from "@/app/(common)/container";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Localised error boundary scoped to the `[locale]` segment. Renders within
 * the locale layout's `NextIntlClientProvider`, so `useTranslations()` works
 * client-side for the active request locale.
 *
 * The root-level `app/error.tsx` remains as the English-only fallback for
 * errors that escape the locale segment.
 */
export default function LocaleError({ error, reset }: ErrorProps) {
  const t = useTranslations("Error");
  return (
    <Container className="mt-16 flex flex-col items-center text-center sm:mt-32">
      <h1 className="font-display font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-prose font-body text-muted-foreground">
        {t("message")}
        {error.digest ? t("errorId", { digest: error.digest }) : ""}
      </p>
      <div className="mt-8 flex gap-4">
        <button
          className="font-medium text-primary text-sm underline-offset-4 hover:underline"
          onClick={reset}
          type="button"
        >
          {t("tryAgain")}
        </button>
        <Link
          className="font-medium text-muted-foreground text-sm underline-offset-4 hover:underline"
          href="/"
        >
          {t("goHome")}
        </Link>
      </div>
    </Container>
  );
}
