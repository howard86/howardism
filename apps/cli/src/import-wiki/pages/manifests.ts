import type { ParsedWikiFile } from "../parse.ts";
import {
  type ArticleGraph,
  buildArticleGraph,
  emitArticleGraph,
} from "./graph.ts";
import { buildWikiLog, emitWikiLog, type WikiLog } from "./wiki-log.ts";
import {
  buildWikiSources,
  emitWikiSources,
  type WikiSourcesManifest,
} from "./wiki-sources.ts";

export interface ManifestSet {
  graph: ArticleGraph;
  log: WikiLog | null;
  sources: WikiSourcesManifest;
}

export interface BuildManifestsArgs {
  /** YYYY-MM-DD, injected once by the caller. */
  generatedOn: string;
  logBody: string | null;
  parsed: ParsedWikiFile[];
  rawRoot: string;
}

export async function buildManifests(
  args: BuildManifestsArgs
): Promise<ManifestSet> {
  const { parsed, logBody, rawRoot, generatedOn } = args;

  const graph = buildArticleGraph({
    parsed,
    generatedOn,
    isArchived: (p) => p.frontmatter.archived === true,
  });

  const log =
    logBody === null ? null : buildWikiLog({ body: logBody, generatedOn });

  const live = parsed.filter((p) => p.frontmatter.archived !== true);
  const sources = await buildWikiSources({
    parsed: live,
    rawRoot,
    generatedOn,
  });

  return { graph, log, sources };
}

export interface WriteManifestsArgs {
  dryRun: boolean;
  graphOutputPath: string;
  logOutputPath: string;
  set: ManifestSet;
  sourcesOutputPath: string;
}

export async function writeManifests(
  args: WriteManifestsArgs
): Promise<{ graphPath: string }> {
  const { set, graphOutputPath, logOutputPath, sourcesOutputPath, dryRun } =
    args;

  const graphPath = await emitArticleGraph({
    graph: set.graph,
    outputPath: graphOutputPath,
    dryRun,
  });

  if (set.log) {
    await emitWikiLog({ log: set.log, outputPath: logOutputPath, dryRun });
  }

  await emitWikiSources({
    manifest: set.sources,
    outputPath: sourcesOutputPath,
    dryRun,
  });

  return { graphPath };
}
