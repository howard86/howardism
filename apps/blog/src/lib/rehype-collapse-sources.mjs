import { toString as hastToString } from "hast-util-to-string";

/** @returns {(tree: any) => void} */
export default function rehypeCollapseSources() {
  return ({ children }) => {
    if (!Array.isArray(children)) {
      return;
    }

    const headingIndex = children.findIndex(
      (node) => node.type === "element" && node.tagName === "h2"
    );
    if (headingIndex === -1) {
      return;
    }

    const heading = children[headingIndex];
    const title = hastToString(heading).trim().toLowerCase();
    if (title !== "sources" && title !== "資料來源") {
      return;
    }

    let endIndex = headingIndex + 1;
    while (
      endIndex < children.length &&
      !(
        children[endIndex].type === "element" &&
        children[endIndex].tagName === "h2"
      )
    ) {
      endIndex += 1;
    }

    const section = children.splice(headingIndex, endIndex - headingIndex);
    const summary = {
      type: "element",
      tagName: "summary",
      properties: {},
      children: [section[0]],
    };
    children.splice(headingIndex, 0, {
      type: "element",
      tagName: "details",
      properties: { className: ["sources-disclosure"] },
      children: [summary, ...section.slice(1)],
    });
  };
}
