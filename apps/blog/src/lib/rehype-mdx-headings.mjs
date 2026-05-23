import { valueToEstree } from "estree-util-value-to-estree";
import { headingRank } from "hast-util-heading-rank";
import { toString as hastToString } from "hast-util-to-string";
import { define } from "unist-util-mdx-define";
import { visit } from "unist-util-visit";

/** @returns {(tree: any, file: any) => void} */
export default function rehypeMdxHeadings() {
  return (tree, file) => {
    /** @type {Array<{depth: 2 | 3, id: string, text: string}>} */
    const headings = [];
    visit(tree, "element", (node) => {
      const rank = headingRank(node);
      if (rank !== 2 && rank !== 3) {
        return;
      }
      const id = node.properties?.id;
      if (typeof id !== "string") {
        return;
      }
      headings.push({
        depth: rank,
        id,
        text: hastToString(node).trim(),
      });
    });
    define(tree, file, { headings: valueToEstree(headings) });
  };
}
