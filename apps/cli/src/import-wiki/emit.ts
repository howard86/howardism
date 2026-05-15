import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import YAML from "yaml";

import type { SourceRef } from "./transform.ts";

export type WikiTag = "Concept" | "Entity" | "Essay" | "Index" | "Changelog";

export const WIKI_TAGS: readonly WikiTag[] = [
  "Concept",
  "Entity",
  "Essay",
  "Index",
  "Changelog",
];

/**
 * Keep this union aligned with `ArticleTopic` in
 * `apps/blog/src/app/(blog)/articles/taxonomy.ts` — the blog's filter UI
 * trusts whatever the importer emits.
 */
export type WikiTopic =
  | "interaction"
  | "alignment"
  | "harness"
  | "product"
  | "org";

export const WIKI_TOPICS: readonly WikiTopic[] = [
  "interaction",
  "alignment",
  "harness",
  "product",
  "org",
];

export interface ArticleMeta {
  date: string;
  description: string;
  readingTime: number;
  /**
   * Per-article audit trail of external raw source documents. Frontmatter
   * is the structured source of truth; the rendered `## Sources` section
   * in the body is derived from this list at import time. Omitted from
   * frontmatter when empty.
   */
  sources?: SourceRef[];
  tag: WikiTag;
  title: string;
  /**
   * Editorial topic cluster. Optional because the Changelog stays untagged
   * and new pieces may land before a topic is assigned. Emitted only when
   * set so the YAML stays clean.
   */
  topic?: WikiTopic;
}

export interface EmitArticleArgs {
  articlesDir: string;
  body: string;
  dryRun?: boolean;
  imageAlt: string;
  imageFile: string;
  meta: ArticleMeta;
  slug: string;
}

export function buildArticleSource(
  args: Omit<EmitArticleArgs, "articlesDir" | "dryRun" | "slug">
): string {
  const { imageFile, imageAlt, meta, body } = args;

  const frontmatter = YAML.stringify({
    date: meta.date,
    title: meta.title,
    description: meta.description,
    tag: meta.tag,
    ...(meta.topic ? { topic: meta.topic } : {}),
    readingTime: meta.readingTime,
    imageAlt,
    ...(meta.sources && meta.sources.length > 0
      ? { sources: meta.sources }
      : {}),
  }).trimEnd();

  return [
    "---",
    frontmatter,
    "---",
    `export { default as heroImage } from "../assets/${imageFile}";`,
    "",
    body.trimEnd(),
    "",
  ].join("\n");
}

export async function emitArticle(args: EmitArticleArgs): Promise<string> {
  const { articlesDir, slug, dryRun } = args;
  const filePath = join(articlesDir, `${slug}.mdx`);
  const fileContent = buildArticleSource(args);

  if (dryRun) {
    console.log(`[emit] DRY_RUN — would write ${filePath}`);
    return filePath;
  }

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, fileContent, "utf8");
  return filePath;
}
