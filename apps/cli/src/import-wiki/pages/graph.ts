import {
  type ArticleGraph,
  ArticleGraphSchema,
  type BacklinkEdge,
} from "@howardism/article-contract/manifests/graph";

import type { ParsedWikiFile } from "../parse.ts";
import { extractLinkOccurrences, type LinkOccurrence } from "../wikilink.ts";

const RELATED_LIMIT = 5;
/** Shared stand-in for a slug with no edges; never written to. */
const EMPTY_IDS = new Int32Array(0);

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
    const { slug } = file.source;
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
      const edge: BacklinkEdge = { slug: source, count: link.count };
      if (link.context !== null) {
        edge.context = link.context;
      }
      backlinks[link.slug]?.push(edge);
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
 * Each slug set as an array of ids into `sortedSlugs`, interned once.
 *
 * Members outside `sortedSlugs` are dropped. `buildArticleGraph` filters every
 * link to a live slug before the sets are built, so there are none in practice;
 * and were one to appear, emitting it as `related` would only fail
 * `content:check`'s graph-slug-refs gate, since it names no article.
 */
function internSets(
  sortedSlugs: string[],
  sets: Map<string, Set<string>>,
  idBySlug: Map<string, number>
): Int32Array[] {
  return sortedSlugs.map((slug) => {
    const members = sets.get(slug);
    if (!members) {
      return EMPTY_IDS;
    }
    const ids = new Int32Array(members.size);
    let length = 0;
    for (const member of members) {
      const id = idBySlug.get(member);
      if (id !== undefined) {
        ids[length] = id;
        length += 1;
      }
    }
    return length === ids.length ? ids : ids.subarray(0, length);
  });
}

/**
 * One row of the pair-score matrix, accumulated into `scores` (which the caller
 * owns and zeroes between rows).
 *
 * The score two articles carry is the number of targets they both cite plus the
 * number of sources that cite them both. Read from one article's side that is:
 * every article citing a target `row` also cites shares a target with it, and
 * everything cited by a source that cites `row` shares a source with it. So the
 * row is reachable in two hops without ever materialising the other N-1 rows —
 * the whole point of doing it this way round.
 *
 * `scores[row]` is cleared at the end because `row` is a member of the very
 * sets it is reached through, and an article is not related to itself.
 */
function accumulateRow(
  row: number,
  outgoing: Int32Array[],
  backlink: Int32Array[],
  scores: Int32Array
): void {
  for (const target of outgoing[row] as Int32Array) {
    for (const peer of backlink[target] as Int32Array) {
      scores[peer] += 1;
    }
  }
  for (const source of backlink[row] as Int32Array) {
    for (const peer of outgoing[source] as Int32Array) {
      scores[peer] += 1;
    }
  }
  scores[row] = 0;
}

/**
 * The `RELATED_LIMIT` highest-scoring ids in `scores`, score descending then id
 * ascending — and `sortedSlugs` is sorted, so id ascending IS slug ascending.
 *
 * Reading `scores` in ascending id order is what makes that tiebreak free: a
 * later id only displaces an earlier one on a STRICTLY higher score, so equal
 * scores keep the alphabetically earlier slug, exactly as the comparator this
 * replaced did. Writes into `topId`/`topScore`, returns how many it filled.
 */
function selectTop(
  scores: Int32Array,
  topId: Int32Array,
  topScore: Int32Array
): number {
  let filled = 0;
  for (let id = 0; id < scores.length; id += 1) {
    const score = scores[id] as number;
    if (score === 0) {
      continue;
    }
    if (filled === RELATED_LIMIT && score <= (topScore[filled - 1] as number)) {
      continue;
    }
    let at = filled < RELATED_LIMIT ? filled : RELATED_LIMIT - 1;
    while (at > 0 && score > (topScore[at - 1] as number)) {
      topScore[at] = topScore[at - 1] as number;
      topId[at] = topId[at - 1] as number;
      at -= 1;
    }
    topScore[at] = score;
    topId[at] = id;
    if (filled < RELATED_LIMIT) {
      filled += 1;
    }
  }
  return filled;
}

/**
 * Top-`RELATED_LIMIT` related articles per slug.
 *
 * Scored one row at a time into a reused `Int32Array(N)` rather than into a
 * whole-corpus pair table. The old shape built a `Map<string, Map<string,
 * number>>` of 158,514 entries — +15.6 MB for 447 articles — and then wrapped
 * each entry in a `{score, slug}` object only to discard 98.6% of them to a
 * top-5 slice. The increments are the same 595,984; nothing but the table is
 * gone.
 */
export function computeRelated(
  sortedSlugs: string[],
  outgoingSets: Map<string, Set<string>>,
  backlinkSets: Map<string, Set<string>>
): Record<string, string[]> {
  const idBySlug = new Map<string, number>();
  for (let id = 0; id < sortedSlugs.length; id += 1) {
    idBySlug.set(sortedSlugs[id] as string, id);
  }
  const outgoing = internSets(sortedSlugs, outgoingSets, idBySlug);
  const backlink = internSets(sortedSlugs, backlinkSets, idBySlug);

  const scores = new Int32Array(sortedSlugs.length);
  const topId = new Int32Array(RELATED_LIMIT);
  const topScore = new Int32Array(RELATED_LIMIT);
  const related: Record<string, string[]> = {};

  for (let row = 0; row < sortedSlugs.length; row += 1) {
    scores.fill(0);
    accumulateRow(row, outgoing, backlink, scores);
    const filled = selectTop(scores, topId, topScore);
    const slugs: string[] = new Array(filled);
    for (let rank = 0; rank < filled; rank += 1) {
      slugs[rank] = sortedSlugs[topId[rank] as number] as string;
    }
    related[sortedSlugs[row] as string] = slugs;
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

  await Bun.write(outputPath, `${json}\n`);
  return outputPath;
}
