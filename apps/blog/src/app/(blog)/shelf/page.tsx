import type { Metadata } from "next";

import { env } from "@/config/env";
import type { ShelfManifestEntry } from "@/lib/shelf-rows";

import { PlatePage } from "../_shell/plate-page";
import { DOMAIN_META } from "../articles/domain-meta";
import { getArticles } from "../articles/service";
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

export default async function ShelfPage() {
  const { ids, entities } = await getArticles();

  const manifest: ShelfManifestEntry[] = [];
  for (const id of ids) {
    const entity = entities[id];
    if (!entity) {
      continue;
    }
    const { meta } = entity;
    manifest.push({
      slug: id,
      title: meta.title,
      label: meta.domain ? DOMAIN_META[meta.domain].label : meta.tag,
      href: `/articles/${id}`,
      archived: meta.archived === true,
    });
  }

  return (
    <PlatePage
      header="compact"
      headerChildren={
        <p className="max-w-[560px] font-body text-[15px] text-muted-foreground leading-[1.6]">
          Articles you&apos;ve meaningfully read, newest first. This list lives
          only in your browser — nothing is sent anywhere.
        </p>
      }
      plate="shelf"
      title="Your shelf,"
      titleAccent="read & remembered."
      width="read"
    >
      <ShelfTabs manifest={manifest} />
    </PlatePage>
  );
}
