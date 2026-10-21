import { describe, expect, it } from "bun:test";

import rehypeCollapseSources from "../lib/rehype-collapse-sources.mjs";

function heading(tagName, value, id) {
  return {
    type: "element",
    tagName,
    properties: { id },
    children: [{ type: "text", value }],
  };
}

function paragraph(value) {
  return {
    type: "element",
    tagName: "p",
    properties: {},
    children: [{ type: "text", value }],
  };
}

function transform(children) {
  const tree = { type: "root", children };
  rehypeCollapseSources()(tree);
  return tree;
}

describe("rehype-collapse-sources", () => {
  it("wraps only the leading Sources section and keeps its heading id", () => {
    const tree = transform([
      heading("h2", "Sources", "sources"),
      paragraph("Citation list"),
      heading("h3", "A source note", "a-source-note"),
      paragraph("More citations"),
      heading("h2", "Summary", "summary"),
      paragraph("Article summary"),
    ]);

    expect(tree.children).toHaveLength(3);
    const [details, nextHeading] = tree.children;
    expect(details.tagName).toBe("details");
    expect(details.properties.className).toEqual(["sources-disclosure"]);
    expect(details.children[0].tagName).toBe("summary");
    expect(details.children[0].children[0].properties.id).toBe("sources");
    expect(details.children.slice(1)).toHaveLength(3);
    expect(nextHeading.properties.id).toBe("summary");
    expect(details.properties.open).toBeUndefined();
  });

  it("collapses a leading 資料來源 heading", () => {
    const tree = transform([
      heading("h2", "資料來源", "資料來源"),
      paragraph("參考資料"),
    ]);

    expect(tree.children[0].tagName).toBe("details");
    expect(tree.children[0].children[0].children[0].properties.id).toBe(
      "資料來源"
    );
  });

  it("leaves a Sources section after another h2 untouched", () => {
    const original = [
      heading("h2", "Summary", "summary"),
      paragraph("Text"),
      heading("h2", "Sources", "sources"),
      paragraph("Citation"),
    ];
    const tree = transform(original);

    expect(tree.children).toEqual(original);
  });

  it("leaves documents without a leading Sources heading untouched", () => {
    const original = [heading("h2", "Summary", "summary"), paragraph("Text")];
    const tree = transform(original);

    expect(tree.children).toEqual(original);
  });
});
