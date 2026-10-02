import { visit } from "unist-util-visit";

const ARTICLE_URL = /^\/(?:zh-TW\/)?articles\/([^/#?]+)(?:[?#].*)?$/;
/** Missing sample article links deliberately open the canonical production article. */
export default function rehypePreviewLinks({ profile, slugs }) {
  if (profile !== "sample") {
    return (tree) => tree;
  }
  const selected = new Set(slugs);
  return (tree) => {
    visit(tree, "element", (node) => {
      const href = node.properties?.href;
      if (node.tagName !== "a" || typeof href !== "string") {
        return;
      }
      const match = href.match(ARTICLE_URL);
      if (match && !selected.has(match[1])) {
        node.properties.href = `https://www.howardism.dev${href}`;
      }
    });
  };
}
