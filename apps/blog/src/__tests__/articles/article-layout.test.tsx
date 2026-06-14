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

function hasDropCap(meta: ArticleMeta): boolean {
  const { container } = render(
    <ArticleLayout meta={meta} slug="test-article">
      <p>Article content</p>
    </ArticleLayout>,
    { wrapper: Providers }
  );
  return Boolean(
    container.querySelector(".prose")?.classList.contains("prose-drop-cap")
  );
}

describe("ArticleLayout drop-cap", () => {
  it("applies prose-drop-cap for Essay articles", () => {
    expect(hasDropCap({ ...BASE_META, tag: "Essay" })).toBe(true);
  });

  it("does not apply prose-drop-cap for Concept articles", () => {
    expect(hasDropCap({ ...BASE_META, tag: "Concept" })).toBe(false);
  });

  it("does not apply prose-drop-cap for Entity articles", () => {
    expect(hasDropCap({ ...BASE_META, tag: "Entity" })).toBe(false);
  });

  it("ignores the legacy meta.dropCap flag (kind decides)", () => {
    expect(hasDropCap({ ...BASE_META, tag: "Concept", dropCap: true })).toBe(
      false
    );
  });
});
