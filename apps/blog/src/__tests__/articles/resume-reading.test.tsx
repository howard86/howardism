import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import { ResumeReading } from "@/app/(blog)/articles/[slug]/resume-reading";
import type { ArticleHeading } from "@/app/(blog)/articles/service";

afterEach(() => {
  cleanup();
  localStorage.clear();
  document.body.innerHTML = "";
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
