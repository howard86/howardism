import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render } from "@testing-library/react";

// `<BacklinksDisclosure>` is an async server component; happy-dom + RTL's
// sync render tree can't await it. The component has its own dedicated
// tests — neutralise it here so layout-only assertions can run.
mock.module("@/app/(blog)/articles/[slug]/backlinks-disclosure", () => ({
  BacklinksDisclosure: () => null,
}));

import { ArticleLayout } from "@/app/(blog)/articles/[slug]/article-layout";

afterEach(() => {
  cleanup();
});

const BASE_META = {
  date: "2024-01-01",
  description: "A description",
  image: { src: {} as never, alt: "alt" },
  readingTime: 3,
  tag: "Engineering",
  title: "Test Article",
};

describe("ArticleLayout drop-cap", () => {
  it("applies prose-drop-cap class when meta.dropCap === true", () => {
    const { container } = render(
      <ArticleLayout
        meta={{ ...BASE_META, dropCap: true }}
        position={1}
        slug="test-article"
      >
        <p>Article content</p>
      </ArticleLayout>
    );
    const proseDiv = container.querySelector(".prose");
    expect(proseDiv).toBeDefined();
    expect(proseDiv?.classList.contains("prose-drop-cap")).toBe(true);
  });

  it("does not apply prose-drop-cap when meta.dropCap is undefined", () => {
    const { container } = render(
      <ArticleLayout meta={BASE_META} position={1} slug="test-article">
        <p>Article content</p>
      </ArticleLayout>
    );
    const proseDiv = container.querySelector(".prose");
    expect(proseDiv).toBeDefined();
    expect(proseDiv?.classList.contains("prose-drop-cap")).toBe(false);
  });

  it("does not apply prose-drop-cap when meta.dropCap === false", () => {
    const { container } = render(
      <ArticleLayout
        meta={{ ...BASE_META, dropCap: false }}
        position={1}
        slug="test-article"
      >
        <p>Article content</p>
      </ArticleLayout>
    );
    const proseDiv = container.querySelector(".prose");
    expect(proseDiv?.classList.contains("prose-drop-cap")).toBe(false);
  });
});
