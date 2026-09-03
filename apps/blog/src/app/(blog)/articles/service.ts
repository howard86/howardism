import "server-only";

import {
  WIKI_DOMAINS,
  WIKI_TAGS,
  type WikiDomain,
  type WikiTag,
} from "@howardism/article-contract";
import {
  type ArticleMeta,
  parseArticlesMeta,
} from "@howardism/article-contract/manifests/articles-meta";
import {
  type BacklinkEdge,
  parseArticleGraph,
} from "@howardism/article-contract/manifests/graph";
import {
  type OpenQuestionConcept,
  parseOpenQuestions,
} from "@howardism/article-contract/manifests/open-questions";
import { parseTranslations } from "@howardism/article-contract/manifests/translations";
import {
  parseWikiSources,
  type WikiSource,
} from "@howardism/article-contract/manifests/wiki-sources";
import type { SourceRefSchema } from "@howardism/article-contract/schema";
import { cache } from "react";
import type { z } from "zod";

import graphData from "@/data/article-graph.json";
import articlesMetaData from "@/data/articles-meta.json";
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
  /** `meta.date` as epoch ms, parsed once so date sorts compare numbers. */
  dateMs: number;
  meta: ArticleMeta;
  position: number;
  slug: string;
  /** Hash of the translatable surface — see {@link isTranslationStale}. */
  sourceHash: string;
}

export type { ArticleMeta } from "@howardism/article-contract/manifests/articles-meta";

export interface SiblingNav {
  nextSlug: string | undefined;
  nextTitle: string | undefined;
  position: number;
  previousSlug: string | undefined;
  previousTitle: string | undefined;
}

