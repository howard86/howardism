import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { ArticleNavProvider } from "@/components/article-nav-context";
import { TweaksProvider } from "@/components/tweaks/tweaks-provider";

// `<BacklinksDisclosure>` and `<ArticleRail>` are async server components;
// happy-dom + RTL's sync render tree can't await them. Both have their own
// dedicated tests — neutralise them here so layout-only assertions can run.
mock.module("@/app/(blog)/articles/[slug]/backlinks-disclosure", () => ({
  BacklinksDisclosure: () => null,
}));
mock.module("@/app/(blog)/articles/[slug]/article-rail", () => ({
  ArticleRail: () => null,
}));

import { ArticleLayout } from "@/app/(blog)/articles/[slug]/article-layout";

afterEach(() => {
  cleanup();
});

import type { ArticleMeta } from "@/app/(blog)/articles/service";

// ArticleLayout mounts reader-control clients (tap-to-scroll, resume) that read
// the Tweaks + article-nav contexts — render it within both, as the app does.
function Providers({ children }: { children: ReactNode }) {
  return (
    <TweaksProvider>
      <ArticleNavProvider>{children}</ArticleNavProvider>
    </TweaksProvider>
  );
}

const BASE_META: ArticleMeta = {
  date: "2024-01-01",
  description: "A description",
  imageAlt: "alt",
  readingTime: 3,
  tag: "Essay",
  title: "Test Article",
};

describe("ArticleLayout drop-cap", () => {
  it("applies prose-drop-cap class when meta.dropCap === true", () => {
    const { container } = render(
      <ArticleLayout meta={{ ...BASE_META, dropCap: true }} slug="test-article">
        <p>Article content</p>
      </ArticleLayout>,
      { wrapper: Providers }
    );
    const proseDiv = container.querySelector(".prose");
    expect(proseDiv).toBeDefined();
    expect(proseDiv?.classList.contains("prose-drop-cap")).toBe(true);
  });

  it("does not apply prose-drop-cap when meta.dropCap is undefined", () => {
    const { container } = render(
      <ArticleLayout meta={BASE_META} slug="test-article">
        <p>Article content</p>
      </ArticleLayout>,
      { wrapper: Providers }
    );
    const proseDiv = container.querySelector(".prose");
    expect(proseDiv).toBeDefined();
    expect(proseDiv?.classList.contains("prose-drop-cap")).toBe(false);
  });

  it("does not apply prose-drop-cap when meta.dropCap === false", () => {
    const { container } = render(
      <ArticleLayout
        meta={{ ...BASE_META, dropCap: false }}
        slug="test-article"
      >
        <p>Article content</p>
      </ArticleLayout>,
      { wrapper: Providers }
    );
    const proseDiv = container.querySelector(".prose");
    expect(proseDiv?.classList.contains("prose-drop-cap")).toBe(false);
  });
});
