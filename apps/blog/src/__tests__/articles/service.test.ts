import { describe, expect, it } from "bun:test";
import {
  type ArticleTag,
  articleExists,
  getArticleConnections,
  getArticlePreviewMeta,
  getArticlesByTag,
  getNavigableTagSet,
  getSiblings,
  getSlicedArticles,
  getTagCounts,
  getVisibleArticles,
} from "@/app/(blog)/articles/service";
import graphData from "@/data/article-graph.json";

// A slug that the cli-engineer's graph generator is known to produce both
// inbound and outbound edges for, and that is not archived.
const KNOWN_SLUG = "agent-harness-engineering";

const WIKI_TAGS = ["Concept", "Entity", "Essay", "Index"] as const;

const tagsSet: ReadonlySet<string> = new Set(WIKI_TAGS);

describe("graph-backed service helpers", () => {
  it("getArticleConnections returns backlinks in the graph's recorded order, visible only", async () => {
    const visible = await getVisibleArticles();
    const visibleSlugs = new Set(visible.ids);

    const graphSlugs = (graphData.backlinks[KNOWN_SLUG] ?? []).map(
      (edge) => edge.slug
    );
    const expectedVisible = graphSlugs.filter((slug) => visibleSlugs.has(slug));

    const { backlinks } = await getArticleConnections(KNOWN_SLUG);

    expect(backlinks.length).toBe(expectedVisible.length);
    expect(backlinks.map((link) => link.slug)).toEqual(expectedVisible);
    for (const link of backlinks) {
      expect(visibleSlugs.has(link.slug)).toBe(true);
      const entity = visible.entities[link.slug];
      expect(entity).toBeDefined();
      expect(link.meta).toMatchObject({
        description: entity?.meta.description,
        domain: entity?.meta.domain,
        tag: entity?.meta.tag,
        title: entity?.meta.title,
      });
    }
  });

  it("getArticleConnections returns at most five visible related links", async () => {
    const { related } = await getArticleConnections(KNOWN_SLUG);
    expect(related.length).toBeLessThanOrEqual(5);

    const visible = await getVisibleArticles();
    const visibleSlugs = new Set(visible.ids);
    for (const link of related) {
      expect(visibleSlugs.has(link.slug)).toBe(true);
      expect(link.slug).not.toBe(KNOWN_SLUG);
    }
  });

  it("getArticleConnections returns both backlinks and related in a single call", async () => {
    const connections = await getArticleConnections(KNOWN_SLUG);
    expect(connections).toHaveProperty("backlinks");
    expect(connections).toHaveProperty("related");
    expect(Array.isArray(connections.backlinks)).toBe(true);
    expect(Array.isArray(connections.related)).toBe(true);
  });

  it("getArticleConnections returns empty arrays for an unknown slug", async () => {
    const unknown = "definitely-not-a-real-slug-xyz";
    const { backlinks, related } = await getArticleConnections(unknown);
    expect(backlinks).toEqual([]);
    expect(related).toEqual([]);
  });
});

