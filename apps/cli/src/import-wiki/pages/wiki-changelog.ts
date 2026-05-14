import { type ArticleMeta, emitArticle } from "../emit.ts";
import {
  type ParsedWikiFile,
  resolveDate,
  stripWikilinksToText,
} from "../parse.ts";
import {
  computeReadingTime,
  escapeMdxBody,
  firstParagraph,
  redactLocalPaths,
  rewriteWikilinks,
} from "../transform.ts";

export interface BuildWikiChangelogArgs {
  dryRun?: boolean;
  imageFile: string;
  outputDir: string;
  parsed: ParsedWikiFile;
  slugTitleMap: Map<string, string>;
}

/**
 * Pipe `log.md` through the same wikilink + MDX-escape transforms as
 * regular articles so cross-links resolve in the blog.
 */
export function buildWikiChangelogPage(
  args: BuildWikiChangelogArgs
): Promise<string> {
  const { parsed, outputDir, imageFile, slugTitleMap, dryRun } = args;

  const title = parsed.frontmatter.title?.trim() || "Wiki Changelog";
  const escaped = escapeMdxBody(parsed.body);
  const { body: linkedBody } = rewriteWikilinks(escaped, slugTitleMap);
  const body = redactLocalPaths(linkedBody);

  const description =
    stripWikilinksToText(firstParagraph(parsed.body)) ||
    "Chronological journal of wiki maintenance: ingests, derived outputs, link-graph health, and policy decisions.";

  const meta: ArticleMeta = {
    date: resolveDate(parsed),
    title,
    description,
    readingTime: computeReadingTime(parsed.body),
    tag: "Changelog",
  };

  return emitArticle({
    articleDir: outputDir,
    imageFile,
    imageAlt: `Illustration for ${title}`,
    meta,
    body,
    dryRun,
  });
}
