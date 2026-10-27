import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import {
  ArticleNavProvider,
  PublishArticleNav,
} from "@/components/article-nav-context";
import { ArticleFind } from "@/components/find/article-find";

// Real context rather than `mock.module`: a module mock is process-wide in
// Bun, so stubbing `useArticleNav` here emptied the headings of every later
// file's nav — toc-sheet.test.tsx then rendered no TOC trigger in CI.
const headings: never[] = [];

function renderFind() {
  render(
    <ArticleNavProvider>
      <PublishArticleNav headings={headings} slug="x" />
      <ArticleFind />
    </ArticleNavProvider>
  );
}

afterEach(cleanup);

function openBar() {
  fireEvent.click(screen.getByRole("button", { name: "Find in article" }));
}

describe("ArticleFind", () => {
  it("renders nothing inline until the toggle is pressed", () => {
    renderFind();
    expect(screen.queryByLabelText("Find text in article")).toBeNull();
    openBar();
    expect(screen.getByLabelText("Find text in article")).toBeDefined();
  });

  it("shows 0/0 and disables navigation when there are no matches", () => {
    // happy-dom lacks the CSS Custom Highlight API, so the hook stays inert.
    renderFind();
    openBar();
    fireEvent.change(screen.getByLabelText("Find text in article"), {
      target: { value: "loop" },
    });
    expect(screen.getByText("0/0")).toBeDefined();
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
    openBar();
    fireEvent.click(screen.getByRole("button", { name: "Close find" }));
    expect(screen.queryByLabelText("Find text in article")).toBeNull();
  });
});
