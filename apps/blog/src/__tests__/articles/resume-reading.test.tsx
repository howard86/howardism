import { afterEach, describe, expect, it } from "bun:test";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";

import { ResumeReading } from "@/app/(blog)/articles/[slug]/resume-reading";
import type { ArticleHeading } from "@/app/(blog)/articles/service";
import { resetReadingStoreCache } from "@/lib/reading-store";

afterEach(() => {
  // cleanup() unmounts, which is also what releases the shared article-scroll
  // subscription this file exercises — bun test keeps one module registry for
  // the whole run, so leaving it attached would leak into other files.
  cleanup();
  localStorage.clear();
  // Persisting through ResumeReading writes the reading store's module-level
  // cache too; clearing localStorage alone leaks those slugs into other files.
  resetReadingStoreCache();
  document.body.innerHTML = "";
  Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
});

const RESUME_WITH_PCT = /Resume · 58%/;

const headings: ArticleHeading[] = [
  { depth: 2, id: "intro", text: "Intro" },
  { depth: 2, id: "middle", text: "Middle" },
  { depth: 2, id: "end", text: "End" },
];

function anchorInDom(id: string): void {
  const el = document.createElement("div");
  el.id = id;
  document.body.appendChild(el);
}

describe("ResumeReading offer chip", () => {
  it("offers resume with the saved percentage when reopening partway through", () => {
    anchorInDom("middle");
    localStorage.setItem(
      "howardism:reading:my-slug",
      JSON.stringify({ headingId: "middle", pct: 0.58 })
    );

    render(<ResumeReading headings={headings} slug="my-slug" />);

    expect(screen.getByText(RESUME_WITH_PCT)).not.toBeNull();
  });

  it("stays quiet when there is no saved progress", () => {
    const { container } = render(
      <ResumeReading headings={headings} slug="unread" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("stays quiet when saved progress is below the resume threshold", () => {
    anchorInDom("intro");
    localStorage.setItem(
      "howardism:reading:barely",
      JSON.stringify({ headingId: "intro", pct: 0.1 })
    );

    const { container } = render(
      <ResumeReading headings={headings} slug="barely" />
    );
    expect(container.firstChild).toBeNull();
  });
});

const ARTICLE_HEIGHT = 3000;
const VIEWPORT_HEIGHT = 500;
const DOCUMENT_HEIGHT = 3000;
const HEADING_TOPS: Record<string, number> = {
  intro: 400,
  middle: 1000,
  end: 2000,
};

function articleInDom(): void {
  const article = document.createElement("article");
  Object.defineProperty(article, "offsetHeight", { value: ARTICLE_HEIGHT });
  article.getBoundingClientRect = () => ({ top: -window.scrollY }) as DOMRect;
  for (const [id, top] of Object.entries(HEADING_TOPS)) {
    const el = document.createElement("h2");
    el.id = id;
    el.getBoundingClientRect = () => ({ top: top - window.scrollY }) as DOMRect;
    article.appendChild(el);
  }
  document.body.appendChild(article);
}

function scrollTo(y: number): void {
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  act(() => {
    fireEvent.scroll(window);
  });
}

describe("ResumeReading anchor persistence", () => {
  it("saves the last heading scrolled past", () => {
    window.innerHeight = VIEWPORT_HEIGHT;
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: DOCUMENT_HEIGHT,
    });
    articleInDom();

    render(<ResumeReading headings={headings} slug="persist-slug" />);

    // Past "middle" (1000 - 120 active offset) but not yet "end" (2000 - 120).
    scrollTo(1200);

    const raw = localStorage.getItem("howardism:reading:persist-slug");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string).headingId).toBe("middle");
  });

  it("falls back to the first heading before any has been passed", () => {
    window.innerHeight = VIEWPORT_HEIGHT;
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: DOCUMENT_HEIGHT,
    });
    articleInDom();

    render(<ResumeReading headings={headings} slug="early-slug" />);

    scrollTo(100);

    const raw = localStorage.getItem("howardism:reading:early-slug");
    expect(JSON.parse(raw as string).headingId).toBe("intro");
  });
});
