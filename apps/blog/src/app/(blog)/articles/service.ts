import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import glob from "fast-glob";
import GithubSlugger from "github-slugger";
import type { StaticImageData } from "next/image";
import { cache } from "react";
import { z } from "zod";

import graphData from "@/data/article-graph.json";
import wikiLogData from "@/data/wiki-log.json";
import wikiSourcesData from "@/data/wiki-sources.json";
import { taggedHref } from "@/utils/tagged-href";

export interface Normalise<T> {
  entities: Record<string, T | undefined>;
  ids: string[];
}

export interface ArticleEntity {
  heroImage: StaticImageData;
  meta: ArticleMeta;
  position: number;
  slug: string;
}

/**
 * Mirror of `WIKI_TAGS` in `apps/cli/src/import-wiki/emit.ts`. Keep these
 * unions aligned — the wiki importer is the source of truth for which tags
 * can appear in graph-derived articles.
 */
export type ArticleTag = "Concept" | "Entity" | "Essay" | "Index" | "Changelog";

const ARTICLE_TAGS: readonly ArticleTag[] = [
  "Concept",
  "Entity",
  "Essay",
  "Index",
  "Changelog",
];

/**
 * Mirror of `WIKI_TOPICS` in `apps/cli/src/import-wiki/topics.ts`. The importer
 * derives an article's `topic` from its wiki tags; the home page groups work
 * into these five subject buckets.
 */
export type ArticleTopic =
  | "interaction"
  | "architecture"
  | "harness"
  | "alignment"
  | "orgs";

export const ARTICLE_TOPICS: readonly ArticleTopic[] = [
  "interaction",
  "architecture",
  "harness",
  "alignment",
  "orgs",
];

const SourceRefSchema = z.object({
  title: z.string(),
  url: z.url().optional(),
});

export type SourceRef = z.infer<typeof SourceRefSchema>;

const ArticleMetaSchema = z.object({
  archived: z.boolean().optional(),
  date: z.string(),
  description: z.string(),
  dropCap: z.boolean().optional(),
  imageAlt: z.string(),
  readingTime: z.number(),
  /**
   * Audit trail of external source documents the article was synthesised
   * from. Set by the wiki importer from `raw/<slug>.md` frontmatter; the
   * rendered `## Sources` block in the MDX body is derived from this list.
   */
  sources: z.array(SourceRefSchema).optional(),
  tag: z.enum(ARTICLE_TAGS),
  /**
   * The wiki note's real subject labels (lowercase kebab), passed through by
   * the importer. NOTE the deliberate naming proximity: singular `tag` above
   * is the article "kind" (Concept/Entity/…); plural `tags` here are the
   * free-form subjects that drive the chips and `/articles/tagged/[tag]`
   * routes; `topic` below is the single derived accent/grouping bucket.
   */
  tags: z.array(z.string()).optional(),
  title: z.string(),
  /**
   * Curated subject bucket derived by the wiki importer from the note's tags.
   * Drives the home page's topic plate stack. Absent on non-topical pages
   * (e.g. the wiki changelog).
   */
  topic: z.enum(ARTICLE_TOPICS).optional(),
});

export type ArticleMeta = z.infer<typeof ArticleMetaSchema>;

export interface SiblingNav {
  nextSlug: string | undefined;
  nextTitle: string | undefined;
  position: number;
  previousSlug: string | undefined;
  previousTitle: string | undefined;
}

export interface ArticleLink {
  meta: ArticleMeta;
  slug: string;
}

export interface ArticleHeading {
  depth: 2 | 3;
  id: string;
  text: string;
}

interface ArticleGraph {
  backlinks: Record<string, readonly string[] | undefined>;
  generatedOn: string;
  outgoing: Record<string, readonly string[] | undefined>;
  related: Record<string, readonly string[] | undefined>;
}

const graph: ArticleGraph = graphData;

const isArticleTag = (value: string): value is ArticleTag =>
  (ARTICLE_TAGS as readonly string[]).includes(value);

const toArticleLinks = (
  slugs: readonly string[] | undefined,
  visible: Normalise<ArticleEntity>
): ArticleLink[] => {
  if (!slugs) {
    return [];
  }
  const links: ArticleLink[] = [];
  for (const slug of slugs) {
    const entity = visible.entities[slug];
    if (entity) {
      links.push({ slug, meta: entity.meta });
    }
  }
  return links;
};

const MDX_SUFFIX = /\.mdx$/;
const ARTICLES_DIR = join(process.cwd(), "src", "content", "articles");

interface ArticleModule {
  heroImage?: StaticImageData;
  meta?: unknown;
}

