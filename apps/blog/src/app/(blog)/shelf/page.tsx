import type { Metadata } from "next";

import { env } from "@/config/env";

import { PlatePage } from "../_shell/plate-page";
import { ContinueReading } from "./continue-reading";
import { ShelfStats } from "./shelf-stats";
import { ShelfTabs } from "./shelf-tabs";

const SHELF_URL = `${env.NEXT_PUBLIC_DOMAIN_NAME}/shelf`;

export const dynamic = "error";

export const metadata: Metadata = {
  title: "Shelf — Howardism",
  description:
    "Your reading history: the articles you've read, newest first, kept locally in your browser.",
  alternates: { canonical: SHELF_URL },
  openGraph: { url: SHELF_URL },
  // Personal, browser-local view — empty for everyone server-side, so keep it
  // out of the search index.
  robots: { index: false, follow: true },
};

export default function ShelfPage() {
  return (
    <PlatePage
      headerChildren={
        <>
          <p className="mt-6 max-w-[680px] font-body text-[clamp(16px,2.2vw,18px)] text-muted-foreground leading-[1.55]">
            Articles you&apos;ve meaningfully read, newest first. This list
            lives only in your browser — nothing is sent anywhere.
          </p>
          <ShelfStats />
        </>
      }
      plate="shelf"
      title="Your shelf,"
      titleAccent="read & remembered."
      width="index"
    >
      <ContinueReading />
      <ShelfTabs />
    </PlatePage>
  );
}
