import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

mock.module("@/components/article-nav-context", () => ({
  useArticleNav: () => ({ slug: "x", headings: [] }),
}));

const { ArticleFind } = await import("@/components/find/article-find");

afterEach(cleanup);

function openBar() {
  fireEvent.click(screen.getByRole("button", { name: "Find in article" }));
}

describe("ArticleFind", () => {
  it("renders nothing inline until the toggle is pressed", () => {
    render(<ArticleFind />);
    expect(screen.queryByLabelText("Find text in article")).toBeNull();
    openBar();
    expect(screen.getByLabelText("Find text in article")).toBeDefined();
  });

  it("shows 0/0 and disables navigation when there are no matches", () => {
    // happy-dom lacks the CSS Custom Highlight API, so the hook stays inert.
    render(<ArticleFind />);
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
    render(<ArticleFind />);
    openBar();
    fireEvent.click(screen.getByRole("button", { name: "Close find" }));
    expect(screen.queryByLabelText("Find text in article")).toBeNull();
  });
});
