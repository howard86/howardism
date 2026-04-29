import { afterEach, describe, expect, it } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";

import { PhotoGrid } from "@/app/(blog)/photos/PhotoGrid";
import { photoData } from "@/components/howardism/photoData";

afterEach(() => {
  cleanup();
});

describe("photoData", () => {
  it("has at least 9 photos", () => {
    expect(photoData.length).toBeGreaterThanOrEqual(9);
  });

  it("has at least 3 distinct aspect ratios", () => {
    const aspects = new Set(photoData.map((p) => p.aspect));
    expect(aspects.size).toBeGreaterThanOrEqual(3);
  });

  it("has at least 3 distinct tone values", () => {
    const tones = new Set(photoData.map((p) => p.tone));
    expect(tones.size).toBeGreaterThanOrEqual(3);
  });

  it("every photo has required fields", () => {
    for (const photo of photoData) {
      expect(typeof photo.id).toBe("string");
      expect(photo.id.length).toBeGreaterThan(0);
      expect(typeof photo.label).toBe("string");
      expect(typeof photo.caption).toBe("string");
      expect(typeof photo.aspect).toBe("string");
      expect(typeof photo.meta).toBe("string");
      expect(typeof photo.tone).toBe("number");
    }
  });

  it("tag values from allowlist for aspect", () => {
    const allowed = ["4/3", "3/4", "1/1"];
    for (const photo of photoData) {
      expect(allowed).toContain(photo.aspect);
    }
  });
});

describe("PhotoGrid", () => {
  it("renders all photos", () => {
    render(<PhotoGrid photos={photoData} />);
    const captions = screen.getAllByText(
      (_, el) => el?.tagName === "FIGCAPTION"
    );
    expect(captions.length).toBe(photoData.length);
  });

  it("renders End of roll marker", () => {
    render(<PhotoGrid photos={photoData} />);
    expect(screen.getByText("End of roll")).toBeDefined();
  });

  it("renders № overlays with padded numbers", () => {
    render(<PhotoGrid photos={photoData.slice(0, 3)} />);
    expect(screen.getByText("№001")).toBeDefined();
    expect(screen.getByText("№002")).toBeDefined();
    expect(screen.getByText("№003")).toBeDefined();
  });

  it("renders lens meta for each photo", () => {
    render(<PhotoGrid photos={photoData.slice(0, 1)} />);
    expect(screen.getByText(photoData[0].meta)).toBeDefined();
    expect(screen.getByText(photoData[0].caption)).toBeDefined();
  });
});
