import { DOMAIN_META } from "@/app/(blog)/articles/domain-meta";
import { kindMetaFor } from "@/app/(blog)/articles/kind-meta";
import { getVisibleArticles } from "@/app/(blog)/articles/service";
import type { ShelfManifestEntry } from "@/lib/shelf-rows";

export const dynamic = "force-static";

export async function GET() {
  const { ids, entities } = await getVisibleArticles();

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
      domain: meta.domain,
      kindPrefix: kindMetaFor(meta.tag).prefix,
      readingTime: meta.readingTime,
      tags: meta.tags ?? [],
    });
  }

  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
