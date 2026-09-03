import { DOMAIN_META } from "@/app/(blog)/articles/domain-meta";
import { kindMetaFor } from "@/app/(blog)/articles/kind-meta";
import {
  type ArticleEntity,
  getArticles,
  type Normalise,
} from "@/app/(blog)/articles/service";
import type { ShelfManifestEntry } from "@/lib/shelf-rows";

export const dynamic = "force-static";

/**
 * Every article, archived included — not `getVisibleArticles()` — so a
 * previously-read-then-archived article still resolves to its archived
 * badge on the Shelf instead of a "no longer available" tombstone.
 */
export function buildManifestEntries(
  articles: Normalise<ArticleEntity>
): ShelfManifestEntry[] {
  const manifest: ShelfManifestEntry[] = [];
  for (const id of articles.ids) {
    const entity = articles.entities[id];
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
      domain: meta.domain,
      kindPrefix: kindMetaFor(meta.tag).prefix,
      readingTime: meta.readingTime,
      tags: meta.tags ?? [],
    });
  }
  return manifest;
}

export async function GET() {
  const manifest = buildManifestEntries(await getArticles());

  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