const loadArticle = async (
  filename: string
): Promise<{ heroImage: StaticImageData; meta: ArticleMeta; slug: string }> => {
  const slug = filename.replace(MDX_SUFFIX, "");
  const mod = (await import(`@/content/articles/${filename}`)) as ArticleModule;
  const parsed = ArticleMetaSchema.safeParse(mod.meta);
  if (!parsed.success) {
    throw new Error(
      `Invalid article frontmatter for "${slug}": ${parsed.error.message}`
    );
  }
  if (!mod.heroImage) {
    throw new Error(
      `Article "${slug}" is missing the \`heroImage\` named export. Re-export the hero asset: \`export { default as heroImage } from './hero.png'\`.`
    );
  }
  return { slug, meta: parsed.data, heroImage: mod.heroImage };
};

export const getArticles = cache(
  async (): Promise<Normalise<ArticleEntity>> => {
    const filenames = await glob("*.mdx", { cwd: ARTICLES_DIR });

    const files = await Promise.all(filenames.map(loadArticle));

    files.sort(
      (a, b) =>
        new Date(b.meta.date).valueOf() - new Date(a.meta.date).valueOf()
    );

    const results: Normalise<ArticleEntity> = {
      ids: [],
      entities: {},
    };

    files.forEach((file, index) => {
      results.ids.push(file.slug);
      results.entities[file.slug] = {
        position: index,
        ...file,
      };
    });

    return results;
  }
);

export const getVisibleArticles = cache(
  async (): Promise<Normalise<ArticleEntity>> => {
    const all = await getArticles();
    const ids = all.ids.filter((id) => !all.entities[id]?.meta.archived);
    const entities: Record<string, ArticleEntity | undefined> = {};
    for (const id of ids) {
      entities[id] = all.entities[id];
    }
    return { ids, entities };
  }
);

export const getSlicedArticles = cache(
  async (count?: number): Promise<Normalise<ArticleEntity>> => {
    const visible = await getVisibleArticles();
    const ids = visible.ids.slice(0, count);
    const entities: Record<string, ArticleEntity | undefined> = {};
    for (const id of ids) {
      entities[id] = visible.entities[id];
    }
    return { ids, entities };
  }
);

export const getBacklinks = cache(
  async (slug: string): Promise<ArticleLink[]> => {
    const visible = await getVisibleArticles();
    return toArticleLinks(graph.backlinks[slug], visible);
  }
);

export const getOutgoing = cache(
  async (slug: string): Promise<ArticleLink[]> => {
    const visible = await getVisibleArticles();
    return toArticleLinks(graph.outgoing[slug], visible);
  }
);

export const getRelated = cache(
  async (slug: string): Promise<ArticleLink[]> => {
    const visible = await getVisibleArticles();
    return toArticleLinks(graph.related[slug], visible);
  }
);

export const getArticlesByTag = cache(
  async (tag: ArticleTag): Promise<ArticleEntity[]> => {
    const visible = await getVisibleArticles();
    const matches: ArticleEntity[] = [];
    for (const id of visible.ids) {
      const entity = visible.entities[id];
      if (entity && entity.meta.tag === tag) {
        matches.push(entity);
      }
    }
    return matches;
  }
);

export const getTagCounts = cache(
  async (): Promise<Record<ArticleTag, number>> => {
    const visible = await getVisibleArticles();
    const counts: Record<ArticleTag, number> = {
      Concept: 0,
      Entity: 0,
      Essay: 0,
      Index: 0,
      Changelog: 0,
    };
    for (const id of visible.ids) {
      const entity = visible.entities[id];
      if (!entity) {
        continue;
      }
      const { tag } = entity.meta;
      if (isArticleTag(tag)) {
        counts[tag] += 1;
      }
    }
    return counts;
  }
);

export const getArticlesByTopic = cache(
  async (topic: ArticleTopic): Promise<ArticleEntity[]> => {
    const visible = await getVisibleArticles();
    const matches: ArticleEntity[] = [];
    for (const id of visible.ids) {
      const entity = visible.entities[id];
      if (entity && entity.meta.topic === topic) {
        matches.push(entity);
      }
    }
    return matches;
  }
);

export const getTopicCounts = cache(
  async (): Promise<Record<ArticleTopic, number>> => {
    const visible = await getVisibleArticles();
    const counts = Object.fromEntries(
      ARTICLE_TOPICS.map((topic) => [topic, 0])
    ) as Record<ArticleTopic, number>;
    for (const id of visible.ids) {
      const topic = visible.entities[id]?.meta.topic;
      if (topic) {
        counts[topic] += 1;
      }
    }
    return counts;
  }
);

