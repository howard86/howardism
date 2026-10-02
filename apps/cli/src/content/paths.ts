import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = resolve(
  fileURLToPath(new URL("../../../../", import.meta.url))
);
export const BLOG_ROOT = resolve(REPO_ROOT, "apps/blog");

/** A content root owns both content/ and data/; never mix roots. */
export function contentPaths(
  root = process.env.CONTENT_ROOT ?? resolve(BLOG_ROOT, "src")
) {
  const resolved = resolve(root);
  return {
    root: resolved,
    articles: resolve(resolved, "content/articles"),
    translated: resolve(resolved, "content/articles-zh-TW"),
    assets: resolve(resolved, "content/assets"),
    data: resolve(resolved, "data"),
    manifest: (name: string) => resolve(resolved, "data", name),
  };
}
export type ContentPaths = ReturnType<typeof contentPaths>;