export interface ArticleLink {
  /** How many times the citing article links here. Backlinks only. */
  citedCount?: number;
  /** The citing line, quoted verbatim, when the citation sits in prose. */
  citedIn?: string;
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

const graph = parseArticleGraph(graphData);

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

/**
 * Backlink edges as links, keeping the manifest's weight ordering and carrying
 * the citing sentence through so the reader can tell a discussion from a
 * one-line mention without opening either.
 */
const toBacklinks = (
  edges: readonly BacklinkEdge[] | undefined,
  visible: Normalise<ArticleEntity>
): ArticleLink[] => {
  if (!edges) {
    return [];
  }
  const links: ArticleLink[] = [];
  for (const edge of edges) {
    const entity = visible.entities[edge.slug];
    if (entity) {
      const link: ArticleLink = {
        slug: edge.slug,
        meta: entity.meta,
        citedCount: edge.count,
      };
      if (edge.context !== undefined) {
        link.citedIn = edge.context;
      }
      links.push(link);
    }
  }
  return links;
};

/**
 * Process-wide memo for a zero-arg loader. React's `cache()` is scoped to a
 * single render pass, so the ~600 prerendered routes each re-ran the whole
 * article load: 176 cold runs and 24.1s of cumulative CPU per build, measured.
 * The corpus is immutable for the life of the build, so one promise per process
 * is enough — that measured 10 cold runs and 2.0s.
 */
export const once = <T>(load: () => Promise<T>): (() => Promise<T>) => {
  let pending: Promise<T> | null = null;
  return () => {
    pending ??= load();
    return pending;
  };
};

const articlesMeta = parseArticlesMeta(articlesMetaData);

/**
 * The manifest as this service's entity table. It replaces a load that globbed
 * the articles directory and dynamically imported all 427 compiled MDX modules
 * for their `meta` export — the ~200ms per process {@link once} describes. The
 * manifest is already ordered newest-first, so `ids` is its slug column.
 *
 * Built at module scope rather than behind `once`: the JSON is static for the
 * life of the process, and {@link isTranslationStale} needs the hashes without
 * awaiting.
 */
const allArticles: Normalise<ArticleEntity> = { ids: [], entities: {} };
articlesMeta.articles.forEach((entry, index) => {
  allArticles.ids.push(entry.slug);
  allArticles.entities[entry.slug] = {
    dateMs: Date.parse(entry.meta.date),
    meta: entry.meta,
    position: index,
    slug: entry.slug,
    sourceHash: entry.sourceHash,
  };
});

export const getArticles = (): Promise<Normalise<ArticleEntity>> =>
  Promise.resolve(allArticles);

/**
 * Whether `slug` is a known English article (all ids, archived included) — the
 * exact set the route used to prerender. On-demand rendering uses it to 404
 * unknown slugs instead of throwing on a missing MDX import.
 */
export const articleExists = cache(async (slug: string): Promise<boolean> => {
  const { entities } = await getArticles();
  return entities[slug] !== undefined;
});

export const getVisibleArticles = once(
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
      backlinks: toBacklinks(graph.backlinks[slug], visible),
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

export const getTagCounts = once(
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

/**
 * A domain's members are its concepts/entities/essays — never its MOC. A MOC
 * carries `tag: Index` and its own `domain`, but it's the curated *map* of the
 * domain, not a note within it, so it's excluded from every domain aggregation
 * (counts, listings, sparklines, lead source). The open-questions backlog (also
 * `Index`) drops out the same way.
 */
const isDomainMember = (
  entity: ArticleEntity | undefined
): entity is ArticleEntity =>
  entity !== undefined && entity.meta.tag !== "Index";

/**
 * Every domain's members in one pass, in `ids` order, empty domains included.
 * The home page plates fourteen domains at once and the counts, sparklines and
 * lead source all want the same partition, so it is computed once rather than
 * scanned per domain.
 */
export const getArticlesGroupedByDomain = once(
  async (): Promise<Record<ArticleDomain, ArticleEntity[]>> => {
    const visible = await getVisibleArticles();
    const grouped = Object.fromEntries(
      ARTICLE_DOMAINS.map((domain) => [domain, [] as ArticleEntity[]])
    ) as Record<ArticleDomain, ArticleEntity[]>;
    for (const id of visible.ids) {
      const entity = visible.entities[id];
      if (isDomainMember(entity) && entity.meta.domain) {
        grouped[entity.meta.domain].push(entity);
      }
    }
    return grouped;
  }
);

export const getArticlesByDomain = cache(
  async (domain: ArticleDomain): Promise<ArticleEntity[]> =>
    (await getArticlesGroupedByDomain())[domain]
);

export const getDomainCounts = once(
  async (): Promise<Record<ArticleDomain, number>> => {
    const grouped = await getArticlesGroupedByDomain();
    return Object.fromEntries(
      ARTICLE_DOMAINS.map((domain) => [domain, grouped[domain].length])
    ) as Record<ArticleDomain, number>;
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
const getTagSlugIndex = once(async (): Promise<Map<string, string[]>> => {
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
  return slugsByTag;
});

export const getTaggedArticles = cache(
  async (tag: string): Promise<ArticleEntity[]> => {
    const [visible, slugsByTag] = await Promise.all([
      getVisibleArticles(),
      getTagSlugIndex(),
    ]);
    const matches: ArticleEntity[] = [];
    for (const slug of slugsByTag.get(tag) ?? []) {
      const entity = visible.entities[slug];
      if (entity) {
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
export const getTagIndex = once(async (): Promise<TagIndexEntry[]> => {
  const slugsByTag = await getTagSlugIndex();
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
export const getNavigableTags = once(async (): Promise<string[]> => {
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
export const getNavigableTagSet = once(
  async (): Promise<ReadonlySet<string>> => new Set(await getNavigableTags())
);

/* ── reading-list manifest (emitted by the importer) ── */

export type { WikiSource } from "@howardism/article-contract/manifests/wiki-sources";

const wikiSources = parseWikiSources(wikiSourcesData);

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
export const getDomainSparklines = once(
  async (): Promise<Record<ArticleDomain, number[]>> => {
    const grouped = await getArticlesGroupedByDomain();

    let anchor = 0;
    for (const domain of ARTICLE_DOMAINS) {
      for (const entity of grouped[domain]) {
        if (entity.dateMs > anchor) {
          anchor = entity.dateMs;
        }
      }
    }
    const start = anchor - (SPARK_WEEKS - 1) * MS_PER_WEEK;

    const result = Object.fromEntries(
      ARTICLE_DOMAINS.map((domain) => [domain, new Array(SPARK_WEEKS).fill(0)])
    ) as Record<ArticleDomain, number[]>;

    for (const domain of ARTICLE_DOMAINS) {
      const bars = result[domain];
      for (const entity of grouped[domain]) {
        const week = Math.floor((entity.dateMs - start) / MS_PER_WEEK);
        if (week >= 0 && week < SPARK_WEEKS) {
          bars[week] += 1;
        }
      }
    }
    return result;
  }
);

/** Per-domain memo for {@link getDomainLeadSource} — see {@link once}. */
const leadSourceByDomain = new Map<
  ArticleDomain,
  Promise<WikiSource | undefined>
>();

/**
 * The raw source most cited by a domain's articles — drives the domain-plate
 * "Sourced from" aside. Returns `undefined` when no source backs the domain.
 *
 * Memoised process-wide rather than per render: the scan is every wiki source
 * against every article in the domain, and the domain plate re-requests it on
 * each of the routes it fronts.
 */
export const getDomainLeadSource = (
  domain: ArticleDomain
): Promise<WikiSource | undefined> => {
  const memo = leadSourceByDomain.get(domain);
  if (memo) {
    return memo;
  }
  const pending = computeDomainLeadSource(domain);
  leadSourceByDomain.set(domain, pending);
  return pending;
};

async function computeDomainLeadSource(
  domain: ArticleDomain
): Promise<WikiSource | undefined> {
  const grouped = await getArticlesGroupedByDomain();
  const domainSlugs = new Set(grouped[domain].map((entity) => entity.slug));
  let best: WikiSource | undefined;
  let bestScore = 0;
  for (const source of wikiSources.sources) {
    let score = 0;
    for (const slug of source.citedBy) {
      if (domainSlugs.has(slug)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      best = source;
      bestScore = score;
    }
  }
  return best;
}

/* ── open-questions backlog (emitted by the importer) ── */

export type { OpenQuestionConcept } from "@howardism/article-contract/manifests/open-questions";

const openQuestions = parseOpenQuestions(openQuestionsData);

/** Every concept that still has unanswered questions, title-sorted. */
export const getOpenQuestions = (): OpenQuestionConcept[] =>
  openQuestions.byConcept;

const openQuestionsByDomain = new Map<ArticleDomain, OpenQuestionConcept[]>();
for (const concept of openQuestions.byConcept) {
  const bucket = openQuestionsByDomain.get(concept.domain);
  if (bucket) {
    bucket.push(concept);
  } else {
    openQuestionsByDomain.set(concept.domain, [concept]);
  }
}

/** The open-questions concepts filed under a single domain. */
export const getOpenQuestionsByDomain = (
  domain: ArticleDomain
): OpenQuestionConcept[] => openQuestionsByDomain.get(domain) ?? [];

/**
 * Returns prev/next slug for the article-page footer, partitioned by archive
 * state so a visible article never links to an archived sibling and vice
 * versa. Position is 1-based within the same partition.
 */
interface ArchivePartition {
  indexBySlug: Map<string, number>;
  list: string[];
}

/**
 * The two archive partitions of `ids`, each with its slug positions. Every
 * article page asks for its siblings, and building the partition per page meant
 * filtering all 427 ids and then scanning for one of them.
 */
const getArchivePartitions = once(
  async (): Promise<{
    archived: ArchivePartition;
    visible: ArchivePartition;
  }> => {
    const all = await getArticles();
    const archived: ArchivePartition = { list: [], indexBySlug: new Map() };
    const visible: ArchivePartition = { list: [], indexBySlug: new Map() };
    for (const id of all.ids) {
      const partition =
        all.entities[id]?.meta.archived === true ? archived : visible;
      partition.indexBySlug.set(id, partition.list.length);
      partition.list.push(id);
    }
    return { archived, visible };
  }
);

export const getSiblings = cache(async (slug: string): Promise<SiblingNav> => {
  const [all, partitions] = await Promise.all([
    getArticles(),
    getArchivePartitions(),
  ]);
  const isArchived = all.entities[slug]?.meta.archived === true;
  const { list, indexBySlug } = isArchived
    ? partitions.archived
    : partitions.visible;
  const index = indexBySlug.get(slug) ?? -1;
  if (index < 0) {
    return {
      previousSlug: undefined,
      previousTitle: undefined,
      nextSlug: undefined,
      nextTitle: undefined,
      position: 1,
    };
  }
  const previousSlug = list[index + 1];
  const nextSlug = list[index - 1];
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

const translations = parseTranslations(translationsData);

const translatedSet = new Set(Object.keys(translations.articles));

const translatedSlugs = [...translatedSet].sort();

/** Slugs that have a committed zh-TW translation (per translations.json). */
export const getTranslatedSlugs = (): string[] => translatedSlugs;

/** Whether `slug` has a zh-TW translation available. */
export const hasTranslation = (slug: string): boolean =>
  translatedSet.has(slug);

/**
 * Whether the zh-TW translation for `slug` is stale — i.e. the EN source has
 * changed since the translation was recorded. Returns false if no translation
 * exists. Both hashes come from a committed manifest, so this is the same
 * comparison `translate:check` makes.
 */
export const isTranslationStale = (slug: string): boolean => {
  const record = translations.articles[slug];
  if (!record) {
    return false;
  }
  return allArticles.entities[slug]?.sourceHash !== record.sourceHash;
};