/**
 * Minimum number of articles a free-form subject `tag` must appear on before
 * it earns a `/articles/tagged/[tag]` page. Rarer tags still render as chips,
 * just non-clickable — this keeps us from generating dozens of thin pages.
 */
const MIN_TAGGED_ARTICLES = 2;

/**
 * Visible articles carrying `tag` in their free-form `tags` list, newest
 * first. Distinct from `getArticlesByTag`, which matches the singular `tag`
 * "kind" enum.
 */
export const getTaggedArticles = cache(
  async (tag: string): Promise<ArticleEntity[]> => {
    const visible = await getVisibleArticles();
    const matches: ArticleEntity[] = [];
    for (const id of visible.ids) {
      const entity = visible.entities[id];
      if (entity?.meta.tags?.includes(tag)) {
        matches.push(entity);
      }
    }
    return matches;
  }
);

export interface TagIndexEntry {
  count: number;
  /**
   * Where the chip links: the `/articles/tagged/[tag]` page for tags carried
   * by enough articles to earn one, or — for a tag on a single article — that
   * article itself.
   */
  href: string;
  tag: string;
}

/**
 * Every subject tag across visible articles as a clickable chip target,
 * ordered by reference count (descending) then name. Tags on at least
 * `MIN_TAGGED_ARTICLES` articles link to their `/articles/tagged/[tag]` page;
 * a tag on exactly one article has no such page and links straight to it.
 */
