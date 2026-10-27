import type { Metadata } from "next";
import { Suspense } from "react";

import { env } from "@/config/env";

import { CompareLoader } from "./compare-loader";

export const metadata: Metadata = {
  title: "Compare — Howardism",
  description:
    "Read up to three articles side by side to cross-reference them.",
  alternates: { canonical: `${env.NEXT_PUBLIC_DOMAIN_NAME}/compare` },
  // URL-driven tool view, not indexable content.
  robots: { index: false, follow: true },
};

/**
 * Static shell: `?ids=` is resolved on the client (`CompareLoader`), so the
 * page prerenders under `output: "export"`. Only the compare body sits inside
 * Suspense — wrapping a layout-level `useSearchParams` consumer would empty
 * the static chrome from the prerendered HTML.
 */
export default function ComparePage() {
  return (
    <Suspense fallback={null}>
      <CompareLoader />
    </Suspense>
  );
}
