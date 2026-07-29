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

  const outgoing: Record<string, string[]> = {};
  for (const slug of sortedSlugs) {
    outgoing[slug] = [...(outgoingSets.get(slug) ?? new Set())].sort();
  }

  return { generatedOn, outgoing, backlinks, related };
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

function computeRelated(
  sortedSlugs: string[],
  outgoingSets: Map<string, Set<string>>,
  backlinkSets: Map<string, Set<string>>
): Record<string, string[]> {
  const related: Record<string, string[]> = {};
  for (const slug of sortedSlugs) {
    const outA = outgoingSets.get(slug) ?? new Set<string>();
    const backA = backlinkSets.get(slug) ?? new Set<string>();
    const scored: Array<{ score: number; slug: string }> = [];
    for (const other of sortedSlugs) {
      if (other === slug) {
        continue;
      }
      const outB = outgoingSets.get(other) ?? new Set<string>();
      const backB = backlinkSets.get(other) ?? new Set<string>();
      const score =
        countIntersection(outA, outB) + countIntersection(backA, backB);
      if (score === 0) {
        continue;
      }
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

function countIntersection(a: Set<string>, b: Set<string>): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let count = 0;
  for (const x of small) {
    if (large.has(x)) {
      count += 1;
    }
  }
  return count;
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