export const getTagIndex = cache(async (): Promise<TagIndexEntry[]> => {
  const visible = await getVisibleArticles();
  const slugsByTag = new Map<string, string[]>();
  for (const id of visible.ids) {
    const tags = visible.entities[id]?.meta.tags;
    if (!tags) {
      continue;
    }
    for (const tag of tags) {
      const slugs = slugsByTag.get(tag);
      if (slugs) {
        slugs.push(id);
      } else {
        slugsByTag.set(tag, [id]);
      }
    }
  }
  return [...slugsByTag.entries()]
    .map(([tag, slugs]) => ({
      tag,
      count: slugs.length,
      href:
        slugs.length >= MIN_TAGGED_ARTICLES
          ? taggedHref(tag)
          : `/articles/${slugs[0]}`,
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
});

/**
 * Subject tags that appear on at least `MIN_TAGGED_ARTICLES` visible
 * articles, sorted by frequency then name. These are the tags that get a
 * static `/articles/tagged/[tag]` page and clickable chips.
 */
export const getNavigableTags = cache(async (): Promise<string[]> => {
  const index = await getTagIndex();
  return index
    .filter((entry) => entry.count >= MIN_TAGGED_ARTICLES)
    .map((entry) => entry.tag);
});

/* ── wiki activity log + reading-list manifests (emitted by the importer) ── */

export interface WikiLogEntry {
  date: string;
  operation: string;
  refs: string[];
  subject: string;
}

export interface WikiSource {
  author?: string;
  citedBy: string[];
  kind: string;
  published?: string;
  title: string;
  url?: string;
}

export interface WikiLogBatch {
  date: string;
  entries: WikiLogEntry[];
}

const wikiLog = wikiLogData as { entries: WikiLogEntry[]; generatedOn: string };
const wikiSources = wikiSourcesData as {
  generatedOn: string;
  sources: WikiSource[];
};

/** Recent wiki operations, newest-first. `limit` caps the returned count. */
export const getWikiLog = (limit?: number): WikiLogEntry[] =>
  limit === undefined ? wikiLog.entries : wikiLog.entries.slice(0, limit);

/** Group consecutive same-date log entries into dated batches. */
export const groupWikiLogByDate = (entries: WikiLogEntry[]): WikiLogBatch[] => {
  const batches: WikiLogBatch[] = [];
  for (const entry of entries) {
    const last = batches.at(-1);
    if (last && last.date === entry.date) {
      last.entries.push(entry);
    } else {
      batches.push({ date: entry.date, entries: [entry] });
    }
  }
  return batches;
};

/** Raw reading-list sources, pre-sorted by citation count then recency. */
export const getWikiSources = (limit?: number): WikiSource[] =>
  limit === undefined
    ? wikiSources.sources
    : wikiSources.sources.slice(0, limit);

const SPARK_WEEKS = 8;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Per-topic activity sparkline: counts of articles published in each of the
 * last `SPARK_WEEKS` weeks, oldest→newest, anchored to the newest article date
 * so the most recent batch always registers. Returns `[]` for empty topics.
 */
export const getTopicSparklines = cache(
  async (): Promise<Record<ArticleTopic, number[]>> => {
    const visible = await getVisibleArticles();
    const dated = visible.ids
      .map((id) => visible.entities[id])
      .filter(
        (e): e is ArticleEntity => e !== undefined && e.meta.topic !== undefined
      );

    const anchor = dated.reduce(
      (max, e) => Math.max(max, new Date(e.meta.date).valueOf()),
      0
    );
    const start = anchor - (SPARK_WEEKS - 1) * MS_PER_WEEK;

    const result = Object.fromEntries(
      ARTICLE_TOPICS.map((topic) => [topic, new Array(SPARK_WEEKS).fill(0)])
    ) as Record<ArticleTopic, number[]>;

    for (const entity of dated) {
      const topic = entity.meta.topic;
      if (!topic) {
        continue;
      }
      const week = Math.floor(
        (new Date(entity.meta.date).valueOf() - start) / MS_PER_WEEK
      );
      if (week >= 0 && week < SPARK_WEEKS) {
        result[topic][week] += 1;
      }
    }
    return result;
  }
);

/**
 * The raw source most cited by a topic's articles — drives the topic-plate
 * "Sourced from" aside. Returns `undefined` when no source backs the topic.
 */
export const getTopicLeadSource = cache(
  async (topic: ArticleTopic): Promise<WikiSource | undefined> => {
    const visible = await getVisibleArticles();
    const topicSlugs = new Set(
      visible.ids.filter((id) => visible.entities[id]?.meta.topic === topic)
    );
    let best: WikiSource | undefined;
    let bestScore = 0;
    for (const source of wikiSources.sources) {
      const score = source.citedBy.filter((slug) =>
        topicSlugs.has(slug)
      ).length;
      if (score > bestScore) {
        best = source;
        bestScore = score;
      }
    }
    return best;
  }
);

const FRONTMATTER_FENCE = /^---\r?\n[\s\S]*?\r?\n---\r?\n/;
const CODE_FENCE = /^(?:```|~~~)/;
const HEADING_RE = /^(#{2,3})\s+(.+?)\s*$/;
const TRAILING_AUTOLINK_HASH = /\s*#\s*$/;
const LINE_SPLIT = /\r?\n/;

/**
 * Parse H2/H3 headings out of raw MDX. Skips frontmatter and the contents of
 * fenced code blocks so headings buried inside code samples never surface in
 * the TOC. Slugs are produced with `github-slugger`, matching what
 * `rehype-slug` writes onto the rendered DOM ids.
 */
export const getHeadings = cache(
  async (slug: string): Promise<ArticleHeading[]> => {
    const filePath = join(ARTICLES_DIR, `${slug}.mdx`);
    let raw: string;
    try {
      raw = await readFile(filePath, "utf8");
    } catch {
      return [];
    }

    const withoutFrontmatter = raw.replace(FRONTMATTER_FENCE, "");
    const slugger = new GithubSlugger();
    const headings: ArticleHeading[] = [];
    let insideCodeFence = false;

    for (const line of withoutFrontmatter.split(LINE_SPLIT)) {
      if (CODE_FENCE.test(line)) {
        insideCodeFence = !insideCodeFence;
        continue;
      }
      if (insideCodeFence) {
        continue;
      }
      const match = HEADING_RE.exec(line);
      if (!match) {
        continue;
      }
      const depth = match[1].length as 2 | 3;
      const text = match[2].replace(TRAILING_AUTOLINK_HASH, "").trim();
      if (!text) {
        continue;
      }
      headings.push({ depth, id: slugger.slug(text), text });
    }

    return headings;
  }
);

/**
 * Returns prev/next slug for the article-page footer, partitioned by archive
 * state so a visible article never links to an archived sibling and vice
 * versa. Position is 1-based within the same partition.
 */
export const getSiblings = cache(async (slug: string): Promise<SiblingNav> => {
  const all = await getArticles();
  const isArchived = all.entities[slug]?.meta.archived === true;
  const partition = all.ids.filter(
    (id) => (all.entities[id]?.meta.archived === true) === isArchived
  );
  const index = partition.indexOf(slug);
  if (index < 0) {
    return {
      previousSlug: undefined,
      previousTitle: undefined,
      nextSlug: undefined,
      nextTitle: undefined,
      position: 1,
    };
  }
  const previousSlug = partition[index + 1];
  const nextSlug = partition[index - 1];
  return {
    previousSlug,
    previousTitle: previousSlug
      ? all.entities[previousSlug]?.meta.title
      : undefined,
    nextSlug,
    nextTitle: nextSlug ? all.entities[nextSlug]?.meta.title : undefined,
    position: index + 1,
  };
});
