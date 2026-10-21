import { afterEach, describe, expect, it } from "bun:test";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  ArticleNavProvider,
  PublishArticleNav,
} from "@/components/article-nav-context";
import { TocSheet } from "@/components/toc-sheet";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("TocSheet navigation", () => {
  it("closes before scrolling to the selected heading and updates the hash", async () => {
    const heading = document.createElement("h2");
    heading.id = "details";
    const events: string[] = [];
    heading.scrollIntoView = () => events.push("scroll");
    document.body.appendChild(heading);

    render(
      <ArticleNavProvider>
        <PublishArticleNav
          headings={[
            { depth: 2, id: "intro", text: "Intro" },
            { depth: 2, id: "details", text: "Details" },
          ]}
          slug="test"
        />
        <TocSheet />
      </ArticleNavProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "On this page" }));
    fireEvent.click(await screen.findByRole("link", { name: "Details" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(events).toEqual(["scroll"]));
    expect(window.location.hash).toBe("#details");
  });
});
