import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen, within } from "@testing-library/react";

import { IndexRow } from "@/app/(blog)/articles/index-row";
import type { ArticleEntity, ArticleMeta } from "@/app/(blog)/articles/service";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const META: ArticleMeta = {
  date: "2026-05-06",
  description: "A description",
  domain: "agent-systems",
  imageAlt: "alt",
  readingTime: 7,
  tag: "Concept",
  tags: ["agents", "loops", "orchestration", "extra"],
  title: "Alpha Article",
};

const ARTICLE: ArticleEntity = {
  heroImage: { src: "/x.png", height: 100, width: 100 },
  meta: META,
  position: 0,
  slug: "alpha",
};

const TITLE = /Alpha Article/i;
const SAVE = /save for later/i;

function renderRow(props: Partial<Parameters<typeof IndexRow>[0]> = {}) {
  return render(
    <ul>
      <IndexRow
        accent="var(--brand)"
        article={ARTICLE}
        ordinal={3}
        {...props}
      />
    </ul>
  );
}

describe("IndexRow", () => {
  it("renders the kind-prefixed numeral marker and a link to the article", () => {
    renderRow({ prefix: "C" });
    expect(screen.getByText("C03")).toBeDefined();
    const link = screen.getByRole("link", { name: TITLE });
    expect(link.getAttribute("href")).toBe("/articles/alpha");
  });

  it("renders a bare numeral when no prefix is given", () => {
    renderRow();
    expect(screen.getByText("03")).toBeDefined();
  });

  it("shows the date and reading time", () => {
    const { container } = renderRow();
    expect(container.textContent).toContain("7′");
  });

  it("shows subject chips up to the limit with an overflow marker", () => {
    renderRow();
    expect(screen.getByText("Agents")).toBeDefined();
    expect(screen.getByText("Orchestration")).toBeDefined();
    expect(screen.queryByText("Extra")).toBeNull();
    expect(screen.getByText("+1")).toBeDefined();
  });

  it("hides chips when showChips is false", () => {
    renderRow({ showChips: false });
    expect(screen.queryByText("Agents")).toBeNull();
  });

  it("shows the domain label by default and hides it when showDomain is false", () => {
    const { rerender } = renderRow();
    expect(screen.getByText("Agent Systems")).toBeDefined();

    rerender(
      <ul>
        <IndexRow
          accent="var(--brand)"
          article={ARTICLE}
          ordinal={3}
          showDomain={false}
        />
      </ul>
    );
    expect(screen.queryByText("Agent Systems")).toBeNull();
  });

  it("renders the save button by default and omits it when showSave is false", () => {
    const { container, rerender } = renderRow();
    expect(within(container).getByRole("button", { name: SAVE })).toBeDefined();

    rerender(
      <ul>
        <IndexRow
          accent="var(--brand)"
          article={ARTICLE}
          ordinal={3}
          showSave={false}
        />
      </ul>
    );
    expect(within(container).queryByRole("button", { name: SAVE })).toBeNull();
  });
});