describe("tag-aware service helpers", () => {
  it("getArticlesByTag('Entity') returns only Entity-tagged visible articles", async () => {
    const entities = await getArticlesByTag("Entity");

    expect(entities.length).toBeGreaterThan(0);
    for (const entity of entities) {
      expect(entity.meta.tag).toBe("Entity");
      expect(entity.meta.archived).not.toBe(true);
    }
  });

  it("getArticlesByTag returns ArticleEntity items sorted by date desc (inherited from getArticles)", async () => {
    const entries = await getArticlesByTag("Concept");
    for (let i = 1; i < entries.length; i++) {
      const previous = new Date(entries[i - 1]?.meta.date ?? "").valueOf();
      const current = new Date(entries[i]?.meta.date ?? "").valueOf();
      expect(previous).toBeGreaterThanOrEqual(current);
    }
  });

  it("getVisibleArticles keeps ids and entities in sync (no archived leak)", async () => {
    const visible = await getVisibleArticles();

    expect(Object.keys(visible.entities).length).toBe(visible.ids.length);
    for (const id of visible.ids) {
      expect(visible.entities[id]).toBeDefined();
    }
    for (const key of Object.keys(visible.entities)) {
      expect(visible.ids).toContain(key);
      expect(visible.entities[key]?.meta.archived).not.toBe(true);
    }
  });

  it("getSlicedArticles keeps ids and entities in sync", async () => {
    const sliced = await getSlicedArticles(3);
    expect(sliced.ids.length).toBe(3);
    expect(Object.keys(sliced.entities).length).toBe(3);
    for (const id of sliced.ids) {
      expect(sliced.entities[id]).toBeDefined();
    }
    for (const key of Object.keys(sliced.entities)) {
      expect(sliced.ids).toContain(key);
    }
  });

  it("getTagCounts sums to the count of visible articles tagged with a wiki tag", async () => {
    const visible = await getVisibleArticles();
    const counts = await getTagCounts();

    let expectedWikiTagged = 0;
    for (const id of visible.ids) {
      const entity = visible.entities[id];
      if (entity && tagsSet.has(entity.meta.tag)) {
        expectedWikiTagged += 1;
      }
    }

    const total = WIKI_TAGS.reduce<number>((acc, tag) => acc + counts[tag], 0);
    expect(total).toBe(expectedWikiTagged);

    for (const tag of WIKI_TAGS) {
      const tagged: ArticleTag = tag;
      const articles = await getArticlesByTag(tagged);
      expect(counts[tagged]).toBe(articles.length);
    }
  });
});

describe("navigation-manifest service helpers", () => {
  it("keeps existence, siblings and navigable tags in parity with the corpus", async () => {
    const visible = await getVisibleArticles();
    const orderedSlugs = [...visible.ids].sort((a, b) => {
      const dateA = visible.entities[a]?.meta.date ?? "";
      const dateB = visible.entities[b]?.meta.date ?? "";
      return (
        new Date(dateB).valueOf() - new Date(dateA).valueOf() ||
        a.localeCompare(b)
      );
    });
    const slug = orderedSlugs[Math.floor(orderedSlugs.length / 2)];
    expect(slug).toBeDefined();
    if (!slug) {
      return;
    }
    const entity = visible.entities[slug];
    expect(entity).toBeDefined();
    if (!entity) {
      return;
    }

    expect(await articleExists(slug)).toBe(true);
    expect(await articleExists("definitely-not-a-real-slug-xyz")).toBe(false);
    expect(getArticlePreviewMeta(slug)).toEqual({
      description: entity.meta.description,
      tag: entity.meta.tag,
      title: entity.meta.title,
    });
    expect(getArticlePreviewMeta("definitely-not-a-real-slug-xyz")).toBe(
      undefined
    );

    const expectedPreviousSlug = orderedSlugs[orderedSlugs.indexOf(slug) + 1];
    const expectedNextSlug = orderedSlugs[orderedSlugs.indexOf(slug) - 1];
    expect(await getSiblings(slug)).toEqual({
      previousSlug: expectedPreviousSlug,
      previousTitle: expectedPreviousSlug
        ? visible.entities[expectedPreviousSlug]?.meta.title
        : undefined,
      nextSlug: expectedNextSlug,
      nextTitle: expectedNextSlug
        ? visible.entities[expectedNextSlug]?.meta.title
        : undefined,
      position: orderedSlugs.indexOf(slug) + 1,
    });

    const expectedTags = new Set<string>();
    const counts = new Map<string, number>();
    for (const id of visible.ids) {
      for (const tag of visible.entities[id]?.meta.tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    for (const [tag, count] of counts) {
      if (count >= 2) {
        expectedTags.add(tag);
      }
    }
    expect(await getNavigableTagSet()).toEqual(expectedTags);
  });
});
