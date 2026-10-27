import { afterEach, describe, expect, it } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

import type { ArticleHeading } from "@/app/(blog)/articles/service";
import { ReadingProgress } from "@/components/howardism/reading-progress";

const ARTICLE_HEIGHT = 3000;
const VIEWPORT_HEIGHT = 1000;

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  window.scrollTo(0, 0);
});

/** Stands in for the article body; happy-dom reports 0 for every box metric. */
function articleInDom(headingIds: string[]): void {
  const article = document.createElement("article");
  Object.defineProperty(article, "offsetHeight", { value: ARTICLE_HEIGHT });
  // The article starts at document top, so its rect rises as the page scrolls.
  article.getBoundingClientRect = () => ({ top: -window.scrollY }) as DOMRect;
  for (const id of headingIds) {
    const heading = document.createElement("h2");
    heading.id = id;
    heading.getBoundingClientRect = () => ({ top: -window.scrollY }) as DOMRect;
    article.appendChild(heading);
  }
  document.body.appendChild(article);
}

async function settleMeasure(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve())
    );
  });
}

function scrollTo(y: number): void {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  act(() => {
    fireEvent.scroll(window);
  });
}

function barProgress(container: HTMLElement): string {
  const bar = container.querySelector<HTMLElement>(".origin-left");
  return bar?.style.transform ?? "";
}

describe("ReadingProgress", () => {
  it("tracks scroll when the article has no H2 headings", async () => {
    // Regression: an early return for the empty-headings case skipped listener
    // registration entirely, freezing the bar at 0% on every such article.
    window.innerHeight = VIEWPORT_HEIGHT;
    articleInDom([]);

    const { container } = render(<ReadingProgress headings={[]} />);
    await settleMeasure();
    expect(barProgress(container)).toBe("scaleX(0)");

    scrollTo(1000);

    expect(barProgress(container)).toBe("scaleX(0.5)");
  });

  it("renders a tick per H2 heading at its real offset", async () => {
    window.innerHeight = VIEWPORT_HEIGHT;
    articleInDom(["one", "two"]);
    const headings: ArticleHeading[] = [
      { depth: 2, id: "one", text: "One" },
      { depth: 3, id: "skipped", text: "Skipped" },
      { depth: 2, id: "two", text: "Two" },
    ];

    const { container } = render(<ReadingProgress headings={headings} />);
    await settleMeasure();

    // h3s are not ticked; the bar itself is the other child div.
    expect(container.querySelectorAll(".absolute.top-0")).toHaveLength(2);
  });
});
