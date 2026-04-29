import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import { AboutSidebar } from "@/app/(blog)/about/AboutSidebar";
import { resume } from "@/app/(blog)/Resume";

const NOW_READING_RE = /now reading/i;
const WHERE_BEEN_RE = /where i've been/i;
const COLOPHON_RE = /colophon/i;

afterEach(() => {
  cleanup();
});

describe("AboutSidebar", () => {
  it("renders without SunDisc or HalfDisc", () => {
    const { container } = render(<AboutSidebar />);
    expect(container.querySelector("[data-testid='sun-disc']")).toBeNull();
    expect(container.querySelector("[data-testid='half-disc']")).toBeNull();
  });

  it("renders Now reading section", () => {
    render(<AboutSidebar />);
    expect(screen.getByText(NOW_READING_RE)).toBeDefined();
    expect(screen.getByText("The Glass Bead Game")).toBeDefined();
  });

  it("renders Where I've been using resume data", () => {
    render(<AboutSidebar />);
    expect(screen.getByText(WHERE_BEEN_RE)).toBeDefined();
    for (const role of resume) {
      expect(screen.getByText(role.company)).toBeDefined();
    }
  });

  it("renders Colophon section", () => {
    render(<AboutSidebar />);
    expect(screen.getByText(COLOPHON_RE)).toBeDefined();
    expect(screen.getByText("JetBrains Mono")).toBeDefined();
  });

  it("sidebar uses no card chrome", () => {
    const { container } = render(<AboutSidebar />);
    expect(container.querySelector(".hw-card")).toBeNull();
    expect(container.querySelector("aside")).toBeDefined();
  });
});
