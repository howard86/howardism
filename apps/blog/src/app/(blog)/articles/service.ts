import "server-only";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  WIKI_DOMAINS,
  WIKI_TAGS,
  type WikiDomain,
  type WikiTag,
} from "@howardism/article-contract";
import {
  ArticleContractSchema,
  type SourceRefSchema,
} from "@howardism/article-contract/schema";
import { surfaceHash } from "@howardism/article-contract/surface";
import glob from "fast-glob";
import type { StaticImageData } from "next/image";
import { cache } from "react";
import { z } from "zod";

import graphData from "@/data/article-graph.json";
import openQuestionsData from "@/data/open-questions.json";
import translationsData from "@/data/translations.json";
import wikiSourcesData from "@/data/wiki-sources.json";
import { taggedHref } from "@/utils/tagged-href";

export type ArticleTag = WikiTag;
export type ArticleDomain = WikiDomain;
export const ARTICLE_TAGS = WIKI_TAGS;
export const ARTICLE_DOMAINS = WIKI_DOMAINS;

export type SourceRef = z.infer<typeof SourceRefSchema>;

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

const ArticleMetaSchema = ArticleContractSchema.extend({
  archived: z.boolean().optional(),
  dropCap: z.boolean().optional(),
  imageAlt: z.string(),
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

/**
 * Cross-reference links for an article: inbound citations (`backlinks`) and
 * curated `related` reading. Both lists are visible-only and preserve the
 * graph's recorded edge order; an unknown/unlinked slug yields empty arrays.
 */
export interface ArticleConnections {
  backlinks: ArticleLink[];
  related: ArticleLink[];
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

/**
 * Whether `slug` is a known English article (all ids, archived included) — the
 * exact set the route used to prerender. On-demand rendering uses it to 404
 * unknown slugs instead of throwing on a missing MDX import.
 */
export const articleExists = cache(async (slug: string): Promise<boolean> => {
  const { entities } = await getArticles();
  return entities[slug] !== undefined;
});

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

export const getArticleConnections = cache(
  async (slug: string): Promise<ArticleConnections> => {
    const visible = await getVisibleArticles();
    return {
      backlinks: toArticleLinks(graph.backlinks[slug], visible),
      related: toArticleLinks(graph.related[slug], visible),
    };
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

export const getArticlesByDomain = cache(
  async (domain: ArticleDomain): Promise<ArticleEntity[]> => {
    const visible = await getVisibleArticles();
    const matches: ArticleEntity[] = [];
    for (const id of visible.ids) {
      const entity = visible.entities[id];
      if (entity && entity.meta.domain === domain) {
        matches.push(entity);
      }
    }
    return matches;
  }
);

export const getDomainCounts = cache(
  async (): Promise<Record<ArticleDomain, number>> => {
    const visible = await getVisibleArticles();
    const counts = Object.fromEntries(
      ARTICLE_DOMAINS.map((domain) => [domain, 0])
    ) as Record<ArticleDomain, number>;
    for (const id of visible.ids) {
      const domain = visible.entities[id]?.meta.domain;
      if (domain) {
        counts[domain] += 1;
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

/**
 * `getNavigableTags` as a membership set, memoised so chip surfaces (the index
 * plates and each article page) test `navigable.has(tag)` without rebuilding
 * the set per render.
 */
export const getNavigableTagSet = cache(
  async (): Promise<ReadonlySet<string>> => new Set(await getNavigableTags())
);

/* ── reading-list manifest (emitted by the importer) ── */

export interface WikiSource {
  author?: string;
  citedBy: string[];
  kind: string;
  published?: string;
  title: string;
  url?: string;
}

const wikiSources = wikiSourcesData as {
  generatedOn: string;
  sources: WikiSource[];
};

/** Raw reading-list sources, pre-sorted by citation count then recency. */
export const getWikiSources = (limit?: number): WikiSource[] =>
  limit === undefined
    ? wikiSources.sources
    : wikiSources.sources.slice(0, limit);

const SPARK_WEEKS = 8;
const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Per-domain activity sparkline: counts of articles published in each of the
 * last `SPARK_WEEKS` weeks, oldest→newest, anchored to the newest article date
 * so the most recent batch always registers. Returns `[]` for empty domains.
 */
export const getDomainSparklines = cache(
  async (): Promise<Record<ArticleDomain, number[]>> => {
    const visible = await getVisibleArticles();
    const dated = visible.ids
      .map((id) => visible.entities[id])
      .filter(
        (e): e is ArticleEntity =>
          e !== undefined && e.meta.domain !== undefined
      );

    const anchor = dated.reduce(
      (max, e) => Math.max(max, new Date(e.meta.date).valueOf()),
      0
    );
    const start = anchor - (SPARK_WEEKS - 1) * MS_PER_WEEK;

    const result = Object.fromEntries(
      ARTICLE_DOMAINS.map((domain) => [domain, new Array(SPARK_WEEKS).fill(0)])
    ) as Record<ArticleDomain, number[]>;

    for (const entity of dated) {
      const domain = entity.meta.domain;
      if (!domain) {
        continue;
      }
      const week = Math.floor(
        (new Date(entity.meta.date).valueOf() - start) / MS_PER_WEEK
      );
      if (week >= 0 && week < SPARK_WEEKS) {
        result[domain][week] += 1;
      }
    }
    return result;
  }
);

/**
 * The raw source most cited by a domain's articles — drives the domain-plate
 * "Sourced from" aside. Returns `undefined` when no source backs the domain.
 */
export const getDomainLeadSource = cache(
  async (domain: ArticleDomain): Promise<WikiSource | undefined> => {
    const visible = await getVisibleArticles();
    const domainSlugs = new Set(
      visible.ids.filter((id) => visible.entities[id]?.meta.domain === domain)
    );
    let best: WikiSource | undefined;
    let bestScore = 0;
    for (const source of wikiSources.sources) {
      const score = source.citedBy.filter((slug) =>
        domainSlugs.has(slug)
      ).length;
      if (score > bestScore) {
        best = source;
        bestScore = score;
      }
    }
    return best;
  }
);

/* ── open-questions backlog (emitted by the importer) ── */

export interface OpenQuestionConcept {
  domain: ArticleDomain;
  questions: string[];
  slug: string;
  title: string;
}

const openQuestions = openQuestionsData as {
  byConcept: OpenQuestionConcept[];
  generatedOn: string;
};

/** Every concept that still has unanswered questions, title-sorted. */
export const getOpenQuestions = (): OpenQuestionConcept[] =>
  openQuestions.byConcept;

/** The open-questions concepts filed under a single domain. */
export const getOpenQuestionsByDomain = (
  domain: ArticleDomain
): OpenQuestionConcept[] =>
  openQuestions.byConcept.filter((concept) => concept.domain === domain);

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

/* ── localization (zh-TW) ── */

export type Locale = "en" | "zh-TW";
export const DEFAULT_LOCALE: Locale = "en";
/** Non-default locales served under a path prefix (en stays unprefixed). */
export const PREFIXED_LOCALES: readonly Locale[] = ["zh-TW"];

interface TranslationRecord {
  costUsd: number | null;
  credits: number | null;
  durationMs: number;
  engine: string;
  model: string | null;
  sourceHash: string;
  sourceTitle: string | null;
  translatedAt: string;
}

const translations = translationsData as {
  articles: Record<string, TranslationRecord>;
  generatedOn: string;
  locale: string;
};

const translatedSet = new Set(Object.keys(translations.articles));

/** Slugs that have a committed zh-TW translation (per translations.json). */
export const getTranslatedSlugs = (): string[] => [...translatedSet].sort();

/** Whether `slug` has a zh-TW translation available. */
export const hasTranslation = (slug: string): boolean =>
  translatedSet.has(slug);

/**
 * Whether the zh-TW translation for `slug` is stale — i.e. the EN source has
 * changed since the translation was recorded. Returns false if no translation
 * exists or the source file cannot be read.
 */
export const isTranslationStale = (slug: string): boolean => {
  const record = translations.articles[slug];
  if (!record) {
    return false;
  }
  try {
    const rawMdx = readFileSync(join(ARTICLES_DIR, `${slug}.mdx`), "utf8");
    return surfaceHash(rawMdx) !== record.sourceHash;
  } catch {
    return false;
  }
};
