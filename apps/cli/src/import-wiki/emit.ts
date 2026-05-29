import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { ArticleContract } from "@howardism/article-contract";
import YAML from "yaml";

export type ArticleMeta = ArticleContract;

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
    ...(meta.domain ? { domain: meta.domain } : {}),
    ...(meta.tags && meta.tags.length > 0 ? { tags: meta.tags } : {}),
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
