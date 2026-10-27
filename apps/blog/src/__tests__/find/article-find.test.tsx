import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import {
  ArticleNavProvider,
  PublishArticleNav,
} from "@/components/article-nav-context";
import { ArticleFindBar } from "@/components/find/article-find";

// Real context rather than `mock.module`: a module mock is process-wide in
// Bun, so stubbing `useArticleNav` here emptied the headings of every later
// file's nav — toc-sheet.test.tsx then rendered no TOC trigger in CI.
const headings: never[] = [];

function renderFind(onClose = () => undefined) {
  render(
    <ArticleNavProvider>
      <PublishArticleNav headings={headings} slug="x" />
      <ArticleFindBar onClose={onClose} query="loop" />
    </ArticleNavProvider>
  );
}

afterEach(cleanup);

describe("ArticleFind", () => {
  it("renders the find bar without a standalone trigger", () => {
    renderFind();
    expect(
      screen.queryByRole("button", { name: "Find in article" })
    ).toBeNull();
    expect(screen.getByLabelText("Find text in article")).toBeDefined();
  });

  it("shows 0/0 and disables navigation when there are no matches", () => {
    // happy-dom lacks the CSS Custom Highlight API, so the hook stays inert.
    renderFind();
    expect(screen.getByText("0 of 0")).toBeDefined();
    const next = screen.getByRole("button", {
      name: "Next match",
    }) as HTMLButtonElement;
    const prev = screen.getByRole("button", {
      name: "Previous match",
    }) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    expect(prev.disabled).toBe(true);
  });

  it("closes the bar via the close button", () => {
    renderFind();
    fireEvent.click(screen.getByRole("button", { name: "Close find" }));
    expect(screen.queryByLabelText("Find text in article")).toBeNull();
  });
});
