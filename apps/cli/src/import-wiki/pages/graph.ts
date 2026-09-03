import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import {
  type ArticleGraph,
  ArticleGraphSchema,
  type BacklinkEdge,
} from "@howardism/article-contract/manifests/graph";

import type { ParsedWikiFile } from "../parse.ts";
import { extractLinkOccurrences, type LinkOccurrence } from "../wikilink.ts";

const RELATED_LIMIT = 5;
/** Shared stand-ins for a slug with no edges; never written to. */
const EMPTY_SET: ReadonlySet<string> = new Set();
const EMPTY_SCORES: ReadonlyMap<string, number> = new Map();

export type { ArticleGraph } from "@howardism/article-contract/manifests/graph";

export interface BuildArticleGraphArgs {
  generatedOn: string;
  /**
   * Predicate to drop archived articles from the graph entirely. Defaults to
   * "nothing is archived" so unit tests can exercise the core algorithm
   * without specifying a frontmatter convention.
   */
  isArchived?: (parsed: ParsedWikiFile) => boolean;
  parsed: ParsedWikiFile[];
}

export function buildArticleGraph(args: BuildArticleGraphArgs): ArticleGraph {
  const { parsed, generatedOn, isArchived } = args;
  const isArchivedFn = isArchived ?? (() => false);

  const live = parsed.filter((p) => !isArchivedFn(p));
  const liveSlugs = new Set(live.map((p) => p.source.slug));

  const occurrences = buildOccurrences(live, liveSlugs);
  const outgoingSets = new Map(
    [...occurrences].map(([slug, links]) => [
      slug,
      new Set(links.map((link) => link.slug)),
    ])
  );
  const backlinkSets = buildBacklinkSets(outgoingSets, liveSlugs);

  const sortedSlugs = [...liveSlugs].sort();
  const related = computeRelated(sortedSlugs, outgoingSets, backlinkSets);
  const backlinks = buildBacklinks(occurrences, sortedSlugs);

  return { generatedOn, backlinks, related };
}

/** Per-source links to live articles — self-links and dangling targets dropped. */
function buildOccurrences(
  live: ParsedWikiFile[],
  liveSlugs: Set<string>
): Map<string, LinkOccurrence[]> {
  const out = new Map<string, LinkOccurrence[]>();
  for (const file of live) {
    const slug = file.source.slug;
    out.set(
      slug,
      extractLinkOccurrences(file.body).filter(
        (link) => link.slug !== slug && liveSlugs.has(link.slug)
      )
    );
  }
  return out;
}

/**
 * Inbound citations per article, heaviest first: an article that links here
 * four times outranks one that lists the slug in a table of contents. Ties
 * break alphabetically so the manifest stays deterministic.
 */
function buildBacklinks(
  occurrences: Map<string, LinkOccurrence[]>,
  sortedSlugs: string[]
): Record<string, BacklinkEdge[]> {
  const backlinks: Record<string, BacklinkEdge[]> = {};
  for (const slug of sortedSlugs) {
    backlinks[slug] = [];
  }
  for (const [source, links] of occurrences) {
    for (const link of links) {
      backlinks[link.slug]?.push({
        slug: source,
        count: link.count,
        ...(link.context === null ? {} : { context: link.context }),
      });
    }
  }
  for (const edges of Object.values(backlinks)) {
    edges.sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
  }
  return backlinks;
}

function buildBacklinkSets(
  outgoingSets: Map<string, Set<string>>,
  liveSlugs: Set<string>
): Map<string, Set<string>> {
  const back = new Map<string, Set<string>>();
  for (const slug of liveSlugs) {
    back.set(slug, new Set<string>());
  }
  for (const [src, targets] of outgoingSets) {
    for (const tgt of targets) {
      back.get(tgt)?.add(src);
    }
  }
  return back;
}

/**
 * Pair scores, accumulated through shared neighbours instead of over all N²
 * pairs. The score two articles carry is the number of targets they both cite
 * plus the number of sources that cite them both — so every pair drawn from
 * one article's backlink set scores a shared target, and every pair drawn from
 * its outgoing set scores a shared source. Pairs that never co-occur are never
 * touched, which is the whole cost of the all-pairs scan.
 */
function accumulatePairScores(
  sortedSlugs: string[],
  outgoingSets: Map<string, Set<string>>,
  backlinkSets: Map<string, Set<string>>
): Map<string, Map<string, number>> {
  const scores = new Map<string, Map<string, number>>(
    sortedSlugs.map((slug) => [slug, new Map<string, number>()])
  );
  const bump = (from: string, to: string): void => {
    const row = scores.get(from);
    row?.set(to, (row.get(to) ?? 0) + 1);
  };
  const scoreEveryPair = (members: ReadonlySet<string>): void => {
    const list = [...members];
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        bump(list[i], list[j]);
        bump(list[j], list[i]);
      }
    }
  };

  for (const slug of sortedSlugs) {
    scoreEveryPair(backlinkSets.get(slug) ?? EMPTY_SET);
    scoreEveryPair(outgoingSets.get(slug) ?? EMPTY_SET);
  }
  return scores;
}

export function computeRelated(
  sortedSlugs: string[],
  outgoingSets: Map<string, Set<string>>,
  backlinkSets: Map<string, Set<string>>
): Record<string, string[]> {
  const scores = accumulatePairScores(sortedSlugs, outgoingSets, backlinkSets);
  const related: Record<string, string[]> = {};
  for (const slug of sortedSlugs) {
    const scored: Array<{ score: number; slug: string }> = [];
    for (const [other, score] of scores.get(slug) ?? EMPTY_SCORES) {
      scored.push({ slug: other, score });
    }
    scored.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.slug.localeCompare(b.slug);
    });
    related[slug] = scored.slice(0, RELATED_LIMIT).map((s) => s.slug);
  }
  return related;
}

export interface EmitArticleGraphArgs {
  dryRun?: boolean;
  graph: ArticleGraph;
  outputPath: string;
}

export async function emitArticleGraph(
  args: EmitArticleGraphArgs
): Promise<string> {
  const { graph, outputPath, dryRun } = args;
  const json = JSON.stringify(ArticleGraphSchema.parse(graph), null, 2);

  if (dryRun) {
    console.log(
      `[graph] DRY_RUN — would write ${outputPath} (${json.length} bytes)`
    );
    return outputPath;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${json}\n`, "utf8");
  return outputPath;
}
