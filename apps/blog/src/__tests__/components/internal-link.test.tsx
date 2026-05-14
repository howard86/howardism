import { afterEach, describe, expect, it, mock } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ArticleMeta } from "@/app/(blog)/articles/service";
import {
  InternalLink,
  InternalLinkPreviewBody,
} from "@/components/internal-link";

afterEach(() => {
  cleanup();
});

const PREVIEW_META: ArticleMeta = {
  date: "2026-05-06",
  description:
    "Anthropic's agentic coding product; created by Boris Cherny late 2024; TypeScript/React; CLI/desktop/web/mobile/IDE surfaces; central tool across all 2026 sources.",
  image: { src: {} as never, alt: "alt" },
  readingTime: 4,
  tag: "Entity",
  title: "Claude Code",
};

describe("InternalLink — fallback paths", () => {
  it("renders a plain anchor (no popover) for external hrefs", () => {
    const { container } = render(
      <InternalLink href="https://example.com">External</InternalLink>
    );

    const anchors = container.querySelectorAll("a");
    expect(anchors).toHaveLength(1);
    expect(anchors[0].getAttribute("href")).toBe("https://example.com");
    expect(anchors[0].hasAttribute("aria-describedby")).toBe(false);
  });

  it("renders a plain anchor for /articles/* hrefs when previewMeta is omitted", () => {
    const { container } = render(
      <InternalLink href="/articles/claude-code">Claude Code</InternalLink>
    );

    const anchors = container.querySelectorAll("a");
    expect(anchors).toHaveLength(1);
    expect(anchors[0].getAttribute("href")).toBe("/articles/claude-code");
    expect(anchors[0].hasAttribute("aria-describedby")).toBe(false);
  });

  it("renders a plain anchor when the href matches the current page", async () => {
    mock.module("next/navigation", () => ({
      usePathname: () => "/articles/claude-code",
    }));

    // Re-import after the mock takes effect so the component picks it up.
    const { InternalLink: ScopedInternalLink } = await import(
      "@/components/internal-link"
    );

    const { container } = render(
      <ScopedInternalLink
        href="/articles/claude-code"
        previewMeta={PREVIEW_META}
      >
        Self link
      </ScopedInternalLink>
    );

    const anchors = container.querySelectorAll("a");
    expect(anchors).toHaveLength(1);
    expect(anchors[0].hasAttribute("aria-describedby")).toBe(false);

    // Restore the default mock for subsequent tests.
    mock.module("next/navigation", () => ({
      usePathname: () => "/",
    }));
  });
});

describe("InternalLink — popover path", () => {
  it("wires the trigger with aria-describedby pointing at the preview content", () => {
    render(
      <InternalLink href="/articles/claude-code" previewMeta={PREVIEW_META}>
        Claude Code
      </InternalLink>
    );

    const trigger = screen.getByRole("link", { name: "Claude Code" });
    const describedBy = trigger.getAttribute("aria-describedby");
    expect(describedBy).toBe("internal-link-preview-claude-code");
  });

  it("opens the popover on focus and exposes the preview content", async () => {
    render(
      <InternalLink href="/articles/claude-code" previewMeta={PREVIEW_META}>
        Claude Code
      </InternalLink>
    );

    const trigger = screen.getByRole("link", { name: "Claude Code" });
    fireEvent.focus(trigger);

    const dialog = await screen.findByRole("dialog");
    expect(dialog.id).toBe("internal-link-preview-claude-code");
    expect(dialog.textContent).toContain("Claude Code");
    expect(dialog.textContent).toContain("Entity");
    expect(dialog.textContent).toContain("Read →");
  });
});

describe("InternalLinkPreviewBody", () => {
  it("renders tag, title, description and the Read affordance", () => {
    const { container } = render(
      <InternalLinkPreviewBody meta={PREVIEW_META} />
    );

    expect(container.textContent).toContain("Entity");
    expect(container.textContent).toContain("Claude Code");
    expect(container.textContent).toContain("Anthropic's agentic coding");
    expect(container.textContent).toContain("Read →");
  });

  it("truncates descriptions longer than ~140 chars with a trailing ellipsis", () => {
    const longDescription = `${"a".repeat(200)}.`;
    const { container } = render(
      <InternalLinkPreviewBody
        meta={{ ...PREVIEW_META, description: longDescription }}
      />
    );

    const paragraph = container.querySelector("p");
    expect(paragraph).not.toBeNull();
    expect(paragraph?.textContent?.endsWith("…")).toBe(true);
    // The original 200-char description must not have rendered in full.
    expect(paragraph?.textContent?.length).toBeLessThan(longDescription.length);
  });
});
