import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render } from "@testing-library/react";

import { ArticleLayout } from "@/app/(blog)/articles/[slug]/ArticleLayout";

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
  it("applies hw-drop-cap class when meta.dropCap === true", () => {
    const { container } = render(
      <ArticleLayout meta={{ ...BASE_META, dropCap: true }} position={1}>
        <p>Article content</p>
      </ArticleLayout>
    );
    const proseDiv = container.querySelector(".hw-prose");
    expect(proseDiv).toBeDefined();
    expect(proseDiv?.classList.contains("hw-drop-cap")).toBe(true);
  });

  it("does not apply hw-drop-cap when meta.dropCap is undefined", () => {
    const { container } = render(
      <ArticleLayout meta={BASE_META} position={1}>
        <p>Article content</p>
      </ArticleLayout>
    );
    const proseDiv = container.querySelector(".hw-prose");
    expect(proseDiv).toBeDefined();
    expect(proseDiv?.classList.contains("hw-drop-cap")).toBe(false);
  });

  it("does not apply hw-drop-cap when meta.dropCap === false", () => {
    const { container } = render(
      <ArticleLayout meta={{ ...BASE_META, dropCap: false }} position={1}>
        <p>Article content</p>
      </ArticleLayout>
    );
    const proseDiv = container.querySelector(".hw-prose");
    expect(proseDiv?.classList.contains("hw-drop-cap")).toBe(false);
  });
});
